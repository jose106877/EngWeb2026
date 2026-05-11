const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "secret_default_2026";
const COOKIE_NAMES = [
  process.env.COOKIE_NAME || "auth_token",
  "token",
].filter(Boolean);

function getBearerToken(req) {
  const authorization = req.headers.authorization || "";
  const [scheme, token] = authorization.split(/\s+/);

  if (/^Bearer$/i.test(scheme) && token) {
    return token;
  }

  return null;
}

function getCookieToken(req) {
  for (const cookieName of COOKIE_NAMES) {
    if (req.cookies?.[cookieName]) {
      return req.cookies[cookieName];
    }
  }

  return null;
}

function getTokenFromRequest(req) {
  return getBearerToken(req) || getCookieToken(req) || req.query?.token || null;
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
    return res.status(401).json({
      message: "Autenticação necessária.",
    });
  }

  req.user = payload;
  if (req.securityContext) {
    req.securityContext.authenticated = true;
  }
  return next();
}

function requireAdmin(req, res, next) {
  return requireAuth(req, res, () => {
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        message: "Permissões insuficientes.",
      });
    }

    return next();
  });
}

module.exports = {
  getTokenFromRequest,
  requireAdmin,
  requireAuth,
  verifyToken,
};
