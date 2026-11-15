import { writable } from "svelte/store";
import type { JewelType } from "$lib/types";

/** Set to open the "Compare all sockets" dialog pre-filled with a seed and jewel. */
export const seedAnalyzerRequest = writable<{ seed: number; jewelType: JewelType } | null>(null);
