// Capa de transporte para el modo "en línea". Toda la lógica de
// multijugador (js/multiplayer.js) habla contra esta interfaz genérica:
//   roomCode           -> código de la sala (string)
//   send(data)         -> manda un mensaje a la sala
//   onMessage(cb)      -> se llama con cada mensaje que llega de OTRO jugador
//   onError(cb)        -> se llama si no se pudo conectar al servidor
//   disconnect()       -> se sale de la sala
//
// Hay dos implementaciones: LocalTransport (BroadcastChannel, solo sirve
// entre pestañas del mismo navegador — se usó para construir y probar toda
// la mecánica de juego sin depender de la red) y FirebaseTransport (la real,
// vía Realtime Database, que sí funciona entre dos celulares distintos).
// `Transport` al final del archivo es la que usa multiplayer.js.
//
// Importante: el SDK de Firebase se importa de forma DINÁMICA (recién
// cuando alguien crea o se une a una sala), nunca al cargar este archivo.
// Así, si el celular de alguien no puede llegar a gstatic.com (sin señal,
// un bloqueador de anuncios, etc.), eso solo afecta al modo en línea — el
// modo un jugador sigue funcionando siempre, sin depender de la red.

export class LocalTransport {
  constructor(roomCode) {
    this.roomCode = roomCode;
    this.channel = new BroadcastChannel(`froggy-room-${roomCode}`);
    this._onMessage = null;
    this.channel.onmessage = (e) => {
      if (this._onMessage) this._onMessage(e.data);
    };
  }

  send(data) {
    this.channel.postMessage(data);
  }

  onMessage(cb) {
    this._onMessage = cb;
  }

  onError() {
    /* BroadcastChannel no falla por red: no hay nada que reportar aquí. */
  }

  disconnect() {
    this.channel.close();
  }
}

const FIREBASE_APP_URL = "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
const FIREBASE_DATABASE_URL = "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

let firebaseModulesPromise = null;
function loadFirebaseModules() {
  if (!firebaseModulesPromise) {
    firebaseModulesPromise = Promise.all([import(FIREBASE_APP_URL), import(FIREBASE_DATABASE_URL)]);
  }
  return firebaseModulesPromise;
}

export class FirebaseTransport {
  constructor(roomCode) {
    this.roomCode = roomCode;
    this._onMessage = null;
    this._onError = null;
    this._sendQueue = [];
    this._ready = false;
    this._push = null;
    this._remove = null;
    this._init();
  }

  async _init() {
    try {
      const [appMod, dbMod] = await loadFirebaseModules();
      const { firebaseConfig } = await import("./firebase-config.js");
      const { initializeApp, getApps, getApp } = appMod;
      const { getDatabase, ref, push, set, remove, onChildAdded, onChildRemoved, onDisconnect } = dbMod;

      const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
      const db = getDatabase(app);

      this._push = push;
      this._remove = remove;

      this.messagesRef = ref(db, `rooms/${this.roomCode}/messages`);
      this.presenceRef = ref(db, `rooms/${this.roomCode}/presence`);

      // Cualquier mensaje (join/start/state/bye) que llegue a la sala.
      this._unsubMessages = onChildAdded(this.messagesRef, (snapshot) => {
        if (this._onMessage) this._onMessage(snapshot.val());
      });

      // Presencia: si el navegador del rival se cierra, pierde señal o la
      // pestaña se mata de golpe, Firebase borra su marca de presencia del
      // lado del servidor (onDisconnect), y eso se traduce acá en un
      // mensaje "bye" — más confiable que depender de que alcance a avisar
      // antes de cerrarse.
      this._unsubPresence = onChildRemoved(this.presenceRef, (snapshot) => {
        if (this._onMessage) this._onMessage({ type: "bye", from: snapshot.key });
      });

      this._myPresenceRef = push(this.presenceRef);
      set(this._myPresenceRef, true);
      onDisconnect(this._myPresenceRef).remove();

      this._ready = true;
      for (const data of this._sendQueue) {
        push(this.messagesRef, data);
      }
      this._sendQueue = [];
    } catch (err) {
      if (this._onError) this._onError(err);
    }
  }

  send(data) {
    if (!this._ready) {
      this._sendQueue.push(data);
      return;
    }
    this._push(this.messagesRef, data);
  }

  onMessage(cb) {
    this._onMessage = cb;
  }

  onError(cb) {
    this._onError = cb;
  }

  disconnect() {
    if (this._unsubMessages) this._unsubMessages();
    if (this._unsubPresence) this._unsubPresence();
    if (this._myPresenceRef && this._remove) this._remove(this._myPresenceRef).catch(() => {});
    if (this.messagesRef && this._remove) this._remove(this.messagesRef).catch(() => {});
  }
}

// La que realmente usa el juego. Cambiar esta línea (y nada más) alcanzaría
// para volver a LocalTransport si algún día hace falta probar algo offline.
export const Transport = FirebaseTransport;

// Código de sala corto y fácil de dictar/tipear: 4 letras/números en
// mayúscula, sin caracteres ambiguos (0/O, 1/I).
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRoomCode() {
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export function generatePlayerId() {
  return Math.random().toString(36).slice(2, 10);
}
