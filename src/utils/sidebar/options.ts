import { conquerors } from "$lib/constants/timeless";
import type { Conqueror, JewelType, Stat, Translation } from "$lib/types";

export function getConquerorOptions(selected: JewelType | null): Conqueror[] {
  return selected ? conquerors[selected.name] || [] : [];
}

export function getStatsOptions(
  selected: JewelType | null,
  jewelStats: Record<string, number[]>,
  translation: Record<string, Translation[]>,
): Stat[] {
  if (!selected || !jewelStats[selected.name]) return [];
  const stats = jewelStats[selected.name];
  const options: Map<number, Stat> = new Map<number, Stat>();
  stats.forEach((statId) => {
    const trans = translation[statId.toString()];
    if (trans && trans[0]) {
      options.set(statId, {
        statKey: statId,
        label: trans[0].translation.replace("{0}", "#"),
        weight: 1,
        minWeight: 0,
      });
    }
  });
  return Array.from(options.values());
}

/** Every stat any jewel type can roll, once each (stat ids are shared between jewels). */
export function getAllStatsOptions(
  jewelTypes: JewelType[],
  jewelStats: Record<string, number[]>,
  translation: Record<string, Translation[]>,
): Stat[] {
  const options = new Map<number, Stat>();
  for (const jewelType of jewelTypes) {
    for (const stat of getStatsOptions(jewelType, jewelStats, translation)) {
      if (!options.has(stat.statKey)) options.set(stat.statKey, stat);
    }
  }
  return Array.from(options.values()).sort((a, b) => a.label.localeCompare(b.label));
}
