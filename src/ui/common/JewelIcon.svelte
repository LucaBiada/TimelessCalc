<script lang="ts">
  import { jewelTypes, jewelVisuals } from "$lib/constants/timeless";

  interface Props {
    /** Jewel name, e.g. "karui". */
    name: string;
    size?: number;
    /** Decorative when the jewel name is already written next to it. */
    decorative?: boolean;
  }

  let { name, size = 16, decorative = false }: Props = $props();

  let label = $derived(jewelTypes.find((j) => j.name === name)?.label ?? name);
</script>

<img
  src={jewelVisuals[name]?.icon}
  width={size}
  height={size}
  alt={decorative ? "" : label}
  title={decorative ? undefined : label}
  class="shrink-0 select-none"
  draggable="false"
/>
