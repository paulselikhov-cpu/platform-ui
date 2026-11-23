import { Component, inject } from '@angular/core';
import { MessageService } from '../../../services/message.service';

/**
 * Всплывающие уведомления (глобальные, один инстанс на приложение).
 *
 * Список и время жизни сообщений ведёт `MessageService`; компонент только
 * рисует. На мобильном экране тосты встают сверху, но ниже выреза камеры
 * (`safe-area-inset-top`), иначе их перекрывает статус-бар.
 */
@Component({
  selector: 'app-toast',
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class Toast {
  protected readonly messageService = inject(MessageService);
}