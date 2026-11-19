import { describe, expect, it } from 'bun:test';
import { WelcomeScreen } from '../src/cli/terminal/views/welcome-view';
import { ThemeManager, THEMES } from '../src/cli/terminal/theme-manager';
import { TerminalAdapter } from '../src/cli/terminal/terminal-adapter';
import { Theme, stripAnsi } from '../src/cli/terminal/theme';
import { Story } from '../src/shared/types';
import fs from 'fs';
import path from 'path';

describe('WATTPAD CLI — Rediseño Premium y Distribución Oficial', () => {
  // 1. WelcomeScreen - Minimalist and Elegant Layout
  describe('WelcomeScreen — Nueva Pantalla de Bienvenida Minimalista', () => {
    const mockStories: Story[] = [
      {
        id: 'NOV-0001',
        title: 'El secreto de las sombras',
        userId: 'usr_01',
        wattpadId: null,
        description: 'Misterio en la ciudad',
        coverUrl: null,
        genre: 'Misterio',
        category: 'Novela',
        tags: ['misterio'],
        language: 'es',
        mature: false,
        editorPreference: 'word',
        status: 'synced',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'NOV-0002',
        title: 'El último invierno',
        userId: 'usr_01',
        wattpadId: null,
        description: 'Drama en la nieve',
        coverUrl: null,
        genre: 'Drama',
        category: 'Novela',
        tags: ['drama'],
        language: 'es',
        mature: false,
        editorPreference: 'notepad',
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    it('should render minimalist brand header with Wattpad CLI identity', () => {
      const lines = WelcomeScreen.render(
        {
          version: '1.1.0',
          serverOnline: true,
          stories: mockStories,
        },
        80
      );
      const text = lines.join('\n');
      expect(text).toContain('Wattpad CLI');
      expect(text).not.toContain('AI WRITING STUDIO');
      expect(text).toContain('v1.1.0');
      expect(text).toContain('cloud postgres');
    });

    it('should render inspiring greeting and quick action chips without bulky boxes', () => {
      const lines = WelcomeScreen.render(
        {
          version: '1.1.0',
          serverOnline: true,
          stories: mockStories,
        },
        80
      );
      const text = lines.join('\n');
      expect(text).toContain('Gestor integral de novelas');
      expect(text).toContain('ACCIONES RECOMENDADAS');
      expect(text).toContain('Ver novelas');
      expect(text).toContain('Crear novela');
      expect(text).toContain('Documentos');
    });

    it('should render recent stories with fine selection marker and real titles', () => {
      const lines = WelcomeScreen.render(
        {
          version: '1.1.0',
          serverOnline: true,
          stories: mockStories,
          selectedIndex: 0,
        },
        80
      );
      const text = lines.join('\n');
      expect(text).toContain('NOVELAS RECIENTES');
      expect(text).toContain('El secreto de las sombras');
      expect(text).toContain('El último invierno');
      expect(text).toContain('›');
    });
  });

  // 2. ThemeManager — Themes (Dark, Light, Tokyo Night, Terminal)
  describe('ThemeManager — Soporte Multitema', () => {
    it('should provide 4 official themes', () => {
      const available = ThemeManager.getAvailableThemes();
      expect(available).toContain('dark');
      expect(available).toContain('light');
      expect(available).toContain('tokyo-night');
      expect(available).toContain('terminal');
    });

    it('should switch theme correctly and update Theme.colors palette', () => {
      ThemeManager.setTheme('tokyo-night');
      expect(ThemeManager.getThemeName()).toBe('tokyo-night');
      expect(Theme.colors.background).toBe(THEMES['tokyo-night'].background);

      ThemeManager.setTheme('light');
      expect(ThemeManager.getThemeName()).toBe('light');
      expect(Theme.colors.background).toBe('#FFFFFF');

      // Reset to dark
      ThemeManager.setTheme('dark');
      expect(ThemeManager.getThemeName()).toBe('dark');
      expect(Theme.colors.background).toBe('#0D1117');
    });
  });

  // 3. TerminalAdapter — Modes (Fullscreen vs Inline)
  describe('TerminalAdapter — Modos de Renderizado', () => {
    it('should default to fullscreen and switch between modes', () => {
      expect(TerminalAdapter.getMode()).toBe('fullscreen');
      TerminalAdapter.setMode('inline');
      expect(TerminalAdapter.getMode()).toBe('inline');
      TerminalAdapter.setMode('fullscreen');
      expect(TerminalAdapter.getMode()).toBe('fullscreen');
    });
  });

  // 4. Distribution Artifacts & npm Launcher
  describe('Distribución Oficial y Runner npm (bin/wattpad.cjs)', () => {
    it('should verify bin/wattpad.cjs exists and is valid Node.js script', () => {
      const launcherPath = path.resolve(process.cwd(), 'bin', 'wattpad.cjs');
      expect(fs.existsSync(launcherPath)).toBe(true);

      const content = fs.readFileSync(launcherPath, 'utf8');
      expect(content).toContain('#!/usr/bin/env node');
      expect(content).toContain('OFFICIAL_CHECKSUMS');
      expect(content).toContain('getPlatformKey');
      expect(content).toContain('spawnSync');
    });

    it('should verify package.json exposes bin/wattpad.cjs for npm global install', () => {
      const pkgPath = path.resolve(process.cwd(), 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

      expect(pkg.name).toBe('@wattpad/cli');
      expect(pkg.version).toBe('1.1.0');
      expect(pkg.bin.wattpad).toBe('bin/wattpad.cjs');
      expect(pkg.files).toContain('bin');
    });

    it('should verify install.sh includes SHA-256 integrity validation', () => {
      const shPath = path.resolve(process.cwd(), 'installers', 'install.sh');
      const shContent = fs.readFileSync(shPath, 'utf8');
      expect(shContent).toContain('EXPECTED_HASH');
      expect(shContent).toContain('sha256sum');
      expect(shContent).toContain('TARGET_PLATFORM');
    });
  });
});
