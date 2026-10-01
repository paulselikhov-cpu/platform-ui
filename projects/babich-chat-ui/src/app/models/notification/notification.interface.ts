import { ApplicationStatus, ApplicationType } from '../economy/application.interface';

/**
 * Типизированные контекстные данные уведомления (поле `data` бэкенда).
 * Для APPLICATION_RESULT содержит тип и статус заявки — фронт по ним решает,
 * что делать (например, перезагрузить профиль после одобрения паспорта/лицензии).
 */
export interface INotificationContextData {
  applicationType?: ApplicationType;
  applicationStatus?: ApplicationStatus;
  /** Код площади Ленина района — цель перехода из уведомления о старте выборов. */
  electionLocationCode?: string;
  /** id экрана раздела фичи локации (у площади Ленина — «election»). */
  electionFeatureId?: string;
  [key: string]: unknown;
}

export interface INotification {
  id: number;
  recipientCharacterId: number;
  title: string;
  body: string;
  notificationType: string | null; //TODO ТИПИЗИРОВАТЬ под enum
  relatedEntityId: number | null;
  read: boolean;
  requiresAction: boolean;
  actionStatus: string | null;
  createdAt: string;
  data?: INotificationContextData | null;
}
