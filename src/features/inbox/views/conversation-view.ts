import { ViewInterface, KeyPressEvent } from '../../../shared/types/navigation.types';
import { InboxConversation, ConversationMessage } from '../../../shared/types/inbox.types';
import { HeaderComponent } from '../../../platform/terminal/components/header';
import { FooterComponent } from '../../../platform/terminal/components/footer';
import { SessionManager } from '../../../auth/session/session-manager';
import { COLORS } from '../../../shared/constants/colors.constants';
import { formatDate } from '../../../shared/utils/string-utils';

export class ConversationView implements ViewInterface {
  public id = 'conversation' as const;
  private conversation: InboxConversation;
  private messages: ConversationMessage[] = [];
  private onBack: () => void;

  constructor(conversation: InboxConversation, onBack: () => void) {
    this.conversation = conversation;
    this.onBack = onBack;

    // Mensaje inicial a partir del snippet de la conversación
    this.messages = [
      {
        id: 'msg-1',
        senderUsername: conversation.withUsername,
        senderDisplayName: conversation.withDisplayName,
        text: conversation.lastMessageSnippet,
        sentAt: conversation.lastMessageDate,
        isMine: false,
      },
    ];
  }

  public render(width: number, height: number): string[] {
    const lines: string[] = [];
    const user = SessionManager.getUsername();

    lines.push(...HeaderComponent.render({ width, connectedUser: user }));
    lines.push(`  ${COLORS.BOLD}${COLORS.TEXT_MAIN}Conversación con @${this.conversation.withUsername}${COLORS.RESET} (${this.conversation.withDisplayName})`);
    lines.push('');

    this.messages.forEach((m) => {
      const senderStyle = m.isMine ? `${COLORS.BOLD}${COLORS.ORANGE}Tú${COLORS.RESET}` : `${COLORS.BOLD}${COLORS.INFO}@${m.senderUsername}${COLORS.RESET}`;
      lines.push(`  ${senderStyle}  ${COLORS.TEXT_DIM}${formatDate(m.sentAt)}${COLORS.RESET}`);
      lines.push(`    ${COLORS.TEXT_MAIN}${m.text}${COLORS.RESET}`);
      lines.push('');
    });

    const currentLines = lines.length;
    const remaining = Math.max(1, height - currentLines - 4);
    for (let i = 0; i < remaining; i++) {
      lines.push('');
    }

    lines.push(...FooterComponent.render(['Esc Volver al buzón'], width));
    return lines;
  }

  public handleKey(event: KeyPressEvent): void {
    if (event.key === 'escape') {
      this.onBack();
    }
  }
}
