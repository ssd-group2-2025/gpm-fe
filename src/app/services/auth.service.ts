import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService as ApiAuthService } from '../core-client-generated/api/auth.service';
import { CustomTokenObtainPair } from '../core-client-generated/model/models';
import { catchError, tap, of, Observable, map } from 'rxjs';
import { ExtendedUser } from '../models/extended-user.model';
import { JwtResponse, JwtPayload, decodeJwt } from '../models/jwt-response.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiAuthService = inject(ApiAuthService);
  private router = inject(Router);

  private jwtPayloadSignal = signal<JwtPayload | null>(null);

  currentUser = computed(() => {
    const jwt = this.jwtPayloadSignal();
    if (!jwt) return null;

    return {
      id: jwt.user_id,
      username: jwt.username,
      email: jwt.email,
      firstName: jwt.first_name,
      lastName: jwt.last_name,
      matricola: jwt.matricola,
      is_staff: jwt.is_staff,
      is_superuser: jwt.is_superuser,
      isStaff: jwt.is_staff,
      isSuperuser: jwt.is_superuser
    } as ExtendedUser;
  });
  isAuthenticated = computed(() => this.jwtPayloadSignal() !== null);
  isAdmin = computed(() => {
    const jwt = this.jwtPayloadSignal();
    return jwt?.is_superuser || false;
  });
  isStaff = computed(() => {
    const jwt = this.jwtPayloadSignal();
    return jwt?.is_staff || false;
  });
  userGroup = computed(() => {
    const user = this.currentUser();
    return user?.group;
  });

  constructor() {
    this.loadAuthFromStorage();
  }

  login(credentials: CustomTokenObtainPair): Observable<ExtendedUser | null> {
    return this.apiAuthService.authLoginCreate(credentials).pipe(
      map((response: any) => {
        const jwtResponse = response as JwtResponse;

        if (jwtResponse.access) {
          this.saveAccessToken(jwtResponse.access);

          const payload = decodeJwt(jwtResponse.access);
          if (payload) {
            this.jwtPayloadSignal.set(payload);
            return this.currentUser();
          }
        }

        throw new Error('Invalid JWT response');
      }),
      catchError(error => {
        console.error('Login failed:', error);
        this.clearAuth();
        throw error;
      })
    );
  }

  logout(): void {
    this.apiAuthService.authLogoutLogoutCreate().pipe(
      tap(() => {
        this.clearAuth();
        this.router.navigate(['/login']);
      }),
      catchError(error => {
        console.error('Logout failed:', error);
        this.clearAuth();
        this.router.navigate(['/login']);
        return of(null);
      })
    ).subscribe();
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  canEditGroup(groupId: number): boolean {
    if (this.isAdmin()) return true;
    return this.userGroup() === groupId;
  }

  private saveAccessToken(token: string): void {
    localStorage.setItem('access_token', token);
  }

  private loadAuthFromStorage(): void {
    const token = localStorage.getItem('access_token');

    if (token) {
      const payload = decodeJwt(token);
      if (payload) {
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp > now) {
          this.jwtPayloadSignal.set(payload);
        } else {
          this.clearAuth();
        }
      }
    }
  }

  private clearAuth(): void {
    this.jwtPayloadSignal.set(null);
    localStorage.removeItem('access_token');
  }
}
