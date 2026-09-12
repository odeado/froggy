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
    const vehicles = [];
    for (let i = 0; i < count; i++) {
      vehicles.push(
        new Vehicle({
          xCells: i * spacing,
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
    const pad = cellSize * 0.1;
    for (const v of this.vehicles) {
      const x = v.xCells * cellSize;
      const y = this.row * cellSize;
      const w = v.lengthCells * cellSize;
      ctx.fillStyle = v.color;
      ctx.fillRect(x + pad / 2, y + pad / 2, w - pad, cellSize - pad);
    }
  }

  // Colisión contra una celda de grilla (col, row) — usada para la rana.
  collidesWithCell(col, row) {
    if (row !== this.row) return false;
    for (const v of this.vehicles) {
      // Se revisan copias desplazadas para cubrir el wraparound del carril.
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
