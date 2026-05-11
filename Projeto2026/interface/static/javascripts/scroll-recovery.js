/*
 * scroll-recovery.js
 * Feature: Scroll recovery safeguard — clears stuck overflow locks on visibility change.
 * Depends on: shared.js (clearGlobalScrollLocks)
 */
// -----------------------------------------------------------------------------
// Feature: Scroll recovery safeguard
// -----------------------------------------------------------------------------
function setupScrollRecoveryFeature() {
  clearGlobalScrollLocks();

  window.addEventListener("pageshow", clearGlobalScrollLocks);
  window.addEventListener("hashchange", clearGlobalScrollLocks);

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", () => {
      requestAnimationFrame(clearGlobalScrollLocks);
    });
  });
}

