import { beforeEach, describe, expect, it } from 'vitest';
import { themeStore } from './theme.svelte';

describe('themeStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('toggles between light and dark and persists the choice', () => {
    themeStore.set('light');
    expect(themeStore.current).toBe('light');

    themeStore.toggle();

    expect(themeStore.current).toBe('dark');
    expect(localStorage.getItem('audit-tool:theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
