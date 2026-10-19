import { PrincipalDto } from './principal.model';

export interface GroupDto {
  id: number;
  name: string;
  description: string | null;
  memberCount: number;
  createdOn: string;
}

export interface GroupDetailDto {
  id: number;
  name: string;
  description: string | null;
  createdOn: string;
  members: PrincipalDto[];
}

export interface GroupRequest {
  name: string;
  description: string | null;
  memberIds: number[];
}

export const GROUP_NAME_MAX_LENGTH = 100;
export const GROUP_DESCRIPTION_MAX_LENGTH = 500;
