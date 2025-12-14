// Generic utilities shared across nav modules and other UI modules.
const getLocalStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch (error) {
    console.warn("Nav modules localStorage access failed", error);
  }

  return null;
};

const cssColorToInt = (colorValue) => {
  if (!colorValue) {
    return null;
  }

  const value = colorValue.trim().toLowerCase();

  if (value.startsWith("#")) {
    const hex = value.slice(1);
    const normalized = hex.length === 3
      ? hex.split("").map((char) => `${char}${char}`).join("")
      : hex;

    const parsed = Number.parseInt(normalized, 16);
    return Number.isNaN(parsed) ? null : parsed;
  }

  const rgbMatch = value.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch.map(Number);
    return (r << 16) + (g << 8) + b;
  }

  return null;
};

const getThemeColor = (variableName) => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }

  const elements = [document.body, document.documentElement].filter(Boolean);

  for (const element of elements) {
    const value = cssColorToInt(window.getComputedStyle(element).getPropertyValue(variableName));
    if (value !== null) {
      return value;
    }
  }

  return null;
};

const isMobileDevice = () => {
  if (typeof window === "undefined") return false;
  try {
    if (window.matchMedia && window.matchMedia('(pointer: coarse) and (hover: none)').matches) return true;
    if ('ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0)) return true;
    return window.innerWidth <= 768;
  } catch (e) {
    return false;
  }
};

(function () {

  // Note: persistent storage for nav rotator state removed — rotator state
  // is now ephemeral and lives only in-memory on the permanent navbar element.

  const initializeNavMessageRotator = () => {
    if (typeof document === "undefined") {
      return;
    }

    const button = document.getElementById("nav-message-rotator");
    if (!button || button.__navMessageRotatorAttached) {
      return;
    }

    const messages = Array.from(button.querySelectorAll(".nav-module-message"));
    if (!messages.length) {
      return;
    }

    let activeIndex = messages.findIndex((message) => message.classList.contains("is-active"));
    if (activeIndex < 0) {
      activeIndex = 0;
    }

    // No persisted state — initialize rotation bookkeeping fresh per page load.
    let lastRotationAt = null;
    let nextRotationDueAt = null;
    const storedInterval = null;

    // Overflow measurement + marquee helpers
    const clearOverflowState = (message) => {
      if (!message) return;
      message.classList.remove("is-overflowing");
      const textElement = message.querySelector(".nav-module-text");
      if (!textElement) return;

      // restore original content if we replaced it with a track
      if (message.dataset.navOriginalHtml) {
        textElement.innerHTML = message.dataset.navOriginalHtml;
        delete message.dataset.navOriginalHtml;
      }

      const track = textElement.querySelector(".nav-module-track");
      if (track) {
        track.style.removeProperty("--nav-scroll-distance");
        track.style.removeProperty("--nav-scroll-duration");
      }
    };

    let overflowFrameId = null;

    const applyOverflowState = () => {
      overflowFrameId = null;
      const activeMessage = messages[activeIndex];
      messages.forEach((m, i) => { if (i !== activeIndex) clearOverflowState(m); });
      if (!activeMessage) return;
      const textElement = activeMessage.querySelector(".nav-module-text");
      if (!textElement) { clearOverflowState(activeMessage); return; }

      const availableWidth = activeMessage.clientWidth;
      const originalContentWidth = textElement.scrollWidth;
      const prefersReduced = (typeof window !== "undefined" && typeof window.matchMedia === "function")
        ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
        : false;

      // If content fits, don't animate
      if (!Number.isFinite(availableWidth) || availableWidth <= 0 || originalContentWidth <= availableWidth || prefersReduced) {
        clearOverflowState(activeMessage);
        return;
      }

      // create a seamless track if not present
      let track = textElement.querySelector(".nav-module-track");
      if (!track) {
        // save original inner HTML so we can restore later
        activeMessage.dataset.navOriginalHtml = textElement.innerHTML;
        const originalHtml = textElement.innerHTML;
        textElement.innerHTML = "";
        track = document.createElement("span");
        track.className = "nav-module-track";
        const itemA = document.createElement("span");
        itemA.className = "nav-module-track-item";
        itemA.innerHTML = originalHtml;
        const itemB = itemA.cloneNode(true);
        track.appendChild(itemA);
        track.appendChild(itemB);
        textElement.appendChild(track);
      }

      // measure single-item width (first child)
      const singleWidth = track.firstElementChild ? track.firstElementChild.scrollWidth : originalContentWidth;
      const trailingGap = 32; // must match CSS margin-inline-end on .nav-module-track-item
      const scrollDistance = Math.max(0, Math.round(singleWidth + trailingGap));

      const durationMs = Math.max(6000, Math.min(20000, Math.round((singleWidth / 40) * 1000)));
      activeMessage.classList.add("is-overflowing");
      track.style.setProperty("--nav-scroll-distance", `${scrollDistance}px`);
      track.style.setProperty("--nav-scroll-duration", `${durationMs}ms`);
    };

    const scheduleOverflowMeasurement = () => {
      if (typeof window === "undefined") return;
      if (overflowFrameId !== null) window.cancelAnimationFrame(overflowFrameId);
      overflowFrameId = window.requestAnimationFrame(applyOverflowState);
    };

    const updateActiveMessage = (nextIndex, options = {}) => {
      const normalizedIndex = ((Number(nextIndex) % messages.length) + messages.length) % messages.length;

      messages.forEach((message, messageIndex) => {
        const isActive = messageIndex === normalizedIndex;
        message.classList.toggle("is-active", isActive);
        message.setAttribute("aria-hidden", isActive ? "false" : "true");
        if (isActive) {
          button.dataset.activeIndex = String(messageIndex);
          const label = typeof message.dataset.label === "string" ? message.dataset.label : "";
          const textContent = (message.textContent || "").trim();
          if (label) {
            button.title = label;
          } else if (textContent) {
            button.title = textContent;
          } else {
            button.removeAttribute("title");
          }
        }
      });

      activeIndex = normalizedIndex;
      const rotationAt = Number.isFinite(options?.rotationAt) ? Number(options.rotationAt) : Date.now();
      lastRotationAt = rotationAt;
      // measure if active message overflows and enable marquee if needed
      scheduleOverflowMeasurement();
    };

    let intervalValue = Number.parseInt(button.dataset.rotationInterval || "", 10);
    if (!Number.isFinite(intervalValue) || intervalValue <= 0) {
      intervalValue = Number.isFinite(storedInterval) && storedInterval > 0 ? Math.trunc(storedInterval) : NaN;
    }
    const prefersReducedMotion = typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;

    const hasInterval = Number.isFinite(intervalValue) && intervalValue > 0;
    if (hasInterval) {
      intervalValue = Math.max(1, Math.trunc(intervalValue));
    }

    let autoRotateEnabled = hasInterval && !(prefersReducedMotion && prefersReducedMotion.matches);
    let rotationTimer = null;

    const persistState = () => {
      // intentionally no-op: persistent storage has been removed
    };

    const now = Date.now();
    let rotationDelayOverride = null;

    if (autoRotateEnabled && hasInterval) {
      if (Number.isFinite(nextRotationDueAt)) {
        let targetDue = nextRotationDueAt;
        let projectedIndex = activeIndex;
        while (targetDue <= now) {
          targetDue += intervalValue;
          projectedIndex = (projectedIndex + 1) % messages.length;
        }

        nextRotationDueAt = targetDue;
        lastRotationAt = targetDue - intervalValue;
        activeIndex = projectedIndex;
        rotationDelayOverride = targetDue - now;
      } else if (Number.isFinite(lastRotationAt)) {
        const elapsed = Math.max(0, now - lastRotationAt);
        if (elapsed >= intervalValue) {
          const intervalsPassed = Math.floor(elapsed / intervalValue);
          if (intervalsPassed > 0) {
            activeIndex = (activeIndex + intervalsPassed) % messages.length;
            lastRotationAt += intervalsPassed * intervalValue;
          }
        }

        const timeIntoInterval = Math.max(0, now - lastRotationAt);
        const remaining = intervalValue - timeIntoInterval;
        rotationDelayOverride = remaining > 0 ? remaining : intervalValue;
        nextRotationDueAt = now + rotationDelayOverride;
      } else {
        lastRotationAt = now;
        rotationDelayOverride = intervalValue;
        nextRotationDueAt = now + intervalValue;
      }
    } else {
      nextRotationDueAt = null;
    }

    const initialRotationAt = Number.isFinite(lastRotationAt) ? Number(lastRotationAt) : Date.now();
    updateActiveMessage(activeIndex, { rotationAt: initialRotationAt });
    scheduleOverflowMeasurement();

    const clearRotationTimer = () => {
      if (rotationTimer !== null) {
        window.clearTimeout(rotationTimer);
        rotationTimer = null;
      }
    };

    const rotateToNext = () => {
      const nextIndex = (activeIndex + 1) % messages.length;
      updateActiveMessage(nextIndex);
      nextRotationDueAt = null;
    };

    const scheduleRotation = (delayOverride) => {
      if (!autoRotateEnabled) {
        return;
      }

      clearRotationTimer();
      const fallbackDelay = hasInterval ? Math.max(intervalValue, 1000) : 4000;
      const rawDelay = Number.isFinite(delayOverride) ? Number(delayOverride) : fallbackDelay;
      const delay = Math.max(rawDelay, 100);
      nextRotationDueAt = Date.now() + delay;
      rotationTimer = window.setTimeout(() => {
        rotateToNext();
        scheduleRotation();
      }, delay);
    };

    const pauseRotation = () => {
      if (!autoRotateEnabled) {
        return;
      }

      clearRotationTimer();
      nextRotationDueAt = null;
    };

    const resumeRotation = () => {
      if (!autoRotateEnabled) {
        return;
      }

      scheduleRotation();
    };

    button.addEventListener("click", () => {
      rotateToNext();
      if (autoRotateEnabled) {
        scheduleRotation();
      }
    });

    if (prefersReducedMotion && typeof prefersReducedMotion.addEventListener === "function") {
      prefersReducedMotion.addEventListener("change", (event) => {
        autoRotateEnabled = hasInterval && !event.matches;
        if (autoRotateEnabled) {
          scheduleRotation();
        } else {
          clearRotationTimer();
          nextRotationDueAt = null;
        }
        // re-evaluate overflow when user changes reduced-motion preference
        scheduleOverflowMeasurement();
      });
    }

    if (autoRotateEnabled) {
      scheduleRotation(rotationDelayOverride);
      button.addEventListener("mouseenter", pauseRotation);
      button.addEventListener("focus", pauseRotation);
      button.addEventListener("mouseleave", resumeRotation);
      button.addEventListener("blur", resumeRotation);
    }

    if (typeof window !== "undefined") {
      window.addEventListener("resize", scheduleOverflowMeasurement, { passive: true });
    }

    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData" || mutation.type === "childList") {
          scheduleOverflowMeasurement();
          break;
        }
      }
    });

    mutationObserver.observe(button, { childList: true, subtree: true, characterData: true });

    button.__navMessageRotatorAttached = true;
  };

  const safeInvoke = (moduleRef, methodName) => {
    if (!moduleRef || typeof moduleRef[methodName] !== "function") {
      return;
    }

    try {
      moduleRef[methodName]();
    } catch (error) {
      console.warn(`Nav modules: ${methodName} failed`, error);
    }
  };

  

  const initializeNavModules = () => {
    if (typeof document === "undefined") {
      return;
    }

    safeInvoke(window?.coffeeModule, "initializeCoffeeMessage");
    safeInvoke(window?.weatherModule, "initializeWeatherMessage");
    safeInvoke(window?.githubModule, "initializeGithubMessage");
    initializeNavMessageRotator();
  };

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", initializeNavModules);
    // Also initialize on Turbo navigations so handlers reattach after partial page swaps
    if (typeof window !== "undefined" && window.Turbo) {
      document.addEventListener("turbo:load", initializeNavModules);
      document.addEventListener("turbo:render", initializeNavModules);
    } else {
      // If Turbo isn't present yet, still listen for turbo:load in case it's added later
      document.addEventListener("turbo:load", initializeNavModules);
    }
  }
})();

// Export utilities for other modules (ES modules may import these).
try {
  if (typeof window !== "undefined") {
    window.siteUtils = window.siteUtils || {};
    window.siteUtils.getLocalStorage = getLocalStorage;
    window.siteUtils.cssColorToInt = cssColorToInt;
    window.siteUtils.getThemeColor = getThemeColor;
    window.siteUtils.isMobileDevice = isMobileDevice;
  }
} catch (e) {
  // ignore
}

export { cssColorToInt, getLocalStorage, getThemeColor, isMobileDevice };

