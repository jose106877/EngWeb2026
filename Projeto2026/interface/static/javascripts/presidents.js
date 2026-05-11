/*
 * presidents.js
 * Feature: Presidents showcase — interactive list with animated photo/detail panel.
 * Depends on: shared.js (presidentsShowcase)
 */
// -----------------------------------------------------------------------------
// Feature: Presidents showcase
// -----------------------------------------------------------------------------
function setupPresidentsShowcaseFeature() {
  if (!presidentsShowcase) return;

  const presidentRows = Array.from(presidentsShowcase.querySelectorAll(".president-row"));
  const detailPanel = presidentsShowcase.querySelector(".president-detail");
  const detailCard = document.getElementById("president-photo-card");
  const detailImage = document.getElementById("president-detail-image");
  const detailName = document.getElementById("president-detail-name");
  const detailOrder = document.getElementById("president-detail-order");

  if (
    !presidentRows.length ||
    !detailPanel ||
    !detailImage ||
    !detailName ||
    !detailOrder
  ) {
    return;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const compactViewportQuery = window.matchMedia("(max-width: 720px)");
  let imageLoadToken = 0;

  const setShowcaseState = (hasActive) => {
    presidentsShowcase.classList.toggle("has-active-president", hasActive);
    detailPanel.setAttribute("aria-hidden", hasActive ? "false" : "true");
  };

  const updateRowState = (activeRow = null) => {
    presidentRows.forEach((item) => {
      const isCurrent = item === activeRow;
      item.setAttribute("aria-selected", isCurrent ? "true" : "false");
      item.classList.toggle("is-active", isCurrent);

      const marker = item.querySelector(".president-row-mark");
      if (marker) {
        marker.textContent = isCurrent ? "×" : "+";
      }
    });
  };

  const updateDetailImage = (source, alt) => {
    if (!source) return;

    imageLoadToken += 1;
    const currentToken = imageLoadToken;
    const previousSource = detailImage.dataset.source || "";
    const sourceChanged = previousSource !== source;
    detailImage.dataset.source = source;

    if (detailCard) {
      detailCard.classList.add("is-loading");
    }

    const finishLoading = () => {
      if (currentToken !== imageLoadToken) return;
      if (detailCard) {
        detailCard.classList.remove("is-loading");
      }
    };

    const handleLoad = () => finishLoading();
    const handleError = () => finishLoading();

    detailImage.alt = alt;
    if (sourceChanged) {
      detailImage.addEventListener("load", handleLoad, { once: true });
      detailImage.addEventListener("error", handleError, { once: true });
      detailImage.src = source;
    }

    if (!sourceChanged || (detailImage.complete && detailImage.naturalWidth > 0)) {
      finishLoading();
    }
  };

  const clearSelection = () => {
    updateRowState(null);
    setShowcaseState(false);
    if (detailCard) {
      detailCard.classList.remove("is-revealing");
      detailCard.classList.remove("is-loading");
    }
  };

  const activatePresident = (row, options = {}) => {
    const { skipAnimation = false, force = false } = options;
    const alreadyActive = row.getAttribute("aria-selected") === "true";
    if (alreadyActive && !skipAnimation && !force) {
      clearSelection();
      return;
    }

    const name = row.dataset.name;
    const image = row.dataset.image;
    const mandate = row.dataset.mandate;

    if (!name || !image || !mandate) return;

    updateRowState(row);

    updateDetailImage(image, `Foto de ${name}`);
    detailName.textContent = name;
    detailOrder.textContent = mandate;

    setShowcaseState(true);

    if (compactViewportQuery.matches && !skipAnimation) {
      requestAnimationFrame(() => {
        detailPanel.scrollIntoView({
          block: "start",
          behavior: prefersReducedMotion ? "auto" : "smooth",
        });
      });
    }

    if (detailCard && !prefersReducedMotion && !skipAnimation) {
      detailCard.classList.remove("is-revealing");
      void detailCard.offsetWidth;
      detailCard.classList.add("is-revealing");
    }
  };

  const focusAndActivateRow = (targetIndex) => {
    if (!presidentRows.length) return;
    const lastIndex = presidentRows.length - 1;
    const boundedIndex = Math.min(Math.max(targetIndex, 0), lastIndex);
    const targetRow = presidentRows[boundedIndex];
    targetRow.focus();
    activatePresident(targetRow, { force: true });
  };

  presidentRows.forEach((row, index) => {
    row.addEventListener("click", () => activatePresident(row));
    row.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        focusAndActivateRow(index + 1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        focusAndActivateRow(index - 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        focusAndActivateRow(0);
      } else if (event.key === "End") {
        event.preventDefault();
        focusAndActivateRow(presidentRows.length - 1);
      } else if (event.key === "Escape" && row.getAttribute("aria-selected") === "true") {
        event.preventDefault();
        clearSelection();
      }
    });
  });

  setShowcaseState(false);

  const initialRow =
    presidentRows.find((row) => row.classList.contains("is-active") || row.getAttribute("aria-selected") === "true") ??
    presidentRows[0];
  if (initialRow) {
    activatePresident(initialRow, { skipAnimation: true, force: true });
  }
}
