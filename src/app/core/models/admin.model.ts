/** Planification de l'indexeur. */
export interface FullTextScheduleDto {
  /** Délai entre deux passages (l'indexeur est aussi réveillé à chaque nouveau document). */
  intervalSeconds: number;
  /** Documents envoyés par passage (lot plein = passage suivant immédiat). */
  batchSize: number;
  /** Plafond du délai entre deux tentatives quand le serveur est injoignable (1, 2, 4… min). */
  maxRetryDelayMinutes: number;
}

/** Configuration du serveur full text. */
export interface FullTextConfigDto {
  enabled: boolean;
  url: string | null;
  applicationCode: string | null;
  schedule: FullTextScheduleDto;
  updatedOn: string | null;
  updatedBy: string | null;
}

export interface FullTextConfigRequest extends FullTextScheduleDto {
  enabled: boolean;
  url: string | null;
  applicationCode: string | null;
}

export interface FullTextStatusDto {
  reachable: boolean;
  statusCode: number | null;
  latencyMs: number | null;
  message: string;
  checkedOn: string;
}

/** Dernier passage de l'indexeur et prochain passage prévu (depuis le démarrage de l'API). */
export interface FullTextRunInfoDto {
  lastRunOn: string | null;
  lastRunSent: number;
  lastRunError: string | null;
  nextRunOn: string | null;
}

/** Documents par état d'indexation ; retrying = en attente après une erreur temporaire (inclus dans pending). */
export interface FullTextStatsDto {
  indexed: number;
  pending: number;
  retrying: number;
  failed: number;
  runs: FullTextRunInfoDto;
}

export type FullTextStatus = 'PENDING' | 'INDEXED' | 'FAILED';

/** Document en attente d'indexation ou en échec. */
export interface FullTextQueueItemDto {
  documentId: number;
  name: string;
  folderId: number;
  folderName: string;
  status: FullTextStatus;
  attempts: number;
  nextAttemptOn: string | null;
  error: string | null;
  updatedOn: string;
}

export const FULLTEXT_SCHEDULE_LIMITS = {
  intervalSeconds: { min: 5, max: 86400 },
  batchSize: { min: 1, max: 100 },
  maxRetryDelayMinutes: { min: 1, max: 1440 },
} as const;

export const FULLTEXT_APPLICATION_CODE_PATTERN = /^[A-Za-z0-9_-]{1,50}$/;
