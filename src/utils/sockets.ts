import type { Node, TreeData } from "$lib/types";

/**
 * Sockets being compared, in the order they were picked. `chosenSocket` is the active one
 * (the one shown on the tree); `pickedSockets` keeps the full list. Anything that sets only
 * `chosenSocket` (history, share links) falls back to that single socket.
 */
export function getPickedSockets(state: {
  chosenSocket: Node | null;
  pickedSockets?: Node[];
}): Node[] {
  const { chosenSocket, pickedSockets } = state;
  if (!chosenSocket) return [];
  if (pickedSockets && pickedSockets.length > 1 && pickedSockets.some((s) => s.skill === chosenSocket.skill)) {
    return pickedSockets;
  }
  return [chosenSocket];
}

/** Node ids inside the radius of any of the given sockets, without duplicates. */
export function socketNodeIds(sockets: Node[], treeData: TreeData): string[] {
  const ids = new Set<string>();
  for (const socket of sockets) {
    for (const id of treeData.socketNodes[socket.skill.toString()] ?? []) ids.add(id);
  }
  return [...ids];
}
