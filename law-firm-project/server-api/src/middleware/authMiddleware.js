import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * ==================================================
 * Kiểm tra JWT
 * ==================================================
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Bạn chưa đăng nhập.');
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, env.jwt.secret);

    const user = await User.findByPk(decoded.id, {
      attributes: {
        exclude: ['password_hash'],
      },
    });

    if (!user) {
      throw new ApiError(401, 'Tài khoản không tồn tại.');
    }

    if (user.status !== 'ACTIVE') {
      throw new ApiError(403, 'Tài khoản đã bị khóa.');
    }

    req.user = user;

    next();
  } catch (err) {
    next(
      err instanceof ApiError
        ? err
        : new ApiError(401, 'Token không hợp lệ hoặc đã hết hạn.')
    );
  }
}

/**
 * ==================================================
 * Kiểm tra 1 Role
 * Ví dụ:
 * requireRole("ADMIN")
 * ==================================================
 */
export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Bạn chưa đăng nhập.'));
    }

    if (req.user.role !== role) {
      return next(new ApiError(403, 'Bạn không có quyền truy cập.'));
    }

    next();
  };
}

/**
 * ==================================================
 * Kiểm tra nhiều Role
 *
 * requireRoles(["ADMIN","LAWYER"])
 * ==================================================
 */
export function requireRoles(roles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Bạn chưa đăng nhập.'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Bạn không có quyền truy cập.'));
    }

    next();
  };
}

/**
 * ==================================================
 * Khuyến nghị đăng nhập, nhưng không bắt buộc.
 * Nếu token hợp lệ thì đính kèm req.user.
 * Nếu không có token hoặc token không hợp lệ thì tiếp tục.
 * ==================================================
 */
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.jwt.secret);
    const user = await User.findByPk(decoded.id, {
      attributes: {
        exclude: ['password_hash'],
      },
    });

    if (user && user.status === 'ACTIVE') {
      req.user = user;
    }
  } catch (err) {
    // Ignore invalid token; anonymous users may still access optional routes.
  }

  next();
}

/**
 * ==================================================
 * Chỉ Admin
 * ==================================================
 */
export const requireAdmin = requireRole('ADMIN');

/**
 * ==================================================
 * Chỉ Lawyer
 * ==================================================
 */
export const requireLawyer = requireRole('LAWYER');

/**
 * ==================================================
 * Chỉ User
 * ==================================================
 */
export const requireUser = requireRole('USER');