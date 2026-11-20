import { describe, expect, it } from 'bun:test';
import { ThemeManager, THEMES } from '../src/platform/terminal/theme-manager';
import { TerminalAdapter } from '../src/platform/terminal/terminal-adapter';
import { Theme } from '../src/platform/terminal/theme';
import fs from 'fs';
import path from 'path';

describe('WATTPAD CLI — Motores de Terminal y Distribución Oficial v1.0.0', () => {
  // 1. ThemeManager — Themes (Dark, Light, Tokyo Night, Terminal)
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
      expect(Theme.colors.background).toBe(THEMES['dark'].background);
    });
  });

  // 2. TerminalAdapter — Modes (Fullscreen vs Inline)
  describe('TerminalAdapter — Modos de Renderizado', () => {
    it('should default to fullscreen and switch between modes', () => {
      expect(TerminalAdapter.getMode()).toBe('fullscreen');
      TerminalAdapter.setMode('inline');
      expect(TerminalAdapter.getMode()).toBe('inline');
      TerminalAdapter.setMode('fullscreen');
      expect(TerminalAdapter.getMode()).toBe('fullscreen');
    });
  });

  // 3. Distribution Artifacts & npm Launcher
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
      expect(pkg.version).toMatch(/1\.[0-3]\.0/);
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

    it('should verify install.ps1 includes Windows integrity check', () => {
      const psPath = path.resolve(process.cwd(), 'installers', 'install.ps1');
      const psContent = fs.readFileSync(psPath, 'utf8');
      expect(psContent).toContain('Get-FileHash');
      expect(psContent).toContain('wattpad.exe');
    });
  });
});
