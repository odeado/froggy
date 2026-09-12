import { ROAD_ROWS } from "./config.js";

const CAR_COLORS = ["#e04b4b", "#e0a64b", "#c94be0", "#e0d84b"];
const TRUCK_COLOR = "#4b7be0";

// Configuración de la carretera para un nivel dado.
// Niveles futuros (Fase 6) subirán speedMultiplier y bajarán los gaps para
// aumentar la dificultad; por ahora solo el Nivel 1 está afinado a mano.
export function buildRoadConfig(levelNumber) {
  const speedMultiplier = 1 + (levelNumber - 1) * 0.15;

  return ROAD_ROWS.map((row, i) => {
    const isTruck = i % 2 === 1;
    return {
      row,
      direction: i % 2 === 0 ? 1 : -1,
      speedCellsPerSec: (1.1 + i * 0.35) * speedMultiplier,
      lengthCells: isTruck ? 2 : 1,
      gapCells: isTruck ? 3 : 2.5,
      color: isTruck ? TRUCK_COLOR : CAR_COLORS[i % CAR_COLORS.length],
    };
  });
}
