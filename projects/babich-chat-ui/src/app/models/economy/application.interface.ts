export interface IApplication {
  id: number;
  userId: number;
  type: ApplicationType;
  status: ApplicationStatus;
  payload?: string;
  resultMessage?: string;
  createdAt: string;
  processedAt?: string;
}

export enum ApplicationType {
  BUY_FIRST_LOCATION = 'BUY_FIRST_LOCATION'
}

export enum ApplicationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}
