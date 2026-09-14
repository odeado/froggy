import { COLS } from "./config.js";

export class Platform {
  constructor({ xCells, lengthCells, kind, color, headColor }) {
    this.xCells = xCells;
    this.lengthCells = lengthCells;
    this.kind = kind; // "log" | "croc"
    this.color = color;
    this.headColor = headColor;
  }
}

export class RiverLane {
  constructor({ row, direction, speedCellsPerSec, lengthCells, gapCells, kind, color, headColor }) {
    this.row = row;
    this.direction = direction; // 1 = derecha, -1 = izquierda
    this.speed = speedCellsPerSec;
    this.lengthCells = lengthCells;
    this.gapCells = gapCells;
    this.kind = kind;
    this.color = color;
    this.headColor = headColor;
    this.trackLength = 0;
    this.platforms = this._build();
  }

  _build() {
    const spacing = this.lengthCells + this.gapCells;
    const count = Math.ceil(COLS / spacing) + 1;
    this.trackLength = count * spacing;
    // Fase inicial aleatoria: evita que todos los carriles nazcan siempre
    // alineados de la misma forma respecto a la columna de salida.
    const phaseOffset = Math.random() * spacing;
    const platforms = [];
    for (let i = 0; i < count; i++) {
      platforms.push(
        new Platform({
          xCells: i * spacing + phaseOffset,
          lengthCells: this.lengthCells,
          kind: this.kind,
          color: this.color,
          headColor: this.headColor,
        })
      );
    }
    return platforms;
  }

  update(dt) {
    for (const p of this.platforms) {
      p.xCells += this.direction * this.speed * dt;
      if (this.direction > 0 && p.xCells > COLS) {
        p.xCells -= this.trackLength;
      } else if (this.direction < 0 && p.xCells + p.lengthCells < 0) {
        p.xCells += this.trackLength;
      }
    }
  }

  draw(ctx, cellSize) {
    const pad = cellSize * 0.08;
    for (const p of this.platforms) {
      const x = p.xCells * cellSize;
      const y = this.row * cellSize;
      const w = p.lengthCells * cellSize;

      ctx.fillStyle = p.color;
      ctx.fillRect(x + pad / 2, y + pad / 2, w - pad, cellSize - pad);

      if (this.kind === "croc") {
        const headW = cellSize - pad;
        const headX = this.direction > 0 ? x + w - headW - pad / 2 : x + pad / 2;
        ctx.fillStyle = p.headColor;
        ctx.fillRect(headX, y + pad / 2, headW, cellSize - pad);

        // Ojitos en la cabeza para distinguirla del tronco.
        ctx.fillStyle = "#eafbea";
        const eyeY = y + cellSize * 0.32;
        const eyeR = Math.max(1.5, cellSize * 0.055);
        const eyeSpread = cellSize * 0.18;
        const eyeCx = headX + headW / 2;
        ctx.beginPath();
        ctx.arc(eyeCx - eyeSpread, eyeY, eyeR, 0, Math.PI * 2);
        ctx.arc(eyeCx + eyeSpread, eyeY, eyeR, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Retorna null si (col,row) no está sobre esta fila o no hay plataforma (agua).
  // Si hay plataforma: { safe: boolean, dxPerSec } — safe=false es la cabeza de un cocodrilo.
  // El cuerpo (tronco o lomo de cocodrilo) da un pequeño margen de perdón para
  // que "quedarse pegado" al borde no se sienta como una caída injusta; la
  // cabeza del cocodrilo, en cambio, usa un margen algo más chico (más benigno)
  // que su ancho visual, no más grande.
  supportAt(col, row) {
    if (row !== this.row) return null;
    const bodyForgiveness = 0.18;
    for (const p of this.platforms) {
      const offsets = [0, -this.trackLength, this.trackLength];
      for (const offset of offsets) {
        const start = p.xCells + offset - bodyForgiveness;
        const end = start + p.lengthCells + bodyForgiveness * 2;
        if (col + 1 > start && col < end) {
          const dxPerSec = this.direction * this.speed;
          if (this.kind === "croc") {
            const headMargin = 0.12;
            const headStart = this.direction > 0 ? end - bodyForgiveness - 1 + headMargin : start + bodyForgiveness - headMargin;
            const headEnd = headStart + 1 - headMargin * 2;
            if (col + 1 > headStart && col < headEnd) {
              return { safe: false, dxPerSec };
            }
          }
          return { safe: true, dxPerSec };
        }
      }
    }
    return null;
  }
}

export function createRiverLanesFromConfig(laneConfigs) {
  return laneConfigs.map((cfg) => new RiverLane(cfg));
}
