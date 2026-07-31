import { io } from 'socket.io-client';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const socketUrl = import.meta.env.VITE_SOCKET_URL || new URL(apiBaseUrl).origin;

let socket = null;
let activeToken = null;

export function connectRealtime(token) {
  if (!token) return null;

  if (!socket) {
    activeToken = token;
    socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
  } else if (activeToken !== token) {
    activeToken = token;
    socket.auth = { token };
    socket.disconnect().connect();
  } else if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function disconnectRealtime() {
  socket?.disconnect();
  socket = null;
  activeToken = null;
}
