import * as authService from '../../services/authService.js';
import { ApiError } from '../../utils/ApiError.js';

export async function register(req, res) {
  const { username, email, password, full_name, phone } = req.body;

  if (!username || !email || !password || !full_name) {
    throw new ApiError(400, 'Vui lòng nhập đầy đủ thông tin.');
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
    message: 'Mã OTP đã được gửi đến email đăng ký.',
    data: result,
  });
}

export async function verifyRegistrationOtp(req, res) {
  const { challenge_token, otp } = req.body;

  if (!challenge_token || !/^\d{6}$/.test(String(otp))) {
    throw new ApiError(400, 'Vui lòng nhập mã OTP gồm 6 chữ số.');
  }

  const result = await authService.verifyRegistrationOtp(
    challenge_token,
    String(otp)
  );

  res.status(200).json({
    success: true,
    message: 'Xác thực email và đăng ký tài khoản thành công.',
    data: result,
  });
}

export async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new ApiError(
      400,
      'Vui lòng nhập tên đăng nhập và mật khẩu.'
    );
  }

  const result = await authService.login(username, password);

  res.status(200).json({
    success: true,
    message: 'Đăng nhập thành công.',
    data: result,
  });
}

export async function profile(req, res) {
  const user = await authService.getProfile(req.user.id);
  res.json({ success: true, data: user });
}

export async function logout(req, res) {
  res.json({
    success: true,
    message: 'Đăng xuất thành công.',
  });
}
