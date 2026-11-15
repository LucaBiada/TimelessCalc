<script lang="ts">
  import type { Conqueror } from "$lib/types";
  import RadioButton from "$lib/ui/common/RadioButton.svelte";

  interface Props {
    conqueror: Conqueror | null;
    options: Conqueror[];
  }

  let { conqueror = $bindable(null), options }: Props = $props();
</script>

<div class="flex items-baseline justify-between mb-2">
  <span class="text-xs font-medium text-ink-muted">Conqueror</span>
  {#if conqueror && conqueror.keystone !== "Any"}
    <span class="text-xs text-ink-faint">{conqueror.keystone}</span>
  {/if}
</div>
<div class="grid grid-cols-4 gap-1.5">
  {#each options as conquerorOption (conquerorOption.label)}
    <RadioButton
      _value={conquerorOption}
      label={conquerorOption.label}
      hint={conquerorOption.keystone === "Any" ? "Any conqueror" : conquerorOption.keystone}
      isSelected={conqueror?.label === conquerorOption.label}
      size="sm"
      onclick={() => {
        conqueror = conquerorOption;
      }}
    />
  {/each}
</div>
