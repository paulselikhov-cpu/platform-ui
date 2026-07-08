import { Component, inject, output, signal } from '@angular/core';
import { LocationService } from '../../../services/http-services/location.service';
import { ILocation, ILocationTemplate } from '../../../models/location/location.interface';
import { AuthService } from '../../../services/http-services/auth.service';

/**
 * Мастер создания локации — два шага:
 * 1. Выбор шаблона
 * 2. Настройки локации (название, описание, тип доступа)
 */
@Component({
  selector: 'app-create-location',
  templateUrl: './create-location.html',
  styleUrl: './create-location.scss'
})
export class CreateLocation {
  private locationService = inject(LocationService);
  private authService = inject(AuthService);

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
  description = signal('');
  isPublic = signal(true);
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

    const user = this.authService.currentUser();
    if (!user) return;

    this.loading.set(true);
    this.error.set('');

    this.locationService.createLocation({
      templateId: this.selectedTemplate()!.id,
      name: this.name().trim(),
      description: this.description().trim(),
      isPublic: this.isPublic(),
      characterId: user.userId
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