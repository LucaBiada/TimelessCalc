<script lang="ts">
  import { fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import { SvelteMap } from "svelte/reactivity";
  import {
    hideNotification,
    notificationStore,
  } from "$lib/stores/notificationStore";

  let timeouts = new SvelteMap<number, number>();

  $effect(() => {
    const currentIds = new Set($notificationStore.map((n) => n.id));

    // Clear timeouts for removed notifications
    for (const [id, timeoutId] of timeouts) {
      if (!currentIds.has(id)) {
        clearTimeout(timeoutId);
        timeouts.delete(id);
      }
    }

    // Set timeouts for new notifications
    for (const notification of $notificationStore) {
      if (!timeouts.has(notification.id)) {
        const timeoutId = setTimeout(() => {
          hideNotification(notification.id);
        }, notification.timeout);
        timeouts.set(notification.id, timeoutId);
      }
    }
  });
</script>

{#each $notificationStore as notification, index (notification.id)}
  <div
    class="fixed right-4 z-50 max-w-xs flex items-center gap-2.5 pl-3 pr-1 py-1.5 bg-raised border border-line-strong rounded-md text-sm text-ink shadow-lg"
    style="bottom: {1 + index * 3.5}rem"
    role={notification.type === "error" ? "alert" : "status"}
    transition:fly={{ x: 320, duration: 300, easing: cubicOut }}
  >
    <svg
      class="w-4 h-4 shrink-0 {notification.type === 'error' ? 'text-danger' : 'text-ink-muted'}"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      {#if notification.type === "favorite"}
        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      {:else if notification.type === "export"}
        <path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
      {:else if notification.type === "error"}
        <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      {:else}
        <path d="M5 13l4 4L19 7" />
      {/if}
    </svg>
    <span class="py-1">{notification.text}</span>
    <button
      onclick={() => hideNotification(notification.id)}
      class="ml-auto w-8 h-8 shrink-0 grid place-items-center rounded-md text-ink-muted hover:text-ink hover:bg-hover cursor-pointer transition-colors"
      aria-label="Dismiss"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
{/each}
