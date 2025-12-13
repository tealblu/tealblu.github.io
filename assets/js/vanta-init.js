
const initializeVanta = () => {
  const target = document.querySelector("#top");
  if (!target || target.__vantaEffect) {
    return false;
  }

  if (typeof window === "undefined" || !window.VANTA || !window.VANTA.BIRDS) {
    return false;
  }

  // Requires VANTA and THREE from their respective CDN scripts loaded before this runs.
  target.__vantaEffect = window.VANTA.BIRDS({
    el: target,
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    minHeight: 200,
    minWidth: 200,
    scale: 1,
    scaleMobile: 1,
    color1: 0x642c2c,
    color2: 0x5b8a98,
    colorMode: "lerp",
    wingSpan: 33,
    speedLimit: 3,
    cohesion: 54,
    quantity: 2
  });

  return true;
};

document.addEventListener("DOMContentLoaded", () => {
  if (!initializeVanta() && typeof window !== "undefined") {
    window.addEventListener("load", initializeVanta, { once: true });
  }
});
