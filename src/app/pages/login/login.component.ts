import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ErrorHandlerService } from '../../services/error-handler.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  errorMessage = signal('');

  loginForm: FormGroup = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.loading.set(true);
    this.errorMessage.set('');

    const credentials = {
      username: this.loginForm.value.username,
      password: this.loginForm.value.password
    };

    this.authService.login(credentials).subscribe({
      next: (user) => {
        this.loading.set(false);
        if (user) {
          console.log('Login successful, user:', user);
          console.log('Auth state:', this.authService.isAuthenticated);
          this.router.navigate(['/dashboard']).then(success => {
            console.log('Navigation result:', success);
            if (!success) {
              console.error('Navigation to dashboard failed');
            }
          });
        }
      },
      error: (error) => {
        this.loading.set(false);
        console.error('Login error:', error);
        ErrorHandlerService.handleValidationError(error, 'Invalid username or password. Please try again.');
      }
    });
  }
}
