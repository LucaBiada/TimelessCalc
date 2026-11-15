<script lang="ts">
  import type { JewelType, Stat, StatSearchMode } from "$lib/types";
  import { searchStore } from "$lib/stores/searchStore";
  import { filterStats } from "$lib/utils/sidebar/sidebarUtils";
  import { getStatsOptions, getAllStatsOptions } from "$lib/utils/sidebar/options";
  import { jewelTypes } from "$lib/constants/timeless";
  import jewelStatsJson from "$lib/data/jewelstats.json" with { type: "json" };
  import { translations } from "$lib/providers/translations";

  let { jewelType }: { jewelType: JewelType | null } = $props();

  const jewelStats: Record<string, number[]> = JSON.parse(
    JSON.stringify(jewelStatsJson),
  );

  let searchValue = $state("");
  let showDropdown = $state(false);

  // Docked stat panel next to the main panel (see --panel-offset in app.css).
  let browserOpen = $state(false);
  let browserInput: HTMLInputElement | undefined = $state();
  $effect(() => {
    document.documentElement.dataset.statPanel = browserOpen ? "open" : "closed";
    if (browserOpen) browserInput?.focus();
  });
  $effect(() => () => {
    document.documentElement.dataset.statPanel = "closed";
  });
  function toggleBrowser() {
    browserOpen = !browserOpen;
    showDropdown = false;
  }
  let inputElement: HTMLInputElement;

  let filteredStats = $derived.by(() => {
    const computedOptions = $searchStore.allJewels
      ? getAllStatsOptions(jewelTypes, jewelStats, translations)
      : getStatsOptions(jewelType, jewelStats, translations);
    return filterStats(
      searchValue,
      computedOptions,
      $searchStore.selectedStats,
    );
  });

  let isGloriousVanity = $derived(jewelType?.name === "vaal");

  // In "All" mode, show which jewels can roll each stat; the others ignore it.
  function jewelsWithStat(statKey: number): string {
    const names = jewelTypes
      .filter((j) => jewelStats[j.name]?.includes(statKey))
      .map((j) => j.label);
    return names.length === jewelTypes.length ? "All jewels" : names.join(", ");
  }
  let minLabel = $derived.by(() =>
    $searchStore.statSearchMode === "occurrences" ? "Min. nodes" : "Min. value",
  );

  function removeStat(index: number) {
    searchStore.update((state) => {
      state.selectedStats = state.selectedStats.filter((_, i) => i !== index);
      return state;
    });
  }

  function clampValue(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  function handleWeightChange(stat: Stat, newValue: number) {
    const clamped = clampValue(newValue, 0, 999);
    searchStore.update((state) => {
      const statToUpdate = state.selectedStats.find((s) => s.statKey === stat.statKey);
      if (statToUpdate) {
        statToUpdate.weight = clamped;
      }
      return state;
    });
  }

  function handleMinWeightChange(stat: Stat, newValue: number) {
    const clamped = clampValue(newValue, 0, 999);
    searchStore.update((state) => {
      const statToUpdate = state.selectedStats.find((s) => s.statKey === stat.statKey);
      if (statToUpdate) {
        statToUpdate.minWeight = clamped;
      }
      return state;
    });
  }

  function handleMinTotalWeightChange(newValue: number) {
    const clamped = clampValue(newValue, 0, 99999);
    searchStore.update((state) => {
      state.minTotalWeight = clamped;
      return state;
    });
  }

  function selectStat(stat: Stat, keepFilter = false) {
    if (!$searchStore.selectedStats.some((s) => s.label === stat.label)) {
      searchStore.update((state) => {
        state.selectedStats.push({
          label: stat.label,
          statKey: stat.statKey,
          weight: 1,
          minWeight: 0,
          exclude: false,
        });
        return state;
      });
    }
    if (!keepFilter) searchValue = "";
    showDropdown = false;
  }

  // The stat list opens towards the side of the input with more room (inside the panel's
  // scroll area) and fills all of it.
  let listMaxHeight = $state(240);
  let openUp = $state(false);
  const GAP = 8;
  function fitList() {
    if (!inputElement) return;
    const area = (inputElement.closest(".overflow-y-auto") ?? document.documentElement).getBoundingClientRect();
    const input = inputElement.getBoundingClientRect();
    const below = Math.min(area.bottom, window.innerHeight) - input.bottom - GAP;
    // Opening upward, the list sits above the whole field, label included.
    const fieldTop = (inputElement.parentElement?.parentElement ?? inputElement).getBoundingClientRect().top;
    const above = fieldTop - Math.max(area.top, 0) - GAP;
    openUp = above > below;
    listMaxHeight = Math.max(120, openUp ? above : below);
  }

  function updateFilteredStats() {
    if (browserOpen) return;
    if (!showDropdown) fitList();
    showDropdown = true;
  }

  function handleBlur() {
    setTimeout(() => {
      showDropdown = false;
    }, 150);
  }

  function handleStatSearchModeChange(mode: StatSearchMode) {
    searchStore.update((s) => {
      s.statSearchMode = mode;
      return s;
    });
  }

  function handleExcludeChange(stat: Stat, newValue: boolean) {
    searchStore.update((state) => {
      const statToUpdate = state.selectedStats.find((s) => s.statKey === stat.statKey);
      if (statToUpdate) {
        statToUpdate.exclude = newValue;
      }
      return state;
    });
  }
</script>

<svelte:window
  onresize={() => showDropdown && fitList()}
  onkeydown={(e) => browserOpen && e.key === "Escape" && (browserOpen = false)}
/>

{#if browserOpen}
  <aside
    class="fixed top-0 left-0 md:left-[var(--panel-width)] h-screen w-full md:w-[var(--stat-panel-width)] bg-panel border-r border-line z-40 flex flex-col"
    aria-label="Add stats"
  >
    <header class="flex items-center gap-2 px-4 pt-4 pb-3">
      <h2 class="flex-1 text-[15px] font-semibold text-ink">Add stats</h2>
      <span class="text-xs text-ink-faint">{filteredStats.length} available</span>
      <button
        onclick={() => (browserOpen = false)}
        class="w-8 h-8 grid place-items-center rounded-md text-ink-muted hover:text-ink hover:bg-hover cursor-pointer transition-colors"
        aria-label="Close stat list"
        title="Close stat list"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </header>
    <div class="px-4 pb-3 border-b border-line">
      <input
        bind:this={browserInput}
        type="text"
        bind:value={searchValue}
        placeholder="Filter stats"
        aria-label="Filter stats"
        autocomplete="off"
        class="w-full px-3 py-2 rounded-md bg-raised border border-line text-ink placeholder-ink-faint focus:outline-none focus:border-gold transition-colors"
      />
    </div>
    <div class="flex-1 overflow-y-auto custom-scrollbar py-1">
      {#each filteredStats as stat (stat.statKey)}
        <button
          class="w-full px-4 py-2 text-left text-sm text-ink hover:bg-hover cursor-pointer transition-colors"
          onclick={() => selectStat(stat, true)}
        >
          {stat.label}
        </button>
      {:else}
        <p class="px-4 py-3 text-sm text-ink-faint">
          {searchValue ? `No stat matches "${searchValue}"` : "All stats are already added"}
        </p>
      {/each}
    </div>
    <footer class="px-4 py-2.5 border-t border-line text-xs text-ink-faint">
      Click a stat to add it. Added stats leave this list.
    </footer>
  </aside>
{/if}

<div class="space-y-4">
  <div class="relative">
    <label for="stat-search" class="block text-xs font-medium text-ink-muted mb-2">Stats you want</label>
    <div class="relative">
    <input
      id="stat-search"
      bind:this={inputElement}
      type="text"
      bind:value={searchValue}
      placeholder="Type to add a stat, e.g. strength"
      autocomplete="off"
      oninput={updateFilteredStats}
      onfocus={() => {
        updateFilteredStats();
      }}
      onclick={() => {
        if (!searchValue.trim()) {
          updateFilteredStats();
        }
      }}
      onblur={handleBlur}
      class="w-full pl-3 pr-10 py-2 rounded-md bg-raised border border-line text-ink placeholder-ink-faint focus:outline-none focus:border-gold transition-colors"
    />
    <button
      type="button"
      onclick={toggleBrowser}
      aria-label={browserOpen ? "Close stat list" : "Show all stats in a side panel"}
      aria-expanded={browserOpen}
      title={browserOpen ? "Close stat list" : "Show all stats in a side panel"}
      class="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 grid place-items-center rounded transition-colors cursor-pointer {browserOpen
        ? 'text-gold bg-gold-soft'
        : 'text-ink-muted hover:text-ink hover:bg-hover'}"
    >
      <svg class="w-4 h-4 transition-transform {browserOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 6l6 6-6 6" />
      </svg>
    </button>
    </div>

    {#if showDropdown}
      <div
        class="absolute {openUp ? 'bottom-full mb-1' : 'top-full mt-1'} left-0 right-0 bg-raised border border-line-strong rounded-md shadow-lg shadow-black/40 z-10 overflow-y-auto custom-scrollbar"
        style="max-height: {listMaxHeight}px"
      >
        {#if filteredStats.length > 0}
          {#each filteredStats as stat (stat.statKey)}
            <button
              class="w-full px-3 py-2 text-left text-sm text-ink hover:bg-hover cursor-pointer transition-colors"
              onmousedown={(e) => {
                e.preventDefault();
                selectStat(stat);
              }}
            >
              {stat.label}
            </button>
          {/each}
        {:else}
          <div class="px-3 py-2 text-sm text-ink-faint">No stat matches "{searchValue}"</div>
        {/if}
      </div>
    {/if}
  </div>

  {#if isGloriousVanity}
    <div>
      <div class="text-xs font-medium text-ink-muted mb-2">Rank seeds by</div>
      <div class="grid grid-cols-2 gap-1 p-1 rounded-md bg-raised border border-line" role="radiogroup">
        {#each [{ id: "occurrences", label: "Number of nodes" }, { id: "totalValue", label: "Total value" }] as option (option.id)}
          <button
            role="radio"
            aria-checked={$searchStore.statSearchMode === option.id}
            onclick={() => handleStatSearchModeChange(option.id as StatSearchMode)}
            class="py-1.5 px-2 rounded text-sm cursor-pointer transition-colors {$searchStore.statSearchMode === option.id
              ? 'bg-hover text-ink font-medium shadow-[inset_0_-2px_0_var(--color-gold)]'
              : 'text-ink-muted hover:text-ink'}"
          >
            {option.label}
          </button>
        {/each}
      </div>
    </div>
  {/if}

  {#if $searchStore.selectedStats.length === 0}
    <p class="text-xs text-ink-faint">Add one or more stats. Seeds are ranked by how many of your selected nodes get them, times each stat's weight.</p>
  {:else}
    <ul class="space-y-2">
      {#each $searchStore.selectedStats as stat, i (i)}
        <li class="rounded-md border border-line bg-raised px-3 py-2.5 {stat.exclude ? 'border-dashed' : ''}">
          <div class="flex items-start gap-2">
            <span class="flex-1 text-sm {stat.exclude ? 'text-ink-muted line-through decoration-ink-faint' : 'text-ink'}">{stat.label}</span>
            <button
              onclick={() => removeStat(i)}
              aria-label="Remove {stat.label}"
              class="-mr-1 -mt-0.5 w-6 h-6 grid place-items-center rounded text-ink-faint hover:text-ink hover:bg-hover cursor-pointer transition-colors"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {#if $searchStore.allJewels}
            <div class="mt-0.5 text-xs text-ink-faint">{jewelsWithStat(stat.statKey)}</div>
          {/if}
          <div class="mt-2 flex items-center gap-3 text-xs text-ink-muted">
            {#if !stat.exclude}
              <label class="flex items-center gap-1.5">
                Weight
                <input
                  type="number"
                  value={stat.weight}
                  oninput={(e) => {
                    const target = e.target as HTMLInputElement;
                    handleWeightChange(stat, parseFloat(target.value) || 0);
                  }}
                  min="0"
                  step="0.1"
                  class="w-14 px-2 py-1 text-sm bg-panel border border-line rounded text-ink focus:outline-none focus:border-gold"
                />
              </label>
              <label class="flex items-center gap-1.5">
                {minLabel}
                <input
                  type="number"
                  value={stat.minWeight}
                  oninput={(e) => {
                    const target = e.target as HTMLInputElement;
                    handleMinWeightChange(stat, parseFloat(target.value) || 0);
                  }}
                  min="0"
                  step="0.1"
                  class="w-14 px-2 py-1 text-sm bg-panel border border-line rounded text-ink focus:outline-none focus:border-gold"
                />
              </label>
            {:else}
              <span class="text-ink-faint">Seeds with this stat are left out</span>
            {/if}
            <label class="ml-auto flex items-center gap-1.5 cursor-pointer" title="Leave out seeds that put this stat on your nodes">
              <input
                type="checkbox"
                class="w-3.5 h-3.5 accent-[var(--color-gold)] cursor-pointer"
                checked={stat.exclude || false}
                oninput={(e) => {
                  const target = e.target as HTMLInputElement;
                  handleExcludeChange(stat, target.checked);
                }}
              />
              Exclude
            </label>
          </div>
        </li>
      {/each}
    </ul>

    <label class="flex items-center gap-2 text-xs text-ink-muted">
      Minimum total score
      <input
        id="minTotalWeight"
        type="number"
        value={$searchStore.minTotalWeight}
        oninput={(e) => {
          const target = e.target as HTMLInputElement;
          handleMinTotalWeightChange(parseFloat(target.value) || 0);
        }}
        placeholder="0"
        min="0"
        step="0.1"
        class="w-20 px-2 py-1 text-sm bg-raised border border-line rounded text-ink focus:outline-none focus:border-gold"
      />
    </label>
  {/if}
</div>
