import { Component, inject, signal } from '@angular/core';
import { ConfirmModal, ConfirmModalConfig } from '../../../../../../shared/components/modals/confirm-modal/confirm-modal';
import { APPLICATION_TYPE_LABELS } from '../../../../../../models/economy/application.interface';
import { ApplicationService } from '../../../../../../services/backend-services/http/application.service';
import { MessageService } from '../../../../../../services/message.service';

@Component({
  selector: 'app-reception-menu',
  imports: [ConfirmModal],
  templateUrl: './reception-menu.html',
  styleUrl: './reception-menu.scss',
})
export class ReceptionMenu {
  private applicationService = inject(ApplicationService);
  private toast = inject(MessageService);
  protected APPLICATION_TYPE_LABELS = APPLICATION_TYPE_LABELS;
  
  readonly isOpenModalPassportApplication = signal(false);
  readonly isOpenModalWorkLicenceApplication = signal(false);

  readonly passportApplicationModalConfig: ConfirmModalConfig = {
    icon: '🗳️',
    title: 'Подать заявку на получение паспорта?',
    message:
      'Вы уверены что хотите подать заявку на получение паспорта?<br/> После подачи заявки наблюдейте за статусом выполнения.',
    confirmText: 'Да!',
    cancelText: 'Нет!',
    confirmDanger: false,
  };

  readonly workLicenceModalConfig: ConfirmModalConfig = {
    icon: '🗳️',
    title: 'Подать заявку на получение лицензии для работы?',
    message:
      'Вы уверены что хотите подать заявку на на получение лицензии для работы?<br/> После подачи заявки наблюдейте за статусом выполнения.',
    confirmText: 'Да!',
    cancelText: 'Нет!',
    confirmDanger: false,
  };

  readonly passportApplicationLoading = signal(false);
  readonly workLicenceApplicationLoading = signal(false);

  protected cancelModalPassportApplication(): void {
    this.isOpenModalPassportApplication.set(false);
  }

  protected confirmPassportApplication(): void {
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
      error: (err) => {
        this.toast.error(`Не удалось подать заявку${err?.error?.message ? ': ' + err.error?.message : ''}`); //TODO Унифицировать обработку ошибок!
      },
    });
  }

  protected openModalPassportApplication(): void {
    this.isOpenModalPassportApplication.set(true);
  }

  protected openModalWorkLicenceApplication(): void {
    this.isOpenModalWorkLicenceApplication.set(true);
  }

  protected confirmWorkLicenceApplication(): void {
    this.isOpenModalWorkLicenceApplication.set(false);

    this.applicationService.registerWorkLicence().subscribe({
      next: (app) => {
        if (app.status === 'APPROVED') {
          const passport = app.resultMessage?.includes(':')
            ? app.resultMessage.split(': ').pop()
            : app.resultMessage;
          this.toast.success(`Лицензия на работу выдана! № ${passport ?? app.id}`);
        } else {
          this.toast.info(`Заявка #${app.id} подана. Статус: ${app.status}. Ожидайте одобрение мэрии.`);
        }
      },
      error: () => {
        this.toast.error('Не удалось подать заявку на получение рабочей лицензии');
      },
    });
  }

  protected cancelModalWorkLicenceApplication(): void {
    this.isOpenModalWorkLicenceApplication.set(false);
  }
}
