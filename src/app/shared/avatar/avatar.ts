import { Component, computed, input, linkedSignal } from '@angular/core';
import { avatarUrl } from '../../core/utils/avatar-url';

/** Photo de l'utilisateur, ou ses initiales s'il n'en a pas (ou si l'image ne se charge pas). */
@Component({
  selector: 'sd-avatar',
  template: `
    @if (url() && !failed()) {
      <img [src]="url()" alt="" (error)="failed.set(true)" />
    } @else {
      {{ initials() }}
    }
  `,
  styles: `
    :host {
      flex-shrink: 0;
      width: var(--sd-avatar-size, 40px);
      height: var(--sd-avatar-size, 40px);
      border-radius: 50%;
      overflow: hidden;
      display: grid;
      place-items: center;
      background: var(--sd-primary);
      color: var(--sd-on-primary);
      font-size: calc(var(--sd-avatar-size, 40px) * 0.36);
      font-weight: 600;
      user-select: none;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  `,
})
export class Avatar {
  readonly firstname = input('');
  readonly lastname = input('');
  /** Nom du fichier avatar renvoyé par l'API. */
  readonly avatar = input<string | null | undefined>(null);

  protected readonly url = computed(() => avatarUrl(this.avatar()));
  protected readonly failed = linkedSignal({ source: this.url, computation: () => false });
  protected readonly initials = computed(() => `${this.firstname().charAt(0)}${this.lastname().charAt(0)}`.toUpperCase());
}
