import { Pipe, PipeTransform } from '@angular/core';
import { EMOJI_CATEGORIES } from '../shared/components/message-input/emoji-data';

// строим словарь code → file один раз при загрузке
const CODE_MAP = new Map<string, string>();
EMOJI_CATEGORIES.forEach(cat =>
  cat.emojis.forEach(e => CODE_MAP.set(e.code, e.file))
);

const BASE_URL = '/static/standart_dark_skin/';

@Pipe({ name: 'emojiParse', pure: true })
export class EmojiParsePipe implements PipeTransform {
  transform(text: string): string {
    if (!text) return '';

    // экранируем HTML чтобы не было XSS
    let safe = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    // заменяем коды смайликов на <img>
    CODE_MAP.forEach((file, code) => {
      const escaped = code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      safe = safe.replace(
        new RegExp(escaped, 'g'),
        `<img src="${BASE_URL}${file}" alt="${code}" title="${code}" class="emoji-img" loading="lazy" />`
      );
    });

    // переносы строк → <br>
    safe = safe.replace(/\n/g, '<br>');

    return safe;
  }
}