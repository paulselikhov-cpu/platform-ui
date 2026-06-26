// IUser-info.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IUser } from '../../models/IUser';
import { UserService } from '../../services/user-service';

@Component({
  selector: 'app-IUser-info',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-info.html',
  styleUrl: './user-info.scss',
})
export class UserInfo implements OnInit {
  users: IUser[] = [];
  loading = false;
  error = '';
  
  // Модель для новой формы
  newUser: Omit<IUser, 'id' | 'createdAt'> = {
    username: '',
    email: '',
    password: ''
  };

  // Для отслеживания удаляемого пользователя
  deletingUserId: number | null = null;

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.error = '';
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Ошибка загрузки пользователей';
        this.loading = false;
        console.error('Ошибка:', error);
      }
    });
  }

  // Метод для добавления пользователя
  addUser() {
    // Простая валидация
    if (!this.newUser.username || !this.newUser.email || !this.newUser.password) {
      alert('Заполните все поля!');
      return;
    }

    this.userService.createUser(this.newUser).subscribe({
      next: (IUser) => {
        this.users.push(IUser);
        // Очищаем форму
        this.newUser = {
          username: '',
          email: '',
          password: ''
        };
        alert('Пользователь успешно добавлен!');
      },
      error: (error) => {
        console.error('Ошибка при создании пользователя:', error);
        alert('Ошибка при создании пользователя');
      }
    });
  }

  // Метод для удаления пользователя
  deleteUser(id: number, username: string) {
    // Подтверждение удаления
    if (confirm(`Вы уверены, что хотите удалить пользователя "${username}"?`)) {
      this.deletingUserId = id;
      
      this.userService.deleteUser(id).subscribe({
        next: () => {
          // Удаляем пользователя из списка
          this.users = this.users.filter(IUser => IUser.id !== id);
          this.deletingUserId = null;
          alert(`Пользователь "${username}" успешно удален!`);
        },
        error: (error) => {
          console.error('Ошибка при удалении пользователя:', error);
          this.deletingUserId = null;
          alert('Ошибка при удалении пользователя');
        }
      });
    }
  }
}