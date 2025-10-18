import { spawnRates } from "./pokemonRates.js"

export function getRandomRarity() {
  const roll = Math.random();
  console.log(roll);
  

  if (roll < spawnRates.legendary) return "legendary";
  if (roll < spawnRates.legendary + spawnRates.rare) return "rare";
  return "common";
}
