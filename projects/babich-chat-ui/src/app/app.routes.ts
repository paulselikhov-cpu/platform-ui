import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/backend-services/base/auth.service';

const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated() && auth.getToken()) return true;
  return router.createUrlTree(['/login']);
};

const guestGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) return true;
  return router.createUrlTree(['/main-menu']);
};

export const routes: Routes = [
  { path: '', redirectTo: 'main-menu', pathMatch: 'full' },
  {
    path: 'main-menu',
    canActivate: [authGuard],
    loadComponent: () => import('./features/main-menu/main-menu').then(m => m.MainMenu)
  },
  {
    path: 'character-create',
    canActivate: [authGuard],
    loadComponent: () => import('./features/character-create/character-create').then(m => m.CharacterCreate)
  },
  {
    path: 'district-select',
    canActivate: [authGuard],
    loadComponent: () => import('./features/district-select/district-select').then(m => m.DistrictSelect)
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login').then(m => m.Login)
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register').then(m => m.Register)
  },
  {
    path: 'chat',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/chat-layout/chat-layout').then(m => m.ChatLayout),
    children: [
      // Мобильные экраны не локации: отдельные маршруты, чтобы состояние
      // вкладки переживало F5 и работало как deep-link. Активная вкладка
      // определяется по маршруту, а не хранится в компоненте.
      { path: 'district', data: { page: 'district', tab: 'district' }, loadComponent: () => import('./layout/chat-shell/chat-shell').then(m => m.ChatShell) },
      { path: 'me', data: { page: 'profile', tab: 'profile' }, loadComponent: () => import('./layout/chat-shell/chat-shell').then(m => m.ChatShell) },
      { path: 'settings', data: { page: 'settings', tab: 'profile' }, loadComponent: () => import('./layout/chat-shell/chat-shell').then(m => m.ChatShell) },
      { path: '', data: { page: 'empty', tab: 'locations' }, loadComponent: () => import('./layout/chat-shell/chat-shell').then(m => m.ChatShell) },
      { path: 'location/create', data: { page: 'create', tab: 'locations' }, loadComponent: () => import('./layout/chat-shell/chat-shell').then(m => m.ChatShell) },
      { path: 'location/find', data: { page: 'find', tab: 'locations' }, loadComponent: () => import('./layout/chat-shell/chat-shell').then(m => m.ChatShell) },
      { path: 'work', data: { page: 'work', tab: 'profile' }, loadComponent: () => import('./layout/chat-shell/chat-shell').then(m => m.ChatShell) },
      // Локация адресуется code, а не id: code уникален в пределах района,
      // район резолвится на бэке из персонажа. Района в URL нет намеренно.
      // Локация адресуется code, а не id: code уникален в пределах района,
      // район резолвится на бэке из персонажа. Список комнат отдельного
      // маршрута не имеет: на мобиле он рисуется на том же экране, что и
      // главное меню локации.
      { path: 'location/:code/main', data: { page: 'location' }, loadComponent: () => import('./layout/chat-shell/chat-shell').then(m => m.ChatShell) },
      { path: 'location/:code/feature/:featureId', data: { page: 'location' }, loadComponent: () => import('./layout/chat-shell/chat-shell').then(m => m.ChatShell) },
      { path: 'location/:code/room/:roomId', data: { page: 'location' }, loadComponent: () => import('./layout/chat-shell/chat-shell').then(m => m.ChatShell) },
      {
        path: 'location/:code',
        pathMatch: 'full',
        redirectTo: (route) => `/chat/location/${route.params['code']}/main`,
      },
      { path: 'error', data: { page: 'error' }, loadComponent: () => import('./features/error/chat-access-error/chat-access-error').then(m => m.ChatAccessError) },
    ]
  },
  {
    path: 'work',
    canActivate: [authGuard],
    loadComponent: () => import('./features/economy/work-page/work-page').then(m => m.WorkPage)
  },
  { path: '**', redirectTo: 'chat' }
];
