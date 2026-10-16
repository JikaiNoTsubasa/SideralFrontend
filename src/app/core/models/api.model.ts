export interface ProblemDetails {
  type?: string;
  title?: string;
  detail?: string;
  status?: number;
  instance?: string;
  errorCode?: string;
  timestamp?: string;
  traceId?: string;
}

export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}
