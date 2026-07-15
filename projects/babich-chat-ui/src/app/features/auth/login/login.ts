import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/backend-services/base/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);

  username = signal('');
  password = signal('');
  error = signal('');
  loading = signal(false);

  onSubmit() {
    if (!this.username() || !this.password()) {
      this.error.set('Заполните все поля');
      return;
    }
    this.loading.set(true);
    this.error.set('');

    this.auth.login({
      username: this.username(),
      password: this.password()
    }).subscribe({
      next: () => this.router.navigate(['/chat']),
      error: () => {
        this.error.set('Неверный логин или пароль');
        this.loading.set(false);
      }
    });
  }
}