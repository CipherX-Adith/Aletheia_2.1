import 'dotenv/config';

const required = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`[ENV] Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  STELLAR_NETWORK: process.env.STELLAR_NETWORK || 'testnet',
  STELLAR_HORIZON_URL: process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org',
  STELLAR_SOROBAN_URL: process.env.STELLAR_SOROBAN_URL || 'https://soroban-testnet.stellar.org',
  PLATFORM_STELLAR_PUBLIC_KEY: process.env.PLATFORM_STELLAR_PUBLIC_KEY || '',
  PLATFORM_STELLAR_SECRET_KEY: process.env.PLATFORM_STELLAR_SECRET_KEY || '',
  STELLAR_ISSUER_SECRET_KEY: process.env.STELLAR_ISSUER_SECRET_KEY || process.env.PLATFORM_STELLAR_SECRET_KEY || '',
  STELLAR_ORACLE_SECRET_KEY: process.env.STELLAR_ORACLE_SECRET_KEY || '',
  RECEIVABLE_REGISTRY_CONTRACT_ID: process.env.RECEIVABLE_REGISTRY_CONTRACT_ID || '',
  FRACTIONAL_SALE_CONTRACT_ID: process.env.FRACTIONAL_SALE_CONTRACT_ID || '',
  SETTLEMENT_ESCROW_CONTRACT_ID: process.env.SETTLEMENT_ESCROW_CONTRACT_ID || '',
  PINATA_API_KEY: process.env.PINATA_API_KEY || '',
  PINATA_SECRET_KEY: process.env.PINATA_SECRET_KEY || '',
  USE_IPFS: process.env.USE_IPFS === 'true',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_MODEL: process.env.GROQ_MODEL || 'llama-3.1-70b-versatile',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@aletheia.trade',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
};

export default env;
