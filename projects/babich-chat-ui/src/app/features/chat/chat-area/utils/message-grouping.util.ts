import { IChatMessage } from '../../../../models/messages/message.interface';

/**
 * Как сообщение отрисовывается в ленте: одиночное (с аватаром и ником) или
 * продолжение группы того же автора (аватар и ник скрыты).
 *
 * Группировка нужна, чтобы лента читалась как диалог, а не как таблица:
 * у десяти сообщений подряд от одного человека показывается одна шапка.
 */
export interface GroupedMessage {
  readonly message: IChatMessage;
  /** Начало группы: показываем аватар, ник и отдельный отступ сверху. */
  readonly isGroupStart: boolean;
  /** Последнее в группе: закругляем нижний уголок пузыря. */
  readonly isGroupEnd: boolean;
}

// TODO: настроить API на хронологический порядок сообщений, чтобы убрать сортировку на фронтенде.
export function sortMessagesChronologically<T extends { timestamp: string }>(
  messages: readonly T[],
): T[] {
  return [...messages].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
}

/** Ключ дня в локальной таймзоне: сообщения одного дня попадают в один раздел. */
export function dayKey(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/**
 * Разбить последовательность сообщений на группы по автору.
 *
 * Автор определяется по `character.userId`, а не по имени: переименование
 * персонажа не должно разрывать группу его сообщений.
 *
 * Новая группа начинается, если автор сменился, прошло больше получаса
 * (иначе после паузы в чтении сообщения слиплись бы в одну группу) или
 * предыдущее сообщение было удалено — удалённое не участвует в группе.
 */
export function groupMessages(messages: readonly IChatMessage[]): GroupedMessage[] {
  const GROUP_GAP_MS = 30 * 60 * 1000;

  return messages.map((message, index) => {
    const previous = messages[index - 1];
    const isFirst = previous == null;

    const sameAuthor = !isFirst && previous.character.userId === message.character.userId;
    const closeInTime =
      !isFirst && new Date(message.timestamp).getTime() - new Date(previous.timestamp).getTime() < GROUP_GAP_MS;
    // Разделитель дат и разделитель непрочитанных разрывают визуальную группу,
    // поэтому после них сообщение снова начинает её.
    const breaksAfterPrevious = !isFirst
      && (dayKey(previous.timestamp) !== dayKey(message.timestamp) || previous.isDeleted || message.isDeleted);

    const isGroupStart = !(sameAuthor && closeInTime && !breaksAfterPrevious);

    const next = messages[index + 1];
    const hasNext = next != null;
    const continuesAfter =
      hasNext
      && !next.isDeleted
      && next.character.userId === message.character.userId
      && !message.isDeleted
      && new Date(next.timestamp).getTime() - new Date(message.timestamp).getTime() < GROUP_GAP_MS
      && dayKey(next.timestamp) === dayKey(message.timestamp);

    return { message, isGroupStart, isGroupEnd: !(isGroupStart || continuesAfter) };
  });
}

/**
 * Заголовок перед сообщениями нового дня: «Сегодня» / «Вчера» / дата.
 * Возвращает null, если день не сменился относительно предыдущего сообщения.
 */
export function daySeparatorLabel(
  iso: string,
  previousIso: string | null,
  now: Date = new Date(),
): string | null {
  if (previousIso != null && dayKey(previousIso) === dayKey(iso)) return null;

  const target = new Date(iso);
  const today = dayKey(now.toISOString());
  const yesterday = dayKey(new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());
  const targetKey = dayKey(iso);

  if (targetKey === today) return 'Сегодня';
  if (targetKey === yesterday) return 'Вчера';

  const sameYear = target.getFullYear() === now.getFullYear();
  return target.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}