<script lang="ts">
  import type { Snippet } from 'svelte';
  import { themeStore } from '$lib/theme/theme.svelte';
  import '../app.css';

  let { children }: { children: Snippet } = $props();
</script>

<div class="shell">
  <header class="topbar">
    <span class="brand">Audit Platform</span>
    <button
      type="button"
      class="theme-toggle"
      onclick={() => themeStore.toggle()}
      aria-label={`Switch to ${themeStore.current === 'light' ? 'dark' : 'light'} theme`}
    >
      {themeStore.current === 'light' ? 'Dark mode' : 'Light mode'}
    </button>
  </header>

  <main class="content">
    {@render children()}
  </main>
</div>

<style>
  .shell {
    min-height: 100%;
    display: flex;
    flex-direction: column;
  }

  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--space-5);
    background-color: var(--color-bg-elevated);
    border-bottom: 1px solid var(--color-border);
  }

  .brand {
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  .theme-toggle {
    appearance: none;
    border: 1px solid var(--color-border-strong);
    background-color: var(--color-bg);
    color: var(--color-text);
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-3);
    cursor: pointer;
    font-size: 13px;
  }

  .theme-toggle:hover {
    border-color: var(--color-accent);
  }

  .content {
    flex: 1;
    padding: var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
</style>
