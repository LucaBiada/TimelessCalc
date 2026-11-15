<script lang="ts">
  import { fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";

  let {
    seeds,
    conquerorLabel,
    page,
    groupName = undefined,
    onDismiss,
  }: {
    seeds: number[];
    conquerorLabel: string;
    page: number;
    groupName?: string;
    onDismiss: () => void;
  } = $props();
</script>

<div
  class="fixed right-4 bottom-4 w-72 bg-raised border border-line-strong rounded-md text-sm text-ink shadow-lg overflow-hidden z-50"
  role="status"
  transition:fly={{ x: 320, duration: 300, easing: cubicOut }}
>
  <div class="flex items-start justify-between gap-2 pl-3 pr-1 py-1.5 border-b border-line">
    <div class="py-1 min-w-0">
      <p class="font-medium truncate">
        Seeds in trade search{#if groupName}<span class="text-ink-muted font-normal">: {groupName}</span>{/if}
      </p>
      <p class="text-xs text-ink-faint">{conquerorLabel}, page {page + 1}</p>
    </div>
    <button
      onclick={onDismiss}
      class="w-8 h-8 shrink-0 grid place-items-center rounded-md text-ink-muted hover:text-ink hover:bg-hover cursor-pointer transition-colors"
      aria-label="Dismiss"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
  <ul class="max-h-48 overflow-y-auto custom-scrollbar divide-y divide-line">
    {#each seeds as seed (seed)}
      <li class="px-3 py-1.5 tabular-nums text-ink-muted">{seed}</li>
    {/each}
  </ul>
</div>
