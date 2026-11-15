<script lang="ts">
  import { favoritesStore, favoritesActions } from "$lib/stores/favoritesStore";
  import {
    generateShareUrlFromData,
    copyToClipboard,
  } from "$lib/utils/sharing/shareUtils";
  import Modal from "$lib/ui/common/Modal.svelte";
  import { showNotification } from "$lib/stores/notificationStore";
  import type { FavoriteEntry } from "$lib/types";
  import { translations } from "$lib/providers/translations";
  import { loadEntry as loadEntryUtil } from "$lib/utils/entryLoader";
  import {
    formatDate,
    formatStats,
    formatExcludedStats,
  } from "$lib/utils/formatters";

  let { onswitchtotab } = $props<{
    onswitchtotab: (tab: "search" | "favorites" | "history") => void;
  }>();

  let showConfirmModal = $state(false);
  let pendingLoadEntry: FavoriteEntry | null = $state(null);
  let editingId: string | null = $state(null);
  let editValue = $state("");
  let editInput: HTMLInputElement | null = $state(null);

  function handleLoadEntry(entry: FavoriteEntry) {
    if (favoritesActions.hasCurrentConfiguration()) {
      pendingLoadEntry = entry;
      showConfirmModal = true;
    } else {
      loadEntryUtil({
        entry,
        loadAction: (e) => favoritesActions.loadFavorite(e),
        translation: translations,
        onSwitchToTab: () => onswitchtotab("search"),
      });
    }
  }

  async function confirmLoad() {
    if (pendingLoadEntry) {
      await loadEntryUtil({
        entry: pendingLoadEntry,
        loadAction: (e) => favoritesActions.loadFavorite(e),
        translation: translations,
        onSwitchToTab: () => onswitchtotab("search"),
      });
      showConfirmModal = false;
      pendingLoadEntry = null;
    }
  }

  function startEdit(id: string, currentName: string) {
    editingId = id;
    editValue = currentName;
  }

  function saveEdit() {
    if (editingId) {
      favoritesActions.updateName(editingId, editValue);
      editingId = null;
      editInput = null;
    }
  }

  function cancelEdit() {
    editingId = null;
    editInput = null;
  }

  function handleEditKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      saveEdit();
    } else if (event.key === "Escape") {
      cancelEdit();
    }
  }

  async function handleShare(entry: FavoriteEntry) {
    const shareUrl = generateShareUrlFromData(
      entry.jewelType,
      entry.conqueror,
      entry.stats,
      entry.socket,
      entry.allocatedSkillIds.map((i) => Number(i)),
      entry.minTotalWeight,
      entry.statSearchMode || null,
      null,
      null,
      (entry.lockedSkillIds || []).map((i) => Number(i)),
    );
    const success = await copyToClipboard(shareUrl);
    if (success) {
      showNotification("share", "Link copied");
    }
  }

  $effect(() => {
    if (editingId && editInput) {
      editInput.focus();
      editInput.select();
    }
  });
</script>

{#if $favoritesStore.length === 0}
  <div class="rounded-md border border-dashed border-line px-4 py-6 text-center">
    <p class="text-sm text-ink-muted">No favorites yet.</p>
    <p class="text-xs text-ink-faint mt-1">Run a search, then choose Save favorite to keep it here.</p>
  </div>
{:else}
  <ul class="rounded-md border border-line divide-y divide-line">
    {#each $favoritesStore as entry (entry.id)}
      <li class="px-3 py-2 hover:bg-hover">
        <div class="flex items-start gap-2">
          <div class="flex-1 min-w-0">
            {#if editingId === entry.id}
              <input
                bind:this={editInput}
                bind:value={editValue}
                aria-label="Favorite name"
                class="w-full px-2 py-1 rounded-md bg-raised border border-line text-sm text-ink placeholder-ink-faint focus:border-gold transition-colors"
                onkeydown={handleEditKeydown}
                onblur={saveEdit}
              />
            {:else}
              <button
                type="button"
                onclick={() => startEdit(entry.id, entry.name)}
                class="group flex items-center gap-1.5 max-w-full text-left text-sm font-medium text-ink cursor-pointer"
                title="Rename"
                aria-label="Rename {entry.name}"
              >
                <span class="truncate">{entry.name}</span>
                <svg class="w-3.5 h-3.5 shrink-0 text-ink-faint group-hover:text-ink transition-colors" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            {/if}
            <p class="text-xs text-ink-muted">
              {entry.jewelType.label}, {entry.conqueror?.label || "any conqueror"}
            </p>
            <p class="text-xs text-ink-muted mt-1">{formatStats(entry.stats)}</p>
            {#if formatExcludedStats(entry.stats)}
              <p class="text-xs text-danger">{formatExcludedStats(entry.stats)}</p>
            {/if}
            <p class="text-xs text-ink-faint mt-1">
              {entry.allocatedSkillIds?.length || 0} nodes, min weight {entry.minTotalWeight}. Saved {formatDate(entry.timestamp)}
            </p>
          </div>

          <div class="flex items-center gap-1 shrink-0">
            <button
              onclick={() => handleShare(entry)}
              class="w-8 h-8 grid place-items-center rounded-md text-ink-muted hover:text-ink hover:bg-hover cursor-pointer transition-colors"
              aria-label="Copy link"
              title="Copy link"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
            </button>
            <button
              onclick={() => favoritesActions.deleteFavorite(entry.id)}
              class="w-8 h-8 grid place-items-center rounded-md text-ink-muted hover:text-danger hover:bg-hover cursor-pointer transition-colors"
              aria-label="Delete favorite"
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
    message="Loading this favorite will replace your current configuration. Continue?"
    onConfirm={confirmLoad}
    onCancel={() => {
      showConfirmModal = false;
      pendingLoadEntry = null;
    }}
  />
{/if}
