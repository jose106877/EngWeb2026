/*
 * quick-nav.js
 * Feature: Quick glass navigation bar — shows/hides on scroll, highlights active section.
 * Depends on: (self-contained DOM queries)
 */
// -----------------------------------------------------------------------------
// Feature: Quick glass navigation (main pages)
// -----------------------------------------------------------------------------
function setupQuickGlassNavFeature() {
  const quickNav = document.getElementById("quick-glass-nav");
  if (!quickNav) return;

  const visibilityStartSection = document.getElementById("sobre");
  const visibilityEndSection = document.getElementById("socios");
  if (!(visibilityStartSection instanceof HTMLElement) || !(visibilityEndSection instanceof HTMLElement)) {
    return;
  }
  const compactNavQuery = window.matchMedia("(max-width: 720px)");

  const quickLinks = Array.from(quickNav.querySelectorAll('a[href^="#"]')).filter(
    (link) => link instanceof HTMLAnchorElement
  );
  if (!quickLinks.length) return;

  const trackedSections = quickLinks
    .map((link) => link.getAttribute("href"))
    .filter((href) => typeof href === "string" && href.startsWith("#"))
    .map((href) => document.getElementById(href.slice(1)))
    .filter((section) => section instanceof HTMLElement);
  if (!trackedSections.length) return;

  let frame = null;

  const syncActiveState = (activeId) => {
    quickLinks.forEach((link) => {
      const linkHash = link.getAttribute("href");
      const isActive = Boolean(activeId && linkHash === `#${activeId}`);
      link.classList.toggle("is-active", isActive);

      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  const updateVisibility = () => {
    frame = null;

    const viewportTop = window.scrollY;
    const viewportBottom = viewportTop + window.innerHeight;
    const viewportProbe = viewportTop + window.innerHeight * 0.45;
    const rangeStart = visibilityStartSection.offsetTop;
    const mobileEndSection = document.getElementById("contactos");
    const effectiveEndSection =
      compactNavQuery.matches && mobileEndSection instanceof HTMLElement
        ? mobileEndSection
        : visibilityEndSection;
    const rangeEnd = effectiveEndSection.offsetTop + effectiveEndSection.offsetHeight;
    const isWithinVisibleRange = viewportProbe >= rangeStart && viewportProbe <= rangeEnd;
    let activeSection = null;
    let maxVisiblePixels = 0;

    trackedSections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionBottom = sectionTop + section.offsetHeight;
      const visiblePixels = Math.max(
        0,
        Math.min(viewportBottom, sectionBottom) - Math.max(viewportTop, sectionTop)
      );

      if (visiblePixels > maxVisiblePixels) {
        maxVisiblePixels = visiblePixels;
        activeSection = section;
      }
    });

    const minVisiblePixels = Math.max(56, window.innerHeight * 0.12);
    const hasActiveTrackedSection =
      Boolean(activeSection) &&
      maxVisiblePixels >= Math.min(minVisiblePixels, (activeSection?.offsetHeight ?? 0) * 0.5);
    const showNav = isWithinVisibleRange;

    quickNav.classList.toggle("is-visible", showNav);
    syncActiveState(showNav && hasActiveTrackedSection ? activeSection?.id ?? "" : "");
  };

  const queueUpdate = () => {
    if (frame !== null) return;
    frame = window.requestAnimationFrame(updateVisibility);
  };

  window.addEventListener("scroll", queueUpdate, { passive: true });
  window.addEventListener("resize", queueUpdate);
  window.addEventListener("hashchange", queueUpdate);

  queueUpdate();
}
