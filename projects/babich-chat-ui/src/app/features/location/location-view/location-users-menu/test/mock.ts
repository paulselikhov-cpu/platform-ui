import { ILocationUser } from "../../../../../models/location/location.interface";

export function buildMockUsers(locationId: number): ILocationUser[] {
  const rooms = locationId === 8
    ? [{ id: 101, name: 'Кухня' }, { id: 102, name: 'Спальня' }]
    : [{ id: 201, name: 'Гостиная' }, { id: 202, name: 'Балкон' }];

  const names = ['Юра', 'Леночка', 'Максим', 'Ирка', 'Дима', 'Настя', 'Костя', 'Света', 'Игорь', 'Аня', 'Паша', 'Вика', 'Гриша', 'Тая', 'Женя', 'Артём'];
  const now = Date.now();

  return names.map((name, i) => {
    const online = i % 3 !== 0; // ~2/3 онлайн для наглядности
    const room = rooms[i % rooms.length];
    return {
      characterId: locationId * 1000 + i,
      characterName: name,
      online,
      roomId: online ? room.id : null,
      roomName: online ? room.name : null,
      lastSeenAt: online ? null : new Date(now - (i + 1) * 3 * 60 * 60 * 1000).toISOString(),
    };
  });
}


export function timeAgo(isoDate: string): string {
  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'только что';
  if (diffMin < 60) return `${diffMin} мин назад`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} ч назад`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'вчера';
  if (diffDays < 7) return `${diffDays} дн назад`;

  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}