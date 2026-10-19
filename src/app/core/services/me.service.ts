import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChangePasswordRequest, UpdateMeRequest, UpdatePreferencesRequest, UserDto } from '../models/user.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class MeService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly url = `${environment.apiUrl}/me`;

  get(): Observable<UserDto> {
    return this.http.get<UserDto>(this.url).pipe(tap((u) => this.auth.setCurrentUser(u)));
  }

  update(request: UpdateMeRequest): Observable<UserDto> {
    return this.http.put<UserDto>(this.url, request).pipe(tap((u) => this.auth.setCurrentUser(u)));
  }

  updatePreferences(request: UpdatePreferencesRequest): Observable<UserDto> {
    return this.http.put<UserDto>(`${this.url}/preferences`, request).pipe(tap((u) => this.auth.setCurrentUser(u)));
  }

  /** L'image doit déjà être redimensionnée (voir resizeToSquare). */
  uploadAvatar(image: Blob): Observable<UserDto> {
    const form = new FormData();
    form.append('file', image, 'avatar');
    return this.http.put<UserDto>(`${this.url}/avatar`, form).pipe(tap((u) => this.auth.setCurrentUser(u)));
  }

  deleteAvatar(): Observable<UserDto> {
    return this.http.delete<UserDto>(`${this.url}/avatar`).pipe(tap((u) => this.auth.setCurrentUser(u)));
  }

  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.http.put<void>(`${this.url}/password`, request);
  }
}
