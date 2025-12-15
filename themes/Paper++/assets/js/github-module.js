(() => {
  // Minimal GitHub activity insertion for nav rotator.
  const STORAGE_KEY_PREFIX = 'navGithubActivity:';

  const safeLocalStorage = () => {
    try { return window?.localStorage ?? null; } catch (e) { return null; }
  };

  const fetchEvents = async (username, limit = 3) => {
    const url = `https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=${limit}`;
    const res = await fetch(url, { headers: { Accept: 'application/vnd.github.v3+json' } });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    return res.json();
  };

  const simpleFormat = (ev) => {
    if (!ev) return 'GitHub activity';
    const type = ev.type || '';
    const repo = ev.repo?.name || '';
    if (type === 'PushEvent') return `pushed to ${repo}`;
    if (type === 'PullRequestEvent') return `${ev.payload?.action || 'updated'} PR in ${repo}`;
    if (type === 'IssuesEvent') return `${ev.payload?.action || 'updated'} issue in ${repo}`;
    if (type === 'CreateEvent') return `created ${ev.payload?.ref_type || 'content'} in ${repo}`;
    if (type === 'WatchEvent') return `starred ${repo}`;
    if (type === 'ForkEvent') return `forked ${repo}`;
    return `${type} in ${repo}`;
  };

  const timeAgo = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 5) return 'just now';
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(months / 12);
    return `${years}y ago`;
  };

  const createMessage = (button, label, text) => {
    const span = document.createElement('span');
    span.className = 'nav-module-message';
    if (label) span.dataset.label = label;
    span.dataset.githubMessage = 'true';
    span.setAttribute('aria-hidden', 'true');
    const t = document.createElement('span');
    t.className = 'nav-module-text';
    t.textContent = (label ? label + ' ' : '') + (text || '');
    span.appendChild(t);
    button.appendChild(span);
    return span;
  };

  window.githubModule = {
    initializeGithubMessage: async () => {
      if (typeof document === 'undefined') return;
      const button = document.getElementById('nav-message-rotator');
      if (!button) return;

      // Avoid duplicate insertions across multiple init calls.
      if (button.__githubMessageInserted) return;

      const ds = button.dataset || {};
      const cfg = {
        enabled: ds.githubEnabled === 'true' || ds.navGithubEnabled === 'true',
        username: ds.githubUsername || ds.navGithubUsername || window?.siteParams?.navModule?.github?.username || null,
        eventsLimit: Number.parseInt(ds.githubEventsLimit || '', 10) || 3,
        cacheTTLMinutes: Number.parseInt(ds.githubCacheTtlMinutes || ds.navGithubCacheTtlMinutes || '', 10) || window?.siteParams?.navModule?.github?.cacheTTLMinutes || 15,
        label: (typeof ds.githubLabel === 'string' && ds.githubLabel.trim()) || (window?.siteParams?.navModule?.github?.label) || 'GitHub:'
      };

      const ttlCandidate = Number(cfg.cacheTTLMinutes);
      cfg.cacheTTLMinutes = Number.isFinite(ttlCandidate) ? ttlCandidate : 15;
      if (cfg.cacheTTLMinutes < 0) cfg.cacheTTLMinutes = 0;

      if (!cfg.enabled || !cfg.username) return;

      // If a GitHub message is already present, bail out to avoid duplicates.
      if (button.querySelector('.nav-module-message[data-github-message="true"]')) {
        // still mark to prevent concurrent runs
        button.__githubMessageInserted = true;
        return;
      }

      // mark early to prevent concurrent runs adding multiple nodes
      button.__githubMessageInserted = true;

      const placeholder = createMessage(button, cfg.label, 'Loading GitHub…');

      try {
        // try cache first (best-effort)
        const storage = safeLocalStorage();
        const key = STORAGE_KEY_PREFIX + cfg.username;
        if (storage) {
          try {
            const raw = storage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed.events) && parsed.events.length) {
                const ttlMinutes = Number.isFinite(cfg.cacheTTLMinutes) ? cfg.cacheTTLMinutes : 0;
                const ttlMs = ttlMinutes > 0 ? ttlMinutes * 60000 : 0;
                const fetchedAt = typeof parsed.fetchedAt === 'number' ? parsed.fetchedAt : 0;
                const ageMs = fetchedAt ? Date.now() - fetchedAt : Infinity;
                const cacheFresh = ttlMs === 0 ? false : ageMs <= ttlMs;
                if (cacheFresh) {
                  const ev = parsed.events[0];
                  const when = timeAgo(ev.created_at);
                  placeholder.querySelector('.nav-module-text').textContent = (cfg.label ? cfg.label + ' ' : '') + simpleFormat(ev) + (when ? ` ${when}` : '');
                  return;
                }
              }
            }
          } catch (e) { /* ignore cache errors */ }
        }

        const events = await fetchEvents(cfg.username, cfg.eventsLimit);
        if (!events || !events.length) {
          placeholder.querySelector('.nav-module-text').textContent = (cfg.label ? cfg.label + ' ' : '') + 'No recent GitHub activity';
          return;
        }
        const ev = events[0];
        const when = timeAgo(ev.created_at);
        placeholder.querySelector('.nav-module-text').textContent = (cfg.label ? cfg.label + ' ' : '') + simpleFormat(ev) + (when ? ` ${when}` : '');

        if (storage) {
          try {
            storage.setItem(key, JSON.stringify({ fetchedAt: Date.now(), events }));
          } catch (e) { /* ignore */ }
        }
      } catch (err) {
        placeholder.querySelector('.nav-module-text').textContent = (cfg.label ? cfg.label + ' ' : '') + 'GitHub unavailable';
        console.warn('github-module fetch failed', err);
      }
    }
  };

  // Module registers its initializer on `window.githubModule` only. The
  // central `nav-modules.js` file is responsible for invoking it so that
  // initialization is consistent across all submodules.
})();
