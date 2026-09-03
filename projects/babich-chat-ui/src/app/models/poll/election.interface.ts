export enum PollStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  AUTO_ENACTED = 'AUTO_ENACTED',
}

export enum PollType {
  ELECTION = 'ELECTION',
  RECALL = 'RECALL',
  AMENDMENT_VOTE = 'AMENDMENT_VOTE',
  COMMUNITY_CHOICE = 'COMMUNITY_CHOICE',
}

export enum ScopeType {
  DISTRICT = 'DISTRICT',
  LOCATION = 'LOCATION',
  CHARACTER = 'CHARACTER',
}

export interface IPoll {
  id: number;
  scopeType: ScopeType | string;
  scopeId: number;
  locationId: number;
  pollType: PollType | string;
  hasCandidates: boolean;
  weightStrategy: string;
  startsAt: string;
  endsAt: string;
  quorumThreshold: number;
  status: PollStatus | string;
  parentPollId: number | null;
  sourceApplicationId: number | null;
  createdAt: string;
}

export interface IPollCandidate {
  id: number;
  pollId: number;
  characterId: number | null;
  slotNumber: number;
  voteCount: number;
}

export interface IPollVote {
  id: number;
  pollId: number;
  characterId: number;
  candidateId: number;
  weight: number;
  votedAt: string;
}

/** Кандидат/слот в мини-таблице выборов. */
export interface IElectionCandidate {
  slotNumber: number;
  candidateId: number;
  characterId: number | null;
  name: string | null;
  votes: number;
}

/**
 * Проекция состояния выборов района (ответ GET /api/elections/district/{id}/overview).
 * Используется мини-таблицей голосования на Площади Ленина.
 */
export interface IElectionOverview {
  active: boolean;
  pollId: number | null;
  status: PollStatus | string | null;
  /** Момент окончания в epoch-millis (null если закрыто/нет poll). */
  endsAt: number | null;
  totalVoted: number;
  aliveCount: number;
  quorumThreshold: number;
  quorumReached: boolean;
  myVoted: boolean;
  myCandidate: boolean;
  winnerName: string | null;
  candidates: IElectionCandidate[];
}
