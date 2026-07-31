import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';
import { Lawyer, User } from '../models/index.js';

let io = null;

function allowedOrigins() {
  return env.corsOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function extractToken(socket) {
  const authToken = socket.handshake.auth?.token;
  if (authToken) return authToken;

  const authorization = socket.handshake.headers.authorization;
  if (authorization?.startsWith('Bearer ')) {
    return authorization.slice(7);
  }
  return null;
}

async function authenticateSocket(socket, next) {
  try {
    const token = extractToken(socket);
    if (!token) return next(new Error('UNAUTHORIZED'));

    const decoded = jwt.verify(token, env.jwt.secret);
    if (decoded.type && decoded.type !== 'access') {
      return next(new Error('UNAUTHORIZED'));
    }

    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'role', 'status'],
    });
    if (!user || user.status !== 'ACTIVE') {
      return next(new Error('UNAUTHORIZED'));
    }

    socket.data.user = user.toJSON();
    next();
  } catch {
    next(new Error('UNAUTHORIZED'));
  }
}

export function initializeSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins(),
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use(authenticateSocket);

  io.on('connection', async (socket) => {
    const user = socket.data.user;
    socket.join(`user:${user.id}`);
    socket.join(`role:${user.role}`);

    if (user.role === 'LAWYER') {
      const lawyer = await Lawyer.findOne({
        where: { user_id: user.id, status: 'active' },
        attributes: ['id'],
      });
      if (lawyer) socket.join(`lawyer:${lawyer.id}`);
    }

    socket.emit('realtime:ready', {
      connected: true,
      userId: user.id,
      role: user.role,
    });
  });

  return io;
}

export function emitBookingChanged(action, booking) {
  if (!io || !booking) return;

  const payload = {
    action,
    bookingId: booking.id,
    bookingCode: booking.booking_code,
    lawyerId: booking.lawyer_id,
    userId: booking.user_id,
    status: booking.status,
    occurredAt: new Date().toISOString(),
  };

  io.to('role:ADMIN').emit('booking:changed', payload);
  io.to(`lawyer:${booking.lawyer_id}`).emit('booking:changed', payload);
  if (booking.user_id) {
    io.to(`user:${booking.user_id}`).emit('booking:changed', payload);
  }
}
