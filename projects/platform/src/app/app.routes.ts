import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  {
    path: 'chat',
    loadComponent: () => {
      // @ts-ignore – этот модуль подгружается через федерацию во время выполнения
      return import('babich-chat-ui/App').then(m => m.App);
    }
  }
];