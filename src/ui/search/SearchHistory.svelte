<script lang="ts">
  import type { SearchHistoryEntry, Node, TreeData } from "$lib/types";
  import { historyStore, historyActions } from "$lib/stores/historyStore";
  import { canvas } from "$lib/canvas/canvasContext";
  import Modal from "$lib/ui/common/Modal.svelte";
  import { translations } from "$lib/providers/translations";
  import { loadEntry as loadEntryUtil } from "$lib/utils/entryLoader";
  import {
    formatDate,
    formatStats,
    formatExcludedStats,
    findNearbyKeystone,
  } from "$lib/utils/formatters";

  let {
    onswitchtotab,
  }: { onswitchtotab: (tab: "search" | "favorites" | "history") => void } =
    $props();

  const treeNodes: Record<string, Node> = canvas.treeData.nodes;
  const treeData: TreeData = canvas.treeData;

  let showConfirmModal = $state(false);
  let pendingLoadEntry: SearchHistoryEntry | null = $state(null);

  function handleLoadEntry(entry: SearchHistoryEntry) {
    if (historyActions.hasCurrentConfiguration()) {
      pendingLoadEntry = entry;
      showConfirmModal = true;
    } else {
      loadEntryUtil({
        entry,
        loadAction: (e) => historyActions.loadSearch(e),
        translation: translations,
        onSwitchToTab: () => onswitchtotab("search"),
      });
    }
  }

  async function confirmLoad() {
    if (pendingLoadEntry) {
      await loadEntryUtil({
        entry: pendingLoadEntry,
        loadAction: (e) => historyActions.loadSearch(e),
        translation: translations,
        onSwitchToTab: () => onswitchtotab("search"),
      });
      showConfirmModal = false;
      pendingLoadEntry = null;
    }
  }

  function handleDeleteEntry(entryId: string) {
    historyActions.deleteEntry(entryId);
  }
</script>

{#if $historyStore.length === 0}
  <div class="rounded-md border border-dashed border-line px-4 py-6 text-center">
    <p class="text-sm text-ink-muted">Your stat searches will appear here.</p>
    <p class="text-xs text-ink-faint mt-1">The last 10 are kept automatically.</p>
  </div>
{:else}
  <ul class="rounded-md border border-line divide-y divide-line">
    {#each $historyStore as entry (entry.id)}
      <li class="px-3 py-2 hover:bg-hover">
        <div class="flex items-start gap-2">
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-ink truncate">
              {findNearbyKeystone(entry.socket, treeNodes, treeData)}
            </p>
            <p class="text-xs text-ink-muted truncate">
              {entry.jewelType.label}, {entry.conqueror?.label || "any conqueror"}
            </p>
            <p class="text-xs text-ink-muted mt-1">{formatStats(entry.stats)}</p>
            {#if formatExcludedStats(entry.stats)}
              <p class="text-xs text-danger">{formatExcludedStats(entry.stats)}</p>
            {/if}
            <p class="text-xs text-ink-faint mt-1">
              {entry.allocatedSkillIds?.length || 0} nodes, min weight {entry.minTotalWeight}. {formatDate(entry.timestamp)}
            </p>
          </div>

          <div class="flex items-center gap-1 shrink-0">
            <button
              onclick={() => handleDeleteEntry(entry.id)}
              class="w-8 h-8 grid place-items-center rounded-md text-ink-muted hover:text-danger hover:bg-hover cursor-pointer transition-colors"
              aria-label="Delete search"
              title="Delete"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
            <button onclick={() => handleLoadEntry(entry)} class="py-1.5 px-3 rounded-md border border-line text-sm text-ink hover:bg-hover hover:border-line-strong cursor-pointer transition-colors">
              Load
            </button>
          </div>
        </div>
      </li>
    {/each}
  </ul>
{/if}

{#if showConfirmModal}
  <Modal
    message="Loading this search will replace your current configuration. Continue?"
    onConfirm={confirmLoad}
    onCancel={() => {
      showConfirmModal = false;
      pendingLoadEntry = null;
    }}
  />
{/if}
