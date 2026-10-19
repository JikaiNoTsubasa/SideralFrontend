import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Paged } from '../models/api.model';
import {
  FullTextConfigDto,
  FullTextConfigRequest,
  FullTextQueueItemDto,
  FullTextStatsDto,
  FullTextStatus,
  FullTextStatusDto,
} from '../models/admin.model';
import { toPaged } from '../utils/paged';

/** Administration (réservée aux ADMIN). */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly fullTextUrl = `${environment.apiUrl}/admin/fulltext`;

  fullTextConfig(): Observable<FullTextConfigDto> {
    return this.http.get<FullTextConfigDto>(this.fullTextUrl);
  }

  updateFullTextConfig(request: FullTextConfigRequest): Observable<FullTextConfigDto> {
    return this.http.put<FullTextConfigDto>(this.fullTextUrl, request);
  }

  /** Teste la connexion ; url absente = URL enregistrée. */
  checkFullText(url?: string | null): Observable<FullTextStatusDto> {
    return this.http.post<FullTextStatusDto>(`${this.fullTextUrl}/check`, { url: url || null });
  }

  fullTextStats(): Observable<FullTextStatsDto> {
    return this.http.get<FullTextStatsDto>(`${this.fullTextUrl}/stats`);
  }

  /** Documents en attente et / ou en échec (status absent = les deux). */
  fullTextQueue(status: FullTextStatus | null, page: number, limit: number): Observable<Paged<FullTextQueueItemDto>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (status) {
      params = params.set('status', status);
    }
    return this.http
      .get<FullTextQueueItemDto[]>(`${this.fullTextUrl}/queue`, { params, observe: 'response' })
      .pipe(map((res) => toPaged(res, page)));
  }

  /** Remet les documents en file d'indexation ; renvoie le nombre de documents concernés. */
  reindexFullText(onlyFailed: boolean): Observable<number> {
    const params = new HttpParams().set('onlyFailed', onlyFailed);
    return this.http.post<{ queued: number }>(`${this.fullTextUrl}/reindex`, null, { params }).pipe(map((res) => res.queued));
  }
}
