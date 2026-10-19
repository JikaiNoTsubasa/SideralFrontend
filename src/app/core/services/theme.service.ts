import { DOCUMENT } from '@angular/common';
import { computed, DestroyRef, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { AccentColor, ACCENT_COLORS, DEFAULT_ACCENT, DEFAULT_THEME, Theme, THEMES } from '../models/theme.model';
import { AuthService } from './auth.service';

/** Clé lue aussi par le script inline de index.html (évite un flash du mauvais thème au chargement). */
const STORAGE_KEY = 'sideral.theme';

/**
 * Applique le thème et la couleur principale sur <html> (data-theme / data-accent).
 * Les préférences viennent du compte utilisateur ; elles sont mises en cache localement
 * pour l'écran de connexion et le chargement initial.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly auth = inject(AuthService);

  private readonly _theme = signal<Theme>(DEFAULT_THEME);
  private readonly _accent = signal<AccentColor>(DEFAULT_ACCENT);
  private readonly systemDark = signal(false);

  readonly theme = this._theme.asReadonly();
  readonly accent = this._accent.asReadonly();
  /** Thème réellement affiché ("system" résolu selon le système d'exploitation). */
  readonly resolvedTheme = computed(() =>
    this._theme() === 'system' ? (this.systemDark() ? 'dark' : 'light') : (this._theme() as 'light' | 'dark'),
  );

  constructor() {
    this.watchSystemTheme();
    this.restoreCache();

    // Préférences du compte dès que l'utilisateur est chargé (connexion, /me, mise à jour)
    effect(() => {
      const user = this.auth.currentUser();
      if (user) {
        untracked(() => this.set(user.theme, user.accentColor));
      }
    });

    effect(() => {
      const root = this.document.documentElement;
      root.dataset['theme'] = this.resolvedTheme();
      root.dataset['accent'] = this._accent();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme: this._theme(), accent: this._accent() }));
    });
  }

  /** Applique immédiatement (aperçu) ; la sauvegarde sur le compte est faite par MeService.updatePreferences. */
  set(theme: Theme, accent: AccentColor): void {
    this._theme.set(THEMES.some((t) => t.key === theme) ? theme : DEFAULT_THEME);
    this._accent.set(ACCENT_COLORS.some((a) => a.key === accent) ? accent : DEFAULT_ACCENT);
  }

  private restoreCache(): void {
    try {
      const cached = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
      if (cached) {
        this.set(cached.theme, cached.accent);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private watchSystemTheme(): void {
    const media = this.document.defaultView?.matchMedia('(prefers-color-scheme: dark)');
    if (!media) {
      return;
    }
    this.systemDark.set(media.matches);
    const listener = (e: MediaQueryListEvent) => this.systemDark.set(e.matches);
    media.addEventListener('change', listener);
    inject(DestroyRef).onDestroy(() => media.removeEventListener('change', listener));
  }
}
