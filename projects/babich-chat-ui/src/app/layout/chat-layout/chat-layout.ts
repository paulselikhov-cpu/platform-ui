import { Component, inject, effect } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { ChatMobile } from '../mobile/chat-mobile/chat-mobile';
import { CurrentChatUserService } from '../../services/current-chat-user.service';

/**
 * Обёртка которая определяет показывать desktop или mobile layout.
 * BreakpointObserver реактивно отслеживает размер экрана.
 * Desktop-ветка рендерит <router-outlet> — туда подставляются дочерние
 * маршруты /chat (ChatDesktop) и /chat/error (ChatAccessError).
 *
 * Если персонажа в выбранном районе нет (`hasCharacter() === false`),
 * находиться в /chat нечему — уводим на выбор района. Реагируем только на
 * определённый `false`: `null` — состояние ещё не проверено, `true` — персонаж есть.
 */
@Component({
  selector: 'app-chat-layout',
  imports: [AsyncPipe, ChatMobile, RouterOutlet],
  templateUrl: './chat-layout.html'
})
export class ChatLayout {
  private breakpoint = inject(BreakpointObserver);
  private currentChatUserService = inject(CurrentChatUserService);
  private router = inject(Router);

  isMobile$ = this.breakpoint
    .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
    .pipe(map(result => result.matches));

  constructor() {
    effect(() => {
      if (this.currentChatUserService.hasCharacter() === false) {
        this.router.navigate(['/district-select']);
      }
    });
  }
}