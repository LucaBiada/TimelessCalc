<script lang="ts">
  import { onMount } from "svelte";
  import { jewelTypes } from "$lib/constants/timeless";
  import type { JewelType, SeedSearchResults, SocketResult, StatModification } from "$lib/types";
  import RadioButton from "$lib/ui/common/RadioButton.svelte";
  import { calculateSeed } from "$lib/utils/Timeless/calculator";
  import { canvas } from "$lib/canvas/canvasContext";
  import { parseClipboard } from "$lib/utils/clipboard/clipboardParser";
  import { findNearbyKeystone } from "$lib/utils/formatters";
  import { formatStatTranslation } from "$lib/utils/sidebar/sidebarUtils";
  import { translations } from "$lib/providers/translations";

  interface Props {
    onclose: () => void;
    onresults: (results: SeedSearchResults) => void;
    triggerPaste: boolean;
    initial?: { seed: number; jewelType: JewelType } | null;
  }

  let { onclose, onresults, triggerPaste = false, initial = null }: Props = $props();

  let seedInput = $state(initial ? String(initial.seed) : "");
  // jewelTypes entries are compared by identity in the radio group, so map back to the constant.
  let selectedJewelType = $state<JewelType | null>(
    initial ? (jewelTypes.find((j) => j.name === initial.jewelType.name) ?? null) : null,
  );
  let results = $state<Record<string, SocketResult> | null>(null);
  let error = $state<string | null>(null);
  let searchTimeout: number | null = $state(null);

  function handleInput() {
    if (searchTimeout) window.clearTimeout(searchTimeout);
    searchTimeout = window.setTimeout(() => {
      analyzeSeed();
    }, 50);
  }

  onMount(async () => {
    if (initial) analyzeSeed();
    try {
      if (triggerPaste) {
        const text = await navigator.clipboard.readText();
        if (text) {
          const parsed = parseClipboard(text);
          if (parsed) {
            seedInput = parsed.seed.toString();
            if (parsed.jewelType) {
              selectedJewelType = parsed.jewelType;
            }
            analyzeSeed();
          }
        }
      }
    } catch {
      silentlyIgnore();
    }
  });

  async function parseClipboardAndFill() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const parsed = parseClipboard(text);
        if (parsed) {
          seedInput = parsed.seed.toString();
          if (parsed.jewelType) {
            selectedJewelType = parsed.jewelType;
          }
          analyzeSeed();
        }
      }
    } catch {
      silentlyIgnore();
    }
  }

  function silentlyIgnore() {
    return;
  }

  async function analyzeSeed() {
    const seed = parseInt(seedInput, 10);
    if (isNaN(seed)) {
      error = "Enter a seed number.";
      return;
    }

    if (!selectedJewelType) {
      error = "Choose a jewel type.";
      return;
    }
    if (
      isNaN(seed) ||
      !selectedJewelType ||
      seed < selectedJewelType.min ||
      seed > selectedJewelType.max
    ) {
      return;
    }

    error = null;

    try {
      const modifications = await calculateSeed(seed, selectedJewelType.id);
      const socketResults: Record<string, SocketResult> = {};

      if (modifications) {
        for (const [socketId, socketMod] of Object.entries(modifications)) {
          try {
            const replacementsMap: Map<number, StatModification> = new Map();
            const additionsMap: Map<number, StatModification> = new Map();

            for (const [key, nodeIds] of Object.entries(socketMod.r)) {
              if (nodeIds && nodeIds.length > 0) {
                const { rid, stats } = parseKey(key);
                const existing = replacementsMap.get(rid);
                if (existing) {
                  for (const [statId, value] of Object.entries(stats)) {
                    existing.statValues[statId] = (existing.statValues[statId] || 0) + value;
                  }
                  existing.nodeIds.push(...nodeIds);
                  existing.occurrenceCount += nodeIds.length;
                  existing.statLabel = getStatLabel(existing.statValues);
                } else {
                  const statValues = { ...stats };
                  if (Object.entries(statValues).length > 0) {
                      replacementsMap.set(rid, {
                          statKey: rid,
                          statValues,
                          statLabel: getStatLabel(statValues),
                          nodeIds: [...nodeIds],
                          occurrenceCount: nodeIds.length
                      });
                  }
                }
              }
            }

            for (const [key, nodeIds] of Object.entries(socketMod.a)) {
              if (nodeIds && nodeIds.length > 0) {
                const { rid, stats } = parseKey(key);
                const existing = additionsMap.get(rid);
                if (existing) {
                  for (const [statId, value] of Object.entries(stats)) {
                    existing.statValues[statId] = (existing.statValues[statId] || 0) + value;
                  }
                  existing.nodeIds.push(...nodeIds);
                  existing.occurrenceCount += nodeIds.length;
                  existing.statLabel = getStatLabel(existing.statValues);
                } else {
                  const statValues = { ...stats };
                  additionsMap.set(rid, {
                    statKey: rid,
                    statValues,
                    statLabel: getStatLabel(statValues),
                    nodeIds: [...nodeIds],
                    occurrenceCount: nodeIds.length
                  });
                }
              }
            }

            const replacements: StatModification[] = Array.from(replacementsMap.values());
            const additions: StatModification[] = Array.from(additionsMap.values());

            replacements.sort((a, b) => b.occurrenceCount - a.occurrenceCount);
            additions.sort((a, b) => b.occurrenceCount - a.occurrenceCount);

            socketResults[socketId] = {
              socketId,
              replacements,
              additions
            };
          } catch {
            silentlyIgnore();
          }
        }
      }

      results = socketResults;

      const seedResults: SeedSearchResults = {
        seed,
        jewelType: selectedJewelType,
        socketResults
      };

      onresults(seedResults);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      error = `Couldn't analyze this seed: ${errorMessage}`;
    }
  }

  function parseKey(key: string): { rid: number; stats: Record<string, number> } {
    const dashIndex = key.indexOf("-");
    const rid = parseInt(key.slice(0, dashIndex), 10);
    const stats = JSON.parse(key.slice(dashIndex + 1));
    return { rid, stats };
  }

  function getStatLabel(statValues: Record<string, number>): string {
    const labels = Object.entries(statValues)
      .map(([statId, value]) => formatStatTranslation(parseInt(statId), value, translations))
      .filter(Boolean);
    return labels.join(" / ");
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      onclose();
    }
  }

  function handlePaste(e: ClipboardEvent) {
    e.preventDefault();
    const hasClipboardData = 'clipboardData' in e && e.clipboardData !== null;
    if (!hasClipboardData) return;

    const text = e.clipboardData?.getData("text");
    if (text) {
      const parsed = parseClipboard(text);
      if (parsed) {
        seedInput = parsed.seed.toString();
        if (parsed.jewelType) {
          selectedJewelType = parsed.jewelType;
        }
      }
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div
  class="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4"
  role="dialog"
  aria-modal="true"
  aria-labelledby="seed-compare-title"
  tabindex="0"
>
  <div class="bg-panel border border-line rounded-lg w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
    <div class="px-5 py-4 border-b border-line flex items-center justify-between shrink-0">
      <h2 id="seed-compare-title" class="text-base font-semibold text-ink">Compare seed on all sockets</h2>
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

    <div class="px-5 py-4 border-b border-line shrink-0">
      <div class="flex flex-wrap items-start gap-4">
        <div class="flex-1 min-w-[200px] max-w-xs">
          <label for="seed-compare-input" class="text-xs font-medium text-ink-muted mb-1.5 block">Seed</label>
          <div class="relative">
            <input
              id="seed-compare-input"
              type="number"
              bind:value={seedInput}
              oninput={handleInput}
              onpaste={handlePaste}
              class="w-full px-3 py-2 pr-10 rounded-md bg-raised border border-line text-ink placeholder-ink-faint focus:border-gold transition-colors"
              placeholder="Enter seed"
              step="1"
            />
            <button
              type="button"
              onclick={parseClipboardAndFill}
              class="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 grid place-items-center rounded-md text-ink-muted hover:text-ink hover:bg-hover cursor-pointer transition-colors"
              aria-label="Paste jewel from clipboard"
              title="Paste jewel from clipboard (Ctrl+V)"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="8" y="2" width="8" height="4" rx="1" />
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              </svg>
            </button>
          </div>
          <p class="text-xs text-ink-faint mt-1.5">
            {selectedJewelType ? `Valid seeds: ${selectedJewelType.min.toLocaleString()} to ${selectedJewelType.max.toLocaleString()}` : "Choose a jewel type, or paste a copied jewel."}
          </p>
        </div>

        <div class="flex-[2] min-w-[280px]">
          <span class="text-xs font-medium text-ink-muted mb-1.5 block">Jewel</span>
          <div class="grid grid-cols-3 lg:grid-cols-6 gap-2">
            {#each jewelTypes as jewel (jewel.name)}
              <label class="relative cursor-pointer">
                <input
                  type="radio"
                  bind:group={selectedJewelType}
                  value={jewel}
                  class="sr-only"
                />
                <RadioButton
                  _value={jewel}
                  label={jewel.label}
                  isSelected={selectedJewelType?.name === jewel.name}
                  size="md"
                  onclick={() => {
                    selectedJewelType = jewel;
                    analyzeSeed();
                  }}
                />
              </label>
            {/each}
          </div>
        </div>
      </div>

      {#if error}
        <p class="mt-3 px-3 py-2 rounded-md bg-danger-soft border border-danger text-sm text-danger" role="alert">
          {error}
        </p>
      {/if}
    </div>

    {#if results && Object.keys(results).length > 0}
      <div class="flex-1 overflow-y-auto custom-scrollbar px-5 py-4">
        <p class="text-xs text-ink-faint mb-3">
          Each number is how many nodes in that socket's radius get the stat. Brighter rows replace a node's stats; dimmer rows add to them.
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {#each Object.entries(results).sort(([a], [b]) => a.localeCompare(b, undefined, {numeric: true})) as [socketId, socketResult] (socketId)}
            <div class="rounded-md border border-line bg-raised">
              <div class="px-3 py-2 border-b border-line">
                <h4 class="text-sm font-medium text-ink truncate">{findNearbyKeystone(canvas.treeData.nodes[socketId], canvas.treeData.nodes, canvas.treeData)}</h4>
                <p class="text-xs text-ink-faint">
                  Socket {socketId}{#if canvas.treeData.nodes[socketId]?.expansionJewel}, cluster jewel socket{/if}
                </p>
              </div>

              {#if socketResult.replacements.length > 0 || socketResult.additions.length > 0}
                <ul class="py-1">
                  {#each socketResult.replacements as mod (mod.statKey)}
                    <li class="px-3 py-1 flex gap-2 text-sm text-ink hover:bg-hover">
                      <span class="tabular-nums font-medium w-5 shrink-0 text-right">{mod.occurrenceCount}</span>
                      <span>{mod.statLabel}</span>
                    </li>
                  {/each}
                  {#each socketResult.additions as mod (mod.statKey)}
                    <li class="px-3 py-1 flex gap-2 text-sm text-ink-muted hover:bg-hover">
                      <span class="tabular-nums w-5 shrink-0 text-right">{mod.occurrenceCount}</span>
                      <span>{mod.statLabel}</span>
                    </li>
                  {/each}
                </ul>
              {:else}
                <p class="px-3 py-2 text-sm text-ink-faint">No changes in this socket.</p>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {:else if results}
      <div class="flex-1 grid place-items-center text-sm text-ink-muted">
        This seed changes no nodes.
      </div>
    {:else}
      <div class="flex-1 grid place-items-center text-sm text-ink-faint px-5 text-center">
        Enter a seed and choose a jewel to see what it does in every socket.
      </div>
    {/if}
  </div>
</div>
