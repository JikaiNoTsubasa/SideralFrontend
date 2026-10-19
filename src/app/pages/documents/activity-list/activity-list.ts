import { Component, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActivityDto, DMS_ACTION_LABELS } from '../../../core/models/dms.model';
import { TimeAgoPipe } from '../../../core/pipes/time-ago.pipe';
import { DmsService } from '../../../core/services/dms.service';
import { errorMessage } from '../../../core/utils/error-message';
import { Avatar } from '../../../shared/avatar/avatar';

const PAGE_SIZE = 20;

/** Journal d'activité d'un dossier ou d'un document (paginé, « Voir plus »). */
@Component({
  selector: 'sd-activity-list',
  imports: [Avatar, TimeAgoPipe, RouterLink],
  templateUrl: './activity-list.html',
  styleUrl: './activity-list.scss',
})
export class ActivityList {
  private readonly dms = inject(DmsService);

  readonly folderId = input<number | null>(null);
  readonly documentId = input<number | null>(null);

  protected readonly items = signal<ActivityDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly hasMore = signal(false);
  protected readonly labels = DMS_ACTION_LABELS;
  private page = 0;

  constructor() {
    effect(() => {
      this.folderId();
      this.documentId();
      this.page = 0;
      this.items.set([]);
      this.loadMore();
    });
  }

  /** Recharge depuis le début (après une action). */
  reload(): void {
    this.page = 0;
    this.items.set([]);
    this.loadMore();
  }

  protected loadMore(): void {
    const folderId = this.folderId();
    const documentId = this.documentId();
    if (folderId === null && documentId === null) {
      return;
    }
    const next = this.page + 1;
    const request$ =
      documentId !== null
        ? this.dms.documentActivity(documentId, next, PAGE_SIZE)
        : this.dms.folderActivity(folderId!, next, PAGE_SIZE);

    this.loading.set(true);
    this.error.set(null);
    request$.subscribe({
      next: (res) => {
        this.page = next;
        this.items.update((items) => [...items, ...res.items]);
        this.hasMore.set(res.page < res.pageCount);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  protected isFolderAction(item: ActivityDto): boolean {
    return item.documentId === null;
  }
}
