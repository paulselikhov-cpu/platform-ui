import { Component, computed, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WindowModal } from '../window-modal/window-modal';
import { ApplicationService } from '../../../../services/backend-services/http/application.service';
import { MessageService } from '../../../../services/message.service';
import { IApplication, ApplicationType, ApplicationStatus } from '../../../../models/economy/application.interface';

/** Человеко-понятные названия типов заявок (ключи фильтров). */
export const APPLICATION_TYPE_LABELS: Record<ApplicationType, string> = {
  [ApplicationType.REGISTER_PASSPORT]: 'Заявка на получение паспорта',
  [ApplicationType.BUY_FIRST_LOCATION]: 'Заявка на покупку первой локации',
};

const FILTER_ALL: ApplicationType | 'ALL' = 'ALL';

/**
 * Модалка сотрудника мэрии «Гражданские заявки»: список всех заявок с
 * фильтром по типу и кнопками «Одобрить/Отклонить» (пока — заглушки:
 * кнопки просто показывают toast, реальной обработки нет).
 */
@Component({
  selector: 'app-civil-applications-modal',
  imports: [WindowModal, CommonModule],
  templateUrl: './civil-applications-modal.html',
  styleUrl: './civil-applications-modal.scss',
  standalone: true,
})
export class CivilApplicationsModal {
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

  /** Одобрить (зелёный) — пока заглушка: только toast. */
  approve(app: IApplication): void {
    this.toast.success(`Заявка #${app.id} одобрена`);
  }

  /** Отклонить (синий) — пока заглушка: только toast. */
  reject(app: IApplication): void {
    this.toast.error(`Заявка #${app.id} отклонена`);
  }
}