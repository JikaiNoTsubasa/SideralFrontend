import { Component, inject, signal } from '@angular/core';
import { AccentColor, ACCENT_COLORS, Theme, THEMES } from '../../core/models/theme.model';
import { MeService } from '../../core/services/me.service';
import { ThemeService } from '../../core/services/theme.service';
import { errorMessage } from '../../core/utils/error-message';

@Component({
  selector: 'sd-preferences',
  templateUrl: './preferences.html',
  styleUrl: './preferences.scss',
})
export class Preferences {
  private readonly me = inject(MeService);
  protected readonly themeService = inject(ThemeService);
  protected readonly themes = THEMES;
  protected readonly accents = ACCENT_COLORS;

  protected readonly error = signal<string | null>(null);
  protected readonly saving = signal(false);

  selectTheme(theme: Theme): void {
    this.save(theme, this.themeService.accent());
  }

  selectAccent(accent: AccentColor): void {
    this.save(this.themeService.theme(), accent);
  }

  /** Aperçu immédiat puis enregistrement sur le compte ; retour à l'état précédent en cas d'erreur. */
  private save(theme: Theme, accentColor: AccentColor): void {
    const previous = { theme: this.themeService.theme(), accent: this.themeService.accent() };
    this.themeService.set(theme, accentColor);
    this.saving.set(true);
    this.error.set(null);
    this.me.updatePreferences({ theme, accentColor }).subscribe({
      next: () => this.saving.set(false),
      error: (err) => {
        this.themeService.set(previous.theme, previous.accent);
        this.error.set(errorMessage(err));
        this.saving.set(false);
      },
    });
  }
}
