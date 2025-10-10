// --- MÓDULO PRINCIPAL ---
// Orquestra a aplicação, gerencia o estado e conecta todos os outros módulos.

import { GENERATION_RANGES, POKEMON_TYPES } from "./config.js";
import { elements } from "./dom.js";
import { fetchAllPokemon } from "./api.js";
import {
  renderPokemon,
  showPokemonDetails,
  closeModal,
  createFilterCheckboxes,
  updateFilterFormulaDisplay,
  handleOperatorButtonClick,
  copyToClipboard,
} from "./ui.js";
import { updateVennDiagram } from "./venn.js";
import {
  filterPokemon,
  parseFormula,
  generateFormulaFromFilters,
} from "./filters.js";

// --- ESTADO DA APLICAÇÃO ---
let allPokemon = [];
let currentFilteredPokemon = [];
let activeFilters = {
  intersection: [],
  union: [],
  difference: [],
};

// --- FUNÇÕES DE ORQUESTRAÇÃO ---

/** Inicializa a aplicação */
async function initializeApp() {
  createFilterCheckboxes();
  setupEventListeners();
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("formula")) {
    elements.formulaInput.value = decodeURIComponent(urlParams.get("formula"));
  }
  await loadGeneration(elements.generationSelector.value);
  if (elements.formulaInput.value) {
    parseFormulaAndApply();
  }
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

/** Aplica os filtros ativos à lista de Pokémon e atualiza a UI */
function applyFilters() {
  currentFilteredPokemon = filterPokemon(allPokemon, activeFilters);
  renderPokemon(currentFilteredPokemon, allPokemon.length, showPokemonDetails);
  updateFilterFormulaDisplay();
  updateVennDiagram(allPokemon, activeFilters);
}

// --- MANIPULADORES DE EVENTOS E AÇÕES ---

/** Lida com a mudança de estado de um checkbox de filtro */
function handleFilterChange(event) {
  const { type, filter } = event.target.dataset;
  const isChecked = event.target.checked;
  const filterArray = activeFilters[filter];

  if (isChecked) {
    filterArray.push(type);
  } else {
    activeFilters[filter] = filterArray.filter((t) => t !== type);
  }
  syncFormulaInputFromUI();
  applyFilters();
}

/** Interpreta a fórmula do input e aplica os filtros */
function parseFormulaAndApply() {
  activeFilters = parseFormula(elements.formulaInput.value);
  syncUIFromFilters();
  applyFilters();
}

/** Limpa todos os filtros e reseta o estado */
function resetFilters() {
  activeFilters = { intersection: [], union: [], difference: [] };
  document
    .querySelectorAll('input[type="checkbox"]')
    .forEach((cb) => (cb.checked = false));
  elements.formulaInput.value = "";
  applyFilters();
}

/** Sincroniza o input da fórmula a partir dos checkboxes */
function syncFormulaInputFromUI() {
  elements.formulaInput.value = generateFormulaFromFilters(activeFilters);
}

/** Sincroniza os checkboxes a partir dos filtros ativos */
function syncUIFromFilters() {
  document.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    const { type, filter } = cb.dataset;
    cb.checked = activeFilters[filter].includes(type);
  });
}

/** Gera uma fórmula de desafio aleatória */
function generateChallenge() {
  const types = [...POKEMON_TYPES].sort(() => 0.5 - Math.random()).slice(0, 3);
  const ops = ["∪", "∩", "\\"];
  const op1 = ops[Math.floor(Math.random() * 2)];
  const op2 = ops[Math.floor(Math.random() * 3)];
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

/** Configura todos os event listeners da aplicação */
function setupEventListeners() {
  document
    .querySelectorAll('input[type="checkbox"]')
    .forEach((c) => c.addEventListener("change", handleFilterChange));
  elements.resetButton.addEventListener("click", resetFilters);
  elements.formulaSearchBtn.addEventListener("click", parseFormulaAndApply);
  elements.formulaInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") parseFormulaAndApply();
  });
  elements.modal.addEventListener("click", (e) => {
    if (e.target === elements.modal) closeModal();
  });
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

initializeApp();
