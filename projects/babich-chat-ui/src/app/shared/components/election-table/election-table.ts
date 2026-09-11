import { Component, computed, effect, inject, input, model, output, signal } from '@angular/core';
import { IElectionOverview, IElectionCandidate, PollStatus } from '../../../models/poll/election.interface';
import { CurrentChatUserService } from '../../../services/current-chat-user.service';
import { ElectionService } from '../../../services/backend-services/http/election.service';

/**
 * Мини-таблица выборов губернатора на Площади Ленина (сценарий №2).
 * Презентационный компонент: показывает шапку со счётчиком проголосовавших,
 * таймер до окончания и 5 слотов-кандидатов. Действия (выдвинуться/проголосовать)
 * пробрасываются наружу через выходы — HTTP и обновление состояния на родителе.
 */
@Component({
  selector: 'app-election-table',
  standalone: true,
  templateUrl: './election-table.html',
  styleUrl: './election-table.scss',
})
export class ElectionTable {
  private readonly currentUserService = inject(CurrentChatUserService);
  private readonly electionService = inject(ElectionService);
  
  readonly electionOverview = model<IElectionOverview | null>(null);
  readonly refreshElection = output<void>();

  readonly electionBusy = signal(false);       // во время join/vote

  /** тикает каждую секунду, пока голосование активно — для таймера окончания. */
  private readonly clock = signal(Date.now());

  readonly isActive = computed(
    () =>
      this.electionOverview() != null &&
      (this.electionOverview()!.status === PollStatus.ACTIVE ||
        this.electionOverview()!.status === PollStatus.PENDING),
  );

  readonly isClosed = computed(
    () => this.electionOverview() != null && this.electionOverview()!.status === PollStatus.CLOSED,
  );

  /** Нет выборов в районе (нет poll вообще) — подсказка. */
  readonly isEmpty = computed(
    () => this.electionOverview() != null && !this.electionOverview()!.active && this.electionOverview()!.pollId == null,
  );

  constructor() {
    effect((onCleanup) => {
      // живой таймер только пока идут выборы
      if (!this.isActive()) return;
      this.clock.set(Date.now());
      const id = setInterval(() => this.clock.set(Date.now()), 1000);
      onCleanup(() => clearInterval(id));
    });
  }

  readonly totalVoted = computed(() => this.electionOverview()?.totalVoted ?? 0);
  readonly aliveCount = computed(() => this.electionOverview()?.aliveCount ?? 0);
  readonly myVoted = computed(() => this.electionOverview()?.myVoted ?? false);
  readonly myCandidate = computed(() => this.electionOverview()?.myCandidate ?? false);

  readonly candidates = computed<IElectionCandidate[]>(() => this.electionOverview()?.candidates ?? []);
  readonly characterId = computed( () => this.currentUserService.currentChatUser()?.id);

  readonly remainingLabel = computed(() => {
    const endsAt = this.electionOverview()?.endsAt;
    if (!endsAt) return '';
    let ms = endsAt - this.clock();
    if (ms < 0) ms = 0;
    const totalSec = Math.floor(ms / 1000);
    const hh = Math.floor(totalSec / 3600);
    const mm = Math.floor((totalSec % 3600) / 60);
    const ss = totalSec % 60;
    const p = (n: number) => String(n).padStart(2, '0');
    return `${hh}:${p(mm)}:${p(ss)}`;
  });

  percent(candidate: IElectionCandidate): number {
    const total = this.totalVoted();
    if (total <= 0 || candidate.votes <= 0) return 0;
    return Math.round((candidate.votes / total) * 100);
  }

  canVoteFor(candidate: IElectionCandidate): boolean {
    return (
      this.isActive() &&
      !this.myVoted() &&
      candidate.characterId != null &&
      candidate.characterId !== this.characterId()
    );
  }

  get slotLabel(): string {
    return this.electionOverview()?.status === PollStatus.CLOSED ? 'Итоги' : 'Кандидаты';
  }

  voteForCandidate(candidateId: number): void {
    const pollId = this.electionOverview()?.pollId;
    if (pollId == null) return;
    this.electionBusy.set(true);
    this.electionService.vote(pollId, candidateId).subscribe({
      next: () => {
        this.electionBusy.set(false);
        console.log({ kind: 'ok', text: 'Ваш голос учтён!' });
        this.refreshElection.emit();
      },
      error: (err) => {
        this.electionBusy.set(false);
        console.log({ kind: 'error', text: err?.error?.message ?? 'Не удалось проголосовать' })
      },
    });
  }

  joinElectionAsCandidate(): void {
    const pollId = this.electionOverview()?.pollId;
    if (pollId == null) return;
    this.electionBusy.set(true);
    this.electionService.join(pollId).subscribe({
      next: () => {
        this.electionBusy.set(false);
        console.log({ kind: 'ok', text: 'Вы выдвинули свою кандидатуру!' });
        this.refreshElection.emit();
      },
      error: (err) => {
        this.electionBusy.set(false);
        console.log({ kind: 'error', text: err?.error?.message ?? 'Не удалось выдвинуть кандидатуру' })
      },
    });
  }
}
