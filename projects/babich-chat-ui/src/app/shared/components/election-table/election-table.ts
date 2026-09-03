import { Component, computed, effect, input, output, signal } from '@angular/core';
import { IElectionOverview, IElectionCandidate, PollStatus } from '../../../models/poll/election.interface';

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
  readonly overview = input<IElectionOverview | null>(null);
  readonly busy = input<boolean>(false);
  /** id текущего персонажа — чтобы запретить голосование за самого себя. */
  readonly characterId = input<number | null>(null);

  readonly joinCandidate = output<void>();
  readonly voteCandidate = output<number>();

  /** тикает каждую секунду, пока голосование активно — для таймера окончания. */
  private readonly clock = signal(Date.now());

  readonly isActive = computed(
    () =>
      this.overview() != null &&
      (this.overview()!.status === PollStatus.ACTIVE ||
        this.overview()!.status === PollStatus.PENDING),
  );

  readonly isClosed = computed(
    () => this.overview() != null && this.overview()!.status === PollStatus.CLOSED,
  );

  /** Нет выборов в районе (нет poll вообще) — подсказка. */
  readonly isEmpty = computed(
    () => this.overview() != null && !this.overview()!.active && this.overview()!.pollId == null,
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

  readonly totalVoted = computed(() => this.overview()?.totalVoted ?? 0);
  readonly aliveCount = computed(() => this.overview()?.aliveCount ?? 0);
  readonly myVoted = computed(() => this.overview()?.myVoted ?? false);
  readonly myCandidate = computed(() => this.overview()?.myCandidate ?? false);

  readonly candidates = computed<IElectionCandidate[]>(() => this.overview()?.candidates ?? []);

  readonly remainingLabel = computed(() => {
    const endsAt = this.overview()?.endsAt;
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
    return this.overview()?.status === PollStatus.CLOSED ? 'Итоги' : 'Кандидаты';
  }
}
