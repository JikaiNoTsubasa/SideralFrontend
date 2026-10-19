import { Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { switchMap } from 'rxjs';
import { LinkPreviewService } from '../../core/services/link-preview.service';

/**
 * Carte d'aperçu d'un lien (image, site, titre, description), cliquable vers un nouvel onglet.
 * Vidéo YouTube : miniature avec bouton lecture, le lecteur (youtube-nocookie) n'est chargé qu'au clic.
 * Rien n'est affiché si l'aperçu n'est pas disponible.
 */
@Component({
  selector: 'sd-link-preview',
  templateUrl: './link-preview.html',
  styleUrl: './link-preview.scss',
})
export class LinkPreview {
  private readonly previews = inject(LinkPreviewService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly url = input.required<string>();

  protected readonly preview = toSignal(toObservable(this.url).pipe(switchMap((url) => this.previews.get(url))), { initialValue: null });
  protected readonly playing = signal(false);
  protected readonly imageFailed = signal(false);

  /** URL du lecteur, construite à partir d'un identifiant validé par l'API ([A-Za-z0-9_-]{11}). */
  protected readonly playerUrl = computed<SafeResourceUrl | null>(() => {
    const id = this.preview()?.youtubeVideoId;
    return id && /^[A-Za-z0-9_-]{11}$/.test(id)
      ? this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`)
      : null;
  });
}
