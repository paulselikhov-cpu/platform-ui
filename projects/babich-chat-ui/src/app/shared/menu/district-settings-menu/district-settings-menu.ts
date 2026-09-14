import { Component, computed, inject, signal } from '@angular/core';
import { DistrictService } from '../../../services/backend-services/http/district.service';
import { CurrentChatUserService } from '../../../services/current-chat-user.service';
import { DistrictSettings } from '../../../models/district/district-settings.interface';
import { DistrictUsersTable } from '../../components/district-users-table/district-users-table';
import { ChatRole } from '../../../models/chatUser/chatUser.interface';

@Component({
  selector: 'app-district-settings-menu',
  templateUrl: './district-settings-menu.html',
  styleUrl: './district-settings-menu.scss',
  standalone: true,
  imports: [DistrictUsersTable],
})
export class DistrictSettingsMenu {
  private readonly districtService = inject(DistrictService);
  private readonly currentUserService = inject(CurrentChatUserService);

  /** Вкладка: настройки или управление персонажами (выдача прав). */
  readonly page = signal<'settings' | 'roles'>('settings');

  readonly form = signal<DistrictSettings | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly message = signal<{ kind: 'error' | 'ok'; text: string } | null>(null);

  readonly isAdmin = computed(
    () => this.currentUserService.currentChatUser()?.role === ChatRole.ADMIN,
  );

  /** id выбранного района (используется и в шаблоне). */
  districtId(): number | null {
    return this.currentUserService.selectedDistrictId();
  }

  constructor() {
    const districtId = this.districtId();
    if (districtId == null) {
      this.loading.set(false);
      this.message.set({ kind: 'error', text: 'Район не выбран' });
      return;
    }
    this.districtService.getSettings(districtId).subscribe({
      next: (s) => {
        this.form.set(s);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.message.set({ kind: 'error', text: 'Не удалось загрузить настройки района' });
      },
    });
  }

  /** Реактивное обновление одного числового поля формы. */
  setField(key: keyof DistrictSettings, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    if (Number.isNaN(value)) return;
    this.form.update((f) => (f ? { ...f, [key]: value } : f));
  }

  openRoles(): void {
    this.message.set(null);
    this.page.set('roles');
  }

  backToSettings(): void {
    this.page.set('settings');
  }

  save(): void {
    const districtId = this.districtId();
    const form = this.form();
    if (districtId == null || form == null) return;

    this.saving.set(true);
    this.message.set(null);
    this.districtService.updateSettings(districtId, form).subscribe({
      next: (saved) => {
        this.form.set(saved);
        this.saving.set(false);
        this.message.set({ kind: 'ok', text: 'Настройки сохранены' });
      },
      error: () => {
        this.saving.set(false);
        this.message.set({ kind: 'error', text: 'Не удалось сохранить настройки' });
      },
    });
  }
}