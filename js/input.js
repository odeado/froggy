const KEY_TO_DIR = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
  W: "up",
  S: "down",
  A: "left",
  D: "right",
};

// Umbral mínimo (px) para que un swipe cuente como movimiento.
const SWIPE_THRESHOLD = 24;

export function setupInput(onDirection) {
  // Teclado
  window.addEventListener("keydown", (e) => {
    const dir = KEY_TO_DIR[e.key];
    if (dir) {
      e.preventDefault();
      onDirection(dir);
    }
  });

  // Botones D-pad en pantalla
  document.querySelectorAll(".dpad-btn").forEach((btn) => {
    const dir = btn.getAttribute("data-dir");
    const trigger = (e) => {
      e.preventDefault();
      onDirection(dir);
    };
    btn.addEventListener("pointerdown", trigger);
  });

  // Swipe sobre el canvas
  const canvas = document.getElementById("game-canvas");
  let startX = 0;
  let startY = 0;
  let tracking = false;

  canvas.addEventListener("pointerdown", (e) => {
    tracking = true;
    startX = e.clientX;
    startY = e.clientY;
  });

  canvas.addEventListener("pointerup", (e) => {
    if (!tracking) return;
    tracking = false;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      onDirection(dx > 0 ? "right" : "left");
    } else {
      onDirection(dy > 0 ? "down" : "up");
    }
  });

  canvas.addEventListener("pointercancel", () => {
    tracking = false;
  });
}
