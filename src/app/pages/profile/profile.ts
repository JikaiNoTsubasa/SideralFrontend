import { Component, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { MeService } from '../../core/services/me.service';
import { errorMessage } from '../../core/utils/error-message';
import { resizeToSquare } from '../../core/utils/image';
import { Avatar } from '../../shared/avatar/avatar';
import { matchValidator, PASSWORD_MIN_LENGTH } from '../../core/utils/validators';

/** Côté du carré envoyé à l'API (affiché au maximum en ~100px, x2 pour les écrans haute densité). */
const AVATAR_SIZE = 256;
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@Component({
  selector: 'sd-profile',
  imports: [ReactiveFormsModule, Avatar],
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
  protected readonly avatarMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);
  protected readonly savingAvatar = signal(false);

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

  async onAvatarSelected(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    if (!AVATAR_TYPES.includes(file.type)) {
      this.avatarMessage.set({ type: 'error', text: 'Format non supporté (JPEG, PNG ou WebP attendu).' });
      return;
    }

    this.savingAvatar.set(true);
    this.avatarMessage.set(null);
    let image: Blob;
    try {
      image = await resizeToSquare(file, AVATAR_SIZE);
    } catch {
      this.avatarMessage.set({ type: 'error', text: 'Impossible de lire cette image.' });
      this.savingAvatar.set(false);
      return;
    }

    this.me.uploadAvatar(image).subscribe({
      next: () => {
        this.avatarMessage.set({ type: 'success', text: 'Photo de profil mise à jour.' });
        this.savingAvatar.set(false);
      },
      error: (err) => {
        this.avatarMessage.set({ type: 'error', text: errorMessage(err) });
        this.savingAvatar.set(false);
      },
    });
  }

  removeAvatar(): void {
    if (!confirm('Supprimer votre photo de profil ?')) {
      return;
    }
    this.savingAvatar.set(true);
    this.avatarMessage.set(null);
    this.me.deleteAvatar().subscribe({
      next: () => {
        this.avatarMessage.set({ type: 'success', text: 'Photo de profil supprimée.' });
        this.savingAvatar.set(false);
      },
      error: (err) => {
        this.avatarMessage.set({ type: 'error', text: errorMessage(err) });
        this.savingAvatar.set(false);
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
