import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'groups',
    loadComponent: () => import('./pages/groups/groups.component').then(m => m.GroupsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'group-goals',
    loadComponent: () => import('./pages/group-goals/group-goals.component').then(m => m.GroupGoalsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'members',
    loadComponent: () => import('./pages/members/members.component').then(m => m.MembersComponent),
    canActivate: [authGuard]
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'topics',
    loadComponent: () => import('./pages/topics/topics.component').then(m => m.TopicsComponent),
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'goals',
    loadComponent: () => import('./pages/goals/goals.component').then(m => m.GoalsComponent),
    canActivate: [authGuard, adminGuard]
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
];
