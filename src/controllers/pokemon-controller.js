import { fetchRandomPokemon } from '../services/pokemon-service.js'


export const getRandomPokemon = async (req, res) => {
  try {
    const pokemon = await fetchRandomPokemon();
    res.json(pokemon);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener Pokémon" });
  }
};




