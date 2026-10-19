import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SEARCH_MIN_LENGTH } from '../../../core/models/dms.model';

/** Mise en page de la GED : recherche + navigation latérale + contenu. */
@Component({
  selector: 'sd-documents-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ReactiveFormsModule],
  templateUrl: './documents-layout.html',
  styleUrl: './documents-layout.scss',
})
export class DocumentsLayout {
  private readonly router = inject(Router);

  protected readonly searchForm = inject(NonNullableFormBuilder).group({
    q: ['', [Validators.required, Validators.minLength(SEARCH_MIN_LENGTH)]],
  });

  constructor() {
    // Le champ reflète la recherche affichée (lien partagé, retour arrière)
    inject(ActivatedRoute)
      .queryParamMap.pipe(takeUntilDestroyed())
      .subscribe((params) => {
        const q = params.get('q');
        if (q !== null && q !== this.searchForm.controls.q.value) {
          this.searchForm.controls.q.setValue(q);
        }
      });
  }

  search(): void {
    const q = this.searchForm.getRawValue().q.trim();
    if (q.length < SEARCH_MIN_LENGTH) {
      return;
    }
    this.router.navigate(['/documents/search'], { queryParams: { q } });
  }
}
