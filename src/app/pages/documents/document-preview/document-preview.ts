import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { VersionDto } from '../../../core/models/dms.model';
import { DmsService } from '../../../core/services/dms.service';
import { errorMessage } from '../../../core/utils/error-message';
import { previewKind } from '../../../core/utils/file';
import { FileIcon } from '../../../shared/file-icon/file-icon';

/** Taille maximale d'un fichier texte affiché dans l'aperçu. */
const TEXT_PREVIEW_MAX_SIZE = 1024 * 1024;

/** Aperçu d'une version dans le navigateur (PDF, images, vidéo, audio, texte), via un lien signé. */
@Component({
  selector: 'sd-document-preview',
  imports: [FileIcon, NgTemplateOutlet],
  templateUrl: './document-preview.html',
  styleUrl: './document-preview.scss',
})
export class DocumentPreview {
  private readonly dms = inject(DmsService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly documentId = input.required<number>();
  readonly documentName = input('');
  readonly version = input.required<VersionDto>();

  protected readonly kind = computed(() => previewKind(this.version().contentType));
  protected readonly url = signal<string | null>(null);
  protected readonly frameUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.url();
    // URL construite par DmsService vers l'API (lien signé), affichée dans un <iframe> pour les PDF
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });
  protected readonly text = signal<string | null>(null);
  protected readonly tooLarge = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor() {
    effect((onCleanup) => {
      const documentId = this.documentId();
      const version = this.version();
      const kind = this.kind();

      this.url.set(null);
      this.text.set(null);
      this.error.set(null);
      this.tooLarge.set(kind === 'text' && version.size > TEXT_PREVIEW_MAX_SIZE);
      if (kind === null || this.tooLarge()) {
        return;
      }

      const subscription = new Subscription();
      onCleanup(() => subscription.unsubscribe());
      subscription.add(
        this.dms.contentUrl(documentId, version.id, false).subscribe({
          next: (url) => {
            if (kind !== 'text') {
              this.url.set(url);
              return;
            }
            subscription.add(
              this.dms.text(url).subscribe({
                next: (text) => this.text.set(text),
                error: (err) => this.error.set(errorMessage(err)),
              }),
            );
          },
          error: (err) => this.error.set(errorMessage(err)),
        }),
      );
    });
  }

  protected download(): void {
    this.dms.download(this.documentId(), this.version().id).subscribe({ error: (err) => this.error.set(errorMessage(err)) });
  }
}
