/*
 * team.js
 * Feature: Team section — department tabs with department detail panel.
 * Depends on: shared.js (getInitials), data.js (departments)
 */
// -----------------------------------------------------------------------------
// Feature: Team section (department tabs)
// -----------------------------------------------------------------------------
function getDepartmentsCollection() {
  return window.departments || [];
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function setupHorizontalTabsScrolling(tabsHost) {
  if (!tabsHost || tabsHost.dataset.horizontalScrollReady === "true") return;
  tabsHost.dataset.horizontalScrollReady = "true";

  let isMouseDown = false;
  let startX = 0;
  let startScrollLeft = 0;
  let blockClick = false;

  tabsHost.addEventListener(
    "wheel",
    (event) => {
      const canScrollHorizontally = tabsHost.scrollWidth > tabsHost.clientWidth;
      if (!canScrollHorizontally) return;

      if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        tabsHost.scrollLeft += event.deltaY;
        event.preventDefault();
      }
    },
    { passive: false },
  );

  tabsHost.addEventListener("mousedown", (event) => {
    if (event.button !== 0) return;
    isMouseDown = true;
    blockClick = false;
    startX = event.pageX;
    startScrollLeft = tabsHost.scrollLeft;
    tabsHost.classList.add("is-dragging");
  });

  window.addEventListener("mousemove", (event) => {
    if (!isMouseDown) return;

    const deltaX = event.pageX - startX;
    if (Math.abs(deltaX) > 6) {
      blockClick = true;
    }

    tabsHost.scrollLeft = startScrollLeft - deltaX;
  });

  window.addEventListener("mouseup", () => {
    if (!isMouseDown) return;
    isMouseDown = false;
    tabsHost.classList.remove("is-dragging");
    setTimeout(() => {
      blockClick = false;
    }, 0);
  });

  tabsHost.addEventListener(
    "click",
    (event) => {
      if (!blockClick) return;
      event.preventDefault();
      event.stopPropagation();
    },
    true,
  );
}

function renderTeamDepartmentTabs(tabsHost, activeDepartment, onSelectDepartment) {
  tabsHost.innerHTML = getDepartmentsCollection()
    .map(
      (department, index) => `
        <button
          class="teamv2-tab${department.id === activeDepartment ? " is-active" : ""}"
          type="button"
          id="team-tab-${department.id}"
          role="tab"
          aria-selected="${department.id === activeDepartment ? "true" : "false"}"
          aria-controls="team-panels"
          data-team-key="${department.id}"
          style="--tab-i: ${index}"
        >
          ${escapeHtml(department.name)}
        </button>
      `,
    )
    .join("");

  tabsHost.querySelectorAll(".teamv2-tab").forEach((button) => {
    button.addEventListener("click", () => {
      const nextKey = button.dataset.teamKey || "";
      onSelectDepartment(nextKey);
    });
  });
}

function renderTeamDepartmentPanel(panelHost, department) {
  if (!department) {
    panelHost.innerHTML = "";
    panelHost.hidden = true;
    delete panelHost.dataset.departmentId;
    return;
  }

  panelHost.dataset.departmentId = department.id;

  const orderedActivities = [...department.activities].sort(
    (a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime(),
  );

  const membersMarkup = department.memberGroups.length
    ? department.memberGroups
        .map(
          (group) => `
            <section class="department-members-group">
              <div class="department-members-group-head">
                <h4>${escapeHtml(group.label)}</h4>
                <span>${group.members.length} elemento${group.members.length === 1 ? "" : "s"}</span>
              </div>
              <div class="department-members-grid">
                ${group.members
                  .map((member) => {
                    const photoMarkup = member.photo
                      ? `<img src="${member.photo}" alt="${escapeHtml(member.name)}" loading="lazy" />`
                      : `<div class="department-member-placeholder">${escapeHtml(getInitials(member.name))}</div>`;

                    return `
                      <article class="department-member-card">
                        <div class="department-member-photo">
                          ${photoMarkup}
                        </div>
                        <div class="department-member-copy">
                          <p class="department-member-name">${escapeHtml(member.name)}</p>
                          <p class="department-member-role">${escapeHtml(member.role)}</p>
                        </div>
                      </article>
                    `;
                  })
                  .join("")}
              </div>
            </section>
          `,
        )
        .join("")
    : `<p class="department-empty">Sem participantes associados a este departamento.</p>`;

  const regulationsMarkup = department.regulations.length
    ? `
        <ul class="department-list">
          ${department.regulations
            .map(
              (regulation) => `
                <li>
                  <a href="${regulation.href}" target="_blank" rel="noopener noreferrer">
                    ${escapeHtml(regulation.label)}
                  </a>
                  ${regulation.year ? `<span>${escapeHtml(regulation.year)}</span>` : ""}
                </li>
              `,
            )
            .join("")}
        </ul>
      `
    : `<p class="department-empty">Sem regulamentos associados neste momento.</p>`;

  const activitiesMarkup = orderedActivities.length
    ? `
        <ol class="department-activity-list">
          ${orderedActivities
            .map(
              (activity) => `
                <li>
                  <span>${formatDate(activity.date)}</span>
                  <a href="${activity.permalink}" target="_blank" rel="noopener noreferrer">
                    ${escapeHtml(activity.title)}
                  </a>
                </li>
              `,
            )
            .join("")}
        </ol>
      `
    : `<p class="department-empty">Ainda não existem atividades ligadas a este departamento.</p>`;

  const galleryMarkup = department.gallery.length
    ? `
        <div class="department-gallery-window">
          <div class="department-gallery-track">
            ${department.gallery
              .map(
                (item) => `
                  <article class="department-gallery-slide">
                    ${
                      item.link
                        ? `<a href="${item.link}" target="_blank" rel="noopener noreferrer" class="department-gallery-link">`
                        : `<div class="department-gallery-link">`
                    }
                      <img src="${item.image}" alt="${escapeHtml(item.title)}" loading="lazy" />
                      <div class="department-gallery-overlay">
                        <span>${escapeHtml(item.title)}</span>
                      </div>
                    ${item.link ? "</a>" : "</div>"}
                  </article>
                `,
              )
              .join("")}
          </div>
        </div>
        <div class="department-gallery-controls${department.gallery.length < 2 ? " is-hidden" : ""}">
          <button class="department-gallery-btn" type="button" data-gallery-prev aria-label="Imagem anterior">←</button>
          <div class="department-gallery-dots">
            ${department.gallery
              .map(
                (_, index) => `
                  <button
                    class="department-gallery-dot${index === 0 ? " is-active" : ""}"
                    type="button"
                    data-gallery-dot="${index}"
                    aria-label="Ir para imagem ${index + 1}"
                  ></button>
                `,
              )
              .join("")}
          </div>
          <button class="department-gallery-btn" type="button" data-gallery-next aria-label="Imagem seguinte">→</button>
        </div>
      `
    : `<p class="department-empty">Sem galeria disponível para este departamento.</p>`;

  const heroBackground = department.backgroundImage
    ? `style="background-image: linear-gradient(135deg, rgba(15, 24, 36, 0.78), rgba(34, 48, 70, 0.36)), url('${department.backgroundImage}');"`
    : "";

  panelHost.innerHTML = `
    <div class="department-feature" ${heroBackground}>
      <div class="department-feature-copy">
        <span class="department-kicker">Departamento da direção</span>
        <h3>${escapeHtml(department.name)}</h3>
      </div>
    </div>

    <div class="department-content-grid">
      <section class="department-story-card">
        <div class="department-card-head">
          <span class="department-card-kicker">O que faz</span>
          <h4>Enquadramento do departamento</h4>
        </div>
        <p class="department-story-copy">${escapeHtml(department.role || "Sem descrição disponível.")}</p>

        <div class="department-story-split">
          <div class="department-story-block">
            <h5>Regulamentos</h5>
            ${regulationsMarkup}
          </div>
          <div class="department-story-block">
            <h5>Atividades</h5>
            ${activitiesMarkup}
          </div>
        </div>
      </section>

      <section class="department-members-card">
        <div class="department-card-head">
          <span class="department-card-kicker">Equipa</span>
          <h4>Participantes organizados por cargo</h4>
        </div>
        ${membersMarkup}
      </section>
    </div>

    <section class="department-gallery-card">
      <div class="department-card-head">
        <span class="department-card-kicker">Galeria</span>
        <h4>Imagens do departamento</h4>
      </div>
      ${galleryMarkup}
    </section>
  `;

  const track = panelHost.querySelector(".department-gallery-track");
  const dots = Array.from(panelHost.querySelectorAll("[data-gallery-dot]"));
  const prevButton = panelHost.querySelector("[data-gallery-prev]");
  const nextButton = panelHost.querySelector("[data-gallery-next]");

  if (!track || department.gallery.length < 2) return;

  let currentIndex = 0;

  const updateGallery = () => {
    track.style.transform = `translate3d(${-currentIndex * 100}%, 0, 0)`;
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === currentIndex);
    });
  };

  prevButton?.addEventListener("click", () => {
    currentIndex = currentIndex === 0 ? department.gallery.length - 1 : currentIndex - 1;
    updateGallery();
  });

  nextButton?.addEventListener("click", () => {
    currentIndex = currentIndex === department.gallery.length - 1 ? 0 : currentIndex + 1;
    updateGallery();
  });

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      currentIndex = Number(dot.dataset.galleryDot || "0");
      updateGallery();
    });
  });

  updateGallery();
  panelHost.hidden = false;
}

function setupTeamSectionFeature() {
  const tabsHost = document.getElementById("team-tabs");
  const panelHost = document.getElementById("team-panels");
  const departmentCollection = getDepartmentsCollection();

  if (!tabsHost || !panelHost || !departmentCollection.length) return;

  let activeDepartment = departmentCollection[0].id;

  const activateDepartment = (nextKey) => {
    activeDepartment = nextKey;

    Array.from(tabsHost.querySelectorAll(".teamv2-tab")).forEach((tab) => {
      const isActive = tab.dataset.teamKey === nextKey && nextKey !== "";
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
      tab.tabIndex = isActive ? 0 : -1;
    });

    const department = getDepartmentsCollection().find((item) => item.id === nextKey);
    renderTeamDepartmentPanel(panelHost, department);
  };

  renderTeamDepartmentTabs(tabsHost, activeDepartment, (nextKey) => {
    activateDepartment(nextKey);
  });

  setupHorizontalTabsScrolling(tabsHost);

  activateDepartment(activeDepartment);
}

