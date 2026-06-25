import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';

export const routes: Routes = [
  {
    path: 'chat',
    loadComponent: () =>
      loadRemoteModule('babich-chat-ui', './App').then((m) => m.App)
  }
];