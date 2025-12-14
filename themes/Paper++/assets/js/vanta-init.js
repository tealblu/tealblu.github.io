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

const WEATHER_CODE_DESCRIPTIONS = {
  0: "Clear skies",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Heavy drizzle",
  56: "Light freezing drizzle",
  57: "Heavy freezing drizzle",
  61: "Light rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Light snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Light rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Light snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Severe thunderstorm"
};

const resolveWeatherUnits = (rawValue) => {
  const value = typeof rawValue === "string" ? rawValue.trim().toLowerCase() : "";

  if (value === "imperial" || value === "fahrenheit" || value === "f") {
    return { temperatureUnit: "fahrenheit", symbol: "°F" };
  }

  return { temperatureUnit: "celsius", symbol: "°C" };
};

const describeWeatherCode = (code) => {
  if (typeof code !== "number") {
    return "";
  }

  return WEATHER_CODE_DESCRIPTIONS[code] || "";
};

const geocodeWeatherLocation = async (location) => {
  if (!location || typeof fetch !== "function") {
    return null;
  }

  const query = new URLSearchParams({ name: location, count: "1" });
  const url = `https://geocoding-api.open-meteo.com/v1/search?${query.toString()}`;

  try {
    const response = await fetch(url, { method: "GET" });
    if (!response.ok) {
      throw new Error(`Geocoding failed with status ${response.status}`);
    }

    const payload = await response.json();
    const firstMatch = Array.isArray(payload?.results) ? payload.results[0] : null;
    if (!firstMatch) {
      return null;
    }

    const formattedName = [firstMatch.name, firstMatch.admin1, firstMatch.country_code]
      .filter((part) => typeof part === "string" && part.trim().length > 0)
      .join(", ");

    return {
      latitude: typeof firstMatch.latitude === "number" ? firstMatch.latitude : null,
      longitude: typeof firstMatch.longitude === "number" ? firstMatch.longitude : null,
      displayName: formattedName || location
    };
  } catch (error) {
    console.warn("Weather geocoding failed", error);
  }

  return null;
};

const fetchCurrentWeather = async ({ location, latitude, longitude, units }) => {
  if (typeof fetch !== "function") {
    return null;
  }

  let resolvedLatitude = Number.isFinite(latitude) ? latitude : null;
  let resolvedLongitude = Number.isFinite(longitude) ? longitude : null;
  let resolvedName = location && location.trim().length > 0 ? location.trim() : "";

  if ((resolvedLatitude === null || resolvedLongitude === null) && resolvedName) {
    const geocoded = await geocodeWeatherLocation(resolvedName);
    if (!geocoded) {
      return null;
    }

    resolvedLatitude = geocoded.latitude;
    resolvedLongitude = geocoded.longitude;
    if (geocoded.displayName) {
      resolvedName = geocoded.displayName;
    }
  }

  if (resolvedLatitude === null || resolvedLongitude === null) {
    return null;
  }

  const { temperatureUnit, symbol } = resolveWeatherUnits(units);
  const searchParams = new URLSearchParams({
    latitude: resolvedLatitude.toFixed(4),
    longitude: resolvedLongitude.toFixed(4),
    current: "temperature_2m,weather_code",
    temperature_unit: temperatureUnit,
    timezone: "auto"
  });

  const url = `https://api.open-meteo.com/v1/forecast?${searchParams.toString()}`;

  try {
    const response = await fetch(url, { method: "GET" });
    if (!response.ok) {
      throw new Error(`Weather request failed with status ${response.status}`);
    }

    const payload = await response.json();
    const current = payload?.current;
    if (!current || typeof current.temperature_2m !== "number") {
      return null;
    }

    return {
      locationName: resolvedName,
      temperature: current.temperature_2m,
      unitSymbol: symbol,
      description: describeWeatherCode(typeof current.weather_code === "number" ? current.weather_code : null)
    };
  } catch (error) {
    console.warn("Weather request failed", error);
  }

  return null;
};

const initializeWeatherMessage = () => {
  if (typeof document === "undefined") {
    return;
  }

  const button = document.getElementById("nav-message-rotator");
  if (!button || button.dataset.weatherEnabled !== "true") {
    return;
  }

  if (button.querySelector('[data-weather-message="true"]')) {
    return;
  }

  const existingMessages = Array.from(button.querySelectorAll(".nav-module-message"));
  const message = document.createElement("span");
  message.className = "nav-module-message";
  message.dataset.index = String(existingMessages.length);
  message.dataset.weatherMessage = "true";

  const configuredLabel = typeof button.dataset.weatherLabel === "string" && button.dataset.weatherLabel.trim().length > 0
    ? button.dataset.weatherLabel.trim()
    : "";

  if (configuredLabel) {
    message.dataset.label = configuredLabel;
    const labelElement = document.createElement("span");
    labelElement.className = "nav-module-label";
    labelElement.textContent = configuredLabel;
    message.appendChild(labelElement);
  }

  const textElement = document.createElement("span");
  textElement.className = "nav-module-text";
  textElement.textContent = "Loading weather…";
  message.appendChild(textElement);

  if (!existingMessages.length) {
    message.classList.add("is-active");
  }

  button.appendChild(message);

  const rawLatitude = parseFloat(button.dataset.weatherLatitude || "");
  const rawLongitude = parseFloat(button.dataset.weatherLongitude || "");
  const latitude = Number.isFinite(rawLatitude) ? rawLatitude : null;
  const longitude = Number.isFinite(rawLongitude) ? rawLongitude : null;
  const location = typeof button.dataset.weatherLocation === "string" ? button.dataset.weatherLocation : "";
  const units = typeof button.dataset.weatherUnits === "string" ? button.dataset.weatherUnits : "";

  const fallbackLabel = configuredLabel || (location ? `Weather for ${location}` : "Current weather");

  fetchCurrentWeather({ location, latitude, longitude, units }).then((weather) => {
    if (!weather) {
      textElement.textContent = `${fallbackLabel}: unavailable`;
      if (!configuredLabel) {
        message.dataset.label = fallbackLabel;
      }
      return;
    }

    const roundedTemperature = Math.round(weather.temperature);
    const segments = [];

    if (weather.locationName) {
      segments.push(`${weather.locationName}: ${roundedTemperature}${weather.unitSymbol}`);
    } else {
      segments.push(`${roundedTemperature}${weather.unitSymbol}`);
    }

    if (weather.description) {
      segments.push(weather.description);
    }

    textElement.textContent = segments.join(", ");

    if (!configuredLabel) {
      message.dataset.label = weather.locationName ? `${weather.locationName} weather` : "Current weather";
    }
  }).catch((error) => {
    console.warn("Weather update failed", error);
    textElement.textContent = `${fallbackLabel}: unavailable`;
    if (!configuredLabel) {
      message.dataset.label = fallbackLabel;
    }
  });
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

  const updateActiveMessage = (nextIndex) => {
    messages.forEach((message, messageIndex) => {
      const isActive = messageIndex === nextIndex;
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

    activeIndex = nextIndex;
  };

  updateActiveMessage(activeIndex);

  const intervalValue = Number.parseInt(button.dataset.rotationInterval || "", 10);
  const prefersReducedMotion = typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;

  const hasInterval = Number.isFinite(intervalValue) && intervalValue > 0;
  let autoRotateEnabled = hasInterval && !(prefersReducedMotion && prefersReducedMotion.matches);
  let rotationTimer = null;

  const clearRotationTimer = () => {
    if (rotationTimer !== null) {
      window.clearTimeout(rotationTimer);
      rotationTimer = null;
    }
  };

  const rotateToNext = () => {
    const nextIndex = (activeIndex + 1) % messages.length;
    updateActiveMessage(nextIndex);
  };

  const scheduleRotation = () => {
    if (!autoRotateEnabled) {
      return;
    }

    clearRotationTimer();
    const delay = Math.max(intervalValue, 1000);
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
      }
    });
  }

  if (autoRotateEnabled) {
    scheduleRotation();
    button.addEventListener("mouseenter", pauseRotation);
    button.addEventListener("focus", pauseRotation);
    button.addEventListener("mouseleave", resumeRotation);
    button.addEventListener("blur", resumeRotation);
  }

  button.__navMessageRotatorAttached = true;
};

document.addEventListener("DOMContentLoaded", () => {
  const initialized = initializeVanta();
  bindVantaToThemeToggle();
  bindRotationToChangeAnimation();
  initializeWeatherMessage();
  initializeNavMessageRotator();

  if (!initialized && typeof window !== "undefined") {
    window.addEventListener("load", () => initializeVanta({ force: true }), { once: true });
  }
});
