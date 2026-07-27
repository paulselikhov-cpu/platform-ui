import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DistrictService } from '../../services/backend-services/http/district.service';
import { District } from '../../models/district/district.interface';

/**
 * Экран выбора района после главного меню.
 * Показывает список доступных районов. Пока доступен только "Центральный".
 * После выбора района пользователь переходит в чат (/chat).
 */
@Component({
  selector: 'app-district-select',
  imports: [],
  templateUrl: './district-select.html',
  styleUrl: './district-select.scss'
})
export class DistrictSelect implements OnInit {
  private router = inject(Router);
  private districtService = inject(DistrictService);

  districts = signal<District[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.districtService.getAllDistricts().subscribe({
      next: (districts) => {
        this.districts.set(districts);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  selectDistrict(district: District) {
    // Сохраняем выбранный район в localStorage (чтобы помнить при перезагрузке)
    localStorage.setItem('selectedDistrict', JSON.stringify(district));
    this.router.navigate(['/chat']);
  }

  goBack() {
    this.router.navigate(['/main-menu']);
  }
}