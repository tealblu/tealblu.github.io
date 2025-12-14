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

const VANTA_STORAGE_KEY = "vantaAnimationIndex";

const getLocalStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch (error) {
    console.warn("Vanta localStorage access failed", error);
  }

  return null;
};

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
      waveSpeed: 0.25,
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
  if (typeof window === "undefined" || !window.VANTA) {
    return [];
  }

  return VANTA_ANIMATIONS.filter((animation) => {
    try {
      return typeof animation.isSupported === "function" ? animation.isSupported() : true;
    } catch (error) {
      console.warn("Vanta animation support check failed", animation.key, error);
      return false;
    }
  });
};

const initializeVanta = (options = {}) => {
  if (typeof document === "undefined") {
    return false;
  }

  const target = document.querySelector("#top");
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

  if (typeof window === "undefined" || !window.VANTA) {
    return false;
  }

  const animations = getAvailableAnimations();
  if (!animations.length) {
    return false;
  }

  const state = getVantaState();
  const requestedIndex = typeof options.animationIndex === "number" ? options.animationIndex : state.currentIndex;
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


document.addEventListener("DOMContentLoaded", () => {
  const initialized = initializeVanta();
  bindVantaToThemeToggle();
  bindRotationToChangeAnimation();

  if (!initialized && typeof window !== "undefined") {
    window.addEventListener("load", () => initializeVanta({ force: true }), { once: true });
  }
});
