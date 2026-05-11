/*
 * departments.js
 * Feature: Departments — visual selector + detail panel with members by role and gallery.
 * Depends on: shared.js (tabsContainer, departmentPanel, activeDepartment, getInitials, formatDate)
 */

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

function getDepartmentPreviewMarkup(department) {
  const previewImage =
    department.backgroundImage ||
    department.members.find((member) => member.photo)?.photo ||
    null;

  if (previewImage) {
    return `<span class="department-tab-media"><img src="${previewImage}" alt="${escapeHtml(
      department.name,
    )}" loading="lazy" /></span>`;
  }

  return `
    <span class="department-tab-media department-tab-media-fallback">
      ${escapeHtml(getInitials(department.name))}
    </span>
  `;
}

function renderDepartmentTabs() {
  if (!tabsContainer) return;

  tabsContainer.innerHTML = getDepartmentsCollection()
    .map(
      (department, index) => `
        <button
          class="department-tab${department.id === activeDepartment ? " is-active" : ""}"
          data-department="${department.id}"
          type="button"
          role="tab"
          aria-selected="${department.id === activeDepartment ? "true" : "false"}"
          style="--tab-i: ${index}"
        >
          ${getDepartmentPreviewMarkup(department)}
          <span class="department-tab-copy">
            <span class="department-tab-name">${escapeHtml(department.name)}</span>
            <span class="department-tab-meta">${department.members.length} membros</span>
          </span>
        </button>
      `,
    )
    .join("");

  tabsContainer.querySelectorAll(".department-tab").forEach((button) => {
    button.addEventListener("click", () => {
      activeDepartment = button.dataset.department;
      renderDepartmentTabs();
      renderDepartmentPanel();
    });
  });
}

function renderDepartmentPanel() {
  if (!departmentPanel) return;

  const department = getDepartmentsCollection().find(
    (item) => item.id === activeDepartment,
  );
  if (!department) {
    departmentPanel.innerHTML = "<p>Departamento não encontrado.</p>";
    return;
  }

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

  departmentPanel.innerHTML = `
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

  const track = departmentPanel.querySelector(".department-gallery-track");
  const dots = Array.from(departmentPanel.querySelectorAll("[data-gallery-dot]"));
  const prevButton = departmentPanel.querySelector("[data-gallery-prev]");
  const nextButton = departmentPanel.querySelector("[data-gallery-next]");

  if (!track || department.gallery.length < 2) return;

  let currentIndex = 0;

  const updateGallery = () => {
    track.style.transform = `translate3d(${-currentIndex * 100}%, 0, 0)`;
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === currentIndex);
    });
  };

  prevButton?.addEventListener("click", () => {
    currentIndex =
      currentIndex === 0 ? department.gallery.length - 1 : currentIndex - 1;
    updateGallery();
  });

  nextButton?.addEventListener("click", () => {
    currentIndex =
      currentIndex === department.gallery.length - 1 ? 0 : currentIndex + 1;
    updateGallery();
  });

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      currentIndex = Number(dot.dataset.galleryDot || "0");
      updateGallery();
    });
  });

  updateGallery();
}

function setupDepartmentNavigation() {
  const previousButton = document.getElementById("department-prev");
  const nextButton = document.getElementById("department-next");

  if (!previousButton || !nextButton) return;

  previousButton.addEventListener("click", () => {
    const collection = getDepartmentsCollection();
    const currentIndex = collection.findIndex(
      (department) => department.id === activeDepartment,
    );
    const nextIndex =
      currentIndex <= 0 ? collection.length - 1 : currentIndex - 1;
    activeDepartment = collection[nextIndex]?.id || activeDepartment;
    renderDepartmentTabs();
    renderDepartmentPanel();
  });

  nextButton.addEventListener("click", () => {
    const collection = getDepartmentsCollection();
    const currentIndex = collection.findIndex(
      (department) => department.id === activeDepartment,
    );
    const nextIndex =
      currentIndex >= collection.length - 1 ? 0 : currentIndex + 1;
    activeDepartment = collection[nextIndex]?.id || activeDepartment;
    renderDepartmentTabs();
    renderDepartmentPanel();
  });
}

function setupDepartmentsFeature() {
  const collection = getDepartmentsCollection();
  if (!tabsContainer || !departmentPanel || !collection.length) return;
  if (!activeDepartment) {
    activeDepartment = collection[0].id;
  }
  setupDepartmentNavigation();
  renderDepartmentTabs();
  renderDepartmentPanel();
}
