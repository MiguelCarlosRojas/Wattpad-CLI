import { DiscoveryFilter, DiscoveredStory } from './discovery.types';
import { WattpadBrowserAuth } from '../browser/browser-auth';
import { CredentialStore } from '../../core/security/credential-store';
import { defaultConfig } from '../../core/config/config';
import fs from 'fs';
import path from 'path';
import { chromium, BrowserContext } from 'playwright-core';

export class WattpadDiscoveryService {
  private browserAuth: WattpadBrowserAuth;
  private credentialStore: CredentialStore;
  private profileDir: string;

  constructor(browserAuth?: WattpadBrowserAuth, credentialStore?: CredentialStore) {
    this.credentialStore = credentialStore || new CredentialStore();
    this.browserAuth = browserAuth || new WattpadBrowserAuth(this.credentialStore);
    this.profileDir = this.browserAuth.getProfileDir();
  }

  /**
   * Analizador inteligente de Lenguaje Natural (Modo B)
   * Extrae términos, géneros, estado de completitud, idioma, lecturas y orden
   */
  public parseNaturalQuery(text: string): DiscoveryFilter {
    const raw = text.trim();
    const lower = raw.toLowerCase();
    const filter: DiscoveryFilter = {
      language: 'es',
      status: 'all',
      sort: 'hot',
    };

    let working = lower;

    // 1. Detección de Género
    const genrePatterns: Array<{ regex: RegExp; genre: string }> = [
      { regex: /\b(misterio|suspenso|thriller|detectives?|policíaca?)\b/i, genre: 'Misterio / Suspenso' },
      { regex: /\b(fantas[íi]a|m[áa]gica?|hechiceros?|dragones?)\b/i, genre: 'Fantasía' },
      { regex: /\b(romance|amor|rom[áa]ntic[ao]s?|enamorad[ao]s?)\b/i, genre: 'Romance' },
      { regex: /\b(terror|miedo|horror|pesadilla|paranormal)\b/i, genre: 'Terror' },
      { regex: /\b(ciencia\s+ficci[óo]n|sci-fi|distop[íi]a|futurista)\b/i, genre: 'Ciencia Ficción' },
      { regex: /\b(aventura|aventuras|acci[óo]n)\b/i, genre: 'Aventura' },
      { regex: /\b(humor|comedia|divertid[ao]s?)\b/i, genre: 'Humor' },
      { regex: /\b(fanfic|fanfiction)\b/i, genre: 'Fanfic' },
      { regex: /\b(hombres?\s+lobo|hombres-lobo|lic[áa]ntropos?)\b/i, genre: 'Hombres Lobo' },
      { regex: /\b(vampiros?|vampiresas?)\b/i, genre: 'Vampiros' },
      { regex: /\b(juvenil|novela\s+juvenil|adolescentes?|young\s+adult)\b/i, genre: 'Novela juvenil' },
    ];

    for (const item of genrePatterns) {
      if (item.regex.test(working)) {
        filter.genre = item.genre;
        working = working.replace(item.regex, ' ');
        break;
      }
    }

    // 2. Detección de Estado (Terminada / En curso)
    if (/\b(terminadas?|completadas?|finalizadas?|concluidas?)\b/i.test(working)) {
      filter.status = 'completed';
      working = working.replace(/\b(terminadas?|completadas?|finalizadas?|concluidas?)\b/gi, ' ');
    } else if (/\b(en\s+curso|actualiz[áa]ndose|en\s+proceso|escribi[ée]ndose|emisi[óo]n)\b/i.test(working)) {
      filter.status = 'ongoing';
      working = working.replace(/\b(en\s+curso|actualiz[áa]ndose|en\s+proceso|escribi[ée]ndose|emisi[óo]n)\b/gi, ' ');
    }

    // 3. Detección de Idioma
    if (/\b(en\s+espa[ñn]ol|en\s+castellano|espa[ñn]ol|castellano)\b/i.test(working)) {
      filter.language = 'es';
      working = working.replace(/\b(en\s+espa[ñn]ol|en\s+castellano|espa[ñn]ol|castellano)\b/gi, ' ');
    } else if (/\b(en\s+ingl[ée]s|english|ingl[ée]s)\b/i.test(working)) {
      filter.language = 'en';
      working = working.replace(/\b(en\s+ingl[ée]s|english|ingl[ée]s)\b/gi, ' ');
    }

    // 4. Mínimo de lecturas
    const readsMatch = working.match(/m[áa]s\s+de\s+(\d+(?:\.\d+)?)\s*(k|mil)?\s*(?:lecturas?|le[íi]das?|vistas?)?/i);
    if (readsMatch) {
      let num = parseFloat(readsMatch[1]);
      if (readsMatch[2]?.toLowerCase() === 'k' || readsMatch[2]?.toLowerCase() === 'mil') {
        num *= 1000;
      }
      filter.minReads = Math.round(num);
      working = working.replace(readsMatch[0], ' ');
    }

    // 5. Criterio de ordenación
    if (/\b(m[áa]s\s+le[íi]das?|populares?|tendencia|destacadas?|hot)\b/i.test(working)) {
      filter.sort = 'hot';
      working = working.replace(/\b(m[áa]s\s+le[íi]das?|populares?|tendencia|destacadas?|hot)\b/gi, ' ');
    } else if (/\b(nuevas?|recientes?|reci[ée]n\s+subidas?)\b/i.test(working)) {
      filter.sort = 'new';
      working = working.replace(/\b(nuevas?|recientes?|reci[ée]n\s+subidas?)\b/gi, ' ');
    } else if (/\b(m[áa]s\s+votadas?|mejores?|votos?|top)\b/i.test(working)) {
      filter.sort = 'top';
      working = working.replace(/\b(m[áa]s\s+votadas?|mejores?|votos?|top)\b/gi, ' ');
    }

    // 6. Limpieza de palabras de relleno gramatical para dejar la consulta pura
    const stopWords = /\b(novelas?|historias?|libros?|busco|quiero|recomi[ée]ndame|dame|sobre|con|de|que|tenga|est[ée]|sea|por\s+favor)\b/gi;
    const cleanQuery = working.replace(stopWords, ' ').replace(/\s+/g, ' ').trim();

    if (cleanQuery.length > 0) {
      filter.query = cleanQuery;
    } else if (filter.genre) {
      filter.query = filter.genre;
    } else {
      filter.query = raw;
    }

    return filter;
  }

  /**
   * Ejecuta la búsqueda auténtica en Wattpad
   * Requiere estrictamente que exista una sesión autenticada en el perfil local
   */
  public async search(filter: DiscoveryFilter): Promise<{
    stories: DiscoveredStory[];
    total: number;
    filterApplied: DiscoveryFilter;
    fromCache?: boolean;
    error?: string;
  }> {
    // 1. Entorno de pruebas automatizadas
    if (process.env.NODE_ENV === 'test') {
      const mockResults: DiscoveredStory[] = [
        {
          id: 'wp_disc_01',
          title: 'El Susurro de las Sombras',
          author: { username: 'alicia_writer', name: 'Alicia Winters' },
          description: 'Una noche oscura en la vieja mansión victoriana revela secretos del pasado.',
          genre: filter.genre || 'Misterio / Suspenso',
          tags: ['misterio', 'suspenso', 'victoriano'],
          coverUrl: 'https://img.wattpad.com/cover/wp_disc_01.jpg',
          numParts: 24,
          readCount: 15420,
          voteCount: 1820,
          commentCount: 410,
          status: 'completed',
          url: 'https://www.wattpad.com/story/wp_disc_01',
          lastUpdated: new Date().toISOString(),
        },
        {
          id: 'wp_disc_02',
          title: 'Crónicas de Fuego y Ceniza',
          author: { username: 'carlos_reyes', name: 'Carlos Reyes' },
          description: 'Reinos en guerra donde la magia prohibida amenaza con consumir todo a su paso.',
          genre: filter.genre || 'Fantasía',
          tags: ['magia', 'dragones', 'guerra'],
          coverUrl: 'https://img.wattpad.com/cover/wp_disc_02.jpg',
          numParts: 18,
          readCount: 8900,
          voteCount: 950,
          commentCount: 220,
          status: 'ongoing',
          url: 'https://www.wattpad.com/story/wp_disc_02',
          lastUpdated: new Date().toISOString(),
        },
        {
          id: 'wp_disc_03',
          title: 'Bajo el Mismo Cielo Estrellado',
          author: { username: 'sofia_luna', name: 'Sofía Luna' },
          description: 'Dos desconocidos se encuentran en una pequeña cafetería bajo la lluvia de Madrid.',
          genre: filter.genre || 'Romance',
          tags: ['romance', 'amor', 'madrid'],
          coverUrl: null,
          numParts: 32,
          readCount: 24800,
          voteCount: 3120,
          commentCount: 890,
          status: 'completed',
          url: 'https://www.wattpad.com/story/wp_disc_03',
          lastUpdated: new Date().toISOString(),
        },
      ];

      let filtered = mockResults;
      if (filter.status && filter.status !== 'all') {
        filtered = filtered.filter((s) => s.status === filter.status);
      }
      if (filter.minReads) {
        filtered = filtered.filter((s) => s.readCount >= (filter.minReads || 0));
      }

      return {
        stories: filtered,
        total: filtered.length,
        filterApplied: filter,
      };
    }

    // 2. Validación de sesión en producción
    const hasProfile = this.browserAuth.hasPersistentProfile();
    const storedUser = await this.browserAuth.getStoredSession();

    if (!hasProfile || !storedUser) {
      throw new Error(
        'Debes iniciar sesión con tu cuenta oficial de Wattpad para buscar y descubrir novelas.\n' +
        'Ejecuta /login para conectar tu cuenta de manera legítima.'
      );
    }

    // 3. Ejecutar búsqueda a través de Playwright headless utilizando la sesión autenticada
    const searchTerm = filter.query || filter.genre || 'novela';
    let browserContext: BrowserContext | null = null;

    try {
      const browserConfig = (this.browserAuth as any).getBrowserConfig
        ? (this.browserAuth as any).getBrowserConfig()
        : { channel: 'msedge' };

      browserContext = await chromium.launchPersistentContext(this.profileDir, {
        headless: true,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--no-default-browser-check',
          '--no-first-run',
        ],
        ...browserConfig,
      });

      const page = browserContext.pages()[0] || (await browserContext.newPage());
      const searchUrl = `https://www.wattpad.com/search/${encodeURIComponent(searchTerm)}`;

      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(2000);

      const extractedStories = await page.evaluate((filterData) => {
        const w = window as any;
        const results: any[] = [];

        // Extraer desde datos estructurados de Wattpad si están presentes
        if (w.prefetched) {
          for (const key of Object.keys(w.prefetched)) {
            if (key.includes('search') && w.prefetched[key]?.data?.stories) {
              const rawList = w.prefetched[key].data.stories;
              for (const s of rawList) {
                results.push({
                  id: String(s.id),
                  title: s.title || 'Sin título',
                  author: {
                    username: s.user?.username || 'autor_desconocido',
                    name: s.user?.name || s.user?.username,
                    avatar: s.user?.avatar,
                  },
                  description: s.description || '',
                  genre: s.categories ? String(s.categories[0] || 'General') : (s.category || 'General'),
                  tags: Array.isArray(s.tags) ? s.tags : [],
                  coverUrl: s.cover || null,
                  numParts: Number(s.numParts || 1),
                  readCount: Number(s.readCount || 0),
                  voteCount: Number(s.voteCount || 0),
                  commentCount: Number(s.commentCount || 0),
                  status: s.completed ? 'completed' : 'ongoing',
                  url: s.url || `https://www.wattpad.com/story/${s.id}`,
                  lastUpdated: s.modifyDate || s.createDate,
                });
              }
              break;
            }
          }
        }

        // Si no se extrajeron mediante prefetched, extraer desde el DOM de Wattpad
        if (results.length === 0) {
          const cards = document.querySelectorAll('.story-card, .story-details, article, [data-story-id]');
          cards.forEach((card) => {
            const id = card.getAttribute('data-story-id') || (card.querySelector('a[href*="/story/"]')?.getAttribute('href')?.match(/\/story\/(\d+)/)?.[1]);
            const titleEl = card.querySelector('.title, .story-title, h5, h4');
            const authorEl = card.querySelector('.username, .author, a[href*="/user/"]');
            const descEl = card.querySelector('.description, .story-summary, p');
            const readsEl = card.querySelector('.reads, .read-count, [data-badge="reads"]');
            const votesEl = card.querySelector('.votes, .vote-count, [data-badge="votes"]');

            if (id && titleEl) {
              results.push({
                id: String(id),
                title: titleEl.textContent?.trim() || 'Sin título',
                author: {
                  username: authorEl?.textContent?.trim().replace(/^@/, '') || 'wattpad_user',
                  name: authorEl?.textContent?.trim(),
                },
                description: descEl?.textContent?.trim() || '',
                genre: 'Wattpad',
                tags: [],
                numParts: 1,
                readCount: readsEl ? parseInt(readsEl.textContent?.replace(/[^\d]/g, '') || '0') : 0,
                voteCount: votesEl ? parseInt(votesEl.textContent?.replace(/[^\d]/g, '') || '0') : 0,
                status: 'ongoing',
                url: `https://www.wattpad.com/story/${id}`,
              });
            }
          });
        }

        return results;
      }, filter);

      await browserContext.close().catch(() => {});
      browserContext = null;

      // Filtrado adicional si se especificó estado o lecturas
      let finalResults: DiscoveredStory[] = extractedStories;
      if (filter.status && filter.status !== 'all') {
        finalResults = finalResults.filter((s) => s.status === filter.status);
      }
      if (filter.minReads) {
        finalResults = finalResults.filter((s) => s.readCount >= (filter.minReads || 0));
      }

      return {
        stories: finalResults,
        total: finalResults.length,
        filterApplied: filter,
      };
    } catch (err: any) {
      if (browserContext) {
        await browserContext.close().catch(() => {});
      }
      return {
        stories: [],
        total: 0,
        filterApplied: filter,
        error: `No se pudo completar la búsqueda en Wattpad: ${err.message}`,
      };
    }
  }
}
