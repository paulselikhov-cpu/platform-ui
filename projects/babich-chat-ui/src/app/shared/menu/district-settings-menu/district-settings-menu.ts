import { Component, computed, inject, signal } from '@angular/core';
import { DistrictService } from '../../../services/backend-services/http/district.service';
import { CurrentChatUserService } from '../../../services/current-chat-user.service';
import { DistrictSettings } from '../../../models/district/district-settings.interface';
import { DistrictUsersTable } from '../../components/district-users-table/district-users-table';
import { ChatRole } from '../../../models/chatUser/chatUser.interface';
import { DefaultButtonComponent } from '../../components/buttons/default-button/default-button';
import { BackButton } from '../../components/buttons/back-button/back-button';
import {
  DefaultTable,
  DTCellChange,
  DTColumn,
} from '../../components/default-table/default-table.component';

type Page = 'menu' | 'election' | 'recall' | 'roles';

const ELECTION_COLUMNS: DTColumn[] = [
  {
    key: 'electionDurationHours',
    label: 'Длительность, часов',
    type: 'input',
    inputType: 'number',
    min: 1,
  },
  {
    key: 'electionAliveWindowDays',
    label: 'Считается живым, если заходил за (суток)',
    type: 'input',
    inputType: 'number',
    min: 1,
  },
  {
    key: 'electionQuorumPercent',
    label: 'Кворум, %',
    type: 'input',
    inputType: 'number',
    min: 1,
    max: 100,
  },
  {
    key: 'electionMaxCandidates',
    label: 'Число слотов кандидатов',
    type: 'input',
    inputType: 'number',
    min: 1,
    max: 10,
  },
];

const RECALL_COLUMNS: DTColumn[] = [
  {
    key: 'recallDurationHours',
    label: 'Длительность, часов',
    type: 'input',
    inputType: 'number',
    min: 1,
  },
  {
    key: 'recallAliveWindowDays',
    label: 'Считается живым, если заходил за (суток)',
    type: 'input',
    inputType: 'number',
    min: 1,
  },
  {
    key: 'recallQuorumPercent',
    label: 'Кворум, %',
    type: 'input',
    inputType: 'number',
    min: 1,
    max: 100,
  },
];

@Component({
  selector: 'app-district-settings-menu',
  templateUrl: './district-settings-menu.html',
  styleUrl: './district-settings-menu.scss',
  standalone: true,
  imports: [
    DistrictUsersTable,
    DefaultButtonComponent,
    BackButton,
    DefaultTable,
  ],
})
export class DistrictSettingsMenu {
  private readonly districtService = inject(DistrictService);
  private readonly currentUserService = inject(CurrentChatUserService);

  /** Текущий экран: главное меню или один из разделов. */
  readonly page = signal<Page>('menu');

  readonly electionColumns = ELECTION_COLUMNS;
  readonly recallColumns = RECALL_COLUMNS;

  readonly form = signal<DistrictSettings | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly message = signal<{ kind: 'error' | 'ok'; text: string } | null>(
    null,
  );

  readonly isAdmin = computed(
    () => this.currentUserService.currentChatUser()?.role === ChatRole.ADMIN,
  );

  readonly settingsItems = computed(() => {
    const f = this.form();
    return f ? [f] : [];
  });

  onCellChange(change: DTCellChange): void {
    this.form.update((f) => (f ? { ...f, [change.key]: change.value } : f));
  }

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
        this.message.set({
          kind: 'error',
          text: 'Не удалось загрузить настройки района',
        });
      },
    });
  }

  open(page: Exclude<Page, 'menu'>): void {
    this.message.set(null);
    this.page.set(page);
  }

  backToMenu(): void {
    this.message.set(null);
    this.page.set('menu');
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
        this.message.set({
          kind: 'error',
          text: 'Не удалось сохранить настройки',
        });
      },
    });
  }
}
