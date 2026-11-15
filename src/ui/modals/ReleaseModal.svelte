<script lang="ts">
  /* global localStorage */
  import { fade, scale } from "svelte/transition";
  import { onMount } from "svelte";

  interface Feature {
    name: string;
    description: string;
    mediaUrl?: string;
  }

  interface ReleaseData {
    version: string;
    title: string;
    date: string;
    features: Feature[];
  }

  interface Props {
    releaseData: ReleaseData;
  }

  let { releaseData }: Props = $props();
  let visible = $state(false);

  onMount(() => {
    const lastSeen = localStorage.getItem("last_seen_version");
    if (lastSeen !== releaseData.version) {
      localStorage.setItem("last_seen_version", releaseData.version);
      visible = true;
    }
  });

  function close() {
    visible = false;
  }
</script>

<svelte:window onkeydown={(e) => e.key === "Escape" && close()} />

{#if visible}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4"
    transition:fade={{ duration: 150 }}
    onclick={close}
    onkeydown={(e) => e.key === "Escape" && close()}
  >
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      class="bg-panel border border-line rounded-lg w-full max-w-2xl flex flex-col max-h-[80vh]"
      transition:scale={{ duration: 150, start: 0.97 }}
      onclick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="release-title"
      tabindex="-1"
    >
      <div class="px-5 py-4 border-b border-line flex items-start justify-between gap-3 shrink-0">
        <div>
          <h2 id="release-title" class="text-base font-semibold text-ink">{releaseData.title}</h2>
          <p class="text-xs text-ink-faint mt-0.5">Version {releaseData.version}, {releaseData.date}</p>
        </div>
        <button
        type="button"
        onclick={close}
        class="w-8 h-8 grid place-items-center rounded-md text-ink-muted hover:text-ink hover:bg-hover cursor-pointer transition-colors"
        aria-label="Close"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      </div>

      <div class="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-5">
        {#each releaseData.features as feature (feature.name)}
          <section>
            <h3 class="text-sm font-semibold text-ink">{feature.name}</h3>
            <p class="text-sm text-ink-muted leading-relaxed mt-1">{@html feature.description}</p>
            {#if feature.mediaUrl}
              <img
                src={feature.mediaUrl}
                alt={feature.name}
                class="mt-3 rounded-md border border-line"
                loading="lazy"
              />
            {/if}
          </section>
        {/each}
      </div>

      <div class="px-5 py-3 border-t border-line flex justify-end gap-2 shrink-0">
        <button type="button" onclick={close} class="py-2 px-4 bg-gold hover:bg-gold-strong text-on-gold rounded-md text-sm font-semibold cursor-pointer transition-colors">Got it</button>
      </div>
    </div>
  </div>
{/if}
