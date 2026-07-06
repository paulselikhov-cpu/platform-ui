// emoji-parse.pipe.ts
import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { EMOJI_CATEGORIES } from '../shared/components/message-input/emoji-data';

const CODE_MAP = new Map<string, string>();
EMOJI_CATEGORIES.forEach(cat =>
  cat.emojis.forEach(e => CODE_MAP.set(e.code, e.file))
);

const BASE_URL = '/static/standart_dark_skin/';

@Pipe({ name: 'emojiParse', pure: true })
export class EmojiParsePipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(text: string): SafeHtml {
    if (!text) return '';

    let safe = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    CODE_MAP.forEach((file, code) => {
      const escaped = code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      safe = safe.replace(
        new RegExp(escaped, 'g'),
        `<img src="${BASE_URL}${file}" alt="${code}" title="${code}" class="emoji-img" loading="lazy" />`
      );
    });

    safe = safe.replace(/\n/g, '<br>');

    return this.sanitizer.bypassSecurityTrustHtml(safe);
  }
}