// --- CONFIGURAÇÃO E CONSTANTES ---
const POKE_API_URL = "https://pokeapi.co/api/v2/pokemon/";
const POKEMON_TYPES = [
  "grass",
  "fire",
  "water",
  "bug",
  "normal",
  "poison",
  "electric",
  "ground",
  "fairy",
  "fighting",
  "psychic",
  "rock",
  "ghost",
  "ice",
  "dragon",
  "dark",
  "steel",
  "flying",
];
const GENERATION_RANGES = {
  1: { start: 1, end: 151 },
  2: { start: 152, end: 251 },
  3: { start: 252, end: 386 },
};

// --- ELEMENTOS DO DOM ---
const elements = {
  pokedex: document.getElementById("pokedex"),
  loader: document.getElementById("loader"),
  resultsInfo: document.getElementById("results-info"),
  formulaDisplay: document.getElementById("formula-display"),
  formulaInput: document.getElementById("formula-input"),
  formulaSearchBtn: document.getElementById("formula-search-btn"),
  resetButton: document.getElementById("reset-button"),
  modal: document.getElementById("pokemon-modal"),
  modalContent: document.getElementById("modal-content"),
  vennDiagram: document.getElementById("venn-diagram"),
  vennSetsList: document.getElementById("venn-sets-list"),
  setsAnalysisList: document.getElementById("sets-analysis-list"),
  formulaContainer: document.getElementById("formula-container"),
  toggleFiltersBtn: document.getElementById("toggle-filters-btn"),
  manualFiltersPanel: document.getElementById("manual-filters-panel"),
  generationSelector: document.getElementById("generation-selector"),
  challengeBtn: document.getElementById("challenge-btn"),
  shareBtn: document.getElementById("share-btn"),
  exportBtn: document.getElementById("export-btn"),
  filterContainers: {
    intersection: document.getElementById("intersection-filters"),
    union: document.getElementById("union-filters"),
    difference: document.getElementById("difference-filters"),
  },
};

// --- ESTADO DA APLICAÇÃO ---
let allPokemon = [];
let currentFilteredPokemon = [];
let activeFilters = {
  intersection: [],
  union: [],
  difference: [],
};
let vennTooltip = null;

// --- FUNÇÕES PRINCIPAIS ---

/** Inicializa a aplicação */
async function initializeApp() {
  createFilterCheckboxes();
  setupEventListeners();
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("formula"))
    elements.formulaInput.value = decodeURIComponent(urlParams.get("formula"));
  await loadGeneration(elements.generationSelector.value);
  if (elements.formulaInput.value) parseFormulaAndApply();
}

/** Carrega os dados de uma geração específica de Pokémon */
async function loadGeneration(genNumber) {
  elements.loader.style.display = "block";
  elements.pokedex.innerHTML = "";
  const range = GENERATION_RANGES[genNumber];
  allPokemon = await fetchAllPokemon(range.start, range.end);
  elements.loader.style.display = "none";
  resetFilters();
}

/** Busca os dados dos Pokémon da API em paralelo */
async function fetchAllPokemon(startId, endId) {
  try {
    const promises = Array.from({ length: endId - startId + 1 }, (_, i) =>
      fetch(`${POKE_API_URL}${startId + i}`).then((res) => res.json())
    );
    const results = await Promise.all(promises);
    return results.map((data) => ({
      id: data.id,
      name: data.name,
      sprite: data.sprites.front_default,
      types: data.types.map((t) => t.type.name),
      stats: data.stats.map((s) => ({ name: s.stat.name, value: s.base_stat })),
    }));
  } catch (error) {
    elements.loader.innerHTML =
      '<p class="text-red-500">Erro ao carregar dados. Tente recarregar a página.</p>';
    return [];
  }
}

/** Cria os checkboxes de filtro */
function createFilterCheckboxes() {
  POKEMON_TYPES.forEach((type) => {
    ["intersection", "union", "difference"].forEach((filterType) => {
      const label = document.createElement("label");
      label.className = `flex items-center space-x-2 text-sm capitalize p-1 rounded-md cursor-pointer bg-gray-700 hover:bg-gray-600 transition-colors`;
      label.innerHTML = `<input type="checkbox" data-type="${type}" data-filter="${filterType}" class="form-checkbox h-4 w-4 rounded bg-gray-900 border-gray-600 text-yellow-500 focus:ring-yellow-600"><span class="bg-type-${type} px-2 py-0.5 rounded text-xs">${type}</span>`;
      elements.filterContainers[filterType].appendChild(label);
    });
  });
}

/** Configura todos os event listeners */
function setupEventListeners() {
  document
    .querySelectorAll('input[type="checkbox"]')
    .forEach((c) => c.addEventListener("change", handleFilterChange));
  elements.resetButton.addEventListener("click", resetFilters);
  elements.formulaSearchBtn.addEventListener("click", parseFormulaAndApply);
  elements.formulaInput.addEventListener(
    "keyup",
    (e) => e.key === "Enter" && parseFormulaAndApply()
  );
  elements.modal.addEventListener(
    "click",
    (e) => e.target === elements.modal && closeModal()
  );
  document
    .getElementById("op-intersect")
    .addEventListener("click", () => handleOperatorButtonClick("∩"));
  document
    .getElementById("op-union")
    .addEventListener("click", () => handleOperatorButtonClick("∪"));
  document
    .getElementById("op-difference")
    .addEventListener("click", () => handleOperatorButtonClick("\\"));
  elements.toggleFiltersBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    elements.manualFiltersPanel.classList.toggle("panel-exit");
    elements.manualFiltersPanel.classList.toggle("panel-enter");
  });
  document.addEventListener("click", (e) => {
    if (!elements.formulaContainer.contains(e.target)) {
      elements.manualFiltersPanel.classList.add("panel-exit");
      elements.manualFiltersPanel.classList.remove("panel-enter");
    }
  });
  elements.generationSelector.addEventListener("change", (e) =>
    loadGeneration(e.target.value)
  );
  elements.challengeBtn.addEventListener("click", generateChallenge);
  elements.shareBtn.addEventListener("click", handleShareClick);
  elements.exportBtn.addEventListener("click", handleExportClick);
}

/** Renderiza os cards dos Pokémon */
function renderPokemon(pokemonList) {
  elements.pokedex.innerHTML = "";
  elements.resultsInfo.innerHTML =
    pokemonList.length === 0
      ? `<p class="font-pixel text-xl text-yellow-400">Nenhum Pokémon encontrado!</p>`
      : `<p class="font-bold">${pokemonList.length} de ${allPokemon.length} Pokémon encontrados.</p>`;
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
    card.addEventListener("click", () => showPokemonDetails(pokemon));
    elements.pokedex.appendChild(card);
  });
}

/** Lida com a mudança de estado de um checkbox */
function handleFilterChange(event) {
  const { type, filter } = event.target.dataset;
  const isChecked = event.target.checked;
  const filterArray = activeFilters[filter];
  if (isChecked) filterArray.push(type);
  else activeFilters[filter] = filterArray.filter((t) => t !== type);
  applyFilters();
  syncFormulaInputFromUI();
}

/** Aplica os filtros ativos à lista de Pokémon */
function applyFilters() {
  currentFilteredPokemon = allPokemon.filter((pokemon) => {
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
  renderPokemon(currentFilteredPokemon);
  updateFilterFormulaDisplay();
  updateVennDiagram();
}

/** Limpa todos os filtros */
function resetFilters() {
  activeFilters = { intersection: [], union: [], difference: [] };
  document
    .querySelectorAll('input[type="checkbox"]')
    .forEach((cb) => (cb.checked = false));
  elements.formulaInput.value = "";
  applyFilters();
}

/** Mostra o modal com detalhes do Pokémon */
function showPokemonDetails(pokemon) {
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
                    <span class="w-1/3 capitalize">${stat.name.replace(
                      "-",
                      " "
                    )}</span>
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

  elements.modalContent.innerHTML = `
                <button onclick="closeModal()" class="absolute top-4 right-4 text-gray-400 hover:text-white">&times;</button>
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
  elements.modal.classList.remove("hidden");
}

/** Fecha o modal */
function closeModal() {
  elements.modal.classList.add("hidden");
}

/** Insere um operador na caixa de fórmula */
function handleOperatorButtonClick(operator) {
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

/** Interpreta a fórmula do input e aplica os filtros */
function parseFormulaAndApply() {
  activeFilters = { intersection: [], union: [], difference: [] };
  const formula = elements.formulaInput.value.toLowerCase().trim();
  const diffParts = formula.split("\\");
  const mainFormula = diffParts[0],
    diffFormula = diffParts[1] || "";
  const allTypesInDiff = diffFormula.match(/[a-z]+/g) || [];
  activeFilters.difference = allTypesInDiff.filter((t) =>
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
    if (validTypes.length > 1) activeFilters.intersection.push(...validTypes);
    else if (validTypes.length === 1) activeFilters.union.push(validTypes[0]);
  });
  ["intersection", "union", "difference"].forEach(
    (key) => (activeFilters[key] = [...new Set(activeFilters[key])])
  );
  syncUIFromFilters();
  applyFilters();
}

/** Sincroniza os checkboxes a partir dos filtros ativos */
function syncUIFromFilters() {
  document.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    const { type, filter } = cb.dataset;
    cb.checked = activeFilters[filter].includes(type);
  });
}

/** Sincroniza o input da fórmula a partir dos checkboxes */
function syncFormulaInputFromUI() {
  let parts = [];
  if (activeFilters.intersection.length > 0)
    parts.push(`(${activeFilters.intersection.join(" ∩ ")})`);
  if (activeFilters.union.length > 0) parts.push(...activeFilters.union);

  let mainFormula = parts.join(" ∪ ");
  if (activeFilters.difference.length > 0)
    mainFormula += ` \\ ${activeFilters.difference.join(" ∪ ")}`;
  elements.formulaInput.value = mainFormula;
}

/** Atualiza a exibição da fórmula matemática */
function updateFilterFormulaDisplay() {
  elements.formulaDisplay.innerHTML = elements.formulaInput.value
    .replace(/∩/g, '<span class="text-red-400"> ∩ </span>')
    .replace(/∪/g, '<span class="text-blue-400"> ∪ </span>')
    .replace(/\\/g, '<span class="text-green-400"> \\ </span>');
}

/** Atualiza o diagrama de Venn e as análises */
function updateVennDiagram() {
  updateVennSetsList();
  updateSetsAnalysis();
  const uniqueTypes = [
    ...new Set([...activeFilters.intersection, ...activeFilters.union]),
  ];
  if (uniqueTypes.length === 0 || uniqueTypes.length > 4) {
    elements.vennDiagram.innerHTML = `<p>Selecione de 1 a 4 tipos para gerar o diagrama.</p>`;
    return;
  }
  const typeKeys = uniqueTypes;
  const vennLayoutData = [];
  const disjointRegionData = [];
  for (let i = 1; i < 1 << typeKeys.length; i++) {
    const subsetTypes = [];
    let intersectionResult = [...allPokemon];
    for (let j = 0; j < typeKeys.length; j++) {
      if ((i >> j) & 1) {
        const currentType = typeKeys[j];
        subsetTypes.push(currentType);
        const currentSetPokemonIds = new Set(
          allPokemon
            .filter((p) => p.types.includes(currentType))
            .map((p) => p.id)
        );
        intersectionResult = intersectionResult.filter((p) =>
          currentSetPokemonIds.has(p.id)
        );
      }
    }
    if (subsetTypes.length > 0) {
      vennLayoutData.push({
        sets: subsetTypes,
        size: intersectionResult.length,
      });
    }
    let disjointResult = [...intersectionResult];
    for (let k = 0; k < typeKeys.length; k++) {
      if (!((i >> k) & 1)) {
        const otherType = typeKeys[k];
        const otherSetPokemonIds = new Set(
          allPokemon.filter((p) => p.types.includes(otherType)).map((p) => p.id)
        );
        disjointResult = disjointResult.filter(
          (p) => !otherSetPokemonIds.has(p.id)
        );
      }
    }
    if (disjointResult.length > 0) {
      disjointRegionData.push({
        sets: subsetTypes,
        size: disjointResult.length,
        data: disjointResult.map((p) => p.name).sort(),
      });
    }
  }
  if (vennLayoutData.every((d) => d.size === 0)) {
    elements.vennDiagram.innerHTML = `<p>A combinação de filtros não resultou em Pokémon para o diagrama.</p>`;
    return;
  }

  elements.vennDiagram.innerHTML = "";
  const chart = venn.VennDiagram();
  const div = d3.select("#venn-diagram").datum(vennLayoutData).call(chart);

  div
    .selectAll("path")
    .style("stroke-opacity", 0)
    .style("stroke", "#fff")
    .style("stroke-width", 0);
  div.selectAll("text").remove();
  if (!vennTooltip) {
    vennTooltip = d3.select("body").append("div").attr("class", "venn-tooltip");
  }

  const validAreas = div
    .selectAll("g")
    .filter((d) => d && Array.isArray(d.sets));

  validAreas
    .attr("class", (d) => "venn-area venn-circle-" + d.sets.join("-"))
    .on("mouseover", function (d) {
      venn.sortAreas(div, d); // Restaurado para a versão estável
      vennTooltip.transition().duration(200).style("opacity", 0.95);
      const regionData = disjointRegionData.find(
        (region) =>
          region.sets.length === d.sets.length &&
          region.sets.every((val) => d.sets.includes(val))
      );
      const pokemonInRegion = regionData ? regionData.data : [];
      const count = regionData ? regionData.size : 0;
      let content = `<strong class="capitalize text-yellow-400">${d.sets.join(
        " ∩ "
      )} (${count})</strong><hr class="my-1 border-gray-500">`;
      content += pokemonInRegion
        .slice(0, 15)
        .map((name) => `<span class="capitalize">${name}</span>`)
        .join("<br>");
      if (pokemonInRegion.length > 15)
        content += `<br>... e mais ${pokemonInRegion.length - 15}`;
      vennTooltip
        .html(content)
        .style("left", d3.event.pageX + 15 + "px")
        .style("top", d3.event.pageY - 28 + "px");
      const selection = d3.select(this).transition("tooltip").duration(400);
      selection
        .select("path")
        .style("fill-opacity", 0.6)
        .style("stroke-opacity", 1);
    })
    .on("mousemove", () =>
      vennTooltip
        .style("left", d3.event.pageX + 15 + "px")
        .style("top", d3.event.pageY - 28 + "px")
    )
    .on("mouseout", function (d) {
      vennTooltip.transition().duration(500).style("opacity", 0);
      const selection = d3.select(this).transition("tooltip").duration(400);
      selection
        .select("path")
        .style("fill-opacity", d.sets.length == 1 ? 0.25 : 0)
        .style("stroke-opacity", 0);
    })
    .each(function (d) {
      const group = d3.select(this);
      if (!chart.path) return;
      const center = chart.path.centroid(d);
      const text = group
        .append("text")
        .attr("x", center[0])
        .attr("y", center[1])
        .style("fill", "white")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .attr("text-anchor", "middle")
        .attr("dy", ".35em");
      const regionData = disjointRegionData.find(
        (region) =>
          region.sets.length === d.sets.length &&
          region.sets.every((val) => d.sets.includes(val))
      );
      const count = regionData ? regionData.size : 0;
      const pokemonInRegion = regionData ? regionData.data : [];
      if (count > 0) {
        const firstName = pokemonInRegion[0];
        const textWidth = firstName.length * 8;
        if (d.size > textWidth) {
          text.text(firstName.charAt(0).toUpperCase() + firstName.slice(1));
          if (count > 1) {
            group
              .append("text")
              .attr("x", center[0])
              .attr("y", center[1] + 16)
              .style("fill", "white")
              .style("font-size", "12px")
              .attr("text-anchor", "middle")
              .attr("dy", ".35em")
              .text(`(+${count - 1})`);
          }
        } else {
          text.text(count);
        }
      }
    });
}

/** Atualiza a lista com a definição formal de cada conjunto */
function updateVennSetsList() {
  elements.vennSetsList.innerHTML = "";
  const uniqueTypes = [
    ...new Set([...activeFilters.intersection, ...activeFilters.union]),
  ];
  if (uniqueTypes.length === 0) {
    elements.vennSetsList.innerHTML =
      '<p class="text-gray-500">Selecione os tipos para ver a definição dos conjuntos.</p>';
    return;
  }
  const setLetters = ["A", "B", "C", "D"];
  const setsHtml = uniqueTypes
    .map((type, index) => {
      const setLetter = setLetters[index];
      const pokemonInSet = allPokemon.filter((p) => p.types.includes(type));
      const cardinalidade = pokemonInSet.length;
      const pokemonIds = pokemonInSet.map((p) => p.id).join(", ");
      return `<div class="mb-2 break-words p-1 rounded transition-colors duration-300 cursor-pointer hover:bg-gray-700" data-type="${type}"><strong class="text-yellow-400 capitalize">${setLetter} (${type}), |${setLetter}|=${cardinalidade}</strong> = {${pokemonIds}}</div>`;
    })
    .join("");

  // Lógica para mostrar as operações
  if (uniqueTypes.length >= 2) {
    let operationsHtml =
      '<hr class="my-4 border-gray-600"><h4 class="font-pixel text-base text-yellow-400 mb-3">Operações entre Conjuntos</h4>';
    const sets = uniqueTypes.map((type, index) => ({
      letter: setLetters[index],
      elements: new Set(
        allPokemon.filter((p) => p.types.includes(type)).map((p) => p.id)
      ),
    }));

    for (let i = 0; i < sets.length; i++) {
      for (let j = i + 1; j < sets.length; j++) {
        const set1 = sets[i];
        const set2 = sets[j];

        if (i > 0 || j > 1) {
          operationsHtml += `<hr class="my-3 border-gray-700 border-dashed">`;
        }

        // Intersection
        const intersection = new Set(
          [...set1.elements].filter((id) => set2.elements.has(id))
        );
        operationsHtml += `
                                <div class="flex flex-wrap items-baseline mb-2">
                                    <div class="w-full sm:w-1/4 font-bold text-red-400">${
                                      set1.letter
                                    } ∩ ${set2.letter}</div>
                                    <div class="w-full sm:w-1/4 text-gray-400">|${
                                      set1.letter
                                    }∩${set2.letter}| = ${intersection.size}</div>
                                    <div class="w-full sm:w-1/2 break-words">= {${
                                      [...intersection]
                                        .sort((a, b) => a - b)
                                        .join(", ") || "∅"
                                    }}</div>
                                </div>`;

        // Union
        const union = new Set([...set1.elements, ...set2.elements]);
        operationsHtml += `
                                <div class="flex flex-wrap items-baseline mb-2">
                                    <div class="w-full sm:w-1/4 font-bold text-blue-400">${
                                      set1.letter
                                    } ∪ ${set2.letter}</div>
                                    <div class="w-full sm:w-1/4 text-gray-400">|${
                                      set1.letter
                                    }∪${set2.letter}| = ${union.size}</div>
                                    <div class="w-full sm:w-1/2 break-words">= {${[
                                      ...union,
                                    ]
                                      .sort((a, b) => a - b)
                                      .join(", ")}}</div>
                                </div>`;

        // Difference A \ B
        const diff1 = new Set(
          [...set1.elements].filter((id) => !set2.elements.has(id))
        );
        operationsHtml += `
                                <div class="flex flex-wrap items-baseline mb-2">
                                    <div class="w-full sm:w-1/4 font-bold text-green-400">${
                                      set1.letter
                                    } \\ ${set2.letter}</div>
                                    <div class="w-full sm:w-1/4 text-gray-400">|${
                                      set1.letter
                                    }\\${set2.letter}| = ${diff1.size}</div>
                                    <div class="w-full sm:w-1/2 break-words">= {${
                                      [...diff1].sort((a, b) => a - b).join(", ") ||
                                      "∅"
                                    }}</div>
                                </div>`;

        // Difference B \ A
        const diff2 = new Set(
          [...set2.elements].filter((id) => !set1.elements.has(id))
        );
        operationsHtml += `
                                <div class="flex flex-wrap items-baseline">
                                    <div class="w-full sm:w-1/4 font-bold text-green-400">${
                                      set2.letter
                                    } \\ ${set1.letter}</div>
                                    <div class="w-full sm:w-1/4 text-gray-400">|${
                                      set2.letter
                                    }\\${set1.letter}| = ${diff2.size}</div>
                                    <div class="w-full sm:w-1/2 break-words">= {${
                                      [...diff2].sort((a, b) => a - b).join(", ") ||
                                      "∅"
                                    }}</div>
                                </div>`;
      }
    }
    elements.vennSetsList.innerHTML = setsHtml + operationsHtml;
  } else {
    elements.vennSetsList.innerHTML = setsHtml;
  }

  document.querySelectorAll("#venn-sets-list div[data-type]").forEach((el) => {
    el.addEventListener("mouseenter", handleSetHighlight);
    el.addEventListener("mouseleave", handleSetHighlight);
  });
}

/** Destaque interativo entre a lista de conjuntos e o diagrama */
function handleSetHighlight(event) {
  const type = event.target.closest("div[data-type]").dataset.type;
  if (!type) return;
  const vennCircle = d3.select(`#venn-diagram .venn-circle-${type}`);
  if (vennCircle.empty()) return;

  vennCircle
    .select("path")
    .transition()
    .duration(300)
    .style("fill-opacity", event.type === "mouseenter" ? 0.6 : 0.25)
    .style("stroke-opacity", event.type === "mouseenter" ? 1 : 0);
}

/** Analisa e classifica os conjuntos selecionados */
function updateSetsAnalysis() {
  elements.setsAnalysisList.innerHTML = "";
  const uniqueTypes = [
    ...new Set([...activeFilters.intersection, ...activeFilters.union]),
  ];
  const setLetters = ["A", "B", "C", "D"];
  const sets = uniqueTypes.map((type, index) => ({
    letter: setLetters[index],
    name: type,
    elements: new Set(
      allPokemon.filter((p) => p.types.includes(type)).map((p) => p.id)
    ),
  }));
  let analysisResults = [
    `🌍 <strong class="text-yellow-400">Conjunto Universo (U)</strong>, |U|=${allPokemon.length}`,
  ];
  if (uniqueTypes.length < 1) {
    elements.setsAnalysisList.innerHTML =
      '<p class="text-gray-500">Selecione pelo menos um conjunto para análise.</p>';
    return;
  }
  sets.forEach((set) => {
    const complement = allPokemon.filter((p) => !set.elements.has(p.id));
    analysisResults.push(
      `🔹 <strong class="text-yellow-400">Complementar de ${set.letter} (Aᶜ)</strong>: Contém ${complement.length} Pokémon que não são do tipo ${set.name}.`
    );
    if (set.elements.size <= 4 && set.elements.size > 0)
      analysisResults.push(
        `🔹 <strong class="text-yellow-400">Conjunto das Partes de ${
          set.letter
        } (P(A))</strong>: Possui 2<sup>${set.elements.size}</sup> = ${Math.pow(
          2,
          set.elements.size
        )} subconjuntos.`
      );
  });
  if (sets.length >= 2) {
    for (let i = 0; i < sets.length; i++) {
      for (let j = i + 1; j < sets.length; j++) {
        const set1 = sets[i],
          set2 = sets[j];
        const intersection = new Set(
          [...set1.elements].filter((id) => set2.elements.has(id))
        );
        if (intersection.size === 0)
          analysisResults.push(
            `🔹 <strong class="text-green-400">${set1.letter} e ${set2.letter} são Disjuntos</strong> (${set1.letter} ∩ ${set2.letter} = ∅).`
          );
        const is1SubsetOf2 = [...set1.elements].every((id) =>
            set2.elements.has(id)
          ),
          is2SubsetOf1 = [...set2.elements].every((id) =>
            set1.elements.has(id)
          );
        if (is1SubsetOf2 && set1.elements.size < set2.elements.size)
          analysisResults.push(
            `🔹 <strong class="text-blue-400">${set1.letter} é Subconjunto Próprio de ${set2.letter}</strong> (${set1.letter} ⊂ ${set2.letter}).`
          );
        else if (is2SubsetOf1 && set2.elements.size < set1.elements.size)
          analysisResults.push(
            `🔹 <strong class="text-purple-400">${set2.letter} é Subconjunto Próprio de ${set1.letter}</strong> (${set2.letter} ⊂ ${set1.letter}).`
          );
        else if (is1SubsetOf2 && is2SubsetOf1)
          analysisResults.push(
            `🔹 <strong class="text-purple-400">${set1.letter} e ${set2.letter} são Iguais</strong> (${set1.letter} = ${set2.letter}).`
          );
      }
    }
  }
  elements.setsAnalysisList.innerHTML = analysisResults.join(
    '<hr class="my-2 border-gray-700">'
  );
}

/** Gera uma fórmula de desafio aleatória */
function generateChallenge() {
  const types = [...POKEMON_TYPES].sort(() => 0.5 - Math.random()).slice(0, 3);
  const ops = ["∪", "∩", "\\"];
  const op1 = ops[Math.floor(Math.random() * 2)],
    op2 = ops[Math.floor(Math.random() * 3)];
  const formula = `(${types[0]} ${op1} ${types[1]}) ${op2} ${types[2]}`;
  elements.formulaInput.value = formula;
  parseFormulaAndApply();
}

/** Copia a URL com a fórmula atual para o clipboard */
function handleShareClick() {
  const formula = elements.formulaInput.value;
  if (!formula) return;
  const url = `${window.location.origin}${
    window.location.pathname
  }?formula=${encodeURIComponent(formula)}`;
  copyToClipboard(url, elements.shareBtn);
}

/** Copia os nomes dos Pokémon filtrados para o clipboard */
function handleExportClick() {
  if (currentFilteredPokemon.length === 0) return;
  const names = currentFilteredPokemon
    .map((p) => p.name.charAt(0).toUpperCase() + p.name.slice(1))
    .join("\n");
  copyToClipboard(names, elements.exportBtn);
}

/** Função auxiliar para copiar texto para o clipboard */
function copyToClipboard(text, buttonElement) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.top = "0";
  textArea.style.left = "0";
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

// --- INICIALIZAÇÃO ---
initializeApp();
