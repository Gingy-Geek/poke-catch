import fs from "fs";
import path from "path";
import { calculateCatch } from "../utils/catch.js";
import { fetchRandomPokemon } from "../services/pokemon-service.js";

const USERS_FILE = path.resolve("src/db/db.json");

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
        id: pokemonId,
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
        audio: pokemon.audio,
      };
    }

    const variant = isShiny ? "shiny" : "normal";
    const pokeEntry = user.pokedex[pokemonId].variants[variant];

    // determinar si es nuevo (nunca visto esa variante)
    const isNewPokemon = pokeEntry.seen === 0;

    // marcar como visto
    pokeEntry.seen += 1;
    user.seen += 1;

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
      isNewPokemon,
      totalSeen: user.seen,
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
    if (!pokemonId || !rarity)
      return res.status(400).json({ error: "Faltan datos" });

    const { success, totalCatchRate } = calculateCatch(rarity, bonus);

    // consumir masterball si se usó
    if (bonus !== 0) user.masterBalls = Math.max(0, user.masterBalls - 1);

    const variant = isShiny ? "shiny" : "normal";
    const pokeEntry = user.pokedex[pokemonId].variants[variant];

    if (success) {
      pokeEntry.obtained += 1;
      user.obtained += 1;
    }

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
      totalObtained: user.obtained,
    });
  } catch (err) {
    console.error("Error en catchPokemon:", err);
    res.status(500).json({ error: "Error en la captura" });
  }
};

export const getAllUsers = (req, res) => {
  try {
    const { users } = readUsers();
    console.log(users);
    res.json(users);
  } catch (error) {
    console.error("Error leyendo la DB:", error);
    res.status(500).json({ error: "No se pudo leer la base de datos" });
  }
};

export const changeAvatar = (req, res) => {
  try {
    const { uid, avatar } = req.body;

    const { users } = readUsers();
    const user = users.find((u) => u.uid === uid);

    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    user.avatar = avatar;
    saveUsers(users);
    return res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ error: "Error trying change profile pic" });
  }
};

export const getPodium = (req, res) => {
  try {
    const { users } = readUsers();

    // Query params: ?page=1&perPage=5
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 5;

    // Ordenamos: primero por obtained, luego por seen
    const sortedUsers = [...users].sort((a, b) => {
      if (b.obtained !== a.obtained) return b.obtained - a.obtained; // más capturados primero
      return b.seen - a.seen; // empate: más visto primero
    });

    // Paginar
    const startIndex = (page - 1) * perPage;
    const paginatedUsers = sortedUsers.slice(startIndex, startIndex + perPage);

    res.json({
      page,
      perPage,
      total: users.length,
      totalPages: Math.ceil(users.length / perPage),
      users: paginatedUsers.map((u) => ({
        displayName: u.displayName,
        avatar: u.avatar,
        obtained: u.obtained,
        seen: u.seen,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching podium" });
  }
};

export const ping = (req, res) => {
  try {
    res.json({ status: "ok", message: "Backend funcionando ✅" });
  } catch (error) {
    console.error("Error en ping:", error);
    res.status(500).json({ error: "Error en el ping del servidor" });
  }
};
