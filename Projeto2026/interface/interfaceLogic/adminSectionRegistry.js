"use strict";

const PRIVACIDADE_OPTIONS = [
  { value: "publico", label: "Público" },
  { value: "privado", label: "Privado" },
];

const DIRECAO_OPTIONS = [
  { value: "true", label: "Sim" },
  { value: "false", label: "Não" },
];

const BOOLEAN_OPTIONS = [
  { value: "true", label: "Sim" },
  { value: "false", label: "Não" },
];

function normalizeArray(value) {
  if (Array.isArray(value)) return value.map(String);
  if (value === undefined || value === null || value === "") return [];
  return [String(value)];
}

function textCell(value, emptyLabel = "—") {
  const content = String(value ?? "").trim();
  return { type: "text", value: content || emptyLabel };
}

function badgeCell(value) {
  return { type: "badge", value: String(value ?? "").trim() || "—" };
}

function imageCell(src, alt, emptyLabel = "(Sem imagem)") {
  if (!src) return textCell(emptyLabel);
  return { type: "image", src, alt: alt || "Imagem" };
}

function linkCell(href, label, emptyLabel = "—") {
  if (!href) return textCell(emptyLabel);
  return { type: "link", href, label: label || href };
}

function formatDateDisplay(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatDateInput(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);

  return date.toISOString().slice(0, 10);
}

function stripHtml(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function excerpt(value, maxLength = 140) {
  const clean = stripHtml(value);
  if (!clean) return "—";
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 1)}…`;
}

const collectionSections = {
  atividades: {
    slug: "atividades",
    title: "Atividades",
    singular: "Atividade",
    apiPath: "/api/atividades",
    description:
      "Adicione novas atividades, edite publicações existentes ou remova entradas antigas.",
    addLabel: "+ Adicionar Atividade",
    columns: ["ID", "Título", "Data", "Link", "Carrossel", "Imagem", "Privacidade"],
    sortItems(items) {
      return [...items].sort(
        (a, b) => new Date(b.data || 0).getTime() - new Date(a.data || 0).getTime(),
      );
    },
    buildRows(items) {
      return items.map((item) => ({
        id: item._id,
        cells: [
          textCell(item._id),
          textCell(item.titulo),
          textCell(formatDateDisplay(item.data)),
          linkCell(item.link, item.link),
          badgeCell(item.mostrar_no_carrossel ? "Sim" : "Não"),
          imageCell(item.imagem_destaque, `Imagem de destaque de ${item.titulo}`, "(Sem imagem)"),
          badgeCell(item.privacidade),
        ],
      }));
    },
    buildFields(item) {
      return [
        {
          name: "_id",
          label: "ID",
          type: "text",
          required: true,
          placeholder: "Ex: ati-001",
          value: item?._id || "",
        },
        {
          name: "titulo",
          label: "Título",
          type: "text",
          required: true,
          placeholder: "Ex: Congresso Nacional",
          value: item?.titulo || "",
        },
        {
          name: "link",
          label: "Link",
          type: "url",
          required: true,
          placeholder: "https://www.instagram.com/p/...",
          value: item?.link || "",
        },
        {
          name: "data",
          label: "Data",
          type: "date",
          required: true,
          value: formatDateInput(item?.data),
        },
        {
          name: "nome_destaque",
          label: "Nome no carrossel",
          type: "text",
          placeholder: "Ex: Congresso Nacional",
          value: item?.nome_destaque || "",
          helpText:
            "Este nome aparece no carrossel superior da secção de atividades.",
        },
        {
          name: "imagem",
          label: "Imagem do carrossel",
          type: "file",
          accept: "image/jpeg,image/png,image/webp",
          uploadName: "imagem",
          currentValue: item?.imagem_destaque || "",
          previewType: "image",
          helpText:
            "Adicione uma imagem horizontal para o carrossel superior. Pode deixar vazio se a atividade só existir no feed.",
        },
        {
          name: "imagem_url_externa",
          label: "URL da imagem (opcional)",
          type: "url",
          placeholder: "https://…",
          value:
            item?.imagem_destaque && String(item.imagem_destaque).startsWith("http")
              ? item.imagem_destaque
              : "",
          helpText:
            "Alternativa ao upload (ex.: pré-visualização do Instagram). Se fizer upload, o ficheiro tem prioridade.",
        },
        {
          name: "mostrar_no_carrossel",
          label: "Mostrar no carrossel",
          type: "select",
          required: true,
          value: String(item?.mostrar_no_carrossel ?? false),
          options: BOOLEAN_OPTIONS,
        },
        {
          name: "ordem_carrossel",
          label: "Ordem no carrossel",
          type: "number",
          value: Number(item?.ordem_carrossel ?? 0),
          placeholder: "0",
          helpText: "Os valores mais baixos aparecem primeiro no carrossel.",
        },
        {
          name: "privacidade",
          label: "Privacidade",
          type: "select",
          required: true,
          value: item?.privacidade || "publico",
          options: PRIVACIDADE_OPTIONS,
        },
      ];
    },
  },
  departamentos: {
    slug: "departamentos",
    title: "Departamentos",
    singular: "Departamento",
    apiPath: "/api/departamentos",
    description:
      "Gira a informação base dos departamentos, incluindo imagem de fundo e ligações a pessoas, regulamentos e atividades.",
    addLabel: "+ Adicionar Departamento",
    columns: ["ID", "Nome", "Direção", "Imagem", "Pessoas", "Regulamentos", "Atividades"],
    sortItems(items) {
      return [...items].sort((a, b) => String(a.nome || "").localeCompare(String(b.nome || ""), "pt"));
    },
    buildRows(items) {
      return items.map((item) => ({
        id: item._id,
        cells: [
          textCell(item._id),
          textCell(item.nome),
          badgeCell(item.parte_da_direcao === "true" || item.parte_da_direcao === true ? "Sim" : "Não"),
          imageCell(item.link_fundo, `Imagem de ${item.nome}`, "(Sem fundo)"),
          textCell((item.participantes || item.pessoas || []).length),
          textCell(normalizeArray(item.regulamentos).length),
          textCell(normalizeArray(item.atividades).length),
        ],
      }));
    },
    buildFields(item, extra) {
      const pessoas = [...(extra.pessoas || [])].sort((a, b) =>
        String(a.nomeCompleto || a.nome || "").localeCompare(String(b.nomeCompleto || b.nome || ""), "pt"),
      );
      const regulamentos = [...(extra.regulamentos || [])].sort((a, b) =>
        String(a.nome || "").localeCompare(String(b.nome || ""), "pt"),
      );
      const atividades = [...(extra.atividades || [])].sort(
        (a, b) => new Date(b.data || 0).getTime() - new Date(a.data || 0).getTime(),
      );
      const participantes = (item?.participantes?.length
        ? item.participantes
        : normalizeArray(item?.pessoas).map((pessoaId, index) => {
            const pessoa = pessoas.find((entry) => String(entry._id) === String(pessoaId));
            return {
              pessoa: String(pessoaId),
              cargo: pessoa?.cargo || "",
              ordem: index,
            };
          })
      ).sort((a, b) => Number(a?.ordem || 0) - Number(b?.ordem || 0));

      return [
        {
          name: "_id",
          label: "ID",
          type: "text",
          required: true,
          placeholder: "Ex: apoio-aluno",
          value: item?._id || "",
        },
        {
          name: "nome",
          label: "Nome",
          type: "text",
          required: true,
          placeholder: "Ex: Departamento de Apoio ao Aluno",
          value: item?.nome || "",
        },
        {
          name: "descricao",
          label: "Descrição",
          type: "textarea",
          required: true,
          rows: 6,
          placeholder: "Descrição do departamento",
          value: item?.descricao || "",
        },
        {
          name: "parte_da_direcao",
          label: "Parte da direção",
          type: "select",
          required: true,
          value: String(item?.parte_da_direcao ?? "true"),
          options: DIRECAO_OPTIONS,
        },
        {
          name: "imagem",
          label: "Imagem de fundo",
          type: "file",
          required: !item,
          accept: "image/jpeg,image/png,image/webp",
          uploadName: "imagem",
          currentValue: item?.link_fundo || "",
          previewType: "image",
          helpText: item
            ? "Escolha uma nova imagem apenas se quiser substituir a atual."
            : "Formatos permitidos: JPG, PNG ou WEBP.",
        },
        {
          name: "participantes",
          label: "Participantes",
          type: "structured-list",
          value: participantes,
          addLabel: "+ Adicionar participante",
          helpText:
            "Define a pessoa, o cargo apresentado no departamento e a ordem em que surge no site.",
          fields: [
            {
              name: "pessoa",
              label: "Pessoa",
              type: "select",
              required: true,
              options: pessoas.map((pessoa) => ({
                value: String(pessoa._id),
                label: [pessoa.nomeCompleto || pessoa.nome || pessoa._id, pessoa.cargo]
                  .filter(Boolean)
                  .join(" - "),
              })),
            },
            {
              name: "cargo",
              label: "Cargo no departamento",
              type: "text",
              placeholder: "Ex: Coordenação",
            },
            {
              name: "ordem",
              label: "Ordem",
              type: "number",
              placeholder: "0",
            },
          ],
        },
        {
          name: "regulamentos",
          label: "Regulamentos",
          type: "multiselect",
          size: 8,
          value: normalizeArray(item?.regulamentos),
          options: regulamentos.map((regulamento) => ({
            value: String(regulamento._id),
            label: [regulamento.nome, regulamento.ano].filter(Boolean).join(" - "),
          })),
        },
        {
          name: "atividades",
          label: "Atividades",
          type: "multiselect",
          size: 8,
          value: normalizeArray(item?.atividades),
          options: atividades.map((atividade) => ({
            value: String(atividade._id),
            label: [atividade.titulo, formatDateDisplay(atividade.data)].filter(Boolean).join(" - "),
          })),
        },
        {
          name: "privacidade",
          label: "Privacidade",
          type: "select",
          required: true,
          value: item?.privacidade || "publico",
          options: PRIVACIDADE_OPTIONS,
        },
      ];
    },
  },
  patrocinadores: {
    slug: "patrocinadores",
    title: "Patrocinadores",
    singular: "Patrocinador",
    apiPath: "/api/patrocinadores",
    description:
      "Gira os patrocinadores visíveis no site, incluindo o logótipo e a ligação externa opcional.",
    addLabel: "+ Adicionar Patrocinador",
    columns: ["ID", "Nome", "Link", "Logo", "Privacidade"],
    sortItems(items) {
      return [...items].sort((a, b) => String(a.nome || "").localeCompare(String(b.nome || ""), "pt"));
    },
    buildRows(items) {
      return items.map((item) => ({
        id: item._id,
        cells: [
          textCell(item._id),
          textCell(item.nome),
          linkCell(item.link, item.link || "Sem link"),
          imageCell(item.logo, `Logo de ${item.nome}`),
          badgeCell(item.privacidade),
        ],
      }));
    },
    buildFields(item) {
      return [
        {
          name: "_id",
          label: "ID",
          type: "text",
          required: true,
          placeholder: "Ex: pat-001",
          value: item?._id || "",
        },
        {
          name: "nome",
          label: "Nome",
          type: "text",
          required: true,
          placeholder: "Ex: Oh My Needle!",
          value: item?.nome || "",
        },
        {
          name: "link",
          label: "Link externo",
          type: "url",
          placeholder: "https://...",
          value: item?.link || "",
        },
        {
          name: "imagem",
          label: "Logótipo",
          type: "file",
          required: !item,
          accept: "image/jpeg,image/png,image/webp",
          uploadName: "imagem",
          currentValue: item?.logo || "",
          previewType: "image",
          helpText: item
            ? "Escolha um novo ficheiro apenas se quiser substituir o logótipo atual."
            : "Formatos permitidos: JPG, PNG ou WEBP.",
        },
        {
          name: "privacidade",
          label: "Privacidade",
          type: "select",
          required: true,
          value: item?.privacidade || "publico",
          options: PRIVACIDADE_OPTIONS,
        },
      ];
    },
  },
  regulamentos: {
    slug: "regulamentos",
    title: "Regulamentos",
    singular: "Regulamento",
    apiPath: "/api/regulamentos",
    description:
      "Gira os documentos e ligações dos regulamentos publicados no site.",
    addLabel: "+ Adicionar Regulamento",
    columns: ["ID", "Nome", "Ano", "Departamento", "Documento", "Privacidade"],
    sortItems(items) {
      return [...items].sort((a, b) => {
        const byYear = String(b.ano || "").localeCompare(String(a.ano || ""), "pt");
        if (byYear !== 0) return byYear;
        return String(a.nome || "").localeCompare(String(b.nome || ""), "pt");
      });
    },
    buildRows(items) {
      return items.map((item) => ({
        id: item._id,
        cells: [
          textCell(item._id),
          textCell(item.nome),
          textCell(item.ano),
          textCell(item.departamento),
          linkCell(item.link, "Abrir documento"),
          badgeCell(item.privacidade),
        ],
      }));
    },
    buildFields(item) {
      return [
        {
          name: "_id",
          label: "ID",
          type: "text",
          required: true,
          placeholder: "Ex: reg-001",
          value: item?._id || "",
        },
        {
          name: "nome",
          label: "Nome",
          type: "text",
          required: true,
          placeholder: "Ex: Estatutos AEEUM",
          value: item?.nome || "",
        },
        {
          name: "ano",
          label: "Ano",
          type: "text",
          required: true,
          placeholder: "Ex: 2026",
          value: item?.ano || "",
        },
        {
          name: "departamento",
          label: "Departamento",
          type: "text",
          required: true,
          placeholder: "Ex: Direção",
          value: item?.departamento || "",
        },
        {
          name: "ficheiro",
          label: "Documento PDF",
          type: "file",
          required: !item,
          accept: "application/pdf",
          uploadName: "ficheiro",
          currentValue: item?.link || "",
          previewType: "file",
          helpText: item
            ? "Escolha um novo PDF apenas se quiser substituir o documento atual."
            : "Formato permitido: PDF.",
        },
        {
          name: "privacidade",
          label: "Privacidade",
          type: "select",
          required: true,
          value: item?.privacidade || "publico",
          options: PRIVACIDADE_OPTIONS,
        },
      ];
    },
  },
};

const singletonSections = {
  texto_solto: {
    slug: "texto_solto",
    title: "Textos",
    singular: "Textos",
    apiPath: "/api/texto-solto",
    description:
      "Atualize o slogan, a carta à comunidade e a lista de vantagens de sócio.",
    buildFields(item) {
      return [
        {
          name: "slogan",
          label: "Slogan",
          type: "text",
          required: true,
          placeholder: "Ex: Inovar com propósito, Agir com integridade",
          value: item?.slogan || "",
        },
        {
          name: "carta_comunidade",
          label: "Carta à Comunidade",
          type: "textarea",
          required: true,
          rows: 14,
          placeholder: "Pode introduzir texto simples ou HTML.",
          value: item?.carta_comunidade || "",
          helpText: "Este campo aceita HTML, tal como está a ser usado no site público.",
        },
        {
          name: "link-voluntario",
          label: "Link para voluntários",
          type: "url",
          required: false,
          placeholder: "https://...",
          value: item?.["link-voluntario"] || "",
        },
        {
          name: "link-colaborador",
          label: "Link para colaboradores",
          type: "url",
          required: false,
          placeholder: "https://...",
          value: item?.["link-colaborador"] || "",
        },
        {
          name: "vantagens_socio",
          label: "Vantagens de Sócio",
          type: "repeater",
          itemKey: "texto",
          value:
            (item?.vantagens_socio || []).map((vantagem) => vantagem?.texto).filter(Boolean) || [],
          itemPlaceholder: "Ex: Descontos em todas as atividades realizadas pela AEEUM",
        },
      ];
    },
    buildSummary(item) {
      return [
        {
          label: "Slogan atual",
          value: excerpt(item?.slogan, 90),
        },
        {
          label: "Carta à comunidade",
          value: excerpt(item?.carta_comunidade, 140),
        },
        {
          label: "Vantagens configuradas",
          value: String((item?.vantagens_socio || []).length),
        },
      ];
    },
  },
};

async function loadSectionExtra(api, slug) {
  if (slug !== "departamentos") return {};

  const [pessoas, regulamentos, atividades] = await Promise.all([
    api.get("/api/pessoas").then((response) => response.data),
    api.get("/api/regulamentos").then((response) => response.data),
    api.get("/api/atividades").then((response) => response.data),
  ]);

  const pessoasProcessadas = pessoas.map((pessoa) => ({
    ...pessoa,
    nomeCompleto:
      pessoa.nomeCompleto || [pessoa.nome, pessoa.apelido].filter(Boolean).join(" "),
  }));

  return {
    pessoas: pessoasProcessadas,
    regulamentos,
    atividades,
  };
}

function getCollectionSection(slug) {
  return collectionSections[slug] || null;
}

function getSingletonSection(slug) {
  return singletonSections[slug] || null;
}

function buildCollectionViewModel(slug, items) {
  const section = getCollectionSection(slug);
  if (!section) return null;

  const orderedItems = section.sortItems ? section.sortItems(items) : [...items];
  const rows = section.buildRows(orderedItems).map((row) => ({
    ...row,
    editHref: `/admin/${slug}/pagina_edicao?_id=${encodeURIComponent(row.id)}`,
  }));

  return {
    title: section.title,
    description: section.description,
    columns: section.columns,
    rows,
    addHref: `/admin/${slug}/pagina_novo`,
    addLabel: section.addLabel,
    deletePath: `/admin/${slug}/apagar`,
    sipImportPath: `/api/packages/import/${slug}`,
    sipExportPath: `/api/packages/export/${slug}`,
    emptyMessage: `Ainda não existem ${section.title.toLowerCase()} registados.`,
  };
}

function buildCollectionFormViewModel(slug, mode, item, extra) {
  const section = getCollectionSection(slug);
  if (!section) return null;

  const isEdit = mode === "edit";
  const fields = section.buildFields(item, extra).map((field) =>
    isEdit && field.name === "_id"
      ? { ...field, readonly: true, helpText: field.helpText || "O _id identifica o registo e não deve ser alterado." }
      : field,
  );
  const hasImageUpload = fields.some(
    (field) =>
      field.type === "file" &&
      String(field.accept || "").includes("image/"),
  );

  return {
    title: isEdit ? `Editar ${section.singular}` : `Adicionar ${section.singular}`,
    description: section.description,
    cancelHref: `/admin/${slug}`,
    submitLabel: hasImageUpload ? "Submeter" : isEdit ? "Atualizar" : "Guardar",
    fields,
    showInstagramPicker: slug === "atividades",
    clientConfig: {
      action: isEdit ? `${section.apiPath}/${item._id}` : section.apiPath,
      method: isEdit ? "PUT" : "POST",
      successRedirect: `/admin/${slug}`,
      fields,
    },
  };
}

function buildSingletonFormViewModel(slug, item) {
  const section = getSingletonSection(slug);
  if (!section) return null;

  const fields = section.buildFields(item);

  return {
    title: section.title,
    description: section.description,
    summary: section.buildSummary ? section.buildSummary(item) : [],
    cancelHref: "/admin",
    submitLabel: "Guardar",
    fields,
    clientConfig: {
      action: section.apiPath,
      method: "PUT",
      successRedirect: `/admin/${slug}`,
      fields,
    },
  };
}

module.exports = {
  collectionSections,
  singletonSections,
  getCollectionSection,
  getSingletonSection,
  loadSectionExtra,
  buildCollectionViewModel,
  buildCollectionFormViewModel,
  buildSingletonFormViewModel,
};
