"use strict";

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, unique: true, sparse: true },
    password: { type: String, required: true },
    nome: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "consumidor"],
      default: "consumidor",
      required: true,
    },
    privacidade: { type: String, default: "privado" },
    filiacao: { type: String, default: "" },
    nivel_acesso: { type: Number, default: 1, min: 1, max: 10 },
    data_registo: { type: Date, default: Date.now },
    ultimo_acesso: { type: Date },
    ativo: { type: Boolean, default: true },
  },
  { versionKey: false },
);

module.exports = mongoose.model("User", userSchema, "users");
