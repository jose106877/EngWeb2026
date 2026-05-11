"use strict";

const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "secret_default_2026";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

function issueToken(user) {
  const role = user.role === "admin" ? "admin" : "consumidor";
  const actor = role === "admin" ? "administrador" : "consumidor";

  return jwt.sign(
    {
      sub: user._id?.toString() || user.username,
      username: user.username,
      nome: user.nome,
      role,
      actor,
      nivel: user.nivel_acesso,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

module.exports = {
  JWT_EXPIRES_IN,
  issueToken,
};
