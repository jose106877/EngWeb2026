"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("adminInstagramPicker");
  const form = document.getElementById("adminEntityForm");
  const statusEl = document.getElementById("adminInstagramPickerStatus");
  const resultsEl = document.getElementById("adminInstagramPickerResults");
  const loadBtn = document.getElementById("adminInstagramLoad");
  const prefillBtn = document.getElementById("adminInstagramPrefill");
  const importBtn = document.getElementById("adminInstagramImport");

  if (!root || !form || !resultsEl || !loadBtn || !prefillBtn || !importBtn)
    return;

  let loadedItems = [];

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const toDateInputValue = (iso) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  };

  const titleFromCaption = (caption) => {
    const line = String(caption || "")
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((s) => s.trim())
      .find(Boolean);
    if (!line) return "Publicação Instagram";
    return line.length > 180 ? `${line.slice(0, 179)}…` : line;
  };

  const previewFromPermalink = (permalink) => {
    const raw = String(permalink || "").trim();
    if (!raw) return "";
    const match = raw.match(/instagram\.com\/p\/([^/?#]+)/i);
    const shortcode = match?.[1] ? String(match[1]).trim() : "";
    if (!shortcode) return "";
    return `https://www.instagram.com/p/${encodeURIComponent(shortcode)}/media/?size=m`;
  };

  const toProxyImageUrl = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    try {
      const u = new URL(raw, window.location.origin);
      const host = String(u.hostname || "").toLowerCase();
      const isInstagramHost =
        host === "instagram.com" ||
        host.endsWith(".instagram.com") ||
        host === "fbcdn.net" ||
        host.endsWith(".fbcdn.net");
      if (!isInstagramHost) return u.toString();
      return `/instagram-image?url=${encodeURIComponent(u.toString())}`;
    } catch {
      return raw;
    }
  };

  const setStatus = (text) => {
    if (statusEl) statusEl.textContent = text || "";
  };

  const updateActionButtons = () => {
    const n = resultsEl.querySelectorAll(
      'input[type="checkbox"][data-ig-media]:checked',
    ).length;
    prefillBtn.disabled = n < 1;
    importBtn.disabled = n < 1;
  };

  resultsEl.addEventListener("change", (e) => {
    if (e.target.matches('input[type="checkbox"][data-ig-media]'))
      updateActionButtons();
  });

  resultsEl.addEventListener("click", (e) => {
    const card = e.target.closest("[data-ig-card]");
    if (!card || e.target.closest("input")) return;
    const cb = card.querySelector('input[type="checkbox"][data-ig-media]');
    if (cb) {
      cb.checked = !cb.checked;
      updateActionButtons();
    }
  });

  resultsEl.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const card = e.target.closest("[data-ig-card]");
    if (!card || e.target.closest("input")) return;
    e.preventDefault();
    const cb = card.querySelector('input[type="checkbox"][data-ig-media]');
    if (cb) {
      cb.checked = !cb.checked;
      updateActionButtons();
    }
  });

  const getSelectedCardsInOrder = () => {
    const out = [];
    resultsEl.querySelectorAll("[data-ig-card]").forEach((card) => {
      const cb = card.querySelector('input[type="checkbox"][data-ig-media]');
      if (cb?.checked) out.push(card);
    });
    return out;
  };

  const readCard = (card) => ({
    mediaId: card.dataset.igMediaId || "",
    permalink: card.dataset.igPermalink || "",
    caption: card.dataset.igCaption || "",
    timestamp: card.dataset.igTimestamp || "",
    previewImage: card.dataset.igPreview || "",
  });

  const setInput = (name, value) => {
    const el = form.querySelector(`[name="${name}"]`);
    if (el) el.value = value ?? "";
  };

  loadBtn.addEventListener("click", async () => {
    setStatus("A carregar…");
    resultsEl.innerHTML = "";
    loadedItems = [];
    prefillBtn.disabled = true;
    importBtn.disabled = true;

    try {
      const response = await fetch("/api/atividades/instagram-media");
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const parts = [
          data?.message,
          data?.metaError?.fbtraceId &&
            `fbtrace_id: ${data.metaError.fbtraceId}`,
        ].filter(Boolean);
        setStatus(parts.join(" ") || "Não foi possível carregar.");
        return;
      }

      if (data.status === "not_configured") {
        setStatus(
          data.message ||
            "Instagram não configurado no servidor (IG_PUBLIC_USERNAME).",
        );
        return;
      }

      if (data.status !== "ok" || !Array.isArray(data.items)) {
        const parts = [
          data.message,
          data.metaError?.fbtraceId &&
            `fbtrace_id: ${data.metaError.fbtraceId}`,
        ].filter(Boolean);
        setStatus(parts.join(" ") || "Resposta inválida da API.");
        return;
      }

      loadedItems = data.items;
      if (!loadedItems.length) {
        setStatus("Nenhuma publicação devolvida pelo Instagram público.");
        return;
      }

      setStatus(`${loadedItems.length} publicações. Marca as que queres usar.`);
      resultsEl.innerHTML = `
        <div class="admin-instagram-picker-grid">
          ${loadedItems
            .map((item) => {
              const resolvedPreview =
                String(item.previewImage || "").trim() ||
                previewFromPermalink(item.permalink);
              const cap = escapeHtml(
                (item.caption || "").replace(/\s+/g, " ").slice(0, 120),
              );
              const dateLabel = escapeHtml(
                toDateInputValue(item.timestamp) || "—",
              );
              const thumb = resolvedPreview
                ? `<img src="${escapeHtml(toProxyImageUrl(resolvedPreview))}" alt="" loading="lazy" width="120" height="120" style="object-fit:cover;border-radius:6px;">`
                : `<div class="admin-instagram-picker-thumb-fallback">IG</div>`;
              return `
                <div class="admin-instagram-picker-card" data-ig-card
                  data-ig-media-id="${escapeHtml(item.mediaId)}"
                  data-ig-permalink="${escapeHtml(item.permalink)}"
                  data-ig-caption="${escapeHtml(String(item.caption || "").slice(0, 900))}"
                  data-ig-timestamp="${escapeHtml(item.timestamp || "")}"
                  data-ig-preview="${escapeHtml(resolvedPreview || "")}"
                  role="button"
                  tabindex="0"
                >
                  <div class="admin-instagram-picker-card-head">
                    <input type="checkbox" data-ig-media="${escapeHtml(item.mediaId)}" />
                    <span class="admin-instagram-picker-date">${dateLabel}</span>
                  </div>
                  <div class="admin-instagram-picker-thumb">${thumb}</div>
                  <p class="admin-instagram-picker-caption">${cap || "—"}</p>
                </div>
              `;
            })
            .join("")}
        </div>
      `;

      updateActionButtons();
    } catch (err) {
      setStatus(err.message || "Erro de rede.");
    }
  });

  prefillBtn.addEventListener("click", () => {
    const cards = getSelectedCardsInOrder();
    if (!cards.length) return;
    const item = readCard(cards[0]);

    setInput("link", item.permalink);
    setInput("titulo", titleFromCaption(item.caption));
    setInput("data", toDateInputValue(item.timestamp));
    setInput("imagem_url_externa", item.previewImage || "");
    setInput("_id", item.mediaId ? `ig-${item.mediaId}` : "");

    setStatus("Formulário preenchido com a primeira publicação selecionada.");
  });

  importBtn.addEventListener("click", async () => {
    const cards = getSelectedCardsInOrder();
    if (!cards.length) return;

    if (
      !confirm(
        `Criar ${cards.length} atividade(s) na base de dados? (Ignora links que já existem.)`,
      )
    )
      return;

    const items = cards.map((card) => {
      const row = readCard(card);
      return {
        mediaId: row.mediaId,
        permalink: row.permalink,
        caption: row.caption,
        timestamp: row.timestamp || null,
        previewImage: row.previewImage,
      };
    });

    importBtn.disabled = true;
    prefillBtn.disabled = true;
    loadBtn.disabled = true;
    setStatus("A importar…");

    try {
      const response = await fetch("/api/atividades/import-instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatus(data?.message || "Importação falhou.");
        importBtn.disabled = false;
        prefillBtn.disabled = false;
        loadBtn.disabled = false;
        updateActionButtons();
        return;
      }

      const c = (data.created || []).length;
      const s = (data.skipped || []).length;
      const e = (data.errors || []).length;
      alert(
        `Importação concluída.\nCriadas: ${c}\nIgnoradas: ${s}\nErros: ${e}`,
      );
      window.location.href = "/admin/atividades";
    } catch (err) {
      setStatus(err.message || "Erro de rede.");
      importBtn.disabled = false;
      prefillBtn.disabled = false;
      loadBtn.disabled = false;
      updateActionButtons();
    }
  });
});
