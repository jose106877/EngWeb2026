/*
 * lanyard.js
 * Feature: Sócios lanyard physics — spring-based badge swing animation.
 * Depends on: (self-contained DOM queries)
 */
// -----------------------------------------------------------------------------
// Feature: Socios lanyard physics
// -----------------------------------------------------------------------------
function setupLanyardPhysicsFeature() {
  if (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    window.matchMedia("(max-width: 720px)").matches
  ) {
    return;
  }

  const scenes = Array.from(document.querySelectorAll(".lanyard-scene")).filter(
    (scene) => scene instanceof HTMLElement
  );
  if (!scenes.length) return;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  scenes.forEach((scene) => {
    const strap = scene.querySelector(".lanyard-strap");
    const badge = scene.querySelector(".lanyard-badge");
    const hole = badge?.querySelector(".lanyard-hole");
    if (!(badge instanceof HTMLElement)) return;
    const hasStrap = strap instanceof SVGElement;

    const dragSpring = 0.24;
    const returnSpring = 0.065;
    const linearDampingDrag = 0.86;
    const linearDampingIdle = 0.92;
    const throwGain = 0.2;
    const angularSpring = 0.18;
    const angularDamping = 0.78;
    const rotationFromOffset = 0.12;
    const rotationFromVelocity = 0.9;
    const maxOffsetX = 230;
    const maxOffsetY = 115;
    const maxRotation = 24;
    const settlePos = 0.08;
    const settleVel = 0.02;
    const introDropOffsetX = -12;
    const introDropOffsetY = -30;
    const introDropKickX = 0.35;
    const introDropKickY = 2.1;
    const introObserverThreshold = 0.28;
    const interactiveSelector = "a, button, input, textarea, select, label";

    let offsetX = 0;
    let offsetY = 0;
    let velocityX = 0;
    let velocityY = 0;
    let targetX = 0;
    let targetY = 0;
    let angle = 0;
    let angularVelocity = 0;
    let frame = null;
    let activePointerId = null;
    let isDragging = false;
    let grabOffsetX = 0;
    let grabOffsetY = 0;
    let holeOriginX = badge.offsetWidth * 0.5;
    let holeOriginY = 24;
    let strapAnchorLocalX = 0;
    let strapAnchorLocalY = 0;
    let strapNativeLength = 1;
    let hasPlayedIntroForView = false;

    badge.style.willChange = "transform";
    badge.style.touchAction = "none";
    if (hasStrap) {
      strap.style.transformOrigin = "50% 0%";
      strap.style.transformBox = "fill-box";
      strap.style.willChange = "transform";
      strap.style.pointerEvents = "none";
    }

    const measureGeometry = () => {
      holeOriginX = hole instanceof HTMLElement ? hole.offsetLeft + hole.offsetWidth * 0.5 : badge.offsetWidth * 0.5;
      holeOriginY = hole instanceof HTMLElement ? hole.offsetTop + hole.offsetHeight * 0.5 : 24;
      badge.style.transformOrigin = `${holeOriginX}px ${holeOriginY}px`;

      if (!hasStrap) return;

      const previousTransform = strap.style.transform;
      strap.style.transform = "none";

      const sceneRect = scene.getBoundingClientRect();
      const strapRect = strap.getBoundingClientRect();
      strapAnchorLocalX = strapRect.left + strapRect.width * 0.5 - sceneRect.left;
      strapAnchorLocalY = strapRect.top - sceneRect.top;

      const viewBoxHeight = strap.viewBox?.baseVal?.height ? strap.viewBox.baseVal.height : 240;
      const tipRatio = viewBoxHeight > 0 ? 236 / viewBoxHeight : 0.9833;
      strapNativeLength = Math.max(1, strapRect.height * tipRatio);

      strap.style.transform = previousTransform;
    };

    const toSceneLocalPointer = (event) => {
      const rect = scene.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    };

    const getBadgeBaseCenter = () => ({
      x: badge.offsetLeft + badge.offsetWidth * 0.5,
      y: badge.offsetTop + badge.offsetHeight * 0.5,
    });

    const clampOffsets = () => {
      if (offsetX > maxOffsetX) {
        offsetX = maxOffsetX;
        velocityX *= -0.24;
      } else if (offsetX < -maxOffsetX) {
        offsetX = -maxOffsetX;
        velocityX *= -0.24;
      }

      if (offsetY > maxOffsetY) {
        offsetY = maxOffsetY;
        velocityY *= -0.24;
      } else if (offsetY < -maxOffsetY) {
        offsetY = -maxOffsetY;
        velocityY *= -0.24;
      }
    };

    const paint = () => {
      badge.style.transform = `translate3d(${offsetX.toFixed(2)}px, ${offsetY.toFixed(2)}px, 0) rotate(${angle.toFixed(2)}deg)`;

      if (hasStrap) {
        const sceneRect = scene.getBoundingClientRect();
        let holeX = badge.offsetLeft + holeOriginX + offsetX;
        let holeY = badge.offsetTop + holeOriginY + offsetY;

        if (hole instanceof HTMLElement) {
          const holeRect = hole.getBoundingClientRect();
          holeX = holeRect.left + holeRect.width * 0.5 - sceneRect.left;
          holeY = holeRect.top + holeRect.height * 0.5 - sceneRect.top;
        }

        const dx = holeX - strapAnchorLocalX;
        const dy = holeY - strapAnchorLocalY;
        const strapAngle = (Math.atan2(-dx, dy) * 180) / Math.PI;
        const strapScale = clamp(Math.hypot(dx, dy) / strapNativeLength, 0.55, 2.8);
        strap.style.transform = `rotate(${strapAngle.toFixed(2)}deg) scaleY(${strapScale.toFixed(4)})`;
      }
    };

    const tick = () => {
      frame = null;

      if (!isDragging) {
        targetX = 0;
        targetY = 0;
      }

      const spring = isDragging ? dragSpring : returnSpring;
      velocityX += (targetX - offsetX) * spring;
      velocityY += (targetY - offsetY) * spring;

      velocityX *= isDragging ? linearDampingDrag : linearDampingIdle;
      velocityY *= isDragging ? linearDampingDrag : linearDampingIdle;

      offsetX += velocityX;
      offsetY += velocityY;

      clampOffsets();

      const desiredAngle = clamp(
        offsetX * rotationFromOffset + velocityX * rotationFromVelocity,
        -maxRotation,
        maxRotation
      );
      angularVelocity += (desiredAngle - angle) * angularSpring;
      angularVelocity *= angularDamping;
      angle += angularVelocity;
      angle = clamp(angle, -maxRotation, maxRotation);

      paint();

      const shouldContinue =
        isDragging ||
        Math.abs(offsetX) > settlePos ||
        Math.abs(offsetY) > settlePos ||
        Math.abs(velocityX) > settleVel ||
        Math.abs(velocityY) > settleVel ||
        Math.abs(angle) > settlePos ||
        Math.abs(angularVelocity) > settleVel;

      if (shouldContinue) {
        frame = requestAnimationFrame(tick);
        return;
      }

      offsetX = 0;
      offsetY = 0;
      velocityX = 0;
      velocityY = 0;
      angle = 0;
      angularVelocity = 0;
      paint();
    };

    const ensureTick = () => {
      if (frame !== null) return;
      frame = requestAnimationFrame(tick);
    };

    const startDrag = (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      if (event.target instanceof Element && event.target.closest(interactiveSelector)) return;

      measureGeometry();
      isDragging = true;
      activePointerId = event.pointerId;
      const pointer = toSceneLocalPointer(event);
      const baseCenter = getBadgeBaseCenter();

      grabOffsetX = pointer.x - (baseCenter.x + offsetX);
      grabOffsetY = pointer.y - (baseCenter.y + offsetY);

      targetX = clamp(pointer.x - grabOffsetX - baseCenter.x, -maxOffsetX, maxOffsetX);
      targetY = clamp(pointer.y - grabOffsetY - baseCenter.y, -maxOffsetY, maxOffsetY);

      try {
        badge.setPointerCapture(activePointerId);
      } catch (_error) {
        // Ignore: pointer capture can fail on unsupported browser paths.
      }

      ensureTick();
      event.preventDefault();
    };

    const moveDrag = (event) => {
      if (!isDragging || event.pointerId !== activePointerId) return;

      const pointer = toSceneLocalPointer(event);
      const baseCenter = getBadgeBaseCenter();
      const prevTargetX = targetX;
      const prevTargetY = targetY;

      targetX = clamp(pointer.x - grabOffsetX - baseCenter.x, -maxOffsetX, maxOffsetX);
      targetY = clamp(pointer.y - grabOffsetY - baseCenter.y, -maxOffsetY, maxOffsetY);
      velocityX += (targetX - prevTargetX) * throwGain;
      velocityY += (targetY - prevTargetY) * throwGain;
      ensureTick();
    };

    const stopDrag = (pointerId, sourceElement = null) => {
      if (pointerId !== activePointerId) return;

      isDragging = false;
      targetX = 0;
      targetY = 0;

      try {
        if (sourceElement instanceof Element && sourceElement.hasPointerCapture(pointerId)) {
          sourceElement.releasePointerCapture(pointerId);
        } else if (badge.hasPointerCapture(pointerId)) {
          badge.releasePointerCapture(pointerId);
        }
      } catch (_error) {
        // Ignore: capture state may already be released.
      }
      activePointerId = null;
      ensureTick();
    };

    const playIntroDrop = () => {
      if (isDragging) return;
      offsetX = introDropOffsetX;
      targetX = 0;
      velocityX = introDropKickX;
      angle = 0;
      angularVelocity = 0;

      offsetY = introDropOffsetY;
      targetY = 0;
      velocityY = introDropKickY;
      paint();
      ensureTick();
    };

    badge.addEventListener("pointerdown", startDrag);
    window.addEventListener("pointermove", moveDrag, { passive: true });
    window.addEventListener("pointerup", (event) => {
      stopDrag(event.pointerId, event.target);
    });
    window.addEventListener("pointercancel", (event) => {
      stopDrag(event.pointerId, event.target);
    });
    badge.addEventListener("lostpointercapture", () => {
      if (!isDragging) return;
      isDragging = false;
      activePointerId = null;
      targetX = 0;
      targetY = 0;
      ensureTick();
    });

    measureGeometry();
    paint();
    window.addEventListener("resize", () => {
      measureGeometry();
      paint();
    });

    if (typeof IntersectionObserver === "undefined") {
      playIntroDrop();
      return;
    }

    const introObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target !== scene) return;

          if (!entry.isIntersecting) {
            hasPlayedIntroForView = false;
            return;
          }

          if (hasPlayedIntroForView) return;
          hasPlayedIntroForView = true;
          playIntroDrop();
        });
      },
      { threshold: introObserverThreshold }
    );

    introObserver.observe(scene);
  });
}
