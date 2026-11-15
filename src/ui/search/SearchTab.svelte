<script lang="ts">
  import { searchStore } from "$lib/stores/searchStore";
  import SearchForm from "$lib/ui/search/SearchForm.svelte";
  import SearchResults from "$lib/ui/search/SearchResults.svelte";
  import AllJewelResults from "$lib/ui/search/AllJewelResults.svelte";

  interface Props {
    ontargetposition?: (pos: { top: number; left: number } | null) => void;
  }

  let { ontargetposition }: Props = $props();
</script>

{#if $searchStore.statsSearched && $searchStore.allJewelResults}
  <AllJewelResults {ontargetposition} />
{:else if $searchStore.statsSearched}
  <SearchResults {ontargetposition} />
{:else}
  <SearchForm />
{/if}
