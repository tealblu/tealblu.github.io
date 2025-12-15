// nav modules controller — simple rotator and module bootstrap.
/*
  - Boots submodules (coffee/weather/github) which append
    `.nav-module-message` elements into `#nav-message-rotator`.
  - Shows one `.is-active` message at a time and rotates at
    `data-rotation-interval` (ms). Click advances; hover pauses.
  - Keeps implementation intentionally tiny to avoid build/runtime
    complexity. No ES module exports (safe for Hugo js.Build).
*/

const getLocalStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch (error) {
    return null;
  }
};

const cssColorToInt = (colorValue) => {
  if (!colorValue && colorValue !== 0) {
    return null;
  }

  const value = String(colorValue).trim().toLowerCase();
  if (!value) {
    return null;
  }

  if (value.startsWith('#')) {
    const hex = value.slice(1);
    const normalized = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
    const parsed = Number.parseInt(normalized, 16);
    return Number.isNaN(parsed) ? null : parsed;
  }

  const rgbMatch = value.match(/rgba?\s*\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    const r = Number(rgbMatch[1]);
    const g = Number(rgbMatch[2]);
    const b = Number(rgbMatch[3]);
    if ([r, g, b].every((component) => Number.isFinite(component) && component >= 0 && component <= 255)) {
      return (r << 16) + (g << 8) + b;
    }
  }

  return null;
};

const getThemeColor = (variableName) => {
  if (typeof variableName !== 'string' || !variableName.trim()) {
    return null;
  }

  if (typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') {
    return null;
  }

  const pickFromElement = (element) => {
    if (!element) {
      return null;
    }

    try {
      const raw = window.getComputedStyle(element).getPropertyValue(variableName);
      return cssColorToInt(raw);
    } catch (error) {
      return null;
    }
  };

  const darkCandidate = pickFromElement(document.querySelector('.dark'));
  if (darkCandidate !== null) {
    return darkCandidate;
  }

  const rootCandidate = pickFromElement(document.documentElement);
  if (rootCandidate !== null) {
    return rootCandidate;
  }

  return pickFromElement(document.body);
};

const isMobileDevice = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.innerWidth <= 768;
  } catch (error) {
    return false;
  }
};

(function () {
  if (typeof window !== 'undefined') {
    try { window.__navModulesController = true; } catch (e) { /* ignore */ }
  }

  const marqueeStates = new WeakMap();

  const initRotator = () => {
    if (typeof document === 'undefined') return;
    const button = document.getElementById('nav-message-rotator');
    if (!button || button.__navMessageRotatorAttached) return;
    const messages = Array.from(button.querySelectorAll('.nav-module-message'));
    if (!messages.length) { button.__navMessageRotatorAttached = true; return; }

    let active = messages.findIndex(m => m.classList.contains('is-active'));
    if (active < 0) active = 0;

    // Minimal marquee implementation using requestAnimationFrame.
    const setupTrack = (message) => {
      if (!message) return null;
      let textEl = message.querySelector('.nav-module-text');
      if (!textEl) return null;
      let track = textEl.querySelector('.nav-module-track');
      if (!track) {
        track = document.createElement('span');
        track.className = 'nav-module-track';
        // move children into track
        while (textEl.firstChild) track.appendChild(textEl.firstChild);
        textEl.appendChild(track);
      }
      return { textEl, track };
    };

    const startMarquee = (message) => {
      if (!message) return;
      // Clear any scheduled pause for this message
      const existing = marqueeStates.get(message);
      if (existing && existing.pauseTimeout) {
        clearTimeout(existing.pauseTimeout);
        delete existing.pauseTimeout;
      }
      stopMarquee(message);
      const refs = setupTrack(message);
      if (!refs) return;
      const { textEl, track } = refs;
      // ensure inline layout for accurate widths
      track.style.whiteSpace = 'nowrap';
      track.style.display = 'inline-block';

      const containerW = Math.max(0, textEl.clientWidth);
      const contentW = Math.max(0, track.scrollWidth);
      // Only marquee when content exceeds container width
      const singleWidth = contentW;
      if (singleWidth <= containerW) return;

      // Multiply content by 100 to simulate infinite repeating
      const repeatCount = 100;
      // Avoid re-repeating if already repeated: detect a marker
      if (!track.dataset.repeated) {
        const original = track.innerHTML;
        try {
          // repeat the inner HTML many times, inserting a two-tab gap between copies
          let repeated = '';
          const gap = '&#9;&#9;|&#9;&#9;'; // four tab characters as HTML entities
          for (let i = 0; i < repeatCount; i++) {
            repeated += original;
            if (i < repeatCount - 1) repeated += gap;
          }
          track.innerHTML = repeated;
          track.dataset.repeated = '1';
        } catch (e) {
          // failing to repeat shouldn't break marquee; fall back
        }
      }

      // Recompute widths after repeating
      const fullW = Math.max(0, track.scrollWidth);
      const copyWidth = Math.max(0, Math.floor(fullW / repeatCount) || singleWidth);

      const distance = copyWidth; // animate by a single-copy width
      const speed = 60; // pixels per second
      const duration = (distance / speed) * 1000; // ms to move from 0 -> -distance

      const state = { raf: null, start: null, duration, containerW, contentW: fullW, singleWidth: copyWidth };

      // start left-justified
      track.style.transform = 'translate3d(0,0,0)';

      const tick = (t) => {
        if (!state.start) state.start = t;
        const elapsed = (t - state.start) % state.duration;
        const progress = elapsed / state.duration;
        const x = Math.round(-state.singleWidth * progress);
        track.style.transform = `translate3d(${x}px,0,0)`;
        state.raf = requestAnimationFrame(tick);
      };

      state.raf = requestAnimationFrame(tick);
      marqueeStates.set(message, state);
    };

    const scheduleStartMarquee = (message, pauseMs) => {
      if (!message) return;
      // clear any previous scheduled starts
      const prev = marqueeStates.get(message);
      if (prev && prev.pauseTimeout) {
        clearTimeout(prev.pauseTimeout);
        delete prev.pauseTimeout;
      }
      const refs = setupTrack(message);
      if (!refs) return;
      const { textEl, track } = refs;
      const containerW = Math.max(0, textEl.clientWidth);
      const contentW = Math.max(0, track.scrollWidth);
      const distance = contentW - containerW;
      if (distance <= 0) return;

      const timeout = setTimeout(() => {
        // only start if still active
        if (!message.classList.contains('is-active')) return;
        startMarquee(message);
      }, Math.max(0, Number.isFinite(pauseMs) ? Number(pauseMs) : 2000));

      const state = marqueeStates.get(message) || {};
      state.pauseTimeout = timeout;
      marqueeStates.set(message, state);
    };

    const stopMarquee = (message) => {
      const state = marqueeStates.get(message);
      if (state) {
        if (state.raf) cancelAnimationFrame(state.raf);
        if (state.pauseTimeout) clearTimeout(state.pauseTimeout);
        marqueeStates.delete(message);
      }
      try {
        const refs = setupTrack(message);
        if (refs && refs.track) refs.track.style.transform = '';
      } catch (e) { /* ignore */ }
    };

    const pauseMs = Number.parseInt(button.dataset.marqueePauseMs || button.dataset.navScrollDelayMs || '2000', 10) || 2000;

    const show = (i) => {
      const prev = messages[active];
      if (prev) stopMarquee(prev);
      messages.forEach((m, idx) => m.classList.toggle('is-active', idx === i));
      active = i;
      const current = messages[active];
      // schedule marquee start with a brief pause so text is momentarily readable
      if (!(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
        scheduleStartMarquee(current, pauseMs);
      }
    };

    show(active);

    const intervalMs = Number.parseInt(button.dataset.rotationInterval || '', 10) || 10000;
    const prefersReduced = (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    let timer = null;

    const start = () => { if (timer || prefersReduced) return; timer = setInterval(() => show((active + 1) % messages.length), intervalMs); };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };

    button.addEventListener('click', () => { stop(); show((active + 1) % messages.length); });
    button.addEventListener('mouseenter', stop);
    button.addEventListener('mouseleave', start);

    if (!prefersReduced) start();
    button.__navMessageRotatorAttached = true;
  };

  // Build messages from server-provided JSON stored in `data-messages`.
  const buildInitialMessages = () => {
    if (typeof document === 'undefined') return;
    const button = document.getElementById('nav-message-rotator');
    if (!button) return;
    const raw = button.getAttribute('data-messages') || button.dataset.messages;
    if (!raw) return;

    const htmlEntityDecode = (s) => {
      const str = String(s || '');
      return str
        .replace(/&quot;/g, '"')
        .replace(/&apos;|&#39;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#x([0-9A-Fa-f]+);/g, (m, hex) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (m, dec) => String.fromCharCode(parseInt(dec, 10)));
    };

    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch (e1) {
      try { parsed = JSON.parse(htmlEntityDecode(raw)); } catch (e2) {
        try { parsed = JSON.parse(decodeURIComponent(raw)); } catch (e3) {
          try { parsed = JSON.parse(htmlEntityDecode(decodeURIComponent(raw))); } catch (e4) { return; }
        }
      }
    }

    if (!Array.isArray(parsed)) return;
    parsed.forEach((entry, idx) => {
      try {
        const span = document.createElement('span');
        span.className = 'nav-module-message';
        span.setAttribute('data-index', String(idx));
        if (entry && typeof entry === 'object' && entry.label) span.setAttribute('data-label', String(entry.label));

        if (entry && typeof entry === 'object' && entry.label) {
          const labelEl = document.createElement('span');
          labelEl.className = 'nav-module-label';
          labelEl.textContent = String(entry.label);
          span.appendChild(labelEl);
        }

        const text = (entry && typeof entry === 'object') ? (entry.text || '') : (String(entry || '') || '');
        if ((text || '').toString().trim() !== '') {
          const textEl = document.createElement('span');
          textEl.className = 'nav-module-text';
          textEl.textContent = String(text);
          span.appendChild(textEl);
        }

        button.appendChild(span);
      } catch (e) { /* ignore per-message errors */ }
    });
  };

  const safeInvoke = (mod, method) => { if (!mod || typeof mod[method] !== 'function') return; try { mod[method](); } catch (e) { console.warn('nav-modules safeInvoke failed', e); } };

  const initAll = () => {
    if (typeof document === 'undefined') return;
    // Build any server-provided messages first, then let modules append theirs,
    // then initialize the rotator so it picks up everything in DOM order.
    buildInitialMessages();
    safeInvoke(window?.coffeeModule, 'initializeCoffeeMessage');
    safeInvoke(window?.weatherModule, 'initializeWeatherMessage');
    safeInvoke(window?.githubModule, 'initializeGithubMessage');
    initRotator();
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initAll);
    document.addEventListener('turbo:load', initAll);
  }

  try {
    if (typeof window !== 'undefined') {
      window.siteUtils = window.siteUtils || {};
      window.siteUtils.getLocalStorage = getLocalStorage;
      window.siteUtils.cssColorToInt = cssColorToInt;
      window.siteUtils.getThemeColor = getThemeColor;
      window.siteUtils.isMobileDevice = isMobileDevice;
    }
  } catch (e) { /* ignore */ }
})();

