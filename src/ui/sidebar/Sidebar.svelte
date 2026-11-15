<script lang="ts">
  import SearchTab from "$lib/ui/search/SearchTab.svelte";
  import SearchHistory from "$lib/ui/search/SearchHistory.svelte";
  import Favorites from "$lib/ui/favorites/Favorites.svelte";
  import { searchStore } from "$lib/stores/searchStore";
  import { URLS } from "$lib/constants/urls";
  import {
    getSeedsPerPage,
    getPageRangeFromOrdered,
    MAX_FILTERS,
  } from "$lib/utils/sidebar/tradeQuery";

  interface Props {
    onhelp: () => void;
  }

  let { onhelp }: Props = $props();

  // On phones the panel covers the whole tree, so it starts closed there.
  let isOpen = $state(typeof window === "undefined" || window.innerWidth >= 768);
  let activeTab = $state<"search" | "favorites" | "history">("search");
  let tooltipPosition: { top: number; left: number } | null = $state(null);

  const tabs = [
    { id: "search", label: "Search" },
    { id: "favorites", label: "Favorites" },
    { id: "history", label: "History" },
  ] as const;

  // Docks the tree canvas next to the panel (see --panel-offset in app.css).
  $effect(() => {
    document.documentElement.dataset.panel = isOpen ? "open" : "closed";
  });
</script>

{#if !isOpen}
  <button
    onclick={() => (isOpen = true)}
    class="fixed top-3 left-3 z-50 flex items-center gap-2 h-9 pl-2.5 pr-3 rounded-md bg-panel border border-line text-sm text-ink hover:bg-hover cursor-pointer transition-colors"
    aria-label="Show panel"
  >
    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
    </svg>
    Calculator
  </button>
{:else}
  <aside
    class="fixed left-0 top-0 h-screen w-full md:w-[var(--panel-width)] bg-panel border-r border-line z-40 flex flex-col"
    aria-label="Timeless jewel calculator"
  >
    <header class="flex items-center gap-2 px-4 pt-4 pb-3">
      <h1 class="flex-1 text-[15px] font-semibold text-ink">Timeless jewel calculator</h1>
      <button
        onclick={onhelp}
        class="w-8 h-8 grid place-items-center rounded-md text-ink-muted hover:text-ink hover:bg-hover cursor-pointer transition-colors"
        aria-label="Help"
        title="Help"
      >
        <svg class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9.5a2.5 2.5 0 0 1 4.9.7c0 1.7-2.4 2.3-2.4 3.8" />
          <path d="M12 17h.01" />
        </svg>
      </button>
      <button
        onclick={() => (isOpen = false)}
        class="w-8 h-8 grid place-items-center rounded-md text-ink-muted hover:text-ink hover:bg-hover cursor-pointer transition-colors"
        aria-label="Hide panel"
        title="Hide panel"
      >
        <svg class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M9 4v16" />
          <path d="M15 10l-2 2 2 2" />
        </svg>
      </button>
    </header>

    <nav class="flex gap-1 px-4 border-b border-line" aria-label="Panel sections">
      {#each tabs as tab (tab.id)}
        <button
          class="relative px-2.5 pb-2.5 pt-1 text-sm cursor-pointer transition-colors {activeTab === tab.id
            ? 'text-ink font-medium after:absolute after:inset-x-2.5 after:-bottom-px after:h-0.5 after:bg-gold'
            : 'text-ink-muted hover:text-ink'}"
          aria-current={activeTab === tab.id ? "page" : undefined}
          onclick={() => (activeTab = tab.id)}
        >
          {tab.label}
        </button>
      {/each}
    </nav>

    <div class="flex-1 overflow-y-auto custom-scrollbar px-4 py-4">
      {#if activeTab === "search"}
        <SearchTab ontargetposition={(pos) => (tooltipPosition = pos)} />
      {:else if activeTab === "favorites"}
        <Favorites onswitchtotab={(tab) => (activeTab = tab)} />
      {:else if activeTab === "history"}
        <SearchHistory onswitchtotab={(tab) => (activeTab = tab)} />
      {/if}
    </div>

    <footer class="px-4 py-2.5 border-t border-line text-xs text-ink-faint">
      <a
        href={URLS.GITHUB_REPO}
        target="_blank"
        rel="noopener noreferrer"
        class="hover:text-ink transition-colors"
      >
        Source on GitHub
      </a>
    </footer>
  </aside>
{/if}

{#if tooltipPosition}
  {@const pageInfo = getPageRangeFromOrdered(
    $searchStore.orderedSeeds,
    $searchStore.currentPage,
    $searchStore.jewelType!,
    $searchStore.conqueror,
  )}
  <div
    class="fixed z-[100] w-64 p-3 bg-raised border border-line-strong rounded-md text-sm text-ink-muted"
    style="top: {tooltipPosition.top}px; left: {tooltipPosition.left}px"
  >
    <p class="font-medium text-ink mb-2">Trade link pages</p>
    <p class="mb-2">
      A trade search holds at most {MAX_FILTERS} filters. Neighbouring seeds are
      merged into ranges (e.g. 10020-10022), so a page can hold a few more than
      {MAX_FILTERS} seeds. Best matches come first.
    </p>
    <p>
      {#if pageInfo.count > 0}
        {@const seedsPerPage = getSeedsPerPage(
          $searchStore.jewelType!,
          $searchStore.conqueror,
        )}
        {@const startNum = $searchStore.currentPage * seedsPerPage + 1}
        {@const endNum = Math.min(
          startNum + seedsPerPage - 1,
          $searchStore.totalResults,
        )}
        Showing seeds {startNum}-{endNum} of {$searchStore.totalResults}
      {:else}
        No results to show
      {/if}
    </p>
  </div>
{/if}
