import { getLocalStorage, getThemeColor, isMobileDevice } from "./nav-modules.js";

const VANTA_STORAGE_KEY = "vantaAnimationIndex";

const readStoredAnimationIndex = () => {
  const storage = getLocalStorage();
  if (!storage) {
    return null;
  }

  try {
    const rawValue = storage.getItem(VANTA_STORAGE_KEY);
    if (rawValue === null) {
      return null;
    }

    const parsed = Number.parseInt(rawValue, 10);
    return Number.isNaN(parsed) ? null : parsed;
  } catch (error) {
    console.warn("Vanta animation index read failed", error);
  }

  return null;
};

const persistAnimationIndex = (index) => {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }

  try {
    storage.setItem(VANTA_STORAGE_KEY, String(index));
  } catch (error) {
    console.warn("Vanta animation index persist failed", error);
  }
};

// `getThemeColor` and `isMobileDevice` are imported from `nav-modules.js`.

const VANTA_ANIMATIONS = [
  {
    key: "birds",
    label: "Birds",
    isSupported: () => Boolean(window?.VANTA?.BIRDS),
    createEffect: (target, colors) => window.VANTA.BIRDS({
      el: target,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200,
      minWidth: 200,
      scale: 1,
      scaleMobile: 3,
      birdSize: 2,
      color1: colors.primary,
      color2: colors.secondary,
      backgroundColor: colors.background,
      colorMode: "lerp",
      wingSpan: 40,
      speedLimit: 3,
      cohesion: 20,
      quantity: 2
    })
  },
  {
    key: "waves",
    label: "Waves",
    isSupported: () => Boolean(window?.VANTA?.WAVES),
    createEffect: (target, colors) => window.VANTA.WAVES({
      el: target,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200,
      minWidth: 200,
      scale: 1,
      scaleMobile: 3,
      shininess: 50,
      waveHeight: 50,
      waveSpeed: 0.1,
      zoom: 1,
      color: colors.background,
      backgroundColor: colors.primary
    })
  },
  {
    key: "fog",
    label: "Fog",
    isSupported: () => Boolean(window?.VANTA?.FOG),
    createEffect: (target, colors) => window.VANTA.FOG({
      el: target,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200,
      minWidth: 200,
      highlightColor: colors.primary,
      midtoneColor: colors.secondary,
      lowlightColor: colors.background,
      baseColor: colors.background,
      blurFactor: 1,
      speed: 2,
      zoom: 2.2
    })
  },
/**
  {
    key: "cells",
    label: "Cells",
    isSupported: () => Boolean(window?.VANTA?.CELLS),
    createEffect: (target, colors) => window.VANTA.CELLS({
      el: target,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200,
      minWidth: 200,
      scale: 1,
      scaleMobile: 3,
      color1: colors.theme,
      color2: colors.background,
      backgroundColor: colors.theme,
      size: 2,
      speed: 1
    })
  },
*/
  {
    key: "net",
    label: "Net",
    isSupported: () => Boolean(window?.VANTA?.NET),
    createEffect: (target, colors) => window.VANTA.NET({
      el: target,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200,
      minWidth: 200,
      scale: 1,
      scaleMobile: 3,
      color: colors.primary,
      backgroundColor: colors.background,
      maxDistance: 25,
      spacing: 15
    })
  },
  {
    key: "rings",
    label: "Rings",
    isSupported: () => Boolean(window?.VANTA?.RINGS),
    createEffect: (target, colors) => window.VANTA.RINGS({
      el: target,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200,
      minWidth: 200,
      scale: 1,
      scaleMobile: 3,
      backgroundColor: colors.theme,
      color: colors.secondary,
      backgroundAlpha: 0.5
    })
  },
  {
    key: "halo",
    label: "Halo",
    isSupported: () => Boolean(window?.VANTA?.HALO),
    createEffect: (target, colors) => window.VANTA.HALO({
      el: target,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200,
      minWidth: 200,
      baseColor: colors.secondary,
      backgroundColor: colors.theme,
      amplitudeFactor: 2,
      xOffset: 0.00,
      yOffset: 0.00,
      size: 1.25
    })
  }
  ,
  {
    key: "blank",
    label: "Blank",
    isSupported: () => true,
    createEffect: (target /*, colors */) => {
      // A no-op "animation" that satisfies the same lifecycle as Vanta effects.
      const effect = {
        // No rendering to start; provide destroy/pause/resume for compatibility.
        destroy() {},
        pause() {},
        resume() {}
      };
      // Attach to target for parity with other effects
      try {
        target.__vantaEffect = effect;
      } catch (e) {
        // ignore
      }
      return effect;
    }
  }
];

const getVantaState = () => {
  if (typeof window === "undefined") {
    return { currentIndex: 0 };
  }

  if (!window.__vantaState) {
    const storedIndex = readStoredAnimationIndex();
    window.__vantaState = {
      currentIndex: typeof storedIndex === "number" ? storedIndex : 0
    };
  }

  return window.__vantaState;
};

const getAvailableAnimations = () => {
  if (typeof window === "undefined") {
    return [];
  }

  const available = VANTA_ANIMATIONS.filter((animation) => {
    try {
      return typeof animation.isSupported === "function" ? animation.isSupported() : true;
    } catch (error) {
      console.warn("Vanta animation support check failed", animation.key, error);
      return false;
    }
  });

  // On mobile, prefer the blank animation first so we load a lightweight placeholder by default.
  try {
    if (isMobileDevice()) {
      const idx = available.findIndex((a) => a.key === "blank");
      if (idx > 0) {
        available.unshift(available.splice(idx, 1)[0]);
      }
    }
  } catch (e) {
    // ignore any detection errors and return the filtered list
  }

  return available;
};

const initializeVanta = (options = {}) => {
  if (typeof document === "undefined") {
    return false;
  }

  // Prefer a persistent Vanta root that lives outside content swaps so the
  // animation can survive navigation. Fall back to `#top` for compatibility.
  const target = document.querySelector("#vanta-root") || document.querySelector("#top");
  if (!target) {
    return false;
  }

  const force = options.force === true;
  const existingEffect = target.__vantaEffect;

  if (existingEffect) {
    if (!force) {
      return true;
    }

    if (typeof existingEffect.destroy === "function") {
      existingEffect.destroy();
    }

    target.__vantaEffect = null;
  }

  // Do not require window.VANTA here — the available animations list will include
  // a no-op `blank` animation even when the Vanta CDN isn't loaded.

  const animations = getAvailableAnimations();
  if (!animations.length) {
    return false;
  }

  const state = getVantaState();
  // Prefer any explicit request, then any stored user choice, then on mobile
  // default to the `blank` animation if present, otherwise fall back to state.
  const storedIndex = readStoredAnimationIndex();
  let requestedIndex;
  if (typeof options.animationIndex === "number") {
    requestedIndex = options.animationIndex;
  } else if (typeof storedIndex === "number") {
    requestedIndex = storedIndex;
  } else if (isMobileDevice()) {
    const blankIdx = animations.findIndex((a) => a.key === "blank");
    requestedIndex = blankIdx >= 0 ? blankIdx : 0;
  } else {
    requestedIndex = state.currentIndex;
  }
  const index = ((requestedIndex % animations.length) + animations.length) % animations.length;
  const animation = animations[index];

  const themeColor = getThemeColor("--theme") ?? 0x6e8096;

  const colors = {
    primary: getThemeColor("--primary") ?? 0x642c2c,
    secondary: getThemeColor("--secondary") ?? 0x5b8a98,
    background: themeColor,
    theme: themeColor
  };

  // Requires VANTA and THREE from their respective CDN scripts loaded before this runs.
  try {
    const effect = animation.createEffect(target, colors);
    if (!effect) {
      throw new Error("Vanta returned an empty effect instance");
    }

    target.__vantaEffect = effect;
    state.currentIndex = index;
    persistAnimationIndex(index);
    return true;
  } catch (error) {
    console.error("Failed to initialize Vanta animation", animation.key, error);
  }

  return false;
};

const cycleVantaAnimation = () => {
  if (typeof window === "undefined") {
    return;
  }

  const animations = getAvailableAnimations();
  if (!animations.length) {
    return;
  }

  const state = getVantaState();
  const nextIndex = (state.currentIndex + 1) % animations.length;
  const initialized = initializeVanta({ force: true, animationIndex: nextIndex });

  if (!initialized) {
    console.warn("Vanta animation cycle failed", animations[nextIndex]?.key);
  }
};

const bindVantaToThemeToggle = () => {
  if (typeof document === "undefined") {
    return;
  }
  // Allow theme toggle to trigger Vanta reloads on all devices (mobile will
  // receive the lightweight `blank` animation by default).

  const toggle = document.getElementById("theme-toggle");
  if (!toggle || toggle.__vantaReloadAttached) {
    return;
  }

  const scheduleReload = () => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        initializeVanta({ force: true });
      });
    });
  };

  toggle.addEventListener("click", scheduleReload);
  toggle.__vantaReloadAttached = true;
};

const bindRotationToChangeAnimation = () => {
  if (typeof document === "undefined") {
    return;
  }

  const button = document.getElementById("change-animation");
  if (!button || button.__rotationHandlerAttached) {
    return;
  }

  const duration = 400;

  const triggerRotation = () => {
    if (typeof button.animate === "function") {
      button.animate(
        [
          { transform: "rotate(0deg)" },
          { transform: "rotate(360deg)" }
        ],
        {
          duration,
          easing: "ease-in-out"
        }
      );
      return;
    }

    button.classList.remove("is-rotating");
    void button.offsetWidth;
    button.classList.add("is-rotating");

    window.setTimeout(() => {
      button.classList.remove("is-rotating");
    }, duration);
  };

  button.addEventListener("click", () => {
    triggerRotation();
    window.requestAnimationFrame(() => {
      cycleVantaAnimation();
      if (typeof button.blur === "function") {
        button.blur();
      }
    });
  });
  button.__rotationHandlerAttached = true;
};


const initializeForCurrentPage = () => {
  bindVantaToThemeToggle();
  bindRotationToChangeAnimation();

  // Attempt to initialize the Vanta background immediately. On mobile this
  // will choose the lightweight `blank` animation first.
  const initialized = initializeVanta();
  if (!initialized && typeof window !== "undefined") {
    window.addEventListener("load", () => initializeVanta({ force: true }), { once: true });
  }
};

// Initialize on first load and on Turbo navigation events so the persistent
// `#vanta-root` is preserved across page changes.
document.addEventListener("DOMContentLoaded", initializeForCurrentPage);
document.addEventListener("turbo:load", initializeForCurrentPage);

// When Turbo caches the page, pause the Vanta effect to avoid WebGL/context
// issues; resume after render.
document.addEventListener("turbo:before-cache", () => {
  try {
    const target = document.querySelector("#vanta-root");
    if (target && target.__vantaEffect && typeof target.__vantaEffect.pause === "function") {
      target.__vantaEffect.pause();
    }
  } catch (e) {
    // ignore
  }
});

document.addEventListener("turbo:render", () => {
  try {
    const target = document.querySelector("#vanta-root");
    if (target && target.__vantaEffect && typeof target.__vantaEffect.resume === "function") {
      target.__vantaEffect.resume();
    }
  } catch (e) {
    // ignore
  }
});
