(() => {
  const STORAGE_KEY = "coffeeModuleState";

  const getLocalStorage = () => {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      return window.localStorage;
    } catch (error) {
      console.warn("Coffee tracker localStorage access failed", error);
    }

    return null;
  };

  const readStoredState = () => {
    const storage = getLocalStorage();
    if (!storage) {
      return null;
    }

    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (typeof raw !== "string" || raw.length === 0) {
        return null;
      }

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        return null;
      }

      const { date, count } = parsed;
      if (typeof date !== "string" || !Number.isFinite(count)) {
        return null;
      }

      return { date, count: Math.round(count) };
    } catch (error) {
      console.warn("Coffee tracker state parse failed", error);
    }

    return null;
  };

  const persistState = (state) => {
    const storage = getLocalStorage();
    if (!storage) {
      return;
    }

    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn("Coffee tracker state persist failed", error);
    }
  };

  const padNumber = (value) => String(value).padStart(2, "0");

  const getTodayKey = () => {
    const now = new Date();
    return `${now.getFullYear()}-${padNumber(now.getMonth() + 1)}-${padNumber(now.getDate())}`;
  };

  const parseInteger = (value, fallback) => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.trunc(value);
    }

    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number.parseInt(value.trim(), 10);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return fallback;
  };

  const generateCount = (min, max) => {
    const span = max - min + 1;
    if (span <= 0) {
      return min;
    }

    return min + Math.floor(Math.random() * span);
  };

  const resolveDailyCount = (min, max) => {
    const todayKey = getTodayKey();
    const stored = readStoredState();
    if (stored && stored.date === todayKey && stored.count >= min && stored.count <= max) {
      return stored.count;
    }

    const count = generateCount(min, max);
    persistState({ date: todayKey, count });
    return count;
  };

  const formatFallbackLabel = (beverage) => {
    if (typeof beverage !== "string" || beverage.trim().length === 0) {
      return "Coffee tracker";
    }

    const trimmed = beverage.trim();
    return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)} tracker`;
  };

  const initializeCoffeeMessage = () => {
    if (typeof document === "undefined") {
      return;
    }

    const button = document.getElementById("nav-message-rotator");
    if (!button || button.dataset.coffeeEnabled !== "true") {
      return;
    }

    if (button.querySelector('[data-coffee-message="true"]')) {
      return;
    }

    const existingMessages = Array.from(button.querySelectorAll(".nav-module-message"));
    const message = document.createElement("span");
    message.className = "nav-module-message";
    message.dataset.index = String(existingMessages.length);
    message.dataset.coffeeMessage = "true";

    const configuredLabel = typeof button.dataset.coffeeLabel === "string" && button.dataset.coffeeLabel.trim().length > 0
      ? button.dataset.coffeeLabel.trim()
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
    textElement.textContent = "Tracking coffee…";
    message.appendChild(textElement);

    if (!existingMessages.length) {
      message.classList.add("is-active");
    }

    button.appendChild(message);

    const min = Math.max(0, parseInteger(button.dataset.coffeeMin, 0));
    const max = Math.max(min, parseInteger(button.dataset.coffeeMax, Math.max(min, 5)));
    const unitSingular = typeof button.dataset.coffeeUnitSingular === "string" && button.dataset.coffeeUnitSingular.trim().length > 0
      ? button.dataset.coffeeUnitSingular.trim()
      : "cup";
    const unitPlural = typeof button.dataset.coffeeUnitPlural === "string" && button.dataset.coffeeUnitPlural.trim().length > 0
      ? button.dataset.coffeeUnitPlural.trim()
      : "cups";
    const beverage = typeof button.dataset.coffeeBeverage === "string" && button.dataset.coffeeBeverage.trim().length > 0
      ? button.dataset.coffeeBeverage.trim()
      : "coffee";
    const verb = typeof button.dataset.coffeeVerb === "string" && button.dataset.coffeeVerb.trim().length > 0
      ? button.dataset.coffeeVerb.trim()
      : "consumed today";

    const fallbackLabel = configuredLabel || formatFallbackLabel(beverage);

    try {
      const count = resolveDailyCount(min, max);
      const unitLabel = count === 1 ? unitSingular : unitPlural;
      const segments = [`${count} ${unitLabel}`];

      if (beverage) {
        segments.push(`of ${beverage}`);
      }

      if (verb) {
        segments.push(verb);
      }

      textElement.textContent = segments.join(" ");

      if (!configuredLabel) {
        message.dataset.label = fallbackLabel;
      }
    } catch (error) {
      console.warn("Coffee tracker update failed", error);
      textElement.textContent = `${fallbackLabel}: unavailable`;
      if (!configuredLabel) {
        message.dataset.label = fallbackLabel;
      }
    }
  };

  if (typeof window !== "undefined") {
    window.coffeeModule = window.coffeeModule || {};
    window.coffeeModule.initializeCoffeeMessage = initializeCoffeeMessage;
  }
})();
