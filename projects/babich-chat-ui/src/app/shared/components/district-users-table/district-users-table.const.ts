import {
  IChatUser,
  ChatRole,
  Profession,
} from '../../../models/chatUser/chatUser.interface';
import {
  DTItemOption,
  DTColumn,
} from '../default-table/default-table.component';

const toOptions = (order: string[], labels: Record<string, string>): DTItemOption[] => order.map((v) => ({ value: v, label: labels[v] ?? v }));

export type EditableKey = 'role'| 'profession'| 'gameStatus'| 'coinBalance'| 'energy'| 'rating'| 'xpUser';
export type Editable = Pick<IChatUser, EditableKey>;

export const GAME_STATUS_ITEMS: string[] = ['HOMELESS', 'RESIDENT']; //TODO - вырезать
const STATUS_LABELS: Record<string, string> = {
  HOMELESS: 'Бомж',
  RESIDENT: 'Житель',
}; //TODO - вырезать

export const ROLE_ITEMS: ChatRole[] = [
  ChatRole.ADMIN,
  ChatRole.MODERATOR,
  ChatRole.USER,
  ChatRole.GUEST,
];

export const PROFESSION_ITEMS: Profession[] = [
  Profession.UNEMPLOYED,
  Profession.DVORNIK,
];


const ROLE_LABELS: Record<string, string> = {
  [ChatRole.ADMIN]: 'Администратор',
  [ChatRole.MODERATOR]: 'Модератор',
  [ChatRole.USER]: 'Пользователь',
  [ChatRole.GUEST]: 'Гость',
};

const PROFESSION_LABELS: Record<string, string> = {
  [Profession.UNEMPLOYED]: 'Безработный',
  [Profession.DVORNIK]: 'Дворник',
};

export const userTableColumns: DTColumn[] = [
  { key: 'characterName', label: 'Персонаж' },
  { key: 'username', label: 'Аккаунт' },
  {
    key: 'role',
    label: 'Роль',
    type: 'select',
    options: toOptions(ROLE_ITEMS, ROLE_LABELS),
  },
  {
    key: 'profession',
    label: 'Профессия',
    type: 'select',
    options: toOptions(PROFESSION_ITEMS, PROFESSION_LABELS),
  },
  {
    key: 'gameStatus',
    label: 'Статус',
    type: 'select',
    options: toOptions(GAME_STATUS_ITEMS, STATUS_LABELS),
  }, //TODO - вырезать
  {
    key: 'coinBalance',
    label: 'Монеты',
    type: 'input',
    inputType: 'number',
    min: 0,
    width: '110px',
  },
  {
    key: 'energy',
    label: 'Энергия',
    type: 'input',
    inputType: 'number',
    min: 0,
    max: 100,
    width: '90px',
  },
  {
    key: 'xpUser',
    label: 'XP',
    type: 'input',
    inputType: 'number',
    min: 0,
    width: '110px',
  },
  {
    key: 'rating',
    label: 'Рейтинг',
    type: 'input',
    inputType: 'number',
    min: 0,
    width: '90px',
  },
];
