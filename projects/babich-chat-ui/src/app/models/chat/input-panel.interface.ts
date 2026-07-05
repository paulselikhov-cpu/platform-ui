/**
 * Типы панелей над строкой ввода.
 * Расширяемая система — добавить новую панель = добавить тип сюда.
 */
export type InputPanelType = 'emoji' | 'gif' | 'sticker' | null;

/**
 * Тип вложения в сообщении.
 */
export interface IAttachment {
  file: File;
  preview: string | null; // base64 для картинок, null для других файлов
  type: 'image' | 'video' | 'audio' | 'file';
}