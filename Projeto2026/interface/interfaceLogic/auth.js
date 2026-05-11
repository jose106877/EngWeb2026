"use strict";

const jwt = require("jsonwebtoken");

const COOKIE_NAME = process.env.COOKIE_NAME || "auth_token";
const JWT_SECRET = process.env.JWT_SECRET || "secret_default_2026";
const LOGIN_PATH = process.env.LOGIN_PATH || "/users/login";
const LOGOUT_PATH = process.env.LOGOUT_PATH || "/users/logout";
const DEFAULT_REDIRECT_PATH = process.env.DEFAULT_AUTH_REDIRECT || "/admin";
const ADMIN_DISPLAY_NAME =
  process.env.ADMIN_DISPLAY_NAME || "Administração AEEUM";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

function parseExpiryToMs(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value * 1000;
  }

  const normalized = String(value || "").trim();
  const match = normalized.match(/^(\d+)([smhd])$/i);
  if (!match) return 60 * 60 * 1000;

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * (multipliers[unit] || multipliers.h);
}

function sanitizeRedirectPath(value) {
  const candidate = String(value || "").trim();

  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return DEFAULT_REDIRECT_PATH;
  }

  return candidate;
}

function buildLoginRedirect(originalUrl) {
  const redirectTo = sanitizeRedirectPath(originalUrl);
  return `${LOGIN_PATH}?redirect=${encodeURIComponent(redirectTo)}`;
}

function getTokenFromRequest(req) {
  const authorization = req.headers.authorization || "";
  const [scheme, token] = authorization.split(/\s+/);

  if (/^Bearer$/i.test(scheme) && token) {
    return token;
  }

  return req.cookies?.[COOKIE_NAME] || null;
}

function verifyToken(token) {
  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

function getAuthenticatedUser(req) {
  return verifyToken(getTokenFromRequest(req));
}

function issueAuthCookie(res, user) {
  const payload = {
    sub: user.sub || "admin",
    username: user.username,
    nome: user.nome || ADMIN_DISPLAY_NAME,
    role: user.role === "admin" ? "admin" : "consumidor",
  };

  const token =
    user.token ||
    jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: parseExpiryToMs(JWT_EXPIRES_IN),
  });

  return token;
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME);
}

function attachAuthContext(req, res, next) {
  const user = getAuthenticatedUser(req);

  if (user) {
    req.user = user;
    res.locals.adminUser = user;
    res.locals.isAuthenticatedAdmin = true;
  } else {
    res.locals.adminUser = null;
    res.locals.isAuthenticatedAdmin = false;
  }

  next();
}

function handleUnauthorized(req, res) {
  clearAuthCookie(res);

  const redirectTo = buildLoginRedirect(
    req.originalUrl || DEFAULT_REDIRECT_PATH,
  );

  if (req.method === "GET") {
    return res.redirect(redirectTo);
  }

  return res.status(401).json({
    message: "Autenticação necessária.",
    redirectTo,
  });
}

function requireAdminAuth(req, res, next) {
  const user = getAuthenticatedUser(req);

  if (!user || user.role !== "admin") {
    return handleUnauthorized(req, res);
  }

  req.user = user;
  res.locals.adminUser = user;
  res.locals.isAuthenticatedAdmin = true;
  return next();
}

function isAuthenticated(req) {
  const user = getAuthenticatedUser(req);
  return Boolean(user && user.role === "admin");
}

module.exports = {
  LOGIN_PATH,
  LOGOUT_PATH,
  DEFAULT_REDIRECT_PATH,
  ADMIN_DISPLAY_NAME,
  attachAuthContext,
  buildLoginRedirect,
  clearAuthCookie,
  getAuthenticatedUser,
  getTokenFromRequest,
  handleUnauthorized,
  isAuthenticated,
  issueAuthCookie,
  requireAdminAuth,
  sanitizeRedirectPath,
};
