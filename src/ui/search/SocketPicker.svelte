<script lang="ts">
  import type { Node } from "$lib/types";
  import { treeStore } from "$lib/stores/treeStore";
  import { canvas } from "$lib/canvas/canvasContext";
  import { findNearbyKeystone } from "$lib/utils/formatters";
  import { getPickedSockets } from "$lib/utils/sockets";
  import { cleanupSeedModifications } from "$lib/utils/sidebar/searchLogic";

  let picked = $derived(getPickedSockets($treeStore));
  const nameOf = (socket: Node) =>
    findNearbyKeystone(socket, canvas.treeData.nodes, canvas.treeData);

  function removeSocket(socket: Node) {
    cleanupSeedModifications();
    treeStore.update((s) => {
      const rest = picked.filter((p) => p.skill !== socket.skill);
      s.pickedSockets = rest;
      if (s.chosenSocket?.skill === socket.skill) s.chosenSocket = rest[0] ?? null;
      if (!s.chosenSocket) {
        s.allocated = new Map();
        s.locked = new Map();
      }
      return s;
    });
  }

  function setCompareMode(on: boolean) {
    treeStore.update((s) => ({ ...s, compareMode: on }));
  }
</script>

<div class="flex items-baseline justify-between mb-1.5">
  <span class="text-xs font-medium text-ink-muted">{picked.length > 1 ? `Sockets (${picked.length})` : "Socket"}</span>
  <label class="flex items-center gap-1.5 text-xs text-ink-muted cursor-pointer" title="While on, clicking a socket adds or removes it instead of replacing">
    <input
      type="checkbox"
      aria-label="Compare sockets"
      class="w-3.5 h-3.5 accent-[var(--color-gold)] cursor-pointer"
      checked={!!$treeStore.compareMode}
      onchange={(e) => setCompareMode((e.target as HTMLInputElement).checked)}
    />
    Compare sockets
  </label>
</div>

{#if picked.length === 1}
  <div class="text-sm text-ink">Near {nameOf(picked[0])}</div>
{:else}
  <ul class="rounded-md border border-line divide-y divide-line">
    {#each picked as socket (socket.skill)}
      {@const active = socket.skill === $treeStore.chosenSocket?.skill}
      <li class="flex items-center gap-2 pl-3 pr-1 py-1">
        <span class="w-1.5 h-1.5 rounded-full {active ? 'bg-gold' : 'bg-line-strong'}" title={active ? "Shown on the tree" : undefined} aria-hidden="true"></span>
        <span class="flex-1 text-sm text-ink truncate">Near {nameOf(socket)}</span>
        <button
          onclick={() => removeSocket(socket)}
          aria-label="Remove socket near {nameOf(socket)}"
          class="w-7 h-7 grid place-items-center rounded text-ink-faint hover:text-ink hover:bg-hover cursor-pointer transition-colors"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </li>
    {/each}
  </ul>
{/if}
<div class="mt-1 text-xs text-ink-faint">
  {#if $treeStore.compareMode}
    Click sockets on the tree to add or remove them.
  {:else}
    Shift+click other sockets to compare them. Click a socket to start over.
  {/if}
</div>
