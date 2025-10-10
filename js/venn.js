// Módulo do Venn: Isola toda a lógica de criação e atualização do diagrama de Venn.

import { elements } from "./dom.js";

let vennTooltip = null;

/** Atualiza o diagrama de Venn com base nos filtros ativos */
export function updateVennDiagram(allPokemon, activeFilters) {
  updateVennSetsList(allPokemon, activeFilters);
  updateSetsAnalysis(allPokemon, activeFilters);

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

  div
    .selectAll("g")
    .filter((d) => d && Array.isArray(d.sets))
    .attr("class", (d) => "venn-area venn-circle-" + d.sets.join("-"))
    .on("mouseover", function (d) {
      venn.sortAreas(div, d);
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
      d3.select(this)
        .transition("tooltip")
        .duration(400)
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
      d3.select(this)
        .transition("tooltip")
        .duration(400)
        .select("path")
        .style("fill-opacity", d.sets.length == 1 ? 0.25 : 0)
        .style("stroke-opacity", 0);
    });
}

/** Atualiza a lista com a definição formal de cada conjunto */
function updateVennSetsList(allPokemon, activeFilters) {
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

  let operationsHtml = "";
  if (uniqueTypes.length >= 2) {
    operationsHtml =
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

        const intersection = new Set(
          [...set1.elements].filter((id) => set2.elements.has(id))
        );
        operationsHtml += `<div class="flex flex-wrap items-baseline mb-2"><div class="w-full sm:w-1/4 font-bold text-red-400">${
          set1.letter
        } ∩ ${set2.letter}</div><div class="w-full sm:w-1/4 text-gray-400">|${
          set1.letter
        }∩${set2.letter}| = ${
          intersection.size
        }</div><div class="w-full sm:w-1/2 break-words">= {${
          [...intersection].sort((a, b) => a - b).join(", ") || "∅"
        }}</div></div>`;

        const union = new Set([...set1.elements, ...set2.elements]);
        operationsHtml += `<div class="flex flex-wrap items-baseline mb-2"><div class="w-full sm:w-1/4 font-bold text-blue-400">${
          set1.letter
        } ∪ ${set2.letter}</div><div class="w-full sm:w-1/4 text-gray-400">|${
          set1.letter
        }∪${set2.letter}| = ${
          union.size
        }</div><div class="w-full sm:w-1/2 break-words">= {${[...union]
          .sort((a, b) => a - b)
          .join(", ")}}</div></div>`;

        const diff1 = new Set(
          [...set1.elements].filter((id) => !set2.elements.has(id))
        );
        operationsHtml += `<div class="flex flex-wrap items-baseline mb-2"><div class="w-full sm:w-1/4 font-bold text-green-400">${
          set1.letter
        } \\ ${set2.letter}</div><div class="w-full sm:w-1/4 text-gray-400">|${
          set1.letter
        }\\${set2.letter}| = ${
          diff1.size
        }</div><div class="w-full sm:w-1/2 break-words">= {${
          [...diff1].sort((a, b) => a - b).join(", ") || "∅"
        }}</div></div>`;

        const diff2 = new Set(
          [...set2.elements].filter((id) => !set1.elements.has(id))
        );
        operationsHtml += `<div class="flex flex-wrap items-baseline"><div class="w-full sm:w-1/4 font-bold text-green-400">${
          set2.letter
        } \\ ${set1.letter}</div><div class="w-full sm:w-1/4 text-gray-400">|${
          set2.letter
        }\\${set1.letter}| = ${
          diff2.size
        }</div><div class="w-full sm:w-1/2 break-words">= {${
          [...diff2].sort((a, b) => a - b).join(", ") || "∅"
        }}</div></div>`;
      }
    }
  }

  elements.vennSetsList.innerHTML = setsHtml + operationsHtml;
}

/** Analisa e classifica os conjuntos selecionados */
function updateSetsAnalysis(allPokemon, activeFilters) {
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

  if (uniqueTypes.length < 1) {
    elements.setsAnalysisList.innerHTML =
      '<p class="text-gray-500">Selecione pelo menos um conjunto para análise.</p>';
    return;
  }

  let analysisResults = [
    `🌍 <strong class="text-yellow-400">Conjunto Universo (U)</strong>, |U|=${allPokemon.length}`,
  ];

  sets.forEach((set) => {
    analysisResults.push(
      `🔹 <strong class="text-yellow-400">Complementar de ${
        set.letter
      } (Aᶜ)</strong>: Contém ${
        allPokemon.length - set.elements.size
      } Pokémon que não são do tipo ${set.name}.`
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
        );
        const is2SubsetOf1 = [...set2.elements].every((id) =>
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
