import { Component, output, signal, computed, OnInit } from '@angular/core';
import {
  EMOJI_CATEGORIES,
  EmojiCategory,
  addToRecent,
  getRecentEmoji
} from '../../emoji-data';

@Component({
  selector: 'app-emoji-panel',
  templateUrl: './emoji-panel.html',
  styleUrl: './emoji-panel.scss'
})
export class EmojiPanel implements OnInit {
  emojiSelected = output<string>();

  categories = signal<EmojiCategory[]>([]);
  activeCategory = signal<string>('smileys');
  searchQuery = signal<string>('');

  // фильтрованные emoji по поиску
  searchResults = computed(() => {
    const q = this.searchQuery().trim();
    if (!q) return [];
    return EMOJI_CATEGORIES
      .flatMap(c => c.emojis)
      .filter(e => e.includes(q))
      .slice(0, 50);
  });

  ngOnInit() {
    const cats = [...EMOJI_CATEGORIES];
    // обновляем недавние
    cats[0].emojis = getRecentEmoji();
    this.categories.set(cats);

    // если нет недавних — пропускаем эту вкладку
    if (cats[0].emojis.length === 0) {
      this.activeCategory.set('smileys');
    } else {
      this.activeCategory.set('recent');
    }
  }

  get activeEmojis(): string[] {
    if (this.searchQuery().trim()) return this.searchResults();
    return this.categories().find(c => c.id === this.activeCategory())?.emojis ?? [];
  }

  selectEmoji(emoji: string) {
    addToRecent(emoji);
    // обновляем недавние в списке категорий
    const cats = [...this.categories()];
    cats[0].emojis = getRecentEmoji();
    this.categories.set(cats);
    this.emojiSelected.emit(emoji);
  }

  setCategory(id: string) {
    this.activeCategory.set(id);
    this.searchQuery.set('');
  }

  get visibleCategories(): EmojiCategory[] {
    return this.categories().filter(c =>
      c.id !== 'recent' || c.emojis.length > 0
    );
  }
}