import { Component, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { MeService } from '../../core/services/me.service';
import { errorMessage } from '../../core/utils/error-message';
import { matchValidator, PASSWORD_MIN_LENGTH } from '../../core/utils/validators';

@Component({
  selector: 'sd-profile',
  imports: [ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly me = inject(MeService);
  protected readonly auth = inject(AuthService);
  protected readonly passwordMinLength = PASSWORD_MIN_LENGTH;

  protected readonly infoForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    firstname: ['', Validators.required],
    lastname: ['', Validators.required],
    jobTitle: [''],
  });

  protected readonly passwordForm = this.fb.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(PASSWORD_MIN_LENGTH)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: matchValidator('newPassword', 'confirmPassword') },
  );

  protected readonly infoMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);
  protected readonly passwordMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);
  protected readonly savingInfo = signal(false);
  protected readonly savingPassword = signal(false);

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (user) {
      this.infoForm.patchValue({ ...user, jobTitle: user.jobTitle ?? '' });
    }
  }

  saveInfo(): void {
    if (this.infoForm.invalid) {
      this.infoForm.markAllAsTouched();
      return;
    }
    const value = this.infoForm.getRawValue();
    this.savingInfo.set(true);
    this.infoMessage.set(null);
    this.me.update({ ...value, jobTitle: value.jobTitle || null }).subscribe({
      next: () => {
        this.infoMessage.set({ type: 'success', text: 'Profil mis à jour.' });
        this.savingInfo.set(false);
      },
      error: (err) => {
        this.infoMessage.set({ type: 'error', text: errorMessage(err) });
        this.savingInfo.set(false);
      },
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    this.savingPassword.set(true);
    this.passwordMessage.set(null);
    this.me.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.passwordForm.reset();
        this.passwordMessage.set({ type: 'success', text: 'Mot de passe modifié.' });
        this.savingPassword.set(false);
        this.me.get().subscribe();
      },
      error: (err) => {
        this.passwordMessage.set({ type: 'error', text: errorMessage(err) });
        this.savingPassword.set(false);
      },
    });
  }
}
