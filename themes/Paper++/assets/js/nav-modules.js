// nav modules controller — simple rotator and module bootstrap.
/*
  - Boots submodules (coffee/weather/github) which append
    `.nav-module-message` elements into `#nav-message-rotator`.
  - Shows one `.is-active` message at a time and rotates at
    `data-rotation-interval` (ms). Click advances; hover pauses.
  - Keeps implementation intentionally tiny to avoid build/runtime
    complexity. No ES module exports (safe for Hugo js.Build).
*/

const getLocalStorage = () => { try { return (typeof window !== 'undefined') ? window.localStorage : null; } catch (e) { return null; } };
const cssColorToInt = () => null;
const getThemeColor = () => null;
const isMobileDevice = () => (typeof window !== 'undefined') ? window.innerWidth <= 768 : false;

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
    console.debug('nav-modules: buildInitialMessages start', { hasButton: !!button, rawPresent: raw != null });
    if (!raw) { console.debug('nav-modules: no data-messages attribute present'); return; }
    console.debug('nav-modules: raw data-messages (first 400 chars)', String(raw).slice(0, 400));

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
      console.debug('nav-modules: parsed with raw JSON.parse', { parsedType: typeof parsed, parsedLen: Array.isArray(parsed) ? parsed.length : undefined });
    } catch (e1) {
      console.debug('nav-modules: raw JSON.parse failed', e1 && e1.message);
      try {
        const decoded = htmlEntityDecode(raw);
        console.debug('nav-modules: trying htmlEntityDecode (first 400 chars)', decoded.slice(0, 400));
        parsed = JSON.parse(decoded);
        console.debug('nav-modules: parsed with htmlEntityDecode', { parsedType: typeof parsed, parsedLen: Array.isArray(parsed) ? parsed.length : undefined });
      } catch (e2) {
        console.debug('nav-modules: htmlEntityDecode parse failed', e2 && e2.message);
        try {
          const uri = decodeURIComponent(raw);
          console.debug('nav-modules: trying decodeURIComponent (first 400 chars)', uri.slice(0, 400));
          parsed = JSON.parse(uri);
          console.debug('nav-modules: parsed with decodeURIComponent', { parsedType: typeof parsed, parsedLen: Array.isArray(parsed) ? parsed.length : undefined });
        } catch (e3) {
          console.debug('nav-modules: decodeURIComponent parse failed', e3 && e3.message);
          try {
            const both = htmlEntityDecode(decodeURIComponent(raw));
            console.debug('nav-modules: trying decodeURIComponent + htmlEntityDecode (first 400 chars)', both.slice(0, 400));
            parsed = JSON.parse(both);
            console.debug('nav-modules: parsed with decodeURIComponent+htmlEntityDecode', { parsedType: typeof parsed, parsedLen: Array.isArray(parsed) ? parsed.length : undefined });
          } catch (e4) {
            console.warn('nav-modules: failed to parse data-messages after all strategies', e1 && e1.message, e2 && e2.message, e3 && e3.message, e4 && e4.message);
            return;
          }
        }
      }
    }

    if (!Array.isArray(parsed)) { console.debug('nav-modules: parsed data is not an array', typeof parsed); return; }
    console.debug('nav-modules: will create DOM messages', { count: parsed.length });
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
        console.debug('nav-modules: appended message', { idx, label: entry && entry.label, text: (text && String(text).slice(0, 120)) });
      } catch (e) { console.warn('nav-modules: error building message', e); }
    });
    console.debug('nav-modules: buildInitialMessages complete, total children in button:', button.children.length);
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

// Intentionally no `export` statements in this file.

