import { Component, computed, inject } from '@angular/core';
import { CurrentChatUserService } from '../../../services/current-chat-user.service';

/**
 * @deprecated
 * Виджет кошелька — показывает баланс монет, энергию и XP персонажа.
 * Размещается в шапке приложения.
 */
@Component({
  selector: 'app-wallet-widget',
  templateUrl: './wallet-widget.html',
  styleUrl: './wallet-widget.scss',
  standalone: true
})
export class WalletWidget {
  private currentUserService = inject(CurrentChatUserService);
  
  user = computed(() => this.currentUserService.currentChatUser());
  
  coinBalance = computed(() => this.user()?.coinBalance ?? 0);
  energy = computed(() => this.user()?.energy ?? 0);
  xp = computed(() => this.user()?.xpUser ?? 0);
}
