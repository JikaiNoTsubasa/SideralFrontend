import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChangePasswordRequest, UpdateMeRequest, UserDto } from '../models/user.model';
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

  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.http.put<void>(`${this.url}/password`, request);
  }
}
