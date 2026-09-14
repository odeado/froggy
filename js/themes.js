// Temas visuales que van rotando según el nivel, para que el tablero cambie
// de ambiente cada vez que subes de nivel (día -> atardecer -> noche -> ...).
// Los autos/camiones y la cabeza del cocodrilo toman sus colores de aquí
// (vía levels.js); troncos y carrocería del cocodrilo mantienen su textura
// dibujada en obstacles.js/river.js, así que no se toca ese detalle fino.

export const THEMES = [
  {
    name: "Día",
    kind: "day",
    water: "#113854",
    waterWave: "rgba(120, 210, 255, 0.15)",
    road: "#1e2228",
    laneDivider: "rgba(240, 220, 100, 0.25)",
    grassStart: "#224727",
    grassMedian: "#284f2e",
    grassBlade: "#34663c",
    carColors: ["#e04b4b", "#e0a64b", "#c94be0", "#e0d84b"],
    truckColor: "#4b7be0",
    crocHeadColor: "#1c4a1c",
  },
  {
    name: "Atardecer",
    kind: "sunset",
    water: "#4a2a4f",
    waterWave: "rgba(255, 175, 120, 0.22)",
    road: "#2a2030",
    laneDivider: "rgba(255, 200, 120, 0.3)",
    grassStart: "#4a3820",
    grassMedian: "#5a4526",
    grassBlade: "#7a5c30",
    carColors: ["#e0664b", "#e0b04b", "#c9507c", "#e0824b"],
    truckColor: "#8a4be0",
    crocHeadColor: "#3a3a1c",
  },
  {
    name: "Noche",
    kind: "night",
    water: "#0a1530",
    waterWave: "rgba(150, 170, 255, 0.18)",
    road: "#12141a",
    laneDivider: "rgba(190, 205, 255, 0.22)",
    grassStart: "#0f2016",
    grassMedian: "#132a1c",
    grassBlade: "#1c3a26",
    carColors: ["#c93b6b", "#3b7bc9", "#8a4bc9", "#3bc9a6"],
    truckColor: "#2b4ba0",
    crocHeadColor: "#122812",
  },
];

export function getTheme(levelNumber) {
  const idx = (levelNumber - 1) % THEMES.length;
  return THEMES[idx];
}

// Dibuja el detalle ambiental propio de cada tema (estrellas de noche,
// resplandor cálido de atardecer). Se llama después de pintar los fondos
// y antes de dibujar carriles/rana, para que quede detrás de todo lo jugable.
export function drawThemeDecoration(ctx, theme, cellSize, cols, riverRowCount, timeSec) {
  const width = cols * cellSize;
  const riverHeight = riverRowCount * cellSize;

  if (theme.kind === "night") {
    ctx.save();
    const starCount = 14;
    for (let i = 0; i < starCount; i++) {
      // Posiciones fijas (deterministas) repartidas en la franja del río.
      const sx = ((i * 53.7) % 97) / 97 * width;
      const sy = ((i * 31.3) % 89) / 89 * (riverHeight * 0.7);
      const twinkle = 0.35 + 0.35 * Math.abs(Math.sin(timeSec * 1.4 + i * 1.7));
      ctx.globalAlpha = twinkle;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(sx, sy, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  } else if (theme.kind === "sunset") {
    ctx.save();
    const glow = ctx.createRadialGradient(
      width * 0.5, riverHeight * 0.15, 0,
      width * 0.5, riverHeight * 0.15, width * 0.6
    );
    glow.addColorStop(0, "rgba(255, 190, 120, 0.28)");
    glow.addColorStop(1, "rgba(255, 190, 120, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, riverHeight);
    ctx.restore();
  }
}
