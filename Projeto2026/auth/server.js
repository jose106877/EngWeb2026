"use strict";

const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
require("dotenv").config();

const usersRouter = require("./routes/users");

const app = express();
const PORT = process.env.PORT || 19000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/aeeum";
const swaggerDocument = YAML.load(path.join(__dirname, "swagger.yaml"));

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/users", usersRouter);
app.use("/auth-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/", (req, res) => {
  res.json({
    status: "Serviço de autenticação AEEUM ativo.",
    data: new Date().toISOString(),
  });
});

app.use((req, res) => {
  res.status(404).json({ message: "Caminho não encontrado." });
});

app.use((err, req, res, next) => {
  console.error("[auth] erro:", err.stack || err.message);
  res.status(err.status || 500).json({
    message: err.message || "Erro interno.",
  });
});

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Auth MongoDB: ligado.");
    app.listen(PORT, () => {
      console.log(`Auth service -> http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Auth MongoDB erro:", err.message);
    process.exit(1);
  });
