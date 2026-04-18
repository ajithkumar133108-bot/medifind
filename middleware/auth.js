const jwt = require('jsonwebtoken');
const config = require('../config/config');

function getToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const [name, value] = part.trim().split('=');
    if (name === 'token') return value;
  }
  return null;
}

function authMiddleware(req, res, next) {
  const token = getToken(req);
  if (!token) return next();
  try {
    req.user = jwt.verify(token, config.jwtSecret);
  } catch {
    req.user = null;
  }
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(401).json({ error: 'Access denied.' });
    }
    next();
  };
}

function requireAnyRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(401).json({ error: 'Access denied.' });
    }
    next();
  };
}

module.exports = { authMiddleware, requireRole, requireAnyRole };
