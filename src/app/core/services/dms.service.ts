import { HttpClient, HttpEvent, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Paged } from '../models/api.model';
import {
  ActivityDto,
  CheckedOutDocumentDto,
  ContentLinkDto,
  DocumentDto,
  FolderContentDto,
  FolderPermissionsDto,
  FolderRefDto,
  SetPermissionsRequest,
  TrashItemDto,
} from '../models/dms.model';
import { toPaged } from '../utils/paged';

/** GED : dossiers, documents, versions et corbeille. */
@Injectable({ providedIn: 'root' })
export class DmsService {
  private readonly http = inject(HttpClient);
  private readonly folders = `${environment.apiUrl}/folders`;
  private readonly documents = `${environment.apiUrl}/documents`;
  private readonly trashUrl = `${environment.apiUrl}/trash`;

  // ---- Dossiers

  /** Contenu d'un dossier (null = racine). */
  browse(folderId: number | null): Observable<FolderContentDto> {
    return this.http.get<FolderContentDto>(folderId === null ? `${this.folders}/root` : `${this.folders}/${folderId}`);
  }

  createFolder(parentId: number | null, name: string): Observable<FolderRefDto> {
    return this.http.post<FolderRefDto>(this.folders, { parentId, name });
  }

  renameFolder(id: number, name: string): Observable<FolderRefDto> {
    return this.http.put<FolderRefDto>(`${this.folders}/${id}`, { name });
  }

  moveFolder(id: number, parentId: number | null): Observable<FolderRefDto> {
    return this.http.put<FolderRefDto>(`${this.folders}/${id}/move`, { parentId });
  }

  deleteFolder(id: number): Observable<void> {
    return this.http.delete<void>(`${this.folders}/${id}`);
  }

  permissions(folderId: number): Observable<FolderPermissionsDto> {
    return this.http.get<FolderPermissionsDto>(`${this.folders}/${folderId}/permissions`);
  }

  setPermissions(folderId: number, request: SetPermissionsRequest): Observable<FolderPermissionsDto> {
    return this.http.put<FolderPermissionsDto>(`${this.folders}/${folderId}/permissions`, request);
  }

  folderActivity(folderId: number, page: number, limit: number): Observable<Paged<ActivityDto>> {
    return this.pagedActivity(`${this.folders}/${folderId}/activity`, page, limit);
  }

  /** Dépôt d'un document, avec suivi de progression (observe: 'events'). */
  upload(folderId: number, file: File): Observable<HttpEvent<DocumentDto>> {
    const body = new FormData();
    body.append('file', file, file.name);
    return this.http.post<DocumentDto>(`${this.folders}/${folderId}/documents`, body, {
      reportProgress: true,
      observe: 'events',
    });
  }

  // ---- Documents

  document(id: number): Observable<DocumentDto> {
    return this.http.get<DocumentDto>(`${this.documents}/${id}`);
  }

  checkedOut(): Observable<CheckedOutDocumentDto[]> {
    return this.http.get<CheckedOutDocumentDto[]>(`${this.documents}/checked-out`);
  }

  updateDocument(id: number, name: string, description: string | null): Observable<DocumentDto> {
    return this.http.put<DocumentDto>(`${this.documents}/${id}`, { name, description });
  }

  moveDocument(id: number, folderId: number): Observable<DocumentDto> {
    return this.http.put<DocumentDto>(`${this.documents}/${id}/move`, { folderId });
  }

  deleteDocument(id: number): Observable<void> {
    return this.http.delete<void>(`${this.documents}/${id}`);
  }

  checkout(id: number): Observable<DocumentDto> {
    return this.http.post<DocumentDto>(`${this.documents}/${id}/checkout`, null);
  }

  cancelCheckout(id: number): Observable<DocumentDto> {
    return this.http.delete<DocumentDto>(`${this.documents}/${id}/checkout`);
  }

  /** Archive une nouvelle version (libère l'extraction). */
  checkin(id: number, file: File, major: boolean, comment: string | null): Observable<HttpEvent<DocumentDto>> {
    const body = new FormData();
    body.append('file', file, file.name);
    body.append('major', String(major));
    if (comment) {
      body.append('comment', comment);
    }
    return this.http.post<DocumentDto>(`${this.documents}/${id}/versions`, body, {
      reportProgress: true,
      observe: 'events',
    });
  }

  restoreVersion(id: number, versionId: number): Observable<DocumentDto> {
    return this.http.post<DocumentDto>(`${this.documents}/${id}/versions/${versionId}/restore`, null);
  }

  documentActivity(id: number, page: number, limit: number): Observable<Paged<ActivityDto>> {
    return this.pagedActivity(`${this.documents}/${id}/activity`, page, limit);
  }

  /** URL signée du contenu, utilisable dans <img>, <iframe>, <video> ou un lien (versionId absent = version courante). */
  contentUrl(id: number, versionId: number | null, download: boolean): Observable<string> {
    let params = new HttpParams().set('download', download);
    if (versionId !== null) {
      params = params.set('versionId', versionId);
    }
    return this.http
      .get<ContentLinkDto>(`${this.documents}/${id}/link`, { params })
      .pipe(map((link) => `${this.documents}/content?token=${encodeURIComponent(link.token)}`));
  }

  /** Lance le téléchargement natif du navigateur (pas de chargement en mémoire). */
  download(id: number, versionId: number | null = null): Observable<void> {
    return this.contentUrl(id, versionId, true).pipe(
      map((url) => {
        const link = document.createElement('a');
        link.href = url;
        link.rel = 'noopener';
        document.body.appendChild(link);
        link.click();
        link.remove();
      }),
    );
  }

  /** Contenu texte (aperçu des fichiers texte). */
  text(url: string): Observable<string> {
    return this.http.get(url, { responseType: 'text' });
  }

  // ---- Corbeille

  trash(): Observable<TrashItemDto[]> {
    return this.http.get<TrashItemDto[]>(this.trashUrl);
  }

  restore(item: TrashItemDto): Observable<void> {
    return this.http.post<void>(`${this.trashUrl}/${item.type}s/${item.id}/restore`, null);
  }

  purge(item: TrashItemDto): Observable<void> {
    return this.http.delete<void>(`${this.trashUrl}/${item.type}s/${item.id}`);
  }

  emptyTrash(): Observable<void> {
    return this.http.delete<void>(this.trashUrl);
  }

  private pagedActivity(url: string, page: number, limit: number): Observable<Paged<ActivityDto>> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<ActivityDto[]>(url, { params, observe: 'response' }).pipe(map((res) => toPaged(res, page)));
  }
}
