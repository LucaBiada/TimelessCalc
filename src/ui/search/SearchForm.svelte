<script lang="ts">
  import type { Conqueror } from "$lib/types";
  import { searchStore } from "$lib/stores/searchStore";
  import { treeStore } from "$lib/stores/treeStore";
  import { historyActions } from "$lib/stores/historyStore";
  import { conquerors } from "$lib/constants/timeless";
  import { getConquerorOptions } from "$lib/utils/sidebar/options";
  import { handleSearch as performSearch } from "$lib/utils/sidebar/searchLogic";
  import { translations } from "$lib/providers/translations";

  import JewelTypeSelector from "$lib/ui/selectors/JewelTypeSelector.svelte";
  import ConquerorSelector from "$lib/ui/selectors/ConquerorSelector.svelte";
  import ModeSelector from "$lib/ui/selectors/ModeSelector.svelte";
  import SeedSearch from "$lib/ui/search/SeedSearch.svelte";
  import StatsSearch from "$lib/ui/search/StatsSearch.svelte";
  import NodeToggles from "$lib/ui/search/NodeToggles.svelte";
  import Modal from "$lib/ui/common/Modal.svelte";
  import Spinner from "$lib/ui/common/Spinner.svelte";
  import {
    resetDependentFields,
    resetForModeChange,
    resetHighlights,
    changeRadius,
    changeKeystone,
  } from "$lib/utils/search/resetStore";
  import { validateSocket } from "$lib/utils/socketValidation";
  import { findNearbyKeystone } from "$lib/utils/formatters";
  import { canvas } from "$lib/canvas/canvasContext";

  let seedInput: number | null = $state(null);
  let socketWarningMessage = $state("");

  let previousJewelType: typeof $searchStore.jewelType = null;
  let previousConqueror: typeof $searchStore.conqueror = null;

  $effect(() => {
    const current = $searchStore.jewelType;
    if (current !== previousJewelType) {
      resetHighlights();
      changeRadius($treeStore.chosenSocket);
      // Only reset if changing jewelType AND conqueror doesn't match the new type
      // This allows history/URL loading to work (they set all fields correctly)
      // while resetting on user interaction
      if (previousJewelType !== null) {
        const currentConqueror = $searchStore.conqueror;
        const validConquerors = current ? conquerors[current.name] || [] : [];
        const isValidConqueror = validConquerors.some(
          (c: Conqueror) => c.label === currentConqueror?.label,
        );
        if (!isValidConqueror) {
          resetDependentFields();
        }
      }
      previousJewelType = current;
    }
  });

  $effect(() => {
    const current = $searchStore.conqueror;
    if (current !== previousConqueror) {
      changeKeystone($treeStore.chosenSocket);
      previousConqueror = current;
    }
  });

  function checkSocketAndSearch(action: () => void) {
    const warning = validateSocket();
    if (warning) {
      socketWarningMessage = warning;
      return;
    }
    action();
  }

  let conquerorOptions = $derived(getConquerorOptions($searchStore.jewelType));

  // The conqueror only changes the keystone and trade filters, so start on "Any".
  $effect(() => {
    if ($searchStore.jewelType && !$searchStore.conqueror && conquerorOptions[0]) {
      const any = conquerorOptions[0];
      searchStore.update((s) => ({ ...s, conqueror: any }));
    }
  });

  let socketName = $derived(
    $treeStore.chosenSocket
      ? findNearbyKeystone($treeStore.chosenSocket, canvas.treeData.nodes, canvas.treeData)
      : "",
  );

  async function handleSearch() {
    await performSearch(
      $searchStore.mode,
      seedInput,
      translations,
      $searchStore.jewelType,
      $searchStore.selectedStats,
    );
    if ($searchStore.searched) {
      searchStore.update((s) => {
        if (s.mode === "stats") {
          s.statsSearched = true;
          // Save successful stats search to history
          historyActions.saveCurrentSearch();
        } else if (s.mode === "seed") {
          s.seedSearched = true;
        }
        return s;
      });
    }
  }

  function setMode(newMode: "seed" | "stats" | null) {
    resetForModeChange(newMode);
    resetHighlights();
    seedInput = null;
  }

  function handleSeedInput(newSeed: number) {
    seedInput = newSeed;
    searchStore.update((state) => {
      state.seed = newSeed;
      return state;
    });
    if (
      newSeed >= ($searchStore.jewelType?.min || 0) &&
      newSeed <= ($searchStore.jewelType?.max || 0)
    ) {
      checkSocketAndSearch(handleSearch);
    }
  }
</script>

<div class="relative">
  {#if $searchStore.loading && $searchStore.mode === "stats"}
    <div class="absolute inset-0 bg-panel/90 z-20 flex items-center justify-center rounded-md">
      <Spinner text="Searching seeds..." />
    </div>
  {/if}

  {#if !$treeStore.chosenSocket}
    <div class="rounded-md border border-dashed border-line-strong px-4 py-6 text-center">
      <p class="text-sm text-ink font-medium">Click a jewel socket on the tree to start</p>
      <p class="mt-1 text-xs text-ink-muted">Sockets are the round slots with a purple ring.</p>
    </div>
  {:else}
    <div
      class="space-y-5 {$searchStore.loading && $searchStore.mode === 'stats'
        ? 'opacity-50 pointer-events-none'
        : ''}"
    >
      <section>
        <div class="text-xs font-medium text-ink-muted mb-1">Socket</div>
        <div class="text-sm text-ink">Near {socketName}</div>
        <div class="mt-0.5 text-xs text-ink-faint">Click another socket to switch, or this one again to clear it.</div>
      </section>

      <section>
        <NodeToggles />
      </section>

      <section>
        <JewelTypeSelector bind:jewelType={$searchStore.jewelType} />
      </section>

      {#if $searchStore.jewelType}
        <section>
          <ConquerorSelector
            bind:conqueror={$searchStore.conqueror}
            options={conquerorOptions}
          />
        </section>

        {#if $searchStore.conqueror}
          <section>
            <ModeSelector
              mode={$searchStore.mode}
              disabled={!$searchStore.jewelType}
              onselectmode={setMode}
            />
          </section>

          {#if $searchStore.mode === "seed"}
            <section>
              <SeedSearch bind:seed={seedInput} onapplyseed={handleSeedInput} />
            </section>
          {/if}

          {#if $searchStore.mode === "stats"}
            <section class="space-y-4">
              <StatsSearch jewelType={$searchStore.jewelType} />
              <button
                onclick={() => checkSocketAndSearch(handleSearch)}
                class="w-full py-2.5 px-4 bg-gold hover:bg-gold-strong text-on-gold rounded-md font-semibold cursor-pointer transition-colors"
              >
                Search seeds
              </button>
            </section>
          {/if}
        {/if}
      {/if}
    </div>
  {/if}
</div>

{#if socketWarningMessage}
  <Modal
    message={socketWarningMessage}
    onCancel={() => (socketWarningMessage = "")}
  />
{/if}
