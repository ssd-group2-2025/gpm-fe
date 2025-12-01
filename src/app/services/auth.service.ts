import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService as ApiAuthService } from '../core-client-generated/api/auth.service';
import { UsersService } from '../core-client-generated/api/users.service';
import { User, Login } from '../core-client-generated/model/models';
import { catchError, tap, of, BehaviorSubject, Observable, map, switchMap } from 'rxjs';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiAuthService = inject(ApiAuthService);
  private usersService = inject(UsersService);
  private router = inject(Router);

  private authState = new BehaviorSubject<AuthState>({
    user: null,
    isAuthenticated: false,
    isAdmin: false
  });

  authState$ = this.authState.asObservable();

  get currentUser(): User | null {
    return this.authState.value.user;
  }

  get isAuthenticated(): boolean {
    return this.authState.value.isAuthenticated;
  }

  get isAdmin(): boolean {
    return this.authState.value.isAdmin;
  }

  get userGroup(): number | undefined {
    return this.authState.value.user?.group;
  }

  constructor() {
    this.loadUserFromStorage();
  }

  login(credentials: Login): Observable<User | null> {
    return this.apiAuthService.authLoginCreate(credentials).pipe(
      switchMap(() => this.usersService.usersMe()),
      map((response: any) => {
        // Il backend potrebbe restituire un oggetto User diretto o un array
        console.log('Raw response from usersMe():', response);
        let user: User | null = null;
        
        if (Array.isArray(response)) {
          user = response.length > 0 ? response[0] : null;
        } else if (response && typeof response === 'object') {
          // Il backend restituisce un oggetto diretto
          user = response as User;
        }
        
        console.log('User fetched after login:', user);
        return user;
      }),
      tap(user => {
        if (user) {
          // Handle both camelCase and snake_case from backend
          const isAdmin = user.isSuperuser || (user as any).is_superuser || false;
          console.log('Updating auth state - user:', user.username, 'isAdmin:', isAdmin, 'isSuperuser:', user.isSuperuser, 'is_superuser:', (user as any).is_superuser);
          this.authState.next({
            user: user,
            isAuthenticated: true,
            isAdmin
          });
          this.saveUserToStorage(user);
          console.log('Auth state updated:', this.authState.value);
        } else {
          console.error('No user returned from usersMe()');
          this.clearAuth();
        }
      }),
      catchError(error => {
        console.error('Login or user fetch failed:', error);
        this.clearAuth();
        throw error;
      })
    );
  }

  getCurrentUser(): void {
    this.usersService.usersMe().pipe(
      map((response: any) => {
        // Il backend potrebbe restituire un oggetto User diretto o un array
        if (Array.isArray(response)) {
          return response.length > 0 ? response[0] : null;
        } else if (response && typeof response === 'object') {
          return response as User;
        }
        return null;
      }),
      tap(user => {
        // Handle both camelCase and snake_case from backend
        const isAdmin = user?.isSuperuser || (user as any)?.is_superuser || false;
        console.log('getCurrentUser - isAdmin:', isAdmin, 'isSuperuser:', user?.isSuperuser, 'is_superuser:', (user as any)?.is_superuser);
        this.authState.next({
          user: user || null,
          isAuthenticated: !!user,
          isAdmin
        });
        if (user) {
          this.saveUserToStorage(user);
        }
      }),
      catchError(error => {
        console.error('Failed to get current user:', error);
        this.clearAuth();
        return of(null);
      })
    ).subscribe();
  }

  logout(): void {
    this.apiAuthService.authLogoutCreate().pipe(
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

  canEditGroup(groupId: number): boolean {
    if (this.isAdmin) return true;
    return this.userGroup === groupId;
  }

  private saveUserToStorage(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // Handle both camelCase and snake_case from backend
        const isAdmin = user?.isSuperuser || user?.is_superuser || false;
        console.log('loadUserFromStorage - isAdmin:', isAdmin, 'isSuperuser:', user?.isSuperuser, 'is_superuser:', user?.is_superuser);
        this.authState.next({
          user,
          isAuthenticated: true,
          isAdmin
        });
      } catch (e) {
        this.clearAuth();
      }
    }
  }

  private clearAuth(): void {
    this.authState.next({
      user: null,
      isAuthenticated: false,
      isAdmin: false
    });
    localStorage.removeItem('user');
  }
}
