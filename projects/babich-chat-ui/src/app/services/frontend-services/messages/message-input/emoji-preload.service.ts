import { Injectable } from '@angular/core';
import { EMOJI_CATEGORIES, emojiUrl } from '../../../../shared/components/message-input/emoji-data';

@Injectable({ providedIn: 'root' })
export class EmojiPreloadService {
  private loadedUrls = new Set<string>();
  private loadingPromises = new Map<string, Promise<void>>();

  /** Прогружает картинки категории в браузерный кэш. Дедуплицирует параллельные вызовы. */
  loadCategory(categoryId: string): Promise<void> {
    const existing = this.loadingPromises.get(categoryId);
    if (existing) return existing;

    const cat = EMOJI_CATEGORIES.find(c => c.id === categoryId);
    if (!cat) return Promise.resolve();

    const promise = Promise.allSettled(
      cat.emojis.map(e => this.loadImage(emojiUrl(e.file)))
    ).then(() => void 0);

    this.loadingPromises.set(categoryId, promise);
    return promise;
  }

  /** Фоновый прогрев остальных вкладок, когда браузер свободен — чтобы переключение было мгновенным. */
  preloadIdle(categoryIds: string[]): void {
    const run = () => categoryIds.forEach(id => this.loadCategory(id));
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(run, { timeout: 2000 });
    } else {
      setTimeout(run, 500);
    }
  }

  isLoaded(url: string): boolean {
    return this.loadedUrls.has(url);
  }

  private loadImage(url: string): Promise<void> {
    if (this.loadedUrls.has(url)) return Promise.resolve();
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => { this.loadedUrls.add(url); resolve(); };
      img.onerror = () => resolve();
      img.src = url;
    });
  }
}