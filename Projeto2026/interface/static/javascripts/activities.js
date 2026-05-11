/*
 * activities.js
 * Feature: Activities — top highlights carousel + feed curado com filtros por departamento.
 * Depends on: shared.js (activityTabs, activitiesHighlights, activitiesFeed, activitiesStatus, activeActivityFilter, formatDate)
 */

let activityFeedState = {
  posts: [],
  highlights: [],
  metaStatus: "idle",
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function excerptText(value, maxLength = 220) {
  const text = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "Publicação disponível no Instagram da AEEUM.";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

function getDepartmentNames(departmentsList) {
  return (Array.isArray(departmentsList) ? departmentsList : [])
    .map((department) => department?.name)
    .filter(Boolean);
}

function previewFromInstagramPermalink(permalink) {
  const raw = String(permalink || "").trim();
  if (!raw) return "";
  const match = raw.match(/instagram\.com\/p\/([^/?#]+)/i);
  const shortcode = match?.[1] ? String(match[1]).trim() : "";
  if (!shortcode) return "";
  return `https://www.instagram.com/p/${encodeURIComponent(shortcode)}/media/?size=m`;
}

function toProxyImageUrl(value) {
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
}

function buildLocalFallbackFeed() {
  const activityToDepartments = new Map();

  (window.allDepartments || []).forEach((department) => {
    (department.activities || []).forEach((activity) => {
      const key = String(
        activity.databaseId || activity.id || activity.permalink || "",
      );
      if (!key) return;
      if (!activityToDepartments.has(key)) activityToDepartments.set(key, []);
      activityToDepartments.get(key).push({
        _id: department.id,
        name: department.name,
      });
    });
  });

  const posts = (window.activities || [])
    .map((activity) => {
      const key = String(activity._id || activity.id || activity.link || "");
      const departments = activityToDepartments.get(key) || [];

      return {
        _id: activity._id || activity.id,
        databaseId: activity._id,
        title: activity.titulo,
        permalink: activity.link,
        date: activity.data,
        caption: activity.titulo,
        previewImage: activity.imagem_destaque || "",
        departments,
        source: "local",
      };
    })
    .sort(
      (a, b) =>
        new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
    );

  const highlights = posts
    .filter((post) => post.previewImage)
    .map((post, index) => ({
      _id: post._id || post.id,
      title: post.title,
      image: post.previewImage,
      permalink: post.permalink,
      order: index,
      departments: post.departments,
    }));

  return {
    posts,
    highlights,
    metaStatus: "local",
  };
}

function getResolvedActivityFilters() {
  const availableDepartmentIds = new Set(
    [...activityFeedState.posts, ...activityFeedState.highlights].flatMap(
      (item) => (item.departments || []).map((department) => department._id || department.id),
    ),
  );

  return [
    { id: "all", name: "Todos" },
    ...(window.activityFilters || []).filter(
      (filter) => filter.id !== "all" && availableDepartmentIds.has(filter.id),
    ),
  ];
}

function itemMatchesFilter(item) {
  if (activeActivityFilter === "all") return true;
  return (item.departments || []).some(
    (department) => (department._id || department.id) === activeActivityFilter,
  );
}

function renderActivityTabs() {
  if (!activityTabs) return;

  const filters = getResolvedActivityFilters();
  if (!filters.some((filter) => filter.id === activeActivityFilter)) {
    activeActivityFilter = "all";
  }

  activityTabs.innerHTML = filters
    .map(
      (filter, index) => `
        <button
          class="activities-tab${filter.id === activeActivityFilter ? " is-active" : ""}"
          type="button"
          role="tab"
          aria-selected="${filter.id === activeActivityFilter ? "true" : "false"}"
          data-activ-filter="${filter.id}"
          style="--tab-i: ${index}"
        >
          ${escapeHtml(filter.name)}
        </button>
      `,
    )
    .join("");

  activityTabs.querySelectorAll(".activities-tab").forEach((button) => {
    button.addEventListener("click", () => {
      activeActivityFilter = button.dataset.activFilter || "all";
      renderActivityTabs();
      renderHighlights();
      renderFeed();
    });
  });
}

function renderHighlights() {
  if (!activitiesHighlights) return;

  const filteredHighlights =
    activityFeedState.highlights.filter(itemMatchesFilter);

  if (!filteredHighlights.length) {
    activitiesHighlights.innerHTML = `
      <article class="activities-highlight-empty">
        <p>Sem destaques visuais para este filtro.</p>
      </article>
    `;
    return;
  }

  activitiesHighlights.innerHTML = `
    <div class="activities-highlight-slider">
      <button class="activities-highlight-nav" type="button" data-highlight-prev aria-label="Destaque anterior">←</button>
      <div class="activities-highlight-window">
        <div class="activities-highlight-track">
          ${filteredHighlights
            .map(
              (highlight) => `
                <article class="activities-highlight-slide">
                  <a class="activities-highlight-link" href="${highlight.permalink}" target="_blank" rel="noopener noreferrer">
                    <img src="${toProxyImageUrl(highlight.image)}" alt="${escapeHtml(highlight.title)}" loading="lazy" />
                    <div class="activities-highlight-copy">
                      <p class="activities-highlight-tag">${escapeHtml(
                        getDepartmentNames(highlight.departments).join(" • ") ||
                          "Instagram",
                      )}</p>
                      <h3>${escapeHtml(highlight.title)}</h3>
                      <span>Ver publicação no Instagram</span>
                    </div>
                  </a>
                </article>
              `,
            )
            .join("")}
        </div>
      </div>
      <button class="activities-highlight-nav" type="button" data-highlight-next aria-label="Destaque seguinte">→</button>
    </div>
    <div class="activities-highlight-dots">
      ${filteredHighlights
        .map(
          (_, index) => `
            <button
              class="activities-highlight-dot${index === 0 ? " is-active" : ""}"
              type="button"
              data-highlight-dot="${index}"
              aria-label="Ir para destaque ${index + 1}"
            ></button>
          `,
        )
        .join("")}
    </div>
  `;

  const track = activitiesHighlights.querySelector(
    ".activities-highlight-track",
  );
  const dots = Array.from(
    activitiesHighlights.querySelectorAll("[data-highlight-dot]"),
  );
  const previousButton = activitiesHighlights.querySelector(
    "[data-highlight-prev]",
  );
  const nextButton = activitiesHighlights.querySelector(
    "[data-highlight-next]",
  );

  if (!track) return;

  let currentIndex = 0;

  const updateSlider = () => {
    track.style.transform = `translate3d(${-currentIndex * 100}%, 0, 0)`;
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === currentIndex);
    });
  };

  previousButton?.addEventListener("click", () => {
    currentIndex =
      currentIndex === 0 ? filteredHighlights.length - 1 : currentIndex - 1;
    updateSlider();
  });

  nextButton?.addEventListener("click", () => {
    currentIndex =
      currentIndex === filteredHighlights.length - 1 ? 0 : currentIndex + 1;
    updateSlider();
  });

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      currentIndex = Number(dot.dataset.highlightDot || "0");
      updateSlider();
    });
  });

  updateSlider();
}

function renderFeed() {
  if (!activitiesFeed) return;

  const filteredPosts = activityFeedState.posts.filter(itemMatchesFilter);

  if (!filteredPosts.length) {
    activitiesFeed.innerHTML =
      '<p class="post-meta">Sem atividades publicadas para o filtro selecionado.</p>';
    return;
  }

  activitiesFeed.innerHTML = filteredPosts
    .map((post) => {
      const departmentNames = getDepartmentNames(post.departments);
      const resolvedPreview =
        String(post.previewImage || "").trim() ||
        previewFromInstagramPermalink(post.permalink);
      const previewMarkup = resolvedPreview
        ? `<img src="${toProxyImageUrl(resolvedPreview)}" alt="${escapeHtml(post.title)}" loading="lazy" />`
        : `<div class="activities-feed-placeholder">AEEUM</div>`;

      return `
        <article class="activities-post-card">
          <div class="activities-post-media">
            <a href="${post.permalink}" target="_blank" rel="noopener noreferrer">
              ${previewMarkup}
            </a>
          </div>
          <div class="activities-post-body">
            <div class="activities-post-header">
              <div>
                <p class="activities-post-source">${
                  post.source === "meta" ? "Meta API" : "Curadoria local"
                }</p>
                <h3>${escapeHtml(post.title)}</h3>
              </div>
              <time datetime="${escapeHtml(post.date || "")}">${formatDate(post.date)}</time>
            </div>
            ${
              departmentNames.length
                ? `<div class="activities-post-tags">${departmentNames
                    .map(
                      (name) =>
                        `<span class="activities-post-tag">${escapeHtml(name)}</span>`,
                    )
                    .join("")}</div>`
                : ""
            }
            <p class="activities-post-caption">${escapeHtml(excerptText(post.caption))}</p>
            <a class="activities-post-link" href="${post.permalink}" target="_blank" rel="noopener noreferrer">
              Abrir no Instagram
            </a>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderActivityStatus() {
  if (!activitiesStatus) return;

  if (activityFeedState.metaStatus === "loading") {
    activitiesStatus.textContent = "A carregar as publicações mais recentes.";
    return;
  }

  if (activityFeedState.metaStatus === "ok") {
    activitiesStatus.textContent = "";
    return;
  }

  activitiesStatus.textContent =
    "A mostrar a curadoria local das atividades enquanto o feed externo não está disponível.";
}

async function loadActivitiesFeed() {
  activityFeedState = {
    posts: [],
    highlights: [],
    metaStatus: "loading",
  };

  renderActivityStatus();

  try {
    const response = await fetch("/api/atividades-feed");
    if (!response.ok) {
      throw new Error("Feed indisponível");
    }

    const data = await response.json();
    activityFeedState = {
      posts: Array.isArray(data.posts) ? data.posts : [],
      highlights: Array.isArray(data.highlights) ? data.highlights : [],
      metaStatus: data.metaStatus || "ok",
    };
  } catch (error) {
    activityFeedState = buildLocalFallbackFeed();
  }

  window.posts = activityFeedState.posts;
  renderActivityStatus();
  renderActivityTabs();
  renderHighlights();
  renderFeed();
}

function setupActivitiesFeature() {
  if (!activityTabs || !activitiesFeed || !activitiesHighlights) return;
  loadActivitiesFeed();
}
