import { Component, computed, effect, inject, signal } from '@angular/core';
import { CurrentChatUserService } from '../../../services/current-chat-user.service';

@Component({
  selector: 'app-character-panel',
  templateUrl: './character-panel.html',
  styleUrl: './character-panel.scss',
  standalone: true,
})
export class CharacterPanel {
  private currentUserService = inject(CurrentChatUserService);

  user = computed(() => this.currentUserService.currentChatUser());

  coinBalance = computed(() => this.user()?.coinBalance ?? 0);
  userLevel = this.currentUserService.userLevel;
  energy = computed(() => this.user()?.energy ?? 0);
  xp = computed(() => this.user()?.xpUser ?? 0);

  // Константы для прогресс-баров (пока бэкенд не отдаёт maxEnergy / xpToNextLevel)
  readonly maxEnergy = 100;
  readonly xpToNextLevel = 100;

  energyPercent = computed(() =>
    Math.round((this.energy() / this.maxEnergy) * 100)
  );
  xpPercent = computed(() =>
    Math.round((this.xp() / this.xpToNextLevel) * 100)
  );

  // Фейковые заявки
  readonly districtEvent = [
    { id: 1, title: 'Администрация:', content: 'На выборы в мэры победил Селихов Павел!' },
    { id: 2, title: 'Павел Селихов:', content: 'Спасибо всем! Я очень рад быть с вами!' },
    { id: 3, title: 'Администрация', content: 'Сегодня был пойман опасный преступник', },
    { id: 4, title: 'Администрация', content: 'Сегодня на площади Ленина состоится концерт', },
    { id: 5, title: 'Вася Пупкин', content: 'Вы все уроды хихихи', },
  ];
}