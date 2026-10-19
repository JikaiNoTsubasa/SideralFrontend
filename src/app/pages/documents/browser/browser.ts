import { HttpEventType } from '@angular/common/http';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import {
  DOCUMENT_MAX_SIZE,
  DocumentItemDto,
  FolderContentDto,
  FolderItemDto,
  hasLevel,
  levelLabel,
} from '../../../core/models/dms.model';
import { FileSizePipe } from '../../../core/pipes/file-size.pipe';
import { TimeAgoPipe } from '../../../core/pipes/time-ago.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { DmsService } from '../../../core/services/dms.service';
import { errorMessage } from '../../../core/utils/error-message';
import { formatSize } from '../../../core/utils/file';
import { FileIcon } from '../../../shared/file-icon/file-icon';
import { Modal } from '../../../shared/modal/modal';
import { ActivityList } from '../activity-list/activity-list';
import { FolderPicker } from '../folder-picker/folder-picker';
import { PermissionsDialog } from '../permissions-dialog/permissions-dialog';

type SortKey = 'name' | 'updated' | 'size';

/** Hauteur maximale estimée du menu d'actions (choix de l'ouverture vers le haut ou le bas). */
const MENU_MAX_HEIGHT = 240;

const LOCK_DATE = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

interface UploadItem {
  id: number;
  name: string;
  progress: number;
  done: boolean;
  error: string | null;
}

type Dialog =
  | { kind: 'name'; title: string; submitLabel: string; action: (name: string) => Observable<unknown> }
  | { kind: 'move-folder'; folder: FolderItemDto }
  | { kind: 'move-document'; document: DocumentItemDto }
  | { kind: 'permissions'; folderId: number; folderName: string }
  | { kind: 'activity' };

/** Explorateur de la GED : dossiers et documents d'un dossier (ou de la racine). */
@Component({
  selector: 'sd-browser',
  imports: [RouterLink, FormsModule, ReactiveFormsModule, FileIcon, Modal, TimeAgoPipe, FileSizePipe, FolderPicker, PermissionsDialog, ActivityList],
  templateUrl: './browser.html',
  styleUrl: './browser.scss',
  host: {
    '(document:click)': 'menuFor.set(null)',
    '(window:scroll)': 'menuFor.set(null)',
    '(window:resize)': 'menuFor.set(null)',
  },
})
export class Browser {
  private readonly dms = inject(DmsService);
  protected readonly router = inject(Router);
  protected readonly auth = inject(AuthService);
  private readonly timeAgo = new TimeAgoPipe();

  /** Paramètre de route `:folderId` (absent = racine). */
  readonly folderId = input<string>();
  protected readonly currentId = computed(() => (this.folderId() ? Number(this.folderId()) : null));

  protected readonly content = signal<FolderContentDto | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly filter = signal('');
  protected readonly sort = signal<{ key: SortKey; dir: 1 | -1 }>({ key: 'name', dir: 1 });
  protected readonly menuFor = signal<string | null>(null);
  /** Position (fixed) du menu d'actions : hors du tableau, qui rognerait son contenu. */
  protected readonly menuPosition = signal<{ top: number | null; bottom: number | null; right: number }>({ top: 0, bottom: null, right: 0 });
  protected readonly dialog = signal<Dialog | null>(null);
  protected readonly uploads = signal<UploadItem[]>([]);
  protected readonly saving = signal(false);

  protected readonly hasLevel = hasLevel;
  protected readonly levelLabel = levelLabel;

  protected readonly nameForm = inject(NonNullableFormBuilder).group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
  });

  protected readonly folders = computed(() => {
    const term = this.filter().trim().toLowerCase();
    const { key, dir } = this.sort();
    const items = (this.content()?.folders ?? []).filter((f) => f.name.toLowerCase().includes(term));
    return items.sort((a, b) =>
      key === 'updated' ? dir * (a.updatedOn ?? a.createdOn).localeCompare(b.updatedOn ?? b.createdOn) : dir * a.name.localeCompare(b.name, 'fr'),
    );
  });

  protected readonly documents = computed(() => {
    const term = this.filter().trim().toLowerCase();
    const { key, dir } = this.sort();
    const items = (this.content()?.documents ?? []).filter(
      (d) => d.name.toLowerCase().includes(term) || d.description?.toLowerCase().includes(term),
    );
    return items.sort((a, b) => {
      if (key === 'updated') return dir * a.updatedOn.localeCompare(b.updatedOn);
      if (key === 'size') return dir * (a.size - b.size);
      return dir * a.name.localeCompare(b.name, 'fr');
    });
  });

  protected readonly activeUploads = computed(() => this.uploads().some((u) => !u.done && !u.error));
  private uploadSeq = 0;

  constructor() {
    effect(() => {
      this.currentId();
      this.filter.set('');
      this.load();
    });
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.dms.browse(this.currentId()).subscribe({
      next: (content) => {
        this.content.set(content);
        this.loading.set(false);
      },
      error: (err) => {
        this.content.set(null);
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  protected sortBy(key: SortKey): void {
    this.sort.update((s) => ({ key, dir: s.key === key ? (-s.dir as 1 | -1) : 1 }));
  }

  protected sortIndicator(key: SortKey): string {
    const s = this.sort();
    return s.key === key ? (s.dir === 1 ? '▲' : '▼') : '';
  }

  protected toggleMenu(event: Event, key: string): void {
    event.stopPropagation();
    if (this.menuFor() === key) {
      this.menuFor.set(null);
      return;
    }
    // Ouvert sous le bouton, ou au-dessus s'il n'y a pas la place en bas de l'écran
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const right = window.innerWidth - rect.right;
    const openUp = window.innerHeight - rect.bottom < MENU_MAX_HEIGHT && rect.top > MENU_MAX_HEIGHT;
    this.menuPosition.set(
      openUp
        ? { top: null, bottom: window.innerHeight - rect.top + 4, right }
        : { top: rect.bottom + 4, bottom: null, right },
    );
    this.menuFor.set(key);
  }

  protected isLockedByOther(d: DocumentItemDto): boolean {
    return d.checkedOutBy !== null && d.checkedOutBy.id !== this.auth.currentUser()?.id;
  }

  /** Infobulle du cadenas : qui a extrait le document et quand. */
  protected lockTooltip(d: DocumentItemDto): string {
    if (!d.checkedOutBy) {
      return '';
    }
    const by = d.checkedOutBy.id === this.auth.currentUser()?.id ? 'vous' : `${d.checkedOutBy.firstname} ${d.checkedOutBy.lastname}`;
    const on = d.checkedOutOn ? new Date(d.checkedOutOn) : null;
    return on ? `Extrait par ${by}\nle ${LOCK_DATE.format(on)} (${this.timeAgo.transform(d.checkedOutOn)})` : `Extrait par ${by}`;
  }

  protected open(d: DocumentItemDto): void {
    this.router.navigate(['/documents/file', d.id]);
  }

  // ---- Dépôt de fichiers

  protected onFiles(input: HTMLInputElement): void {
    const folderId = this.currentId();
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (folderId === null) {
      return;
    }
    for (const file of files) {
      this.uploadFile(folderId, file);
    }
  }

  protected clearUploads(): void {
    this.uploads.update((items) => items.filter((u) => !u.done && !u.error));
  }

  private uploadFile(folderId: number, file: File): void {
    const item: UploadItem = { id: ++this.uploadSeq, name: file.name, progress: 0, done: false, error: null };
    if (file.size > DOCUMENT_MAX_SIZE) {
      item.error = `Fichier trop volumineux (${formatSize(DOCUMENT_MAX_SIZE)} maximum).`;
    }
    this.uploads.update((items) => [...items, item]);
    if (item.error) {
      return;
    }

    const update = (changes: Partial<UploadItem>) =>
      this.uploads.update((items) => items.map((u) => (u.id === item.id ? { ...u, ...changes } : u)));

    this.dms.upload(folderId, file).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          update({ progress: Math.round((100 * event.loaded) / event.total) });
        } else if (event.type === HttpEventType.Response) {
          update({ progress: 100, done: true });
          if (!this.activeUploads() && this.currentId() === folderId) {
            this.load();
          }
        }
      },
      error: (err) => {
        update({ error: errorMessage(err) });
        if (!this.activeUploads() && this.currentId() === folderId) {
          this.load();
        }
      },
    });
  }

  // ---- Actions

  protected newFolder(): void {
    const parentId = this.currentId();
    this.openNameDialog('Nouveau dossier', 'Créer', '', (name) => this.dms.createFolder(parentId, name));
  }

  protected renameFolder(f: FolderItemDto): void {
    this.openNameDialog('Renommer le dossier', 'Renommer', f.name, (name) => this.dms.renameFolder(f.id, name));
  }

  protected renameDocument(d: DocumentItemDto): void {
    this.openNameDialog('Renommer le document', 'Renommer', d.name, (name) => this.dms.updateDocument(d.id, name, d.description));
  }

  protected submitName(): void {
    const dialog = this.dialog();
    if (dialog?.kind !== 'name') {
      return;
    }
    if (this.nameForm.invalid) {
      this.nameForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.actionError.set(null);
    dialog.action(this.nameForm.getRawValue().name.trim()).subscribe({
      next: () => {
        this.saving.set(false);
        this.dialog.set(null);
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.actionError.set(errorMessage(err));
      },
    });
  }

  protected moveTo(targetId: number | null): void {
    const dialog = this.dialog();
    let request$: Observable<unknown>;
    if (dialog?.kind === 'move-folder') {
      request$ = this.dms.moveFolder(dialog.folder.id, targetId);
    } else if (dialog?.kind === 'move-document' && targetId !== null) {
      request$ = this.dms.moveDocument(dialog.document.id, targetId);
    } else {
      return;
    }
    this.dialog.set(null);
    this.run(request$);
  }

  protected deleteFolder(f: FolderItemDto): void {
    if (confirm(`Envoyer le dossier « ${f.name} » et tout son contenu dans la corbeille ?`)) {
      this.run(this.dms.deleteFolder(f.id));
    }
  }

  protected deleteDocument(d: DocumentItemDto): void {
    if (confirm(`Envoyer le document « ${d.name} » dans la corbeille ?`)) {
      this.run(this.dms.deleteDocument(d.id));
    }
  }

  protected download(d: DocumentItemDto): void {
    this.dms.download(d.id).subscribe({ error: (err) => this.actionError.set(errorMessage(err)) });
  }

  private openNameDialog(title: string, submitLabel: string, initial: string, action: (name: string) => Observable<unknown>): void {
    this.actionError.set(null);
    this.nameForm.reset({ name: initial });
    this.dialog.set({ kind: 'name', title, submitLabel, action });
  }

  private run(request$: Observable<unknown>): void {
    this.actionError.set(null);
    request$.subscribe({
      next: () => this.load(),
      error: (err) => this.actionError.set(errorMessage(err)),
    });
  }
}
