import { Component, inject, signal, output } from '@angular/core';
import { WorkService } from '../../../services/backend-services/http/work.service';
import { CurrentChatUserService } from '../../../services/current-chat-user.service';
import { IWorkResult } from '../../../models/economy/work-result.interface';

/**
 * Панель работы — тап-фарм. В MVP доступна только профессия дворника.
 * Каждый тап: -5 энергии, +2 монеты, +1 XP (с шансом бонуса на сервере).
 */
@Component({
  selector: 'app-work-page',
  templateUrl: './work-page.html',
  styleUrl: './work-page.scss',
  standalone: true
})
export class WorkPage {
  private workService = inject(WorkService);
  private currentUserService = inject(CurrentChatUserService);

  cancelled = output<void>();

  isWorking = signal(false);
  lastResult = signal<IWorkResult | null>(null);
  errorMessage = signal<string | null>(null);

  user = this.currentUserService.currentChatUser;

  work(): void {
    if (this.isWorking()) return;

    this.isWorking.set(true);
    this.errorMessage.set(null);

    this.workService.workAsDvornik().subscribe({
      next: (result) => {
        this.lastResult.set(result);
        this.currentUserService.updateChatUser({
          coinBalance: result.newCoinBalance,
          xpUser: result.newXp,
          energy: result.newEnergy
        });
        this.isWorking.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Недостаточно энергии для работы');
        this.isWorking.set(false);
      }
    });
  }
}