<script lang="ts">
  import type { JewelType, Stat, StatSearchMode } from "$lib/types";
  import { searchStore } from "$lib/stores/searchStore";
  import { filterStats } from "$lib/utils/sidebar/sidebarUtils";
  import { getStatsOptions } from "$lib/utils/sidebar/options";
  import jewelStatsJson from "$lib/data/jewelstats.json" with { type: "json" };
  import { translations } from "$lib/providers/translations";

  let { jewelType }: { jewelType: JewelType | null } = $props();

  const jewelStats: Record<string, number[]> = JSON.parse(
    JSON.stringify(jewelStatsJson),
  );

  let searchValue = $state("");
  let showDropdown = $state(false);
  let inputElement: HTMLInputElement;

  let filteredStats = $derived.by(() => {
    const computedOptions = getStatsOptions(
      jewelType,
      jewelStats,
      translations,
    );
    return filterStats(
      searchValue,
      computedOptions,
      $searchStore.selectedStats,
    );
  });

  let isGloriousVanity = $derived(jewelType?.name === "vaal");
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

  function selectStat(stat: Stat) {
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
    searchValue = "";
    showDropdown = false;
  }

  function updateFilteredStats() {
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

<div class="space-y-4">
  <div class="relative">
    <label for="stat-search" class="block text-xs font-medium text-ink-muted mb-2">Stats you want</label>
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
      class="w-full px-3 py-2 rounded-md bg-raised border border-line text-ink placeholder-ink-faint focus:outline-none focus:border-gold transition-colors"
    />

    {#if showDropdown}
      <div
        class="absolute top-full left-0 right-0 mt-1 bg-raised border border-line-strong rounded-md shadow-lg shadow-black/40 z-10 max-h-60 overflow-y-auto custom-scrollbar"
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
