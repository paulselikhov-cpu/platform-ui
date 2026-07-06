import { Component, output, signal, computed, OnInit, inject } from '@angular/core';
import {
  EMOJI_CATEGORIES,
  EmojiCategory,
  IcqEmoji,
  addToFavourites,
  getFavouritesEmoji,
  emojiUrl
} from '../../emoji-data';
import { EmojiPreloadService } from '../../../../../services/emoji-preload.service';

@Component({
  selector: 'app-emoji-panel',
  templateUrl: './emoji-panel.html',
  styleUrl: './emoji-panel.scss'
})
export class EmojiPanel implements OnInit {
  private preload = inject(EmojiPreloadService);

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

  ngOnInit(): void {
    const categories = [...EMOJI_CATEGORIES];
    categories[0].emojis = getFavouritesEmoji();
    this.categories.set(categories);

    const defaultCat = categories[0].emojis.length > 0 ? 'favourite' : 'emotions';
    this.activeCategory.set(defaultCat);

    // грузим только активную категорию при открытии
    this.preload.loadCategory(defaultCat);
  }

  get activeEmojis(): IcqEmoji[] {
    if (this.searchQuery().trim()) return this.searchResults();
    return this.categories().find(c => c.id === this.activeCategory())?.emojis ?? [];
  }

  selectEmoji(emoji: IcqEmoji): void {
    addToFavourites(emoji);
    const cats = [...this.categories()];
    cats[0].emojis = getFavouritesEmoji();
    this.categories.set(cats);
    this.emojiSelected.emit(emoji);
  }

  setCategory(id: string): void {
    this.activeCategory.set(id);
    this.searchQuery.set('');
    // грузим только когда пользователь открыл вкладку
    this.preload.loadCategory(id);
  }

  get visibleCategories(): EmojiCategory[] {
    return this.categories().filter(c =>
      c.id !== 'favourite' || c.emojis.length > 0
    );
  }

  isCategoryLoaded(id: string): boolean {
    return this.preload.isCategoryLoaded(id);
  }
}