import { Component, inject, signal } from '@angular/core';
import { ConfirmModal, ConfirmModalConfig } from '../../../../../shared/components/modals/confirm-modal/confirm-modal';
import { ApplicationService } from '../../../../../services/backend-services/http/application.service';

@Component({
  selector: 'app-reception-menu',
  imports: [ConfirmModal],
  templateUrl: './reception-menu.html',
  styleUrl: './reception-menu.scss',
})
export class ReceptionMenu {
  private applicationService = inject(ApplicationService);
  
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
    //this.passportApplicationLoading.set(true);
    // this.electionService.initiate(districtId).subscribe({
    //   next: () => {
    //     this.initiateLoading.set(false);
    //     this.initiateModalOpen.set(false);
    //     this.electionMessage.set({
    //       kind: 'ok',
    //       text: 'Выборы губернатора начались! Жителям района отправлены уведомления.',
    //     });
    //     this.refreshElection();
    //   },
    //   error: (err) => {
    //     this.initiateLoading.set(false);
    //     this.initiateModalOpen.set(false);
    //     this.setElectionMessage(
    //       err?.error?.message ?? 'Не удалось начать выборы (проверьте уровень и наличие губернатора)',
    //     );
    //   },
    // });
  }

  protected openModalPassportApplication(): void {
    this.isOpenModalPassportApplication.set(true);
  }
}
