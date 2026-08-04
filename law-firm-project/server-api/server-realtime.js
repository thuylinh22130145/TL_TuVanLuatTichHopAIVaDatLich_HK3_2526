import { createServer } from 'node:http';

import app from './src/app.js';
import { env } from './src/config/env.js';
import { connectDatabase, sequelize } from './src/config/database.js';
import { Booking } from './src/models/index.js';
import { emitBookingChanged, initializeSocket } from './src/realtime/socket.js';

let httpServer;
let isShuttingDown = false;

function emitAfterCommit(action, booking, options = {}) {
  if (options.transaction) {
    options.transaction.afterCommit(() => emitBookingChanged(action, booking));
    return;
  }
  emitBookingChanged(action, booking);
}

Booking.addHook('afterCreate', 'socket-booking-created', (booking, options) => {
  emitAfterCommit('created', booking, options);
});

Booking.addHook('afterUpdate', 'socket-booking-updated', (booking, options) => {
  emitAfterCommit('updated', booking, options);
});

Booking.addHook('afterDestroy', 'socket-booking-deleted', (booking, options) => {
  emitAfterCommit('deleted', booking, options);
});

async function start() {
  try {
    await connectDatabase();
    await sequelize.sync();

    httpServer = createServer(app);
    initializeSocket(httpServer);

    httpServer.listen(env.port, () => {
      console.log(`[API] server-api listening on http://localhost:${env.port}`);
      console.log(`[API] Public:  http://localhost:${env.port}/api/public`);
      console.log(`[API] Admin:   http://localhost:${env.port}/api/admin`);
      console.log(`[WS]  Socket.IO ready on http://localhost:${env.port}`);
      console.log(`[AI]  Proxy -> ${env.ai.serviceUrl}`);
    });
  } catch (error) {
    console.error('[API] Failed to start:', error.message);
    process.exit(1);
  }
}

async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`[API] ${signal} received, shutting down...`);

  try {
    if (httpServer?.listening) {
      await new Promise((resolve, reject) => {
        httpServer.close((error) => (error ? reject(error) : resolve()));
      });
    }
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('[API] Graceful shutdown failed:', error.message);
    process.exit(1);
  }
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

start();
