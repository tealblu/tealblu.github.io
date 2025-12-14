(() => {
  const NAV_ROTATOR_STORAGE_KEY = "navMessageRotatorState";

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

  const readStoredNavRotatorState = () => {
    const storage = getLocalStorage();
    if (!storage) {
      return null;
    }

    try {
      const rawValue = storage.getItem(NAV_ROTATOR_STORAGE_KEY);
      if (!rawValue) {
        return null;
      }

      const parsed = JSON.parse(rawValue);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (error) {
      console.warn("Nav modules: nav rotator state read failed", error);
    }

    return null;
  };

  const persistNavRotatorState = (state) => {
    const storage = getLocalStorage();
    if (!storage) {
      return;
    }

    const toNumeric = (value) => {
      if (!Number.isFinite(value)) {
        return null;
      }

      return Number(value);
    };

    const payload = {
      activeIndex: toNumeric(state?.activeIndex),
      lastRotationAt: toNumeric(state?.lastRotationAt),
      nextRotationDueAt: toNumeric(state?.nextRotationDueAt),
      rotationInterval: toNumeric(state?.rotationInterval),
      autoRotateEnabled: state?.autoRotateEnabled === true
    };

    try {
      storage.setItem(NAV_ROTATOR_STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn("Nav modules: nav rotator state persist failed", error);
    }
  };

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

    const storedState = readStoredNavRotatorState();
    if (storedState && Number.isFinite(storedState.activeIndex)) {
      const normalizedIndex = Math.max(0, Math.min(messages.length - 1, Math.trunc(storedState.activeIndex)));
      activeIndex = normalizedIndex;
    }

    let lastRotationAt = storedState && Number.isFinite(storedState.lastRotationAt)
      ? Number(storedState.lastRotationAt)
      : null;
    let nextRotationDueAt = storedState && Number.isFinite(storedState.nextRotationDueAt)
      ? Number(storedState.nextRotationDueAt)
      : null;
    const storedInterval = storedState && Number.isFinite(storedState.rotationInterval)
      ? Number(storedState.rotationInterval)
      : null;

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
      persistNavRotatorState({
        activeIndex,
        lastRotationAt,
        nextRotationDueAt,
        rotationInterval: hasInterval ? intervalValue : null,
        autoRotateEnabled
      });
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
    persistState();
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
      persistState();
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
      persistState();
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
      persistState();
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
          persistState();
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
    } else {
      persistState();
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
    initializeNavMessageRotator();
  };

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", initializeNavModules);
  }
})();
