<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";

  interface Props {
    variant?: "primary" | "secondary";
    onclick?: HTMLButtonAttributes["onclick"];
    children: Snippet;
  }

  let { variant = "primary", onclick, children }: Props = $props();

  const classes =
    variant === "primary"
      ? "border-line text-ink hover:bg-hover hover:border-line-strong"
      : "border-transparent text-ink-muted hover:text-ink hover:bg-hover";
</script>

<button
  type="button"
  {onclick}
  class="px-2 py-1 rounded border text-xs font-medium cursor-pointer transition-colors {classes}"
>
  {@render children()}
</button>
