/*
 * scroll.js
 * Feature: Smooth anime-style page scrolling (no section lock).
 * Depends on: shared.js (lerp, clearGlobalScrollLocks)
 */
// -----------------------------------------------------------------------------
// Feature: Anime.js-style smooth page scrolling (without section lock)
// -----------------------------------------------------------------------------
function setupAnimeStyleScrollFeature() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const easing = 0.12;
  const settleThreshold = 0.4;
  const wheelMultiplier = 0.95;

  let targetY = window.scrollY;
  let currentY = window.scrollY;
  let frame = null;
  let ignoreNativeScrollUntil = 0;

  const getMaxScrollY = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

  const clampTarget = () => {
    const maxScrollY = getMaxScrollY();
    targetY = Math.max(0, Math.min(maxScrollY, targetY));
  };

  const stopFrame = () => {
    if (frame !== null) {
      cancelAnimationFrame(frame);
      frame = null;
    }
  };

  const scrollWindowTo = (topValue) => {
    const top = Number.isFinite(topValue) ? topValue : 0;
    try {
      window.scrollTo({ top, left: 0, behavior: "instant" });
    } catch (_error) {
      window.scrollTo(0, top);
    }
  };

  const getScrollableAncestor = (target, axis = "y") => {
    let element = target instanceof Element ? target : null;

    while (element && element !== document.body && element !== document.documentElement) {
      const styles = window.getComputedStyle(element);
      const isScrollable =
        axis === "x"
          ? /(auto|scroll|overlay)/.test(styles.overflowX) &&
            element.scrollWidth > element.clientWidth + 1
          : /(auto|scroll|overlay)/.test(styles.overflowY) &&
            element.scrollHeight > element.clientHeight + 1;

      if (isScrollable) return element;
      element = element.parentElement;
    }

    return null;
  };

  const canConsumeScrollDelta = (scrollable, delta, axis = "y") => {
    if (!scrollable || delta === 0) return false;

    if (axis === "x") {
      if (delta > 0) {
        return scrollable.scrollLeft + scrollable.clientWidth < scrollable.scrollWidth - 1;
      }
      return scrollable.scrollLeft > 1;
    }

    if (delta > 0) {
      return scrollable.scrollTop + scrollable.clientHeight < scrollable.scrollHeight - 1;
    }
    return scrollable.scrollTop > 1;
  };

  const isTextInputTarget = (target) =>
    target instanceof Element &&
    Boolean(target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]'));

  const shouldHandleWheel = (target, delta, axis = "y") => {
    if (isTextInputTarget(target)) return false;

    const scrollableParent = getScrollableAncestor(target, axis);
    if (!scrollableParent) return true;

    return !canConsumeScrollDelta(scrollableParent, delta, axis);
  };

  const step = () => {
    const delta = targetY - currentY;

    if (Math.abs(delta) <= settleThreshold) {
      currentY = targetY;
      ignoreNativeScrollUntil = performance.now() + 72;
      scrollWindowTo(currentY);
      frame = null;
      return;
    }

    currentY += delta * easing;
    ignoreNativeScrollUntil = performance.now() + 72;
    scrollWindowTo(currentY);
    frame = requestAnimationFrame(step);
  };

  const queueStep = () => {
    if (frame === null) {
      frame = requestAnimationFrame(step);
    }
  };

  const moveBy = (deltaY) => {
    if (!deltaY) return;

    targetY += deltaY;
    clampTarget();
    queueStep();
  };

  const onWheel = (event) => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey) return;

    const useYAxis = Math.abs(event.deltaY) >= Math.abs(event.deltaX);
    const delta = useYAxis ? event.deltaY : event.deltaX;
    const axis = useYAxis ? "y" : "x";
    if (delta === 0) return;
    if (!shouldHandleWheel(event.target, delta, axis)) return;

    event.preventDefault();
    moveBy(delta * wheelMultiplier);
  };

  const onKeyDown = (event) => {
    if (event.defaultPrevented || isTextInputTarget(event.target)) return;

    let delta = 0;

    switch (event.key) {
      case "ArrowDown":
        delta = 92;
        break;
      case "ArrowUp":
        delta = -92;
        break;
      case "PageDown":
        delta = window.innerHeight * 0.9;
        break;
      case "PageUp":
        delta = -window.innerHeight * 0.9;
        break;
      case " ":
        delta = window.innerHeight * (event.shiftKey ? -0.86 : 0.86);
        break;
      case "Home":
        event.preventDefault();
        targetY = 0;
        queueStep();
        return;
      case "End":
        event.preventDefault();
        targetY = getMaxScrollY();
        queueStep();
        return;
      default:
        return;
    }

    event.preventDefault();
    moveBy(delta);
  };

  const onNativeScroll = () => {
    if (performance.now() <= ignoreNativeScrollUntil) return;

    currentY = window.scrollY;
    targetY = currentY;
    stopFrame();
  };

  const onResize = () => {
    currentY = window.scrollY;
    clampTarget();
  };

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("keydown", onKeyDown, { passive: false });
  window.addEventListener("scroll", onNativeScroll, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
}

