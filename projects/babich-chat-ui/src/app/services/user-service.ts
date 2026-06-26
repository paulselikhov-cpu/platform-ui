import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IUser } from '../models/IUser';



@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = '/api/users';

  constructor(private http: HttpClient) {}

  // GET - получить всех пользователей
  getUsers(): Observable<IUser[]> {
    return this.http.get<IUser[]>(this.apiUrl);
  }

  // GET - получить пользователя по ID
  getUser(id: number): Observable<IUser> {
    return this.http.get<IUser>(`${this.apiUrl}/${id}`);
  }

  // POST - создать нового пользователя
  createUser(IUser: IUser): Observable<IUser> {
    return this.http.post<IUser>(this.apiUrl, IUser);
  }

  // PUT - обновить пользователя
  updateUser(id: number, IUser: IUser): Observable<IUser> {
    return this.http.put<IUser>(`${this.apiUrl}/${id}`, IUser);
  }

  // DELETE - удалить пользователя
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}