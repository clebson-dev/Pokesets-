// Módulo do DOM: Centraliza a captura de todos os elementos da página.

export const elements = {
  loader:             document.getElementById("loader"),
  pokedex:            document.getElementById("pokedex"),
  shareBtn:           document.getElementById("share-btn"),
  exportBtn:          document.getElementById("export-btn"),
  resultsInfo:        document.getElementById("results-info"),
  resetButton:        document.getElementById("reset-button"),
  vennDiagram:        document.getElementById("venn-diagram"),
  formulaInput:       document.getElementById("formula-input"),
  modal:              document.getElementById("pokemon-modal"),
  modalContent:       document.getElementById("modal-content"),
  challengeBtn:       document.getElementById("challenge-btn"),
  vennSetsList:       document.getElementById("venn-sets-list"),
  formulaDisplay:     document.getElementById("formula-display"),
  formulaContainer:   document.getElementById("formula-container"),
  formulaSearchBtn:   document.getElementById("formula-search-btn"),
  setsAnalysisList:   document.getElementById("sets-analysis-list"),
  toggleFiltersBtn:   document.getElementById("toggle-filters-btn"),
  generationSelector: document.getElementById("generation-selector"),
  manualFiltersPanel: document.getElementById("manual-filters-panel"),
  filterContainers: {
    union:        document.getElementById("union-filters"),
    difference:   document.getElementById("difference-filters"),
    intersection: document.getElementById("intersection-filters"),
  },
};
