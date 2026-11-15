<script lang="ts">
  import { onMount } from "svelte";

  let { suggestedName, onSave, onCancel } = $props<{
    suggestedName: string;
    onSave: (name: string) => void;
    onCancel: () => void;
  }>();

  let inputElement: HTMLInputElement;
  let name = $state("");

  onMount(() => {
    inputElement.focus();
  });

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      onSave(name);
    } else if (event.key === "Escape") {
      onCancel();
    }
  }

  function handleSave() {
    onSave(name);
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      onCancel();
    }
  }
</script>

<svelte:window onkeydown={(e) => e.key === "Escape" && onCancel()} />

<div
  class="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4"
  role="dialog"
  aria-modal="true"
  aria-labelledby="save-favorite-title"
  tabindex="-1"
  onclick={handleBackdropClick}
  onkeydown={(e) => e.key === "Escape" && onCancel()}
>
  <div class="bg-panel border border-line rounded-lg w-full max-w-md">
    <div class="px-5 py-4 border-b border-line flex items-center justify-between">
      <h3 id="save-favorite-title" class="text-base font-semibold text-ink">Save favorite</h3>
      <button
        type="button"
        onclick={onCancel}
        class="w-8 h-8 grid place-items-center rounded-md text-ink-muted hover:text-ink hover:bg-hover cursor-pointer transition-colors"
        aria-label="Close"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    <div class="px-5 py-4">
      <label for="favorite-name" class="text-xs font-medium text-ink-muted mb-1.5 block">Name</label>
      <input
        id="favorite-name"
        bind:this={inputElement}
        bind:value={name}
        type="text"
        placeholder={suggestedName}
        class="w-full px-3 py-2 rounded-md bg-raised border border-line text-ink placeholder-ink-faint focus:border-gold transition-colors"
        onkeydown={handleKeydown}
      />
      <p class="text-xs text-ink-faint mt-1.5">Leave empty to use the suggested name.</p>
    </div>
    <div class="px-5 py-3 border-t border-line flex justify-end gap-2">
      <button type="button" onclick={onCancel} class="py-2 px-3 rounded-md border border-line text-sm text-ink hover:bg-hover hover:border-line-strong cursor-pointer transition-colors">Cancel</button>
      <button type="button" onclick={handleSave} class="py-2 px-4 bg-gold hover:bg-gold-strong text-on-gold rounded-md text-sm font-semibold cursor-pointer transition-colors">Save favorite</button>
    </div>
  </div>
</div>
