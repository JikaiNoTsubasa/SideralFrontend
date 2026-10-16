import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Paged } from '../../../../core/models/api.model';
import { UserDto } from '../../../../core/models/user.model';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { errorMessage } from '../../../../core/utils/error-message';

const PAGE_SIZE = 20;

@Component({
  selector: 'sd-user-list',
  imports: [RouterLink, FormsModule, DatePipe],
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss',
})
export class UserList implements OnInit {
  private readonly users = inject(UserService);
  protected readonly auth = inject(AuthService);

  protected readonly result = signal<Paged<UserDto> | null>(null);
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

  remove(user: UserDto): void {
    if (!confirm(`Supprimer l'utilisateur ${user.firstname} ${user.lastname} ?`)) {
      return;
    }
    this.users.delete(user.id).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.users.list(this.page(), PAGE_SIZE, this.search.trim()).subscribe({
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
