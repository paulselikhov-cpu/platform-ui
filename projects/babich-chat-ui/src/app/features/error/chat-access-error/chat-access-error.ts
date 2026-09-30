import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

type ErrorReason = 'forbidden' | 'not-found';

interface ErrorContent {
  icon: string;
  title: string;
  text: string;
}

const CONTENT: Record<ErrorReason, ErrorContent> = {
  forbidden: {
    icon: '⛔',
    title: 'Доступ запрещён',
    text: 'У вас нет доступа к этой локации. Вы не являетесь её участником.',
  },
  'not-found': {
    icon: '🔍',
    title: 'Локация не найдена',
    text: 'Такой локации не существует или она была удалена.',
  },
};

/**
 * Страница ошибки — /chat/error?reason=forbidden|not-found[&message=…].
 * Открывается из ChatDesktop, когда локацию нельзя показать:
 *  - 403 → `forbidden` (приватная локация, персонаж не участник);
 *  - 404 → `not-found` (локации нет).
 * Причина приходит query-параметром, поэтому страница переживает F5.
 * Текст причины (`message`) тоже приходит с бэкенда параметром — продуктовую
 * формулировку («не участник») фронт не выдумывает; если параметра нет
 * (прямой заход по ссылке), показывается fallback-копирайт из CONTENT.
 */
@Component({
  selector: 'app-chat-access-error',
  templateUrl: './chat-access-error.html',
  styleUrl: './chat-access-error.scss'
})
export class ChatAccessError {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly reason = toSignal(
    this.route.queryParamMap.pipe(
      map((params): ErrorReason => (params.get('reason') === 'not-found' ? 'not-found' : 'forbidden'))
    ),
    { initialValue: 'forbidden' as ErrorReason }
  );

  /**
   * Текст причины от бэкенда (`message` из тела 403/404), прокинутый query-параметром.
   * null — страницу открыли напрямую или по F5 без параметра: тогда fallback-копирайт.
   */
  private readonly backendMessage = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('message'))),
    { initialValue: null }
  );

  /** Иконка и заголовок — оформление по причине (статус → страница). */
  readonly content = computed(() => CONTENT[this.reason()]);

  /** Текст причины: с бэкенда, если он пришёл; иначе fallback-копирайт. */
  readonly text = computed(() => this.backendMessage() ?? this.content().text);

  /** Для 404 «Доступ запрещён» и красная рамка вводят в заблуждение — переключаем оформление. */
  readonly isNotFound = computed(() => this.reason() === 'not-found');

  goHome(): void {
    this.router.navigate(['/chat']);
  }
}
