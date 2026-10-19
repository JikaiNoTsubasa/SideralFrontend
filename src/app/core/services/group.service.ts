import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Paged } from '../models/api.model';
import { GroupDetailDto, GroupDto, GroupRequest } from '../models/group.model';
import { toPaged } from '../utils/paged';

@Injectable({ providedIn: 'root' })
export class GroupService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/groups`;

  list(page: number, limit: number, search?: string): Observable<Paged<GroupDto>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (search) {
      params = params.set('search', search);
    }
    return this.http
      .get<GroupDto[]>(this.url, { params, observe: 'response' })
      .pipe(map((res) => toPaged(res, page)));
  }

  get(id: number): Observable<GroupDetailDto> {
    return this.http.get<GroupDetailDto>(`${this.url}/${id}`);
  }

  create(request: GroupRequest): Observable<GroupDetailDto> {
    return this.http.post<GroupDetailDto>(this.url, request);
  }

  update(id: number, request: GroupRequest): Observable<GroupDetailDto> {
    return this.http.put<GroupDetailDto>(`${this.url}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
