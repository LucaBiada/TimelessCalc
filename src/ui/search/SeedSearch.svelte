<script lang="ts">
  import { searchStore } from "$lib/stores/searchStore";
  import { treeStore } from "$lib/stores/treeStore";
  import { canvas } from "$lib/canvas/canvasContext";
  import { translations } from "$lib/providers/translations";
  import { formatStatTranslation } from "$lib/utils/sidebar/sidebarUtils";
  import { seedAnalyzerRequest } from "$lib/stores/seedAnalyzerStore";

  interface Props {
    seed: number | null;
    onapplyseed: (seed: number) => void;
  }

  let { seed = $bindable(null), onapplyseed }: Props = $props();

  let seedInput: number | null = $state(null);
  let searchTimeout: number | null = $state(null);

  let jewelType = $derived($searchStore.jewelType);

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

  {#if $searchStore.seedSearched && Object.keys(timelessStats).length > 0}
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
