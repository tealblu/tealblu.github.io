(() => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const classes = {
    base: "page-transition",
    ready: "page-transition-ready",
    exit: "page-transition-exit",
    disabled: "page-transition-disabled"
  };

  const getRoot = () => document.documentElement;
  const root = getRoot();

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const parseDuration = () => {
    const value = window.getComputedStyle(root).getPropertyValue("--page-transition-duration").trim();
    if (!value) {
      return 0;
    }

    if (value.endsWith("ms")) {
      return Number.parseFloat(value.slice(0, -2)) || 0;
    }

    if (value.endsWith("s")) {
      const seconds = Number.parseFloat(value.slice(0, -1));
      return Number.isFinite(seconds) ? seconds * 1000 : 0;
    }

    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const disableTransitions = () => {
    root.classList.remove(classes.base, classes.ready, classes.exit);
    root.classList.add(classes.disabled);
  };

  const applyEnteringState = () => {
    if (!root.classList.contains(classes.base)) {
      root.classList.add(classes.base);
    }

    root.classList.remove(classes.disabled, classes.exit);

    window.requestAnimationFrame(() => {
      root.classList.add(classes.ready);
    });
  };

  let transitionDuration = parseDuration();

  const refreshDuration = () => {
    transitionDuration = parseDuration();
  };

  const scheduleEnteringState = () => {
    refreshDuration();
    applyEnteringState();
  };

  const maybeHandleLinkClick = (event) => {
    if (root.classList.contains(classes.disabled)) {
      return;
    }

    if (event.defaultPrevented || event.button !== 0) {
      return;
    }

    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const anchor = event.target.closest("a");
    if (!anchor) {
      return;
    }

    if (anchor.hasAttribute("download")) {
      return;
    }

    if (anchor.target && anchor.target.toLowerCase() !== "_self") {
      return;
    }

    if (anchor.dataset.noTransition === "true") {
      return;
    }

    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("#")) {
      return;
    }

    let url;
    try {
      url = new URL(anchor.href, window.location.href);
    } catch (error) {
      return;
    }

    if (!/^https?:$/i.test(url.protocol)) {
      return;
    }

    if (url.origin !== window.location.origin) {
      return;
    }

    const current = window.location;
    if (url.pathname === current.pathname && url.search === current.search && url.hash === current.hash) {
      return;
    }

    if (url.hash && url.pathname === current.pathname && url.search === current.search) {
      return;
    }

    event.preventDefault();

    refreshDuration();

    const navigate = () => {
      window.location.href = url.href;
    };

    window.requestAnimationFrame(() => {
      root.classList.add(classes.exit);
      if (transitionDuration <= 0) {
        navigate();
        return;
      }

      window.setTimeout(navigate, transitionDuration);
    });
  };

  const handlePrefersReducedMotionChange = (event) => {
    if (event.matches) {
      disableTransitions();
    } else {
      scheduleEnteringState();
    }
  };

  document.addEventListener("click", maybeHandleLinkClick, { capture: true });

  const initialize = () => {
    if (prefersReducedMotion.matches) {
      disableTransitions();
      return;
    }

    scheduleEnteringState();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }

  window.addEventListener("pageshow", () => {
    initialize();
  });

  if (typeof prefersReducedMotion.addEventListener === "function") {
    prefersReducedMotion.addEventListener("change", handlePrefersReducedMotionChange);
  } else if (typeof prefersReducedMotion.addListener === "function") {
    prefersReducedMotion.addListener(handlePrefersReducedMotionChange);
  }
})();
