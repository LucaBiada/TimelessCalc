<script lang="ts">
  import type { Node } from "$lib/types";

  interface Props {
    node: Node | null;
    x: number;
    y: number;
  }

  let { node, x, y }: Props = $props();

  let baseStats = $derived(node?.stats || []);
  let timelessStats = $derived(node?.timelessStats);
  let statsToDisplay = $derived(timelessStats ? timelessStats : baseStats);
  let isExtraStat = $derived.by(() => {
    if (!timelessStats) return [];
    return timelessStats.map((stat, i) => {
      const statIndexInBase = baseStats.indexOf(stat);
      if (statIndexInBase === -1) return true;
      const occurrencesInBase = baseStats.filter((s) => s === stat).length;
      const occurrencesUpToI = timelessStats
        .slice(0, i + 1)
        .filter((s) => s === stat).length;
      return occurrencesUpToI > occurrencesInBase;
    });
  });
  let keptStats = $derived(statsToDisplay.filter((_, i) => !isExtraStat[i]));
  let jewelStats = $derived(statsToDisplay.filter((_, i) => isExtraStat[i]));
  let header = $derived(node?.conqueredName || node?.name || "");

  let tw = $state(0);
  let th = $state(0);

  let tooltipPos = $derived.by(() => {
    const offset = 20;
    let left = x + offset;
    let top = y - offset;

    if (left + tw > window.innerWidth) {
      left = x - tw - offset;
    }
    if (top + th > window.innerHeight) {
      top = window.innerHeight - th - offset;
    }
    if (top < 0) {
      top = offset;
    }

    return { left, top };
  });
</script>

{#if node}
  <div
    bind:clientWidth={tw}
    bind:clientHeight={th}
    class="fixed z-50 pointer-events-none bg-panel/95 border border-line-strong text-ink px-3 py-2.5 rounded-md max-w-xs shadow-lg shadow-black/50"
    style="left: {tooltipPos.left}px; top: {tooltipPos.top}px; {tw === 0 ? 'visibility: hidden;' : ''}"
  >
    <div class="text-sm font-semibold">{header}</div>
    {#if keptStats.length > 0}
      <ul class="mt-1.5 space-y-0.5 text-[13px] text-ink-muted whitespace-pre-wrap">
        {#each keptStats as stat, index (index)}
          <li>{stat}</li>
        {/each}
      </ul>
    {/if}
    {#if jewelStats.length > 0}
      <div class="mt-2 pt-2 border-t border-line">
        <div class="text-xs text-ink-faint mb-0.5">From jewel</div>
        <ul class="space-y-0.5 text-[13px] text-gold whitespace-pre-wrap">
          {#each jewelStats as stat, index (index)}
            <li>{stat}</li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>
{/if}
