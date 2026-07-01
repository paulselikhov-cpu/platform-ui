import { Component, input } from '@angular/core';
import { ILocation } from '../../../models/location/location.interface';

@Component({
  selector: 'app-location-item',
  templateUrl: './location-item.html',
  styleUrl: './location-item.scss'
})
export class LocationItem {
  location = input.required<ILocation>();
  isActive = input<boolean>(false);
}