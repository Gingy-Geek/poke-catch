import { calculateCatch } from "../utils/catch.js";
import { fetchRandomPokemon } from "../services/pokemon-service.js";
import { readUser, updateUser, readAllUsers } from "../services/mongoDb.js";


export const getUser = async (req, res) => {
  const { id } = req.params; // el uid del usuario

  try {
    const user = await readUser(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log(user, "User FOUND");
    res.json(user);
  } catch (err) {
    console.error("❌ Error en getUser:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const registerNewUser = async (req, res) => {
  try {
    console.log("REGISTRANDO...")
    const { uid, displayName, avatar } = req.body;
    
    if (!uid) {
      return res.status(400).json({ error: "Faltan datos" });
    }
    let user = await readUser(uid);

    // Si no existe, lo creamos
    if (!user) {
      user = {
        uid,
        displayName: displayName,
        avatar: avatar || 0,
        pokedex: {},
        masterBalls: 2,
        dailyCatches: 5,
        seen: 0,
        obtained: 0,
        rollResetAt: null,
      };

     
      await updateUser(user);
      
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error en registerNewUser:", error);
    res.status(500).json({ error: "Error registrando el usuario" });
  }
};

export const searchPok = async (req, res) => {
  try {
    const { uid } = req.body;
    let user = await readUser(uid); 

    // sin intentos disponibles
    if (user.dailyCatches == 0) {
      return res.status(400).json({ error: "No attempts left today" });
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

    // si ya no quedan tiradas, fijar rollResetAt en 12h
    if (user.dailyCatches === 0 && !user.rollResetAt) {
      // const twelveHours = 12 * 60 * 60 * 1000; // 12 horas en ms
      const twelveHours = 25 * 1000;
      user.rollResetAt = Date.now() + twelveHours;
    }
    // guardar cambios
    await updateUser(user);

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
      rollResetAt: user.rollResetAt,
    });
  } catch (e) {
    console.error("Error in searchPok:", e);
    return res.status(500).json({ error: "Error fetching Pokémon" });
  }
};

export const catchPokemon = async (req, res) => {
  try {
    const { uid, pokemonId, rarity, bonus = 0, isShiny } = req.body;
    let  user  = await readUser(uid);

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

    await updateUser(user);

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

export const getAllUsers = async (req, res) => {
  try {
    const  users  = await readAllUsers();

    if (!users) return res.status(404).json({ message: "Users not found" });
    res.json(users);
  } catch (error) {
    console.error("Error leyendo la DB:", error);
    res.status(500).json({ error: "No se pudo leer la base de datos" });
  }
};

export const changeAvatar = async (req, res) => {
  try {
    const { uid, avatar } = req.body;

    let  user = await readUser(uid);

    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    user.avatar = avatar;
    await updateUser(user);
    return res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ error: "Error trying change profile pic" });
  }
};

export const getPodium = async (req, res) => {
  try {
    const users = await readAllUsers();

    const start = parseInt(req.query.start) || 0;
    const limit = parseInt(req.query.limit) || 100; // default 100 usuarios por chunk

    // Ordenar globalmente
    const sortedUsers = [...users].sort(
      (a, b) => b.obtained - a.obtained || b.seen - a.seen
    );

    const chunk = sortedUsers.slice(start, start + limit);

    res.json({
      start,
      limit,
      total: users.length,
      users: chunk.map(u => ({
        displayName: u.displayName,
        avatar: u.avatar,
        obtained: u.obtained,
        seen: u.seen
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching podium" });
  }
};

export const resetRolls = async (req, res) => {
  try {
    const id = req.params.id;
    let  user  = await readAllUsers(id); 
    if (!user) return res.status(404).json({ message: "User not found" });

    const now = Date.now(); 

    // Solo resetea si rollResetAt ya paso
    if (user.rollResetAt && user.rollResetAt <= now) {
      user.dailyCatches = 2; // resetea tiradas
      user.masterBalls += 2;
      if (user.masterBalls > 6) user.masterBalls = 6;
      user.rollResetAt = null;
      await updateUser(user);
      return res.json(user);
    } else {
      // Si aún no pasó el tiempo, no hacer nada
      return res.status(400).json({ error: "Rolls cannot be reset yet" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};



export const ping = (req, res) => {
  try {
    console.log("Ping")
    res.json({ status: "ok", message: "Backend funcionando ✅" });
  } catch (error) {
    console.error("Error en ping:", error);
    res.status(500).json({ error: "Error en el ping del servidor" });
  }
};
