import { Component, computed, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WindowModal } from '../window-modal/window-modal';
import { ApplicationService } from '../../../../services/backend-services/http/application.service';
import { MessageService } from '../../../../services/message.service';
import { IApplication, ApplicationType, ApplicationStatus, APPLICATION_TYPE_LABELS } from '../../../../models/economy/application.interface';


const FILTER_ALL: ApplicationType | 'ALL' = 'ALL';

/**
 * Модалка сотрудника мэрии «Гражданские заявки».
 * - Список всех заявок с фильтром по типу
 * - Кнопки «Одобрить» (зелёная) / «Отклонить» (синяя)
 * - Для REGISTER_PASSPORT при одобрении вызывается API approveApplication
 *   (только сотрудник мэрии — ADMIN/MODERATOR; обычный пользователь видит ошибку)
 */
@Component({
  selector: 'app-employee-applications-modal',
  imports: [WindowModal, CommonModule],
  templateUrl: './employee-applications-modal.html',
  styleUrl: './employee-applications-modal.scss',
  standalone: true,
})
export class EmployeeApplicationsModal {
  readonly closeModal = output<void>();

  private readonly applicationService = inject(ApplicationService);
  private readonly toast = inject(MessageService);

  readonly applications = signal<IApplication[]>([]);
  readonly loading = signal(false);
  readonly selectedType = signal<ApplicationType | 'ALL'>(FILTER_ALL);

  /** Варианты фильтров: «Все» + те типы заявок, что есть в списке. */
  readonly filterOptions = computed(() => {
    const present = new Set(this.applications().map((a) => a.type));
    return Object.entries(APPLICATION_TYPE_LABELS)
      .filter(([type]) => present.has(type as ApplicationType))
      .map(([value, label]) => ({ value: value as ApplicationType, label }));
  });

  /** Отфильтрованные заявки. */
  readonly filtered = computed(() => {
    const type = this.selectedType();
    if (type === FILTER_ALL) return this.applications();
    return this.applications().filter((a) => a.type === type);
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.applicationService.getAllApplications().subscribe({
      next: (apps) => {
        this.applications.set(apps);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Не удалось загрузить гражданские заявки');
        this.loading.set(false);
      },
    });
  }

  setFilter(type: ApplicationType | 'ALL'): void {
    this.selectedType.set(type);
  }

  typeLabel(type: ApplicationType): string {
    return APPLICATION_TYPE_LABELS[type] ?? type;
  }

  statusLabel(status: ApplicationStatus): string {
    if (status === ApplicationStatus.PENDING) return 'В ожидании';
    if (status === ApplicationStatus.APPROVED) return 'Одобрено';
    return 'Отклонено';
  }

  /** Одобрить (зелёная кнопка). Для REGISTER_PASSPORT — реальный API. */
  approve(app: IApplication): void {
    if (app.status !== ApplicationStatus.PENDING) {
      this.toast.warning('Заявка уже обработана');
      return;
    }
    this.loading.set(true);
      this.applicationService.approveApplication(app.id).subscribe({
        next: (updated: IApplication) => {
          this.loading.set(false);
          if (updated.status === ApplicationStatus.APPROVED) {
            this.toast.success(`Заявка #${app.id} одобрена. ${updated.resultMessage ?? ''}`);
            this.load(); // обновить список
          } else {
            this.toast.error(`Не удалось одобрить: ${updated.resultMessage ?? ''}`);
          }
        },
        error: (err: any) => {
          this.loading.set(false);
          const msg = err?.error?.message ?? 'Ошибка';
          if (err?.status === 403) {
            this.toast.noAccessMessage();
          } else {
            this.toast.error(`Не удалось одобрить заявку: ${msg}`);
          }
        },
      });
    return;
  }

  /** Отклонить (синяя кнопка). Реальный API — только для сотрудника мэрии. */
  reject(app: IApplication): void {
    if (app.status !== ApplicationStatus.PENDING) {
      this.toast.warning('Заявка уже обработана');
      return;
    }
    this.loading.set(true);
    this.applicationService.rejectApplication(app.id).subscribe({
      next: (updated: IApplication) => {
        this.loading.set(false);
        if (updated.status === ApplicationStatus.REJECTED) {
          this.toast.success(`Заявка #${app.id} отклонена`);
          this.load(); // обновить список
        } else {
          this.toast.error(`Не удалось отклонить: ${updated.resultMessage ?? ''}`);
        }
      },
      error: (err: any) => {
        this.loading.set(false);
        const msg = err?.error?.message ?? 'Ошибка';
        if (err?.status === 403) {
          this.toast.noAccessMessage();
        } else {
          this.toast.error(`Не удалось отклонить заявку: ${msg}`);
        }
      },
    });
  }
}