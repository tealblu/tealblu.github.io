(() => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const root = document.documentElement;
  const CLS = { base: 'page-transition', ready: 'page-transition-ready', exit: 'page-transition-exit', disabled: 'page-transition-disabled' };
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const supportsVT = typeof document.startViewTransition === 'function';

  const parseDuration = () => {
    const v = getComputedStyle(root).getPropertyValue('--page-transition-duration').trim();
    if (!v) return 0;
    if (v.endsWith('ms')) return Number.parseFloat(v.slice(0, -2)) || 0;
    if (v.endsWith('s')) { const s = Number.parseFloat(v.slice(0, -1)); return Number.isFinite(s) ? s * 1000 : 0; }
    const n = Number.parseFloat(v); return Number.isFinite(n) ? n : 0;
  };

  let duration = parseDuration();
  const updateDuration = () => { duration = parseDuration(); };

  const enter = () => {
    root.classList.remove(CLS.disabled, CLS.exit);
    if (!root.classList.contains(CLS.base)) root.classList.add(CLS.base);
    requestAnimationFrame(() => root.classList.add(CLS.ready));
  };

  const disable = () => { root.classList.remove(CLS.base, CLS.ready, CLS.exit); root.classList.add(CLS.disabled); };

  const navTo = (href) => { window.location.href = href; };

  const onClick = (e) => {
    if (root.classList.contains(CLS.disabled) || e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!a) return;
    if (a.hasAttribute('download')) return;
    if (a.target && a.target.toLowerCase() !== '_self') return;
    if (a.dataset.noTransition === 'true') return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#')) return;
    let url;
    try { url = new URL(a.href, location.href); } catch { return; }
    if (!/^https?:$/i.test(url.protocol) || url.origin !== location.origin) return;
    const cur = location;
    if (url.pathname === cur.pathname && url.search === cur.search && url.hash === cur.hash) return;
    if (url.hash && url.pathname === cur.pathname && url.search === cur.search) return;
    e.preventDefault();
    updateDuration();
    const navigate = () => navTo(url.href);
    if (supportsVT && !mq.matches) {
      try { document.startViewTransition(navigate); return; } catch (err) {}
    }
    requestAnimationFrame(() => {
      root.classList.add(CLS.exit);
      if (duration <= 0) navigate(); else setTimeout(navigate, duration);
    });
  };

  const mqChange = (ev) => { if (ev.matches) disable(); else enter(); };

  document.addEventListener('click', onClick, { capture: true });

  const init = () => { if (mq.matches) disable(); else { updateDuration(); enter(); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
  window.addEventListener('pageshow', init);
  if (typeof mq.addEventListener === 'function') mq.addEventListener('change', mqChange); else if (typeof mq.addListener === 'function') mq.addListener(mqChange);
})();
