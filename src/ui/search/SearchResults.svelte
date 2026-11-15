<script lang="ts">
import { searchStore } from "$lib/stores/searchStore";
import { treeStore } from "$lib/stores/treeStore";
import { canvas } from "$lib/canvas/canvasContext";
import { applySeed } from "$lib/utils/sidebar/searchLogic";
import { getSeedsPerPage, openTradeUrl } from "$lib/utils/sidebar/tradeQuery";
import {
	generateShareUrl,
	copyToClipboard,
} from "$lib/utils/sharing/shareUtils";
import { translations } from "$lib/providers/translations";

import LeagueSelector from "$lib/ui/selectors/LeagueSelector.svelte";
import PlatformSelector from "$lib/ui/selectors/PlatformSelector.svelte";
import StatsResults from "$lib/ui/search/StatsResults.svelte";
import TradeControls from "$lib/ui/search/TradeControls.svelte";
import SaveFavoriteModal from "$lib/ui/modals/SaveFavoriteModal.svelte";
import { favoritesActions } from "$lib/stores/favoritesStore";
import { showNotification } from "$lib/stores/notificationStore";
import { findNearbyKeystone } from "$lib/utils/formatters";

let {
	ontargetposition,
	embedded = false,
}: {
	ontargetposition?: (pos: { top: number; left: number } | null) => void;
	/** Inside an "All jewels" group: the group list owns the way back to the form. */
	embedded?: boolean;
} = $props();

let expandedGroups: Record<number, boolean> = $state({});
let groupPages: Record<string, number> = $state({});
let hasGroupTraded: Record<string, boolean> = $state({});
let _hasTraded = $state(false);

let showSaveFavoriteModal = $state(false);
let favoriteSuggestion = $state("");
let favoriteNotificationName = $state("");
let showShareTooltip = $state(false);

let canShare = $derived(
	!!$searchStore.jewelType &&
		!!$searchStore.conqueror &&
		($searchStore.selectedStats.length > 0 || $searchStore.seed !== null),
);

function nextPage() {
	const seedsPerPage = getSeedsPerPage(
		$searchStore.jewelType!,
		$searchStore.conqueror,
	);
	const maxPage = Math.floor(($searchStore.totalResults - 1) / seedsPerPage);
	searchStore.update((s) => {
		if (s.currentPage < maxPage) {
			s.currentPage++;
		}
		return s;
	});
}

function storeTradeInfo(seeds: number[], page: number, groupName?: string) {
	const filtersPerPage = getSeedsPerPage(
		$searchStore.jewelType!,
		$searchStore.conqueror,
	);
	if (seeds.length < filtersPerPage) return;

	const conquerorLabel = $searchStore.conqueror?.label || "Any";
	searchStore.update((s) => {
		s.lastTradeInfo = { seeds, conquerorLabel, page, groupName };
		return s;
	});
}

function logNextPage() {
	const nextPageNum = $searchStore.currentPage;
	const seedsPerPage = getSeedsPerPage(
		$searchStore.jewelType!,
		$searchStore.conqueror,
	);
	const startIdx = nextPageNum * seedsPerPage;
	const endIdx = Math.min(
		startIdx + seedsPerPage,
		$searchStore.orderedSeeds.length,
	);
	const pageSeeds = $searchStore.orderedSeeds.slice(startIdx, endIdx);
	openTradeUrl(
		$searchStore.orderedSeeds,
		$searchStore.jewelType!,
		$searchStore.conqueror,
		nextPageNum,
		$searchStore.platform,
		$searchStore.league,
	);
	storeTradeInfo(pageSeeds, nextPageNum);
}

function handleTrade() {
	searchStore.update((s) => {
		s.currentPage = 0;
		return s;
	});
	_hasTraded = true;
	const seedsPerPage = getSeedsPerPage(
		$searchStore.jewelType!,
		$searchStore.conqueror,
	);
	const pageSeeds = $searchStore.orderedSeeds.slice(0, seedsPerPage);
	openTradeUrl(
		$searchStore.orderedSeeds,
		$searchStore.jewelType!,
		$searchStore.conqueror,
		0,
		$searchStore.platform,
		$searchStore.league,
	);
	storeTradeInfo(pageSeeds, 0);
}

function handleGroupTrade(total: string) {
	const groupSeeds = $searchStore.statsResults[total].map((g) => g.seed);
	const seedsPerPage = getSeedsPerPage(
		$searchStore.jewelType!,
		$searchStore.conqueror,
	);
	const pageSeeds = groupSeeds.slice(0, seedsPerPage);
	groupPages = { ...groupPages, [total]: 0 };
	hasGroupTraded = { ...hasGroupTraded, [total]: true };
	openTradeUrl(
		groupSeeds,
		$searchStore.jewelType!,
		$searchStore.conqueror,
		0,
		$searchStore.platform,
		$searchStore.league,
	);
	storeTradeInfo(pageSeeds, 0, total);
}

function handleGroupNext(total: string) {
	const groupSeeds = $searchStore.statsResults[total].map((g) => g.seed);
	const currentPage = groupPages[total] || 0;
	const seedsPerPage = getSeedsPerPage(
		$searchStore.jewelType!,
		$searchStore.conqueror,
	);
	const maxPage = Math.floor((groupSeeds.length - 1) / seedsPerPage);
	if (currentPage < maxPage) {
		const nextPage = currentPage + 1;
		const startIdx = nextPage * seedsPerPage;
		const endIdx = Math.min(startIdx + seedsPerPage, groupSeeds.length);
		const pageSeeds = groupSeeds.slice(startIdx, endIdx);
		groupPages = { ...groupPages, [total]: nextPage };
		openTradeUrl(
			groupSeeds,
			$searchStore.jewelType!,
			$searchStore.conqueror,
			nextPage,
			$searchStore.platform,
			$searchStore.league,
		);
		storeTradeInfo(pageSeeds, nextPage, total);
	}
}

function backToForm() {
	clearHighlights();
	expandedGroups = {};
	searchStore.update((s) => {
		s.searched = false;
		s.statsResults = {};
		s.currentPage = 0;
		s.totalResults = 0;
		s.orderedSeeds = [];
		s.statsSearched = false;
		s.seedSearched = false;
		return s;
	});
}

function clearHighlights() {
	canvas.state.highlightedStatKeys = null;
	canvas.state.highlightVersion++;
}

async function applySeedFromResults(seed: number) {
	await applySeed(seed, $searchStore.jewelType!, translations);
	searchStore.update((s) => {
		s.searched = true;
		s.seed = seed;
		return s;
	});
}

function expandGroup(total: number) {
	expandedGroups = { ...expandedGroups, [total]: !expandedGroups[total] };
}

async function handleShare() {
	const shareUrl = generateShareUrl($searchStore, $treeStore);
	const success = await copyToClipboard(shareUrl);
	if (success) {
		showNotification("share", "Share link copied");
	}
}

function generateFavoriteSuggestion(): string {
	const conquerorLabel = $searchStore.conqueror?.label || "Any";
	const jewelTypeLabel = $searchStore.jewelType?.label || "";
	const socket = $treeStore.chosenSocket;
	if (!socket) {
		return `${conquerorLabel} (${jewelTypeLabel}) - No socket`;
	}
  const keystone = findNearbyKeystone(socket, canvas.treeData.nodes, canvas.treeData);
	return `${conquerorLabel} (${jewelTypeLabel}) - ${keystone}`;
}

function handleSaveFavorite(name: string) {
	const finalName = name.trim() === "" ? favoriteSuggestion : name;
	favoritesActions.saveFavorite(finalName);
	showSaveFavoriteModal = false;
	favoriteNotificationName = finalName;
	showNotification("favorite", `Saved as '${favoriteNotificationName}'`, 3000);
}
</script>

<div class="flex items-center gap-1 {embedded ? 'mb-3 -mt-1' : 'mb-4'}">
  {#if !embedded}
  <button
    onclick={backToForm}
    class="flex items-center gap-1 -ml-2 px-2 h-8 rounded-md text-sm text-ink-muted hover:text-ink hover:bg-hover transition-colors cursor-pointer"
  >
    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
    Edit search
  </button>
  {/if}

  <div class="flex-1"></div>

  <div class="relative inline-flex">
    <button
      onclick={handleShare}
      disabled={!canShare}
      class="w-8 h-8 grid place-items-center rounded-md transition-colors {canShare
        ? 'text-ink-muted hover:text-ink hover:bg-hover cursor-pointer'
        : 'text-ink-faint cursor-not-allowed'}"
      aria-label="Copy share link"
      onmouseenter={() => (showShareTooltip = true)}
      onmouseleave={() => (showShareTooltip = false)}
      onfocus={() => (showShareTooltip = true)}
      onblur={() => (showShareTooltip = false)}
    >
      <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M10 14a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1 1" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M14 10a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1-1" />
      </svg>
    </button>
    {#if showShareTooltip}
      <div
        class="absolute right-0 top-full mt-1.5 px-2 py-1 bg-raised text-ink text-xs rounded border border-line-strong whitespace-nowrap z-50 pointer-events-none"
        role="tooltip"
      >
        Copy share link
      </div>
    {/if}
  </div>

  {#if Object.keys($searchStore.statsResults).length > 0}
    <button
      onclick={() => {
        favoriteSuggestion = generateFavoriteSuggestion();
        showSaveFavoriteModal = true;
      }}
      class="w-8 h-8 grid place-items-center rounded-md text-ink-muted hover:text-ink hover:bg-hover cursor-pointer transition-colors"
      aria-label="Save to favorites"
      title="Save to favorites"
    >
      <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 4h14v17l-7-4-7 4z" />
      </svg>
    </button>
  {/if}
</div>

{#if Object.keys($searchStore.statsResults).length > 0}
  <section class="mb-5">
    <TradeControls
      hasTraded={_hasTraded}
      ontrade={handleTrade}
      onnext={() => {
        nextPage();
        logNextPage();
      }}
      {ontargetposition}
    >
      {#snippet league()}
        <LeagueSelector />
      {/snippet}
      {#snippet platform()}
        <PlatformSelector />
      {/snippet}
    </TradeControls>
  </section>

  <StatsResults
    translation={translations}
    bind:expandedGroups
    bind:groupPages
    bind:hasGroupTraded
    onapplyseed={applySeedFromResults}
    ongrouptrade={handleGroupTrade}
    ongroupnext={handleGroupNext}
    onexpand={expandGroup}
  />
{:else}
  <div class="rounded-md border border-dashed border-line-strong px-4 py-6 text-center">
    <p class="text-sm text-ink font-medium">No seed matches these stats</p>
    <p class="mt-1 text-xs text-ink-muted">Lower the minimums, remove a stat, or select more nodes, then search again.</p>
  </div>
{/if}

{#if showSaveFavoriteModal}
  <SaveFavoriteModal
    suggestedName={favoriteSuggestion}
    onSave={handleSaveFavorite}
    onCancel={() => (showSaveFavoriteModal = false)}
  />
{/if}
