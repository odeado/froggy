import { COLS } from "./config.js";

// Ciclo de las tortugas: cuánto tiempo están a flote (pisables) antes de
// sumergirse, cuánto dura sumergidas (no pisables), y cuánto dura el aviso
// parpadeante justo antes de que se sumerjan.
const TURTLE_VISIBLE_SEC = 4.2;
const TURTLE_SUBMERGE_SEC = 1.3;
const TURTLE_WARN_SEC = 0.7;

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
    this.cycleTime = 0;
    this.platforms = this._build();
  }

  // Estado actual del ciclo de sumergido, solo aplica a carriles de tortugas.
  _turtleState() {
    const total = TURTLE_VISIBLE_SEC + TURTLE_SUBMERGE_SEC;
    const t = this.cycleTime % total;
    const submerged = t >= TURTLE_VISIBLE_SEC;
    const warning = !submerged && t >= TURTLE_VISIBLE_SEC - TURTLE_WARN_SEC;
    return { submerged, warning };
  }

  _build() {
    const spacing = this.lengthCells + this.gapCells;
    const count = Math.ceil(COLS / spacing) + 1;
    this.trackLength = count * spacing;
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
    if (this.kind === "turtle") {
      this.cycleTime += dt;
    }
  }

  draw(ctx, cellSize) {
    const padY = cellSize * 0.12;
    const h = cellSize - padY * 2;

    for (const p of this.platforms) {
      const x = p.xCells * cellSize;
      const y = this.row * cellSize + padY;
      const w = p.lengthCells * cellSize;

      ctx.save();

      if (this.kind === "log") {
        // Tronco de madera realista con corteza y vetas
        ctx.fillStyle = "#7a481f";
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, h / 2);
        ctx.fill();

        // Extremos con anillos de madera
        ctx.fillStyle = "#b87c4d";
        ctx.beginPath();
        ctx.arc(x + h / 2, y + h / 2, h * 0.42, 0, Math.PI * 2);
        ctx.arc(x + w - h / 2, y + h / 2, h * 0.42, 0, Math.PI * 2);
        ctx.fill();

        // Anillo interior
        ctx.strokeStyle = "#593313";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x + h / 2, y + h / 2, h * 0.22, 0, Math.PI * 2);
        ctx.arc(x + w - h / 2, y + h / 2, h * 0.22, 0, Math.PI * 2);
        ctx.stroke();

        // Líneas de corteza longitudinales
        ctx.strokeStyle = "rgba(0,0,0,0.18)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + h, y + h * 0.3);
        ctx.lineTo(x + w - h, y + h * 0.3);
        ctx.moveTo(x + h * 1.2, y + h * 0.7);
        ctx.lineTo(x + w - h * 1.2, y + h * 0.7);
        ctx.stroke();
      } else if (this.kind === "croc") {
        // Cocodrilo
        const headW = cellSize;
        const headX = this.direction > 0 ? x + w - headW : x;
        const bodyW = w - headW;
        const bodyX = this.direction > 0 ? x : x + headW;

        // Cuerpo verde oscuro con escamas
        ctx.fillStyle = "#2d702d";
        ctx.beginPath();
        ctx.roundRect(bodyX, y + 2, bodyW, h - 4, 6);
        ctx.fill();

        // Escamas en el lomo
        ctx.fillStyle = "#1e4d1e";
        const scaleCount = Math.floor(bodyW / (cellSize * 0.3));
        for (let i = 0; i < scaleCount; i++) {
          const sx = bodyX + i * (cellSize * 0.3) + 4;
          ctx.beginPath();
          ctx.arc(sx, y + h * 0.3, 3, 0, Math.PI * 2);
          ctx.arc(sx, y + h * 0.7, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Cabeza del cocodrilo (Peligro si se pisa arriba)
        ctx.fillStyle = p.headColor || "#1b4d1b";
        ctx.beginPath();
        ctx.roundRect(headX, y, headW, h, 8);
        ctx.fill();

        // Mandíbula/Hocico
        ctx.fillStyle = "#e02b2b"; // Boca ligeramente entreabierta con aviso rojo
        const mouthX = this.direction > 0 ? headX + headW * 0.6 : headX;
        ctx.fillRect(mouthX, y + h * 0.45, headW * 0.4, 3);

        // Ojos amarillos amenazantes
        ctx.fillStyle = "#ffeb3b";
        const eyeSpread = h * 0.28;
        const eyeY = y + h * 0.3;
        const eyeX = this.direction > 0 ? headX + headW * 0.35 : headX + headW * 0.65;
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, 4, 0, Math.PI * 2);
        ctx.arc(eyeX, y + h * 0.7, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, 1.8, 0, Math.PI * 2);
        ctx.arc(eyeX, y + h * 0.7, 1.8, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.kind === "turtle") {
        const { submerged, warning } = this._turtleState();

        if (submerged) {
          // Bajo el agua: solo una ondita sutil marca dónde están
          ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x + w / 2, y + h / 2, h * 0.32, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          if (warning) {
            // Parpadeo de aviso justo antes de sumergirse
            ctx.globalAlpha = 0.45 + 0.4 * Math.abs(Math.sin(performance.now() / 90));
          }

          const turtleCount = Math.max(1, Math.round(p.lengthCells));
          for (let t = 0; t < turtleCount; t++) {
            const tx = x + (t + 0.5) * (w / turtleCount);
            const ty = y + h / 2;
            const rr = h * 0.4;

            // Caparazón
            ctx.fillStyle = "#3d7a3d";
            ctx.beginPath();
            ctx.ellipse(tx, ty, rr, rr * 0.82, 0, 0, Math.PI * 2);
            ctx.fill();

            // Patrón del caparazón
            ctx.strokeStyle = "#255025";
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(tx - rr * 0.55, ty - rr * 0.28);
            ctx.lineTo(tx + rr * 0.55, ty - rr * 0.28);
            ctx.moveTo(tx - rr * 0.55, ty + rr * 0.28);
            ctx.lineTo(tx + rr * 0.55, ty + rr * 0.28);
            ctx.moveTo(tx, ty - rr * 0.6);
            ctx.lineTo(tx, ty + rr * 0.6);
            ctx.stroke();

            // Borde claro del caparazón
            ctx.strokeStyle = "#5aa85a";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(tx, ty, rr, rr * 0.82, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Cabeza asomando hacia el sentido del movimiento
            const headX = this.direction > 0 ? tx + rr * 0.85 : tx - rr * 0.85;
            ctx.fillStyle = "#4a8a4a";
            ctx.beginPath();
            ctx.arc(headX, ty, rr * 0.26, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      ctx.restore();
    }
  }

  supportAt(col, row) {
    if (row !== this.row) return null;
    if (this.kind === "turtle" && this._turtleState().submerged) return null;
    for (const p of this.platforms) {
      const offsets = [0, -this.trackLength, this.trackLength];
      for (const offset of offsets) {
        const start = p.xCells + offset;
        const end = start + p.lengthCells;
        if (col + 1 > start && col < end) {
          const dxPerSec = this.direction * this.speed;
          if (this.kind === "croc") {
            const headStart = this.direction > 0 ? end - 1 : start;
            const headEnd = headStart + 1;
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
