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
      }

      ctx.restore();
    }
  }

  supportAt(col, row) {
    if (row !== this.row) return null;
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
