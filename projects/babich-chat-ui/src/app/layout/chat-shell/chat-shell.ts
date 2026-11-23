import { Component, inject } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';
import { ChatDesktop } from '../desktop/chat-desktop/chat-desktop';
import { ChatMobile } from '../mobile/chat-mobile/chat-mobile';
import { ChatShellState } from './chat-shell-state';

/**
 * Общий родитель десктопной и мобильной раскладок: держит состояние сессии
 * (ChatShellState) и решает, какая раскладка показывается.
 *
 * Граница мобильного — ширина окна ≤ 900px: выше неё показывается
 * десктопная раскладка, ниже — мобильная. Проверка по ширине, а не по типу
 * устройства, поэтому планшет в портретной ориентации на узком экране
 * получает мобильный интерфейс, а на широком — десктопный.
 *
 * ChatShellState объявлен в `providers`, поэтому один экземпляр на весь
 * экран: обе раскладки читают и пишут одни и те же сигналы, а при уходе
 * из локации состояние сбрасывается вместе с компонентом. Состояние
 * создаётся при первой инъекции — раскладками, — а подписка на маршрут
 * заводится в его конструкторе, поэтому она не зависит от lifecycle-хуков.
 */
@Component({
  selector: 'app-chat-shell',
  imports: [AsyncPipe, ChatDesktop, ChatMobile],
  providers: [ChatShellState],
  templateUrl: './chat-shell.html',
  styleUrl: './chat-shell.scss',
})
export class ChatShell {
  private readonly breakpoint = inject(BreakpointObserver);

  readonly isMobile$ = this.breakpoint
    .observe('(max-width: 900px)')
    .pipe(map((result) => result.matches));
}
