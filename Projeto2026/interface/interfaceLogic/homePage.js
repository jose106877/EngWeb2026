"use strict";

const {
  loadLocalRegulationsFallback,
  normalizeMediaPath,
} = require("./documentHelpers");
const { renderApiUnavailable } = require("./rendering");

function registerHomePage(router, { api, documentsRoot }) {
  router.get("/", async (req, res) => {
    try {
      const [
        patrocinadores,
        textoSolto,
        departamentos,
        pessoas,
        atividades,
        regulamentos,
        anossahistoria,
      ] = await Promise.all([
        api.get("/api/patrocinadores").then((r) => r.data),
        api.get("/api/texto-solto").then((r) => r.data),
        api.get("/api/departamentos").then((r) => r.data),
        api.get("/api/pessoas").then((r) => r.data),
        api.get("/api/atividades").then((r) => r.data),
        api.get("/api/regulamentos").then((r) => r.data),
        api.get("/api/anossahistoria").then((r) => r.data),
      ]);

      const pessoasProcessadas = pessoas.map((p) => ({
        ...p,
        nomeCompleto: [p.nome, p.apelido].filter(Boolean).join(" "),
      }));

      const atividadesProcessadas = atividades.map((a) => ({
        ...a,
        imagem_destaque: normalizeMediaPath(
          a.imagem_destaque,
          "/media/atividades",
        ),
      }));

      let regulamentosProcessados = (Array.isArray(regulamentos)
        ? regulamentos
        : []
      ).map((r) => ({
        ...r,
        link:
          normalizeMediaPath(r.link, "/download/documentos") ||
          normalizeMediaPath(r.ficheiro, "/download/documentos"),
        ficheiro:
          normalizeMediaPath(r.link, "/download/documentos") ||
          normalizeMediaPath(r.ficheiro, "/download/documentos"),
      }));

      if (!regulamentosProcessados.length) {
        regulamentosProcessados = await loadLocalRegulationsFallback(documentsRoot);
      }

      const antigosPresidentes = pessoasProcessadas
        .filter((p) => p.cargo === "Antigo Presidente")
        .sort((a, b) => b.ano - a.ano);

      const anossahistoriaOrdenada = anossahistoria.sort(
        (a, b) => a.ano - b.ano,
      );

      res.render("index", {
        patrocinadores,
        textoSolto,
        departamentos,
        pessoas: pessoasProcessadas,
        atividades: atividadesProcessadas,
        regulamentos: regulamentosProcessados,
        anossahistoria: anossahistoriaOrdenada,
        antigosPresidentes,
      });
    } catch (err) {
      renderApiUnavailable(res, err);
    }
  });
}

module.exports = {
  registerHomePage,
};
