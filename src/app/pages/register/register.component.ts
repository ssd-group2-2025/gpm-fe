import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService as ApiAuthService } from '../../core-client-generated/api/auth.service';
import { ErrorHandlerService } from '../../services/error-handler.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private apiAuthService = inject(ApiAuthService);
  private router = inject(Router);

  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  registerForm: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    matricola: ['', Validators.required],
    password1: ['', [Validators.required, Validators.minLength(8)]],
    password2: ['', Validators.required]
  }, { validators: this.passwordMatchValidator });

  passwordMatchValidator(form: FormGroup) {
    const password1 = form.get('password1')?.value;
    const password2 = form.get('password2')?.value;
    return password1 === password2 ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const formValue = this.registerForm.value;

    const registerData: any = {
      username: formValue.username,
      email: formValue.email,
      first_name: formValue.firstName,
      last_name: formValue.lastName,
      matricola: formValue.matricola,
      password1: formValue.password1,
      password2: formValue.password2
    };

    this.apiAuthService.authRegistrationCreate(registerData).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set('Registration successful! Redirecting to login...');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        this.loading.set(false);
        console.error('Registration error:', error);
        ErrorHandlerService.handleValidationError(error, 'Registration failed. Please try again.');
      }
    });
  }
}
