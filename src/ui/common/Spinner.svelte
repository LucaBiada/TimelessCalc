<script lang="ts">
  let { text = "Loading..." }: { text?: string } = $props();
</script>

<div class="flex flex-col items-center gap-3" role="status">
  <div
    class="w-8 h-8 border-2 border-ink-faint/40 border-t-gold rounded-full animate-spin"
    aria-hidden="true"
  ></div>
  <span class="text-sm text-ink-muted">{text}</span>
</div>
