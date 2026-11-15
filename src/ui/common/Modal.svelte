<script lang="ts">
  let { message, onConfirm, onCancel } = $props<{
    message: string;
    onConfirm?: () => void;
    onCancel: () => void;
  }>();
</script>

<svelte:window onkeydown={(e) => e.key === "Escape" && onCancel()} />

<div class="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4">
  <div
    class="bg-panel border border-line rounded-lg w-full max-w-md"
    role="alertdialog"
    aria-modal="true"
  >
    <p class="px-5 py-4 text-sm text-ink leading-relaxed">{message}</p>
    <div class="px-5 py-3 border-t border-line flex justify-end gap-2">
      <button
        type="button"
        onclick={onCancel}
        class="py-2 px-3 rounded-md border border-line text-sm text-ink hover:bg-hover hover:border-line-strong cursor-pointer transition-colors"
      >
        {onConfirm ? "Cancel" : "OK"}
      </button>
      {#if onConfirm}
        <button
          type="button"
          onclick={onConfirm}
          class="py-2 px-4 bg-gold hover:bg-gold-strong text-on-gold rounded-md text-sm font-semibold cursor-pointer transition-colors"
        >
          Continue
        </button>
      {/if}
    </div>
  </div>
</div>
