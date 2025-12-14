(() => {
  // Self-contained GitHub activity module. Attaches `window.githubModule`.
  const STORAGE_KEY_PREFIX = "navGithubActivity:";

  const getLocalStorage = () => {
    if (typeof window === "undefined") return null;
    try { return window.localStorage; } catch (e) { console.warn('github-module: localStorage access failed', e); }
    return null;
  };

  const createMessageElement = (label, text, timeText) => {
    const button = document.getElementById("nav-message-rotator");
    if (!button) return null;
    const span = document.createElement("span");
    span.className = "nav-module-message";
    if (label) span.dataset.label = label;
    span.setAttribute("aria-hidden", "true");

    // Put the entire visible string into `.nav-module-text` (label +
    // optional time + body) so there's a single element for measurement
    // and marquee handling.
    const textSpan = document.createElement("span");
    textSpan.className = "nav-module-text";
    // Compose full visible string as: "<label> <text> <time>" (time last).
    const full = (label ? label + ' ' : '') + (text || '') + (timeText ? ` ${timeText}` : '');
    textSpan.appendChild(document.createTextNode(full));
    span.appendChild(textSpan);

    button.appendChild(span);
    return span;
  };

  // Safely update the `.nav-module-text` content while preserving any label
  // so that the label and text remain inside the same scrolling container.
  const updateMessageText = (messageElement, newText) => {
    if (!messageElement) return;
    const textContainer = messageElement.querySelector('.nav-module-text');
    if (textContainer) {
      textContainer.textContent = newText || '';
      return;
    }

    // If missing, create the text container (fallback)
    const fallback = document.createElement('span');
    fallback.className = 'nav-module-text';
    fallback.textContent = newText || '';
    messageElement.appendChild(fallback);
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
      console.debug && console.debug('github-module: init', { cfg });

      if ((!cfg.username || cfg.enabled === false) && window?.siteParams?.navModule?.github) {
        const g = window.siteParams.navModule.github;
        cfg.enabled = g.enabled === true;
        cfg.username = cfg.username || g.username || null;
        cfg.eventsLimit = cfg.eventsLimit || g.eventsLimit || 3;
        cfg.cacheTTLMinutes = cfg.cacheTTLMinutes || g.cacheTTLMinutes || 15;
        cfg.label = cfg.label || (typeof g.label === "string" && g.label.trim().length > 0 ? g.label.trim() : null);
      }

      if (!cfg.label) cfg.label = "GitHub:";
      if (!cfg.enabled || !cfg.username) {
        console.debug && console.debug('github-module: disabled or missing username', { enabled: cfg.enabled, username: cfg.username });
        return;
      }

      // Prevent duplicate insertion: if a github message was already added,
      // bail out. This mirrors other nav modules which set a message flag.
      if (button.querySelector('[data-github-message="true"]')) {
        console.debug && console.debug('github-module: message already present, skipping insertion');
        return;
      }

      const existingMessages = Array.from(button.querySelectorAll('.nav-module-message'));

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
              console.debug && console.debug('github-module: using cached events', { ev });
              const el = createMessageElement(cfg.label, text, when);
              if (el) {
                el.dataset.index = String(existingMessages.length);
                el.dataset.githubMessage = 'true';
                if (!existingMessages.length) el.classList.add('is-active');
              }
              return;
            }
          }
        } catch (e) { /* ignore cache parse errors */ }
      }

      const placeholder = createMessageElement(cfg.label, "Loading GitHub…");
      if (placeholder) {
        placeholder.dataset.index = String(existingMessages.length);
        placeholder.dataset.githubMessage = 'true';
        if (!existingMessages.length) placeholder.classList.add('is-active');
      }
      console.debug && console.debug('github-module: created placeholder', { placeholder });

      // If the nav rotator already initialized, newly appended messages may
      // be hidden (not part of the rotator's internal `messages` list).
      // Make the placeholder visible immediately by toggling `.is-active`
      // so the GitHub text shows up even if the rotator hasn't picked it up.
      try {
        const buttonEl = document.getElementById('nav-message-rotator');
        if (buttonEl && placeholder) {
          const alreadyAttached = Boolean(buttonEl.__navMessageRotatorAttached);
          if (alreadyAttached) {
            const current = buttonEl.querySelector('.nav-module-message.is-active');
            if (current && current !== placeholder) {
              current.classList.remove('is-active');
              current.setAttribute('aria-hidden', 'true');
            }
            placeholder.classList.add('is-active');
            placeholder.setAttribute('aria-hidden', 'false');
            // update button title for accessibility
            const label = typeof placeholder.dataset.label === 'string' ? placeholder.dataset.label : '';
            const textContent = (placeholder.textContent || '').trim();
            if (label) buttonEl.title = label;
            else if (textContent) buttonEl.title = textContent;
          }
        }
      } catch (e) {
        console.warn && console.warn('github-module: show placeholder failed', e);
      }
      try {
        const events = await fetchEvents(cfg.username, cfg.eventsLimit || 3);
        if (!events || !events.length) {
          if (placeholder) {
            const base = placeholder.dataset.label || cfg.label || '';
            const combined = (base ? base + ' ' : '') + 'No recent GitHub activity';
            updateMessageText(placeholder, combined);
          }
          return;
        }
        const ev = events[0];
        const text = formatEvent(ev);
        const when = timeAgo(ev.created_at);
        if (placeholder) {
          const base = placeholder.dataset.label || cfg.label || '';
          const combined = (base ? base + (when ? ` ${when}` : '') + ' ' : '') + text;
          updateMessageText(placeholder, combined);
        }
        if (storage) {
          try {
            storage.setItem(key, JSON.stringify({ fetchedAt: Date.now(), events }));
          } catch (e) { /* ignore write errors */ }
        }
      } catch (err) {
        if (placeholder) updateMessageText(placeholder, 'GitHub unavailable');
        console.warn('nav github module fetch failed', err);
      }
    };

    return { initializeGithubMessage };
  })();

  if (typeof document !== "undefined") {
    // Ensure the module initializes even if script execution order means
    // `nav-modules.js` missed calling it. Call `initializeGithubMessage`
    // on DOMContentLoaded or immediately if the document is already loaded.
    const _run = () => {
      try {
        if (window?.githubModule && typeof window.githubModule.initializeGithubMessage === 'function') {
          window.githubModule.initializeGithubMessage();
        }
      } catch (e) {
        console.warn && console.warn('github-module: init failed', e);
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', _run);
    } else {
      _run();
    }
  }
})();
