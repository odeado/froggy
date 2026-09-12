const livesEl = document.getElementById("hud-lives");
const scoreEl = document.getElementById("hud-score");
const levelEl = document.getElementById("hud-level");

export function updateHud({ lives, score, level }) {
  if (lives !== undefined) livesEl.textContent = String(lives);
  if (score !== undefined) scoreEl.textContent = String(score);
  if (level !== undefined) levelEl.textContent = String(level);
}
