// Valeurs synchronisées avec sideral-context/Users/UserPreferences.cs et src/themes.scss
export type Theme = 'light' | 'dark' | 'system';

export const THEMES: { key: Theme; label: string }[] = [
  { key: 'light', label: 'Clair' },
  { key: 'dark', label: 'Sombre' },
  { key: 'system', label: 'Système' },
];

export const ACCENT_COLORS = [
  { key: 'indigo', label: 'Indigo' },
  { key: 'blue', label: 'Bleu' },
  { key: 'teal', label: 'Turquoise' },
  { key: 'green', label: 'Vert' },
  { key: 'orange', label: 'Orange' },
  { key: 'rose', label: 'Rose' },
  { key: 'violet', label: 'Violet' },
] as const;

export type AccentColor = (typeof ACCENT_COLORS)[number]['key'];

export const DEFAULT_THEME: Theme = 'light';
export const DEFAULT_ACCENT: AccentColor = 'indigo';
