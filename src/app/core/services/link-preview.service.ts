import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LinkPreviewDto } from '../models/wall.model';

/** Aperçus des liens du mur, mis en cache pour la session (un lien peut apparaître plusieurs fois). */
@Injectable({ providedIn: 'root' })
export class LinkPreviewService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/link-preview`;
  private readonly cache = new Map<string, Observable<LinkPreviewDto | null>>();

  /** Aperçu du lien, ou null s'il n'est pas disponible (204 ou erreur : le lien reste cliquable). */
  get(link: string): Observable<LinkPreviewDto | null> {
    let preview$ = this.cache.get(link);
    if (!preview$) {
      preview$ = this.http.get<LinkPreviewDto | null>(this.url, { params: new HttpParams().set('url', link) }).pipe(
        map((preview) => preview ?? null),
        catchError(() => of(null)),
        shareReplay(1),
      );
      this.cache.set(link, preview$);
    }
    return preview$;
  }
}
