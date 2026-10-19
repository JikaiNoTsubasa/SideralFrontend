export type PrincipalType = 'user' | 'group';

/** Utilisateur ou groupe (firstname/lastname/avatar : utilisateurs uniquement). */
export interface PrincipalDto {
  type: PrincipalType;
  id: number;
  name: string;
  detail: string | null;
  firstname: string | null;
  lastname: string | null;
  avatar: string | null;
}
