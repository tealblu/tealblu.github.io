(() => {
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
    if (typeof window === "undefined") {
      return;
    }

    safeInvoke(window.coffeeModule, "initializeCoffeeMessage");
    safeInvoke(window.weatherModule, "initializeWeatherMessage");
  };

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", initializeNavModules);
  }
})();
