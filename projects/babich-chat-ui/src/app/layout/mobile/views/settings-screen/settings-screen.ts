import { Component, output } from '@angular/core';
import { SettingsMenu } from '../../../../shared/menu/settings-menu/settings-menu';

/**
 * Полноэкранный вариант окна настроек для мобильной раскладки.
 *
 * На десктопе те же настройки открываются в `WindowModal` поверх приложения;
 * здесь экран занимает всю высоту и закрывается кнопкой «назад» в шапке.
 * Содержимое — общий `SettingsMenu`, поэтому набор пунктов и их поведение
 * не расходятся между платформами.
 */
@Component({
  selector: 'app-settings-screen',
  imports: [SettingsMenu],
  templateUrl: './settings-screen.html',
  styleUrl: './settings-screen.scss',
})
export class SettingsScreen {
  /** Закрыть экран (кнопка «назад» в шапке мобильной раскладки). */
  readonly close = output<void>();
}