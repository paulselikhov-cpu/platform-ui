import { IChatMessage, IChatMessageResponse, ISystemMessage } from "../models/messages/message.interface";

export function isChatMessage(msg: IChatMessageResponse): msg is IChatMessage {
    return msg.actionType === 'CHAT';
}

export function isDeleteMessage(msg: IChatMessageResponse): msg is IChatMessage {
    return msg.actionType === 'DELETE';
}

export function isSystemMessage(msg: IChatMessageResponse): msg is ISystemMessage {
    return msg.actionType === 'JOIN' || msg.actionType === 'LEAVE';
}