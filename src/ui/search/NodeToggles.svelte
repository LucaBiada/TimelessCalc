<script lang="ts">
  import type { Node } from "$lib/types";
  import { treeStore } from "$lib/stores/treeStore";
  import { canvas } from "$lib/canvas/canvasContext";
  import { getPickedSockets, socketNodeIds } from "$lib/utils/sockets";

  // Nodes inside any picked socket's radius (one shared selection for all sockets).
  let socketNodes = $derived(
    socketNodeIds(getPickedSockets($treeStore), canvas.treeData)
      .map((id) => canvas.treeData.nodes[id])
      .filter((n): n is Node => !!n),
  );
  const isSmall = (n: Node) => !n.isNotable && !n.isMastery && !n.isKeystone && !n.isJewelSocket;
  const allIn = (nodes: Node[]) =>
    nodes.length > 0 && nodes.every((n) => $treeStore.allocated.has(n.skill.toString()));
  let selectedCount = $derived(
    socketNodes.filter((n) => $treeStore.allocated.has(n.skill.toString())).length,
  );
  let groups = $derived([
    { label: "All", title: "Select or unselect every node in the jewel radius", on: allIn(socketNodes), toggle: toggleAllNodes },
    { label: "Notables", title: "Select or unselect notable nodes", on: allIn(socketNodes.filter((n) => n.isNotable)), toggle: toggleNotableNodes },
    { label: "Small", title: "Select or unselect small nodes", on: allIn(socketNodes.filter(isSmall)), toggle: toggleSmallNodes },
  ]);

  function updateAllocatedDisplay() {
    canvas.state.highlightVersion++;
  }

  function toggleAllNodes() {
    const chosenSocket = $treeStore.chosenSocket;
    if (!chosenSocket) return;

    const nodes = socketNodes
      .filter((n): n is Node => !!n);

    const allAllocated =
      nodes.length > 0 &&
      nodes.every((n) => $treeStore.allocated.has(n.skill.toString()));

    treeStore.update((state) => {
      if (allAllocated) {
        state.allocated.clear();
        state.locked.clear();
      } else {
        for (const node of nodes) {
          state.allocated.set(node.skill.toString(), node);
        }
      }
      return state;
    });
    updateAllocatedDisplay();
  }

  function toggleNotableNodes() {
    const chosenSocket = $treeStore.chosenSocket;
    if (!chosenSocket) return;

    const notableNodes = socketNodes
      .filter((n): n is Node => n && n.isNotable === true);

    const allNotableAllocated =
      notableNodes.length > 0 &&
      notableNodes.every((n) => $treeStore.allocated.has(n.skill.toString()));

    treeStore.update((state) => {
      if (allNotableAllocated) {
        for (const node of notableNodes) {
          state.allocated.delete(node.skill.toString());
          state.locked.delete(node.skill.toString());
        }
      } else {
        for (const node of notableNodes) {
          state.allocated.set(node.skill.toString(), node);
        }
      }
      return state;
    });

    updateAllocatedDisplay();
  }

  function toggleSmallNodes() {
    const chosenSocket = $treeStore.chosenSocket;
    if (!chosenSocket) return;

    const smallNodes = socketNodes
      .filter(
        (n): n is Node =>
          n &&
          !n.isNotable &&
          !n.isMastery &&
          !n.isKeystone &&
          !n.isJewelSocket,
      );

    const allSmallAllocated =
      smallNodes.length > 0 &&
      smallNodes.every((n) => $treeStore.allocated.has(n.skill.toString()));

    treeStore.update((state) => {
      if (allSmallAllocated) {
        for (const node of smallNodes) {
          state.allocated.delete(node.skill.toString());
          state.locked.delete(node.skill.toString());
        }
      } else {
        for (const node of smallNodes) {
          state.allocated.set(node.skill.toString(), node);
        }
      }
      return state;
    });
    updateAllocatedDisplay();
  }
</script>

{#if $treeStore.chosenSocket}
  <div class="flex items-baseline justify-between mb-2">
    <span class="text-xs font-medium text-ink-muted">Nodes to count</span>
    <span class="text-xs text-ink-faint" aria-live="polite">{selectedCount} of {socketNodes.length} selected</span>
  </div>
  <div class="grid grid-cols-3 gap-1.5">
    {#each groups as group (group.label)}
      <button
        type="button"
        onclick={group.toggle}
        title={group.title}
        aria-pressed={group.on}
        class="py-1.5 px-2 rounded-md border text-[13px] cursor-pointer transition-colors {group.on
          ? 'border-gold bg-gold-soft text-ink font-medium'
          : 'border-line bg-raised text-ink-muted hover:text-ink hover:border-line-strong'}"
      >
        {group.label}
      </button>
    {/each}
  </div>
  <p class="mt-2 text-xs text-ink-faint">Or click nodes on the tree. Ctrl+click locks a node: stat searches then only keep seeds that put one of your stats on it.</p>
{/if}
