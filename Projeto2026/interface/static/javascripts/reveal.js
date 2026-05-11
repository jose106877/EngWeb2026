/*
 * reveal.js
 * Feature: Scroll reveal (IntersectionObserver fade-in) + tilted card tilt effect.
 * Depends on: (self-contained DOM queries)
 */

// -----------------------------------------------------------------------------
// Feature: Scroll reveal
// -----------------------------------------------------------------------------
function setupRevealFeature() {
  const revealSections = document.querySelectorAll(".reveal");
  if (!revealSections.length) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    revealSections.forEach((section) => section.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target); // play once, never re-hide
        }
      });
    },
    {
      // Fires when the section's top edge crosses 120px above the bottom of
      // the viewport — animation is already playing as the section scrolls in
      rootMargin: "0px 0px -120px 0px",
      threshold: 0,
    }
  );

  revealSections.forEach((section) => observer.observe(section));
}

// -----------------------------------------------------------------------------
// Feature: Tilted cards (Sobre Nós)
// -----------------------------------------------------------------------------
function setupAboutTiltedCardsFeature() {
  const tiltedCards = Array.from(document.querySelectorAll(".tilted-card"));
  if (!tiltedCards.length) return;

  const shouldReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const supportsFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (shouldReduceMotion || !supportsFinePointer) return;

  const maxTiltDegrees = 11;

  const resetCardState = (card) => {
    card.style.setProperty("--tilt-rotate-x", "0deg");
    card.style.setProperty("--tilt-rotate-y", "0deg");
    card.style.setProperty("--tilt-glare-x", "50%");
    card.style.setProperty("--tilt-glare-y", "50%");
    card.classList.remove("is-tilting");
  };

  tiltedCards.forEach((card) => {
    let frame = null;
    let pointer = null;

    const paintTilt = () => {
      if (!pointer) {
        frame = null;
        return;
      }
      const rect = card.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        frame = null;
        return;
      }
      const x = Math.min(Math.max((pointer.x - rect.left) / rect.width, 0), 1);
      const y = Math.min(Math.max((pointer.y - rect.top) / rect.height, 0), 1);
      const rotateY = (x - 0.5) * (maxTiltDegrees * 2);
      const rotateX = (0.5 - y) * (maxTiltDegrees * 2);
      card.style.setProperty("--tilt-rotate-x", `${rotateX.toFixed(2)}deg`);
      card.style.setProperty("--tilt-rotate-y", `${rotateY.toFixed(2)}deg`);
      card.style.setProperty("--tilt-glare-x", `${(x * 100).toFixed(2)}%`);
      card.style.setProperty("--tilt-glare-y", `${(y * 100).toFixed(2)}%`);
      card.classList.add("is-tilting");
      frame = null;
    };

    const queuePaint = () => {
      if (frame !== null) return;
      frame = requestAnimationFrame(paintTilt);
    };

    const clearTilt = () => {
      pointer = null;
      if (frame !== null) {
        cancelAnimationFrame(frame);
        frame = null;
      }
      resetCardState(card);
    };

    card.addEventListener("pointermove", (event) => {
      if (event.pointerType && event.pointerType !== "mouse") return;
      pointer = { x: event.clientX, y: event.clientY };
      queuePaint();
    });
    card.addEventListener("pointerleave", clearTilt);
    card.addEventListener("pointercancel", clearTilt);
    card.addEventListener("blur", clearTilt);
  });
}