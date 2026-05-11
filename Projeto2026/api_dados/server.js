const mongoose = require("mongoose");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const app = express();

const aNossaHistoriaRouter = require("./routes/aNossaHistoriaRouter");
const atividadesRouter = require("./routes/atividadesRouter");
const departamentosRouter = require("./routes/departamentosRouter");
const patrocinadoresRouter = require("./routes/patrocinadoresRouter");
const pessoasRouter = require("./routes/pessoasRouter");
const regulamentosRouter = require("./routes/regulamentosRouter");
const packagesRouter = require("./routes/packagesRouter");
const supportRouter = require("./routes/supportRouter");
const textoSoltoRouter = require("./routes/textoSoltoRouter");
const { requireAdmin } = require("./middleware/auth");
const { attachTransportSecurityContext } = require("./transport/informationPackages");

const 
{
  attachPackageResponseMiddleware,
  PACKAGE_MEDIA_TYPE,
  parseZipSipRequest,
} = require("./transport/bagitPackages");
const swaggerDocument = YAML.load(path.join(__dirname, "swagger.yaml"));

const nomeDB = process.env.MONGO_URI || "mongodb://localhost:27017/aeeum";
const PORT = process.env.PORT || 7777;
const MEDIA_ROOT_CANDIDATES = [
  path.join(__dirname, "media"),
  path.join(__dirname, "..", "media"),
];
const MEDIA_ROOT = MEDIA_ROOT_CANDIDATES.find((candidate) => require("fs").existsSync(candidate)) ||
  MEDIA_ROOT_CANDIDATES[0];

app.use
(
  "/api",
  express.raw
  ({
    type: [PACKAGE_MEDIA_TYPE, "application/zip"],
    limit: "50mb",
  }),
);

app.use(express.json());
app.use(cookieParser());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/api", (req, res, next) => 
{
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
  const isPublicSupport = req.method === "POST" && req.path === "/apoio-aluno";

  if(!isMutation || isPublicSupport)
    return next();

  return requireAdmin(req, res, next);
});

app.use("/api", attachTransportSecurityContext);
app.use("/api", attachPackageResponseMiddleware);
app.use("/api", parseZipSipRequest);

app.use("/api", packagesRouter);
app.use("/api", atividadesRouter);
app.use("/api", departamentosRouter);
app.use("/api", patrocinadoresRouter);
app.use("/api", pessoasRouter);
app.use("/api", regulamentosRouter);
app.use("/api", supportRouter);
app.use("/api", textoSoltoRouter);
app.use("/api", aNossaHistoriaRouter);

// Servir imagens (mostrar)
app.use("/media", express.static(MEDIA_ROOT));

// Servir pdfs (download)
app.get("/download/*path", (req, res) => {
  const requestedPath = Array.isArray(req.params.path)
    ? req.params.path.join("/")
    : req.params.path;
  const mediaRoot = path.resolve(MEDIA_ROOT);
  const filepath = path.resolve(mediaRoot, requestedPath || "");

  if (!filepath.startsWith(`${mediaRoot}${path.sep}`)) {
    return res.status(400).json({ message: "Caminho de ficheiro inválido." });
  }

  res.download(filepath);
});

mongoose
  .connect(nomeDB)
  .then(() => console.log(`MongoDB: liguei-me à base de dados.`))
  .catch((err) => console.error(`Erro MongoDB: ${err.message}`));

app.listen(PORT, function () 
{
  console.log(`Servidor à escuta na porta ${PORT}`);
});
