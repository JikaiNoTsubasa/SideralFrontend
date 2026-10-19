import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Paged } from '../models/api.model';
import { CommentDto, LikeDto, PostDto } from '../models/wall.model';
import { toPaged } from '../utils/paged';

@Injectable({ providedIn: 'root' })
export class WallService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/posts`;

  list(page: number, limit: number): Observable<Paged<PostDto>> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http
      .get<PostDto[]>(this.url, { params, observe: 'response' })
      .pipe(map((res) => toPaged(res, page)));
  }

  /** isAnnouncement : annonce mise en avant (administrateurs uniquement). */
  create(content: string, isAnnouncement = false): Observable<PostDto> {
    return this.http.post<PostDto>(this.url, { content, isAnnouncement });
  }

  update(id: number, content: string, isAnnouncement: boolean): Observable<PostDto> {
    return this.http.put<PostDto>(`${this.url}/${id}`, { content, isAnnouncement });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  like(id: number): Observable<LikeDto> {
    return this.http.put<LikeDto>(`${this.url}/${id}/like`, null);
  }

  unlike(id: number): Observable<LikeDto> {
    return this.http.delete<LikeDto>(`${this.url}/${id}/like`);
  }

  comments(id: number): Observable<CommentDto[]> {
    return this.http.get<CommentDto[]>(`${this.url}/${id}/comments`);
  }

  addComment(id: number, content: string): Observable<CommentDto> {
    return this.http.post<CommentDto>(`${this.url}/${id}/comments`, { content });
  }

  deleteComment(postId: number, commentId: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${postId}/comments/${commentId}`);
  }
}
