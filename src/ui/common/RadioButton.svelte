<script lang="ts">
  interface Props {
    _value: unknown;
    label: string;
    isSelected: boolean;
    onclick: () => void;
    size?: "sm" | "md" | "lg";
    hint?: string;
  }

  let { _value, label, isSelected, onclick, size = "md", hint }: Props = $props();

  const sizeClasses =
    size === "lg" ? "px-3 py-2.5 text-sm" : size === "sm" ? "px-2 py-1.5 text-[13px]" : "px-3 py-2 text-sm";
</script>

<button
  type="button"
  {onclick}
  aria-pressed={isSelected}
  title={hint}
  class="w-full h-full {sizeClasses} leading-tight cursor-pointer rounded-md border text-center transition-colors {isSelected
    ? 'border-gold bg-gold-soft text-ink font-medium'
    : 'border-line bg-raised text-ink-muted hover:text-ink hover:border-line-strong'}"
>
  {label}
</button>
