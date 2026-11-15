<script lang="ts">
  import type { JewelGroupResult } from "$lib/types";
  import { searchStore } from "$lib/stores/searchStore";
  import { jewelTypes } from "$lib/constants/timeless";
  import { canvas } from "$lib/canvas/canvasContext";
  import { cleanupSeedModifications } from "$lib/utils/sidebar/searchLogic";
  import SearchResults from "$lib/ui/search/SearchResults.svelte";

  interface Props {
    ontargetposition?: (pos: { top: number; left: number } | null) => void;
  }

  let { ontargetposition }: Props = $props();

  let groups = $derived($searchStore.allJewelResults ?? []);
  let skipped = $derived(
    jewelTypes.filter((j) => !groups.some((g) => g.jewelType.name === j.name)),
  );
  let openJewel = $state<string | null>(null);

  function clearTree() {
    cleanupSeedModifications();
    canvas.state.highlightedStatKeys = null;
    canvas.state.highlightVersion++;
  }

  // Opening a group loads that jewel's results into the regular single-jewel view.
  function toggleGroup(group: JewelGroupResult) {
    clearTree();
    if (openJewel === group.jewelType.name) {
      openJewel = null;
      return;
    }
    openJewel = group.jewelType.name;
    searchStore.update((s) => ({
      ...s,
      jewelType: group.jewelType,
      conqueror: group.conqueror,
      statsResults: group.statsResults,
      orderedSeeds: group.orderedSeeds,
      totalResults: group.totalResults,
      currentPage: 0,
      seed: null,
    }));
  }

  function backToForm() {
    clearTree();
    searchStore.update((s) => ({
      ...s,
      jewelType: null,
      conqueror: null,
      searched: false,
      statsSearched: false,
      statsResults: {},
      orderedSeeds: [],
      totalResults: 0,
      currentPage: 0,
      allJewelResults: null,
      seed: null,
    }));
  }
</script>

<div class="flex items-center mb-4">
  <button
    onclick={backToForm}
    class="flex items-center gap-1 -ml-2 px-2 h-8 rounded-md text-sm text-ink-muted hover:text-ink hover:bg-hover transition-colors cursor-pointer"
  >
    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
    Edit search
  </button>
</div>

<div class="flex items-baseline justify-between mb-2">
  <h2 class="text-xs font-medium text-ink-muted">Results by jewel</h2>
  <span class="text-xs text-ink-faint">Scores compare seeds within one jewel</span>
</div>

<div class="space-y-2">
  {#each groups as group (group.jewelType.name)}
    {@const open = openJewel === group.jewelType.name}
    {@const empty = group.totalResults === 0}
    <div class="rounded-md border {open ? 'border-line-strong' : 'border-line'}">
      <button
        type="button"
        class="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors {empty
          ? 'cursor-default'
          : 'cursor-pointer hover:bg-hover'} {open ? 'bg-raised' : ''}"
        aria-expanded={open}
        disabled={empty}
        onclick={() => toggleGroup(group)}
      >
        <svg class="w-4 h-4 text-ink-faint transition-transform duration-150 {open ? 'rotate-180' : ''} {empty ? 'opacity-0' : ''}" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
        <span class="flex-1 text-sm font-medium {empty ? 'text-ink-muted' : 'text-ink'}">{group.jewelType.label}</span>
        {#if empty}
          <span class="text-xs text-ink-faint">No seed matches</span>
        {:else}
          <span class="text-xs text-ink-faint">{group.totalResults} seeds, best score {group.bestScore}</span>
        {/if}
      </button>

      {#if open}
        <div class="px-3 pt-3 pb-3 border-t border-line">
          {#key group.jewelType.name}
            <SearchResults {ontargetposition} embedded />
          {/key}
        </div>
      {/if}
    </div>
  {/each}
</div>

{#if skipped.length > 0}
  <p class="mt-3 text-xs text-ink-faint">
    Not searched, none of your stats roll on: {skipped.map((j) => j.label).join(", ")}.
  </p>
{/if}
