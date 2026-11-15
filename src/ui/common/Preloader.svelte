<script lang="ts">
  // Props kept for the caller's API; the simple loader doesn't show progress.
  let { loadingComplete = false, progress = 0 } = $props();
  void loadingComplete;
  void progress;
</script>

<div
  class="fixed inset-0 z-[9999] bg-canvas flex flex-col items-center justify-center gap-3"
  role="status"
  aria-live="polite"
>
  <div
    class="w-8 h-8 border-2 border-ink-faint/40 border-t-gold rounded-full animate-spin"
    aria-hidden="true"
  ></div>
  <p class="text-sm text-ink-muted">Loading passive tree</p>
</div>
