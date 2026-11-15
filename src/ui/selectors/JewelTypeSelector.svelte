<script lang="ts">
  import { jewelTypes } from "$lib/constants/timeless";
  import type { JewelType } from "$lib/types";
  import { loadJewel, cache } from "$lib/providers/jewels";
  import { setJewelLoadError } from "$lib/stores/searchStore";
  import { searchStore } from "$lib/stores/searchStore";
  import { treeStore } from "$lib/stores/treeStore";
  import { get } from "svelte/store";
  import RadioButton from "$lib/ui/common/RadioButton.svelte";

  interface Props {
    jewelType: JewelType | null;
  }

  let { jewelType = $bindable(null) }: Props = $props();

  let loadingFor: string | null = null;
  let previousJewelTypeName: string | null = null;

  $effect(() => {
    if (jewelType !== null) {
      const jewelId = jewelType.name;
      const chosenSocket = get(treeStore).chosenSocket?.skill;

      if (!chosenSocket) {
        return;
      }

      const cacheKey = `${jewelId}-${chosenSocket}`;

      if (cache.has(cacheKey)) {
        return;
      }

      if (loadingFor === cacheKey) {
        return;
      }

      loadingFor = cacheKey;
      loadJewel(jewelId, String(chosenSocket))
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : String(err);
          if (jewelType) {
            setJewelLoadError(jewelType, message);
          }
        })
        .finally(() => {
          if (loadingFor === cacheKey) {
            loadingFor = null;
          }
        });
    }
  });

  $effect(() => {
    // Reset statSearchMode to 'occurrences' whenever jewelType changes
    if (jewelType !== null) {
      const currentJewelTypeName = jewelType.name;
      if (
        previousJewelTypeName !== null &&
        currentJewelTypeName !== previousJewelTypeName
      ) {
        searchStore.update((s) => {
          s.statSearchMode = "occurrences";
          return s;
        });
      }
      previousJewelTypeName = currentJewelTypeName;
    }
  });
</script>

<div class="text-xs font-medium text-ink-muted mb-2">Jewel</div>
<div class="grid grid-cols-3 gap-1.5">
  {#each jewelTypes as jewel (jewel.name)}
    <RadioButton
      _value={jewel}
      label={jewel.label}
      isSelected={!$searchStore.allJewels && jewelType?.name === jewel.name}
      onclick={() => {
        searchStore.update((s) => ({ ...s, allJewels: false, allJewelResults: null }));
        jewelType = jewel;
      }}
    />
  {/each}
  <div class="col-span-3">
    <RadioButton
      _value="all"
      label="All jewels"
      hint="Search every jewel type at once (stat search only)"
      isSelected={!!$searchStore.allJewels}
      size="sm"
      onclick={() => {
        searchStore.update((s) => ({
          ...s,
          allJewels: true,
          allJewelResults: null,
          conqueror: null,
          mode: "stats",
          seedSearched: false,
        }));
        jewelType = null;
      }}
    />
  </div>
</div>
