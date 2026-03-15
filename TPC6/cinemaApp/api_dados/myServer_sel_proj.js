const express = require("express");
const mongoose = require("mongoose");
const app = express();

app.use(express.json());

// O meu logger
app.use(function (req, res, next) {
  var d = new Date().toISOString().substring(0, 16);
  console.log(req.method + " " + req.url + " " + d);
  next();
});

// 1. Conexão ao MongoDB
const nomeBD = "cinema";
const mongoHost =
  process.env.MONGO_URL || `mongodb://127.0.0.1:27017/${nomeBD}`;
mongoose
  .connect(mongoHost)
  .then(() => console.log(`MongoDB: liguei-me à base de dados ${nomeBD}.`))
  .catch((err) => console.error("Erro:", err));

// 2. Esquemas flexíveis para as 3 coleções do TPC6
const schemaOptions = { strict: false, versionKey: false };
const Filme = mongoose.model(
  "Filme",
  new mongoose.Schema({}, { ...schemaOptions, collection: "filmes" }),
);
const Ator = mongoose.model(
  "Ator",
  new mongoose.Schema({}, { ...schemaOptions, collection: "atores" }),
);
const Genero = mongoose.model(
  "Genero",
  new mongoose.Schema({}, { ...schemaOptions, collection: "generos" }),
);

function parseFilterValue(v) {
  if (v === "true") return true;
  if (v === "false") return false;
  if (/^-?\d+$/.test(v)) return Number(v);
  return v;
}

function parseListQuery(query) {
  let queryObj = { ...query };

  const searchTerm = queryObj.q;
  const fields = queryObj._select;
  const sortField = queryObj._sort;
  const order = queryObj._order === "desc" ? -1 : 1;

  delete queryObj.q;
  delete queryObj._select;
  delete queryObj._sort;
  delete queryObj._order;

  let normalizedFilters = {};
  for (const key of Object.keys(queryObj)) {
    normalizedFilters[key] = parseFilterValue(queryObj[key]);
  }

  let mongoQuery = normalizedFilters;
  let projection = {};
  let mongoSort = {};

  if (searchTerm) {
    const textQuery = { $text: { $search: searchTerm } };
    mongoQuery =
      Object.keys(normalizedFilters).length > 0
        ? { $and: [textQuery, normalizedFilters] }
        : textQuery;
    projection.score = { $meta: "textScore" };
    mongoSort = { score: { $meta: "textScore" } };
  }

  if (fields) {
    fields.split(",").forEach((f) => {
      projection[f.trim()] = 1;
    });
  }

  if (sortField) {
    mongoSort = { [sortField]: order };
  }

  return { mongoQuery, projection, mongoSort };
}

function getIdFilter(idParam) {
  if (/^-?\d+$/.test(idParam)) {
    return { id: Number(idParam) };
  }

  if (mongoose.Types.ObjectId.isValid(idParam)) {
    return { _id: idParam };
  }

  return null;
}

function registerCollectionRoutes(basePath, model) {
  // GET /<colecao> - Listar com filtros, FTS, ordenação e projeção
  app.get(basePath, async (req, res) => {
    try {
      const { mongoQuery, projection, mongoSort } = parseListQuery(req.query);
      let execQuery = model.find(mongoQuery, projection);

      if (Object.keys(mongoSort).length > 0) {
        execQuery = execQuery.sort(mongoSort);
      }

      const docs = await execQuery.exec();
      res.json(docs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /<colecao>/:id - Pesquisa por id lógico ou _id
  app.get(`${basePath}/:id`, async (req, res) => {
    try {
      const filter = getIdFilter(req.params.id);
      if (!filter) return res.status(400).json({ error: "ID inválido" });

      const doc = await model.findOne(filter);
      if (!doc) return res.status(404).json({ error: "Não encontrado" });
      res.json(doc);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

}

app.get("/", (req, res) => {
  res.json({
    message: "API cinema TPC6",
    endpoints: [
      "/filmes",
      "/filmes/:id",
      "/atores",
      "/atores/:id",
      "/generos",
      "/generos/:id",
    ],
  });
});

registerCollectionRoutes("/filmes", Filme);
registerCollectionRoutes("/atores", Ator);
registerCollectionRoutes("/generos", Genero);

app.listen(7789, () => console.log("API cinema em http://localhost:7789"));
