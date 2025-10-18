import fs from "fs";
import path from "path";
import {calculateCatch} from '../utils/catch.js'
import { fetchRandomPokemon } from '../services/pokemon-service.js'

const USERS_FILE = path.resolve('src/db/db.json')

function readUsers() {
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify({ users }, null, 2));
}

//POST /api/users/searchPok
export const searchPok = async (req, res) => {
  try {
    const { uid } = req.body;
    const { users } = readUsers();
  
    const user = users.find((u) => u.uid === uid);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    // sin intentos disponibles
    if (user.dailyCatches == 0) {
      return res.status(400).json({ error: "No te quedan intentos hoy" });
    }

    // generar pokmon aleatorio
    const pokemon = await fetchRandomPokemon();
    const { id: pokemonId, isShiny } = pokemon;

    // marcar como visto en el pokédex
    if (!user.pokedex) user.pokedex = {};
    if (!user.pokedex[pokemonId]) {
      user.pokedex[pokemonId] = {
        id:pokemonId,
        variants: {
          normal: { seen: 0, obtained: 0 },
          shiny: { seen: 0, obtained: 0 },
        },
        name: pokemon.name,
        rarity: pokemon.rarity,
        sprite: pokemon.sprite,
        shinySprite: pokemon.shinySprite,
        animatedSprite: pokemon.animatedSprite,
        animatedShinySprite: pokemon.animatedShinySprite,
        height: pokemon.height,
        weight: pokemon.weight,
        types: pokemon.types,
        weaknesses: pokemon.weaknesses,
        stats: pokemon.stats,
        description: pokemon.description,
        audio: pokemon.audio
      };
    }

    const variant = isShiny ? "shiny" : "normal";
    const pokeEntry = user.pokedex[pokemonId].variants[variant];

    // determinar si es nuevo (nunca visto esa variante)
    const isNewPokemon = pokeEntry.seen === 0;

    // marcar como visto
    pokeEntry.seen += 1;

    // descontar intento
    user.dailyCatches = Math.max(0, user.dailyCatches - 1);

    // guardar cambios
    saveUsers(users);

    // respuesta
    const updatedEntry = {
      variants: {
        normal: user.pokedex[pokemonId].variants.normal,
        shiny: user.pokedex[pokemonId].variants.shiny,
      },
    };

    return res.json({
      pokemon,
      dailyCatches: user.dailyCatches,
      updatedEntry,
      isNewPokemon
    });
  } catch (e) {
    console.error("Error en searchPok:", e);
    return res.status(500).json({ error: "Error al buscar Pokémon" });
  }
};


export const catchPokemon = async (req, res) => {
  try {
    const { uid, pokemonId, rarity, bonus = 0, isShiny } = req.body;
    const { users } = readUsers();
    const user = users.find((u) => u.uid === uid);

    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    if (!pokemonId || !rarity) return res.status(400).json({ error: "Faltan datos" });

    const { success, totalCatchRate } = calculateCatch(rarity, bonus);

    // consumir masterball si se usó
    if (bonus !== 0) user.masterBalls = Math.max(0, user.masterBalls - 1);

    const variant = isShiny ? "shiny" : "normal";
    const pokeEntry = user.pokedex[pokemonId].variants[variant];

    if (success) pokeEntry.obtained += 1;

    saveUsers(users);

    const updatedEntry = {
      variants: {
        normal: user.pokedex[pokemonId].variants.normal,
        shiny: user.pokedex[pokemonId].variants.shiny,
      },
    };

    return res.json({
      pokemonId,
      rarity,
      caught: success,
      totalCatchRate,
      isShiny,
      updatedUser: {
        masterBalls: user.masterBalls,
      },
      updatedEntry,
    });
  } catch (err) {
    console.error("Error en catchPokemon:", err);
    res.status(500).json({ error: "Error en la captura" });
  }
};

// export const getAllCaptured = (req, res) => {
//   const data = JSON.parse(fs.readFileSync(dbPath))
//   res.json(data.captured)
// }
