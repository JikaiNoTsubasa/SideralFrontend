import { Component, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { DocumentSearchDto, SEARCH_MIN_LENGTH } from '../../../core/models/dms.model';
import { FileSizePipe } from '../../../core/pipes/file-size.pipe';
import { TimeAgoPipe } from '../../../core/pipes/time-ago.pipe';
import { DmsService } from '../../../core/services/dms.service';
import { errorMessage } from '../../../core/utils/error-message';
import { FileIcon } from '../../../shared/file-icon/file-icon';

/** Résultats de recherche (?q=) : nom / description et contenu (full text), filtrés par les droits. */
@Component({
  selector: 'sd-search-results',
  imports: [RouterLink, FileIcon, TimeAgoPipe, FileSizePipe],
  templateUrl: './search-results.html',
  styleUrl: './search-results.scss',
})
export class SearchResults {
  private readonly dms = inject(DmsService);

  /** Paramètre de requête `q`. */
  readonly q = input<string>();

  protected readonly result = signal<DocumentSearchDto | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly minLength = SEARCH_MIN_LENGTH;

  constructor() {
    effect((onCleanup) => {
      const q = this.q()?.trim() ?? '';
      this.result.set(null);
      this.error.set(null);
      if (q.length < SEARCH_MIN_LENGTH) {
        return;
      }
      this.loading.set(true);
      const subscription: Subscription = this.dms.search(q).subscribe({
        next: (result) => {
          this.result.set(result);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(errorMessage(err));
          this.loading.set(false);
        },
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }
}
