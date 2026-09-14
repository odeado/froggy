const livesEl = document.getElementById("hud-lives");
const scoreEl = document.getElementById("hud-score");
const levelEl = document.getElementById("hud-level");

const gameOverEl = document.getElementById("game-over");
const goScoreEl = document.getElementById("go-score");
const goBestEl = document.getElementById("go-best");
const goRestartBtn = document.getElementById("go-restart");
const deathToastEl = document.getElementById("death-toast");

let deathToastTimer = null;

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

// Mensaje breve que explica por qué se perdió una vida (para que no se
// sienta como una muerte "invisible"/injusta).
export function showDeathToast(text) {
  if (deathToastTimer) {
    clearTimeout(deathToastTimer.showClass);
    clearTimeout(deathToastTimer.hide);
  }
  deathToastEl.textContent = text;
  deathToastEl.hidden = false;
  // Forzar reflow para que la transición de opacidad se vea al reusar el toast.
  void deathToastEl.offsetWidth;
  deathToastEl.classList.add("show");

  const hide = setTimeout(() => {
    deathToastEl.classList.remove("show");
    const finalHide = setTimeout(() => {
      deathToastEl.hidden = true;
    }, 200);
    deathToastTimer = { hide: finalHide };
  }, 900);
  deathToastTimer = { hide };
}
