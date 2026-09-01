import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/backend-services/base/auth.service';

@Component({
  selector: 'app-register',
  imports: [RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {
  private auth = inject(AuthService);
  private router = inject(Router);

  username = signal('');
  email = signal('');
  password = signal('');
  error = signal('');
  loading = signal(false);

  onSubmit() {
    if (!this.username() || !this.email() || !this.password()) {
      this.error.set('Заполните все поля');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.auth.register({
      username: this.username(),
      email: this.email(),
      password: this.password()
      }).subscribe({
            next: () => {
              console.log('Registration successful, navigating to main menu');
              this.router.navigate(['/main-menu']);
            },
            error: (err) => {
              this.error.set(err.error?.message || 'Ошибка регистрации');
              this.loading.set(false);
            }
          });
  }
}