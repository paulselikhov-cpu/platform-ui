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

  // Константа для прогресс-бара энергии (пока бэкенд не отдаёт maxEnergy)
  readonly maxEnergy = 100;
  /** Порог XP следующего уровня — с бэкенда (CurrentChatUserService.xpThreshold). null = не загружен. */
  xpThreshold = this.currentUserService.xpThreshold;

  energyPercent = computed(() =>
    Math.round((this.energy() / this.maxEnergy) * 100)
  );
  xpPercent = computed(() => {
    const threshold = this.xpThreshold();
    if (threshold == null || threshold <= 0) return 0;
    return Math.min(100, Math.round((this.xp() / threshold) * 100));
  });

  // Фейковые заявки
  readonly districtEvent = [
    { id: 1, title: 'Администрация:', content: 'На выборы в мэры победил Селихов Павел!' },
    { id: 2, title: 'Павел Селихов:', content: 'Спасибо всем! Я очень рад быть с вами!' },
    { id: 3, title: 'Администрация', content: 'Сегодня был пойман опасный преступник', },
    { id: 4, title: 'Администрация', content: 'Сегодня на площади Ленина состоится концерт', },
    { id: 5, title: 'Вася Пупкин', content: 'Вы все уроды хихихи', },
  ];
}