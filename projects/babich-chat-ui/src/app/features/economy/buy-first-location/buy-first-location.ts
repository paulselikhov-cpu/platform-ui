import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApplicationService } from '../../../services/backend-services/http/application.service';
import { CurrentChatUserService } from '../../../services/current-chat-user.service';
import { IApplication } from '../../../models/economy/application.interface';

/**
 * Форма покупки первой квартиры для бомжей (gameStatus = HOMELESS).
 * Стоимость: 1000 монет. Автоматически создаётся Location с одной комнатой.
 */
@Component({
  selector: 'app-buy-first-location',
  templateUrl: './buy-first-location.html',
  styleUrl: './buy-first-location.scss',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class BuyFirstLocation {
  private applicationService = inject(ApplicationService);
  private currentUserService = inject(CurrentChatUserService);
  private router = inject(Router);

  // события для родителя
  applicationSubmitted = output<IApplication>();
  cancelled = output<void>();

  user = this.currentUserService.currentChatUser;

  // поля формы
  locationName = signal('');
  locationDescription = signal('');

  // состояние
  loading = signal(false);
  error = signal('');
  success = signal(false);

  get canAfford(): boolean {
    return (this.user()?.coinBalance ?? 0) >= 1000;
  }

  get isHomeless(): boolean {
    return this.user()?.gameStatus === 'HOMELESS';
  }

  submit() {
    if (!this.locationName().trim()) {
      this.error.set('Введите название квартиры');
      return;
    }

    if (!this.canAfford) {
      this.error.set('Недостаточно монет. Нужно 1000.');
      return;
    }

    if (!this.isHomeless) {
      this.error.set('У вас уже есть жильё');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.applicationService.buyFirstLocation({
      locationName: this.locationName().trim(),
      locationDescription: this.locationDescription().trim()
    }).subscribe({
      next: (application) => {
        this.loading.set(false);
        this.success.set(true);
        this.applicationSubmitted.emit(application);
        // Обновляем баланс и статус
        this.currentUserService.updateChatUser({
          coinBalance: (this.user()?.coinBalance ?? 0) - 1000,
          gameStatus: 'RESIDENT'
        });
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Ошибка подачи заявки');
        this.loading.set(false);
      }
    });
  }

  cancel() {
    this.router.navigate(['/chat']);
  }
}
