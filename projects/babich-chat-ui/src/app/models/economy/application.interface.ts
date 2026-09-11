export interface IApplication {
  id: number;
  userId: number;
  type: ApplicationType;
  status: ApplicationStatus;
  payload?: string;
  resultMessage?: string;
  createdAt: string;
  processedAt?: string;
  /** Имя заявителя (только для модерации, из /all). */
  applicantUsername?: string;
}

export enum ApplicationType {
  BUY_FIRST_LOCATION = 'BUY_FIRST_LOCATION',
  REGISTER_PASSPORT = 'REGISTER_PASSPORT'
}

export enum ApplicationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}
