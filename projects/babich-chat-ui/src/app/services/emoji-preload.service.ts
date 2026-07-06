import { Injectable } from '@angular/core';
import { EMOJI_CATEGORIES, emojiUrl } from '../shared/components/message-input/emoji-data';

type LoadState = 'idle' | 'loading' | 'loaded';

@Injectable({ providedIn: 'root' })
export class EmojiPreloadService {
  private categoryState = new Map<string, LoadState>();
  private loadedUrls = new Set<string>();

  constructor() {
    EMOJI_CATEGORIES.forEach(category => this.categoryState.set(category.id, 'idle'));
  }

  // вызывается при открытии пикера и переключении вкладки
  loadCategory(categoryId: string): void {
    if (this.categoryState.get(categoryId) === 'loaded') return;
    if (this.categoryState.get(categoryId) === 'loading') return;

    this.categoryState.set(categoryId, 'loading');

    const cat = EMOJI_CATEGORIES.find(c => c.id === categoryId);
    if (!cat) return;

    Promise.allSettled(
      cat.emojis.map(e => this.loadImage(emojiUrl(e.file)))
    ).then(() => {
      this.categoryState.set(categoryId, 'loaded');
    });
  }

  isCategoryLoaded(id: string): boolean {
    return this.categoryState.get(id) === 'loaded';
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