import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Paged } from '../models/api.model';
import { CreateUserRequest, RoleDto, UpdateUserRequest, UserDto } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/users`;

  list(page: number, limit: number, search?: string): Observable<Paged<UserDto>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<UserDto[]>(this.url, { params, observe: 'response' }).pipe(
      map((res) => {
        const header = (name: string, fallback: number) => Number(res.headers.get(name) ?? fallback);
        const items = res.body ?? [];
        return {
          items,
          page: header('page', page),
          pageSize: header('page-size', items.length),
          pageCount: header('page-count', 1),
          total: header('total', items.length),
        };
      }),
    );
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
