import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  private authService = inject(AuthService);

  authState$ = this.authService.authState$;

  navItems: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fas fa-chart-line' },
    { label: 'Groups', route: '/groups', icon: 'fas fa-users' },
    { label: 'Members', route: '/members', icon: 'fas fa-user' },
    { label: 'Settings', route: '/settings', icon: 'fas fa-cog' },
  ];

  adminNavItems: NavItem[] = [
    { label: 'Topics', route: '/topics', icon: 'fas fa-book' },
    { label: 'Goals', route: '/goals', icon: 'fas fa-bullseye' },
    { label: 'Assignments', route: '/group-goals', icon: 'fas fa-clipboard-check' },
  ];

  logout(): void {
    this.authService.logout();
  }
}
