import { Component, computed, input } from '@angular/core';
import { linkify } from '../../core/utils/linkify';

/** Texte avec liens cliquables (nouvel onglet). Garder white-space: pre-line sur l'élément hôte pour les retours à la ligne. */
@Component({
  selector: 'sd-rich-text',
  // Sur une ligne : aucun espace ajouté autour des liens (l'hôte est souvent en white-space: pre-line)
  template: `@for (segment of segments(); track $index) {@if (segment.type === 'link') {<a [href]="segment.href" target="_blank" rel="noopener noreferrer nofollow">{{ segment.value }}</a>} @else {{{ segment.value }}}}`,
  styles: `
    a {
      overflow-wrap: anywhere;

      &:hover {
        text-decoration: underline;
      }
    }
  `,
})
export class RichText {
  readonly text = input('');

  protected readonly segments = computed(() => linkify(this.text()));
}
