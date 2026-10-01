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
      { path: '', data: { page: 'empty' }, loadComponent: () => import('./layout/desktop/chat-desktop/chat-desktop').then(m => m.ChatDesktop) },
      { path: 'location/create', data: { page: 'create' }, loadComponent: () => import('./layout/desktop/chat-desktop/chat-desktop').then(m => m.ChatDesktop) },
      { path: 'location/find', data: { page: 'find' }, loadComponent: () => import('./layout/desktop/chat-desktop/chat-desktop').then(m => m.ChatDesktop) },
      { path: 'work', data: { page: 'work' }, loadComponent: () => import('./layout/desktop/chat-desktop/chat-desktop').then(m => m.ChatDesktop) },
      { path: 'location/:locationId/main', data: { page: 'location' }, loadComponent: () => import('./layout/desktop/chat-desktop/chat-desktop').then(m => m.ChatDesktop) },
      { path: 'location/:locationId/feature/:featureId', data: { page: 'location' }, loadComponent: () => import('./layout/desktop/chat-desktop/chat-desktop').then(m => m.ChatDesktop) },
      { path: 'location/:locationId/room/:roomId', data: { page: 'location' }, loadComponent: () => import('./layout/desktop/chat-desktop/chat-desktop').then(m => m.ChatDesktop) },
      {
        path: 'location/:locationId',
        pathMatch: 'full',
        redirectTo: (route) => `/chat/location/${route.params['locationId']}/main`,
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
