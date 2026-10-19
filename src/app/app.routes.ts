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
        path: 'documents',
        loadComponent: () => import('./pages/documents/layout/documents-layout').then((m) => m.DocumentsLayout),
        children: [
          {
            path: '',
            title: 'Documents - Sideral',
            loadComponent: () => import('./pages/documents/browser/browser').then((m) => m.Browser),
          },
          {
            path: 'folder/:folderId',
            title: 'Documents - Sideral',
            loadComponent: () => import('./pages/documents/browser/browser').then((m) => m.Browser),
          },
          {
            path: 'file/:documentId',
            title: 'Document - Sideral',
            loadComponent: () => import('./pages/documents/document-detail/document-detail').then((m) => m.DocumentDetail),
          },
          {
            path: 'checked-out',
            title: 'Mes extractions - Sideral',
            loadComponent: () => import('./pages/documents/checked-out/checked-out').then((m) => m.CheckedOut),
          },
          {
            path: 'trash',
            title: 'Corbeille - Sideral',
            loadComponent: () => import('./pages/documents/trash/trash').then((m) => m.Trash),
          },
        ],
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/admin/layout/admin-layout').then((m) => m.AdminLayout),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'fulltext' },
          {
            path: 'fulltext',
            title: 'Full Text Server - Sideral',
            loadComponent: () => import('./pages/admin/fulltext/fulltext-settings').then((m) => m.FullTextSettings),
          },
        ],
      },
      {
        path: 'admin/groups',
        canActivate: [adminGuard],
        children: [
          {
            path: '',
            title: 'Groupes - Sideral',
            loadComponent: () => import('./pages/admin/groups/group-list/group-list').then((m) => m.GroupList),
          },
          {
            path: 'new',
            title: 'Nouveau groupe - Sideral',
            loadComponent: () => import('./pages/admin/groups/group-form/group-form').then((m) => m.GroupForm),
          },
          {
            path: ':id',
            title: 'Groupe - Sideral',
            loadComponent: () => import('./pages/admin/groups/group-form/group-form').then((m) => m.GroupForm),
          },
        ],
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
