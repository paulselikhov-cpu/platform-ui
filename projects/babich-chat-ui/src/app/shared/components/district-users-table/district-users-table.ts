import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { IChatUser, ChatRole, Profession } from '../../../models/chatUser/chatUser.interface';
import { ChatUserService } from '../../../services/backend-services/http/chat-user.service';
import { CurrentChatUserService } from '../../../services/current-chat-user.service';
import { MessageService } from '../../../services/message.service';

type EditableKey = 'role' | 'profession' | 'gameStatus' | 'coinBalance' | 'energy' | 'rating' | 'xpUser';
type Editable = Pick<IChatUser, EditableKey>;

export const ROLE_ORDER: ChatRole[] = [
  ChatRole.ADMIN,
  ChatRole.MODERATOR,
  ChatRole.USER,
  ChatRole.GUEST,
];
export const PROFESSION_ORDER: Profession[] = [Profession.UNEMPLOYED, Profession.DVORNIK];
export const GAME_STATUS_ORDER = ['HOMELESS', 'RESIDENT'];

/**
 * Универсальная админская таблица персонажей района.
 * Редактируемые поля chat_users: роль, профессия, игровой статус, баланс монет,
 * энергия, рейтинг. Поиск по персонажу/аккаунту. Сохранение изменённых строк.
 * Может переиспользоваться в других админских экранах.
 */
@Component({
  selector: 'app-district-users-table',
  standalone: true,
  templateUrl: './district-users-table.html',
  styleUrl: './district-users-table.scss',
})
export class DistrictUsersTable {
  readonly districtId = input.required<number>();

  private readonly chatUserService = inject(ChatUserService);
  private readonly currentUserService = inject(CurrentChatUserService);
  private readonly messageService = inject(MessageService);

  readonly characters = signal<IChatUser[]>([]);
  readonly query = signal('');
  readonly loading = signal(false);
  readonly saving = signal(false);

  /** Снимок исходных значений при загрузке — для определения изменений. */
  private originals = new Map<number, Editable>();
  private loadedDistrict: number | null = null;

  readonly roleOptions = ROLE_ORDER;
  readonly professionOptions = PROFESSION_ORDER;
  readonly statusOptions = GAME_STATUS_ORDER;

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const list = this.characters();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.characterName.toLowerCase().includes(q) ||
        (c.username?.toLowerCase() ?? '').includes(q),
    );
  });

  readonly hasChanges = computed(() => this.changedCharacters().length > 0);

  private readonly changedCharacters = computed(() =>
    this.characters().filter((c) => this.isChanged(c)),
  );

  constructor() {
    effect(() => {
      const id = this.districtId();
      if (id != null && id !== this.loadedDistrict) {
        this.loadedDistrict = id;
        this.load();
      }
    });
  }

  load(): void {
    this.loading.set(true);
    this.chatUserService.getDistrictCharacters(this.districtId()).subscribe({
      next: (list) => {
        this.characters.set(list);
        this.originals = new Map(list.map((c) => [c.id, this.pickEditable(c)]));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.error('Не удалось загрузить персонажей района');
      },
    });
  }

  private pickEditable(c: IChatUser): Editable {
    return {
      role: c.role,
      profession: c.profession,
      gameStatus: c.gameStatus,
      coinBalance: c.coinBalance,
      energy: c.energy,
      rating: c.rating,
      xpUser: c.xpUser,
    };
  }

  private isChanged(c: IChatUser): boolean {
    const orig = this.originals.get(c.id);
    if (!orig) return false;
    const cur = this.pickEditable(c);
    return (
      orig.role !== cur.role ||
      orig.profession !== cur.profession ||
      orig.gameStatus !== cur.gameStatus ||
      orig.coinBalance !== cur.coinBalance ||
      orig.energy !== cur.energy ||
      orig.rating !== cur.rating ||
      orig.xpUser !== cur.xpUser
    );
  }

  /** Обновить одно значение в рабочей копии персонажа. */
  private setField(c: IChatUser, key: EditableKey, value: unknown): void {
    this.characters.update((list) =>
      list.map((x) => (x.id === c.id ? { ...x, [key]: value } : x)),
    );
  }

  onRoleChange(c: IChatUser, value: string): void {
    if (!ROLE_ORDER.includes(value as ChatRole)) return;
    this.setField(c, 'role', value as ChatRole);
  }

  onProfessionChange(c: IChatUser, value: string): void {
    if (!PROFESSION_ORDER.includes(value as Profession)) return;
    this.setField(c, 'profession', value as Profession);
  }

  onStatusChange(c: IChatUser, value: string): void {
    if (!GAME_STATUS_ORDER.includes(value)) return;
    this.setField(c, 'gameStatus', value);
  }

  onNumberChange(c: IChatUser, key: 'coinBalance' | 'energy' | 'rating' | 'xpUser', raw: string): void {
    const n = Number(raw);
    if (Number.isNaN(n)) return;
    this.setField(c, key, n);
  }

  roleLabel(role: ChatRole | string): string {
    switch (role) {
      case ChatRole.ADMIN: return 'Администратор';
      case ChatRole.MODERATOR: return 'Модератор';
      case ChatRole.USER: return 'Пользователь';
      case ChatRole.GUEST: return 'Гость';
      default: return String(role);
    }
  }

  professionLabel(p: Profession | string): string {
    switch (p) {
      case Profession.UNEMPLOYED: return 'Безработный';
      case Profession.DVORNIK: return 'Дворник';
      default: return String(p);
    }
  }

  statusLabel(s: string): string {
    switch (s) {
      case 'HOMELESS': return 'Бомж';
      case 'RESIDENT': return 'Житель';
      default: return s;
    }
  }

  save(): void {
    const changed = this.changedCharacters();
    if (changed.length === 0) return;

    this.saving.set(true);
    this.applyNext(changed, 0);
  }

  private applyNext(chars: IChatUser[], index: number): void {
    if (index >= chars.length) {
      this.saving.set(false);
      this.originals = new Map(chars.map((c) => [c.id, this.pickEditable(c)]));
      this.messageService.success('Успешно сохранено');
      this.refreshOwnIfNeeded(chars);
      this.load();
      return;
    }
    const c = chars[index];
    this.chatUserService
      .updateCharacterSettings(c.id, {
        role: c.role,
        profession: c.profession,
        gameStatus: c.gameStatus,
        coinBalance: c.coinBalance,
        energy: c.energy,
        rating: c.rating,
        xpUser: c.xpUser,
      })
      .subscribe({
        next: () => this.applyNext(chars, index + 1),
        error: () => {
          this.saving.set(false);
          this.messageService.error('Ошибка сохранения');
        },
      });
  }

  /** Если среди сохранённых есть текущий персонаж — перезагружаем его профиль (панель обновится без F5). */
  private refreshOwnIfNeeded(chars: IChatUser[]): void {
    const ownId = this.currentUserService.currentChatUser()?.id;
    if (ownId != null && chars.some((c) => c.id === ownId)) {
      this.currentUserService.refresh();
    }
  }
}

