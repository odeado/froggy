import { COLS, ROWS, START_COL, START_ROW } from "./config.js";

// Paletas de color por "variante" de rana. "green" es la rana clásica de
// siempre (jugador 1 / un jugador) — sus valores son EXACTAMENTE los que ya
// existían, cero cambio visual. "blue" es la rana del segundo jugador en
// modo en línea: mismo diseño y mismo detalle, solo con la gama de color
// desplazada a azules, igual que hacen los temas por nivel con el resto del
// tablero.
const PALETTES = {
  green: {
    legs: "#3ab83a",
    bodyStops: ["#6be66b", "#42c742", "#2ba62b"],
    spots: "#228b22",
    eyeBump: "#42c742",
  },
  blue: {
    legs: "#3a8ab8",
    bodyStops: ["#6bb8e6", "#4295c7", "#2b6ea6"],
    spots: "#1f5f8b",
    eyeBump: "#4295c7",
  },
};

export class Frog {
  constructor(variant = "green") {
    this.variant = PALETTES[variant] ? variant : "green";
    this.reset();
  }

  reset() {
    this.col = START_COL;
    this.row = START_ROW;
    this.facing = "up";
    this.rideOffsetCells = 0;

    // Posición animada e interpolación de salto
    this.animCol = START_COL;
    this.animRow = START_ROW;
    this.jumpProgress = 1; // 1 = en el suelo (reposo), <1 = en el aire (saltando)
  }

  move(dir) {
    let { row, col } = this;
    if (dir === "up") row -= 1;
    else if (dir === "down") row += 1;
    else if (dir === "left") col -= 1;
    else if (dir === "right") col += 1;
    else return false;

    if (row < 0 || row > ROWS - 1) return false;
    if (col < 0 || col > COLS - 1) return false;

    this.animCol = this.col;
    this.animRow = this.row;
    this.row = row;
    this.col = col;
    this.facing = dir;
    this.rideOffsetCells = 0;
    this.jumpProgress = 0; // Inicia animación de salto
    return true;
  }

  // Coloca la rana directamente en una celda (sin pasar por move()),
  // disparando la misma animación de salto si la celda cambió. Se usa para
  // la rana "fantasma" del rival en modo en línea, cuya posición llega por
  // red en vez de por input local.
  setPosition(col, row, facing) {
    if (col === this.col && row === this.row) return;
    this.animCol = this.col;
    this.animRow = this.row;
    this.col = col;
    this.row = row;
    if (facing) this.facing = facing;
    this.rideOffsetCells = 0;
    this.jumpProgress = 0;
  }

  update(dt) {
    if (this.jumpProgress < 1) {
      this.jumpProgress += dt * 10; // Salto rápido y responsivo (100ms)
      if (this.jumpProgress > 1) {
        this.jumpProgress = 1;
      }
    }
  }

  draw(ctx, cellSize, opts = {}) {
    const palette = PALETTES[this.variant];
    const alpha = opts.alpha !== undefined ? opts.alpha : 1;

    // Interpolación de posición (de animCol/Row a col/row)
    const t = this.jumpProgress;
    const currentCol = this.animCol + (this.col - this.animCol) * t;
    const currentRow = this.animRow + (this.row - this.animRow) * t;

    const baseX = (currentCol + this.rideOffsetCells) * cellSize;
    const baseY = currentRow * cellSize;

    // Arco de salto vertical (sube y baja)
    const jumpArc = Math.sin(t * Math.PI) * (cellSize * 0.25);
    const x = baseX;
    const y = baseY - jumpArc;

    ctx.save();
    if (alpha !== 1) ctx.globalAlpha = alpha;

    // Sombra en el suelo mientras salta
    if (jumpArc > 1) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
      ctx.beginPath();
      ctx.ellipse(
        baseX + cellSize / 2,
        baseY + cellSize * 0.8,
        cellSize * 0.35 * (1 - jumpArc / (cellSize * 0.5)),
        cellSize * 0.15,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    const cx = x + cellSize / 2;
    const cy = y + cellSize / 2;
    const size = cellSize * 0.78;
    const r = size / 2;

    // Rotación según orientación
    ctx.translate(cx, cy);
    let angle = 0;
    if (this.facing === "right") angle = Math.PI / 2;
    else if (this.facing === "down") angle = Math.PI;
    else if (this.facing === "left") angle = -Math.PI / 2;
    ctx.rotate(angle);

    // Patas traseras (ancas)
    ctx.fillStyle = palette.legs;
    ctx.beginPath();
    ctx.ellipse(-r * 0.6, r * 0.4, r * 0.35, r * 0.5, -0.4, 0, Math.PI * 2);
    ctx.ellipse(r * 0.6, r * 0.4, r * 0.35, r * 0.5, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Patas delanteras
    ctx.beginPath();
    ctx.ellipse(-r * 0.6, -r * 0.3, r * 0.2, r * 0.35, 0.3, 0, Math.PI * 2);
    ctx.ellipse(r * 0.6, -r * 0.3, r * 0.2, r * 0.35, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Cuerpo (óvalo vibrante)
    const bodyGradient = ctx.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.1, 0, 0, r);
    bodyGradient.addColorStop(0, palette.bodyStops[0]);
    bodyGradient.addColorStop(0.7, palette.bodyStops[1]);
    bodyGradient.addColorStop(1, palette.bodyStops[2]);

    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.75, r * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();

    // Patrón/Manchas en la espalda
    ctx.fillStyle = palette.spots;
    ctx.beginPath();
    ctx.arc(0, r * 0.2, r * 0.18, 0, Math.PI * 2);
    ctx.arc(-r * 0.25, 0, r * 0.12, 0, Math.PI * 2);
    ctx.arc(r * 0.25, 0, r * 0.12, 0, Math.PI * 2);
    ctx.fill();

    // Protuberancias de los ojos
    ctx.fillStyle = palette.eyeBump;
    ctx.beginPath();
    ctx.arc(-r * 0.42, -r * 0.65, r * 0.3, 0, Math.PI * 2);
    ctx.arc(r * 0.42, -r * 0.65, r * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Globos oculares blancos
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(-r * 0.42, -r * 0.68, r * 0.22, 0, Math.PI * 2);
    ctx.arc(r * 0.42, -r * 0.68, r * 0.22, 0, Math.PI * 2);
    ctx.fill();

    // Pupilas negras
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(-r * 0.42, -r * 0.74, r * 0.1, 0, Math.PI * 2);
    ctx.arc(r * 0.42, -r * 0.74, r * 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Brillo en ojos
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(-r * 0.46, -r * 0.78, r * 0.04, 0, Math.PI * 2);
    ctx.arc(r * 0.38, -r * 0.78, r * 0.04, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Dibuja una ranita en reposo para una meta ya alcanzada
  static drawMiniFrog(ctx, cx, cy, cellSize) {
    const r = cellSize * 0.28;
    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = "#42c742";
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.85, r * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ojos
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(-r * 0.4, -r * 0.5, r * 0.25, 0, Math.PI * 2);
    ctx.arc(r * 0.4, -r * 0.5, r * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(-r * 0.4, -r * 0.55, r * 0.12, 0, Math.PI * 2);
    ctx.arc(r * 0.4, -r * 0.55, r * 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
