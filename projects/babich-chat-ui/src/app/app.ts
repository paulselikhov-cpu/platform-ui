import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from './shared/components/toast/toast';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toast],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('babich-chat-ui');
  constructor() {
    // ThemeService в конструкторе применяет сохранённую тему на <html data-theme>.
    // Инжект здесь гарантирует, что тема проходит при старте приложения.
    inject(ThemeService);
  }
}
