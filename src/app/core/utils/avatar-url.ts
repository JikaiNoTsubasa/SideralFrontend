import { environment } from '../../../environments/environment';

export function avatarUrl(fileName: string | null | undefined): string | null {
  return fileName ? `${environment.apiUrl}/avatars/${encodeURIComponent(fileName)}` : null;
}
