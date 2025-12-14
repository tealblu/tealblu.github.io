(() => {
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

  if (typeof window !== "undefined") {
    window.weatherModule = window.weatherModule || {};
    window.weatherModule.initializeWeatherMessage = initializeWeatherMessage;
  }
})();
