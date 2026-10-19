import { Component, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { catchError, debounceTime, of, Subject, switchMap } from 'rxjs';
import { PrincipalDto } from '../../core/models/principal.model';
import { PrincipalService } from '../../core/services/principal.service';
import { Avatar } from '../avatar/avatar';

/** Recherche d'un utilisateur et/ou d'un groupe, avec liste de suggestions. */
@Component({
  selector: 'sd-principal-picker',
  imports: [FormsModule, Avatar],
  template: `
    <input
      type="search"
      [placeholder]="placeholder()"
      [(ngModel)]="term"
      (ngModelChange)="search$.next($event)"
      (focus)="search$.next(term)"
      (blur)="hideSoon()"
      autocomplete="off"
    />
    @if (open() && results().length) {
      <ul class="results">
        @for (p of results(); track p.type + p.id) {
          <li>
            <button type="button" (mousedown)="$event.preventDefault()" (click)="pick(p)" [disabled]="isExcluded(p)">
              @if (p.type === 'user') {
                <sd-avatar class="avatar" [firstname]="p.firstname ?? ''" [lastname]="p.lastname ?? ''" [avatar]="p.avatar" />
              } @else {
                <span class="group-icon" aria-hidden="true">👥</span>
              }
              <span class="label">
                <strong>{{ p.name }}</strong>
                @if (p.detail) {
                  <small class="muted">{{ p.detail }}</small>
                }
              </span>
              @if (isExcluded(p)) {
                <small class="muted">déjà ajouté</small>
              }
            </button>
          </li>
        }
      </ul>
    }
  `,
  styles: `
    :host {
      position: relative;
      display: block;
    }

    .results {
      position: absolute;
      z-index: 5;
      left: 0;
      right: 0;
      top: calc(100% + 0.25rem);
      max-height: 280px;
      overflow-y: auto;
      margin: 0;
      padding: 0.3rem;
      list-style: none;
      background: var(--sd-surface);
      border: 1px solid var(--sd-border);
      border-radius: 8px;
      box-shadow: var(--sd-shadow-lg);
    }

    button {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.4rem 0.5rem;
      border: none;
      border-radius: 6px;
      background: none;
      color: var(--sd-text);
      font: inherit;
      text-align: left;
      cursor: pointer;

      &:hover:not(:disabled) {
        background: var(--sd-bg);
      }

      &:disabled {
        opacity: 0.55;
        cursor: default;
      }
    }

    .avatar {
      --sd-avatar-size: 28px;
    }

    .group-icon {
      width: 28px;
      text-align: center;
    }

    .label {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
  `,
})
export class PrincipalPicker {
  private readonly principals = inject(PrincipalService);

  readonly users = input(true);
  readonly groups = input(true);
  readonly placeholder = input('Rechercher un utilisateur ou un groupe…');
  /** Clés "type:id" déjà sélectionnées. */
  readonly exclude = input<ReadonlySet<string>>(new Set());
  readonly selected = output<PrincipalDto>();

  protected term = '';
  protected readonly results = signal<PrincipalDto[]>([]);
  protected readonly open = signal(false);
  protected readonly search$ = new Subject<string>();

  constructor() {
    this.search$
      .pipe(
        debounceTime(250),
        switchMap((term) => this.principals.search(term.trim(), this.users(), this.groups()).pipe(catchError(() => of([])))),
        takeUntilDestroyed(),
      )
      .subscribe((results) => {
        this.results.set(results);
        this.open.set(true);
      });
  }

  protected isExcluded(p: PrincipalDto): boolean {
    return this.exclude().has(`${p.type}:${p.id}`);
  }

  protected pick(p: PrincipalDto): void {
    this.selected.emit(p);
    this.term = '';
    this.open.set(false);
  }

  protected hideSoon(): void {
    setTimeout(() => this.open.set(false), 150);
  }
}
