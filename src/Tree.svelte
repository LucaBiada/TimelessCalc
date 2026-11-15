<script lang="ts">
import { onMount } from "svelte";
import Sidebar from "$lib/ui/sidebar/Sidebar.svelte";
import Tooltip from "$lib/ui/common/Tooltip.svelte";
import Preloader from "$lib/ui/common/Preloader.svelte";
import DebugPanel from "$lib/ui/debug/DebugPanel.svelte";
import JewelLoadErrorModal from "$lib/ui/modals/JewelLoadErrorModal.svelte";
import HelpModal from "$lib/ui/modals/HelpModal.svelte";
import SeedSearchModal from "$lib/ui/modals/SeedSearchModal.svelte";
import { seedAnalyzerRequest } from "$lib/stores/seedAnalyzerStore";
import TreeCanvas from "$lib/TreeCanvas.svelte";
import { treeStore } from "$lib/stores/treeStore";
import { searchStore, clearJewelLoadError, initDefaultLeague } from "$lib/stores/searchStore";
import { mouseStore } from "$lib/stores/mouseStore";
import { parseUrlAndInitialize } from "$lib/utils/sharing/urlParser";
import { parseClipboard } from "$lib/utils/clipboard/clipboardParser";
import { translations } from "$lib/providers/translations";
import { handleSearch as performSearch } from "$lib/utils/sidebar/searchLogic";
import { perfMonitor } from "$lib/utils/performanceMonitor";
import { canvas } from "$lib/canvas/canvasContext";
import { fetchLeagues } from "./providers/leagues";
import Notification from "$lib/ui/notifications/Notification.svelte";
import TradeNotification from "$lib/ui/notifications/TradeNotification.svelte";
import type { SeedSearchResults } from "$lib/types";
    import ReleaseModal from "./ui/modals/ReleaseModal.svelte";

let isLoading = $state(true);
let loadingComplete = $state(false);
let debugMode = $state(false);
let renderDuration = $state(0);
let showHelp = $state(false);
let showSeedSearch = $state(false);
let triggerPaste = $state(false);
let _seedSearchResults = $state<SeedSearchResults | null>(null);

	onMount(async () => {
		try {
			perfMonitor.mark("init-start");

			loadingComplete = true;

			await initDefaultLeague();
			fetchLeagues();
			await parseUrlAndInitialize(
			canvas.treeData,
			null,
			performSearch,
			translations,
		);

		perfMonitor.mark("init-end");
		perfMonitor.measure("total-init", "init-start", "init-end");
	} catch (e) {
		console.error("Error during initialization:", e);
		loadingComplete = true;
		isLoading = false;
	}
});

onMount(() => {
	const handleKeydown = async (e: KeyboardEvent) => {
		if (e.ctrlKey && e.altKey && e.key === "f") {
			e.preventDefault();
			debugMode = !debugMode;
		}

		if (e.ctrlKey && e.key === "v") {
			const activeTag = document.activeElement?.tagName.toLowerCase();
			if (activeTag !== "input" && activeTag !== "textarea") {
				e.preventDefault();
				try {
					const text = await navigator.clipboard.readText();
					if (text && parseClipboard(text)) {
						showSeedSearch = true;
						triggerPaste = true;
					}
				} catch {
					// clipboard read failed, do nothing
				}
			}
		}
	};
	window.addEventListener("keydown", handleKeydown);

	return () => {
		window.removeEventListener("keydown", handleKeydown);
	};
});

$effect(() => {
	if (loadingComplete) {
		const timeoutId = setTimeout(() => {
			isLoading = false;
		}, 50);
		return () => clearTimeout(timeoutId);
	}
});

$effect(() => {
	if ($seedAnalyzerRequest) showSeedSearch = true;
});

function handleErrorClose() {
	searchStore.update((s) => ({ ...s, jewelType: null }));
	clearJewelLoadError();
}

function handleRenderDuration(duration: number) {
	renderDuration = duration;
}
</script>

 {#if isLoading}
  <Preloader {loadingComplete} progress={loadingComplete ? 100 : 0} />
 {/if}

<DebugPanel isVisible={debugMode} {renderDuration} />

<TreeCanvas onRender={handleRenderDuration} />

<Tooltip node={$treeStore.hovered} x={$mouseStore.x} y={$mouseStore.y} />
<Sidebar onhelp={() => (showHelp = true)} />

{#if $searchStore.jewelLoadError}
  <JewelLoadErrorModal
    jewel={$searchStore.jewelLoadError.jewel}
    errorMessage={$searchStore.jewelLoadError.message}
    onclose={handleErrorClose}
  />
{/if}

{#if $searchStore.lastTradeInfo}
  <TradeNotification
    seeds={$searchStore.lastTradeInfo.seeds}
    conquerorLabel={$searchStore.lastTradeInfo.conquerorLabel}
    page={$searchStore.lastTradeInfo.page}
    groupName={$searchStore.lastTradeInfo.groupName}
    onDismiss={() => searchStore.update((s) => ({ ...s, lastTradeInfo: null }))}
  />
{/if}

<Notification />

{#if showHelp}
  <HelpModal onclose={() => showHelp = false} />
{/if}

{#if showSeedSearch}
  <SeedSearchModal
    onclose={() => { showSeedSearch = false; triggerPaste = false; seedAnalyzerRequest.set(null); }}
    initial={$seedAnalyzerRequest}
    triggerPaste={triggerPaste}
    onresults={(results) => _seedSearchResults = results}
  />
{/if}

<ReleaseModal releaseData={{
  version: "1.2.0",
  title: "Update with 3.30 tree",
  date: "November 15, 2026",
  features: [
    {
      name: "3.30 data",
      description: "Tree, jewel seeds and stat texts regenerated from 3.30.0.2. Heroic Tragedy: two notables changed values."
    },
    {
      name: "Fixes",
      description: "Lethal Pride <strong>+Strength</strong> and Brutal Restraint <strong>+Dexterity</strong> no longer show as unknown stats.<br/>The <strong>Analyze Seed</strong> dialog now uses the current tree and stat texts."
    }
  ]
}} />


<style>
  :global(body) {
    margin: 0;
    overflow: hidden;
  }
</style>
