export interface UserDto {
  id: number;
  login: string;
  email: string;
  firstname: string;
  lastname: string;
  jobTitle: string | null;
  isActive: boolean;
  forceUpdatePassword: boolean;
  roles: string[];
  createdOn: string;
  lastLoginOn: string | null;
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

export interface CreateUserRequest {
  login: string;
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

export const ROLE_ADMIN = 'ADMIN';
