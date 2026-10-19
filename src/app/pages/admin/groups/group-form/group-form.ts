import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { GROUP_DESCRIPTION_MAX_LENGTH, GROUP_NAME_MAX_LENGTH } from '../../../../core/models/group.model';
import { PrincipalDto } from '../../../../core/models/principal.model';
import { GroupService } from '../../../../core/services/group.service';
import { errorMessage } from '../../../../core/utils/error-message';
import { Avatar } from '../../../../shared/avatar/avatar';
import { PrincipalPicker } from '../../../../shared/principal-picker/principal-picker';

@Component({
  selector: 'sd-group-form',
  imports: [ReactiveFormsModule, RouterLink, Avatar, PrincipalPicker],
  templateUrl: './group-form.html',
  styleUrl: './group-form.scss',
})
export class GroupForm implements OnInit {
  private readonly groups = inject(GroupService);
  private readonly router = inject(Router);

  /** Paramètre de route `:id` (absent en création). */
  readonly id = input<string>();
  protected readonly isEdit = computed(() => !!this.id());

  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', [Validators.required, Validators.maxLength(GROUP_NAME_MAX_LENGTH)]],
    description: ['', Validators.maxLength(GROUP_DESCRIPTION_MAX_LENGTH)],
  });

  protected readonly members = signal<PrincipalDto[]>([]);
  protected readonly memberKeys = computed(() => new Set(this.members().map((m) => `user:${m.id}`)));
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.id();
    if (id) {
      this.groups.get(Number(id)).subscribe({
        next: (group) => {
          this.form.patchValue({ name: group.name, description: group.description ?? '' });
          this.members.set(group.members);
        },
        error: (err) => this.error.set(errorMessage(err)),
      });
    }
  }

  addMember(user: PrincipalDto): void {
    this.members.update((members) => [...members, user].sort((a, b) => (a.lastname ?? '').localeCompare(b.lastname ?? '', 'fr')));
  }

  removeMember(user: PrincipalDto): void {
    this.members.update((members) => members.filter((m) => m.id !== user.id));
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const request = { name: value.name.trim(), description: value.description.trim() || null, memberIds: this.members().map((m) => m.id) };
    const id = this.id();
    const request$ = id ? this.groups.update(Number(id), request) : this.groups.create(request);

    this.saving.set(true);
    this.error.set(null);
    request$.subscribe({
      next: () => this.router.navigate(['/admin/groups']),
      error: (err) => {
        this.error.set(errorMessage(err));
        this.saving.set(false);
      },
    });
  }
}
