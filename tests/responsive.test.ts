import { describe, expect, it } from 'bun:test';
import { ResponsiveManager, ResponsiveLayoutConfig } from '../src/cli/terminal/responsive';
import { HeaderBarRenderer, CloudHeaderState } from '../src/cli/terminal/components/header-bar';
import { InputBoxRenderer } from '../src/cli/terminal/components/input-box';
import { BlockCardRenderer } from '../src/cli/terminal/components/block-card';
import { SelectorList } from '../src/cli/terminal/components/selector-list';

describe('Responsive Layout & Dimension Adaptation', () => {
  const testDimensions = [
    { width: 60, height: 20, name: '60x20 (Compact / Narrow)' },
    { width: 80, height: 24, name: '80x24 (Standard Terminal)' },
    { width: 100, height: 30, name: '100x30 (Medium)' },
    { width: 120, height: 40, name: '120x40 (Wide)' },
    { width: 160, height: 50, name: '160x50 (Large)' },
    { width: 200, height: 60, name: '200x60 (Ultra Wide)' },
  ];

  const mockHeader: CloudHeaderState = {
    version: '1.0.0',
    user: 'wattpad_author',
    isAuthenticated: true,
    serverUrl: 'https://wattpad-cli.onrender.com',
    serverOnline: true,
    activeStory: 'El Secreto de las Sombras [NOV-0001]',
    activeChapter: 'Cap 1 [CAP-0001]',
    syncState: 'Al día',
  };

  for (const dim of testDimensions) {
    it(`should adapt layout cleanly to ${dim.name}`, () => {
      // Simulate terminal dimension config
      const config: ResponsiveLayoutConfig = {
        breakpoint: dim.width < 75 ? 'COMPACT' : dim.width >= 140 ? 'ULTRA_WIDE' : dim.width >= 106 ? 'WIDE' : 'STANDARD',
        width: dim.width,
        height: dim.height,
        isCompact: dim.width < 75 || dim.height < 22,
        isNarrow: dim.width < 75,
        isShort: dim.height < 24,
        maxContentLines: Math.max(5, dim.height - 10),
        cardWidth: Math.min(dim.width - 2, dim.width < 75 ? dim.width - 2 : Math.min(dim.width - 4, 110)),
        showSecondaryPanels: dim.width >= 75 && dim.height >= 24,
        compactHeader: dim.width < 75 || dim.height < 24,
        compactStatusBar: dim.width < 75,
      };

      // 1. Header Bar render
      const headerLines = HeaderBarRenderer.render(mockHeader, config);
      expect(headerLines.length).toBeGreaterThan(0);

      // 2. Input Box render
      const inputLines = InputBoxRenderer.render('/story new "Test"', 15, config.width, true);
      expect(inputLines.length).toBe(3);

      // 3. Block Card render
      const cardLines = BlockCardRenderer.renderBlock(
        {
          type: 'card',
          title: 'Prueba de Adaptación Responsive',
          subtitle: 'Validando que ningún texto se corte y los bordes se mantengan alineados.',
          fields: [
            { label: 'Ancho Terminal', value: `${dim.width} columnas` },
            { label: 'Alto Terminal', value: `${dim.height} filas` },
          ],
        },
        config.cardWidth
      );
      expect(cardLines.length).toBeGreaterThan(4);

      // 4. Selector List render
      const selector = new SelectorList('MIS HISTORIAS', [
        { id: '1', primary: 'Novela 1', secondary: 'Detalles novela 1' },
        { id: '2', primary: 'Novela 2', secondary: 'Detalles novela 2' },
      ]);
      const selectorLines = selector.render(config.cardWidth, true);
      expect(selectorLines.length).toBeGreaterThan(0);
    });
  }
});
