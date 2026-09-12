const livesEl = document.getElementById("hud-lives");
const scoreEl = document.getElementById("hud-score");
const levelEl = document.getElementById("hud-level");

const gameOverEl = document.getElementById("game-over");
const goScoreEl = document.getElementById("go-score");
const goBestEl = document.getElementById("go-best");
const goRestartBtn = document.getElementById("go-restart");

export function updateHud({ lives, score, level }) {
  if (lives !== undefined) livesEl.textContent = String(lives);
  if (score !== undefined) scoreEl.textContent = String(score);
  if (level !== undefined) levelEl.textContent = String(level);
}

export function showGameOver(score, best) {
  goScoreEl.textContent = String(score);
  goBestEl.textContent = String(best);
  gameOverEl.hidden = false;
}

export function hideGameOver() {
  gameOverEl.hidden = true;
}

export function onRestart(callback) {
  goRestartBtn.addEventListener("click", callback);
}
