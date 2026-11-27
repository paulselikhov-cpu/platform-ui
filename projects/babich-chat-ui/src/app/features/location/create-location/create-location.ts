import { Component, inject, output, signal } from '@angular/core';
import { ILocation, ILocationTemplate } from '../../../models/location/location.interface';
import { LocationService } from '../../../services/backend-services/http/location.service';
import { CurrentChatUserService } from '../../../services/current-chat-user.service';
import { DefaultButtonComponent } from '../../../shared/components/buttons/default-button/default-button';
import { DefaultTabsSet, DefaultTabOption } from '../../../shared/components/default-tabs-set/default-tabs-set';
import { DefaultCard } from '../../../shared/components/default-card/default-card';

/**
 * Мастер создания локации — два шага:
 * 1. Выбор шаблона
 * 2. Настройки локации (название, описание, тип доступа)
 */
@Component({
  selector: 'app-create-location',
  imports: [DefaultButtonComponent, DefaultTabsSet, DefaultCard],
  templateUrl: './create-location.html',
  styleUrl: './create-location.scss'
})
export class CreateLocation {
  readonly accessTabs: DefaultTabOption[] = [
    { id: 'public', label: 'Публичная' },
    { id: 'private', label: 'Приватная' },
  ];

  private locationService = inject(LocationService);
  private currentChatUserService = inject(CurrentChatUserService);

  // события для родителя
  // локация создана → показать её
  locationCreated = output<ILocation>();
  // пользователь отменил
  cancelled = output<void>();           

  // шаг мастера: 1 = выбор шаблона, 2 = настройки
  step = signal<1 | 2>(1);
  // данные
  templates = signal<ILocationTemplate[]>([]);
  selectedTemplate = signal<ILocationTemplate | null>(null);
  // поля формы
  name = signal('');
  /** Код локации — адрес в URL (/chat/location/:code/...). Придумывает игрок. */
  code = signal('');
  description = signal('');
  isPublic = signal(true);

  setAccessType(type: string): void {
    if (type === 'public') this.isPublic.set(true);
    if (type === 'private') this.isPublic.set(false);
  }
  // состояние
  loading = signal(false);
  error = signal('');
  templatesLoading = signal(true);

  constructor() {
    this.loadTemplates();
  }

  loadTemplates() {
    this.locationService.getTemplates().subscribe({
      next: (templates) => {
        this.templates.set(templates);
        this.templatesLoading.set(false);
      },
      error: () => this.templatesLoading.set(false)
    });
  }

  selectTemplate(template: ILocationTemplate) {
    this.selectedTemplate.set(template);
  }

  templateCardBody(template: ILocationTemplate): string {
    const price = template.priceCoin === 0 ? 'Бесплатно' : `${template.priceCoin} 🪙`;
    const details = [`${template.templateRooms.length} комнат`, price];
    if (template.isExtendable) details.push('Можно достраивать');
    return details.join(' · ');
  }

  goToStep2() {
    if (!this.selectedTemplate()) {
      this.error.set('Выберите шаблон');
      return;
    }
    this.error.set('');
    // подставляем название шаблона как дефолт
    if (!this.name()) {
      this.name.set(this.selectedTemplate()!.name);
    }
    this.step.set(2);
  }

  goBack() {
    this.step.set(1);
    this.error.set('');
  }

  create() {
    if (!this.name().trim()) {
      this.error.set('Введите название локации');
      return;
    }

    const code = this.code().trim().toUpperCase();
    if (code.length < 3) {
      this.error.set('Код локации — минимум 3 символа');
      return;
    }
    if (!/^[A-Z0-9_]+$/.test(code)) {
      this.error.set('Код: только латинские буквы, цифры и «_»');
      return;
    }

    const chatUser = this.currentChatUserService.currentChatUser();
    if (!chatUser?.id) {
      this.error.set('Персонаж не выбран. Сначала войдите в район.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.locationService.createLocation({
      templateId: this.selectedTemplate()!.id,
      code: code,
      name: this.name().trim(),
      description: this.description().trim(),
      isPublic: this.isPublic(),
      characterId: chatUser.id
    }).subscribe({
      next: (location) => {
        this.loading.set(false);
        this.locationCreated.emit(location);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Ошибка создания локации');
        this.loading.set(false);
      }
    });
  }

  cancel() {
    this.cancelled.emit();
  }
}