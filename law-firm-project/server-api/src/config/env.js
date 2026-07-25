import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    dialect: process.env.DB_DIALECT || 'sqlite',
    storage: process.env.DB_STORAGE || './data/law_firm.sqlite',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    name: process.env.DB_NAME || 'law_firm_db',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-only-jwt-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    otpExpiresIn: process.env.JWT_OTP_EXPIRES_IN || '5m',
  },
  otp: {
    expiresMinutes: Number(process.env.OTP_EXPIRES_MINUTES) || 5,
    maxAttempts: Number(process.env.OTP_MAX_ATTEMPTS) || 5,
  },
  mail: {
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.MAIL_PORT) || 587,
    secure: process.env.MAIL_SECURE === 'true',
    user: process.env.MAIL_USER === '22130145@st.hcmuaf.edu'
      ? '22130145@st.hcmuaf.edu.vn'
      : process.env.MAIL_USER || '22130145@st.hcmuaf.edu.vn',
    password: process.env.MAIL_PASSWORD || 'lhrymxbdpkoepfxm',
    fromName: process.env.MAIL_FROM_NAME || 'Tư vấn pháp lý AI',
  },
  ai: {
    serviceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
    apiKey: process.env.AI_SERVICE_API_KEY || 'change-me-internal-key',
  },
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
