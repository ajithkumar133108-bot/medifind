require('dotenv').config();

const toNumber = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

module.exports = {
  port: toNumber(process.env.PORT, 5000),
  jwtSecret: process.env.JWT_SECRET || 'medifind-secret-key',
  jwtExpiresIn: '24h',
  db: {
    host: process.env.DB_HOST || process.env.MYSQLHOST_PUBLIC || process.env.MYSQLHOST || 'localhost',
    port: toNumber(process.env.DB_PORT || process.env.MYSQLPORT_PUBLIC || process.env.MYSQLPORT, 3306),
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASS || process.env.MYSQLPASSWORD || 'root',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'medifind_db',
  },
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  },
  email: {
    enabled: process.env.EMAIL_ENABLED === 'true',
    gmail: process.env.GMAIL || '',
    appPassword: process.env.GMAIL_PASS || '',
  },
  googleMaps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
  },
};
