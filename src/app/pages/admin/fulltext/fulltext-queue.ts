import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { interval } from 'rxjs';
import { FullTextQueueItemDto, FullTextStatus } from '../../../core/models/admin.model';
import { Paged } from '../../../core/models/api.model';
import { AdminService } from '../../../core/services/admin.service';
import { errorMessage } from '../../../core/utils/error-message';

const PAGE_SIZE = 20;
const REFRESH_MS = 15_000;

/** Documents en attente d'indexation et en échec (paginés, filtrables, actualisés automatiquement). */
@Component({
  selector: 'sd-fulltext-queue',
  imports: [DatePipe, RouterLink],
  templateUrl: './fulltext-queue.html',
  styleUrl: './fulltext-queue.scss',
})
export class FullTextQueue implements OnInit {
  private readonly admin = inject(AdminService);

  protected readonly filters: { key: FullTextStatus | null; label: string }[] = [
    { key: null, label: 'Tous' },
    { key: 'PENDING', label: 'En attente' },
    { key: 'FAILED', label: 'Échecs' },
  ];

  protected readonly filter = signal<FullTextStatus | null>(null);
  protected readonly page = signal(1);
  protected readonly result = signal<Paged<FullTextQueueItemDto> | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor() {
    interval(REFRESH_MS)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.reload(true));
  }

  ngOnInit(): void {
    this.reload();
  }

  setFilter(filter: FullTextStatus | null): void {
    this.filter.set(filter);
    this.page.set(1);
    this.reload();
  }

  goTo(page: number): void {
    this.page.set(page);
    this.reload();
  }

  /** Recharge la page courante (silent = actualisation automatique, sans indicateur de chargement). */
  reload(silent = false): void {
    if (!silent) {
      this.loading.set(true);
    }
    this.admin.fullTextQueue(this.filter(), this.page(), PAGE_SIZE).subscribe({
      next: (res) => {
        // Page devenue vide (documents indexés entre-temps) : on revient à la dernière page existante
        if (res.items.length === 0 && this.page() > 1 && this.page() > res.pageCount) {
          this.goTo(Math.max(1, res.pageCount));
          return;
        }
        this.result.set(res);
        this.error.set(null);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
