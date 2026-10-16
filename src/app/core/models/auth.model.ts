import { UserDto } from './user.model';

export interface LoginRequest {
  login: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  accessTokenExpiresOn: string;
  refreshToken: string;
  refreshTokenExpiresOn: string;
  user: UserDto;
}
