"use strict";

const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "secret_default_2026";
const COOKIE_NAME = process.env.COOKIE_NAME || "auth_token";
const LEGACY_COOKIE_NAME = "token";

function getBearerToken(req) {
  const authorization = req.headers.authorization || "";
  const [scheme, token] = authorization.split(/\s+/);

  if (/^Bearer$/i.test(scheme) && token) {
    return token;
  }

  return null;
}

function getTokenFromRequest(req) {
  return (
    getBearerToken(req) ||
    req.cookies?.[COOKIE_NAME] ||
    req.cookies?.[LEGACY_COOKIE_NAME] ||
    req.query?.token ||
    null
  );
}

function verifyToken(token) {
  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

function requireAuth(req, res, next) {
  const payload = verifyToken(getTokenFromRequest(req));

  if (!payload) {
    return res.status(401).json({ message: "Autenticação necessária." });
  }

  req.user = payload;
  return next();
}

function requireAdmin(req, res, next) {
  return requireAuth(req, res, () => {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Permissões insuficientes." });
    }

    return next();
  });
}

module.exports = {
  COOKIE_NAME,
  getTokenFromRequest,
  requireAdmin,
  requireAuth,
  verifyToken,
};
