import { Component, input, inject, computed } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { ChatArea } from '../../chat/chat-area/chat-area';
import { ILocation, IRoom } from '../../../models/location/location.interface';
import { OnlineTrackingService } from './services/online-tracking.service';

@Component({
  selector: 'app-location-view',
  imports: [ChatArea],
  templateUrl: './location-view.html',
  styleUrl: './location-view.scss',
  standalone: true,
})
export class LocationView {
  readonly location = input.required<ILocation>();
  readonly selectedRoom = input<IRoom | null>(null);

  private onlineTrackingService = inject(OnlineTrackingService);

  private readonly locationId = computed(() => this.location().id);

  readonly onlineState = toSignal(
    toObservable(this.locationId).pipe(
      switchMap(id => this.onlineTrackingService.getPresence$(id)),
    ),
    { initialValue: null },
  );

  readonly onlineIds = computed(() => this.onlineState()?.onlineIds ?? new Set<number>());

  readonly rooms = computed<IRoom[]>(() => {
    const template = this.location().template;
    if (!template?.templateRooms) return [];
    return template.templateRooms.map(r => ({
      id: r.id,
      code: r.code,
      name: r.name,
      description: r.description,
      storeHistory: false,
      isCustom: false,
      orderIndex: r.orderIndex,
    }));
  });
}
