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
  REGISTER_PASSPORT = 'REGISTER_PASSPORT',
  REGISTER_WORK_LICENCE = 'REGISTER_WORK_LICENCE',
}

/** Человеко-понятные названия типов заявок (ключи фильтров). */
export const APPLICATION_TYPE_LABELS: Record<ApplicationType, string> = {
  [ApplicationType.REGISTER_PASSPORT]: 'Заявка на получение паспорта',
  [ApplicationType.BUY_FIRST_LOCATION]: 'Заявка на покупку первой локации',
  [ApplicationType.REGISTER_WORK_LICENCE]: 'Заявка на получения лицензии для работы',
};


export enum ApplicationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}
