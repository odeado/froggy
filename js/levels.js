import { ROAD_ROWS, RIVER_ROWS } from "./config.js";

const CAR_COLORS = ["#e04b4b", "#e0a64b", "#c94be0", "#e0d84b"];
const TRUCK_COLOR = "#4b7be0";
const LOG_COLOR = "#8a5a2b";
const CROC_COLOR = "#2f6b2f";
const CROC_HEAD_COLOR = "#1c4a1c";

// Configuración de la carretera para un nivel dado.
//
// Importante: la rana entra a la carretera desde abajo, así que el primer
// carril que cruza es el ÚLTIMO de ROAD_ROWS (el más cercano a la salida).
// Por eso la dificultad (velocidad) se calcula con un índice invertido:
// el carril más cercano a la salida es el más lento/fácil, y va subiendo
// hasta el más rápido justo antes del camellón. Niveles futuros (Fase 6)
// subirán speedMultiplier y bajarán los gaps para aumentar la dificultad.
export function buildRoadConfig(levelNumber) {
  // Nivel 1 bien pausado a propósito (feedback: "siento que se muere solo") —
  // sube gradualmente con cada nivel (Fase 6 conecta esto al conteo de nivel).
  const speedMultiplier = 1 + (levelNumber - 1) * 0.18;
  const n = ROAD_ROWS.length;

  return ROAD_ROWS.map((row, i) => {
    const difficulty = n - 1 - i; // 0 = carril más cercano a la salida (fácil)
    const isTruck = i % 2 === 1;
    return {
      row,
      direction: i % 2 === 0 ? 1 : -1,
      speedCellsPerSec: (0.7 + difficulty * 0.2) * speedMultiplier,
      lengthCells: isTruck ? 2 : 1,
      gapCells: isTruck ? 4 : 3.5,
      color: isTruck ? TRUCK_COLOR : CAR_COLORS[i % CAR_COLORS.length],
    };
  });
}

// Configuración del río para un nivel dado.
// La fila del medio (índice 2) trae cocodrilos; el resto son troncos.
// Mismo criterio que la carretera: la rana entra al río desde el camellón,
// así que el primer carril que cruza es el ÚLTIMO de RIVER_ROWS; ese debe
// ser el más lento, subiendo en dificultad hacia la fila de metas.
export function buildRiverConfig(levelNumber) {
  const speedMultiplier = 1 + (levelNumber - 1) * 0.15;
  const kinds = ["log", "log", "croc", "log", "log"];
  const n = RIVER_ROWS.length;

  return RIVER_ROWS.map((row, i) => {
    const difficulty = n - 1 - i; // 0 = carril más cercano al camellón (fácil)
    const kind = kinds[i % kinds.length];
    const isCroc = kind === "croc";
    return {
      row,
      direction: i % 2 === 0 ? -1 : 1,
      speedCellsPerSec: (0.55 + difficulty * 0.15) * speedMultiplier,
      lengthCells: isCroc ? 2 : i % 2 === 0 ? 3 : 2,
      gapCells: 2.3,
      kind,
      color: isCroc ? CROC_COLOR : LOG_COLOR,
      headColor: isCroc ? CROC_HEAD_COLOR : undefined,
    };
  });
}
