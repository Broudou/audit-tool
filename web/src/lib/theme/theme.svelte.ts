type Theme = 'light' | 'dark';

const STORAGE_KEY = 'audit-tool:theme';

function getPreferredTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  const prefersDark =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

class ThemeStore {
  current = $state<Theme>('light');

  constructor() {
    if (typeof window !== 'undefined') {
      this.current = getPreferredTheme();
      this.applyToDocument();
    }
  }

  toggle(): void {
    this.set(this.current === 'light' ? 'dark' : 'light');
  }

  set(theme: Theme): void {
    this.current = theme;
    localStorage.setItem(STORAGE_KEY, theme);
    this.applyToDocument();
  }

  private applyToDocument(): void {
    document.documentElement.setAttribute('data-theme', this.current);
  }
}

export const themeStore = new ThemeStore();
