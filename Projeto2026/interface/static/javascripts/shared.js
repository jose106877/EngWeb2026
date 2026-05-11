/*
 * shared.js
 * Shared DOM references and utility helpers used across all feature modules.
 *
 * IMPORTANT: nothing here may reference data arrays (departments, posts, etc.)
 * at parse time — those are not available until loadAppData() resolves.
 * activeDepartment is seeded inside initPageFeatures() in app.js instead.
 */

// -----------------------------------------------------------------------------
// DOM references
// -----------------------------------------------------------------------------
const tabsContainer     = document.getElementById("department-tabs");
const departmentPanel   = document.getElementById("department-panel");
const activityTabs      = document.getElementById("activity-tabs");
const activitiesHighlights = document.getElementById("activities-highlights");
const activitiesFeed    = document.getElementById("activities-feed");
const activitiesStatus  = document.getElementById("activities-meta-status");
const supportForm       = document.getElementById("support-form");
const feedback          = document.getElementById("form-feedback");
const hero              = document.querySelector(".hero");
const presidentsShowcase = document.getElementById("presidents-showcase");

// Seeded to departments[0].id inside initPageFeatures() once data is loaded
let activeDepartment        = "";
let destroyActivitiesGallery = null;
let activeActivityFilter     = "all";

// -----------------------------------------------------------------------------
// Shared helpers
// -----------------------------------------------------------------------------
function clearGlobalScrollLocks() {
  const root = document.documentElement;
  const body = document.body;

  [root, body].forEach((element) => {
    if (!element) return;
    element.style.removeProperty("overflow");
    element.style.removeProperty("overflow-y");
    element.style.removeProperty("position");
    element.style.removeProperty("height");
    element.style.removeProperty("top");
    element.style.removeProperty("width");
    element.style.removeProperty("touch-action");
  });
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function lerp(start, end, t) {
  return start + (end - start) * t;
}

function createPhotoRunner(photos) {
  const double = [...photos, ...photos];
  return `
    <div class="photo-runner">
      <div class="runner-track">
        ${double.map((photo) => `<span>${photo}</span>`).join("")}
      </div>
    </div>
  `;
}

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
