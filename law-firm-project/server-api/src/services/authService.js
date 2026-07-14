import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { User } from '../models/index.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Đăng ký tài khoản
 */
export async function register(data) {
  const {
    username,
    email,
    password,
    full_name,
    phone,
  } = data;

  // Kiểm tra username
  const usernameExists = await User.findOne({
    where: { username },
  });

  if (usernameExists) {
    throw new ApiError(409, 'Tên đăng nhập đã tồn tại.');
  }

  // Kiểm tra email
  const emailExists = await User.findOne({
    where: { email },
  });

  if (emailExists) {
    throw new ApiError(409, 'Email đã được sử dụng.');
  }

  // Hash password
  const password_hash = await bcrypt.hash(password, 10);

  // Tạo tài khoản
  const user = await User.create({
    username,
    email,
    password_hash,
    full_name,
    phone,
    // Public registrations are always customer accounts. Privileged roles
    // must be assigned by an administrator through a protected workflow.
    role: 'USER',
  });

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
  };
}

/**
 * Đăng nhập
 */
export async function login(username, password) {
  const user = await User.findOne({
    where: { username },
  });

  if (!user) {
    throw new ApiError(
      401,
      'Tên đăng nhập hoặc mật khẩu không đúng.'
    );
  }

  if (user.status !== 'ACTIVE') {
    throw new ApiError(
      403,
      'Tài khoản đã bị khóa.'
    );
  }

  const validPassword = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!validPassword) {
    throw new ApiError(
      401,
      'Tên đăng nhập hoặc mật khẩu không đúng.'
    );
  }


  // Tạo JWT
  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    env.jwt.secret,
    {
      expiresIn: env.jwt.expiresIn,
    }
  );

  return {
    token,

    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    },
  };
}

/**
 * Lấy thông tin tài khoản
 */
export async function getProfile(userId) {
  const user = await User.findByPk(userId, {
    attributes: {
      exclude: ['password_hash'],
    },
  });

  if (!user) {
    throw new ApiError(404, 'Không tìm thấy tài khoản.');
  }

  return user;
}
