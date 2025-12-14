(() => {
  // Self-contained GitHub activity module. Attaches `window.githubModule`.
  const STORAGE_KEY_PREFIX = "navGithubActivity:";

  const getLocalStorage = () => {
    if (typeof window === "undefined") return null;
    try { return window.localStorage; } catch (e) { console.warn('github-module: localStorage access failed', e); }
    return null;
  };

  const createMessageElement = (label, text, href, timeText) => {
    const button = document.getElementById("nav-message-rotator");
    if (!button) return null;
    const span = document.createElement("span");
    span.className = "nav-module-message";
    if (label) span.dataset.label = label;
    span.setAttribute("aria-hidden", "true");
    if (label) {
      const labelSpan = document.createElement("span");
      labelSpan.className = "nav-module-label";
      labelSpan.textContent = label;
      span.appendChild(labelSpan);
    }
    const textSpan = document.createElement("span");
    textSpan.className = "nav-module-text";
    if (href) {
      const a = document.createElement("a");
      a.href = href;
      a.rel = "noopener noreferrer";
      a.textContent = text;
      textSpan.appendChild(a);
    } else {
      textSpan.textContent = text;
    }
    span.appendChild(textSpan);
    if (timeText) {
      const timeSpan = document.createElement("span");
      timeSpan.className = "nav-module-time";
      timeSpan.textContent = timeText;
      span.appendChild(timeSpan);
    }
    button.appendChild(span);
    return span;
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

  const guessConfigFromButton = (button) => {
    const ds = button?.dataset || {};
    return {
      enabled: ds.githubEnabled === "true" || ds.navGithubEnabled === "true" || false,
      username: ds.githubUsername || ds.navGithubUsername || ds.navGithubUser || ds.navModuleGithubUsername || null,
      eventsLimit: Number.parseInt(ds.githubEventsLimit || ds.navGithubEventsLimit || ds.githubLimit || "", 10) || 3,
      cacheTTLMinutes: Number.parseInt(ds.githubCacheTtl || ds.navGithubCacheTtl || "", 10) || 15,
      label: typeof ds.githubLabel === "string" && ds.githubLabel.trim().length > 0 ? ds.githubLabel.trim() : null
    };
  };

  const fetchEvents = async (username, limit) => {
    const url = `https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=${limit}`;
    const res = await fetch(url, { headers: { Accept: "application/vnd.github.v3+json" } });
    if (!res.ok) throw new Error(`GitHub API error ${res.status}`);
    return res.json();
  };

  const formatEvent = (ev) => {
    try {
      const type = ev.type;
      const repo = ev.repo?.name || "";
      if (type === "PushEvent") {
        const commits = Number.isFinite(ev.payload?.size) ? ev.payload.size : (ev.payload?.commits?.length ?? null);
        if (Number.isFinite(commits) && commits > 0) {
          return `pushed to ${repo} (${commits} commit${commits === 1 ? "" : "s"})`;
        }
        return `pushed to ${repo}`;
      }
      if (type === "PullRequestEvent") {
        const action = ev.payload?.action || "updated";
        return `${action} PR in ${repo}`;
      }
      if (type === "IssuesEvent") {
        const action = ev.payload?.action || "updated";
        return `${action} issue in ${repo}`;
      }
      if (type === "CreateEvent") return `created ${ev.payload?.ref_type || "content"} in ${repo}`;
      if (type === "WatchEvent") return `starred ${repo}`;
      if (type === "ForkEvent") return `forked ${repo}`;
      return `${type} in ${repo}`;
    } catch (e) {
      return "GitHub activity";
    }
  };

  window.githubModule = (function () {
    const initializeGithubMessage = async () => {
      if (typeof document === "undefined") return;
      const button = document.getElementById("nav-message-rotator");
      if (!button) return;
      const cfg = guessConfigFromButton(button);

      if ((!cfg.username || cfg.enabled === false) && window?.siteParams?.navModule?.github) {
        const g = window.siteParams.navModule.github;
        cfg.enabled = g.enabled === true;
        cfg.username = cfg.username || g.username || null;
        cfg.eventsLimit = cfg.eventsLimit || g.eventsLimit || 3;
        cfg.cacheTTLMinutes = cfg.cacheTTLMinutes || g.cacheTTLMinutes || 15;
        cfg.label = cfg.label || (typeof g.label === "string" && g.label.trim().length > 0 ? g.label.trim() : null);
      }

      if (!cfg.label) cfg.label = "GitHub:";
      if (!cfg.enabled || !cfg.username) return;

      const storage = getLocalStorage();
      const key = `${STORAGE_KEY_PREFIX}${cfg.username}`;
      if (storage) {
        try {
          const raw = storage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.fetchedAt && (Date.now() - parsed.fetchedAt) < (cfg.cacheTTLMinutes || 15) * 60 * 1000 && Array.isArray(parsed.events)) {
              const ev = parsed.events[0];
              const text = formatEvent(ev);
              const when = timeAgo(ev.created_at);
              createMessageElement(cfg.label, text, `https://github.com/${cfg.username}`, when);
              return;
            }
          }
        } catch (e) { /* ignore cache parse errors */ }
      }

      const placeholder = createMessageElement(cfg.label, "Loading GitHub…", `https://github.com/${cfg.username}`);
      try {
        const events = await fetchEvents(cfg.username, cfg.eventsLimit || 3);
        if (!events || !events.length) {
          if (placeholder) placeholder.querySelector('.nav-module-text').textContent = 'No recent GitHub activity';
          return;
        }
        const ev = events[0];
        const text = formatEvent(ev);
        const when = timeAgo(ev.created_at);
        if (placeholder) {
          const t = placeholder.querySelector('.nav-module-text');
          t.textContent = text;
          const timeEl = placeholder.querySelector('.nav-module-time');
          if (timeEl) timeEl.textContent = when || '';
          else if (when) {
            const ts = document.createElement('span');
            ts.className = 'nav-module-time';
            ts.textContent = when;
            placeholder.appendChild(ts);
          }
        }
        if (storage) {
          try {
            storage.setItem(key, JSON.stringify({ fetchedAt: Date.now(), events }));
          } catch (e) { /* ignore write errors */ }
        }
      } catch (err) {
        if (placeholder) placeholder.querySelector('.nav-module-text').textContent = 'GitHub unavailable';
        console.warn('nav github module fetch failed', err);
      }
    };

    return { initializeGithubMessage };
  })();

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {});
  }
})();
