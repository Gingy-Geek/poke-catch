import { commons, rares, legendaries } from "./pokemonRarities.js";

export function getRandomPokemonIdByRarity(rarity) {
  let pool;

  if (rarity === "legendary") pool = legendaries;
  else if (rarity === "rare") pool = rares;
  else pool = commons;

  const id = pool[Math.floor(Math.random() * pool.length)];
  return id;
}
