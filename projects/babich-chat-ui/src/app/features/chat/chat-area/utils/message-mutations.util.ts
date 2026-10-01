import { IChatMessageResponse } from "../../../../models/messages/message.interface";
import { isChatMessage } from "../../../../type-guards/chat-message.guard";


/**
 * Помечает сообщения с указанными id как удалённые, не мутируя исходные объекты.
 * Общая логика для трёх сценариев: realtime DELETE-broadcast, единичное
 * и групповое удаление.
 */
export function markMessagesDeleted(
  messages: IChatMessageResponse[],
  ids: Set<number> | number[],
): IChatMessageResponse[] {
  const idSet = ids instanceof Set ? ids : new Set(ids);

  return messages.map(message => {
    if (!isChatMessage(message) || !idSet.has(message.id)) return message;
    return { ...message, isDeleted: true, content: 'Сообщение удалено' };
  });
}