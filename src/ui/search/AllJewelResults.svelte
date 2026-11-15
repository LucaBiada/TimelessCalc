<script lang="ts">
  import type { JewelGroupResult, Node } from "$lib/types";
  import { searchStore } from "$lib/stores/searchStore";
  import { treeStore } from "$lib/stores/treeStore";
  import { jewelTypes } from "$lib/constants/timeless";
  import { canvas } from "$lib/canvas/canvasContext";
  import { centerOnSocket } from "$lib/canvas/utils/coordinate";
  import { findNearbyKeystone } from "$lib/utils/formatters";
  import { cleanupSeedModifications } from "$lib/utils/sidebar/searchLogic";
  import SearchResults from "$lib/ui/search/SearchResults.svelte";

  interface Props {
    ontargetposition?: (pos: { top: number; left: number } | null) => void;
  }

  let { ontargetposition }: Props = $props();

  let groups = $derived($searchStore.allJewelResults ?? []);
  let allJewels = $derived(!!$searchStore.allJewels);

  // Groups arrive in socket pick order, then jewel order.
  let sockets = $derived.by(() => {
    const seen = new Map<number, Node>();
    for (const g of groups) if (!seen.has(g.socket.skill)) seen.set(g.socket.skill, g.socket);
    return [...seen.values()];
  });
  let multiSocket = $derived(sockets.length > 1);

  let openSocket = $state<number | null>(null);
  let openKey = $state<string | null>(null);
  const keyOf = (g: JewelGroupResult) => `${g.socket.skill}-${g.jewelType.name}`;
  const nameOf = (socket: Node) => findNearbyKeystone(socket, canvas.treeData.nodes, canvas.treeData);
  const groupsFor = (socket: Node) => groups.filter((g) => g.socket.skill === socket.skill);
  const skippedFor = (socket: Node) =>
    allJewels ? jewelTypes.filter((j) => !groupsFor(socket).some((g) => g.jewelType.name === j.name)) : [];

  function clearTree() {
    cleanupSeedModifications();
    canvas.state.highlightedStatKeys = null;
    canvas.state.highlightVersion++;
  }

  // Opening a group loads that socket + jewel into the regular single-jewel view.
  function toggleGroup(group: JewelGroupResult) {
    clearTree();
    if (openKey === keyOf(group)) {
      openKey = null;
      return;
    }
    openKey = keyOf(group);
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
    if (group.socket.skill !== $treeStore.chosenSocket?.skill || multiSocket) {
      const scale = centerOnSocket(group.socket);
      treeStore.update((s) => ({ ...s, chosenSocket: group.socket, scale }));
    }
  }

  function toggleSocket(socket: Node) {
    const socketGroups = groupsFor(socket);
    // With one jewel there is nothing to choose inside the socket: open its results directly.
    if (!allJewels && socketGroups.length === 1) {
      openSocket = openSocket === socket.skill ? null : socket.skill;
      if (socketGroups[0].totalResults > 0) toggleGroup(socketGroups[0]);
      return;
    }
    openSocket = openSocket === socket.skill ? null : socket.skill;
  }

  function backToForm() {
    clearTree();
    searchStore.update((s) => ({
      ...s,
      jewelType: s.allJewels ? null : s.jewelType,
      conqueror: s.allJewels ? null : s.conqueror,
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

  const summary = (g: JewelGroupResult) =>
    g.totalResults === 0 ? "No seed matches" : `${g.totalResults} seeds, best score ${g.bestScore}`;
</script>

{#snippet chevron(open: boolean, hidden = false)}
  <svg class="w-4 h-4 shrink-0 text-ink-faint transition-transform duration-150 {open ? 'rotate-180' : ''} {hidden ? 'opacity-0' : ''}" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
{/snippet}

{#snippet jewelRow(group: JewelGroupResult)}
  {@const open = openKey === keyOf(group)}
  {@const empty = group.totalResults === 0}
  <div class="rounded-md border {open ? 'border-line-strong' : 'border-line'}">
    <button
      type="button"
      class="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors {empty ? 'cursor-default' : 'cursor-pointer hover:bg-hover'} {open ? 'bg-raised' : ''}"
      aria-expanded={open}
      disabled={empty}
      onclick={() => toggleGroup(group)}
    >
      {@render chevron(open, empty)}
      <span class="flex-1 text-sm font-medium {empty ? 'text-ink-muted' : 'text-ink'}">{group.jewelType.label}</span>
      <span class="text-xs text-ink-faint">{summary(group)}</span>
    </button>
    {#if open}
      <div class="px-3 py-3 border-t border-line">
        {#key openKey}
          <SearchResults {ontargetposition} embedded />
        {/key}
      </div>
    {/if}
  </div>
{/snippet}

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
  <h2 class="text-xs font-medium text-ink-muted">{multiSocket ? "Results by socket" : "Results by jewel"}</h2>
  {#if allJewels}
    <span class="text-xs text-ink-faint">Scores compare seeds within one jewel</span>
  {/if}
</div>

{#if groups.length === 0}
  <div class="rounded-md border border-dashed border-line-strong px-4 py-6 text-center">
    <p class="text-sm text-ink font-medium">None of your stats roll on these jewels</p>
    <p class="mt-1 text-xs text-ink-muted">Pick other stats or another jewel, then search again.</p>
  </div>
{:else if multiSocket}
  <div class="space-y-2">
    {#each sockets as socket (socket.skill)}
      {@const socketGroups = groupsFor(socket)}
      {@const open = openSocket === socket.skill}
      {@const single = !allJewels && socketGroups.length === 1 ? socketGroups[0] : null}
      <div class="rounded-md border {open ? 'border-line-strong' : 'border-line'}">
        <button
          type="button"
          class="w-full flex items-center gap-2 px-3 py-2.5 text-left cursor-pointer hover:bg-hover transition-colors {open ? 'bg-raised' : ''}"
          aria-expanded={open}
          onclick={() => toggleSocket(socket)}
        >
          {@render chevron(open)}
          <span class="flex-1 text-sm font-medium text-ink truncate">Near {nameOf(socket)}</span>
          <span class="text-xs text-ink-faint shrink-0">
            {#if single}{summary(single)}{:else}{socketGroups.length} {socketGroups.length === 1 ? "jewel" : "jewels"}{/if}
          </span>
        </button>
        {#if open}
          <div class="px-3 py-3 border-t border-line">
            {#if single}
              {#if single.totalResults > 0}
                {#key openKey}
                  <SearchResults {ontargetposition} embedded />
                {/key}
              {:else}
                <p class="text-xs text-ink-faint">No seed matches your stats here.</p>
              {/if}
            {:else}
              <div class="space-y-2">
                {#each socketGroups as group (keyOf(group))}
                  {@render jewelRow(group)}
                {/each}
              </div>
              {#if skippedFor(socket).length > 0}
                <p class="mt-2 text-xs text-ink-faint">Not searched, none of your stats roll on: {skippedFor(socket).map((j) => j.label).join(", ")}.</p>
              {/if}
            {/if}
          </div>
        {/if}
      </div>
    {/each}
  </div>
{:else}
  <div class="space-y-2">
    {#each groups as group (keyOf(group))}
      {@render jewelRow(group)}
    {/each}
  </div>
  {#if sockets[0] && skippedFor(sockets[0]).length > 0}
    <p class="mt-3 text-xs text-ink-faint">
      Not searched, none of your stats roll on: {skippedFor(sockets[0]).map((j) => j.label).join(", ")}.
    </p>
  {/if}
{/if}
