import { Injectable, signal } from '@angular/core';

export interface MessageContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  messageId: number;
  isOwnMessage: boolean;  // для показа кнопки удалить
  content: string;        // для копирования
}

@Injectable({ providedIn: 'root' })
export class MessageContextMenuService {

  state = signal<MessageContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    messageId: -1,
    isOwnMessage: false,
    content: ''
  });

  open(x: number, y: number, messageId: number, isOwnMessage: boolean, content: string) {
    // корректируем позицию
    const menuWidth = 200;
    const menuHeight = 180;
    const adjustedX = x + menuWidth > window.innerWidth ? x - menuWidth : x;
    const adjustedY = y + menuHeight > window.innerHeight ? y - menuHeight : y;

    this.state.set({
      visible: true,
      x: adjustedX,
      y: adjustedY,
      messageId,
      isOwnMessage,
      content
    });
  }

  close() {
    this.state.update(s => ({ ...s, visible: false }));
  }
}