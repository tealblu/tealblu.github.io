(() => {
  const MINUTES_IN_DAY = 1440;

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

  const parseTimeToMinutes = (value) => {
    if (typeof value !== "string") {
      return null;
    }

    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return null;
    }

    const match = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
    if (!match) {
      return null;
    }

    let hours = Number.parseInt(match[1], 10);
    const minutes = match[2] === undefined ? 0 : Number.parseInt(match[2], 10);

    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
      return null;
    }

    if (minutes < 0 || minutes > 59) {
      return null;
    }

    const meridiem = typeof match[3] === "string" ? match[3].toLowerCase() : "";

    if (meridiem) {
      if (hours < 1 || hours > 12) {
        return null;
      }

      if (hours === 12) {
        hours = 0;
      }

      if (meridiem === "pm") {
        hours += 12;
      }
    } else if (hours < 0 || hours > 23) {
      return null;
    }

    return hours * 60 + minutes;
  };

  const getCurrentMinutes = () => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  };

  // Supports windows that cross midnight by mapping daily progress to a circular timeline.
  const computeProgress = (nowMinutes, startMinutes, endMinutes) => {
    if (!Number.isFinite(nowMinutes) || !Number.isFinite(startMinutes) || !Number.isFinite(endMinutes)) {
      return null;
    }

    const normalize = (value) => {
      const normalized = value % MINUTES_IN_DAY;
      return normalized < 0 ? normalized + MINUTES_IN_DAY : normalized;
    };

    const now = normalize(nowMinutes);
    const start = normalize(startMinutes);
    const end = normalize(endMinutes);
    const span = (end - start + MINUTES_IN_DAY) % MINUTES_IN_DAY;

    if (span === 0) {
      return null;
    }

    if (end > start) {
      if (now <= start) {
        return 0;
      }

      if (now >= end) {
        return 1;
      }

      return (now - start) / (end - start);
    }

    if (now >= start || now <= end) {
      const distance = now >= start ? now - start : now + MINUTES_IN_DAY - start;
      return distance / span;
    }

    return 0;
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
      const firstTimeMinutes = parseTimeToMinutes(button.dataset.coffeeFirstTime);
      const lastTimeMinutes = parseTimeToMinutes(button.dataset.coffeeLastTime);
      const range = max - min;
      let count = min;

      if (firstTimeMinutes !== null && lastTimeMinutes !== null) {
        const progress = computeProgress(getCurrentMinutes(), firstTimeMinutes, lastTimeMinutes);
        if (progress !== null) {
          const normalizedProgress = Math.min(1, Math.max(0, progress));
          const resolved = min + normalizedProgress * range;
          count = Math.round(resolved);
        }
      }

      count = Math.min(max, Math.max(min, count));

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
