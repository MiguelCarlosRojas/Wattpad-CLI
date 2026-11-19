export type TerminalBreakpoint = 'COMPACT' | 'STANDARD' | 'WIDE' | 'ULTRA_WIDE';

export interface ResponsiveLayoutConfig {
  breakpoint: TerminalBreakpoint;
  width: number;
  height: number;
  isCompact: boolean;
  isNarrow: boolean;
  isShort: boolean;
  maxContentLines: number;
  cardWidth: number;
  showSecondaryPanels: boolean;
  compactHeader: boolean;
  compactStatusBar: boolean;
  sidebarWidth: number;
  mainWidth: number;
  contextWidth: number;
}

export class ResponsiveManager {
  private static listeners: Array<(config: ResponsiveLayoutConfig) => void> = [];

  public static getDimensions(): { width: number; height: number } {
    return {
      width: Math.max(50, process.stdout.columns || 80),
      height: Math.max(16, process.stdout.rows || 24),
    };
  }

  public static getLayoutConfig(explicitWidth?: number, explicitHeight?: number): ResponsiveLayoutConfig {
    const defaultDims = this.getDimensions();
    const width = explicitWidth ?? defaultDims.width;
    const height = explicitHeight ?? defaultDims.height;

    let breakpoint: TerminalBreakpoint = 'STANDARD';
    if (width < 70 || height < 22) {
      breakpoint = 'COMPACT';
    } else if (width >= 140) {
      breakpoint = 'ULTRA_WIDE';
    } else if (width >= 100) {
      breakpoint = 'WIDE';
    }

    const isCompact = breakpoint === 'COMPACT';
    const isNarrow = width < 70;
    const isShort = height < 24;

    const reservedLines = isShort ? 6 : 8;
    const maxContentLines = Math.max(5, height - reservedLines);
    const cardWidth = Math.min(width - 2, isCompact ? width - 2 : Math.min(width - 4, 110));

    let sidebarWidth = 0;
    let contextWidth = 0;
    let mainWidth = width;

    if (breakpoint === 'COMPACT') {
      sidebarWidth = 0;
      contextWidth = 0;
      mainWidth = width;
    } else if (breakpoint === 'STANDARD') {
      sidebarWidth = 0;
      contextWidth = 0;
      mainWidth = width;
    } else if (breakpoint === 'WIDE') {
      sidebarWidth = 24;
      contextWidth = 0;
      mainWidth = Math.max(40, width - sidebarWidth - 3);
    } else if (breakpoint === 'ULTRA_WIDE') {
      sidebarWidth = 24;
      contextWidth = 32;
      mainWidth = Math.max(50, width - sidebarWidth - contextWidth - 6);
    }

    return {
      breakpoint,
      width,
      height,
      isCompact,
      isNarrow,
      isShort,
      maxContentLines,
      cardWidth,
      showSecondaryPanels: breakpoint === 'WIDE' || breakpoint === 'ULTRA_WIDE',
      compactHeader: isShort || isNarrow,
      compactStatusBar: isNarrow,
      sidebarWidth,
      mainWidth,
      contextWidth,
    };
  }

  public static onResize(callback: (config: ResponsiveLayoutConfig) => void): () => void {
    this.listeners.push(callback);

    const handleResize = () => {
      const config = this.getLayoutConfig();
      for (const listener of this.listeners) {
        listener(config);
      }
    };

    if (process.stdout && typeof process.stdout.on === 'function') {
      process.stdout.on('resize', handleResize);
    }

    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
      if (process.stdout && typeof process.stdout.off === 'function') {
        process.stdout.off('resize', handleResize);
      }
    };
  }
}
