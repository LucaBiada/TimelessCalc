<script lang="ts">
  import { searchStore } from "$lib/stores/searchStore";
  import { getSeedsPerPage } from "$lib/utils/sidebar/tradeQuery";
  import type { Snippet } from "svelte";

  interface Props {
    hasTraded?: boolean;
    ontrade: () => void;
    onnext: () => void;
    ontargetposition?: (pos: { top: number; left: number } | null) => void;
    league?: Snippet;
    platform?: Snippet;
  }

  let {
    hasTraded = false,
    ontrade,
    onnext,
    ontargetposition,
    league,
    platform,
  }: Props = $props();

  let jewelType = $derived($searchStore.jewelType);
  let conqueror = $derived($searchStore.conqueror);

  let showTooltip = $state(false);
  let tooltipButton: HTMLButtonElement | undefined = $state();

  function handleMouseEnter() {
    showTooltip = true;
    updatePosition();
  }

  function handleMouseLeave() {
    showTooltip = false;
    ontargetposition?.(null);
  }

  function updatePosition() {
    if (showTooltip && tooltipButton) {
      const rect = tooltipButton.getBoundingClientRect();
      const pos = {
        top: (rect?.bottom || 60) + 8,
        left: Math.max(8, (rect?.right || 200) - 256),
      };
      ontargetposition?.(pos);
    }
  }
</script>

<div class="flex items-baseline justify-between mb-2">
  <span class="text-xs font-medium text-ink-muted">Find these seeds on the trade site</span>
  <button
    type="button"
    bind:this={tooltipButton}
    onmouseenter={handleMouseEnter}
    onmouseleave={handleMouseLeave}
    onfocus={handleMouseEnter}
    onblur={handleMouseLeave}
    aria-label="How trade pages work"
    class="text-xs text-ink-faint hover:text-ink underline decoration-dotted underline-offset-2 cursor-help"
  >
    How pages work
  </button>
</div>
<div class="grid grid-cols-[1fr_auto] gap-2 mb-2">
  <div>{@render league?.()}</div>
  <div class="w-24">{@render platform?.()}</div>
</div>
<div class="flex gap-2">
  <button
    type="button"
    onclick={ontrade}
    class="flex-1 py-2 px-3 bg-gold hover:bg-gold-strong text-on-gold rounded-md text-sm font-semibold cursor-pointer transition-colors"
  >
    Open trade search
  </button>
  {#if hasTraded && $searchStore.totalResults > 0}
    {@const seedsPerPage = getSeedsPerPage(jewelType!, conqueror)}
    {@const maxPage = Math.floor(
      ($searchStore.totalResults - 1) / seedsPerPage,
    )}
    {#if $searchStore.currentPage < maxPage}
      <button
        type="button"
        onclick={onnext}
        class="py-2 px-3 rounded-md border border-line text-sm text-ink hover:bg-hover hover:border-line-strong cursor-pointer transition-colors"
      >
        Next page ({$searchStore.currentPage + 2}/{maxPage + 1})
      </button>
    {/if}
  {/if}
</div>
