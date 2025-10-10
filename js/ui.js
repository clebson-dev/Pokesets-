// Módulo de UI: Contém todas as funções que manipulam a interface do usuário.

import { elements } from "./dom.js";
import { POKEMON_TYPES } from "./config.js";

/** Renderiza os cards dos Pokémon na tela */
export function renderPokemon(
  pokemonList,
  allPokemonCount,
  showDetailsCallback
) {
  elements.pokedex.innerHTML = "";
  elements.resultsInfo.innerHTML =
    pokemonList.length === 0
      ? `<p class="font-pixel text-xl text-yellow-400">Nenhum Pokémon encontrado!</p>`
      : `<p class="font-bold">${pokemonList.length} de ${allPokemonCount} Pokémon encontrados.</p>`;

  pokemonList.forEach((pokemon) => {
    const typesHtml = pokemon.types
      .map(
        (type) =>
          `<span class="bg-type-${type} text-xs font-bold mr-1 px-2 py-0.5 rounded">${type}</span>`
      )
      .join("");
    const card = document.createElement("div");
    card.className =
      "bg-gray-800 rounded-lg p-3 text-center cursor-pointer hover:scale-105 hover:border-yellow-400 border-2 border-transparent transition-all duration-300 shadow-lg card-enter";
    card.innerHTML = `<img src="${pokemon.sprite}" alt="${
      pokemon.name
    }" class="w-24 h-24 mx-auto object-contain"><h2 class="text-md font-bold capitalize mt-2 truncate">${
      pokemon.name
    }</h2><p class="text-xs text-gray-400">#${String(pokemon.id).padStart(
      3,
      "0"
    )}</p><div class="flex justify-center flex-wrap mt-2">${typesHtml}</div>`;
    card.addEventListener("click", () => showDetailsCallback(pokemon));
    elements.pokedex.appendChild(card);
  });
}

/** Mostra o modal com detalhes do Pokémon */
export function showPokemonDetails(pokemon) {
  const typesHtml = pokemon.types
    .map(
      (type) =>
        `<span class="bg-type-${type} text-xs font-bold mr-1 px-2 py-1 rounded-full">${type}</span>`
    )
    .join("");

  const statsHtml = pokemon.stats
    .map(
      (stat) => `
        <div class="flex items-center justify-between text-sm">
            <span class="w-1/3 capitalize">${stat.name.replace("-", " ")}</span>
            <div class="w-2/3 bg-gray-700 rounded-full h-4">
                <div class="bg-yellow-500 h-4 rounded-full text-right pr-2 text-xs text-black font-bold" style="width: ${Math.min(
                  stat.value / 1.6,
                  100
                )}%">${stat.value}</div>
            </div>
        </div>
      `
    )
    .join("");

  elements.modalContent.innerHTML = ""; // Clear previous content

  const closeButton = document.createElement("button");
  closeButton.className =
    "absolute top-4 right-4 text-gray-400 hover:text-white";
  closeButton.innerHTML = "&times;";
  closeButton.onclick = closeModal;

  elements.modalContent.innerHTML = `
      <img src="${pokemon.sprite}" alt="${
    pokemon.name
  }" class="w-32 h-32 mx-auto bg-gray-900 rounded-full -mt-20 border-4 border-gray-600">
      <h2 class="text-2xl font-bold capitalize mt-4 text-center">${
        pokemon.name
      }</h2>
      <p class="text-center text-gray-400 text-lg">#${String(
        pokemon.id
      ).padStart(3, "0")}</p>
      <div class="flex justify-center mt-2">${typesHtml}</div>
      <div class="mt-6 space-y-3">
          <h3 class="font-pixel text-yellow-400 text-lg">Stats</h3>
          ${statsHtml}
      </div>
  `;
  elements.modalContent.prepend(closeButton);
  elements.modal.classList.remove("hidden");
}

/** Fecha o modal de detalhes */
export function closeModal() {
  elements.modal.classList.add("hidden");
}

/** Cria os checkboxes de filtro dinamicamente */
export function createFilterCheckboxes() {
  POKEMON_TYPES.forEach((type) => {
    ["intersection", "union", "difference"].forEach((filterType) => {
      const label = document.createElement("label");
      label.className = `flex items-center space-x-2 text-sm capitalize p-1 rounded-md cursor-pointer bg-gray-700 hover:bg-gray-600 transition-colors`;
      label.innerHTML = `<input type="checkbox" data-type="${type}" data-filter="${filterType}" class="form-checkbox h-4 w-4 rounded bg-gray-900 border-gray-600 text-yellow-500 focus:ring-yellow-600"><span class="bg-type-${type} px-2 py-0.5 rounded text-xs">${type}</span>`;
      elements.filterContainers[filterType].appendChild(label);
    });
  });
}

/** Atualiza a exibição da fórmula matemática na tela */
export function updateFilterFormulaDisplay() {
  elements.formulaDisplay.innerHTML = elements.formulaInput.value
    .replace(/∩/g, '<span class="text-red-400"> ∩ </span>')
    .replace(/∪/g, '<span class="text-blue-400"> ∪ </span>')
    .replace(/\\/g, '<span class="text-green-400"> \\ </span>');
}

/** Insere um operador na caixa de fórmula */
export function handleOperatorButtonClick(operator) {
  const { selectionStart, selectionEnd, value } = elements.formulaInput;
  const operatorWithSpaces = ` ${operator} `;
  elements.formulaInput.value =
    value.substring(0, selectionStart) +
    operatorWithSpaces +
    value.substring(selectionEnd);
  const newCursorPos = selectionStart + operatorWithSpaces.length;
  elements.formulaInput.selectionStart = elements.formulaInput.selectionEnd =
    newCursorPos;
  elements.formulaInput.focus();
}

/** Função auxiliar para copiar texto para o clipboard */
export function copyToClipboard(text, buttonElement) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    const successful = document.execCommand("copy");
    const originalText = buttonElement.innerText;
    if (successful) {
      buttonElement.innerText = "Copiado!";
      setTimeout(() => {
        buttonElement.innerText = originalText;
      }, 2000);
    }
  } catch (err) {
    console.error("Falha ao copiar o texto", err);
  }
  document.body.removeChild(textArea);
}
