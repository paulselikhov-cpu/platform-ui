import { Component, output, signal, computed, OnInit, inject } from '@angular/core';
import {
  EMOJI_CATEGORIES,
  EmojiCategory,
  IcqEmoji,
  addToFavourites,
  getFavouritesEmoji,
  emojiUrl
} from '../../emoji-data';
import { EmojiPreloadService } from '../../services/emoji-preload.service';

@Component({
  selector: 'app-emoji-panel',
  templateUrl: './emoji-panel.html',
  styleUrl: './emoji-panel.scss'
})
export class EmojiPanel implements OnInit {
  private preload = inject(EmojiPreloadService);
  private loadedFiles = signal<Set<string>>(new Set());
  private readonly categories = signal<EmojiCategory[]>([]);

  readonly emojiSelected = output<IcqEmoji>();
  readonly activeCategory = signal<string>('emotions');
  readonly searchQuery = signal<string>('');
  readonly emojiUrl = emojiUrl;

  readonly searchResults = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return [];
    return EMOJI_CATEGORIES
      .flatMap(c => c.emojis)
      .filter(e => e.title.toLowerCase().includes(q) || e.code.includes(q))
      .slice(0, 48);
  });

  get activeEmojis(): IcqEmoji[] {
    if (this.searchQuery().trim()) return this.searchResults();
    return this.categories().find(c => c.id === this.activeCategory())?.emojis ?? [];
  }

  get visibleCategories(): EmojiCategory[] {
    return this.categories().filter(c =>
      c.id !== 'favourite' || c.emojis.length > 0
    );
  }

  ngOnInit(): void {
    const categories = [...EMOJI_CATEGORIES];
    categories[0].emojis = getFavouritesEmoji();
    this.categories.set(categories);

    const defaultCat = categories[0].emojis.length > 0 ? 'favourite' : 'emotions';
    this.activeCategory.set(defaultCat);

    // грузим активную вкладку сразу, остальные — в фоне, когда браузер свободен
    this.preload.loadCategory(defaultCat);
    this.preload.preloadIdle(categories.map(c => c.id).filter(id => id !== defaultCat));
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
    this.preload.loadCategory(id); // no-op, если уже загружено или грузится
  }

  /** Скелетон убирается для конкретной картинки, как только она реально отрисовалась */
  isImageLoaded(file: string): boolean {
    return this.loadedFiles().has(file) || this.preload.isLoaded(this.emojiUrl(file));
  }

  onImageLoad(file: string): void {
    if (this.loadedFiles().has(file)) return;
    const next = new Set(this.loadedFiles());
    next.add(file);
    this.loadedFiles.set(next);
  }
}