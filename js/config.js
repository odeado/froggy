// Configuración de la grilla del juego.
// Filas numeradas de arriba (0) hacia abajo. La rana avanza restando fila.
export const COLS = 7;
export const ROWS = 13;

export const GOAL_ROW = 0;
export const RIVER_ROWS = [1, 2, 3, 4, 5];
export const MEDIAN_ROW = 6;
export const ROAD_ROWS = [7, 8, 9, 10, 11];
export const START_ROW = 12;

// Columnas donde existen las 5 metas dentro de la fila de metas (GOAL_ROW).
// Deja una columna de "agua" a cada lado (0 y COLS-1) que no es aterrizable.
export const GOAL_COLS = [1, 2, 3, 4, 5];

export const START_COL = Math.floor(COLS / 2);

export const INITIAL_LIVES = 3;
export const TURN_SECONDS = 30;

export function zoneForRow(row) {
  if (row === GOAL_ROW) return "goal";
  if (RIVER_ROWS.includes(row)) return "river";
  if (row === MEDIAN_ROW) return "median";
  if (ROAD_ROWS.includes(row)) return "road";
  if (row === START_ROW) return "start";
  return "unknown";
}
