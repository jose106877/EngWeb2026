const ANossaHistoria = require("../models/ANossaHistoria");
const Atividade = require("../models/Atividade");
const Departamento = require("../models/Departamento");
const Patrocinador = require("../models/Patrocinador");
const Pessoa = require("../models/Pessoa");
const Regulamento = require("../models/Regulamento");
const TextoSolto = require("../models/TextoSolto");

const registry = 
{
  anossahistoria: {
    slug: "anossahistoria",
    adminSlug: "a_nossa_historia",
    tag: "ANossaHistoria",
    model: ANossaHistoria,
    media: { link: { folder: "a_nossa_historia", publicPrefix: "/media/a_nossa_historia" } },
  },
  atividades: {
    slug: "atividades",
    tag: "Atividade",
    model: Atividade,
    media: { imagem_destaque: { folder: "atividades", publicPrefix: "/media/atividades" } },
  },
  departamentos: {
    slug: "departamentos",
    tag: "Departamento",
    model: Departamento,
    media: { link_fundo: { folder: "departamento_fundo", publicPrefix: "/media/departamento_fundo" } },
  },
  patrocinadores: {
    slug: "patrocinadores",
    tag: "Patrocinador",
    model: Patrocinador,
    media: { logo: { folder: "patrocinadores", publicPrefix: "/media/patrocinadores" } },
  },
  pessoas: {
    slug: "pessoas",
    tag: "Pessoa",
    model: Pessoa,
    media: { foto: { folder: "pessoas", publicPrefix: "/media/pessoas" } },
  },
  regulamentos: {
    slug: "regulamentos",
    tag: "Regulamento",
    model: Regulamento,
    media: { link: { folder: "documentos", publicPrefix: "/download/documentos" } },
  },
  "texto-solto": {
    slug: "texto-solto",
    tag: "TextoSolto",
    model: TextoSolto,
    singleton: true,
    media: {},
  },
};

function getPackageConfig(value) {
  const key = String(value || "").replace(/^\/+|\/+$/g, "");
  return (
    registry[key] ||
    Object.values(registry).find(
      (entry) => entry.adminSlug === key || entry.tag.toLowerCase() === key.toLowerCase(),
    ) ||
    null
  );
}

function getPackageConfigFromPath(pathname) {
  const [slug] = String(pathname || "").replace(/^\/+/, "").split("/");
  return getPackageConfig(slug);
}

module.exports = {
  getPackageConfig,
  getPackageConfigFromPath,
  packageRegistry: registry,
};
