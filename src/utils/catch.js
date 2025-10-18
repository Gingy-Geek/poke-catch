import { baseCatchRates } from "./pokemonRates.js";

/**
 * @param {string} rarity - "common" | "rare" | "legendary"
 * @param {number} bonus - porcentaje extra de pokebola (ej: 0 para normal, 30 para especial)
 */

export function calculateCatch(rarity, bonus = 0) {
  const base = baseCatchRates[rarity];
  const total = Math.min(1, base + bonus); 
  const success = Math.random() < total;
  return { success, totalCatchRate: total };
}
