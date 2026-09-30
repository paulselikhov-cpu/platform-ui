import { Injectable, inject, signal, effect, OnDestroy } from '@angular/core';
import { AuthService } from './backend-services/base/auth.service';
import { ChatUserService, CreateChatUserRequest } from './backend-services/http/chat-user.service';
import { StompConnectionService } from './backend-services/base/stomp-connection.service';
import { IChatUser } from '../models/chatUser/chatUser.interface';
import { tap } from 'rxjs/operators';
import { Observable, Subscription } from 'rxjs';

const STORAGE_KEY_DISTRICT = 'babich_current_district_id';

/**
 * Управляет состоянием текущего авторизованного ChatUser в рамках района.
 * Автоматически загружает полный профиль после логина по userId + districtId.
 *
 * Подписан на WS /user/queue/character-updated: когда какое-либо действие
 * на сервере меняет ChatUser (одобрение паспорта/лицензии, админская правка),
 * профиль перезагружается без F5. Это дублирующий к реакции-на-уведомления
 * канал: сервер сам сообщает факт изменения, а не заставляет фронт угадывать
 * его по типу заявки.
 */
@Injectable({ providedIn: 'root' })
export class CurrentChatUserService implements OnDestroy {
  private authService = inject(AuthService);
  private chatUserService = inject(ChatUserService);
  private stomp = inject(StompConnectionService);

  currentChatUser = signal<IChatUser | null>(null);
  /**
   * Есть ли у текущего аккаунта персонаж в выбранном районе.
   * null — состояние ещё не проверено (запрос в полёте / пользователь не авторизован),
   * false — района нет или персонаж в нём не создан, true — персонаж есть.
   * Только `false` — повод не держать пользователя в /chat (см. ChatLayout).
   */
  hasCharacter = signal<boolean | null>(null);
  selectedDistrictId = signal<number | null>(this.loadDistrictId());
  userLevel = signal<number>(0);
  /** Порог XP следующего уровня — с бэкенда (PersonLevel.xpThreshold). null = ещё не загружен. */
  xpThreshold = signal<number | null>(null);

  private characterUpdatedSub: Subscription | null = null;

  constructor() {
    // Автозагрузка при изменении авторизации или выбранного района
    effect(() => {
      const authUser = this.authService.currentUser();
      const districtId = this.selectedDistrictId();
      if (authUser?.userId && districtId) {
        this.loadChatUser(authUser.userId, districtId);
      } else {
        this.currentChatUser.set(null);
        // Авторизован, но район не выбран — персонажа нет по определению, состояние известно.
        // Не авторизован — проверять нечего, состояние остаётся неизвестным.
        this.hasCharacter.set(authUser?.userId ? false : null);
      }
    });

    this.characterUpdatedSub = this.stomp
      .topic<{ characterId: number }>('/user/queue/character-updated')
      .subscribe(() => this.refresh());
  }

  /**
   * Установить выбранный район (например, при выборе на экране DistrictSelect).
   * Сохраняет в localStorage для сохранения между сессиями.
   */
  setDistrictId(districtId: number): void {
    this.selectedDistrictId.set(districtId);
    localStorage.setItem(STORAGE_KEY_DISTRICT, districtId.toString());
  }

  private loadDistrictId(): number | null {
    const stored = localStorage.getItem(STORAGE_KEY_DISTRICT);
    return stored ? Number(stored) : null;
  }

  private loadUserLevel(characterId: number): void {
    this.chatUserService.getChatUserLevel(characterId).subscribe((level) => {
      this.userLevel.set(level ?? 0);
    });
    this.chatUserService.getXpThreshold(characterId).subscribe((threshold) => {
      this.xpThreshold.set(threshold);
    });
  }

  private loadChatUser(userId: number, districtId: number): void {
    // Пока идёт запрос — состояние неизвестно, иначе ChatLayout успел бы
    // увести пользователя с /chat до получения ответа.
    this.hasCharacter.set(null);
    this.chatUserService.getChatUserByUserIdAndDistrict(userId, districtId).subscribe({
      next: (chatUser) => {
        if (chatUser) {
          this.currentChatUser.set(chatUser);
          this.loadUserLevel(chatUser.id);
          this.hasCharacter.set(true);
        } else {
          // 204 No Content с бэкенда — персонажа в этом районе ещё нет.
          this.currentChatUser.set(null);
          this.hasCharacter.set(false);
        }
      },
      error: () => {
        // Ошибка запроса — это не «персонажа нет»: из /chat не выкидываем,
        // состояние остаётся неизвестным.
        this.currentChatUser.set(null);
        this.hasCharacter.set(null);
      }
    });
  }

  /**
   * Создать персонажа в выбранном районе и установить как текущего
   */
  createAndSetChatUser(userId: number, request: CreateChatUserRequest): Observable<IChatUser> {
    return this.chatUserService.createChatUser(userId, request).pipe(
      tap((chatUser) => {
        this.currentChatUser.set(chatUser);
        this.hasCharacter.set(true);
        // Загружаем уровень и порог XP и для только что созданного персонажа
        this.loadUserLevel(chatUser.id);
      })
    );
  }

  /**
   * Обновляет текущего пользователя (например, после работы или траты монет).
   */
  updateChatUser(updates: Partial<IChatUser>): void {
    const current = this.currentChatUser();
    if (current) {
      this.currentChatUser.set({ ...current, ...updates });
    }
  }

  /**
   * Перезагружает профиль с сервера (для текущего userId + districtId).
   */
  refresh(): void {
    const userId = this.authService.currentUser()?.userId;
    const districtId = this.selectedDistrictId();
    if (userId && districtId) {
      this.loadChatUser(userId, districtId);
    }
  }

  ngOnDestroy(): void {
    this.characterUpdatedSub?.unsubscribe();
  }

  /**
   * Перезагружает только уровень и порог XP текущего персонажа.
   * Вызывается, когда XP изменился и мог пересечь порог уровня (работа, награды).
   */
  refreshLevel(): void {
    const characterId = this.currentChatUser()?.id;
    if (characterId) {
      this.loadUserLevel(characterId);
    }
  }
}