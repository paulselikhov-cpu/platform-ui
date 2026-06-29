import { Component, input } from '@angular/core';
import { Location } from '../../../services/location.service';

@Component({
  selector: 'app-location-item',
  templateUrl: './location-item.html',
  styleUrl: './location-item.scss'
})
export class LocationItem {
  location = input.required<Location>();
  isActive = input<boolean>(false);
}