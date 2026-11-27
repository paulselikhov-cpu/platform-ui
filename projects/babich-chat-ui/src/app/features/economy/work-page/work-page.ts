import { Component, DestroyRef, inject, input, signal, output } from '@angular/core';
import { WorkService } from '../../../services/backend-services/http/work.service';
import { CurrentChatUserService } from '../../../services/current-chat-user.service';
import { IWorkResult } from '../../../models/economy/work-result.interface';
import { BackButton } from '../../../shared/components/buttons/back-button/back-button';
import { DefaultButtonComponent } from '../../../shared/components/buttons/default-button/default-button';
import { DefaultCard } from '../../../shared/components/default-card/default-card';
import { DefaultList } from '../../../shared/components/default-list/default-list';
import { DefaultStatCard } from '../../../shared/components/default-stat-card/default-stat-card';

/**
 * Панель работы — тап-фарм. В MVP доступна только профессия дворника.
 * Каждый тап: -5 энергии, +2 монеты, +1 XP (с шансом бонуса на сервере).
 */
@Component({
  selector: 'app-work-page',
  imports: [BackButton, DefaultButtonComponent, DefaultCard, DefaultList, DefaultStatCard],
  templateUrl: './work-page.html',
  styleUrl: './work-page.scss',
  standalone: true
})
export class WorkPage {
  readonly useMobileHeader = input(false);

  private workService = inject(WorkService);
  private currentUserService = inject(CurrentChatUserService);
  private destroyRef = inject(DestroyRef);
  private feedbackTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly cancelled = output<void>();

  isWorking = signal(false);
  lastResult = signal<IWorkResult | null>(null);
  errorMessage = signal<string | null>(null);

  user = this.currentUserService.currentChatUser;

  constructor() {
    this.destroyRef.onDestroy(() => this.clearFeedbackTimeout());
  }

  work(): void {
    if (this.isWorking()) return;

    this.isWorking.set(true);
    this.clearFeedback();

    this.workService.workAsDvornik().subscribe({
      next: (result) => {
        this.lastResult.set(result);
        this.scheduleFeedbackClear();
        this.currentUserService.updateChatUser({
          coinBalance: result.newCoinBalance,
          xpUser: result.newXp,
          energy: result.newEnergy
        });
        // XP достиг порога следующего уровня — перезагружаем уровень/порог с бэка
        const threshold = this.currentUserService.xpThreshold();
        if (threshold !== null && result.newXp >= threshold) {
          this.currentUserService.refreshLevel();
        }
        this.isWorking.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Не удалось выполнить работу. Попробуйте ещё раз');
        this.scheduleFeedbackClear();
        this.isWorking.set(false);
      }
    });
  }

  private clearFeedback(): void {
    this.clearFeedbackTimeout();
    this.lastResult.set(null);
    this.errorMessage.set(null);
  }

  private clearFeedbackTimeout(): void {
    if (this.feedbackTimeout !== null) {
      clearTimeout(this.feedbackTimeout);
      this.feedbackTimeout = null;
    }
  }

  private scheduleFeedbackClear(): void {
    this.clearFeedbackTimeout();
    this.feedbackTimeout = setTimeout(() => this.clearFeedback(), 3000);
  }
}