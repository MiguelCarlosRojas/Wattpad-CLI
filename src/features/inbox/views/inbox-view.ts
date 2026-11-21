import { ViewInterface, KeyPressEvent } from '../../../shared/types/navigation.types';
import { InboxConversation, UserNotification } from '../../../shared/types/inbox.types';
import { InboxService } from '../inbox-service';
import { HeaderComponent } from '../../../platform/terminal/components/header';
import { FooterComponent } from '../../../platform/terminal/components/footer';
import { SessionManager } from '../../../auth/session/session-manager';
import { COLORS } from '../../../shared/constants/colors.constants';
import { formatDate } from '../../../shared/utils/string-utils';

export class InboxView implements ViewInterface {
  public id = 'inbox' as const;
  private activeTab: 'conversations' | 'notifications' = 'conversations';
  private conversations: InboxConversation[] = [];
  private notifications: UserNotification[] = [];
  private selectedIndex = 0;
  private isLoading = false;

  private onSelectConversation: (conv: InboxConversation) => void;
  private onBack: () => void;

  constructor(onSelectConversation: (conv: InboxConversation) => void, onBack: () => void) {
    this.onSelectConversation = onSelectConversation;
    this.onBack = onBack;
  }

  public async init(): Promise<void> {
    this.isLoading = true;
    this.conversations = await InboxService.getConversations();
    this.notifications = await InboxService.getNotifications();
    this.selectedIndex = 0;
    this.isLoading = false;
  }

  public render(width: number, height: number): string[] {
    const lines: string[] = [];
    const user = SessionManager.getUsername();

    lines.push(...HeaderComponent.render({ width, connectedUser: user }));
    lines.push(`  ${COLORS.BOLD}${COLORS.TEXT_MAIN}Buzón de Wattpad${COLORS.RESET}`);
    lines.push('');

    // Pestañas
    const convTabStyle = this.activeTab === 'conversations' ? `${COLORS.BOLD}${COLORS.ORANGE}[ 💬 Conversaciones ]${COLORS.RESET}` : `${COLORS.TEXT_MUTED}  Conversaciones  ${COLORS.RESET}`;
    const notifTabStyle = this.activeTab === 'notifications' ? `${COLORS.BOLD}${COLORS.ORANGE}[ 🔔 Notificaciones ]${COLORS.RESET}` : `${COLORS.TEXT_MUTED}  Notificaciones  ${COLORS.RESET}`;
    lines.push(`  ${convTabStyle}    ${notifTabStyle}    ${COLORS.TEXT_DIM}(Tab para cambiar)${COLORS.RESET}`);
    lines.push('');

    if (this.isLoading) {
      lines.push(`  ${COLORS.ORANGE}⏳ Cargando buzón de @${user}...${COLORS.RESET}`);
      lines.push('');
    } else if (this.activeTab === 'conversations') {
      if (this.conversations.length === 0) {
        lines.push(`  ${COLORS.TEXT_MUTED}No tienes conversaciones activas en este momento.${COLORS.RESET}`);
        lines.push('');
      } else {
        this.conversations.forEach((c, idx) => {
          const isSelected = idx === this.selectedIndex;
          const pointer = isSelected ? `${COLORS.ORANGE}❯${COLORS.RESET} ` : '  ';
          const nameColor = isSelected ? `${COLORS.BOLD}${COLORS.TEXT_MAIN}` : COLORS.TEXT_MUTED;
          const badge = c.unread ? `${COLORS.ORANGE_BG}${COLORS.TEXT_MAIN} Sin leer ${COLORS.RESET}` : `${COLORS.TEXT_DIM}Leído${COLORS.RESET}`;

          lines.push(`  ${pointer}${nameColor}Conversación con @${c.withUsername}${COLORS.RESET}    ${badge}`);
          lines.push(`     ${COLORS.TEXT_DIM}${c.lastMessageSnippet} · ${formatDate(c.lastMessageDate)}${COLORS.RESET}`);
          lines.push('');
        });
      }
    } else {
      if (this.notifications.length === 0) {
        lines.push(`  ${COLORS.TEXT_MUTED}No tienes notificaciones pendientes.${COLORS.RESET}`);
        lines.push('');
      } else {
        this.notifications.forEach((n, idx) => {
          const isSelected = idx === this.selectedIndex;
          const pointer = isSelected ? `${COLORS.ORANGE}❯${COLORS.RESET} ` : '  ';
          const nameColor = isSelected ? `${COLORS.BOLD}${COLORS.TEXT_MAIN}` : COLORS.TEXT_MUTED;
          const badge = !n.read ? `${COLORS.SUCCESS}● Nueva${COLORS.RESET}` : `${COLORS.TEXT_DIM}Vista${COLORS.RESET}`;

          lines.push(`  ${pointer}${nameColor}${n.title}${COLORS.RESET}    ${badge}`);
          lines.push(`     ${COLORS.TEXT_DIM}${n.message} · ${formatDate(n.createdAt)}${COLORS.RESET}`);
          lines.push('');
        });
      }
    }

    const currentLines = lines.length;
    const remaining = Math.max(1, height - currentLines - 4);
    for (let i = 0; i < remaining; i++) {
      lines.push('');
    }

    lines.push(...FooterComponent.render(['↑↓ Navegar', 'Enter Abrir', 'Tab Pestaña', 'Esc Volver'], width));
    return lines;
  }

  public handleKey(event: KeyPressEvent): void {
    if (event.key === 'escape') {
      this.onBack();
      return;
    }

    if (event.key === 'tab') {
      this.activeTab = this.activeTab === 'conversations' ? 'notifications' : 'conversations';
      this.selectedIndex = 0;
      return;
    }

    const maxItems = this.activeTab === 'conversations' ? this.conversations.length : this.notifications.length;

    if (event.key === 'up') {
      if (maxItems > 0) {
        this.selectedIndex = (this.selectedIndex - 1 + maxItems) % maxItems;
      }
    } else if (event.key === 'down') {
      if (maxItems > 0) {
        this.selectedIndex = (this.selectedIndex + 1) % maxItems;
      }
    } else if (event.key === 'enter') {
      if (this.activeTab === 'conversations' && this.conversations[this.selectedIndex]) {
        this.onSelectConversation(this.conversations[this.selectedIndex]);
      }
    }
  }
}
