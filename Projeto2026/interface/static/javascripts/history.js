/*
 * history.js
 * Feature: History timeline — scroll-driven year highlight + year-chip photo switcher.
 * Depends on: (self-contained DOM queries)
 */
// -----------------------------------------------------------------------------
// Feature: History timeline
// -----------------------------------------------------------------------------
function setupHistoryTimelineFeature() {
  const timelineContainer = document.getElementById("history-timeline-scroll");
  const yearNumber = document.getElementById("history-active-year");
  if (!timelineContainer || !yearNumber) return;

  const eventItems = Array.from(timelineContainer.querySelectorAll(".history-event-item"));
  const topSpacer = timelineContainer.querySelector(".history-spacer-top");
  const bottomSpacer = timelineContainer.querySelector(".history-spacer-bottom");
  const teamGrid = document.getElementById("history-team-grid");
  const yearChips = Array.from(document.querySelectorAll(".history-year-chip"));

  if (!eventItems.length || !topSpacer || !bottomSpacer) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let activeIndex = 0;
  let indicatorFrame = null;
  let smoothFrame = null;
  let wheelTarget = timelineContainer.scrollTop;
  let pinnedIndex = null;

  const renderTeamPhotos = (yearValue) => 
  {

    yearChips.forEach((chip) => {
      chip.classList.toggle(
        "is-active",
        chip.dataset.yearTarget === String(yearValue)
      );
    });

    if(!teamGrid) 
      return;

    const photos = Array.from(
      teamGrid.querySelectorAll(".history-photo-card")
    );

    photos.forEach((photo) => {
      const visible = photo.dataset.year === String(yearValue);
      photo.style.display = visible ? "block" : "none";
    });
  };

  const animateYearIfNeeded = () => {
    if (prefersReducedMotion) return;
    yearNumber.classList.remove("is-animating");
    // Force reflow so animation can restart on each year change.
    void yearNumber.offsetWidth;
    yearNumber.classList.add("is-animating");
  };

  const setActiveIndex = (index, options = {}) => {
    renderTeamPhotos(eventItems[0].dataset.year);
    if (!eventItems[index]) return;

    activeIndex = index;
    const nextYear = eventItems[index].dataset.year || "";
    const shouldAnimateYear = options.animateYear !== false;

    if (yearNumber.textContent !== nextYear) {
      yearNumber.textContent = nextYear;
      if (shouldAnimateYear) {
        animateYearIfNeeded();
      }
    }
    renderTeamPhotos(nextYear);

    eventItems.forEach((item, itemIndex) => {
      item.classList.toggle("is-active", itemIndex === index);
      item.classList.toggle("is-past", itemIndex < index);
    });
  };

  const updateSpacers = () => {
    const height = timelineContainer.clientHeight;
    if (!height) return;
    // Top spacer intentionally smaller so "O Início" starts closer to the year.
    topSpacer.style.height = `${Math.round(height * 0.28)}px`;
    bottomSpacer.style.height = `${Math.round(height * 0.5)}px`;
  };

  const computeClosestIndex = () => {
    const containerRect = timelineContainer.getBoundingClientRect();
    const focusLine = containerRect.top + containerRect.height * 0.46;

    let closestIndex = 0;
    let minDistance = Number.POSITIVE_INFINITY;

    eventItems.forEach((item, index) => {
      const rect = item.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const distance = Math.abs(focusLine - center);

      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  };

  const updateActiveByScroll = () => {
    indicatorFrame = null;

    if (pinnedIndex !== null) {
      if (activeIndex !== pinnedIndex) {
        setActiveIndex(pinnedIndex, { animateYear: false });
      }
      return;
    }

    const nextIndex = computeClosestIndex();
    if (nextIndex !== activeIndex) {
      setActiveIndex(nextIndex);
    }
  };

  const scheduleActiveUpdate = () => {
    if (indicatorFrame !== null) return;
    indicatorFrame = requestAnimationFrame(updateActiveByScroll);
  };

  const clampWheelTarget = () => {
    const max = Math.max(0, timelineContainer.scrollHeight - timelineContainer.clientHeight);
    wheelTarget = Math.max(0, Math.min(max, wheelTarget));
  };

  const stepSmoothWheel = () => {
    const delta = wheelTarget - timelineContainer.scrollTop;
    const ease = prefersReducedMotion ? 0.3 : 0.16;

    if (Math.abs(delta) < 0.45) {
      timelineContainer.scrollTop = wheelTarget;
      smoothFrame = null;
      if (pinnedIndex !== null) {
        setActiveIndex(pinnedIndex);
        pinnedIndex = null;
      }
      scheduleActiveUpdate();
      return;
    }

    timelineContainer.scrollTop += delta * ease;
    scheduleActiveUpdate();
    smoothFrame = requestAnimationFrame(stepSmoothWheel);
  };

  const startSmoothWheel = () => {
    if (smoothFrame !== null) return;
    smoothFrame = requestAnimationFrame(stepSmoothWheel);
  };

  const scrollToYear = (yearValue) => {
    const targetIndex = eventItems.findIndex((item) => item.dataset.year === String(yearValue));
    if (targetIndex < 0) return;

    const targetItem = eventItems[targetIndex];
    const containerRect = timelineContainer.getBoundingClientRect();
    const itemRect = targetItem.getBoundingClientRect();
    const itemCenter = itemRect.top + itemRect.height / 2;
    const focusLine = containerRect.top + containerRect.height * 0.46;
    const targetTop = timelineContainer.scrollTop + (itemCenter - focusLine);

    pinnedIndex = targetIndex;
    setActiveIndex(targetIndex);
    wheelTarget = targetTop;
    clampWheelTarget();

    if (prefersReducedMotion) {
      timelineContainer.scrollTop = wheelTarget;
      setActiveIndex(targetIndex);
      pinnedIndex = null;
      return;
    }

    startSmoothWheel();
  };

  const onScroll = () => {
    if (smoothFrame === null && pinnedIndex === null) {
      wheelTarget = timelineContainer.scrollTop;
    }
    scheduleActiveUpdate();
  };

  const onWheel = (event) => {
    if (prefersReducedMotion) return;

    event.preventDefault();
    pinnedIndex = null;
    // Smaller multiplier keeps transitions readable year-by-year.
    wheelTarget += (event.deltaY + event.deltaX * 0.35) * 0.28;
    clampWheelTarget();
    startSmoothWheel();
  };

  const onResize = () => {
    updateSpacers();
    clampWheelTarget();
    scheduleActiveUpdate();
  };

  timelineContainer.addEventListener("scroll", onScroll, { passive: true });
  timelineContainer.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("resize", onResize);
  yearChips.forEach((chip) => {
    chip.addEventListener("click", () => scrollToYear(chip.dataset.yearTarget));
  });

  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(onResize);
    observer.observe(timelineContainer);
  }

  setActiveIndex(0, { animateYear: false });
  updateSpacers();

  requestAnimationFrame(() => {
    updateSpacers();
    wheelTarget = timelineContainer.scrollTop;
    setActiveIndex(computeClosestIndex(), { animateYear: false });
  });
}

