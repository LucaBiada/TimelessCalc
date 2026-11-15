<script lang="ts">
  interface Props {
    mode: "seed" | "stats" | null;
    disabled?: boolean;
    seedDisabled?: boolean;
    onselectmode: (mode: "seed" | "stats") => void;
  }

  let { mode, disabled = false, seedDisabled = false, onselectmode }: Props = $props();

  const options = [
    { id: "seed", label: "I have a seed" },
    { id: "stats", label: "Find seeds by stats" },
  ] as const;
</script>

<div class="text-xs font-medium text-ink-muted mb-2">What do you want to do?</div>
<div class="grid grid-cols-2 gap-1 p-1 rounded-md bg-raised border border-line" role="radiogroup">
  {#each options as option (option.id)}
    {@const off = disabled || (seedDisabled && option.id === "seed")}
    <button
      type="button"
      role="radio"
      aria-checked={mode === option.id}
      onclick={() => onselectmode(option.id)}
      disabled={off}
      title={seedDisabled && option.id === "seed" ? "Pick a single jewel to enter a seed" : undefined}
      class="py-1.5 px-2 rounded text-sm transition-colors {off
        ? 'cursor-not-allowed opacity-40'
        : 'cursor-pointer'} {mode === option.id
        ? 'bg-hover text-ink font-medium shadow-[inset_0_-2px_0_var(--color-gold)]'
        : 'text-ink-muted hover:text-ink'}"
    >
      {option.label}
    </button>
  {/each}
</div>
