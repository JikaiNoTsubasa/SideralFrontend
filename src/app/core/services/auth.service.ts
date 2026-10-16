import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, firstValueFrom, Observable, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest } from '../models/auth.model';
import { ROLE_ADMIN, UserDto } from '../models/user.model';

const ACCESS_TOKEN_KEY = 'sideral.accessToken';
const REFRESH_TOKEN_KEY = 'sideral.refreshToken';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly url = `${environment.apiUrl}/auth`;

  private readonly _currentUser = signal<UserDto | null>(null);
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly isAdmin = computed(() => this._currentUser()?.roles.includes(ROLE_ADMIN) ?? false);

  private refreshInFlight$: Observable<AuthResponse> | null = null;

  get accessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  get refreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  /** Appelé au démarrage : recharge l'utilisateur si un token est présent. */
  async init(): Promise<void> {
    if (!this.accessToken && !this.refreshToken) {
      return;
    }
    const user = await firstValueFrom(
      this.http.get<UserDto>(`${environment.apiUrl}/me`).pipe(catchError(() => of(null))),
    );
    if (user) {
      this._currentUser.set(user);
    } else {
      this.clearSession();
    }
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.url}/login`, request).pipe(tap((res) => this.storeSession(res)));
  }

  /** Rafraîchit les tokens ; les appels concurrents partagent la même requête. */
  refresh(): Observable<AuthResponse> {
    this.refreshInFlight$ ??= this.http
      .post<AuthResponse>(`${this.url}/refresh`, { refreshToken: this.refreshToken })
      .pipe(
        tap((res) => this.storeSession(res)),
        finalize(() => (this.refreshInFlight$ = null)),
        shareReplay(1),
      );
    return this.refreshInFlight$;
  }

  logout(): void {
    const refreshToken = this.refreshToken;
    if (refreshToken && this.accessToken) {
      this.http.post(`${this.url}/logout`, { refreshToken }).pipe(catchError(() => of(null))).subscribe();
    }
    this.clearSession();
    this.router.navigate(['/login']);
  }

  setCurrentUser(user: UserDto): void {
    this._currentUser.set(user);
  }

  clearSession(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    this._currentUser.set(null);
  }

  private storeSession(res: AuthResponse): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, res.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
    this._currentUser.set(res.user);
  }
}
