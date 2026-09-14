const livesEl = document.getElementById("hud-lives");
const scoreEl = document.getElementById("hud-score");
const levelEl = document.getElementById("hud-level");

const timerBarEl = document.getElementById("timer-bar");
const btnMute = document.getElementById("btn-mute");

const gameOverEl = document.getElementById("game-over");
const goScoreEl = document.getElementById("go-score");
const goBestEl = document.getElementById("go-best");
const goRestartBtn = document.getElementById("go-restart");

export function updateHud({ lives, score, level }) {
  if (lives !== undefined) livesEl.textContent = String(lives);
  if (score !== undefined) scoreEl.textContent = String(score);
  if (level !== undefined) levelEl.textContent = String(level);
}

export function updateTimerBar(remaining, total) {
  if (!timerBarEl) return;
  const pct = Math.max(0, Math.min(100, (remaining / total) * 100));
  timerBarEl.style.width = `${pct}%`;

  if (pct < 30) {
    timerBarEl.classList.add("warning");
  } else {
    timerBarEl.classList.remove("warning");
  }
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

export function setupAudioToggle(onToggle) {
  if (!btnMute) return;
  btnMute.addEventListener("click", () => {
    const isMuted = onToggle();
    btnMute.textContent = isMuted ? "🔇" : "🔊";
  });
}
