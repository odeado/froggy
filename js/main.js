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
  TURN_SECONDS,
} from "./config.js";
import { Frog } from "./frog.js";
import { setupInput } from "./input.js";
import { updateHud, updateTimerBar, showGameOver, hideGameOver, onRestart, setupAudioToggle } from "./ui.js";
import { getHighScore, setHighScoreIfBetter } from "./storage.js";
import { createLanesFromConfig } from "./obstacles.js";
import { createRiverLanesFromConfig } from "./river.js";
import { buildRoadConfig, buildRiverConfig } from "./levels.js";
import { audio } from "./audio.js";
import { effects } from "./particles.js";

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const state = {
  lives: INITIAL_LIVES,
  score: 0,
  level: 1,
  cellSize: 40,
  gameOver: false,
  timer: TURN_SECONDS,
  goalsFilled: [false, false, false, false, false],
};

const frog = new Frog();
let lanes = createLanesFromConfig(buildRoadConfig(state.level));
let riverLanes = createRiverLanesFromConfig(buildRiverConfig(state.level));

function resizeCanvas() {
  const wrap = document.getElementById("canvas-wrap");
  const maxW = wrap.clientWidth - 8;
  const maxH = wrap.clientHeight - 8;

  const cellFromWidth = Math.floor(maxW / COLS);
  const cellFromHeight = Math.floor(maxH / ROWS);
  const cellSize = Math.max(24, Math.min(cellFromWidth, cellFromHeight, 64));

  state.cellSize = cellSize;
  canvas.width = cellSize * COLS;
  canvas.height = cellSize * ROWS;
}

let waterAnimOffset = 0;

function drawBoard(dt) {
  const { cellSize } = state;
  waterAnimOffset += dt * 20;

  for (let row = 0; row < ROWS; row++) {
    const y = row * cellSize;

    if (row === START_ROW || row === MEDIAN_ROW) {
      // Zona de césped segura con patrón de textura
      ctx.fillStyle = row === START_ROW ? "#224727" : "#284f2e";
      ctx.fillRect(0, y, COLS * cellSize, cellSize);

      // Pequeñas briznas de hierba decorativas
      ctx.fillStyle = "#34663c";
      for (let c = 0; c < COLS; c++) {
        const cx = c * cellSize;
        ctx.fillRect(cx + 6, y + 8, 3, 6);
        ctx.fillRect(cx + cellSize - 10, y + cellSize - 12, 3, 5);
      }
    } else if (ROAD_ROWS.includes(row)) {
      // Asfalto
      ctx.fillStyle = "#1e2228";
      ctx.fillRect(0, y, COLS * cellSize, cellSize);

      // Líneas divisorias de carril (punteadas amarillas/blancas)
      ctx.strokeStyle = "rgba(240, 220, 100, 0.25)";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(0, y + cellSize);
      ctx.lineTo(COLS * cellSize, y + cellSize);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (RIVER_ROWS.includes(row) || row === GOAL_ROW) {
      // Agua del río animada
      ctx.fillStyle = "#113854";
      ctx.fillRect(0, y, COLS * cellSize, cellSize);

      // Ondas de agua celestes flotantes
      ctx.strokeStyle = "rgba(120, 210, 255, 0.15)";
      ctx.lineWidth = 1.5;
      for (let c = 0; c < COLS + 1; c++) {
        const waveX = (c * cellSize + (waterAnimOffset % cellSize)) % (COLS * cellSize);
        ctx.beginPath();
        ctx.arc(waveX, y + cellSize * 0.4, 8, 0, Math.PI);
        ctx.stroke();
      }
    }
  }

  // Dibujar casilleros de meta (5 lily pads)
  for (let i = 0; i < GOAL_COLS.length; i++) {
    const col = GOAL_COLS[i];
    const cx = col * cellSize + cellSize / 2;
    const cy = GOAL_ROW * cellSize + cellSize / 2;
    const padR = cellSize * 0.4;

    // Hoja de lirio (Lily pad)
    ctx.fillStyle = "#3fa852";
    ctx.beginPath();
    ctx.arc(cx, cy, padR, 0.3, Math.PI * 1.8);
    ctx.lineTo(cx, cy);
    ctx.closePath();
    ctx.fill();

    // Flor o muesca
    ctx.fillStyle = "#2d803c";
    ctx.beginPath();
    ctx.arc(cx, cy, padR * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Si la meta está ocupada, dibujar la ranita descansando arriba
    if (state.goalsFilled[i]) {
      Frog.drawMiniFrog(ctx, cx, cy, cellSize);
    }
  }
}

function handleGoalCheck() {
  if (frog.row !== GOAL_ROW) return;

  const goalIndex = GOAL_COLS.indexOf(frog.col);
  const frogX = (frog.col + 0.5) * state.cellSize;
  const frogY = (frog.row + 0.5) * state.cellSize;

  if (goalIndex !== -1) {
    if (state.goalsFilled[goalIndex]) {
      // Meta ya ocupada -> la rana cae al agua circundante
      loseLife("water");
    } else {
      // ¡Meta alcanzada exitosamente!
      state.goalsFilled[goalIndex] = true;

      // Puntos por meta + Bonificación por tiempo sobrante
      const timeBonus = Math.floor(state.timer * 10);
      const pointsGained = 50 + timeBonus;
      state.score += pointsGained;

      setHighScoreIfBetter(state.score);
      updateHud({ score: state.score });

      audio.playGoal();
      effects.addGoalBurst(frogX, frogY);

      // Comprobar si completó las 5 metas del nivel
      if (state.goalsFilled.every(Boolean)) {
        handleLevelComplete();
      } else {
        frog.reset();
        state.timer = TURN_SECONDS;
      }
    }
  } else {
    // Cayó en agua en la fila de metas (columnas 0 o COLS-1)
    loseLife("water");
  }
}

function handleLevelComplete() {
  state.level += 1;
  state.score += 1000; // Bono de nivel
  setHighScoreIfBetter(state.score);
  updateHud({ score: state.score, level: state.level });

  audio.playLevelUp();
  effects.addGoalBurst(canvas.width / 2, canvas.height / 2);

  // Reiniciar metas para el nuevo nivel
  state.goalsFilled = [false, false, false, false, false];

  // Reconstruir carriles con la nueva dificultad
  lanes = createLanesFromConfig(buildRoadConfig(state.level));
  riverLanes = createRiverLanesFromConfig(buildRiverConfig(state.level));

  frog.reset();
  state.timer = TURN_SECONDS;
}

function checkRoadCollision() {
  for (const lane of lanes) {
    if (lane.collidesWithCell(frog.col, frog.row)) {
      loseLife("road");
      return;
    }
  }
}

function checkRiverState(dt) {
  if (!RIVER_ROWS.includes(frog.row)) return;

  let support = null;
  for (const lane of riverLanes) {
    const s = lane.supportAt(frog.col, frog.row);
    if (s) {
      support = s;
      break;
    }
  }

  if (!support || support.safe === false) {
    loseLife("water");
    return;
  }

  frog.rideOffsetCells += support.dxPerSec * dt;
  while (frog.rideOffsetCells >= 1) {
    frog.col += 1;
    frog.rideOffsetCells -= 1;
  }
  while (frog.rideOffsetCells <= -1) {
    frog.col -= 1;
    frog.rideOffsetCells += 1;
  }

  if (frog.col < 0 || frog.col > COLS - 1) {
    loseLife("water");
  }
}

function loseLife(cause = "road") {
  const frogX = (frog.col + 0.5) * state.cellSize;
  const frogY = (frog.row + 0.5) * state.cellSize;

  if (cause === "water") {
    audio.playSplash();
    effects.addSplash(frogX, frogY);
  } else {
    audio.playCrash();
    effects.addCrash(frogX, frogY);
  }

  state.lives -= 1;
  updateHud({ lives: state.lives });

  if (state.lives <= 0) {
    triggerGameOver();
  } else {
    frog.reset();
    state.timer = TURN_SECONDS;
  }
}

function triggerGameOver() {
  state.gameOver = true;
  audio.playGameOver();
  const best = getHighScore();
  showGameOver(state.score, best);
}

function resetGame() {
  state.lives = INITIAL_LIVES;
  state.score = 0;
  state.level = 1;
  state.timer = TURN_SECONDS;
  state.gameOver = false;
  state.goalsFilled = [false, false, false, false, false];

  frog.reset();
  effects.reset();

  lanes = createLanesFromConfig(buildRoadConfig(state.level));
  riverLanes = createRiverLanesFromConfig(buildRiverConfig(state.level));

  updateHud({ lives: state.lives, score: state.score, level: state.level });
  updateTimerBar(state.timer, TURN_SECONDS);
  hideGameOver();
}

function onDirection(dir) {
  if (state.gameOver) return;
  const moved = frog.move(dir);
  if (moved) {
    audio.playJump();
    handleGoalCheck();
    checkRoadCollision();
    checkRiverState(0);
  }
}

function render(dt) {
  ctx.save();

  // Sacudida de pantalla en impactos
  effects.applyShakeTransform(ctx);

  drawBoard(dt);
  for (const lane of lanes) lane.draw(ctx, state.cellSize);
  for (const lane of riverLanes) lane.draw(ctx, state.cellSize);

  frog.draw(ctx, state.cellSize);
  effects.draw(ctx);

  ctx.restore();
}

function init() {
  resizeCanvas();
  window.addEventListener("resize", () => {
    resizeCanvas();
    render(0);
  });
  window.addEventListener("orientationchange", () => {
    setTimeout(() => {
      resizeCanvas();
      render(0);
    }, 100);
  });

  updateHud({ lives: state.lives, score: state.score, level: state.level });
  updateTimerBar(state.timer, TURN_SECONDS);
  setupInput(onDirection);
  onRestart(resetGame);
  setupAudioToggle(() => audio.toggleMute());

  let lastTime = performance.now();

  function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    if (!state.gameOver) {
      // Actualizar temporizador de turno
      state.timer -= dt;
      if (state.timer <= 0) {
        state.timer = 0;
        loseLife("water");
      }
      updateTimerBar(state.timer, TURN_SECONDS);

      // Actualizar entidades y animaciones
      frog.update(dt);
      effects.update(dt);

      for (const lane of lanes) lane.update(dt);
      for (const lane of riverLanes) lane.update(dt);

      checkRoadCollision();
      checkRiverState(dt);
    }

    render(dt);
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

init();
