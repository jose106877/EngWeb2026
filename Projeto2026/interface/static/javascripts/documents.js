/*
 * documents.js
 * Feature: Documents section — filter toolbar toggling document cards by category.
 * Depends on: (no shared state — self-contained DOM queries)
 */
// -----------------------------------------------------------------------------
// Feature: Documents
// -----------------------------------------------------------------------------
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeDocText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function inferDocCategory(documentEntry) {
  const privacy = normalizeDocText(documentEntry.privacidade);
  const name = normalizeDocText(documentEntry.nome);
  const department = normalizeDocText(documentEntry.departamento);
  const combined = `${privacy} ${name} ${department}`;

  if (combined.includes("estatuto")) return "estatutos";
  if (
    combined.includes("orcament") ||
    combined.includes("planeamento") ||
    combined.includes("plano")
  ) {
    return "planeamento";
  }
  if (
    combined.includes("assembleia") ||
    combined.includes(" ata") ||
    combined.includes("ata ") ||
    combined.includes("convocatoria") ||
    combined.includes("convocatoria") ||
    privacy === "ag"
  ) {
    return "ag";
  }
  if (
    combined.includes("fiscal") ||
    combined.includes("jurisdic") ||
    combined.includes("parecer") ||
    combined.includes("financeir")
  ) {
    return "fiscal";
  }
  if (
    combined.includes("direcao") ||
    department === "direcao"
  ) {
    return "direcao";
  }

  return "outros";
}

function normalizeDocumentHref(documentEntry) {
  const raw = String(documentEntry.link || documentEntry.ficheiro || "").trim();
  if (!raw) return null;
  if (/^(https?:)?\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return raw;
  return `/${raw}`;
}

function populateDocumentCards(docsSection) {
  const listHosts = Array.from(docsSection.querySelectorAll("[data-doc-list]"));
  if (!listHosts.length) return;

  const hostsByCategory = new Map(
    listHosts.map((host) => [host.dataset.docList || "outros", host]),
  );

  const grouped = new Map(
    Array.from(hostsByCategory.keys()).map((category) => [category, []]),
  );

  const allDocuments = Array.isArray(window.regulations) ? window.regulations : [];

  allDocuments.forEach((documentEntry) => {
    const href = normalizeDocumentHref(documentEntry);
    if (!href) return;

    const category = inferDocCategory(documentEntry);
    const currentGroup = grouped.get(category) || grouped.get("outros") || [];
    currentGroup.push({ ...documentEntry, href });

    if (!grouped.has(category) && grouped.has("outros")) {
      grouped.get("outros").push({ ...documentEntry, href });
    } else {
      grouped.set(category, currentGroup);
    }
  });

  grouped.forEach((items, category) => {
    const host = hostsByCategory.get(category);
    if (!host) return;

    const orderedItems = [...items].sort((first, second) => {
      const yearDiff = Number(second.ano || 0) - Number(first.ano || 0);
      if (yearDiff !== 0) return yearDiff;
      return String(first.nome || "").localeCompare(String(second.nome || ""), "pt");
    });

    if (!orderedItems.length) {
      host.innerHTML = '<li class="doc-item doc-item-empty">Sem documentos disponíveis.</li>';
      return;
    }

    host.innerHTML = orderedItems
      .map((documentEntry) => {
        const label = `${escapeHtml(documentEntry.nome || "Documento")}${
          documentEntry.ano ? ` (${escapeHtml(documentEntry.ano)})` : ""
        }`;
        const searchText = normalizeDocText(
          [
            documentEntry.nome,
            documentEntry.ano,
            documentEntry.departamento,
            documentEntry.privacidade,
          ].join(" "),
        );

        return `<li class="doc-item" data-doc-search-text="${escapeHtml(searchText)}"><a href="${escapeHtml(documentEntry.href)}" target="_blank" rel="noopener noreferrer">${label}</a></li>`;
      })
      .join("");
  });
}

function setupDocumentsFilterFeature() {
  const docsSection = document.getElementById("documentos");
  if (!docsSection) return;

  populateDocumentCards(docsSection);

  const pills = Array.from(docsSection.querySelectorAll(".docs-toolbar .teamv2-tab"));
  const cards = Array.from(docsSection.querySelectorAll(".doc-card"));
  const searchInput = docsSection.querySelector("#docs-search");
  const status = document.getElementById("docs-filter-status");
  const emptyState = document.getElementById("docs-empty");
  const emptyFilter = document.getElementById("docs-empty-filter");

  if (!pills.length || !cards.length) return;

  const filterLabels = new Map(
    pills.map((pill) => [pill.dataset.docFilter || "all", pill.textContent?.trim() || ""])
  );

  let activeFilterId = pills.find((pill) => pill.classList.contains("is-active"))?.dataset.docFilter || "all";

  const applyFilter = () => {
    const filterId = activeFilterId;
    const searchTerm = normalizeDocText(searchInput?.value || "");
    let visibleCards = 0;
    let visibleItems = 0;

    cards.forEach((card) => {
      const categoryMatch = filterId === "all" || card.dataset.docCategory === filterId;
      const items = Array.from(card.querySelectorAll(".doc-item:not(.doc-item-empty)"));
      let matchingItems = 0;

      items.forEach((item) => {
        const text = item.dataset.docSearchText || "";
        const itemMatchesSearch = !searchTerm || text.includes(searchTerm);
        item.classList.toggle("is-hidden", !itemMatchesSearch);
        if (itemMatchesSearch) matchingItems += 1;
      });

      const emptyItem = card.querySelector(".doc-item-empty");
      if (emptyItem) {
        emptyItem.classList.toggle("is-hidden", Boolean(searchTerm));
      }

      const shouldShow = categoryMatch && (matchingItems > 0 || (!searchTerm && items.length === 0));
      card.classList.toggle("is-hidden", !shouldShow);
      if (shouldShow) {
        visibleCards += 1;
        visibleItems += matchingItems;
      }
    });

    const activeLabel = filterLabels.get(filterId) || filterId;
    if (status) {
      if (searchTerm && filterId === "all") {
        status.textContent = `A mostrar ${visibleItems} resultado(s) para a pesquisa.`;
      } else if (searchTerm) {
        status.textContent = `A mostrar ${visibleItems} resultado(s) em ${activeLabel}.`;
      } else if (filterId === "all") {
        status.textContent = "A mostrar todas as áreas documentais.";
      } else {
        status.textContent = `A mostrar documentos de ${activeLabel}.`;
      }
    }

    const showEmptyState = visibleCards === 0;
    if (emptyState) {
      emptyState.classList.toggle("is-visible", showEmptyState);
    }
    if (showEmptyState && emptyFilter) {
      emptyFilter.textContent = searchTerm ? "esta pesquisa" : activeLabel;
    }
  };

  pills.forEach((pill) => {
    pill.addEventListener("click", () => {
      activeFilterId = pill.dataset.docFilter || "all";
      pills.forEach((item) => {
        const isActive = item === pill;
        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-selected", isActive ? "true" : "false");
      });
      applyFilter();
    });
  });

  if (searchInput) {
    searchInput.addEventListener("input", applyFilter);
  }

  applyFilter();
}
