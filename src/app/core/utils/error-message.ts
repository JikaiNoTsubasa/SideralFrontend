import { HttpErrorResponse } from '@angular/common/http';
import { ProblemDetails } from '../models/api.model';

/** Extrait un message lisible d'une erreur HTTP (ProblemDetails côté API). */
export function errorMessage(error: unknown, fallback = 'Une erreur inattendue est survenue.'): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'Impossible de joindre le serveur.';
    }
    const problem = error.error as ProblemDetails | null;
    if (problem && typeof problem === 'object') {
      return problem.detail || problem.title || fallback;
    }
  }
  return fallback;
}
