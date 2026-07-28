import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CurrentChatUserService } from '../../services/current-chat-user.service';
import { AuthService } from '../../services/backend-services/base/auth.service';
import { CreateChatUserRequest } from '../../services/backend-services/http/chat-user.service';

interface CharacterFormData {
  characterName: string;
  gender?: string;
  height?: number;
  weight?: number;
  badHabits?: string;
}

@Component({
  selector: 'app-character-create',
  imports: [FormsModule],
  templateUrl: './character-create.html',
  styleUrl: './character-create.scss'
})
export class CharacterCreate {
  private router = inject(Router);
  private currentChatUserService = inject(CurrentChatUserService);
  private authService = inject(AuthService);

  formData: CharacterFormData = {
    characterName: '',
    gender: undefined,
    height: undefined,
    weight: undefined,
    badHabits: ''
  };

  submitting = signal(false);
  error = signal<string | null>(null);

  onSubmit(): void {
    // Валидация
    if (!this.formData.characterName?.trim()) {
      this.error.set('Имя персонажа обязательно');
      return;
    }

    const userId = this.authService.currentUser()?.userId;
    if (!userId) {
      this.error.set('Пользователь не авторизован');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const districtId = this.currentChatUserService.selectedDistrictId();
    if (!districtId) {
      this.error.set('Район не выбран. Вернитесь к выбору района.');
      return;
    }

    const request: CreateChatUserRequest = {
      characterName: this.formData.characterName.trim(),
      districtId,
      gender: this.formData.gender,
      height: this.formData.height,
      weight: this.formData.weight,
      badHabits: this.formData.badHabits || undefined
    };

    this.currentChatUserService.createAndSetChatUser(userId, request).subscribe({
      next: () => {
        this.router.navigate(['/district-select']);
      },
      error: (err) => {
        this.submitting.set(false);
        if (err.error?.message) {
          this.error.set(err.error.message);
        } else if (err.status === 409) {
          this.error.set('У вас уже есть персонаж');
        } else {
          this.error.set('Ошибка при создании персонажа. Попробуйте позже.');
        }
      }
    });
  }
}