import { Component, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { Paged } from '../../../../core/models/api.model';
import { GroupDto } from '../../../../core/models/group.model';
import { GroupService } from '../../../../core/services/group.service';
import { errorMessage } from '../../../../core/utils/error-message';

const PAGE_SIZE = 20;

@Component({
  selector: 'sd-group-list',
  imports: [RouterLink, FormsModule],
  templateUrl: './group-list.html',
})
export class GroupList implements OnInit {
  private readonly groups = inject(GroupService);

  protected readonly result = signal<Paged<GroupDto> | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly page = signal(1);
  protected search = '';

  private readonly search$ = new Subject<string>();

  constructor() {
    this.search$.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed()).subscribe(() => {
      this.page.set(1);
      this.load();
    });
  }

  ngOnInit(): void {
    this.load();
  }

  onSearch(value: string): void {
    this.search$.next(value);
  }

  goTo(page: number): void {
    this.page.set(page);
    this.load();
  }

  remove(group: GroupDto): void {
    if (!confirm(`Supprimer le groupe « ${group.name} » ? Les droits accordés à ce groupe sur les dossiers seront retirés.`)) {
      return;
    }
    this.groups.delete(group.id).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.groups.list(this.page(), PAGE_SIZE, this.search.trim()).subscribe({
      next: (res) => {
        this.result.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
