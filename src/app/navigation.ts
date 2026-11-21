import { ViewInterface, ScreenId } from '../shared/types/navigation.types';
import { SessionGuard } from './session-guard';

export class NavigationManager {
  private viewStack: ViewInterface[] = [];
  private activeView: ViewInterface | null = null;
  private onRenderNeeded: () => void;
  private onViewTransition: () => void;

  constructor(onRenderNeeded: () => void, onViewTransition?: () => void) {
    this.onRenderNeeded = onRenderNeeded;
    this.onViewTransition = onViewTransition || onRenderNeeded;
  }

  public getActiveView(): ViewInterface | null {
    return this.activeView;
  }

  public async pushView(view: ViewInterface): Promise<boolean> {
    if (!SessionGuard.canAccess(view.id)) {
      return false;
    }

    if (this.activeView) {
      if (this.activeView.onLeave) {
        await this.activeView.onLeave();
      }
      this.viewStack.push(this.activeView);
    }

    this.activeView = view;
    if (view.init) {
      await view.init();
    }
    if (view.onEnter) {
      await view.onEnter();
    }

    // Notificar transición de vista limpia
    this.onViewTransition();
    return true;
  }

  public async setRoot(view: ViewInterface): Promise<void> {
    if (this.activeView && this.activeView.onLeave) {
      await this.activeView.onLeave();
    }
    this.viewStack = [];
    this.activeView = view;

    if (view.init) {
      await view.init();
    }
    if (view.onEnter) {
      await view.onEnter();
    }

    // Notificar transición de vista limpia
    this.onViewTransition();
  }

  public async popView(): Promise<boolean> {
    if (this.viewStack.length === 0) {
      return false;
    }

    if (this.activeView && this.activeView.onLeave) {
      await this.activeView.onLeave();
    }

    const previous = this.viewStack.pop()!;
    this.activeView = previous;

    if (previous.onEnter) {
      await previous.onEnter();
    }

    // Notificar transición de vista limpia
    this.onViewTransition();
    return true;
  }
}
