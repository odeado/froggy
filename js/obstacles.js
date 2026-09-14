import { COLS } from "./config.js";

export class Vehicle {
  constructor({ xCells, lengthCells, color }) {
    this.xCells = xCells;
    this.lengthCells = lengthCells;
    this.color = color;
  }
}

export class Lane {
  constructor({ row, direction, speedCellsPerSec, lengthCells, gapCells, color }) {
    this.row = row;
    this.direction = direction; // 1 = derecha, -1 = izquierda
    this.speed = speedCellsPerSec;
    this.lengthCells = lengthCells;
    this.gapCells = gapCells;
    this.color = color;
    this.trackLength = 0;
    this.vehicles = this._buildVehicles();
  }

  _buildVehicles() {
    const spacing = this.lengthCells + this.gapCells;
    const count = Math.ceil(COLS / spacing) + 1;
    this.trackLength = count * spacing;
    const phaseOffset = Math.random() * spacing;
    const vehicles = [];
    for (let i = 0; i < count; i++) {
      vehicles.push(
        new Vehicle({
          xCells: i * spacing + phaseOffset,
          lengthCells: this.lengthCells,
          color: this.color,
        })
      );
    }
    return vehicles;
  }

  update(dt) {
    for (const v of this.vehicles) {
      v.xCells += this.direction * this.speed * dt;
      if (this.direction > 0 && v.xCells > COLS) {
        v.xCells -= this.trackLength;
      } else if (this.direction < 0 && v.xCells + v.lengthCells < 0) {
        v.xCells += this.trackLength;
      }
    }
  }

  draw(ctx, cellSize) {
    const padY = cellSize * 0.12;
    const h = cellSize - padY * 2;

    for (const v of this.vehicles) {
      const x = v.xCells * cellSize;
      const y = this.row * cellSize + padY;
      const w = v.lengthCells * cellSize;

      ctx.save();

      const isTruck = v.lengthCells >= 2;

      // Sombra de contacto (da sensación de volumen respecto al asfalto)
      ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h - 1, w * 0.42, h * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Faros y haces de luz delanteros
      const headlightW = cellSize * 0.4;
      const lightY1 = y + h * 0.15;
      const lightY2 = y + h * 0.85;

      ctx.fillStyle = "rgba(255, 255, 190, 0.25)";
      ctx.beginPath();
      if (this.direction > 0) {
        const frontX = x + w;
        ctx.moveTo(frontX, lightY1);
        ctx.lineTo(frontX + headlightW, lightY1 - 4);
        ctx.lineTo(frontX + headlightW, lightY2 + 4);
        ctx.lineTo(frontX, lightY2);
      } else {
        const frontX = x;
        ctx.moveTo(frontX, lightY1);
        ctx.lineTo(frontX - headlightW, lightY1 - 4);
        ctx.lineTo(frontX - headlightW, lightY2 + 4);
        ctx.lineTo(frontX, lightY2);
      }
      ctx.closePath();
      ctx.fill();

      // Carrocería del vehículo
      ctx.fillStyle = v.color;
      ctx.beginPath();
      ctx.roundRect(x + 2, y, w - 4, h, 6);
      ctx.fill();

      // Sombra interior de la carrocería
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(x + 4, y + h * 0.7, w - 8, h * 0.25);

      if (isTruck) {
        // Cabina de camión
        const cabW = cellSize * 0.7;
        const cabX = this.direction > 0 ? x + w - cabW : x;
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(cabX, y + 2, cabW, h - 4);

        // Parabrisas de camión
        ctx.fillStyle = "#a8e4ff";
        const windX = this.direction > 0 ? cabX + cabW * 0.3 : cabX + 4;
        ctx.fillRect(windX, y + h * 0.2, cabW * 0.5, h * 0.6);
      } else {
        // Parabrisas y techo de automóvil
        const roofW = w * 0.5;
        const roofX = x + (w - roofW) / 2;

        // Vidrio parabrisas delantero y trasero
        ctx.fillStyle = "#8cd3ff";
        ctx.beginPath();
        ctx.roundRect(roofX - 3, y + h * 0.15, roofW + 6, h * 0.7, 4);
        ctx.fill();

        // Techo
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        ctx.beginPath();
        ctx.roundRect(roofX, y + h * 0.2, roofW, h * 0.6, 3);
        ctx.fill();
      }

      // Ruedas (4 esquinas)
      ctx.fillStyle = "#111111";
      const wheelW = Math.max(4, cellSize * 0.12);
      const wheelH = Math.max(3, h * 0.22);
      // Superior izquierda/derecha
      ctx.fillRect(x + w * 0.15, y - 2, wheelW, wheelH);
      ctx.fillRect(x + w * 0.75 - wheelW, y - 2, wheelW, wheelH);
      // Inferior izquierda/derecha
      ctx.fillRect(x + w * 0.15, y + h - wheelH + 2, wheelW, wheelH);
      ctx.fillRect(x + w * 0.75 - wheelW, y + h - wheelH + 2, wheelW, wheelH);

      // Luces traseras rojas
      ctx.fillStyle = "#ff2222";
      const tailX = this.direction > 0 ? x + 2 : x + w - 4;
      ctx.fillRect(tailX, y + 3, 2, h * 0.25);
      ctx.fillRect(tailX, y + h - 3 - h * 0.25, 2, h * 0.25);

      ctx.restore();
    }
  }

  collidesWithCell(col, row) {
    if (row !== this.row) return false;
    for (const v of this.vehicles) {
      const offsets = [0, -this.trackLength, this.trackLength];
      for (const offset of offsets) {
        const start = v.xCells + offset;
        const end = start + v.lengthCells;
        if (col + 1 > start && col < end) return true;
      }
    }
    return false;
  }
}

export function createLanesFromConfig(laneConfigs) {
  return laneConfigs.map((cfg) => new Lane(cfg));
}
