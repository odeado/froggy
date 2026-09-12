import { COLS, ROWS, START_COL, START_ROW } from "./config.js";

export class Frog {
  constructor() {
    this.reset();
  }

  reset() {
    this.col = START_COL;
    this.row = START_ROW;
    this.facing = "up";
  }

  // dir: "up" | "down" | "left" | "right"
  move(dir) {
    let { row, col } = this;
    if (dir === "up") row -= 1;
    else if (dir === "down") row += 1;
    else if (dir === "left") col -= 1;
    else if (dir === "right") col += 1;
    else return false;

    if (row < 0 || row > ROWS - 1) return false;
    if (col < 0 || col > COLS - 1) return false;

    this.row = row;
    this.col = col;
    this.facing = dir;
    return true;
  }

  draw(ctx, cellSize) {
    const x = this.col * cellSize;
    const y = this.row * cellSize;
    const pad = cellSize * 0.15;

    ctx.save();
    ctx.fillStyle = "#4ade4a";
    ctx.beginPath();
    const r = (cellSize - pad * 2) / 2;
    ctx.arc(x + cellSize / 2, y + cellSize / 2, r, 0, Math.PI * 2);
    ctx.fill();

    // Ojos, para dar sentido de dirección.
    ctx.fillStyle = "#0b0f14";
    const eyeOffset = r * 0.5;
    const eyeR = Math.max(2, cellSize * 0.06);
    let ex1 = x + cellSize / 2 - eyeOffset;
    let ey1 = y + cellSize / 2 - eyeOffset;
    let ex2 = x + cellSize / 2 + eyeOffset;
    let ey2 = y + cellSize / 2 - eyeOffset;

    if (this.facing === "down") {
      ey1 = y + cellSize / 2 + eyeOffset;
      ey2 = y + cellSize / 2 + eyeOffset;
    } else if (this.facing === "left") {
      ex1 = x + cellSize / 2 - eyeOffset;
      ex2 = x + cellSize / 2 - eyeOffset * 0.2;
      ey1 = ey2 = y + cellSize / 2 - eyeOffset * 0.4;
    } else if (this.facing === "right") {
      ex1 = x + cellSize / 2 + eyeOffset * 0.2;
      ex2 = x + cellSize / 2 + eyeOffset;
      ey1 = ey2 = y + cellSize / 2 - eyeOffset * 0.4;
    }

    ctx.beginPath();
    ctx.arc(ex1, ey1, eyeR, 0, Math.PI * 2);
    ctx.arc(ex2, ey2, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
