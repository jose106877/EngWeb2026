const Atividade = require("../models/Atividade");
const Departamento = require("../models/Departamento");

function normalizeBoolean(value) {
  if (value === true || value === "true" || value === 1 || value === "1")
    return true;
  return false;
}

function titleFromInstagramCaption(caption) {
  const line = String(caption || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((s) => s.trim())
    .find(Boolean);
  if (!line) return "Publicação Instagram";
  return line.length > 180 ? `${line.slice(0, 179)}…` : line;
}

function extractInstagramShortcodeFromPermalink(permalink) {
  const raw = String(permalink || "").trim();
  if (!raw) return "";
  const match = raw.match(/instagram\.com\/p\/([^/?#]+)/i);
  return match?.[1] ? String(match[1]).trim() : "";
}

function buildInstagramPermalinkPreview(shortcode) {
  const sc = String(shortcode || "").trim();
  if (!sc) return "";
  return `https://www.instagram.com/p/${encodeURIComponent(sc)}/media/?size=m`;
}

function pickLargestImageCandidate(candidates) {
  if (!Array.isArray(candidates) || candidates.length < 1) return "";
  const sorted = [...candidates].sort(
    (a, b) => Number(b?.width || 0) - Number(a?.width || 0),
  );
  return String(sorted[0]?.url || "").trim();
}

function previewImageFromPublicNode(node) {
  if (!node || typeof node !== "object") return "";
  if (node.thumbnail_src) return String(node.thumbnail_src);
  if (node.display_url) return String(node.display_url);
  return "";
}

function previewImageFromFeedItem(item) {
  if (!item || typeof item !== "object") return "";

  const direct = pickLargestImageCandidate(item?.image_versions2?.candidates);
  if (direct) return direct;

  if (Array.isArray(item?.carousel_media) && item.carousel_media.length > 0) {
    for (const child of item.carousel_media) {
      const img = pickLargestImageCandidate(child?.image_versions2?.candidates);
      if (img) return img;
    }
  }

  return "";
}

function mapInstagramMediaType(rawType) {
  const n = Number(rawType);
  if (n === 2) return "VIDEO";
  if (n === 8) return "CAROUSEL_ALBUM";
  if (n === 1) return "IMAGE";
  return "";
}

function mapGraphMediaType(rawType) {
  const t = String(rawType || "").toUpperCase();
  if (t === "VIDEO") return "VIDEO";
  if (t === "CAROUSEL_ALBUM") return "CAROUSEL_ALBUM";
  if (t === "IMAGE") return "IMAGE";
  return "";
}

function mapGraphMediaItems(items, limit) {
  const max = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 50) : 30;
  const out = [];

  for (const item of Array.isArray(items) ? items : []) {
    const mediaId = String(item?.id || "").trim();
    const permalink = String(item?.permalink || "").trim();
    if (!mediaId || !permalink) continue;

    const mediaType = mapGraphMediaType(item?.media_type);
    const previewImage = String(
      item?.media_url || item?.thumbnail_url || "",
    ).trim();

    out.push({
      mediaId,
      permalink,
      caption: String(item?.caption || ""),
      timestamp: item?.timestamp ? new Date(item.timestamp).toISOString() : null,
      mediaType,
      previewImage,
    });

    if (out.length >= max) break;
  }

  return out;
}

function parseCookieHeaderValue(rawSetCookie) {
  const raw = String(rawSetCookie || "").trim();
  if (!raw) return "";

  const parts = raw
    // split on cookie separators (handles merged set-cookie string)
    .split(/,(?=[^;=\s]+=[^;]+)/)
    .map((x) => String(x || "").trim())
    .filter(Boolean);

  const kv = [];
  const seen = new Set();
  for (const p of parts) {
    const token = p.split(";")[0]?.trim();
    if (!token || !token.includes("=")) continue;
    const name = token.split("=")[0]?.trim().toLowerCase();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    kv.push(token);
  }
  return kv.join("; ");
}

function cookieValue(cookieHeader, key) {
  const re = new RegExp(`(?:^|;\\s*)${key}=([^;]+)`);
  const m = String(cookieHeader || "").match(re);
  return m?.[1] ? String(m[1]) : "";
}

function buildInstagramHeaders(username, cookieHeader = "") {
  const headers = {
    "x-ig-app-id": "936619743392459",
    "user-agent":
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    accept: "application/json",
    "accept-language": "pt-PT,pt;q=0.9,en;q=0.8",
    referer: `https://www.instagram.com/${encodeURIComponent(username)}/`,
  };

  const cookie = String(cookieHeader || "").trim();
  if (cookie) {
    headers.cookie = cookie;
    const csrf = cookieValue(cookie, "csrftoken");
    if (csrf) headers["x-csrftoken"] = csrf;
  }

  return headers;
}

function mapInstagramWebProfilePayloadToItems(payload, limit) {
  const edges =
    payload?.data?.user?.edge_owner_to_timeline_media?.edges ||
    payload?.graphql?.user?.edge_owner_to_timeline_media?.edges ||
    [];
  const max = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 50) : 30;
  return edges.slice(0, max).map((entry) => {
    const node = entry?.node || {};
    const cap = node?.edge_media_to_caption?.edges?.[0]?.node?.text || "";
    const ts = Number(node?.taken_at_timestamp || 0);
    const shortcode = String(node?.shortcode || "");
    const permalink = shortcode
      ? `https://www.instagram.com/p/${shortcode}/`
      : "";
    const stablePreview = buildInstagramPermalinkPreview(shortcode);
    const directPreview = previewImageFromPublicNode(node);
    return {
      mediaId: String(node?.id || shortcode || ""),
      permalink,
      caption: String(cap),
      timestamp: ts > 0 ? new Date(ts * 1000).toISOString() : null,
      mediaType: String(node?.__typename || ""),
      previewImage: stablePreview || directPreview,
    };
  });
}

function mapInstagramFeedItemsToItems(items, limit) {
  const max = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 50) : 30;
  const seen = new Set();
  const out = [];

  for (const item of Array.isArray(items) ? items : []) {
    const code = String(item?.code || "").trim();
    const permalink = code ? `https://www.instagram.com/p/${code}/` : "";
    const mediaId = String(item?.pk || item?.id || code || "").trim();
    if (!mediaId || !permalink || seen.has(mediaId)) continue;

    seen.add(mediaId);
    const stablePreview = buildInstagramPermalinkPreview(code);
    const directPreview = previewImageFromFeedItem(item);

    out.push({
      mediaId,
      permalink,
      caption: String(item?.caption?.text || ""),
      timestamp: item?.taken_at
        ? new Date(Number(item.taken_at) * 1000).toISOString()
        : null,
      mediaType: mapInstagramMediaType(item?.media_type),
      previewImage: stablePreview || directPreview,
    });

    if (out.length >= max) break;
  }

  return out;
}

function buildPublicInstagramFailure(statusCode, errorText) {
  const generic =
    "Não foi possível carregar publicações públicas do Instagram. Verifica IG_PUBLIC_USERNAME e se a conta é pública.";
  if (statusCode === 401 || statusCode === 403) {
    return {
      status: "error",
      items: [],
      message:
        "Instagram bloqueou o pedido público neste momento. Tenta novamente mais tarde.",
    };
  }
  if (statusCode === 404) {
    return {
      status: "error",
      items: [],
      message: "Perfil Instagram não encontrado para o username configurado.",
    };
  }
  console.error("[instagram-public] instagram-media:", errorText);
  return {
    status: "error",
    items: [],
    message: generic,
  };
}

async function fetchInstagramPublicProfilePayload(username) {
  const url = new URL(
    "https://www.instagram.com/api/v1/users/web_profile_info/",
  );
  url.searchParams.set("username", username);

  const response = await fetch(url, {
    headers: buildInstagramHeaders(username),
  });
  const text = await response.text();
  const cookieHeader = parseCookieHeaderValue(
    response.headers.get("set-cookie"),
  );
  if (!response.ok) {
    return { ok: false, statusCode: response.status, text, cookieHeader };
  }
  try {
    return { ok: true, payload: JSON.parse(text), cookieHeader };
  } catch {
    return { ok: false, statusCode: response.status, text, cookieHeader };
  }
}

async function fetchInstagramFeedPage(
  username,
  userId,
  maxId = "",
  cookieHeader = "",
) {
  const url = new URL(
    `https://www.instagram.com/api/v1/feed/user/${encodeURIComponent(userId)}/`,
  );
  // Este endpoint costuma devolver blocos de 12, mesmo com count maior.
  url.searchParams.set("count", "12");
  if (maxId) url.searchParams.set("max_id", String(maxId));

  const response = await fetch(url, {
    headers: buildInstagramHeaders(username, cookieHeader),
  });
  const text = await response.text();

  if (!response.ok) {
    return { ok: false, statusCode: response.status, text };
  }

  try {
    const payload = JSON.parse(text);
    const items = Array.isArray(payload?.items) ? payload.items : [];
    const nextMaxId = String(payload?.next_max_id || "").trim();
    const hasMore = Boolean(payload?.more_available && nextMaxId);
    return { ok: true, items, nextMaxId, hasMore };
  } catch {
    return { ok: false, statusCode: response.status, text };
  }
}

async function fetchInstagramFeedItemsPaginated(
  username,
  userId,
  limit,
  cookieHeader = "",
) {
  const max = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 50) : 30;
  const out = [];
  let maxId = "";
  const maxPages = Math.ceil(max / 12) + 1;

  for (let i = 0; i < maxPages; i += 1) {
    const page = await fetchInstagramFeedPage(
      username,
      userId,
      maxId,
      cookieHeader,
    );
    if (!page.ok) {
      return { ok: false, statusCode: page.statusCode, text: page.text };
    }

    if (page.items.length < 1) break;
    out.push(...page.items);
    if (out.length >= max) break;
    if (!page.hasMore) break;
    maxId = page.nextMaxId;
  }

  return { ok: true, items: out.slice(0, max) };
}

async function fetchInstagramMediaList() {
  const accessToken = String(process.env.IG_GRAPH_ACCESS_TOKEN || "").trim();
  const userId = String(process.env.IG_GRAPH_USER_ID || "").trim();
  const limit = Number(
    process.env.IG_GRAPH_LIMIT || process.env.IG_PUBLIC_LIMIT || 30,
  );

  if (!accessToken || !userId) {
    return {
      status: "not_configured",
      items: [],
      message:
        "Define IG_GRAPH_ACCESS_TOKEN e IG_GRAPH_USER_ID no .env (Instagram Graph API).",
    };
  }

  if (typeof fetch !== "function") {
    return {
      status: "unavailable",
      items: [],
      message: "fetch não disponível neste runtime.",
    };
  }

  try {
    const url = new URL(
      `https://graph.facebook.com/v19.0/${encodeURIComponent(userId)}/media`,
    );
    url.searchParams.set(
      "fields",
      "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp",
    );
    url.searchParams.set("limit", String(Number.isFinite(limit) ? limit : 30));
    url.searchParams.set("access_token", accessToken);

    const response = await fetch(url.toString());
    const text = await response.text();
    let payload = null;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const metaError = payload?.error || null;
      if (metaError?.message) {
        return {
          status: "error",
          items: [],
          message: metaError.message,
          metaError,
        };
      }

      console.error("[instagram-graph] instagram-media:", text);
      return {
        status: "error",
        items: [],
        message: "Não foi possível carregar publicações do Instagram via Graph API.",
      };
    }

    const items = mapGraphMediaItems(payload?.data, limit);
    return {
      status: "ok",
      items,
      message: "",
    };
  } catch (error) {
    console.error("[instagram-graph] instagram-media:", error.message);
    return {
      status: "error",
      items: [],
      message: error.message || "Erro de rede.",
    };
  }
}

function buildAtividadePayload(req) {
  const payload = { ...req.body };
  delete payload.imagem_url_externa;

  payload.mostrar_no_carrossel = normalizeBoolean(
    req.body?.mostrar_no_carrossel,
  );
  payload.ordem_carrossel = Number(req.body?.ordem_carrossel || 0);
  payload.nome_destaque = String(req.body?.nome_destaque || "").trim();

  if (req.file) {
    payload.imagem_destaque = `/media/atividades/${req.file.filename}`;
  } else {
    const external = String(req.body?.imagem_url_externa || "").trim();
    if (external.startsWith("http")) {
      payload.imagem_destaque = external;
    } else {
      delete payload.imagem_destaque;
    }
  }

  return payload;
}

function buildAtividadeUpdatePayload(req) {
  const payload = buildAtividadePayload(req);
  delete payload._id;
  return payload;
}

async function buildActivityDepartmentMap() {
  const departamentos = await Departamento.find({ privacidade: "publico" })
    .select("_id nome atividades")
    .lean();

  const activityDepartmentMap = new Map();

  departamentos.forEach((departamento) => {
    const departmentsForActivity = {
      _id: departamento._id,
      name: departamento.nome,
    };

    const activityRefs = Array.isArray(departamento.atividades)
      ? departamento.atividades
      : [];
    activityRefs.forEach((activityId) => {
      const key = String(activityId);
      if (!activityDepartmentMap.has(key)) activityDepartmentMap.set(key, []);

      activityDepartmentMap.get(key).push(departmentsForActivity);
    });
  });

  return activityDepartmentMap;
}

function buildHighlightPayload(activity, departments) {
  if (!activity.mostrar_no_carrossel) return null;

  const image = activity.imagem_destaque || null;
  if (!image) return null;

  return {
    _id: activity._id,
    title: activity.nome_destaque || activity.titulo,
    image,
    permalink: activity.link,
    order: Number(activity.ordem_carrossel || 0),
    date: activity.data,
    departments,
  };
}

const atividadeController = {
  createAtividade: async function (req, res) {
    try {
      const newAtividade = new Atividade(buildAtividadePayload(req));
      await newAtividade.save();
      res.status(201).json(newAtividade);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  getAllAtividades: async function (req, res) {
    try {
      const atividades = await Atividade.find();
      res.json(atividades);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getInstagramMediaForAdmin: async function (req, res) {
    try {
      const result = await fetchInstagramMediaList();
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  importInstagramAtividades: async function (req, res) {
    try {
      const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
      if (!rawItems.length) {
        return res.status(400).json({ message: "Lista items vazia." });
      }
      if (rawItems.length > 40) {
        return res
          .status(400)
          .json({ message: "Máximo 40 publicações por pedido." });
      }

      const created = [];
      const skipped = [];
      const errors = [];

      for (const row of rawItems) {
        const permalink = String(row?.permalink || "").trim();
        const mediaId = String(row?.mediaId || "").trim();
        if (!permalink || !mediaId) {
          errors.push({ mediaId, reason: "permalink ou mediaId em falta" });
          continue;
        }

        const existing = await Atividade.findOne({ link: permalink }).lean();
        if (existing) {
          skipped.push({ mediaId, permalink, reason: "já existe" });
          continue;
        }

        const titulo = titleFromInstagramCaption(row.caption);
        const shortcode = extractInstagramShortcodeFromPermalink(permalink);
        const stablePreview = buildInstagramPermalinkPreview(shortcode);
        const preview = String(row?.previewImage || "").trim();
        const imagem_destaque =
          stablePreview ||
          (preview.startsWith("http") && preview.length < 2000 ? preview : "");
        const ts = row.timestamp ? new Date(row.timestamp) : new Date();
        const data = Number.isNaN(ts.getTime()) ? new Date() : ts;
        const _id = `ig-${mediaId}`;

        const idTaken = await Atividade.findById(_id).lean();
        if (idTaken) {
          skipped.push({ mediaId, permalink, reason: "_id já usado" });
          continue;
        }

        try {
          const doc = new Atividade({
            _id,
            titulo,
            link: permalink,
            data,
            nome_destaque: "",
            imagem_destaque,
            mostrar_no_carrossel: false,
            ordem_carrossel: 0,
            privacidade: "publico",
          });
          await doc.save();
          created.push({ _id, permalink });
        } catch (err) {
          errors.push({ mediaId, reason: err.message || "erro ao guardar" });
        }
      }

      res.status(201).json({ created, skipped, errors });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getAtividadesFeed: async function (req, res) {
    try {
      const [atividades, activityDepartmentMap] = await Promise.all([
        Atividade.find({ privacidade: "publico" }).lean(),
        buildActivityDepartmentMap(),
      ]);

      const posts = [...atividades]
        .sort(
          (a, b) =>
            new Date(b.data || 0).getTime() - new Date(a.data || 0).getTime(),
        )
        .map((atividade) => {
          const departments =
            activityDepartmentMap.get(String(atividade._id)) || [];

          return {
            _id: atividade._id,
            databaseId: atividade._id,
            title: atividade.titulo,
            permalink: atividade.link,
            date: atividade.data,
            caption: atividade.titulo,
            mediaType: "LINK",
            mediaUrl: "",
            thumbnailUrl: "",
            previewImage: atividade.imagem_destaque || "",
            departments,
            source: "local",
            highlight: buildHighlightPayload(atividade, departments),
          };
        });

      const highlights = posts
        .map((post) => post.highlight)
        .filter(Boolean)
        .sort((a, b) => {
          const orderDiff = Number(a.order || 0) - Number(b.order || 0);
          if (orderDiff !== 0) return orderDiff;

          return (
            new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
          );
        });

      res.json({
        metaStatus: "ok",
        posts,
        highlights,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getAtividadeById: async function (req, res) {
    try {
      const atividade = await Atividade.findById(req.params._id);
      if (!atividade) {
        res.status(404).json({ message: "Atividade não encontrada..." });
      } else {
        res.json(atividade);
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  updateAtividade: async function (req, res) {
    try {
      const atividade = await Atividade.findByIdAndUpdate(
        req.params._id,
        buildAtividadeUpdatePayload(req),
        { new: true },
      );
      if (!atividade) {
        res.status(404).json({ message: "Atividade não encontrada..." });
      } else {
        res.json(atividade);
      }
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  deleteAtividade: async function (req, res) {
    try {
      const atividade = await Atividade.findByIdAndDelete(req.params._id);
      if (!atividade) {
        res.status(404).json({ message: "Atividade não encontrada..." });
      } else {
        await Departamento.updateMany(
          { atividades: atividade._id },
          { $pull: { atividades: atividade._id } },
        );
        res.json(atividade);
      }
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
};

module.exports = atividadeController;
