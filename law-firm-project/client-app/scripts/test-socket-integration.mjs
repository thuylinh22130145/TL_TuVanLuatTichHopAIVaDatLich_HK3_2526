import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { io } from 'socket.io-client';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(currentDir, '..', '..');
const serverDir = path.join(projectDir, 'server-api');
const port = 3101;
const baseUrl = `http://localhost:${port}`;

const server = spawn(process.execPath, ['server-realtime.js'], {
  cwd: serverDir,
  env: {
    ...process.env,
    PORT: String(port),
    DB_DIALECT: 'sqlite',
    DB_STORAGE: './data/socket-test.sqlite',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let serverError = '';
server.stderr.on('data', (chunk) => {
  serverError += chunk.toString();
});

async function waitForServer() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/public/lawyers`);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Server did not become ready.\n${serverError}`);
}

async function request(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, options);
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`${response.status} ${pathname}: ${JSON.stringify(body)}`);
  }
  return body;
}

let socket;
let createdBookingId;

try {
  await waitForServer();

  const login = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
  });
  const token = login.data.token;

  socket = io(baseUrl, {
    auth: { token },
    transports: ['websocket'],
  });

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error('Timed out while connecting Socket.IO')),
      5000
    );
    socket.once('connect', () => {
      clearTimeout(timeout);
      resolve();
    });
    socket.once('connect_error', reject);
  });

  const changedEvent = new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error('Timed out waiting for booking:changed')),
      5000
    );
    socket.once('booking:changed', (payload) => {
      clearTimeout(timeout);
      resolve(payload);
    });
  });

  const appointment = new Date();
  appointment.setUTCFullYear(appointment.getUTCFullYear() + 5);
  appointment.setUTCDate(appointment.getUTCDate() + 1);

  const created = await request('/api/admin/bookings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      lawyer_id: 1,
      customer_name: 'Socket Integration Test',
      customer_phone: '0900000000',
      customer_email: 'socket-test@example.com',
      appointment_date: appointment.toISOString(),
      duration_minutes: 30,
      summary_issue: 'Socket.IO integration test',
    }),
  });
  createdBookingId = created.data.id;

  const event = await changedEvent;
  if (event.action !== 'created' || event.bookingId !== createdBookingId) {
    throw new Error(`Unexpected event: ${JSON.stringify(event)}`);
  }

  await request(`/api/admin/bookings/${createdBookingId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  createdBookingId = null;

  console.log(
    JSON.stringify({
      ok: true,
      socketId: socket.id,
      event: event.action,
      bookingId: event.bookingId,
    })
  );
} finally {
  socket?.disconnect();
  server.kill();
}
