import { Component, output, signal, computed, OnInit } from '@angular/core';
import {
  EMOJI_CATEGORIES,
  EmojiCategory,
  IcqEmoji,
  addToRecent,
  getRecentEmoji,
  emojiUrl
} from '../../emoji-data';

@Component({
  selector: 'app-emoji-panel',
  templateUrl: './emoji-panel.html',
  styleUrl: './emoji-panel.scss'
})
export class EmojiPanel implements OnInit {
  emojiSelected = output<IcqEmoji>();

  categories = signal<EmojiCategory[]>([]);
  activeCategory = signal<string>('emotions');
  searchQuery = signal<string>('');

  readonly emojiUrl = emojiUrl;

  searchResults = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return [];
    return EMOJI_CATEGORIES
      .flatMap(c => c.emojis)
      .filter(e => e.title.toLowerCase().includes(q) || e.code.includes(q))
      .slice(0, 48);
  });

  ngOnInit() {
    const cats = [...EMOJI_CATEGORIES];
    cats[0].emojis = getRecentEmoji();
    this.categories.set(cats);

    this.activeCategory.set(cats[0].emojis.length > 0 ? 'recent' : 'emotions');
  }

  get activeEmojis(): IcqEmoji[] {
    if (this.searchQuery().trim()) return this.searchResults();
    return this.categories().find(c => c.id === this.activeCategory())?.emojis ?? [];
  }

  selectEmoji(emoji: IcqEmoji): void {
    addToRecent(emoji);
    const cats = [...this.categories()];
    cats[0].emojis = getRecentEmoji();
    this.categories.set(cats);
    this.emojiSelected.emit(emoji);
  }

  setCategory(id: string): void {
    this.activeCategory.set(id);
    this.searchQuery.set('');
  }

  get visibleCategories(): EmojiCategory[] {
    return this.categories().filter(c =>
      c.id !== 'recent' || c.emojis.length > 0
    );
  }
}