// Módulo de Filtros: Contém a lógica pura para filtrar Pokémon e manipular fórmulas.
import { POKEMON_TYPES } from "./config.js";

/**
 * Filtra uma lista de Pokémon com base nos filtros ativos.
 * @param {Array} allPokemon - A lista completa de Pokémon.
 * @param {Object} activeFilters - O objeto com os filtros a serem aplicados.
 * @returns {Array} A lista de Pokémon filtrada.
 */
export function filterPokemon(allPokemon, activeFilters) {
  return allPokemon.filter((pokemon) => {
    const intersectionMatch =
      activeFilters.intersection.length === 0 ||
      activeFilters.intersection.every((type) => pokemon.types.includes(type));
    const unionMatch =
      activeFilters.union.length === 0 ||
      activeFilters.union.some((type) => pokemon.types.includes(type));
    const differenceMatch =
      activeFilters.difference.length === 0 ||
      !activeFilters.difference.some((type) => pokemon.types.includes(type));
    return intersectionMatch && unionMatch && differenceMatch;
  });
}

/**
 * Interpreta uma string de fórmula e a converte em um objeto de filtros.
 * @param {string} formula - A string da fórmula, ex: "(fire ∩ flying) ∪ water".
 * @returns {Object} Um objeto de filtros.
 */
export function parseFormula(formula) {
  const newFilters = { intersection: [], union: [], difference: [] };
  const cleanedFormula = formula.toLowerCase().trim();

  const diffParts = cleanedFormula.split("\\");
  const mainFormula = diffParts[0];
  const diffFormula = diffParts[1] || "";

  const allTypesInDiff = diffFormula.match(/[a-z]+/g) || [];
  newFilters.difference = allTypesInDiff.filter((t) =>
    POKEMON_TYPES.includes(t)
  );

  const unionGroups = mainFormula.split("∪");
  unionGroups.forEach((group) => {
    const intersectionTypes = group
      .replace(/[()]/g, "")
      .split("∩")
      .map((t) => t.trim())
      .filter(Boolean);
    const validTypes = intersectionTypes.filter((t) =>
      POKEMON_TYPES.includes(t)
    );

    if (validTypes.length > 1) {
      newFilters.intersection.push(...validTypes);
    } else if (validTypes.length === 1) {
      newFilters.union.push(validTypes[0]);
    }
  });

  ["intersection", "union", "difference"].forEach(
    (key) => (newFilters[key] = [...new Set(newFilters[key])])
  );

  return newFilters;
}

/**
 * Gera uma string de fórmula a partir de um objeto de filtros.
 * @param {Object} activeFilters - O objeto de filtros.
 * @returns {string} A string da fórmula.
 */
export function generateFormulaFromFilters(activeFilters) {
  let parts = [];
  if (activeFilters.intersection.length > 0) {
    parts.push(`(${activeFilters.intersection.join(" ∩ ")})`);
  }
  if (activeFilters.union.length > 0) {
    parts.push(...activeFilters.union);
  }

  let mainFormula = parts.join(" ∪ ");
  if (activeFilters.difference.length > 0) {
    mainFormula += ` \\ ${activeFilters.difference.join(" ∪ ")}`;
  }
  return mainFormula;
}
