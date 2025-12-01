import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { AuthService } from './services/auth.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  template: `
    @if (showSidebar) {
      <div class="app-container">
        <app-sidebar></app-sidebar>
        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    } @else {
      <router-outlet></router-outlet>
    }
  `,
  styles: [`
    .app-container {
      display: flex;
      height: 100vh;
      background-color: #f5f5f5;
    }

    .main-content {
      flex: 1;
      overflow-y: auto;
      padding: 2rem;
    }
  `]
})
export class AppComponent implements OnInit {
  private router = inject(Router);
  authService = inject(AuthService);
  showSidebar = true;

  ngOnInit(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.showSidebar = !event.url.includes('/login') && !event.url.includes('/register');
      });
  }
}
