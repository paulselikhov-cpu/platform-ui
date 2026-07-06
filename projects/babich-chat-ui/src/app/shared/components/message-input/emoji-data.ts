/**
 * ICQ смайлики — анимированные GIF из /static/standart_dark_skin/
 * Каждый смайлик это объект с именем файла и текстовым кодом (для отправки в чат).
 */

export interface IcqEmoji {
  file: string;   // имя файла без пути, например 'dance.gif'
  code: string;   // текстовый код для отправки, например ':dance:'
  title: string;  // подсказка при наведении
}

export interface EmojiCategory {
  id: string;
  label: string;
  icon: string;          // Unicode иконка для вкладки
  emojis: IcqEmoji[];
}

const BASE_URL = '/static/standart_dark_skin/';

export function emojiUrl(file: string): string {
  return `${BASE_URL}${file}`;
}

export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'favourite',
    label: 'Недавние',
    icon: '🕐',
    emojis: [] // заполняется из localStorage
  },
  {
    id: 'emotions',
    label: 'Эмоции',
    icon: '😀',
    emojis: [
      { file: 'smile3.gif',         code: ':)',           title: 'Улыбка' },
      { file: 'cray.gif',           code: ':(',           title: 'Плачу' },
      { file: 'cray2.gif',          code: ":'-(",         title: 'Плачу 2' },
      { file: 'laugh1.gif',         code: ':D',           title: 'Смех' },
      { file: 'laugh2.gif',         code: ':lol:',        title: 'Смех 2' },
      { file: 'laugh3.gif',         code: ':laugh3:',     title: 'Смех 3' },
      { file: 'wink3.gif',          code: ';)',           title: 'Подмигивание' },
      { file: 'blush2.gif',         code: ':blush:',      title: 'Краснею' },
      { file: 'crazy.gif',          code: ':crazy:',      title: 'Сумасшедший' },
      { file: 'wacko.gif',          code: ':wacko:',      title: 'Псих' },
      { file: 'wacko2.gif',         code: ':wacko2:',     title: 'Псих 2' },
      { file: 'sad.gif',            code: ':sad:',        title: 'Грустный' },
      { file: 'boredom.gif',        code: ':boredom:',    title: 'Скука' },
      { file: 'ireful1.gif',        code: ':ireful1:',    title: 'Гнев' },
      { file: 'ireful2.gif',        code: ':ireful2:',    title: 'Гнев 2' },
      { file: 'ireful3.gif',        code: ':ireful3:',    title: 'Гнев 3' },
      { file: 'hysteric.gif',       code: ':hysteric:',   title: 'Истерика' },
      { file: 'scare.gif',          code: ':scare:',      title: 'Испуг' },
      { file: 'scare2.gif',         code: ':scare2:',     title: 'Испуг 2' },
      { file: 'sorry.gif',          code: ':sorry:',      title: 'Извини' },
      { file: 'sorry2.gif',         code: ':sorry2:',     title: 'Извини 2' },
      { file: 'swoon.gif',          code: ':swoon:',      title: 'Обморок' },
      { file: 'swoon2.gif',         code: ':swoon2:',     title: 'Обморок 2' },
      { file: 'rofl.gif',           code: ':rofl:',       title: 'ROFL' },
      { file: 'sarcasm.gif',        code: ':sarcasm:',    title: 'Сарказм' },
      { file: 'sarcastic.gif',      code: ':sarcastic:',  title: 'Саркастичный' },
      { file: 'dntknw.gif',         code: ':dntknw:',     title: 'Не знаю' },
      { file: 'fool.gif',           code: ':fool:',       title: 'Дурак' },
      { file: 'blind.gif',          code: ':blind:',      title: 'Слепой' },
      { file: 'focus.gif',          code: ':focus:',      title: 'Сосредоточен' },
      { file: 'sclerosis.gif',      code: ':sclerosis:',  title: 'Склероз' },
      { file: 'search.gif',         code: ':search:',     title: 'Ищу' },
      { file: 'secret.gif',         code: ':secret:',     title: 'Секрет' },
      { file: 'resent.gif',         code: ':resent:',     title: 'Обида' },
      { file: 'protest.gif',        code: ':protest:',    title: 'Протест' },
      { file: 'pardon.gif',         code: ':pardon:',     title: 'Прощение' },
    ]
  },
  {
    id: 'gestures',
    label: 'Жесты',
    icon: '👋',
    emojis: [
      { file: 'hi.gif',             code: ':hi:',         title: 'Привет' },
      { file: 'good.gif',           code: ':good:',       title: 'Хорошо' },
      { file: 'good2.gif',          code: ':good2:',      title: 'Хорошо 2' },
      { file: 'good3.gif',          code: ':good3:',      title: 'Хорошо 3' },
      { file: 'ok.gif',             code: ':ok:',         title: 'OK' },
      { file: 'yes2.gif',           code: ':yes2:',       title: 'Да' },
      { file: 'yes3.gif',           code: ':yes3:',       title: 'Да 3' },
      { file: 'yes4.gif',           code: ':yes4:',       title: 'Да 4' },
      { file: 'no2.gif',            code: ':no2:',        title: 'Нет' },
      { file: 'nea.gif',            code: ':nea:',        title: 'Неа' },
      { file: 'negative.gif',       code: ':negative:',   title: 'Негатив' },
      { file: 'clapping.gif',       code: ':clapping:',   title: 'Аплодисменты' },
      { file: 'victory.gif',        code: ':victory:',    title: 'Победа' },
      { file: 'stop.gif',           code: ':stop:',       title: 'Стоп' },
      { file: 'this.gif',           code: ':this:',       title: 'Вот!' },
      { file: 'yahoo.gif',          code: ':yahoo:',      title: 'Yahoo!' },
      { file: 'taunt.gif',          code: ':taunt:',      title: 'Дразню' },
      { file: 'tease.gif',          code: ':tease:',      title: 'Дразню 2' },
      { file: 'facepalm.gif',       code: ':facepalm:',   title: 'Facepalm' },
      { file: 'boast.gif',          code: ':boast:',      title: 'Хвастаюсь' },
      { file: 'curtsey.gif',        code: ':curtsey:',    title: 'Реверанс' },
      { file: 'thank_you.gif',      code: ':thankyou:',   title: 'Спасибо' },
      { file: 'thank_you2.gif',     code: ':thankyou2:',  title: 'Спасибо 2' },
      { file: 'take_example.gif',   code: ':example:',    title: 'Бери пример' },
      { file: 'punish.gif',         code: ':punish:',     title: 'Накажу' },
      { file: 'punish2.gif',        code: ':punish2:',    title: 'Накажу 2' },
    ]
  },
  {
    id: 'activities',
    label: 'Активности',
    icon: '🎮',
    emojis: [
      { file: 'dance.gif',          code: ':dance:',      title: 'Танцую' },
      { file: 'dance2.gif',         code: ':dance2:',     title: 'Танцую 2' },
      { file: 'dance3.gif',         code: ':dance3:',     title: 'Танцую 3' },
      { file: 'dance4.gif',         code: ':dance4:',     title: 'Танцую 4' },
      { file: 'girl_dance.gif',     code: ':girl_dance:', title: 'Девочка танцует' },
      { file: 'gamer1.gif',         code: ':gamer1:',     title: 'Геймер' },
      { file: 'gamer2.gif',         code: ':gamer2:',     title: 'Геймер 2' },
      { file: 'gamer3.gif',         code: ':gamer3:',     title: 'Геймер 3' },
      { file: 'gamer4.gif',         code: ':gamer4:',     title: 'Геймер 4' },
      { file: 'music.gif',          code: ':music:',      title: 'Музыка' },
      { file: 'music2.gif',         code: ':music2:',     title: 'Музыка 2' },
      { file: 'drinks.gif',         code: ':drinks:',     title: 'Пьём' },
      { file: 'smoke.gif',          code: ':smoke:',      title: 'Курю' },
      { file: 'lazy.gif',           code: ':lazy:',       title: 'Ленюсь' },
      { file: 'lazy2.gif',          code: ':lazy2:',      title: 'Ленюсь 2' },
      { file: 'lazy3.gif',          code: ':lazy3:',      title: 'Ленюсь 3' },
      { file: 'moil.gif',           code: ':moil:',       title: 'Работаю' },
      { file: 'paint.gif',          code: ':paint:',      title: 'Рисую' },
      { file: 'paint2.gif',         code: ':paint2:',     title: 'Рисую 2' },
      { file: 'paint3.gif',         code: ':paint3:',     title: 'Рисую 3' },
      { file: 'read.gif',           code: ':read:',       title: 'Читаю' },
      { file: 'download.gif',       code: ':download:',   title: 'Скачиваю' },
      { file: 'training1.gif',      code: ':training:',   title: 'Тренируюсь' },
      { file: 'telephone.gif',      code: ':telephone:',  title: 'Звоню' },
      { file: 'mail1.gif',          code: ':mail:',       title: 'Почта' },
      { file: 'meeting.gif',        code: ':meeting:',    title: 'Встреча' },
    ]
  },
  {
    id: 'love',
    label: 'Любовь',
    icon: '❤️',
    emojis: [
      { file: 'kiss.gif',           code: ':kiss:',       title: 'Поцелуй' },
      { file: 'kiss2.gif',          code: ':kiss2:',      title: 'Поцелуй 2' },
      { file: 'kiss3.gif',          code: ':kiss3:',      title: 'Поцелуй 3' },
      { file: 'give_heart.gif',     code: ':heart:',      title: 'Дарю сердце' },
      { file: 'give_rose.gif',      code: ':rose:',       title: 'Дарю розу' },
      { file: 'man_in_love.gif',    code: ':inlove:',     title: 'Влюблён' },
      { file: 'girl_in_love.gif',   code: ':girl_love:',  title: 'Влюблена' },
      { file: 'flirt.gif',          code: ':flirt:',      title: 'Флирт' },
      { file: 'tender.gif',         code: ':tender:',     title: 'Нежность' },
      { file: 'friends.gif',        code: ':friends:',    title: 'Друзья' },
      { file: 'parting.gif',        code: ':parting:',    title: 'Прощание' },
      { file: 'parting2.gif',       code: ':parting2:',   title: 'Прощание 2' },
    ]
  },
  {
    id: 'characters',
    label: 'Персонажи',
    icon: '🧙',
    emojis: [
      { file: 'king.gif',           code: ':king:',       title: 'Король' },
      { file: 'king2.gif',          code: ':king2:',      title: 'Король 2' },
      { file: 'queen.gif',          code: ':queen:',      title: 'Королева' },
      { file: 'wizard.gif',         code: ':wizard:',     title: 'Волшебник' },
      { file: 'vampire.gif',        code: ':vampire:',    title: 'Вампир' },
      { file: 'orc.gif',            code: ':orc:',        title: 'Орк' },
      { file: 'elf.gif',            code: ':elf:',        title: 'Эльф' },
      { file: 'dwarf.gif',          code: ':dwarf:',      title: 'Гном' },
      { file: 'paladin.gif',        code: ':paladin:',    title: 'Паладин' },
      { file: 'superman.gif',       code: ':superman:',   title: 'Супермен' },
      { file: 'superman2.gif',      code: ':superman2:',  title: 'Супермен 2' },
      { file: 'morpheus.gif',       code: ':morpheus:',   title: 'Морфеус' },
      { file: 'neo.gif',            code: ':neo:',        title: 'Нео' },
      { file: 'triniti.gif',        code: ':triniti:',    title: 'Тринити' },
      { file: 'tommy.gif',          code: ':tommy:',      title: 'Томми' },
      { file: 'vinsent.gif',        code: ':vinsent:',    title: 'Винсент' },
      { file: 'jester.gif',         code: ':jester:',     title: 'Шут' },
      { file: 'pioneer.gif',        code: ':pioneer:',    title: 'Пионер' },
      { file: 'pioneer_smoke.gif',  code: ':pioneer2:',   title: 'Пионер 2' },
      { file: 'hunter.gif',         code: ':hunter:',     title: 'Охотник' },
      { file: 'pilot.gif',          code: ':pilot:',      title: 'Пилот' },
      { file: 'crazy_pilot.gif',    code: ':pilot2:',     title: 'Пилот 2' },
      { file: 'comando.gif',        code: ':comando:',    title: 'Командо' },
      { file: 'russian.gif',        code: ':russian:',    title: 'Русский' },
      { file: 'new_russian.gif',    code: ':newrussian:', title: 'Новый русский' },
      { file: 'ded_moroz.gif',      code: ':dedmoroz:',   title: 'Дед Мороз' },
      { file: 'snegurochka.gif',    code: ':snegurochka:',title: 'Снегурочка' },
      { file: 'santa.gif',          code: ':santa:',      title: 'Санта' },
      { file: 'santa2.gif',         code: ':santa2:',     title: 'Санта 2' },
      { file: 'santa3.gif',         code: ':santa3:',     title: 'Санта 3' },
    ]
  },
  {
    id: 'misc',
    label: 'Разное',
    icon: '🎭',
    emojis: [
      { file: 'party.gif',          code: ':party:',      title: 'Вечеринка' },
      { file: 'popcorm1.gif',       code: ':popcorn:',    title: 'Попкорн' },
      { file: 'popcorm2.gif',       code: ':popcorn2:',   title: 'Попкорн 2' },
      { file: 'dirol.gif',          code: ':dirol:',      title: 'Dirol' },
      { file: 'censored.gif',       code: ':censored:',   title: 'Цензура' },
      { file: 'preved.gif',         code: ':preved:',     title: 'Превед' },
      { file: 'padonak.gif',        code: ':padonak:',    title: 'Падонак' },
      { file: 'mda.gif',            code: ':mda:',        title: 'Мда' },
      { file: 'offtopic.gif',       code: ':offtopic:',   title: 'Оффтопик' },
      { file: 'on_the_quiet.gif',   code: ':quiet:',      title: 'Тихонько' },
      { file: 'on_the_quiet2.gif',  code: ':quiet2:',     title: 'Тихонько 2' },
      { file: 'declare.gif',        code: ':declare:',    title: 'Объявление' },
      { file: 'polling.gif',        code: ':polling:',    title: 'Голосование' },
      { file: 'warning.gif',        code: ':warning:',    title: 'Предупреждение' },
      { file: 'warning2.gif',       code: ':warning2:',   title: 'Предупреждение 2' },
      { file: 'slow.gif',           code: ':slow:',       title: 'Медленно' },
      { file: 'prankster.gif',      code: ':prankster:',  title: 'Хулиган' },
      { file: 'prankster2.gif',     code: ':prankster2:', title: 'Хулиган 2' },
      { file: 'scout.gif',          code: ':scout:',      title: 'Скаут' },
      { file: 'rap.gif',            code: ':rap:',        title: 'Рэп' },
      { file: 'mamba.gif',          code: ':mamba:',      title: 'Мамба' },
      { file: 'i-m_so_happy.gif',   code: ':happy:',      title: 'Я так счастлив' },
      { file: 'locomotive.gif',     code: ':loco:',       title: 'Паровоз' },
      { file: 'umnik.gif',          code: ':umnik:',      title: 'Умник' },
      { file: 'umnik2.gif',         code: ':umnik2:',     title: 'Умник 2' },
    ]
  }
];

// ── localStorage helpers ──────────────────────────────────────────────────

const FAVOURITE_KEY = 'babich_chat_favourite_icq_emoji';

export function addToFavourites(emoji: IcqEmoji): void {
  const favourite = getFavouritesEmoji();
  const filtered = favourite.filter(e => e.file !== emoji.file);
  const updated = [emoji, ...filtered].slice(0, 24);
  localStorage.setItem(FAVOURITE_KEY, JSON.stringify(updated));
}

export function getFavouritesEmoji(): IcqEmoji[] {
  try {
    return JSON.parse(localStorage.getItem(FAVOURITE_KEY) || '[]');
  } catch {
    return [];
  }
}