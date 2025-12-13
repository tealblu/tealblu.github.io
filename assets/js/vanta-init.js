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

const initializeVanta = (options = {}) => {
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

  if (typeof window === "undefined" || !window.VANTA || !window.VANTA.BIRDS) {
    return false;
  }

  const colorPrimary = getThemeColor("--primary") ?? 0x642c2c;
  const colorSecondary = getThemeColor("--secondary") ?? 0x5b8a98;
  const colorBackground = getThemeColor("--theme") ?? 0x6e8096;

  // Requires VANTA and THREE from their respective CDN scripts loaded before this runs.
  target.__vantaEffect = window.VANTA.BIRDS({
    el: target,
    mouseControls: true,
    touchControls: true,
    gyroControls: true,
    minHeight: 200,
    minWidth: 200,
    scale: 1,
    scaleMobile: 1,
    color1: colorPrimary,
    color2: colorSecondary,
    backgroundColor: colorBackground,
    colorMode: "lerp",
    wingSpan: 40,
    speedLimit: 3,
    cohesion: 20,
    quantity: 2
  });

  return true;
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

document.addEventListener("DOMContentLoaded", () => {
  const initialized = initializeVanta();
  bindVantaToThemeToggle();

  if (!initialized && typeof window !== "undefined") {
    window.addEventListener("load", () => initializeVanta({ force: true }), { once: true });
  }
});
