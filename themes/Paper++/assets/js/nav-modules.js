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

  // GitHub activity module (client-side)
  // Appends a `.nav-module-message` element to `#nav-message-rotator` with
  // a short summary of the user's most recent public GitHub event.
  // Configuration is attempted from the rotator button dataset (see guesses below)
  // and falls back to `window.siteParams.navModule.github` if present.
  window.githubModule = (function () {
    const STORAGE_KEY_PREFIX = "navGithubActivity:";

    const createMessageElement = (label, text, href, timeText) => {
      const button = document.getElementById("nav-message-rotator");
      if (!button) return null;
      const span = document.createElement("span");
      span.className = "nav-module-message";
      if (label) span.dataset.label = label;
      span.setAttribute("aria-hidden", "true");
      // visible label element (matches theme markup)
      if (label) {
        const labelSpan = document.createElement("span");
        labelSpan.className = "nav-module-label";
        labelSpan.textContent = label;
        span.appendChild(labelSpan);
      }
      const textSpan = document.createElement("span");
      textSpan.className = "nav-module-text";
      if (href) {
        const a = document.createElement("a");
        a.href = href;
        a.rel = "noopener noreferrer";
        a.textContent = text;
        textSpan.appendChild(a);
      } else {
        textSpan.textContent = text;
      }
      span.appendChild(textSpan);
      // optional relative time element
      if (timeText) {
        const timeSpan = document.createElement("span");
        timeSpan.className = "nav-module-time";
        timeSpan.textContent = timeText;
        span.appendChild(timeSpan);
      }
      button.appendChild(span);
      return span;
    };

    const timeAgo = (iso) => {
      if (!iso) return null;
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return null;
      const s = Math.floor((Date.now() - d.getTime()) / 1000);
      if (s < 5) return 'just now';
      if (s < 60) return `${s}s ago`;
      const m = Math.floor(s / 60);
      if (m < 60) return `${m}m ago`;
      const h = Math.floor(m / 60);
      if (h < 24) return `${h}h ago`;
      const days = Math.floor(h / 24);
      if (days < 30) return `${days}d ago`;
      const months = Math.floor(days / 30);
      if (months < 12) return `${months}mo ago`;
      const years = Math.floor(months / 12);
      return `${years}y ago`;
    };

    const guessConfigFromButton = (button) => {
      const ds = button?.dataset || {};
      return {
        enabled: ds.githubEnabled === "true" || ds.navGithubEnabled === "true" || false,
        username: ds.githubUsername || ds.navGithubUsername || ds.navGithubUser || ds.navModuleGithubUsername || null,
        eventsLimit: Number.parseInt(ds.githubEventsLimit || ds.navGithubEventsLimit || ds.githubLimit || "", 10) || 3,
        cacheTTLMinutes: Number.parseInt(ds.githubCacheTtl || ds.navGithubCacheTtl || "", 10) || 15,
        label: typeof ds.githubLabel === "string" && ds.githubLabel.trim().length > 0 ? ds.githubLabel.trim() : null
      };
    };

    const fetchEvents = async (username, limit) => {
      const url = `https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=${limit}`;
      const res = await fetch(url, { headers: { Accept: "application/vnd.github.v3+json" } });
      if (!res.ok) throw new Error(`GitHub API error ${res.status}`);
      return res.json();
    };

    const formatEvent = (ev) => {
      try {
        const type = ev.type;
        const repo = ev.repo?.name || "";
        if (type === "PushEvent") {
          const commits = Number.isFinite(ev.payload?.size) ? ev.payload.size : (ev.payload?.commits?.length ?? null);
          if (Number.isFinite(commits) && commits > 0) {
            return `pushed to ${repo} (${commits} commit${commits === 1 ? "" : "s"})`;
          }
          return `pushed to ${repo}`;
        }
        if (type === "PullRequestEvent") {
          const action = ev.payload?.action || "updated";
          return `${action} PR in ${repo}`;
        }
        if (type === "IssuesEvent") {
          const action = ev.payload?.action || "updated";
          return `${action} issue in ${repo}`;
        }
        if (type === "CreateEvent") return `created ${ev.payload?.ref_type || "content"} in ${repo}`;
        if (type === "WatchEvent") return `starred ${repo}`;
        if (type === "ForkEvent") return `forked ${repo}`;
        return `${type} in ${repo}`;
      } catch (e) {
        return "GitHub activity";
      }
    };

    const initializeGithubMessage = async () => {
      if (typeof document === "undefined") return;
      const button = document.getElementById("nav-message-rotator");
      if (!button) return;
      const cfg = guessConfigFromButton(button);
      // fallback to global site params if present (themes sometimes expose these)
      if ((!cfg.username || cfg.enabled === false) && window?.siteParams?.navModule?.github) {
        const g = window.siteParams.navModule.github;
        cfg.enabled = g.enabled === true;
        cfg.username = cfg.username || g.username || null;
        cfg.eventsLimit = cfg.eventsLimit || g.eventsLimit || 3;
        cfg.cacheTTLMinutes = cfg.cacheTTLMinutes || g.cacheTTLMinutes || 15;
        cfg.label = cfg.label || (typeof g.label === "string" && g.label.trim().length > 0 ? g.label.trim() : null);
      }

      // default label
      if (!cfg.label) cfg.label = "GitHub:";

      if (!cfg.enabled || !cfg.username) return;

      const storage = getLocalStorage();
      const key = `${STORAGE_KEY_PREFIX}${cfg.username}`;
      if (storage) {
        try {
          const raw = storage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.fetchedAt && (Date.now() - parsed.fetchedAt) < (cfg.cacheTTLMinutes || 15) * 60 * 1000 && Array.isArray(parsed.events)) {
              const ev = parsed.events[0];
              const text = formatEvent(ev);
              const when = timeAgo(ev.created_at);
              createMessageElement(cfg.label, text, `https://github.com/${cfg.username}`, when);
              return;
            }
          }
        } catch (e) { /* ignore cache parse errors */ }
      }

      const placeholder = createMessageElement(cfg.label, "Loading GitHub…", `https://github.com/${cfg.username}`);
      try {
        const events = await fetchEvents(cfg.username, cfg.eventsLimit || 3);
        if (!events || !events.length) {
          if (placeholder) placeholder.querySelector('.nav-module-text').textContent = 'No recent GitHub activity';
          return;
        }
        const ev = events[0];
        const text = formatEvent(ev);
        const when = timeAgo(ev.created_at);
        if (placeholder) {
          const t = placeholder.querySelector('.nav-module-text');
          t.textContent = text;
          const timeEl = placeholder.querySelector('.nav-module-time');
          if (timeEl) timeEl.textContent = when || '';
          else if (when) {
            const ts = document.createElement('span');
            ts.className = 'nav-module-time';
            ts.textContent = when;
            placeholder.appendChild(ts);
          }
        }
        if (storage) {
          try {
            storage.setItem(key, JSON.stringify({ fetchedAt: Date.now(), events }));
          } catch (e) { /* ignore write errors */ }
        }
      } catch (err) {
        if (placeholder) placeholder.querySelector('.nav-module-text').textContent = 'GitHub unavailable';
        console.warn('nav github module fetch failed', err);
      }
    };

    return { initializeGithubMessage };
  })();

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
  }
})();
