import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Paged } from '../models/api.model';
import { CreateUserRequest, RoleDto, UpdateUserRequest, UserDto } from '../models/user.model';
import { toPaged } from '../utils/paged';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/users`;

  list(page: number, limit: number, search?: string): Observable<Paged<UserDto>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (search) {
      params = params.set('search', search);
    }
    return this.http
      .get<UserDto[]>(this.url, { params, observe: 'response' })
      .pipe(map((res) => toPaged(res, page)));
  }

  /** Identifiant qui sera attribué à la création (3 lettres, unique). */
  loginSuggestion(firstname: string, lastname: string): Observable<string> {
    const params = new HttpParams().set('firstname', firstname).set('lastname', lastname);
    return this.http.get<{ login: string }>(`${this.url}/login-suggestion`, { params }).pipe(map((res) => res.login));
  }

  get(id: number): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.url}/${id}`);
  }

  create(request: CreateUserRequest): Observable<UserDto> {
    return this.http.post<UserDto>(this.url, request);
  }

  update(id: number, request: UpdateUserRequest): Observable<UserDto> {
    return this.http.put<UserDto>(`${this.url}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  roles(): Observable<RoleDto[]> {
    return this.http.get<RoleDto[]>(`${environment.apiUrl}/roles`);
  }
}
