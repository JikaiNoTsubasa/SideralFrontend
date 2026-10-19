import { AccentColor, Theme } from './theme.model';

export interface UserDto {
  id: number;
  login: string;
  email: string;
  firstname: string;
  lastname: string;
  jobTitle: string | null;
  /** Nom du fichier avatar (URL via avatarUrl()). */
  avatar: string | null;
  isActive: boolean;
  forceUpdatePassword: boolean;
  roles: string[];
  createdOn: string;
  lastLoginOn: string | null;
  theme: Theme;
  accentColor: AccentColor;
}

export interface RoleDto {
  id: number;
  key: string;
  name: string;
}

export interface UpdateMeRequest {
  email: string;
  firstname: string;
  lastname: string;
  jobTitle: string | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/** L'identifiant est généré par l'API. */
export interface CreateUserRequest {
  email: string;
  firstname: string;
  lastname: string;
  jobTitle: string | null;
  password: string;
  roles: string[];
}

export interface UpdateUserRequest {
  email: string;
  firstname: string;
  lastname: string;
  jobTitle: string | null;
  isActive: boolean;
  roles: string[];
}

export interface UpdatePreferencesRequest {
  theme: Theme;
  accentColor: AccentColor;
}

export const ROLE_ADMIN = 'ADMIN';
