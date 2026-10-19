import { Pipe, PipeTransform } from '@angular/core';

const RELATIVE = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });
const DATE = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

/** Date relative façon réseau social : « à l'instant », « il y a 5 minutes », puis date complète au-delà d'une semaine. */
@Pipe({ name: 'timeAgo' })
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    const seconds = Math.round((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) {
      return "à l'instant";
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return RELATIVE.format(-minutes, 'minute');
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return RELATIVE.format(-hours, 'hour');
    }
    const days = Math.floor(hours / 24);
    if (days < 7) {
      return RELATIVE.format(-days, 'day');
    }
    return DATE.format(date);
  }
}
