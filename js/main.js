import {
  COLS,
  ROWS,
  GOAL_ROW,
  GOAL_COLS,
  RIVER_ROWS,
  MEDIAN_ROW,
  ROAD_ROWS,
  START_ROW,
  INITIAL_LIVES,
} from "./config.js";
import { Frog } from "./frog.js";
import { setupInput } from "./input.js";
import { updateHud, showGameOver, hideGameOver, onRestart } from "./ui.js";
import { getHighScore, setHighScoreIfBetter } from "./storage.js";
import { createLanesFromConfig } from "./obstacles.js";
import { buildRoadConfig } from "./levels.js";

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const state = {
  lives: INITIAL_LIVES,
  score: 0,
  level: 1,
  cellSize: 40,
  gameOver: false,
};

const frog = new Frog();
let lanes = createLanesFromConfig(buildRoadConfig(state.level));

const ZONE_COLORS = {
  start: "#274b2e",
  road: "#2b2b2b",
  median: "#2f4d33",
  river: "#1f4f73",
  goal: "#1f4f73",
};

function resizeCanvas() {
  const wrap = document.getElementById("canvas-wrap");
  const maxW = wrap.clientWidth - 8;
  const maxH = wrap.clientHeight - 8;

  const cellFromWidth = Math.floor(maxW / COLS);
  const cellFromHeight = Math.floor(maxH / ROWS);
  const cellSize = Math.max(20, Math.min(cellFromWidth, cellFromHeight, 64));

  state.cellSize = cellSize;
  canvas.width = cellSize * COLS;
  canvas.height = cellSize * ROWS;
}

function rowColor(row) {
  if (row === GOAL_ROW) return ZONE_COLORS.goal;
  if (RIVER_ROWS.includes(row)) return ZONE_COLORS.river;
  if (row === MEDIAN_ROW) return ZONE_COLORS.median;
  if (ROAD_ROWS.includes(row)) return ZONE_COLORS.road;
  if (row === START_ROW) return ZONE_COLORS.start;
  return "#000";
}

function drawBoard() {
  const { cellSize } = state;

  for (let row = 0; row < ROWS; row++) {
    ctx.fillStyle = rowColor(row);
    ctx.fillRect(0, row * cellSize, COLS * cellSize, cellSize);
  }

  // Divisores de carril sutiles en la carretera.
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  for (const row of ROAD_ROWS) {
    ctx.beginPath();
    ctx.moveTo(0, row * cellSize + cellSize / 2);
    ctx.lineTo(COLS * cellSize, row * cellSize + cellSize / 2);
    ctx.stroke();
  }

  // Casilleros de meta (5 lily pads) sobre la fila de metas.
  const pad = cellSize * 0.12;
  ctx.fillStyle = "#6fbf6f";
  for (const col of GOAL_COLS) {
    ctx.beginPath();
    const cx = col * cellSize + cellSize / 2;
    const cy = GOAL_ROW * cellSize + cellSize / 2;
    ctx.arc(cx, cy, cellSize / 2 - pad, 0, Math.PI * 2);
    ctx.fill();
  }
}

function handleGoalCheck() {
  if (frog.row !== GOAL_ROW) return;

  if (GOAL_COLS.includes(frog.col)) {
    // Placeholder de puntaje: la lógica completa de metas/nivel llega en la Fase 4.
    state.score += 50;
    setHighScoreIfBetter(state.score);
    updateHud({ score: state.score });
    frog.reset();
  }
}

function checkRoadCollision() {
  for (const lane of lanes) {
    if (lane.collidesWithCell(frog.col, frog.row)) {
      loseLife();
      return;
    }
  }
}

function loseLife() {
  state.lives -= 1;
  updateHud({ lives: state.lives });
  if (state.lives <= 0) {
    triggerGameOver();
  } else {
    frog.reset();
  }
}

function triggerGameOver() {
  state.gameOver = true;
  const best = getHighScore();
  showGameOver(state.score, best);
}

function resetGame() {
  state.lives = INITIAL_LIVES;
  state.score = 0;
  state.level = 1;
  state.gameOver = false;
  frog.reset();
  lanes = createLanesFromConfig(buildRoadConfig(state.level));
  updateHud({ lives: state.lives, score: state.score, level: state.level });
  hideGameOver();
}

function onDirection(dir) {
  if (state.gameOver) return;
  const moved = frog.move(dir);
  if (moved) {
    handleGoalCheck();
    checkRoadCollision();
  }
}

function render() {
  drawBoard();
  for (const lane of lanes) lane.draw(ctx, state.cellSize);
  frog.draw(ctx, state.cellSize);
}

function init() {
  resizeCanvas();
  window.addEventListener("resize", () => {
    resizeCanvas();
    render();
  });
  window.addEventListener("orientationchange", () => {
    setTimeout(() => {
      resizeCanvas();
      render();
    }, 100);
  });

  updateHud({ lives: state.lives, score: state.score, level: state.level });
  setupInput(onDirection);
  onRestart(resetGame);

  let lastTime = performance.now();

  function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    if (!state.gameOver) {
      for (const lane of lanes) lane.update(dt);
      checkRoadCollision();
    }

    render();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

init();
