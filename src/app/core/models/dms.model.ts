import { PrincipalDto } from './principal.model';

// Valeurs synchronisées avec sideral-context/Dms (PermissionLevel, DmsAction)
export type PermissionLevel = 'None' | 'Read' | 'Write' | 'Manage';

export const PERMISSION_LEVELS: { key: Exclude<PermissionLevel, 'None'>; label: string; description: string }[] = [
  { key: 'Read', label: 'Lecteur', description: 'Voir, prévisualiser et télécharger' },
  { key: 'Write', label: 'Contributeur', description: 'Ajouter des documents, extraire et archiver' },
  { key: 'Manage', label: 'Gestionnaire', description: 'Sous-dossiers, droits, déplacement et suppression' },
];

const LEVEL_RANK: Record<PermissionLevel, number> = { None: 0, Read: 1, Write: 2, Manage: 3 };

export function hasLevel(level: PermissionLevel, required: PermissionLevel): boolean {
  return LEVEL_RANK[level] >= LEVEL_RANK[required];
}

export function levelLabel(level: PermissionLevel): string {
  return PERMISSION_LEVELS.find((l) => l.key === level)?.label ?? 'Aucun';
}

export interface UserRefDto {
  id: number;
  firstname: string;
  lastname: string;
  avatar: string | null;
}

export interface FolderRefDto {
  id: number;
  name: string;
}

export interface FolderItemDto {
  id: number;
  name: string;
  createdOn: string;
  updatedOn: string | null;
  createdBy: UserRefDto;
  myLevel: PermissionLevel;
}

export interface DocumentItemDto {
  id: number;
  name: string;
  description: string | null;
  /** Libellé de la version courante ("1.2"). */
  version: string;
  size: number;
  contentType: string;
  updatedOn: string;
  updatedBy: UserRefDto;
  checkedOutBy: UserRefDto | null;
  checkedOutOn: string | null;
}

/** Contenu d'un dossier ; folder null = racine. */
export interface FolderContentDto {
  folder: FolderRefDto | null;
  inheritPermissions: boolean;
  breadcrumb: FolderRefDto[];
  myLevel: PermissionLevel;
  canCreateFolder: boolean;
  canUpload: boolean;
  folders: FolderItemDto[];
  documents: DocumentItemDto[];
}

export interface VersionDto {
  id: number;
  label: string;
  major: number;
  minor: number;
  originalName: string;
  contentType: string;
  size: number;
  sha256: string;
  comment: string | null;
  createdOn: string;
  createdBy: UserRefDto;
}

/** Fiche document ; versions de la plus récente (courante) à la plus ancienne. */
export interface DocumentDto {
  id: number;
  folderId: number;
  name: string;
  description: string | null;
  createdOn: string;
  createdBy: UserRefDto;
  updatedOn: string | null;
  checkedOutBy: UserRefDto | null;
  checkedOutOn: string | null;
  myLevel: PermissionLevel;
  canCancelCheckout: boolean;
  breadcrumb: FolderRefDto[];
  versions: VersionDto[];
}

export interface CheckedOutDocumentDto {
  document: DocumentItemDto;
  folderId: number;
  location: string;
}

export interface PermissionEntryDto {
  principal: PrincipalDto;
  level: PermissionLevel;
}

export interface InheritedPermissionDto {
  principal: PrincipalDto;
  level: PermissionLevel;
  from: FolderRefDto;
}

export interface FolderPermissionsDto {
  folderId: number;
  /** Dossier racine : pas d'héritage possible. */
  isRoot: boolean;
  inheritPermissions: boolean;
  canManage: boolean;
  entries: PermissionEntryDto[];
  inherited: InheritedPermissionDto[];
}

export interface SetPermissionsRequest {
  inheritPermissions: boolean;
  entries: { userId: number | null; groupId: number | null; level: PermissionLevel }[];
}

export type DmsAction =
  | 'FOLDER_CREATED'
  | 'FOLDER_RENAMED'
  | 'FOLDER_MOVED'
  | 'FOLDER_DELETED'
  | 'FOLDER_RESTORED'
  | 'PERMISSIONS_CHANGED'
  | 'DOCUMENT_CREATED'
  | 'DOCUMENT_UPDATED'
  | 'DOCUMENT_MOVED'
  | 'DOCUMENT_DOWNLOADED'
  | 'DOCUMENT_CHECKED_OUT'
  | 'DOCUMENT_CHECKOUT_CANCELLED'
  | 'DOCUMENT_CHECKED_IN'
  | 'VERSION_RESTORED'
  | 'DOCUMENT_DELETED'
  | 'DOCUMENT_RESTORED';

export const DMS_ACTION_LABELS: Record<DmsAction, string> = {
  FOLDER_CREATED: 'a créé le dossier',
  FOLDER_RENAMED: 'a renommé le dossier',
  FOLDER_MOVED: 'a déplacé le dossier',
  FOLDER_DELETED: 'a supprimé le dossier',
  FOLDER_RESTORED: 'a restauré le dossier',
  PERMISSIONS_CHANGED: 'a modifié les droits du dossier',
  DOCUMENT_CREATED: 'a ajouté',
  DOCUMENT_UPDATED: 'a modifié',
  DOCUMENT_MOVED: 'a déplacé',
  DOCUMENT_DOWNLOADED: 'a téléchargé',
  DOCUMENT_CHECKED_OUT: 'a extrait',
  DOCUMENT_CHECKOUT_CANCELLED: "a annulé l'extraction de",
  DOCUMENT_CHECKED_IN: 'a archivé une nouvelle version de',
  VERSION_RESTORED: 'a restauré une version de',
  DOCUMENT_DELETED: 'a supprimé',
  DOCUMENT_RESTORED: 'a restauré',
};

export interface ActivityDto {
  id: number;
  action: DmsAction;
  details: string | null;
  createdOn: string;
  user: UserRefDto;
  folderId: number;
  folderName: string;
  documentId: number | null;
  documentName: string | null;
}

export interface TrashItemDto {
  type: 'folder' | 'document';
  id: number;
  name: string;
  /** Emplacement d'origine. */
  location: string;
  deletedOn: string;
  deletedBy: UserRefDto | null;
}

export interface ContentLinkDto {
  token: string;
  expiresOn: string;
}

export const DOCUMENT_MAX_SIZE = 100 * 1024 * 1024;
export const DOCUMENT_DESCRIPTION_MAX_LENGTH = 2000;
export const VERSION_COMMENT_MAX_LENGTH = 1000;
