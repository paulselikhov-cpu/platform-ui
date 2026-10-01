import { ILocation, IRoom } from '../../../models/location/location.interface';
import { RoomMenuItem } from '../../../shared/components/actions-menu/room-menu-item.interface';

/**
 * Действия комнаты (меню «⚡ Действия» в шапке чата).
 * Сейчас действий у комнат нет — возвращаем заглушку (задизейбленный пункт),
 * чтобы меню было видно. В будущем список будет зависеть от локации/комнаты.
 */
export function resolveRoomActions(_location: ILocation, _room: IRoom): RoomMenuItem[] {
  return [
    {
      id: 'room-actions-stub',
      icon: '⚙️',
      label: 'Действия появятся позже',
      disabled: true,
      run: () => {},
    },
  ];
}
