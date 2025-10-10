// Módulo do DOM: Centraliza a captura de todos os elementos da página.

export const elements = {
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
