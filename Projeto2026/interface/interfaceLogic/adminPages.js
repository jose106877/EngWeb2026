"use strict";

const {
  collectionSections,
  singletonSections,
  loadSectionExtra,
  buildCollectionViewModel,
  buildCollectionFormViewModel,
  buildSingletonFormViewModel,
} = require("./adminSections");
const { renderApiUnavailable } = require("./rendering");

function buildAuthHeaders(req, getTokenFromRequest) {
  const token = getTokenFromRequest ? getTokenFromRequest(req) : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function registerAdminPages(router, { api, getTokenFromRequest }) {
  router.get("/admin", async (req, res) => {
    try {
      res.render("admin_index");
    } catch (err) {
      renderApiUnavailable(res, err);
    }
  });

  Object.keys(collectionSections).forEach((slug) => {
    router.get(`/admin/${slug}`, async (req, res) => {
      try {
        await renderAdminCollectionPage(api, res, slug);
      } catch (err) {
        renderApiUnavailable(res, err);
      }
    });

    router.get(`/admin/${slug}/pagina_novo`, async (req, res) => {
      try {
        await renderAdminCollectionFormPage(api, req, res, slug, "create");
      } catch (err) {
        renderApiUnavailable(res, err);
      }
    });

    router.get(`/admin/${slug}/pagina_edicao`, async (req, res) => {
      try {
        await renderAdminCollectionFormPage(api, req, res, slug, "edit");
      } catch (err) {
        renderApiUnavailable(res, err);
      }
    });

    router.delete(`/admin/${slug}/apagar`, async (req, res) => {
      try {
        const _id = req.query._id;
        await api.delete(`${collectionSections[slug].apiPath}/${_id}`, {
          headers: buildAuthHeaders(req, getTokenFromRequest),
        });
        res.sendStatus(200);
      } catch (err) {
        console.error("[apagar] erro:", err.response?.data || err.message);
        res.sendStatus(502);
      }
    });
  });

  Object.keys(singletonSections).forEach((slug) => {
    router.get(`/admin/${slug}`, async (req, res) => {
      try {
        await renderAdminSingletonPage(api, res, slug);
      } catch (err) {
        renderApiUnavailable(res, err);
      }
    });
  });

  registerHistoryAdminPages(router, { api, getTokenFromRequest });
}

function registerHistoryAdminPages(router, { api, getTokenFromRequest }) {
  router.get("/admin/a_nossa_historia", async (req, res) => {
    try {
      const aNossaHistoria = await api
        .get("/api/anossahistoria")
        .then((r) => r.data);
      const aNossaHistoriaOrdenada = aNossaHistoria.sort(
        (a, b) => a.ano - b.ano,
      );

      res.render("a_nossa_historia", {
        aNossaHistoria: aNossaHistoriaOrdenada,
      });
    } catch (err) {
      renderApiUnavailable(res, err);
    }
  });

  router.get("/admin/a_nossa_historia/pagina_novo", async (req, res) => {
    try {
      res.render("pagina_adicionar_a_nossa_historia");
    } catch (err) {
      renderApiUnavailable(res, err);
    }
  });

  router.get("/admin/a_nossa_historia/pagina_edicao", async (req, res) => {
    try {
      const _id = req.query._id;
      if (!_id) {
        res.status(400).render("error", {
          message: "Identificador em falta",
          error: { status: 400, stack: "" },
        });
        return;
      }

      const item = await api
        .get(`/api/anossahistoria/${_id}`)
        .then((r) => r.data);
      res.render("admin_entity_form", { form: buildHistoryEditForm(item) });
    } catch (err) {
      renderApiUnavailable(res, err);
    }
  });

  router.delete("/admin/a_nossa_historia/apagar", async (req, res) => {
    try {
      const _id = req.query._id;
      await api.delete(`/api/anossahistoria/${_id}`, {
        headers: buildAuthHeaders(req, getTokenFromRequest),
      });
      res.sendStatus(200);
    } catch (err) {
      console.error("[apagar] erro:", err.response?.data || err.message);
      res.sendStatus(502);
    }
  });
}

async function renderAdminCollectionPage(api, res, slug) {
  const section = collectionSections[slug];
  if (!section) {
    res.status(404).render("error", {
      message: "Secção não encontrada",
      error: { status: 404, stack: "" },
    });
    return;
  }

  const items = await api
    .get(section.apiPath)
    .then((response) => response.data);
  const page = buildCollectionViewModel(slug, items);
  res.render("admin_collection", { page });
}

async function renderAdminCollectionFormPage(api, req, res, slug, mode) {
  const section = collectionSections[slug];
  if (!section) {
    res.status(404).render("error", {
      message: "Secção não encontrada",
      error: { status: 404, stack: "" },
    });
    return;
  }

  const extra = await loadSectionExtra(api, slug);
  let item = null;

  if (mode === "edit") {
    const _id = req.query._id;
    if (!_id) {
      res.status(400).render("error", {
        message: "Identificador em falta",
        error: { status: 400, stack: "" },
      });
      return;
    }

    item = await api
      .get(`${section.apiPath}/${_id}`)
      .then((response) => response.data);
  }

  const form = buildCollectionFormViewModel(slug, mode, item, extra);
  res.render("admin_entity_form", { form });
}

async function renderAdminSingletonPage(api, res, slug) {
  const section = singletonSections[slug];
  if (!section) {
    res.status(404).render("error", {
      message: "Secção não encontrada",
      error: { status: 404, stack: "" },
    });
    return;
  }

  const item = await api.get(section.apiPath).then((response) => response.data);
  const form = buildSingletonFormViewModel(slug, item);
  res.render("admin_entity_form", { form });
}

function buildHistoryEditForm(item) {
  const fields = [
    {
      name: "_id",
      label: "ID",
      type: "text",
      required: true,
      readonly: true,
      value: item._id || "",
    },
    {
      name: "ano",
      label: "Ano",
      type: "number",
      required: true,
      value: item.ano || "",
    },
    {
      name: "imagem",
      label: "Imagem",
      type: "file",
      accept: "image/jpeg,image/png,image/webp",
      uploadName: "imagem",
      currentValue: item.link || "",
      previewType: "image",
      helpText:
        "Escolha um novo ficheiro apenas se quiser substituir a imagem atual.",
    },
    {
      name: "privacidade",
      label: "Privacidade",
      type: "select",
      required: true,
      value: item.privacidade || "publico",
      options: [
        { value: "publico", label: "Público" },
        { value: "privado", label: "Privado" },
      ],
    },
  ];

  return {
    title: 'Editar Ano de "A Nossa História"',
    description:
      "Atualize o ano, a visibilidade e, se necessário, substitua a imagem atual.",
    cancelHref: "/admin/a_nossa_historia",
    submitLabel: "Submeter",
    fields,
    clientConfig: {
      action: `/api/anossahistoria/${item._id}`,
      method: "PUT",
      successRedirect: "/admin/a_nossa_historia",
      fields,
    },
  };
}

module.exports = {
  registerAdminPages,
};
