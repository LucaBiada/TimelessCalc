<script lang="ts">
  import { jewelTypes, jewelVisuals } from "$lib/constants/timeless";
  import type { JewelType } from "$lib/types";
  import { loadJewel, cache } from "$lib/providers/jewels";
  import { setJewelLoadError } from "$lib/stores/searchStore";
  import { searchStore } from "$lib/stores/searchStore";
  import { treeStore } from "$lib/stores/treeStore";
  import { get } from "svelte/store";
  import JewelIcon from "$lib/ui/common/JewelIcon.svelte";

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
    {@const selected = !$searchStore.allJewels && jewelType?.name === jewel.name}
    {@const color = jewelVisuals[jewel.name].color}
    <button
      type="button"
      aria-pressed={selected}
      onclick={() => {
        searchStore.update((s) => ({ ...s, allJewels: false, allJewelResults: null }));
        jewelType = jewel;
      }}
      class="flex flex-col items-center gap-1 px-2 pt-2 pb-1.5 rounded-md border text-[13px] leading-tight text-center cursor-pointer transition-colors {selected
        ? 'text-ink font-medium'
        : 'border-line bg-raised text-ink-muted hover:text-ink hover:border-line-strong'}"
      style={selected ? `border-color: ${color}; background: color-mix(in srgb, ${color} 14%, transparent)` : undefined}
    >
      <JewelIcon name={jewel.name} size={32} decorative />
      {jewel.label}
    </button>
  {/each}
  <button
    type="button"
    aria-pressed={!!$searchStore.allJewels}
    title="Search every jewel type at once (stat search only)"
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
    class="col-span-3 flex items-center justify-center gap-2 px-2 py-1.5 rounded-md border text-[13px] cursor-pointer transition-colors {$searchStore.allJewels
      ? 'border-gold bg-gold-soft text-ink font-medium'
      : 'border-line bg-raised text-ink-muted hover:text-ink hover:border-line-strong'}"
  >
    <span class="flex -space-x-0.5" aria-hidden="true">
      {#each jewelTypes as jewel (jewel.name)}
        <JewelIcon name={jewel.name} size={18} decorative />
      {/each}
    </span>
    All jewels
  </button>
</div>
