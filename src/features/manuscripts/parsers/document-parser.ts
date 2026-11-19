import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import { sha256 } from '../../../core/security/crypto-utils';

export interface ParsedChapter {
  chapterNumber: number;
  title: string;
  content: string;
  wordCount: number;
  hash: string;
  preview: string;
}

export interface DocumentParseResult {
  sourcePath: string;
  filename: string;
  format: 'docx' | 'txt' | 'gdoc';
  totalWords: number;
  chapters: ParsedChapter[];
}

export class DocumentParser {
  /**
   * Analiza un archivo DOCX o TXT y detecta sus capítulos y contenido
   */
  public static async parseFile(filePath: string): Promise<DocumentParseResult> {
    const ext = path.extname(filePath).toLowerCase();
    const filename = path.basename(filePath);

    if (!fs.existsSync(filePath)) {
      throw new Error(`El archivo no existe en la ruta: ${filePath}`);
    }

    let rawText = '';
    let format: 'docx' | 'txt' | 'gdoc' = 'txt';

    if (ext === '.docx') {
      format = 'docx';
      const extracted = await mammoth.extractRawText({ path: filePath });
      rawText = extracted.value;
    } else if (ext === '.txt') {
      format = 'txt';
      rawText = fs.readFileSync(filePath, { encoding: 'utf8' });
    } else {
      throw new Error(`Formato no soportado: ${ext}. Utiliza archivos .docx o .txt`);
    }

    return this.parseRawContent(rawText, filename, format, filePath);
  }

  /**
   * Analiza texto plano (de TXT o Google Docs) y segmenta los capítulos inteligentemente
   */
  public static parseRawContent(
    rawText: string,
    filename: string,
    format: 'docx' | 'txt' | 'gdoc' = 'txt',
    sourcePath: string = filename
  ): DocumentParseResult {
    // Normalizar saltos de línea
    const normalized = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalized.split('\n');

    // Patrón para detectar cabeceras de capítulos
    const chapterHeaderRegex =
      /^(?:(?:cap[ií]tulo|chapter|cap\.|parte|secci[oó]n)\s*(\d+|[ivxlcdm]+)?[:.-]?\s*(.*)|[-=_]{3,}|[*]{3,})/i;

    interface RawSegment {
      title: string;
      lines: string[];
    }

    const segments: RawSegment[] = [];
    let currentSegment: RawSegment | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      const match = trimmed.match(chapterHeaderRegex);

      if (match) {
        // Nueva cabecera de capítulo detectada
        if (currentSegment && currentSegment.lines.some((l) => l.trim().length > 0)) {
          segments.push(currentSegment);
        }

        let chapterTitle = trimmed;
        // Limpiar separadores si la línea es solo guiones
        if (/^[-=_*]{3,}$/.test(trimmed)) {
          // El título será la siguiente línea si no está vacía
          const nextLine = lines[i + 1]?.trim();
          if (nextLine && nextLine.length > 0 && nextLine.length < 100) {
            chapterTitle = nextLine;
            i++; // saltar siguiente línea
          } else {
            chapterTitle = `Capítulo ${segments.length + 1}`;
          }
        }

        currentSegment = {
          title: chapterTitle,
          lines: [],
        };
      } else {
        if (!currentSegment) {
          // Si aún no hemos detectado una cabecera de capítulo
          // Comprobar si la primera línea no vacía puede ser un título
          if (trimmed.length > 0 && trimmed.length < 80 && !trimmed.endsWith('.')) {
            currentSegment = {
              title: trimmed,
              lines: [],
            };
            continue;
          } else {
            // Empezar capítulo por defecto con el nombre del archivo
            const baseTitle = path.basename(filename, path.extname(filename));
            currentSegment = {
              title: baseTitle || 'Capítulo 1',
              lines: [],
            };
          }
        }
        currentSegment.lines.push(line);
      }
    }

    if (currentSegment && currentSegment.lines.some((l) => l.trim().length > 0)) {
      segments.push(currentSegment);
    }

    // Si no se detectó ningún capítulo con contenido, usar todo el texto
    if (segments.length === 0) {
      const defaultTitle = path.basename(filename, path.extname(filename)) || 'Capítulo 1';
      segments.push({
        title: defaultTitle,
        lines,
      });
    }

    let totalWords = 0;
    const chapters: ParsedChapter[] = segments.map((seg, idx) => {
      const content = seg.lines.join('\n').trim();
      const words = content.length > 0 ? content.split(/\s+/).filter(Boolean).length : 0;
      totalWords += words;

      const preview =
        content.slice(0, 160).replace(/\n+/g, ' ') + (content.length > 160 ? '...' : '');

      return {
        chapterNumber: idx + 1,
        title: seg.title || `Capítulo ${idx + 1}`,
        content,
        wordCount: words,
        hash: sha256(content),
        preview,
      };
    });

    return {
      sourcePath,
      filename,
      format,
      totalWords,
      chapters,
    };
  }
}
