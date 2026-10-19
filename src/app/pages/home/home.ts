import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CheckedOutDocumentDto } from '../../core/models/dms.model';
import { PostDto, POST_MAX_LENGTH } from '../../core/models/wall.model';
import { TimeAgoPipe } from '../../core/pipes/time-ago.pipe';
import { DmsService } from '../../core/services/dms.service';
import { AuthService } from '../../core/services/auth.service';
import { WallService } from '../../core/services/wall.service';
import { errorMessage } from '../../core/utils/error-message';
import { Avatar } from '../../shared/avatar/avatar';
import { PostCard } from './post-card/post-card';

const PAGE_SIZE = 10;

@Component({
  selector: 'sd-home',
  imports: [ReactiveFormsModule, RouterLink, Avatar, PostCard, TimeAgoPipe],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private readonly wall = inject(WallService);
  private readonly dms = inject(DmsService);
  protected readonly auth = inject(AuthService);
  protected readonly postMaxLength = POST_MAX_LENGTH;

  /** Documents extraits par l'utilisateur (rappel dans la carte Documents). */
  protected readonly checkedOut = signal<CheckedOutDocumentDto[]>([]);
  protected readonly checkedOutPreviewCount = 3;
  protected readonly posts = signal<PostDto[]>([]);
  protected readonly page = signal(0);
  protected readonly hasMore = signal(false);
  protected readonly loading = signal(false);
  protected readonly publishing = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly composer = new FormGroup({
    content: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(POST_MAX_LENGTH)],
    }),
  });

  protected readonly upcoming = [
    { icon: '📋', title: 'Projets', description: 'Pilotez vos projets techniques et leurs tâches.' },
  ];

  ngOnInit(): void {
    this.loadMore();
    // Rappel non bloquant : en cas d'erreur, la carte s'affiche simplement sans notification
    this.dms.checkedOut().subscribe({ next: (items) => this.checkedOut.set(items), error: () => this.checkedOut.set([]) });
  }

  loadMore(): void {
    const next = this.page() + 1;
    this.loading.set(true);
    this.error.set(null);
    this.wall.list(next, PAGE_SIZE).subscribe({
      next: (res) => {
        // Les messages publiés entre-temps décalent les pages : on ignore les doublons
        this.posts.update((list) => {
          const known = new Set(list.map((p) => p.id));
          return [...list, ...res.items.filter((p) => !known.has(p.id))];
        });
        this.page.set(next);
        this.hasMore.set(next < res.pageCount);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  publish(): void {
    const content = this.composer.controls.content.value.trim();
    if (!content || this.composer.invalid) {
      return;
    }
    this.publishing.set(true);
    this.error.set(null);
    this.wall.create(content).subscribe({
      next: (post) => {
        this.posts.update((list) => [post, ...list]);
        this.composer.reset();
        this.publishing.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.publishing.set(false);
      },
    });
  }

  onDeleted(id: number): void {
    this.posts.update((list) => list.filter((p) => p.id !== id));
  }
}
