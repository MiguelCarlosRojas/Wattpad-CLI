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
}

export class ResponsiveManager {
  private static listeners: Array<(config: ResponsiveLayoutConfig) => void> = [];

  public static getDimensions(): { width: number; height: number } {
    return {
      width: Math.max(50, process.stdout.columns || 80),
      height: Math.max(16, process.stdout.rows || 24),
    };
  }

  public static getLayoutConfig(): ResponsiveLayoutConfig {
    const { width, height } = this.getDimensions();

    let breakpoint: TerminalBreakpoint = 'STANDARD';
    if (width < 75 || height < 22) {
      breakpoint = 'COMPACT';
    } else if (width >= 140) {
      breakpoint = 'ULTRA_WIDE';
    } else if (width >= 106) {
      breakpoint = 'WIDE';
    }

    const isCompact = breakpoint === 'COMPACT';
    const isNarrow = width < 75;
    const isShort = height < 24;

    const reservedLines = isShort ? 8 : 11;
    const maxContentLines = Math.max(6, height - reservedLines);
    const cardWidth = Math.min(width - 2, isCompact ? width - 2 : Math.min(width - 4, 110));

    return {
      breakpoint,
      width,
      height,
      isCompact,
      isNarrow,
      isShort,
      maxContentLines,
      cardWidth,
      showSecondaryPanels: !isNarrow && !isShort,
      compactHeader: isShort || isNarrow,
      compactStatusBar: isNarrow,
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

    process.stdout.on('resize', handleResize);

    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
      process.stdout.off('resize', handleResize);
    };
  }
}
