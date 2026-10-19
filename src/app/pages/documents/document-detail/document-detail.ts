import { HttpEventType } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal, viewChild } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import {
  DOCUMENT_DESCRIPTION_MAX_LENGTH,
  DOCUMENT_MAX_SIZE,
  DocumentDto,
  hasLevel,
  levelLabel,
  VERSION_COMMENT_MAX_LENGTH,
  VersionDto,
} from '../../../core/models/dms.model';
import { FileSizePipe } from '../../../core/pipes/file-size.pipe';
import { TimeAgoPipe } from '../../../core/pipes/time-ago.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { DmsService } from '../../../core/services/dms.service';
import { errorMessage } from '../../../core/utils/error-message';
import { formatSize } from '../../../core/utils/file';
import { Avatar } from '../../../shared/avatar/avatar';
import { FileIcon } from '../../../shared/file-icon/file-icon';
import { Modal } from '../../../shared/modal/modal';
import { ActivityList } from '../activity-list/activity-list';
import { DocumentPreview } from '../document-preview/document-preview';
import { FolderPicker } from '../folder-picker/folder-picker';

type Tab = 'info' | 'versions' | 'activity';
type Dialog = 'checkin' | 'edit' | 'move';

/** Fiche d'un document : aperçu, informations, versions, extraction / archivage et activité. */
@Component({
  selector: 'sd-document-detail',
  imports: [RouterLink, ReactiveFormsModule, DatePipe, TimeAgoPipe, FileSizePipe, Avatar, FileIcon, Modal, ActivityList, DocumentPreview, FolderPicker],
  templateUrl: './document-detail.html',
  styleUrl: './document-detail.scss',
  host: { '(document:click)': 'menuOpen.set(false)' },
})
export class DocumentDetail {
  private readonly dms = inject(DmsService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(NonNullableFormBuilder);

  /** Paramètre de route `:documentId`. */
  readonly documentId = input.required<string>();

  protected readonly doc = signal<DocumentDto | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly tab = signal<Tab>('versions');
  protected readonly dialog = signal<Dialog | null>(null);
  protected readonly menuOpen = signal(false);
  /** Version affichée dans l'aperçu (null = version courante). */
  protected readonly previewVersionId = signal<number | null>(null);
  protected readonly checkinFile = signal<File | null>(null);
  protected readonly uploadProgress = signal<number | null>(null);

  protected readonly levelLabel = levelLabel;
  protected readonly commentMaxLength = VERSION_COMMENT_MAX_LENGTH;
  private readonly activity = viewChild(ActivityList);

  protected readonly location = computed(() => this.doc()?.breadcrumb.map((c) => c.name).join(' / ') || '—');
  protected readonly current = computed(() => this.doc()?.versions[0] ?? null);
  protected readonly previewVersion = computed(() => {
    const doc = this.doc();
    const id = this.previewVersionId();
    return doc?.versions.find((v) => v.id === id) ?? doc?.versions[0] ?? null;
  });
  protected readonly checkedOutByMe = computed(() => {
    const doc = this.doc();
    return !!doc?.checkedOutBy && doc.checkedOutBy.id === this.auth.currentUser()?.id;
  });
  protected readonly lockedByOther = computed(() => !!this.doc()?.checkedOutBy && !this.checkedOutByMe());
  protected readonly canWrite = computed(() => hasLevel(this.doc()?.myLevel ?? 'None', 'Write'));
  protected readonly canManage = computed(() => hasLevel(this.doc()?.myLevel ?? 'None', 'Manage'));

  protected readonly checkinForm = this.fb.group({
    major: [false],
    comment: ['', Validators.maxLength(VERSION_COMMENT_MAX_LENGTH)],
  });

  protected readonly editForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    description: ['', Validators.maxLength(DOCUMENT_DESCRIPTION_MAX_LENGTH)],
  });

  constructor() {
    effect(() => {
      const id = Number(this.documentId());
      this.previewVersionId.set(null);
      this.error.set(null);
      this.dms.document(id).subscribe({
        next: (doc) => this.doc.set(doc),
        error: (err) => {
          this.doc.set(null);
          this.error.set(errorMessage(err));
        },
      });
    });
  }

  protected nextLabel(major: boolean): string {
    const v = this.current();
    return v ? (major ? `${v.major + 1}.0` : `${v.major}.${v.minor + 1}`) : '';
  }

  protected toggleMenu(event: Event): void {
    event.stopPropagation();
    this.menuOpen.update((open) => !open);
  }

  protected download(version: VersionDto | null = null): void {
    const doc = this.doc();
    if (doc) {
      this.dms.download(doc.id, version?.id ?? null).subscribe({ error: (err) => this.actionError.set(errorMessage(err)) });
    }
  }

  protected checkout(): void {
    this.run((id) => this.dms.checkout(id));
  }

  protected cancelCheckout(): void {
    const doc = this.doc();
    if (!doc?.checkedOutBy) {
      return;
    }
    const message = this.checkedOutByMe()
      ? "Annuler l'extraction ? Les modifications non archivées ne seront pas enregistrées dans la GED."
      : `Annuler l'extraction de ${doc.checkedOutBy.firstname} ${doc.checkedOutBy.lastname} ? Ses modifications en cours ne seront pas enregistrées.`;
    if (confirm(message)) {
      this.run((id) => this.dms.cancelCheckout(id));
    }
  }

  protected restore(version: VersionDto): void {
    if (confirm(`Restaurer la version ${version.label} ? Une nouvelle version ${this.nextLabel(false)} sera créée avec son contenu.`)) {
      this.run((id) => this.dms.restoreVersion(id, version.id), () => this.previewVersionId.set(null));
    }
  }

  protected remove(): void {
    const doc = this.doc();
    if (doc && confirm(`Envoyer le document « ${doc.name} » dans la corbeille ?`)) {
      this.dms.deleteDocument(doc.id).subscribe({
        next: () => this.router.navigate(['/documents/folder', doc.folderId]),
        error: (err) => this.actionError.set(errorMessage(err)),
      });
    }
  }

  // ---- Archivage (checkin)

  protected openCheckin(): void {
    this.actionError.set(null);
    this.checkinFile.set(null);
    this.uploadProgress.set(null);
    this.checkinForm.reset({ major: false, comment: '' });
    this.dialog.set('checkin');
  }

  protected onCheckinFile(input: HTMLInputElement): void {
    this.checkinFile.set(input.files?.[0] ?? null);
  }

  protected submitCheckin(): void {
    const doc = this.doc();
    const file = this.checkinFile();
    if (!doc || !file || this.checkinForm.invalid) {
      this.checkinForm.markAllAsTouched();
      return;
    }
    if (file.size > DOCUMENT_MAX_SIZE) {
      this.actionError.set(`Le fichier ne doit pas dépasser ${formatSize(DOCUMENT_MAX_SIZE)}.`);
      return;
    }

    const { major, comment } = this.checkinForm.getRawValue();
    this.busy.set(true);
    this.actionError.set(null);
    this.uploadProgress.set(0);
    this.dms.checkin(doc.id, file, major, comment.trim() || null).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress.set(Math.round((100 * event.loaded) / event.total));
        } else if (event.type === HttpEventType.Response && event.body) {
          this.doc.set(event.body);
          this.previewVersionId.set(null);
          this.busy.set(false);
          this.dialog.set(null);
          this.activity()?.reload();
        }
      },
      error: (err) => {
        this.busy.set(false);
        this.uploadProgress.set(null);
        this.actionError.set(errorMessage(err));
      },
    });
  }

  // ---- Modification / déplacement

  protected openEdit(): void {
    const doc = this.doc();
    if (doc) {
      this.actionError.set(null);
      this.editForm.reset({ name: doc.name, description: doc.description ?? '' });
      this.dialog.set('edit');
    }
  }

  protected submitEdit(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const { name, description } = this.editForm.getRawValue();
    this.run((id) => this.dms.updateDocument(id, name.trim(), description.trim() || null), () => this.dialog.set(null));
  }

  protected moveTo(folderId: number | null): void {
    this.dialog.set(null);
    if (folderId !== null) {
      this.run((id) => this.dms.moveDocument(id, folderId));
    }
  }

  /** Exécute une action qui renvoie la fiche à jour. */
  private run(action: (id: number) => Observable<DocumentDto>, onSuccess?: () => void): void {
    const doc = this.doc();
    if (!doc) {
      return;
    }
    this.busy.set(true);
    this.actionError.set(null);
    action(doc.id).subscribe({
      next: (updated) => {
        this.doc.set(updated);
        this.busy.set(false);
        onSuccess?.();
        this.activity()?.reload();
      },
      error: (err) => {
        this.busy.set(false);
        this.actionError.set(errorMessage(err));
      },
    });
  }
}
