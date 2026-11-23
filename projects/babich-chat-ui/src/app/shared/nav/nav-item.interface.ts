/**
 * Команда пункта навигации — что сделать при выборе.
 *
 * Один пункт может иметь несколько команд: десктоп открывает районные
 * разделы в модальном окне, мобилка — переходом по маршруту. Раскладка
 * выбирает первую команду, которую умеет выполнить (см.
 * `pickCommand()`), поэтому список пунктов остаётся плоскими данными и
 * одинаковым для обеих платформ.
 */
export type NavCommand =
  /** Открыть модальное окно NavRail (десктоп). */
  | { readonly type: 'open-modal'; readonly tab: NavModalTab }
  /** Перейти по маршруту (мобильный вариант того же раздела). */
  | { readonly type: 'navigate'; readonly commands: readonly (string | number)[] };

/** Модальные окна, открываемые из пунктов навигации. */
export type NavModalTab = 'user-settings' | 'info' | 'notification' | 'district-settings';

/**
 * Куда относится пункт: локации, район или персонаж.
 *
 * Группировка нужна обеим раскладкам: десктопный NavRail показывает все
 * группы в одной колонке, мобильные табы — только свою.
 */
export type NavGroup = 'locations' | 'district' | 'profile';

/**
 * Один пункт навигации: плоские данные без DOM и без зависимостей на сервисы.
 * Условия видимости, бейджи и доступность вычисляются в `buildNavItems()`,
 * поэтому список истинен в одном месте, а раскладки только его рисуют.
 */
export interface NavItem {
  /** Идентификатор пункта (для track и проверок). */
  readonly id: string;
  /** Эмодзи-иконка. */
  readonly icon: string;
  /** Подпись: заголовок в мобильном меню и `title` кнопки в NavRail. */
  readonly label: string;
  /** Группа (см. {@link NavGroup}). */
  readonly group: NavGroup;
  /** Команды по убыванию предпочтения для текущей раскладки. */
  readonly commands: readonly NavCommand[];
  /** Пункт видно только если вернул true (по умолчанию виден). */
  readonly visible?: () => boolean;
  /** Пункт неактивен: клик обрабатывается, но команда не выполняется. */
  readonly disabled?: () => boolean;
  /** Число для бейджа (например непрочитанные уведомления); 0 — бейджа нет. */
  readonly badge?: () => number;
}

/**
 * Первая команда, которую раскладка умеет выполнить.
 *
 * `open-modal` понимает только десктоп, `navigate` — любая раскладка, поэтому
 * при недоступном типе берётся следующая команда пункта.
 */
export function pickCommand(item: NavItem, supported: readonly NavCommand['type'][]): NavCommand {
  const command = item.commands.find((c) => supported.includes(c.type));
  if (!command) {
    throw new Error(`Пункт «${item.id}» не поддерживается раскладкой: нет команды из [${supported}]`);
  }
  return command;
}

/** Отфильтровать пункты по условию видимости. */
export function visibleNavItems(items: readonly NavItem[]): NavItem[] {
  return items.filter((item) => item.visible?.() ?? true);
}