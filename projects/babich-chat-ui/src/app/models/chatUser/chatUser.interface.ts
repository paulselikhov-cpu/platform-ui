import { ILocation } from "../location/location.interface";
import { IUser } from "../user/user.interface";


/**
 * Персонаж чата — расширяет базового User из модуля auth.
 * Один User = один ChatUser (персонаж).
 * Таблица chat_users связана с таблицей users через user_id (JOINED inheritance).
 */
export interface IChatUser extends IUser {
  /**
   * Имя персонажа в игре — отличается от username.
   * Username = логин для входа, characterName = имя в ролевой игре.
   * Например username="ivan123", characterName="Иван Петрович"
   */
  characterName: string;

  /**
   * Глобальная роль персонажа на всей платформе.
   * ADMIN — полный доступ ко всему
   * MODERATOR — может модерировать любую локацию
   * USER — обычный персонаж
   * GUEST — ограниченный доступ
   * Не путать с ролью внутри локации (location_members.role)
   */
  role: ChatRole;

  /**
   * Рейтинг персонажа — растёт от активности и оценок других игроков.
   * В будущем будет влиять на получение Coin и доступные возможности.
   */
  rating: number;

  /**
   * Баланс внутренней валюты Coin.
   * Зарабатывается за активность в чате.
   * Тратится на покупку локаций, комнат, функций персонажа.
   */
  coinBalance: number;

  /**
   * Накопительный XP персонажа (личный прогресс).
   */
  xpUser: number;

  /**
   * Текущая энергия персонажа (0–100).
   */
  energy: number;

  /**
   * Игровой статус: HOMELESS (бомж без жилья) или RESIDENT (житель).
   */
  gameStatus: string;

  /**
   * Профессия персонажа — определяет доступные механики работы.
   */
  profession: string;

  // Поля профиля персонажа
  gender?: string;
  weight?: number;
  height?: number;
  badHabits?: string;
  avatarUrl?: string;

  /**
   * Когда персонаж последний раз был онлайн.
   * Обновляется при каждом WebSocket подключении/отключении.
   * Используется модулем мониторинга.
   */
  lastSeen?: Date;

  /**
   * Локации которыми владеет персонаж (создал сам).
   * Не загружаются пока явно не запросишь для производительности.
   */
  ownedLocations?: ILocation[];

  /**
   * Локации в которых состоит персонаж (вступил по ссылке).
   * Связь многие-ко-многим через таблицу location_members.
   */
  locationMemberships?: any[];
}

export enum ChatRole {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  USER = 'USER',
  GUEST = 'GUEST'
}