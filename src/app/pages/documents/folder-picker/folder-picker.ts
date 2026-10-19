import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FolderContentDto, hasLevel, PermissionLevel } from '../../../core/models/dms.model';
import { DmsService } from '../../../core/services/dms.service';
import { errorMessage } from '../../../core/utils/error-message';
import { FileIcon } from '../../../shared/file-icon/file-icon';
import { Modal } from '../../../shared/modal/modal';

/** Choix d'un dossier de destination (déplacement) en naviguant dans l'arborescence. */
@Component({
  selector: 'sd-folder-picker',
  imports: [Modal, FileIcon],
  templateUrl: './folder-picker.html',
  styleUrl: './folder-picker.scss',
})
export class FolderPicker implements OnInit {
  private readonly dms = inject(DmsService);

  readonly title = input('Déplacer vers…');
  /** Droit requis sur le dossier de destination. */
  readonly requiredLevel = input<PermissionLevel>('Write');
  /** La racine est-elle une destination valide (dossiers, administrateurs) ? */
  readonly allowRoot = input(false);
  /** Dossier masqué (le dossier déplacé : on ne peut pas le déplacer dans lui-même). */
  readonly hiddenFolderId = input<number | null>(null);
  /** Dossier de départ. */
  readonly startFolderId = input<number | null>(null);

  readonly picked = output<number | null>();
  readonly closed = output<void>();

  protected readonly content = signal<FolderContentDto | null>(null);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.open(this.startFolderId());
  }

  protected open(folderId: number | null): void {
    this.error.set(null);
    this.dms.browse(folderId).subscribe({
      next: (content) => this.content.set(content),
      error: (err) => {
        // Dossier de départ inaccessible : on repart de la racine
        if (folderId !== null) {
          this.open(null);
        } else {
          this.error.set(errorMessage(err));
        }
      },
    });
  }

  protected canPick(content: FolderContentDto): boolean {
    return content.folder === null ? this.allowRoot() : hasLevel(content.myLevel, this.requiredLevel());
  }

  protected parentId(content: FolderContentDto): number | null {
    const crumbs = content.breadcrumb;
    return crumbs.length >= 2 ? crumbs[crumbs.length - 2].id : null;
  }
}
