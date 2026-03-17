// config/index.js

const _config = {
  port: process.env.PORT || 8000,
  databaseUrl: process.env.MONGO_CONNECTION_STRING,
  env: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET,

  frontendDomainLanding: process.env.FRONTEND_DOMAIN_LANDING,
  frontendDomainAdmin: process.env.FRONTEND_DOMAIN_ADMIN,

  smtpHost: process.env.SMTP_HOST,
  smtpPort: Number(process.env.SMTP_PORT) || 587,
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  contactNotifyEmail: process.env.CONTACT_NOTIFY_EMAIL,
};

export const config = Object.freeze(_config);