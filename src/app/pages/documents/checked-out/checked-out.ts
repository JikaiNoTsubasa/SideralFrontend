import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CheckedOutDocumentDto } from '../../../core/models/dms.model';
import { TimeAgoPipe } from '../../../core/pipes/time-ago.pipe';
import { DmsService } from '../../../core/services/dms.service';
import { errorMessage } from '../../../core/utils/error-message';
import { FileIcon } from '../../../shared/file-icon/file-icon';

/** Documents extraits par l'utilisateur connecté. */
@Component({
  selector: 'sd-checked-out',
  imports: [RouterLink, FileIcon, TimeAgoPipe],
  templateUrl: './checked-out.html',
})
export class CheckedOut implements OnInit {
  private readonly dms = inject(DmsService);

  protected readonly items = signal<CheckedOutDocumentDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  protected download(item: CheckedOutDocumentDto): void {
    this.dms.download(item.document.id).subscribe({ error: (err) => this.error.set(errorMessage(err)) });
  }

  protected cancel(item: CheckedOutDocumentDto): void {
    if (!confirm(`Annuler l'extraction de « ${item.document.name} » ?`)) {
      return;
    }
    this.dms.cancelCheckout(item.document.id).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.dms.checkedOut().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
