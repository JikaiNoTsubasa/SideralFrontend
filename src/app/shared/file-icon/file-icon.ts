import { Component, computed, input } from '@angular/core';
import { extensionOf, fileKind } from '../../core/utils/file';

/** Icône de dossier, ou de fichier avec son extension (couleur selon le type). */
@Component({
  selector: 'sd-file-icon',
  template: `
    @if (folder()) {
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M10.2 4.5H4.5A2 2 0 0 0 2.5 6.5v11a2 2 0 0 0 2 2h15a2 2 0 0 0 2-2V8.5a2 2 0 0 0-2-2h-7.3z" />
      </svg>
    } @else {
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" opacity="0.14" d="M6 2.75h7.7l5.55 5.55V20A1.25 1.25 0 0 1 18 21.25H6A1.25 1.25 0 0 1 4.75 20V4A1.25 1.25 0 0 1 6 2.75z" />
        <path fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"
          d="M6 2.75h7.7l5.55 5.55V20A1.25 1.25 0 0 1 18 21.25H6A1.25 1.25 0 0 1 4.75 20V4A1.25 1.25 0 0 1 6 2.75zM13.5 2.75V8.5h5.75" />
      </svg>
      @if (extension()) {
        <span class="ext">{{ extension() }}</span>
      }
    }
  `,
  styles: `
    :host {
      position: relative;
      flex-shrink: 0;
      display: inline-grid;
      place-items: center;
      width: var(--sd-icon-size, 28px);
      height: var(--sd-icon-size, 28px);
      color: var(--sd-primary);
    }

    :host(.folder) {
      color: var(--sd-warning);
    }
    :host(.pdf) {
      color: var(--sd-danger);
    }
    :host(.image),
    :host(.sheet) {
      color: var(--sd-success);
    }
    :host(.slides) {
      color: var(--sd-warning);
    }
    :host(.archive),
    :host(.other),
    :host(.text) {
      color: var(--sd-text-muted);
    }

    svg {
      width: 100%;
      height: 100%;
    }

    .ext {
      position: absolute;
      bottom: 18%;
      max-width: 90%;
      overflow: hidden;
      font-size: calc(var(--sd-icon-size, 28px) * 0.24);
      font-weight: 700;
      line-height: 1;
      text-transform: uppercase;
      letter-spacing: -0.02em;
    }
  `,
  host: { '[class]': 'kind()' },
})
export class FileIcon {
  readonly name = input('');
  readonly folder = input(false);

  protected readonly kind = computed(() => (this.folder() ? 'folder' : fileKind(this.name())));
  protected readonly extension = computed(() => extensionOf(this.name()).slice(0, 4));
}
