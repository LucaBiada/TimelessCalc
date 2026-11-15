<script lang="ts">
  interface Props {
    onclose: () => void;
  }

  let { onclose }: Props = $props();

  let activeTab = $state<"search" | "favorites" | "share" | "seed">("search");

  function setTab(tab: "search" | "favorites" | "share" | "seed") {
    activeTab = tab;
  }

  const tabs: { id: "search" | "favorites" | "share" | "seed"; label: string }[] = [
    { id: "search", label: "How it works" },
    { id: "favorites", label: "Favorites and history" },
    { id: "share", label: "Share and trade" },
    { id: "seed", label: "Compare sockets" },
  ];
</script>

<svelte:window onkeydown={(e) => e.key === "Escape" && onclose()} />

<div
  class="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4"
  onclick={onclose}
  role="button"
  tabindex="0"
  onkeydown={(e) => e.key === "Escape" && onclose()}
>
  <div
    class="bg-panel border border-line rounded-lg w-full max-w-3xl flex flex-col max-h-[85vh]"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => (e.key === "Enter" || e.key === " ") && e.stopPropagation()}
    role="dialog"
    aria-modal="true"
    aria-labelledby="help-title"
    tabindex="-1"
  >
    <div class="px-5 pt-4 border-b border-line shrink-0">
      <div class="flex items-center justify-between mb-2">
        <h2 id="help-title" class="text-base font-semibold text-ink">Help</h2>
        <button
          type="button"
          onclick={onclose}
          class="w-8 h-8 grid place-items-center rounded-md text-ink-muted hover:text-ink hover:bg-hover cursor-pointer transition-colors"
          aria-label="Close"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="flex flex-wrap gap-1" role="tablist">
        {#each tabs as tab (tab.id)}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            class="px-3 py-2 -mb-px border-b-2 text-sm whitespace-nowrap cursor-pointer transition-colors {activeTab === tab.id
              ? 'border-gold text-ink font-medium'
              : 'border-transparent text-ink-muted hover:text-ink'}"
            onclick={() => setTab(tab.id)}
          >
            {tab.label}
          </button>
        {/each}
      </div>
    </div>

    <div class="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 text-sm text-ink-muted leading-relaxed space-y-6">
      {#if activeTab === "search"}
        <section>
          <h3 class="text-sm font-semibold text-ink mb-2">Find a jewel in five steps</h3>
          <ol class="list-decimal pl-5 space-y-1.5">
            <li><strong class="text-ink font-medium">Click a jewel socket</strong> on the passive tree.</li>
            <li><strong class="text-ink font-medium">Choose the nodes to count.</strong> Use All, Notables or Small to select every node of that kind in the radius, or click nodes one by one. Only selected nodes are scored.</li>
            <li><strong class="text-ink font-medium">Pick the jewel.</strong> Conqueror defaults to Any; change it only if you need a specific keystone.</li>
            <li><strong class="text-ink font-medium">Enter your seed</strong> to see what it does, <strong class="text-ink font-medium">or find seeds by stats</strong> to search every seed for the stats you want.</li>
            <li>Click a result to preview it on the tree.</li>
          </ol>
        </section>

        <section>
          <h3 class="text-sm font-semibold text-ink mb-2">Stat search settings</h3>
          <dl class="space-y-2">
            <div><dt class="text-ink font-medium inline">Weight.</dt> <dd class="inline">How much a stat counts toward a seed's score. Default 1.</dd></div>
            <div><dt class="text-ink font-medium inline">Min. nodes / Min. value.</dt> <dd class="inline">Seeds with fewer nodes (or a lower total) for this stat are left out.</dd></div>
            <div><dt class="text-ink font-medium inline">Exclude.</dt> <dd class="inline">Leaves out every seed that has this stat. Use it for stats that would break your build.</dd></div>
            <div><dt class="text-ink font-medium inline">Minimum total score.</dt> <dd class="inline">Seeds with a lower total score are left out.</dd></div>
            <div><dt class="text-ink font-medium inline">Rank seeds by (Glorious Vanity).</dt> <dd class="inline">Number of nodes counts the nodes that get the stat; Total value adds up the stat's values.</dd></div>
          </dl>
        </section>

        <section class="rounded-md border border-line bg-raised px-4 py-3">
          <h3 class="text-sm font-semibold text-ink mb-2">How scoring works</h3>
          <p>Searching for %Strength (weight 5) and maximum Fortification (weight 1):</p>
          <ul class="mt-2 space-y-1">
            <li>Seed A: Strength on 2 nodes, Fortification on 1. Score 2 × 5 + 1 × 1 = <strong class="text-ink">11</strong>.</li>
            <li>Seed B: Strength on 1 node, Fortification on 3. Score 1 × 5 + 3 × 1 = <strong class="text-ink">8</strong>.</li>
          </ul>
          <p class="mt-2 text-xs text-ink-faint">Seed A ranks higher even though it affects fewer nodes.</p>
        </section>

        <section>
          <h3 class="text-sm font-semibold text-ink mb-2">Locking nodes</h3>
          <p><kbd class="px-1.5 py-0.5 rounded bg-raised border border-line text-xs font-mono text-ink">Ctrl</kbd> + click a selected node to lock it; do it again to unlock. Results then only include seeds where every locked node gets at least one of your stats. There is no limit on locked nodes.</p>
          <p class="mt-2">Example: with Elegant Hubris small nodes give nothing, so any notable at the right distance works. Lock the notable whose mastery you want, and only seeds that give it a searched stat are returned.</p>
        </section>
      {:else if activeTab === "favorites"}
        <section>
          <h3 class="text-sm font-semibold text-ink mb-2">Favorites</h3>
          <p>After a search, choose Save favorite and give it a name (a suggestion is filled in). From the Favorites tab you can load, rename, delete or copy a link to any favorite.</p>
        </section>
        <section>
          <h3 class="text-sm font-semibold text-ink mb-2">History</h3>
          <p>Your last 10 stat searches are saved automatically. Load or delete them from the History tab.</p>
        </section>
        <section class="rounded-md border border-line bg-raised px-4 py-3">
          <h3 class="text-sm font-semibold text-ink mb-2">Your data stays on your device</h3>
          <p>Favorites and history are stored in your browser only. Nothing is sent to a server.</p>
        </section>
      {:else if activeTab === "share"}
        <section>
          <h3 class="text-sm font-semibold text-ink mb-2">Share</h3>
          <p>Copy link puts your current setup into a URL. Anyone who opens it gets the same setup. Favorites can be shared the same way.</p>
          <p class="mt-2">A link includes the jewel and conqueror, the socket, selected and locked nodes, stats with their weights, minimums and excludes, and search settings.</p>
        </section>
        <section>
          <h3 class="text-sm font-semibold text-ink mb-2">Path of Building</h3>
          <p>Copy for Path of Building puts the jewel on your clipboard so you can paste it into your build.</p>
        </section>
        <section>
          <h3 class="text-sm font-semibold text-ink mb-2">Trade</h3>
          <p>From the results, open a trade search for a seed or a whole group. Large groups are split into pages automatically.</p>
        </section>
      {:else if activeTab === "seed"}
        <section>
          <h3 class="text-sm font-semibold text-ink mb-2">See one seed in every socket</h3>
          <p>After entering a seed, click Compare this seed on all sockets. It shows what the seed does in every jewel socket on the tree, regardless of which nodes you selected. Use it to pick the best socket for a jewel you already own.</p>
        </section>
        <section>
          <h3 class="text-sm font-semibold text-ink mb-2">Paste a jewel</h3>
          <p>Copy a timeless jewel in game (<kbd class="px-1.5 py-0.5 rounded bg-raised border border-line text-xs font-mono text-ink">Ctrl+C</kbd> on its tooltip), then press <kbd class="px-1.5 py-0.5 rounded bg-raised border border-line text-xs font-mono text-ink">Ctrl+V</kbd> anywhere in the app. The comparison opens with the seed and jewel filled in. Inside the comparison, the paste button in the seed field does the same.</p>
        </section>
        <section>
          <h3 class="text-sm font-semibold text-ink mb-2">Reading the results</h3>
          <p>Each card is one socket, named after its nearest keystone. The number is how many nodes get the stat. Brighter rows replace a node's stats; dimmer rows add to them. Cluster jewel sockets are labelled; timeless jewels are rarely used there.</p>
        </section>
      {/if}
    </div>
  </div>
</div>
