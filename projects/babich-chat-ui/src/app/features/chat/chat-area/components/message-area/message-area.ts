import { Component, computed, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MessageContextMenuService } from '../../services/message-context-menu.service';
import { EmojiParsePipe } from '../../../../../pipes/emoji-pars.pipe';
import { AuthService } from '../../../../../services/backend-services/base/auth.service';
import { MessageSelectionService } from '../../services/message-selection.service';
import { IReplyPreview } from '../../../../../models/messages/message.interface';

interface IMessageArea {
  id: number;
  avatarName: string;
  sender: string;
  timestamp: string;
  content: string;
  isDeleted: boolean;
  userId: number;
  isOnline: boolean;
  replyTo?: IReplyPreview | null;
  /** Начало группы того же автора: показываем аватар и ник. */
  isGroupStart?: boolean;
  /** Последнее сообщение группы: закругляем нижний уголок пузыря. */
  isGroupEnd?: boolean;
}

/**
 * Одно сообщение ленты — пузырь: свои справа, чужие слева.
 *
 * Сообщения одного автора подряд объединяются в группу (см.
 * `message-grouping.util`): у продолжений скрыты аватар и ник, отступ сверху
 * меньше. Разметка и стили одинаковы на десктопе и на мобиле — ширина пузыря
 * ограничена токеном `--bubble-max-width`.
 *
 * Контекстное меню открывается долгим нажатием: на тач-экранах события
 * `contextmenu` мыши не бывает, поэтому используется таймер удержания.
 */
@Component({
  selector: 'app-message-area',
  imports: [EmojiParsePipe, DatePipe],
  templateUrl: './message-area.html',
  styleUrl: './message-area.scss',
})
export class MessageArea {
  msg = input.required<IMessageArea>();

  private authService = inject(AuthService);
  private messageContextMenuService = inject(MessageContextMenuService);
  readonly selectionService = inject(MessageSelectionService);

  /** Начало группы (по умолчанию каждое сообщение начинает группу). */
  readonly isGroupStart = computed(() => this.msg().isGroupStart ?? true);
  /** Последнее в группе: закругляем нижний уголок пузыря. */
  readonly isGroupEnd = computed(() => this.msg().isGroupEnd ?? true);

  /** Сообщение своё — пузырь справа, чужое — слева. */
  readonly isOwn = computed(() => {
    const currentUserId = this.authService.currentUser()?.userId;
    return currentUserId !== undefined && currentUserId === this.msg().userId;
  });

  // ─── контекстное меню ────────────────────────────────────────────────────

  /** Удержание для показа меню на тач-экране, мс. */
  private readonly LONG_PRESS_MS = 500;
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private touchStartPoint: { x: number; y: number } | null = null;

  onTouchStart(event: TouchEvent): void {
    const touch = event.touches[0];
    if (!touch) return;
    this.touchStartPoint = { x: touch.clientX, y: touch.clientY };

    // В режиме выделения клик переключает отметку — меню там только мешает.
    if (this.selectionService.selectionMode()) return;

    this.longPressTimer = setTimeout(() => {
      this.longPressTimer = null;
      if (this.touchStartPoint == null) return;
      this.messageContextMenuService.open(
        this.touchStartPoint.x,
        this.touchStartPoint.y,
        this.msg().id,
        this.isOwn(),
        this.msg().content,
      );
    }, this.LONG_PRESS_MS);
  }

  /** Движение пальца отменяет удержание — пользователь прокручивает ленту. */
  onTouchMove(): void {
    this.cancelLongPress();
  }

  onTouchEnd(): void {
    this.cancelLongPress();
  }

  private cancelLongPress(): void {
    if (this.longPressTimer != null) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    this.touchStartPoint = null;
  }

  /** Контекстное меню мышью (десктоп). */
  onMessageContextMenu(event: MouseEvent, msgId: number, content: string, senderId: number | undefined): void {
    event.preventDefault();

    const currentUser = this.authService.currentUser();
    const isOwn = senderId !== undefined && currentUser?.userId === senderId;

    this.messageContextMenuService.open(event.clientX, event.clientY, msgId, isOwn, content);
  }
}