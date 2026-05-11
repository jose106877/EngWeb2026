"use strict";

const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { issueToken } = require("../services/tokens");

const ALLOWED_ROLES = new Set(["admin", "consumidor"]);

function isBcryptHash(value) {
  return /^\$2[aby]\$\d{2}\$/.test(String(value || ""));
}

function publicUser(user) {
  if (!user) return null;

  const data = user.toObject ? user.toObject() : { ...user };
  delete data.password;
  return data;
}

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

function normalizeRole(role, fallback = "consumidor") {
  const candidate = String(role || "").trim().toLowerCase();
  return ALLOWED_ROLES.has(candidate) ? candidate : fallback;
}

function buildUserLookup(_id) {
  return { $or: [{ _id }, { username: _id }] };
}

async function login(req, res) {
  try {
    const username = String(req.body?.username || "").trim();
    const password = String(req.body?.password || "");

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username e password são obrigatórios." });
    }

    const user = await User.findOne({ username });

    if (!user || user.ativo === false) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    let passwordMatches = false;

    if (isBcryptHash(user.password)) {
      passwordMatches = await bcrypt.compare(password, user.password);
    } else {
      passwordMatches = user.password === password;

      if (passwordMatches) {
        user.password = await hashPassword(password);
      }
    }

    if (!passwordMatches) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    user.ultimo_acesso = new Date();
    await user.save();

    const token = issueToken(user);

    res.cookie(process.env.COOKIE_NAME || "auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 1000,
    });

    return res.json({
      status: "Login efetuado com sucesso.",
      user: publicUser(user),
      token,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

function logout(req, res) {
  res.clearCookie(process.env.COOKIE_NAME || "auth_token");
  res.clearCookie("token");
  return res.json({ status: "Sessão terminada." });
}

function verifyAdmin(req, res) {
  return res.sendStatus(204);
}

async function list(req, res) {
  try {
    const users = await User.find({}, { password: 0 }).sort({ nome: 1 }).exec();
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function findById(req, res) {
  try {
    const user = await User.findOne(buildUserLookup(req.params._id), {
      password: 0,
    }).exec();

    if (!user) {
      return res.status(404).json({ message: "Utilizador não encontrado." });
    }

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function create(req, res) {
  try {
    const payload = { ...req.body };
    if (payload.id && !payload._id) {
      payload._id = payload.id;
      delete payload.id;
    }
    payload.username = String(payload.username || payload._id || "").trim();
    payload._id = String(payload._id || payload.username).trim();
    payload.role = normalizeRole(payload.role);

    if (!payload.username || !payload.password || !payload.nome) {
      return res
        .status(400)
        .json({ message: "Username, nome e password são obrigatórios." });
    }

    const exists = await User.findOne({
      $or: [{ _id: payload._id }, { username: payload.username }],
    });

    if (exists) {
      return res.status(409).json({ message: "Utilizador já registado." });
    }

    payload.password = await hashPassword(payload.password);
    const user = await new User(payload).save();

    return res.status(201).json(publicUser(user));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function update(req, res) {
  try {
    const payload = { ...req.body };
    if (payload.id && !payload._id) {
      payload._id = payload.id;
      delete payload.id;
    }
    delete payload._id;
    delete payload.id;

    if (Object.prototype.hasOwnProperty.call(payload, "role")) {
      payload.role = normalizeRole(payload.role);
    }

    if (payload.password) {
      payload.password = await hashPassword(payload.password);
    } else {
      delete payload.password;
    }

    const user = await User.findOneAndUpdate(
      buildUserLookup(req.params._id),
      payload,
      { new: true, projection: { password: 0 } },
    );

    if (!user) {
      return res.status(404).json({ message: "Utilizador não encontrado." });
    }

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function remove(req, res) {
  try {
    const result = await User.deleteOne(buildUserLookup(req.params._id)).exec();

    if (!result.deletedCount) {
      return res.status(404).json({ message: "Utilizador não encontrado." });
    }

    return res.json({ status: "Removido." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  create,
  findById,
  list,
  login,
  logout,
  remove,
  update,
  verifyAdmin,
};
