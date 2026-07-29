import { Component, computed, inject } from '@angular/core';
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
  readonly applications = [
    { id: 1, title: 'Покупка квартиры', address: 'ул. Ленина, д. 5, кв. 12', status: 'pending' },
    { id: 2, title: 'Аренда офиса', address: 'пр. Мира, д. 10', status: 'approved' },
    { id: 3, title: 'Регистрация участка', address: 'ул. Садовая, д. 3', status: 'rejected' },
  ];
}