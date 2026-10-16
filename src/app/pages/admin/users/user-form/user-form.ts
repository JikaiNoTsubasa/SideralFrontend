import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RoleDto } from '../../../../core/models/user.model';
import { UserService } from '../../../../core/services/user.service';
import { errorMessage } from '../../../../core/utils/error-message';
import { PASSWORD_MIN_LENGTH } from '../../../../core/utils/validators';

@Component({
  selector: 'sd-user-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './user-form.html',
})
export class UserForm implements OnInit {
  private readonly users = inject(UserService);
  private readonly router = inject(Router);

  /** Paramètre de route `:id` (absent en création). */
  readonly id = input<string>();
  protected readonly isEdit = computed(() => !!this.id());
  protected readonly passwordMinLength = PASSWORD_MIN_LENGTH;

  protected readonly form = inject(NonNullableFormBuilder).group({
    login: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    firstname: ['', Validators.required],
    lastname: ['', Validators.required],
    jobTitle: [''],
    password: ['', [Validators.required, Validators.minLength(PASSWORD_MIN_LENGTH)]],
    isActive: [true],
  });

  protected readonly roles = signal<RoleDto[]>([]);
  protected readonly selectedRoles = signal<Set<string>>(new Set());
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.users.roles().subscribe((roles) => this.roles.set(roles));

    const id = this.id();
    if (id) {
      this.form.controls.login.disable();
      this.form.controls.password.disable();
      this.users.get(Number(id)).subscribe({
        next: (user) => {
          this.form.patchValue({ ...user, jobTitle: user.jobTitle ?? '' });
          this.selectedRoles.set(new Set(user.roles));
        },
        error: (err) => this.error.set(errorMessage(err)),
      });
    } else {
      this.selectedRoles.set(new Set(['USER']));
    }
  }

  toggleRole(key: string, checked: boolean): void {
    this.selectedRoles.update((set) => {
      const next = new Set(set);
      if (checked) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const roles = [...this.selectedRoles()];
    const jobTitle = value.jobTitle || null;
    const id = this.id();

    const request$ = id
      ? this.users.update(Number(id), {
          email: value.email,
          firstname: value.firstname,
          lastname: value.lastname,
          jobTitle,
          isActive: value.isActive,
          roles,
        })
      : this.users.create({
          login: value.login,
          email: value.email,
          firstname: value.firstname,
          lastname: value.lastname,
          jobTitle,
          password: value.password,
          roles,
        });

    this.saving.set(true);
    this.error.set(null);
    request$.subscribe({
      next: () => this.router.navigate(['/admin/users']),
      error: (err) => {
        this.error.set(errorMessage(err));
        this.saving.set(false);
      },
    });
  }
}
