<script lang="ts">
  import type { JewelType } from "$lib/types";
  import { URLS } from "$lib/constants/urls";

  interface Props {
    jewel: JewelType;
    errorMessage: string;
    onclose: () => void;
  }

  let { jewel, errorMessage, onclose }: Props = $props();

  const issueUrl = URLS.GITHUB_ISSUES;

  function copyError() {
    const text = `Jewel: ${jewel.name}\nError: ${errorMessage}`;
    navigator.clipboard.writeText(text);
  }

  function reloadPage() {
    window.location.reload();
  }
</script>

<svelte:window onkeydown={(e) => e.key === "Escape" && onclose()} />

<div
  class="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4"
  onclick={onclose}
  role="button"
  tabindex="0"
  onkeydown={(e) => e.key === "Escape" && onclose()}
>
  <div
    class="bg-panel border border-line rounded-lg w-full max-w-md"
    onclick={(e) => e.stopPropagation()}
    role="dialog"
    aria-modal="true"
    aria-labelledby="jewel-error-title"
    tabindex="-1"
    onkeydown={(e) => (e.key === "Enter" || e.key === " ") && onclose()}
  >
    <div class="px-5 py-4 border-b border-line flex items-center justify-between">
      <h2 id="jewel-error-title" class="text-base font-semibold text-ink">Couldn't load {jewel.name} data</h2>
      <button
        type="button"
        onclick={onclose}
        class="w-8 h-8 grid place-items-center rounded-md text-ink-muted hover:text-ink hover:bg-hover cursor-pointer transition-colors"
        aria-label="Close"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    <div class="px-5 py-4 space-y-3">
      <p class="px-3 py-2 rounded-md bg-danger-soft border border-danger text-xs font-mono text-danger break-all">{errorMessage}</p>
      <p class="text-sm text-ink-muted">
        Reload the page to try again. If it keeps failing, <a
          href={issueUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="text-ink underline hover:text-gold">open an issue</a
        > and paste the copied error.
      </p>
    </div>
    <div class="px-5 py-3 border-t border-line flex justify-end gap-2">
      <button type="button" onclick={onclose} class="py-2 px-3 rounded-md border border-line text-sm text-ink hover:bg-hover hover:border-line-strong cursor-pointer transition-colors">Cancel</button>
      <button type="button" onclick={copyError} class="py-2 px-3 rounded-md border border-line text-sm text-ink hover:bg-hover hover:border-line-strong cursor-pointer transition-colors">Copy error</button>
      <button type="button" onclick={reloadPage} class="py-2 px-4 bg-gold hover:bg-gold-strong text-on-gold rounded-md text-sm font-semibold cursor-pointer transition-colors">Reload page</button>
    </div>
  </div>
</div>
