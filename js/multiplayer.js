import { Transport, generateRoomCode, generatePlayerId } from "./sync.js";

const HEARTBEAT_MS = 2000;
// Más tolerante que antes (era 8000): un celular puede quedarse sin mandar
// nada por unos segundos por una app en segundo plano o un bache de señal,
// sin que eso signifique que el rival realmente se fue.
const DISCONNECT_TIMEOUT_MS = 15000;
const COUNTDOWN_MS = 3000;

// Controla todas las pantallas de "modo de juego" (un jugador / en línea,
// crear o unirse a una sala, esperando rival, cuenta regresiva y resultado
// final) y la conexión de red de una partida en línea. main.js no sabe nada
// de salas ni de Firebase/BroadcastChannel: solo le avisamos cuándo debe
// arrancar una partida (sola o en línea) y él nos llama de vuelta para
// mandar el estado de la rana local y para anunciar el resultado.
export function createMultiplayerController({ onSinglePlayer, onMatchStart }) {
  const el = {
    modeSelect: document.getElementById("mode-select"),
    onlineMenu: document.getElementById("online-menu"),
    waiting: document.getElementById("room-waiting"),
    waitingTitle: document.getElementById("waiting-title"),
    roomCodeDisplay: document.getElementById("room-code-display"),
    waitingStatus: document.getElementById("waiting-status"),
    countdown: document.getElementById("countdown-overlay"),
    countdownNumber: document.getElementById("countdown-number"),
    result: document.getElementById("match-result"),
    resultBadge: document.getElementById("match-result-badge"),
    resultTitle: document.getElementById("match-result-title"),
    resultDetail: document.getElementById("match-result-detail"),
    joinInput: document.getElementById("join-code-input"),
    hudRival: document.getElementById("hud-rival"),
  };

  let transport = null;
  let playerId = null;
  let isHost = false;
  let matchStarted = false;
  let lastPayload = null;
  let lastOpponentAt = 0;
  let heartbeatTimer = null;
  let watchdogTimer = null;
  let onOpponentMessageCb = null;
  let onOpponentDisconnectedCb = null;

  function show(elm) {
    if (elm) elm.hidden = false;
  }
  function hide(elm) {
    if (elm) elm.hidden = true;
  }

  function resetRoomState() {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    if (watchdogTimer) clearInterval(watchdogTimer);
    heartbeatTimer = null;
    watchdogTimer = null;
    matchStarted = false;
    lastPayload = null;
    if (transport) {
      try {
        transport.send({ type: "bye", from: playerId });
      } catch (e) {
        /* noop */
      }
      transport.disconnect();
    }
    transport = null;
  }

  function backToOnlineMenu() {
    resetRoomState();
    hide(el.waiting);
    show(el.onlineMenu);
  }

  function handleRoomMessage(msg) {
    if (!msg || msg.from === playerId) return; // ignorar eco propio

    if (!matchStarted) {
      if (isHost && msg.type === "join") {
        el.waitingStatus.textContent = "¡Rival conectado! Empezando…";
        const startAt = Date.now() + COUNTDOWN_MS;
        transport.send({ type: "start", startAt, from: playerId });
        runCountdown(startAt);
      } else if (!isHost && msg.type === "start") {
        runCountdown(msg.startAt);
      }
      return;
    }

    // Partida en curso: los mensajes de estado/desconexión van a main.js.
    if (msg.type === "state") {
      lastOpponentAt = Date.now();
      if (onOpponentMessageCb) onOpponentMessageCb(msg);
    } else if (msg.type === "bye") {
      if (onOpponentDisconnectedCb) onOpponentDisconnectedCb();
    }
  }

  function runCountdown(startAt) {
    hide(el.waiting);
    show(el.countdown);

    const tick = () => {
      const remainingMs = startAt - Date.now();
      const secs = Math.ceil(remainingMs / 1000);
      if (remainingMs <= 0) {
        el.countdownNumber.textContent = "¡YA!";
        setTimeout(() => {
          hide(el.countdown);
          beginMatch();
        }, 250);
        return;
      }
      el.countdownNumber.textContent = String(Math.max(1, secs));
      requestAnimationFrame(tick);
    };
    tick();
  }

  function beginMatch() {
    matchStarted = true;
    lastOpponentAt = Date.now();
    show(el.hudRival);

    heartbeatTimer = setInterval(() => {
      if (lastPayload) transport.send({ ...lastPayload, from: playerId, ts: Date.now() });
    }, HEARTBEAT_MS);

    watchdogTimer = setInterval(() => {
      if (Date.now() - lastOpponentAt > DISCONNECT_TIMEOUT_MS) {
        if (onOpponentDisconnectedCb) onOpponentDisconnectedCb();
        clearInterval(watchdogTimer);
        watchdogTimer = null;
      }
    }, 2000);

    onMatchStart({ isHost, roomCode: transport.roomCode, playerId });
  }

  // Cuando el celular se bloquea o el navegador manda la pestaña a segundo
  // plano, el sistema operativo pausa los temporizadores (setInterval) de
  // esta página. Al volver, "lastOpponentAt" puede quedar muy atrás sin que
  // el rival se haya ido realmente — solo porque ESTE celular estuvo
  // pausado y no pudo procesar los mensajes que sí llegaban. Por eso, al
  // recuperar el foco: le damos a la rana rival un respiro fresco antes de
  // que el vigilante evalúe de nuevo, y mandamos de inmediato nuestro
  // último estado para que el rival tampoco nos dé por desconectados.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    if (!matchStarted || !transport) return;
    lastOpponentAt = Date.now();
    if (lastPayload) {
      try {
        transport.send({ ...lastPayload, from: playerId, ts: Date.now() });
      } catch (e) {
        /* noop */
      }
    }
  });

  // --- Botones de menú ---

  document.getElementById("btn-mode-single").addEventListener("click", () => {
    hide(el.modeSelect);
    onSinglePlayer();
  });

  document.getElementById("btn-mode-online").addEventListener("click", () => {
    hide(el.modeSelect);
    show(el.onlineMenu);
  });

  document.getElementById("btn-online-back").addEventListener("click", () => {
    hide(el.onlineMenu);
    show(el.modeSelect);
  });

  function handleConnectionError() {
    el.waitingTitle.textContent = "No se pudo conectar";
    hide(el.roomCodeDisplay);
    el.waitingStatus.textContent =
      "No se pudo conectar al servidor en línea. Revisa tu conexión a internet e inténtalo de nuevo.";
    show(el.waiting);
  }

  document.getElementById("btn-create-room").addEventListener("click", () => {
    const roomCode = generateRoomCode();
    playerId = generatePlayerId();
    isHost = true;
    transport = new Transport(roomCode);
    transport.onMessage(handleRoomMessage);
    transport.onError(handleConnectionError);

    hide(el.onlineMenu);
    el.waitingTitle.textContent = "Esperando a tu rival…";
    el.roomCodeDisplay.textContent = roomCode;
    show(el.roomCodeDisplay);
    el.waitingStatus.textContent = "Comparte este código con tu rival para que se una.";
    show(el.waiting);
  });

  document.getElementById("btn-join-room").addEventListener("click", () => {
    const code = (el.joinInput.value || "").trim().toUpperCase();
    if (code.length !== 4) {
      el.joinInput.focus();
      return;
    }
    playerId = generatePlayerId();
    isHost = false;
    transport = new Transport(code);
    transport.onMessage(handleRoomMessage);
    transport.onError(handleConnectionError);
    transport.send({ type: "join", from: playerId });

    hide(el.onlineMenu);
    el.waitingTitle.textContent = "Conectando…";
    hide(el.roomCodeDisplay);
    el.waitingStatus.textContent = "Buscando la sala " + code + "…";
    show(el.waiting);
  });

  document.getElementById("btn-waiting-cancel").addEventListener("click", backToOnlineMenu);

  document.getElementById("btn-match-menu").addEventListener("click", () => {
    location.reload();
  });

  window.addEventListener("beforeunload", () => {
    if (transport && matchStarted) {
      try {
        transport.send({ type: "bye", from: playerId });
      } catch (e) {
        /* noop */
      }
    }
  });

  return {
    sendState(payload) {
      if (!transport || !matchStarted) return;
      lastPayload = payload;
      transport.send({ ...payload, type: "state", from: playerId, ts: Date.now() });
    },
    onOpponentMessage(cb) {
      onOpponentMessageCb = cb;
    },
    onOpponentDisconnected(cb) {
      onOpponentDisconnectedCb = cb;
    },
    declareResult({ won, title, detail }) {
      resetRoomState();
      hide(el.hudRival);
      el.resultBadge.textContent = won ? "🏆 VICTORIA" : "🐸 DERROTA";
      el.resultBadge.style.color = won ? "#4ade4a" : "#f87171";
      el.resultTitle.textContent = title;
      el.resultDetail.textContent = detail || "";
      show(el.result);
    },
  };
}
