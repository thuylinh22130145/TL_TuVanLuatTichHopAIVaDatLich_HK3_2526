import * as authService from '../../services/authService.js';
import { ApiError } from '../../utils/ApiError.js';

/**
 * Đăng ký tài khoản
 * POST /api/auth/register
 */
export async function register(req, res) {
  const {
    username,
    email,
    password,
    full_name,
    phone,
  } = req.body;

  if (
    !username ||
    !email ||
    !password ||
    !full_name
  ) {
    throw new ApiError(
      400,
      'Vui lòng nhập đầy đủ thông tin.'
    );
  }

  const result = await authService.register({
    username,
    email,
    password,
    full_name,
    phone,
  });

  res.status(201).json({
    success: true,
    message: 'Đăng ký thành công.',
    data: result,
  });
}

/**
 * Đăng nhập
 * POST /api/auth/login
 */
export async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new ApiError(
      400,
      'Vui lòng nhập tên đăng nhập và mật khẩu.'
    );
  }

  const result = await authService.login(
    username,
    password
  );

  res.status(200).json({
    success: true,
    message: 'Đăng nhập thành công.',
    data: result,
  });
}

/**
 * Lấy thông tin tài khoản hiện tại
 * GET /api/auth/profile
 */
export async function profile(req, res) {
  const user = await authService.getProfile(req.user.id);

  res.json({
    success: true,
    data: user,
  });
}

/**
 * Đăng xuất
 * POST /api/auth/logout
 *
 * JWT không cần xóa phía server.
 * Frontend chỉ cần xóa token.
 */
export async function logout(req, res) {
  res.json({
    success: true,
    message: 'Đăng xuất thành công.',
  });
}
