import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';

import { EmailOtp, User } from '../models/index.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { sendRegistrationOtp } from './emailService.js';

function hashOtp(code) {
  return createHmac('sha256', env.jwt.secret).update(String(code)).digest('hex');
}

function createAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      type: 'access',
    },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
  };
}

function maskEmail(email) {
  const [name, domain] = email.split('@');
  const visible = name.slice(0, Math.min(3, name.length));
  return visible + '*'.repeat(Math.max(2, name.length - visible.length)) + '@' + domain;
}

export async function register(data) {
  const { username, email, password, full_name, phone } = data;

  const [usernameExists, emailExists] = await Promise.all([
    User.findOne({ where: { username } }),
    User.findOne({ where: { email } }),
  ]);

  const retryingUnverifiedRegistration =
    usernameExists &&
    emailExists &&
    usernameExists.id === emailExists.id &&
    usernameExists.role === 'USER' &&
    !usernameExists.email_verified_at;

  if (retryingUnverifiedRegistration) {
    await usernameExists.destroy();
  } else {
    if (usernameExists) {
      throw new ApiError(409, 'Tên đăng nhập đã tồn tại.');
    }
    if (emailExists) {
      throw new ApiError(409, 'Email đã được sử dụng.');
    }
  }

  const password_hash = await bcrypt.hash(password, 10);
  const user = await User.create({
    username,
    email,
    password_hash,
    full_name,
    phone,
    role: 'USER',
    status: 'INACTIVE',
    email_verified_at: null,
  });

  const otp = String(randomInt(100000, 1000000));
  const expiresAt = new Date(Date.now() + env.otp.expiresMinutes * 60 * 1000);
  const otpRecord = await EmailOtp.create({
    user_id: user.id,
    purpose: 'REGISTER',
    code_hash: hashOtp(otp),
    expires_at: expiresAt,
  });

  try {
    await sendRegistrationOtp({
      email: user.email,
      fullName: user.full_name,
      otp,
      expiresMinutes: env.otp.expiresMinutes,
    });
  } catch (error) {
    await user.destroy();
    throw error;
  }

  return {
    requires_otp: true,
    challenge_token: jwt.sign(
      { otp_id: otpRecord.id, id: user.id, type: 'register-otp' },
      env.jwt.secret,
      { expiresIn: env.jwt.otpExpiresIn }
    ),
    email: maskEmail(user.email),
    expires_in_seconds: env.otp.expiresMinutes * 60,
  };
}

export async function verifyRegistrationOtp(challengeToken, code) {
  let challenge;
  try {
    challenge = jwt.verify(challengeToken, env.jwt.secret);
  } catch {
    throw new ApiError(401, 'Phiên xác thực OTP không hợp lệ hoặc đã hết hạn.');
  }

  if (challenge.type !== 'register-otp' || !challenge.otp_id || !challenge.id) {
    throw new ApiError(401, 'Phiên xác thực OTP không hợp lệ.');
  }

  const otpRecord = await EmailOtp.findOne({
    where: {
      id: challenge.otp_id,
      user_id: challenge.id,
      purpose: 'REGISTER',
    },
  });

  if (!otpRecord || otpRecord.consumed_at) {
    throw new ApiError(401, 'Mã OTP không hợp lệ hoặc đã được sử dụng.');
  }
  if (otpRecord.expires_at.getTime() <= Date.now()) {
    throw new ApiError(401, 'Mã OTP đã hết hạn. Vui lòng đăng ký lại.');
  }
  if (otpRecord.attempts >= env.otp.maxAttempts) {
    throw new ApiError(429, 'Bạn đã nhập sai OTP quá nhiều lần. Vui lòng đăng ký lại.');
  }

  const providedHash = Buffer.from(hashOtp(code), 'hex');
  const storedHash = Buffer.from(otpRecord.code_hash, 'hex');
  const validCode =
    providedHash.length === storedHash.length &&
    timingSafeEqual(providedHash, storedHash);

  if (!validCode) {
    await otpRecord.increment('attempts');
    throw new ApiError(401, 'Mã OTP không đúng.');
  }

  const user = await User.findByPk(challenge.id);
  if (!user) {
    throw new ApiError(404, 'Không tìm thấy tài khoản đăng ký.');
  }

  otpRecord.consumed_at = new Date();
  await otpRecord.save();
  user.email_verified_at = new Date();
  user.status = 'ACTIVE';
  await user.save();

  return publicUser(user);
}

export async function login(username, password) {
  const user = await User.findOne({ where: { username } });

  if (!user) {
    throw new ApiError(401, 'Tên đăng nhập hoặc mật khẩu không đúng.');
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    throw new ApiError(401, 'Tên đăng nhập hoặc mật khẩu không đúng.');
  }

  if (user.role === 'USER' && !user.email_verified_at) {
    throw new ApiError(403, 'Tài khoản chưa xác thực email.');
  }
  if (user.status !== 'ACTIVE') {
    throw new ApiError(403, 'Tài khoản đã bị khóa.');
  }

  user.last_login = new Date();
  await user.save();

  return {
    token: createAccessToken(user),
    user: publicUser(user),
  };
}

export async function getProfile(userId) {
  const user = await User.findByPk(userId, {
    attributes: { exclude: ['password_hash'] },
  });

  if (!user) {
    throw new ApiError(404, 'Không tìm thấy tài khoản.');
  }

  return user;
}
