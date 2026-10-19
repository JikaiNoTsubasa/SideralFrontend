import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PrincipalDto } from '../models/principal.model';

@Injectable({ providedIn: 'root' })
export class PrincipalService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/principals`;

  search(search: string, users = true, groups = true): Observable<PrincipalDto[]> {
    const params = new HttpParams().set('search', search).set('users', users).set('groups', groups);
    return this.http.get<PrincipalDto[]>(this.url, { params });
  }
}
