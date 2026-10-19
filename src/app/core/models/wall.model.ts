export interface AuthorDto {
  id: number;
  firstname: string;
  lastname: string;
  jobTitle: string | null;
  avatar: string | null;
}

export interface CommentDto {
  id: number;
  postId: number;
  author: AuthorDto;
  content: string;
  createdOn: string;
}

export interface PostDto {
  id: number;
  author: AuthorDto;
  content: string;
  /** Annonce mise en avant (publiée par un administrateur). */
  isAnnouncement: boolean;
  createdOn: string;
  updatedOn: string | null;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
  /** Derniers commentaires, du plus ancien au plus récent. */
  latestComments: CommentDto[];
}

export interface LikeDto {
  postId: number;
  likeCount: number;
  likedByMe: boolean;
}

export const POST_MAX_LENGTH = 5000;
export const COMMENT_MAX_LENGTH = 2000;

/** Aperçu d'un lien ; youtubeVideoId renseigné pour une vidéo YouTube (lecteur intégré). */
export interface LinkPreviewDto {
  url: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  siteName: string | null;
  youtubeVideoId: string | null;
}
