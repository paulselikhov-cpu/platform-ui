import { Component, inject, input, output, signal } from '@angular/core';
import { ILocation, IRoom, RoomCode } from '../../../../../models/location/location.interface';
import { ChatWebSocketService } from '../../../../../services/backend-services/webSocket/chat-websocket.service';
import { IElectionOverview, PollStatus } from '../../../../../models/poll/election.interface';
import { LocationUsersMenu } from '../../../../location/location-view/location-users-menu/location-users-menu';
import { LocationPresenceState } from '../../../../location/location-view/services/online-tracking.service';
import { ConfirmModal, ConfirmModalConfig } from '../../../../../shared/components/modals/confirm-modal/confirm-modal';
import { CurrentChatUserService } from '../../../../../services/current-chat-user.service';
import { ElectionService } from '../../../../../services/backend-services/http/election.service';

@Component({
  selector: 'app-chat-area-header',
  imports: [LocationUsersMenu, ConfirmModal],
  templateUrl: './chat-area-header.html',
  styleUrl: './chat-area-header.scss',
})
export class ChatAreaHeader {
  readonly location = input.required<ILocation>();
  readonly room = input.required<IRoom>();
  readonly rooms = input.required<IRoom[]>();
  readonly refreshElection = output();
  readonly onlineState = input.required<LocationPresenceState | null>();
  readonly electionOverview = input.required<IElectionOverview | null>();

  private readonly chatWebSocketService = inject(ChatWebSocketService);
  private readonly currentUserService = inject(CurrentChatUserService);
  private readonly electionService = inject(ElectionService);
  
  readonly typingUsers = this.chatWebSocketService.typingUsers;
  readonly connected = this.chatWebSocketService.connected;

  readonly actionsOpen = signal(false);        // выпадающее меню «⚡ Действия»
  readonly initiateModalOpen = signal(false);  // форма подтверждения выдвижения

  // ─── Выборы губернатора (сценарий №2): состояние ─────────────────────────  
  readonly closeModalOpen = signal(false);     // форма подтверждения досрочного завершения
  readonly initiateLoading = signal(false);    // во время отправки initiate
  readonly electionMessage = signal<{ kind: 'error' | 'ok'; text: string } | null>(null);
  readonly electionLoading = signal(false);
  readonly closingElection = signal(false);    // во время досрочного завершения

  readonly initiateConfirmConfig: ConfirmModalConfig = {
    icon: '🗳️',
    title: 'Выдвинуть кандидатуру в губернаторы?',
    message:
      'Вы уверены что хотите выдвинуть свою кандидатуру в губернаторы?<br/>После этого в районе начнутся выборы (24 часа).',
    confirmText: 'Да!',
    cancelText: 'Нет!',
    confirmDanger: false,
  };

  readonly closeConfirmConfig: ConfirmModalConfig = {
    icon: '⏹️',
    title: 'Завершить выборы досрочно?',
    message:
      'Вы точно хотите завершить выборы губернатора прямо сейчас?<br/>Голоса будут подсчитаны и результат оглашён.',
    confirmText: 'Да!',
    cancelText: 'Нет!',
    confirmDanger: true,
  };
  
  getFirstTypingUser(): string {
    return Array.from(this.typingUsers().values())[0] ?? '';
  }

  pluralizePeople(count: number): string {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod100 >= 11 && mod100 <= 14) return 'человек';
    if (mod10 === 1) return 'человек';
    if (mod10 >= 2 && mod10 <= 4) return 'человека';
    return 'человек';
  }

  /** Локация «Площадь Ленина» и комната «Площадь» — здесь проходят выборы. */
  isLeninSquareRoom(): boolean {
    return this.room().code === RoomCode.LENIN_SQUARE;
  }

  // ── меню «⚡ Действия» ──
  toggleActions(): void {
    this.actionsOpen.update((v) => !v);
  }

  closeActions(): void {
    this.actionsOpen.set(false);
  }

  openInitiateModal(): void {
    this.closeActions();
    this.initiateModalOpen.set(true);
  }

  cancelInitiate(): void {
    this.initiateModalOpen.set(false);
  }

  confirmInitiate(): void {
    const districtId = this.currentUserService.selectedDistrictId();
    if (districtId == null) {
      this.cancelInitiate();
      return;
    }
    this.initiateLoading.set(true);
    this.electionService.initiate(districtId).subscribe({
      next: () => {
        this.initiateLoading.set(false);
        this.initiateModalOpen.set(false);
        this.electionMessage.set({
          kind: 'ok',
          text: 'Выборы губернатора начались! Жителям района отправлены уведомления.',
        });
        this.refreshElection.emit();
      },
      error: (err) => {
        this.initiateLoading.set(false);
        this.initiateModalOpen.set(false);
        this.setElectionMessage(
          err?.error?.message ?? 'Не удалось начать выборы (проверьте уровень и наличие губернатора)',
        );
      },
    });
  }

  /** Идут ли прямо сейчас выборы в районе. */
  hasActiveElection(): boolean {
    const o = this.electionOverview();
    return (
      o != null &&
      o.pollId != null &&
      (o.status === PollStatus.ACTIVE || o.status === PollStatus.PENDING)
    );
  }

  openCloseModal(): void {
    if (!this.hasActiveElection()) return;
    this.closeActions();
    this.closeModalOpen.set(true);
  }

  private setElectionMessage(text: string): void {
    this.electionMessage.set({ kind: 'error', text });
    alert(this.electionMessage()?.text)
  }

  confirmCloseElection(): void {
    const pollId = this.electionOverview()?.pollId;
    if (pollId == null) {
      this.cancelCloseElection();
      return;
    }
    this.closingElection.set(true);
    this.electionService.close(pollId).subscribe({
      next: () => {
        this.closingElection.set(false);
        this.closeModalOpen.set(false);
        this.electionMessage.set({
          kind: 'ok',
          text: 'Выборы завершены, результаты оглашены жителям района.',
        });
        this.refreshElection.emit();
      },
      error: (err) => {
        this.closingElection.set(false);
        this.closeModalOpen.set(false);
        this.setElectionMessage(err?.error?.message ?? 'Не удалось завершить выборы');
      },
    });
  }


  cancelCloseElection(): void {
    this.closeModalOpen.set(false);
  }
}
