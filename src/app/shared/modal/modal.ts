import { AfterViewInit, Component, ElementRef, input, output, viewChild } from '@angular/core';

/**
 * Fenêtre modale (élément <dialog> natif : focus, touche Échap, fond). S'ouvre à l'affichage :
 * l'afficher avec @if et la masquer sur (closed).
 */
@Component({
  selector: 'sd-modal',
  template: `
    <dialog #dialog [class.wide]="wide()" (close)="closed.emit()" (click)="onClick($event)">
      <div class="frame">
        <header>
          <h2>{{ title() }}</h2>
          <button type="button" class="close" aria-label="Fermer" (click)="close()">×</button>
        </header>
        <ng-content />
      </div>
    </dialog>
  `,
  styles: `
    dialog {
      width: min(480px, calc(100vw - 2rem));
      max-height: calc(100vh - 4rem);
      padding: 0;
      border: 1px solid var(--sd-border);
      border-radius: var(--sd-radius);
      background: var(--sd-surface);
      color: var(--sd-text);
      box-shadow: var(--sd-shadow-lg);

      &.wide {
        width: min(760px, calc(100vw - 2rem));
      }

      &::backdrop {
        background: color-mix(in srgb, var(--sd-text) 35%, transparent);
      }
    }

    .frame {
      padding: 1.25rem 1.5rem 1.5rem;
    }

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1rem;

      h2 {
        margin: 0;
        font-size: 1.15rem;
        overflow-wrap: anywhere;
      }
    }

    .close {
      border: none;
      background: none;
      color: var(--sd-text-muted);
      font-size: 1.5rem;
      line-height: 1;
      cursor: pointer;
      padding: 0.1rem 0.4rem;
      border-radius: 6px;

      &:hover {
        background: var(--sd-bg);
        color: var(--sd-text);
      }
    }
  `,
})
export class Modal implements AfterViewInit {
  readonly title = input('');
  readonly wide = input(false);
  readonly closed = output<void>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  ngAfterViewInit(): void {
    this.dialog().nativeElement.showModal();
  }

  close(): void {
    this.dialog().nativeElement.close();
  }

  /** Un clic sur le fond (hors du cadre) ferme la fenêtre. */
  protected onClick(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) {
      this.close();
    }
  }
}
