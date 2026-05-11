/*
 * hero.js
 * Features: Hero intro text animation + cursor parallax effect.
 * Depends on: shared.js (hero, lerp)
 */
// -----------------------------------------------------------------------------
// Feature: Hero intro text animation
// -----------------------------------------------------------------------------
function splitTextForHeroAnimation(element, lineDelayMs = 0) {
  const originalText = element.textContent ?? "";
  const tokens = originalText.split(/(\s+)/);
  let charIndex = 0;

  element.setAttribute("aria-label", originalText.trim());
  element.setAttribute("role", "text");
  element.textContent = "";
  const fragment = document.createDocumentFragment();

  tokens.forEach((token) => {
    if (!token) return;

    if (/^\s+$/.test(token)) {
      fragment.appendChild(document.createTextNode(token));
      return;
    }

    const word = document.createElement("span");
    word.className = "hero-word";
    word.setAttribute("aria-hidden", "true");

    Array.from(token).forEach((character) => {
      const span = document.createElement("span");
      span.className = "hero-char";
      span.setAttribute("aria-hidden", "true");
      span.style.setProperty("--char-index", charIndex++);
      span.style.setProperty("--line-delay", `${lineDelayMs}ms`);
      span.textContent = character;
      word.appendChild(span);
    });

    fragment.appendChild(word);
  });

  element.appendChild(fragment);
}

function setupHeroTextIntroFeature() {
  if (
    !hero ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    window.matchMedia("(max-width: 720px)").matches
  ) {
    return;
  }

  const heroTag = hero.querySelector(".hero-tag");
  const heroTitle = hero.querySelector(".hero-title");
  const heroLead = hero.querySelector(".hero-lead");
  const heroActions = hero.querySelector(".hero-actions");

  if (!heroTag || !heroTitle || !heroLead || !heroActions) {
    return;
  }

  hero.classList.add("hero-entry");
  splitTextForHeroAnimation(heroTag, 0);
  splitTextForHeroAnimation(heroTitle, 180);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      hero.classList.add("hero-entry-ready");
    });
  });
}

// -----------------------------------------------------------------------------
// Feature: Hero cursor parallax (without cursor glow)
// -----------------------------------------------------------------------------
function setupHeroParallaxFeature() {
  if (
    !hero ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    window.matchMedia("(max-width: 720px)").matches
  ) {
    return;
  }

  let pointerX = 50;
  let pointerY = 40;
  let frame = null;

  const applyMotion = () => {
    const dx = ((pointerX - 50) / 50) * 18;
    const dy = ((pointerY - 50) / 50) * 14;
    hero.style.setProperty("--shift-x", `${dx.toFixed(2)}px`);
    hero.style.setProperty("--shift-y", `${dy.toFixed(2)}px`);
    frame = null;
  };

  const queueMotion = () => {
    if (frame === null) {
      frame = requestAnimationFrame(applyMotion);
    }
  };

  const updatePointer = (clientX, clientY) => {
    const rect = hero.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    pointerX = ((clientX - rect.left) / rect.width) * 100;
    pointerY = ((clientY - rect.top) / rect.height) * 100;
    hero.classList.add("is-hovering");
    queueMotion();
  };

  hero.addEventListener("mousemove", (event) => {
    updatePointer(event.clientX, event.clientY);
  });

  hero.addEventListener("mouseenter", () => {
    hero.classList.add("is-hovering");
  });

  hero.addEventListener("mouseleave", () => {
    pointerX = 50;
    pointerY = 40;
    hero.classList.remove("is-hovering");
    queueMotion();
  });
}
