import { Component, computed, inject, input } from '@angular/core';
import { CurrentChatUserService } from '../../../services/current-chat-user.service';
import { DistrictNewsFeed } from '../district-news-feed/district-news-feed';

@Component({
  selector: 'app-character-panel',
  imports: [DistrictNewsFeed],
  templateUrl: './character-panel.html',
  styleUrl: './character-panel.scss',
  standalone: true,
})
export class CharacterPanel {
  private currentUserService = inject(CurrentChatUserService);

  /**
   * Показывать ленту новостей района. На дескстопе панель их показывает,
   * а на мобиле новости живут отдельной вкладкой «Район» — иначе одна и та же
   * лента дублировалась бы на двух соседних вкладках.
   */
  readonly showNews = input(true);

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

  /**
   * Новости района — общий компонент с вкладкой «Район» мобильной раскладки,
   * поэтому список заведён в одном месте, а не в двух панелях.
   */
}