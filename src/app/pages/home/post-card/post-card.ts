import { Component, computed, ElementRef, inject, input, linkedSignal, output, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TimeAgoPipe } from '../../../core/pipes/time-ago.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { WallService } from '../../../core/services/wall.service';
import { CommentDto, COMMENT_MAX_LENGTH, PostDto, POST_MAX_LENGTH } from '../../../core/models/wall.model';
import { errorMessage } from '../../../core/utils/error-message';
import { Avatar } from '../../../shared/avatar/avatar';

@Component({
  selector: 'sd-post-card',
  imports: [ReactiveFormsModule, Avatar, TimeAgoPipe],
  templateUrl: './post-card.html',
  styleUrl: './post-card.scss',
})
export class PostCard {
  private readonly wall = inject(WallService);
  protected readonly auth = inject(AuthService);
  protected readonly postMaxLength = POST_MAX_LENGTH;
  protected readonly commentMaxLength = COMMENT_MAX_LENGTH;

  readonly post = input.required<PostDto>();
  readonly deleted = output<number>();

  /** Copie locale du message, mise à jour par les actions (j'aime, commentaires, modification). */
  protected readonly state = linkedSignal(() => this.post());
  protected readonly comments = linkedSignal(() => this.post().latestComments);
  protected readonly hiddenComments = computed(() => this.state().commentCount - this.comments().length);

  protected readonly isMine = computed(() => this.state().author.id === this.auth.currentUser()?.id);
  protected readonly canDelete = computed(() => this.isMine() || this.auth.isAdmin());

  protected readonly error = signal<string | null>(null);
  protected readonly editing = signal(false);
  protected readonly saving = signal(false);
  protected readonly loadingComments = signal(false);
  protected readonly sendingComment = signal(false);

  protected readonly editForm = new FormGroup({
    content: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(POST_MAX_LENGTH)],
    }),
  });
  protected readonly commentForm = new FormGroup({
    content: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(COMMENT_MAX_LENGTH)],
    }),
  });

  private readonly commentInput = viewChild<ElementRef<HTMLInputElement>>('commentInput');

  canDeleteComment(comment: CommentDto): boolean {
    return comment.author.id === this.auth.currentUser()?.id || this.isMine() || this.auth.isAdmin();
  }

  toggleLike(): void {
    const previous = this.state();
    const liked = !previous.likedByMe;
    // Mise à jour optimiste, corrigée par la réponse du serveur
    this.state.set({ ...previous, likedByMe: liked, likeCount: previous.likeCount + (liked ? 1 : -1) });

    (liked ? this.wall.like(previous.id) : this.wall.unlike(previous.id)).subscribe({
      next: (res) => this.state.update((p) => ({ ...p, likeCount: res.likeCount, likedByMe: res.likedByMe })),
      error: (err) => {
        this.state.update((p) => ({ ...p, likeCount: previous.likeCount, likedByMe: previous.likedByMe }));
        this.error.set(errorMessage(err));
      },
    });
  }

  focusComment(): void {
    this.commentInput()?.nativeElement.focus();
  }

  loadAllComments(): void {
    this.loadingComments.set(true);
    this.wall.comments(this.state().id).subscribe({
      next: (comments) => {
        this.comments.set(comments);
        this.state.update((p) => ({ ...p, commentCount: comments.length }));
        this.loadingComments.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loadingComments.set(false);
      },
    });
  }

  sendComment(): void {
    const content = this.commentForm.controls.content.value.trim();
    if (!content || this.commentForm.invalid) {
      return;
    }
    this.sendingComment.set(true);
    this.error.set(null);
    this.wall.addComment(this.state().id, content).subscribe({
      next: (comment) => {
        this.comments.update((list) => [...list, comment]);
        this.state.update((p) => ({ ...p, commentCount: p.commentCount + 1 }));
        this.commentForm.reset();
        this.sendingComment.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.sendingComment.set(false);
      },
    });
  }

  deleteComment(comment: CommentDto): void {
    if (!confirm('Supprimer ce commentaire ?')) {
      return;
    }
    this.wall.deleteComment(comment.postId, comment.id).subscribe({
      next: () => {
        this.comments.update((list) => list.filter((c) => c.id !== comment.id));
        this.state.update((p) => ({ ...p, commentCount: p.commentCount - 1 }));
      },
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  startEdit(): void {
    this.editForm.controls.content.setValue(this.state().content);
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
  }

  saveEdit(): void {
    const content = this.editForm.controls.content.value.trim();
    if (!content || this.editForm.invalid) {
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.wall.update(this.state().id, content).subscribe({
      next: (post) => {
        this.state.update((p) => ({ ...p, content: post.content, updatedOn: post.updatedOn }));
        this.editing.set(false);
        this.saving.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.saving.set(false);
      },
    });
  }

  remove(): void {
    if (!confirm('Supprimer ce message ?')) {
      return;
    }
    this.wall.delete(this.state().id).subscribe({
      next: () => this.deleted.emit(this.state().id),
      error: (err) => this.error.set(errorMessage(err)),
    });
  }
}
