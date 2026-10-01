import { ConfirmModalConfig } from '../modals/confirm-modal/confirm-modal';
import { Observable } from 'rxjs';

/**
 * Один пункт выпадающего меню «⚡ Действия».
 * Создаётся реализацией фичи локации (LocationFeature) — рендерится общим
 * ActionsMenu, который ничего не знает о конкретике локации.
 */
export interface RoomMenuItem {
  /** Уникальный в рамках меню идентификатор (для track и LocationFeature.onMenuSelected). */
  id: string;
  /** Эмодзи-иконка слева. */
  icon?: string;
  /** Текст пункта. */
  label: string;
  /** Красное оформление (опасные действия). */
  danger?: boolean;
  /** Если задан — перед run() показывается ConfirmModal с этой конфигурацией. */
  confirm?: ConfirmModalConfig;
  /** Пункт показывается только если не задано или вернуло true. */
  visible?: () => boolean;
  /** Пункт неактивен (заглушка) — клики игнорируются. */
  disabled?: boolean;
  /**
   * Действие. Может вернуть Observable/Promise — тогда ActionsMenu держит
   * загрузку в ConfirmModal до завершения. Логика ok/error — в самой фиче.
   */
  run(): void | Observable<unknown>;
}
