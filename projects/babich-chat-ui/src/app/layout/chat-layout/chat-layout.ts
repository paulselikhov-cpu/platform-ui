import { Component, inject, effect } from '@angular/core';
import { Router } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { CurrentChatUserService } from '../../services/current-chat-user.service';

/**
 * Обёртка всех маршрутов `/chat`: проверяет, что персонаж в выбранном районе
 * существует, и рендерит дочерний маршрут.
 *
 * Выбор раскладки (десктоп или мобила) делает `ChatShell` — он живёт на
 * дочерних маршрутах, поэтому `<router-outlet>` здесь рендерится всегда:
 * иначе мобильные маршруты `/chat/...` были бы недостижимы.
 *
 * Если персонажа в выбранном районе нет (`hasCharacter() === false`),
 * находиться в /chat нечему — уводим на выбор района. Реагируем только на
 * определённый `false`: `null` — состояние ещё не проверено, `true` — персонаж есть.
 */
@Component({
  selector: 'app-chat-layout',
  imports: [RouterOutlet],
  templateUrl: './chat-layout.html'
})
export class ChatLayout {
  private currentChatUserService = inject(CurrentChatUserService);
  private router = inject(Router);

  constructor() {
    effect(() => {
      if (this.currentChatUserService.hasCharacter() === false) {
        this.router.navigate(['/district-select']);
      }
    });
  }
}