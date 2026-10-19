import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { TrashItemDto } from '../../../core/models/dms.model';
import { DmsService } from '../../../core/services/dms.service';
import { errorMessage } from '../../../core/utils/error-message';
import { FileIcon } from '../../../shared/file-icon/file-icon';

/** Corbeille : éléments supprimés des dossiers dont l'utilisateur est gestionnaire. */
@Component({
  selector: 'sd-trash',
  imports: [FileIcon, DatePipe],
  templateUrl: './trash.html',
})
export class Trash implements OnInit {
  private readonly dms = inject(DmsService);

  protected readonly items = signal<TrashItemDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  protected restore(item: TrashItemDto): void {
    this.run(this.dms.restore(item));
  }

  protected purge(item: TrashItemDto): void {
    const what = item.type === 'folder' ? `le dossier « ${item.name} » et tout son contenu` : `le document « ${item.name} » et toutes ses versions`;
    if (confirm(`Supprimer définitivement ${what} ? Cette action est irréversible.`)) {
      this.run(this.dms.purge(item));
    }
  }

  protected empty(): void {
    if (confirm('Vider la corbeille ? Tous les éléments seront supprimés définitivement.')) {
      this.run(this.dms.emptyTrash());
    }
  }

  private load(): void {
    this.loading.set(true);
    this.dms.trash().subscribe({
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

  private run(request$: Observable<void>): void {
    this.busy.set(true);
    this.error.set(null);
    request$.subscribe({
      next: () => {
        this.busy.set(false);
        this.load();
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(errorMessage(err));
      },
    });
  }
}
