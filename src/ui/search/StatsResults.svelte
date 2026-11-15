<script lang="ts">
  import { searchStore } from "$lib/stores/searchStore";
  import { treeStore } from "$lib/stores/treeStore";
  import { URLS } from "$lib/constants/urls";
  import { canvas } from "$lib/canvas/canvasContext";
  import {
    getSeedsPerPage,
    buildTradeQuery,
  } from "$lib/utils/sidebar/tradeQuery";
  import TradeButton from "$lib/ui/common/TradeButton.svelte";
  import ExportButton from "$lib/ui/common/ExportButton.svelte";
  import { exportJewelToPobFormat } from "$lib/utils/export/jewelExporter";
  import { copyToClipboard } from "$lib/utils/sharing/shareUtils";
  import { showNotification } from "$lib/stores/notificationStore";

  import type { Translation } from "$lib/types";

  interface Props {
    expandedGroups: Record<number, boolean>;
    groupPages: Record<string, number>;
    hasGroupTraded: Record<string, boolean>;
    translation: Record<string, Translation[]>;
    onapplyseed: (seed: number) => void;
    ongrouptrade: (total: string) => void;
    ongroupnext: (total: string) => void;
    onexpand: (total: number) => void;
  }

  let {
    expandedGroups = $bindable({}),
    groupPages = $bindable({}),
    hasGroupTraded = $bindable({}),
    translation,
    onapplyseed,
    ongrouptrade,
    ongroupnext,
    onexpand,
  }: Props = $props();

  function openTradeForSeed(seed: number) {
    const normalized =
      $searchStore.platform.toLowerCase() === "playstation"
        ? "sony"
        : $searchStore.platform.toLowerCase();
    const platform =
      $searchStore.platform === "PC" ? "" : normalized + "/";
    const league = encodeURIComponent($searchStore.league);
    const query = buildTradeQuery(
      [seed],
      $searchStore.jewelType!,
      $searchStore.conqueror,
      0,
    );
    // Todo: move pattern to constants file and use replace to build the url
    const url = `${URLS.POE_TRADE_SEARCH}${platform}${league}?q=${encodeURIComponent(JSON.stringify(query))}`;
    window.open(url, "_blank");
  }

  function highlightNodesWithStatKeys(statKeys: number[]) {
    canvas.state.highlightedStatKeys = statKeys;
    canvas.state.highlightVersion = (canvas.state.highlightVersion || 0) + 1;
  }

  async function handleSeedClick(item: {
    seed: number;
    statCounts: Record<number, number>;
    statTotals: Record<number, number>;
  }) {
    await onapplyseed(item.seed);
    setTimeout(() => {
      const statKeys = Object.keys(item.statCounts).map((k) => parseInt(k));
      highlightNodesWithStatKeys(statKeys);
    }, 50);
  }

  async function handleExportSeed(seed: number) {
    try {
      const pobFormat = await exportJewelToPobFormat(
        $searchStore.jewelType!,
        seed,
        $searchStore.conqueror!,
      );
      const success = await copyToClipboard(pobFormat);

      if (success) {
        showNotification("export", `Seed ${seed} copied for Path of Building`);
      } else {
        throw new Error("Clipboard write failed");
      }
    } catch (error) {
      console.error("Export failed:", error);
      showNotification(
        "error",
        "Couldn't copy to the clipboard. Allow clipboard access for this site and try again.",
      );
    }
  }
</script>

{#snippet chevron(open: boolean)}
  <svg class="w-4 h-4 text-ink-faint transition-transform duration-150 {open ? 'rotate-180' : ''}" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
{/snippet}

<div>
  <div class="flex items-baseline justify-between mb-2">
    <h2 class="text-xs font-medium text-ink-muted">Results by score</h2>
    <span class="text-xs text-ink-faint">{$searchStore.totalResults} seeds</span>
  </div>
  <div class="space-y-2">
    {#each Object.keys($searchStore.statsResults).sort((a, b) => parseFloat(b) - parseFloat(a)) as total (total)}
      {@const items = $searchStore.statsResults[total]}
      {@const open = !!expandedGroups[parseFloat(total)]}
      {@const groupSeeds = items.map((g) => g.seed)}
      {@const seedsPerPage = getSeedsPerPage($searchStore.jewelType!, $searchStore.conqueror)}
      {@const currentGroupPage = groupPages[total] || 0}
      {@const maxGroupPage = Math.floor((groupSeeds.length - 1) / seedsPerPage)}
      <div class="rounded-md border border-line overflow-hidden">
        <div class="flex items-center gap-2 pr-2 bg-raised">
          <button
            type="button"
            class="flex-1 flex items-center gap-2 px-3 py-2 text-left cursor-pointer hover:bg-hover transition-colors"
            aria-expanded={open}
            onclick={() => onexpand(parseFloat(total))}
          >
            {@render chevron(open)}
            <span class="text-sm text-ink font-medium">Score {total}</span>
            <span class="text-xs text-ink-faint">{items.length} {items.length === 1 ? "seed" : "seeds"}</span>
          </button>
          <TradeButton onclick={() => ongrouptrade(total)}>Trade</TradeButton>
          {#if hasGroupTraded[total] && currentGroupPage < maxGroupPage}
            <TradeButton variant="secondary" onclick={() => ongroupnext(total)}>Next page</TradeButton>
          {/if}
        </div>

        {#if open}
          <div class="divide-y divide-line border-t border-line">
            {#each items as item (item.seed)}
              {@const isActive = $searchStore.seed === item.seed}
              <div
                class="group px-3 py-2.5 cursor-pointer transition-colors {isActive ? 'bg-gold-soft' : 'hover:bg-hover'}"
                role="button"
                tabindex="0"
                aria-pressed={isActive}
                title="Show this seed on the tree"
                onclick={() => handleSeedClick(item)}
                onkeydown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSeedClick(item);
                  }
                }}
              >
                <div class="flex items-center gap-2">
                  <span class="flex-1 text-sm font-medium {isActive ? 'text-gold' : 'text-ink'}">Seed {item.seed}</span>
                  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
                  <span class="flex items-center gap-1" onclick={(e) => e.stopPropagation()}>
                    <ExportButton onclick={() => handleExportSeed(item.seed)} />
                    <TradeButton variant="secondary" onclick={() => openTradeForSeed(item.seed)}>Trade</TradeButton>
                  </span>
                </div>
                <ul class="mt-1 space-y-0.5">
                  {#each Object.entries(item.statCounts) as [statKey, count] (statKey)}
                    {@const stat = $searchStore.selectedStats.find((s) => s.statKey === parseInt(statKey))}
                    {@const statTotal = item.statTotals?.[parseInt(statKey)] ?? 0}
                    {@const divider = translation[statKey]?.[0]?.divider ?? 1}
                    {#if stat}
                      <li class="flex items-center gap-2 text-xs text-ink-muted">
                        <span
                          class="w-2 h-2 rounded-full shrink-0"
                          style="background: {$searchStore.statKeyColors[parseInt(statKey)] || 'var(--color-ink-faint)'}"
                          aria-hidden="true"
                        ></span>
                        <span class="flex-1 truncate" title={stat.label}>{stat.label}</span>
                        <span class="text-ink-faint" title="Nodes with this stat">×{count}</span>
                        <span class="w-10 text-right text-ink-faint" title="Total value">{statTotal / divider}</span>
                      </li>
                    {/if}
                  {/each}
                </ul>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  </div>
  <p class="mt-2 text-xs text-ink-faint">Click a seed to show it on the tree. Dots match the highlight colors on the tree.</p>
</div>
