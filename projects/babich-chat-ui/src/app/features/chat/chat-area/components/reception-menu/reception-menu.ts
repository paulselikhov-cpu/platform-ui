import { Component, inject, signal } from '@angular/core';
import { ConfirmModal, ConfirmModalConfig } from '../../../../../shared/components/modals/confirm-modal/confirm-modal';
import { ApplicationService } from '../../../../../services/backend-services/http/application.service';
import { MessageService } from '../../../../../services/message.service';

@Component({
  selector: 'app-reception-menu',
  imports: [ConfirmModal],
  templateUrl: './reception-menu.html',
  styleUrl: './reception-menu.scss',
})
export class ReceptionMenu {
  private applicationService = inject(ApplicationService);
  private toast = inject(MessageService);
  
  readonly isOpenModalPassportApplication = signal(false);

  readonly passportApplicationModalConfig: ConfirmModalConfig = {
    icon: '🗳️',
    title: 'Подать заявку на получение паспорта?',
    message:
      'Вы уверены что хотите подать заявку на получение паспорта?<br/> После подачи заявки наблюдейте за статусом выполнения.',
    confirmText: 'Да!',
    cancelText: 'Нет!',
    confirmDanger: false,
  };

  readonly passportApplicationLoading = signal(false);

  cancelModalPassportApplication(): void {
    this.isOpenModalPassportApplication.set(false);
  }

  confirmPassportApplication(): void {
    this.isOpenModalPassportApplication.set(false);

    // Заявка создаётся в PENDING — выдача паспорта произойдёт после одобрения
    // сотрудником мэрии (см. ApplicationService.createPendingApplication).
    this.applicationService.registerPassport().subscribe({
      next: (app) => {
        if (app.status === 'APPROVED') {
          const passport = app.resultMessage?.includes(':')
            ? app.resultMessage.split(': ').pop()
            : app.resultMessage;
          this.toast.success(`Паспорт выдан! № ${passport ?? app.id}`);
        } else {
          this.toast.info(`Заявка #${app.id} подана. Статус: ${app.status}. Ожидайте одобрение мэрии.`);
        }
      },
      error: () => {
        this.toast.error('Не удалось подать заявку на получение паспорта');
      },
    });
  }

  protected openModalPassportApplication(): void {
    this.isOpenModalPassportApplication.set(true);
  }
}
