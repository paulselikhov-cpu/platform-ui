export interface INotification {
  id: number;
  recipientCharacterId: number;
  title: string;
  body: string;
  notificationType: string | null;
  relatedEntityId: number | null;
  read: boolean;
  requiresAction: boolean;
  actionStatus: string | null;
  createdAt: string;
}
