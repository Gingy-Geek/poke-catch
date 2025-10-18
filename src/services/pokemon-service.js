import fetch from "node-fetch";
import { getRandomRarity } from "../utils/randomRarity.js";
import { getRandomPokemonIdByRarity } from "../utils/getPokemonByRarity.js";

export const fetchRandomPokemon = async () => {
  const rarity = getRandomRarity();
  const id = getRandomPokemonIdByRarity(rarity);

  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  const data = await res.json();

  const isShiny = Math.random() < 0.5;

  const nameLower = data.name.toLowerCase();

  const animatedSprite = `https://img.pokemondb.net/sprites/black-white/anim/normal/${nameLower}.gif`;
  const animatedShinySprite = `https://img.pokemondb.net/sprites/black-white/anim/shiny/${nameLower}.gif`;

  
  const stats = {};
  data.stats.forEach((s) => {
    if (["hp", "attack", "defense", "speed"].includes(s.stat.name)) {
      stats[s.stat.name] = s.base_stat;
    }
  });

  // Tipos base
  const types = data.types.map((t) => t.type.name);

  // Buscar debilidades de cada tipo
  const typeData = await Promise.all(
    types.map((type) => fetch(`https://pokeapi.co/api/v2/type/${type}`).then((r) => r.json()))
  );

  const weaknesses = [
    ...new Set( //new set, elimina duplicados... flatmap, crea un array directo de un nivel ["type","type","type",]
      typeData.flatMap((t) => t.damage_relations.double_damage_from.map((d) => d.name))
    ),
  ];

  // Descripcion
  const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
  const speciesData = await speciesRes.json();

  // Buscamos la descripción en español (si no hay, usamos inglés)
  const flavorEntry = speciesData.flavor_text_entries.find((entry) => entry.language.name === "en") || "No description provided.";

  // Limpiar texto
  const description = flavorEntry
    ? flavorEntry.flavor_text.replace(/[\n\f]/g, " ").trim()
    : "Descripción no disponible.";

  

  return {
    id: data.id,
    name: data.name,
    rarity,
    sprite: data.sprites.front_default,
    shinySprite: data.sprites.front_shiny,
    animatedSprite,
    animatedShinySprite,
    height: data.height / 10,
    weight: data.weight / 10,
    isShiny,
    types,
    stats,
    weaknesses,
    description,
    audio: data.cries.legacy
  };
};
