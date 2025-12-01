import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent {
  authService = inject(AuthService);

  getFirstName(): string {
    const user = this.authService.currentUser;
    return user?.firstName || (user as any)?.first_name || '';
  }

  getLastName(): string {
    const user = this.authService.currentUser;
    return user?.lastName || (user as any)?.last_name || '';
  }
}
