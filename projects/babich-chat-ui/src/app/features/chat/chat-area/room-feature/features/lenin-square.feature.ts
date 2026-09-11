import { computed, inject, runInInjectionContext, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { BaseRoomFeature, RoomFeatureContent, RoomFeatureContext } from '../room-feature.interface';
import { RoomMenuItem } from '../../../../../shared/components/actions-menu/room-menu-item.interface';
import { ElectionService } from '../../../../../services/backend-services/http/election.service';
import { CurrentChatUserService } from '../../../../../services/current-chat-user.service';
import { MessageService } from '../../../../../services/message.service';
import { IElectionOverview, PollStatus } from '../../../../../models/poll/election.interface';

const ELECTION_POLL_MS = 8000;

/**
 * Фича комнаты «Площадь Ленина» (сценарий №2 — выборы губернатора).
 * Держит состояние выборов района (мини-таблица в контенте) и действия
 * шапки: выдвижение кандидатуры + досрочное завершение.
 */
export class LeninSquareFeature extends BaseRoomFeature {
  override readonly contentKey: RoomFeatureContent = 'election';

  private electionService!: ElectionService;
  private currentUserService!: CurrentChatUserService;
  private toast!: MessageService;

  /** Проекция состояния выборов района — рисует ElectionPanel/ElectionTable. */
  readonly electionOverview = signal<IElectionOverview | null>(null);
  readonly electionLoading = signal(false);
  private readonly initiateLoading = signal(false);
  private readonly closingLoading = signal(false);
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  /** Идут ли прямо сейчас выборы в районе. */
  readonly hasActiveElection = computed(() => {
    const o = this.electionOverview();
    return (
      o != null &&
      o.pollId != null &&
      (o.status === PollStatus.ACTIVE || o.status === PollStatus.PENDING)
    );
  });

  override readonly menuItems: RoomMenuItem[] = [
    {
      id: 'initiate',
      icon: '🗳️',
      label: 'Выдвинуть свою кандидатуру в губернаторы',
      confirm: {
        icon: '🗳️',
        title: 'Выдвинуть кандидатуру в губернаторы?',
        message:
          'Вы уверены что хотите выдвинуть свою кандидатуру в губернаторы?<br/>После этого в районе начнутся выборы (24 часа).',
        confirmText: 'Да!',
        cancelText: 'Нет!',
        confirmDanger: false,
      },
      run: () => this.initiateElection(),
    },
    {
      id: 'close',
      icon: '⏹️',
      label: 'Завершить выборы досрочно',
      danger: true,
      visible: () => this.hasActiveElection(),
      confirm: {
        icon: '⏹️',
        title: 'Завершить выборы досрочно?',
        message:
          'Вы точно хотите завершить выборы губернатора прямо сейчас?<br/>Голоса будут подсчитаны и результат оглашён.',
        confirmText: 'Да!',
        cancelText: 'Нет!',
        confirmDanger: true,
      },
      run: () => this.closeElection(),
    },
  ];

  constructor(ctx: RoomFeatureContext) {
    super();
    this.init(ctx);
    runInInjectionContext(ctx.injector, () => {
      this.electionService = inject(ElectionService);
      this.currentUserService = inject(CurrentChatUserService);
      this.toast = inject(MessageService);
    });
  }

  /** Поллинг overview, пока пользователь в комнате (cleanup возвращает ядро). */
  override onRoomEnter(): () => void {
    this.refreshElection();
    this.pollTimer = setInterval(() => this.refreshElection(), ELECTION_POLL_MS);
    return () => {
      if (this.pollTimer != null) {
        clearInterval(this.pollTimer);
        this.pollTimer = null;
      }
    };
  }

  /** Перезагрузить состояние выборов района. */
  refreshElection(): void {
    const districtId = this.currentUserService.selectedDistrictId();
    if (districtId == null) return;
    this.electionLoading.set(true);
    this.electionService.getOverview(districtId).subscribe({
      next: (overview) => {
        this.electionOverview.set(overview);
        this.electionLoading.set(false);
      },
      error: () => {
        // не зануляем последние удачные данные — транзиентная ошибка не должна
        // прятать таблицу (иначе после F5 первый сбой оставляет её пустой)
        this.electionLoading.set(false);
        this.toast.error('Не удалось загрузить данные о выборах');
      },
    });
  }

  private initiateElection(): Observable<unknown> | void {
    const districtId = this.currentUserService.selectedDistrictId();
    if (districtId == null) return;
    this.initiateLoading.set(true);
    return this.electionService.initiate(districtId).pipe(
      tap({
        next: () => {
          this.initiateLoading.set(false);
          this.toast.success('Выборы губернатора начались! Жителям района отправлены уведомления.');
          this.refreshElection();
        },
        error: (err) => {
          this.initiateLoading.set(false);
          this.toast.error(
            err?.error?.message ??
              'Не удалось начать выборы (проверьте уровень и наличие губернатора)',
          );
        },
      }),
    );
  }

  private closeElection(): Observable<unknown> | void {
    const pollId = this.electionOverview()?.pollId;
    if (pollId == null) return;
    this.closingLoading.set(true);
    return this.electionService.close(pollId).pipe(
      tap({
        next: () => {
          this.closingLoading.set(false);
          this.toast.success('Выборы завершены, результаты оглашены жителям района.');
          this.refreshElection();
        },
        error: (err) => {
          this.closingLoading.set(false);
          this.toast.error(err?.error?.message ?? 'Не удалось завершить выборы');
        },
      }),
    );
  }
}
