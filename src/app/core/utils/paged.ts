import { HttpResponse } from '@angular/common/http';
import { Paged } from '../models/api.model';

/** Construit un résultat paginé à partir du corps et des en-têtes de pagination de l'API. */
export function toPaged<T>(res: HttpResponse<T[]>, page: number): Paged<T> {
  const header = (name: string, fallback: number) => Number(res.headers.get(name) ?? fallback);
  const items = res.body ?? [];
  return {
    items,
    page: header('page', page),
    pageSize: header('page-size', items.length),
    pageCount: header('page-count', 1),
    total: header('total', items.length),
  };
}
