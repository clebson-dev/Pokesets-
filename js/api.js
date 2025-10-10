// Módulo da API: Responsável por toda a comunicação com a PokeAPI.

import { POKE_API_URL } from "./config.js";
import { elements } from "./dom.js";

/** Busca os dados dos Pokémon da API em paralelo */
export async function fetchAllPokemon(startId, endId) {
  try {
    const promises = Array.from({ length: endId - startId + 1 }, (_, i) =>
      fetch(`${POKE_API_URL}${startId + i}`).then((res) => res.json())
    );
    const results = await Promise.all(promises);
    return results.map((data) => ({
      id:     data.id,
      name:   data.name,
      sprite: data.sprites.front_default,
      types:  data.types.map((t) => t.type.name),
      stats:  data.stats.map((s) => ({
        name:  s.stat.name,
        value: s.base_stat,
      })),
    }));
  } catch (error) {
    elements.loader.innerHTML =
      '<p class="text-red-500">Erro ao carregar dados. Tente recarregar a página.</p>';
    console.error("Failed to fetch Pokémon data:", error);
    return [];
  }
}
