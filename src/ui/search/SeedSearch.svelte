<script lang="ts">
  import { searchStore } from "$lib/stores/searchStore";
  import { treeStore } from "$lib/stores/treeStore";
  import { canvas } from "$lib/canvas/canvasContext";
  import { translations } from "$lib/providers/translations";
  import { formatStatTranslation } from "$lib/utils/sidebar/sidebarUtils";
  import { seedAnalyzerRequest } from "$lib/stores/seedAnalyzerStore";
  import { getPickedSockets } from "$lib/utils/sockets";
  import { seedStatsPerSocket, applySeed } from "$lib/utils/sidebar/searchLogic";
  import { findNearbyKeystone } from "$lib/utils/formatters";
  import { centerOnSocket } from "$lib/canvas/utils/coordinate";
  import type { Node } from "$lib/types";

  interface Props {
    seed: number | null;
    onapplyseed: (seed: number) => void;
  }

  let { seed = $bindable(null), onapplyseed }: Props = $props();

  let seedInput: number | null = $state(null);
  let searchTimeout: number | null = $state(null);

  let jewelType = $derived($searchStore.jewelType);

  // Several sockets picked: show what the seed gives on the selected nodes, per socket.
  let picked = $derived(getPickedSockets($treeStore));
  let perSocket = $state<Awaited<ReturnType<typeof seedStatsPerSocket>>>([]);
  $effect(() => {
    const sockets = picked;
    const jt = jewelType;
    const s = $searchStore.seed;
    void $treeStore.allocated.size;
    if (sockets.length < 2 || !jt || s === null || s < jt.min || s > jt.max) {
      perSocket = [];
      return;
    }
    seedStatsPerSocket(sockets, jt, s).then((r) => (perSocket = r));
  });

  async function showSocket(socket: Node) {
    if (!jewelType || $searchStore.seed === null) return;
    const scale = centerOnSocket(socket);
    treeStore.update((st) => ({ ...st, chosenSocket: socket, scale }));
    await applySeed($searchStore.seed, jewelType, translations);
  }

  function getTimelessStats(): Record<
    number,
    { count: number; total: number }
  > {
    const chosenSocket = $treeStore.chosenSocket;
    if (!chosenSocket) return {};
    const statData: Record<number, { count: number; total: number }> = {};
    for (const node of $treeStore.allocated.values()) {
      if (node?.timelessStatKeys && node?.timelessStatValues) {
        for (let i = 0; i < node.timelessStatKeys.length; i++) {
          const statKey = node.timelessStatKeys[i];
          const value = node.timelessStatValues[i];

          const statEntry = translations[statKey.toString()]?.[0];
          if (statEntry && node.stats) {
            const statLabel = formatStatTranslation(
              statKey,
              value,
              translations,
            );
            if (node.stats.includes(statLabel)) continue;
          }

          if (!statData[statKey]) {
            statData[statKey] = { count: 0, total: 0 };
          }
          statData[statKey].count++;
          statData[statKey].total += value;
        }
      }
    }
    return statData;
  }

  function highlightNodesWithStat(statKey: number) {
    canvas.state.highlightedStatKeys = [statKey];
    canvas.state.highlightVersion = (canvas.state.highlightVersion || 0) + 1;
  }

  function handleInput() {
    if (searchTimeout) window.clearTimeout(searchTimeout);
    searchTimeout = window.setTimeout(() => {
      if (
        seedInput &&
        seedInput >= (jewelType?.min || 0) &&
        seedInput <= (jewelType?.max || 0)
      ) {
        onapplyseed(seedInput);
      }
    }, 100);
  }

  let validSeed = $derived(
    !!jewelType && seedInput !== null && seedInput >= jewelType.min && seedInput <= jewelType.max,
  );

  function compareAllSockets() {
    if (validSeed && jewelType && seedInput !== null) {
      seedAnalyzerRequest.set({ seed: seedInput, jewelType });
    }
  }

  let timelessStats = $derived(
    $treeStore.chosenSocket && $searchStore.seedSearched
      ? getTimelessStats()
      : {},
  );
</script>

<div class="space-y-3">
  <div>
    <label for="seed-input" class="block text-xs font-medium text-ink-muted mb-2">Seed</label>
    <input
      id="seed-input"
      type="number"
      bind:value={seedInput}
      oninput={handleInput}
      placeholder="{jewelType?.min}–{jewelType?.max}"
      min={jewelType?.min}
      max={jewelType?.max}
      step="1"
      class="w-full px-3 py-2 rounded-md bg-raised border border-line text-ink placeholder-ink-faint focus:outline-none focus:border-gold transition-colors"
    />
    <p class="mt-1.5 text-xs text-ink-faint">
      The number on your jewel, between {jewelType?.min?.toLocaleString()} and {jewelType?.max?.toLocaleString()}.
    </p>
  </div>

  <button
    type="button"
    onclick={compareAllSockets}
    disabled={!validSeed}
    class="w-full py-2 px-3 rounded-md border border-line text-sm transition-colors {validSeed
      ? 'text-ink hover:bg-hover hover:border-line-strong cursor-pointer'
      : 'text-ink-faint cursor-not-allowed'}"
  >
    Compare this seed on all sockets
  </button>

  {#if perSocket.length > 1}
    <div>
      <div class="flex items-baseline justify-between mb-2">
        <span class="text-xs font-medium text-ink-muted">On your selected nodes, per socket</span>
        <span class="text-xs text-ink-faint">Click a socket to show it</span>
      </div>
      <div class="space-y-2">
        {#each perSocket as { socket, stats } (socket.skill)}
          {@const active = socket.skill === $treeStore.chosenSocket?.skill}
          {@const entries = Object.entries(stats).sort((a, b) => b[1].count - a[1].count)}
          <div class="rounded-md border {active ? 'border-gold' : 'border-line'}">
            <button
              type="button"
              class="w-full flex items-center gap-2 px-3 py-2 text-left cursor-pointer hover:bg-hover transition-colors"
              onclick={() => showSocket(socket)}
              aria-pressed={active}
            >
              <span class="flex-1 text-sm font-medium {active ? 'text-gold' : 'text-ink'} truncate">
                Near {findNearbyKeystone(socket, canvas.treeData.nodes, canvas.treeData)}
              </span>
              <span class="text-xs text-ink-faint">{entries.length === 0 ? "No changes on your nodes" : `${entries.length} stats`}</span>
            </button>
            {#if entries.length > 0}
              <ul class="px-3 pb-2 space-y-0.5">
                {#each entries as [statKeyStr, data] (statKeyStr)}
                  <li class="flex gap-3 text-xs text-ink-muted">
                    <span class="flex-1">{formatStatTranslation(parseInt(statKeyStr), data.total, translations)}</span>
                    {#if data.count > 1}<span class="text-ink-faint">×{data.count}</span>{/if}
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {:else if $searchStore.seedSearched && Object.keys(timelessStats).length > 0}
    <div>
      <div class="flex items-baseline justify-between mb-2">
        <span class="text-xs font-medium text-ink-muted">On your selected nodes</span>
        <span class="text-xs text-ink-faint">Click a stat to find it on the tree</span>
      </div>
      <ul class="rounded-md border border-line divide-y divide-line">
        {#each Object.entries(timelessStats).sort((a, b) => b[1].count - a[1].count) as [statKeyStr, data] (statKeyStr)}
          {@const statKey = parseInt(statKeyStr)}
          <li>
            <button
              class="w-full flex items-start gap-3 px-3 py-2 text-left text-sm text-ink hover:bg-hover cursor-pointer transition-colors"
              onclick={() => highlightNodesWithStat(statKey)}
            >
              <span class="flex-1">{formatStatTranslation(statKey, data.total, translations)}</span>
              {#if data.count > 1}
                <span class="text-xs text-ink-faint pt-0.5" title="Number of nodes with this stat (values summed)">×{data.count}</span>
              {/if}
            </button>
          </li>
        {/each}
      </ul>
    </div>
  {:else if validSeed && $searchStore.seedSearched}
    <p class="text-xs text-ink-faint">None of your selected nodes change with this seed. Select nodes above to see their new stats.</p>
  {/if}
</div>
