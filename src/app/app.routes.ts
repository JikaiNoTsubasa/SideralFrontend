import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './core/guards/auth.guards';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'Connexion - Sideral',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Accueil - Sideral',
        loadComponent: () => import('./pages/home/home').then((m) => m.Home),
      },
      {
        path: 'profile',
        title: 'Mon profil - Sideral',
        loadComponent: () => import('./pages/profile/profile').then((m) => m.Profile),
      },
      {
        path: 'preferences',
        title: 'Préférences - Sideral',
        loadComponent: () => import('./pages/preferences/preferences').then((m) => m.Preferences),
      },
      {
        path: 'admin/users',
        canActivate: [adminGuard],
        children: [
          {
            path: '',
            title: 'Utilisateurs - Sideral',
            loadComponent: () => import('./pages/admin/users/user-list/user-list').then((m) => m.UserList),
          },
          {
            path: 'new',
            title: 'Nouvel utilisateur - Sideral',
            loadComponent: () => import('./pages/admin/users/user-form/user-form').then((m) => m.UserForm),
          },
          {
            path: ':id',
            title: 'Utilisateur - Sideral',
            loadComponent: () => import('./pages/admin/users/user-form/user-form').then((m) => m.UserForm),
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
