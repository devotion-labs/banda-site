// assets/js/main.js
(() => {
  // ---------- helpers ----------
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ---------- footer year ----------
  function initYear() {
    const y = qs("#y");
    if (y) y.textContent = String(new Date().getFullYear());
  }

  // ---------- active nav link ----------
  function initActiveNav() {
    const nav = qs("[data-nav]");
    if (!nav) return;

    const current = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    qsa("a[data-page]", nav).forEach((a) => {
      const page = (a.getAttribute("data-page") || "").toLowerCase();
      a.classList.toggle("active", page === current);
    });
  }

  // ---------- YouTube thumbnails fallback (maxres -> hq -> mq) ----------
  function initThumbFallbacks() {
    const thumbs = qsa("img.yt-thumb");
    thumbs.forEach((img) => {
      const fallbacks = [img.dataset.fallback, img.dataset.fallback2].filter(Boolean);
      let i = 0;
      img.addEventListener("error", () => {
        if (i < fallbacks.length) img.src = fallbacks[i++];
      });
    });
  }

  // ---------- mobile menu ----------
  function initMenu() {
    const btn = qs("[data-menu-btn]");
    const nav = qs("[data-nav]");
    if (!btn || !nav) return;

    const openClass = "open";

    function setOpen(isOpen) {
      nav.classList.toggle(openClass, isOpen);
      btn.setAttribute("aria-expanded", String(isOpen));
    }

    btn.addEventListener("click", () => {
      setOpen(!nav.classList.contains(openClass));
    });

    // close when clicking a link
    qsa("a", nav).forEach((a) => a.addEventListener("click", () => setOpen(false)));

    // close on ESC
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });

    // close if resizing to desktop
    window.addEventListener("resize", () => {
      if (window.innerWidth > 900) setOpen(false);
    });
  }

  // ---------- tabs (Maestro / Músicos / Escola etc.) ----------
  function initTabs() {
    qsa("[data-tabs]").forEach((root) => {
      const tabs = qsa('[role="tab"]', root);
      if (!tabs.length) return;

      const panelsById = new Map();
      tabs.forEach((tab) => {
        const panelId = tab.getAttribute("aria-controls");
        if (!panelId) return;
        const panel = qs("#" + panelId);
        if (panel) panelsById.set(panelId, panel);
      });

      function activateTab(tab) {
        tabs.forEach((t) => {
          const selected = t === tab;
          t.setAttribute("aria-selected", String(selected));
          t.tabIndex = selected ? 0 : -1;

          const pid = t.getAttribute("aria-controls");
          const panel = pid ? panelsById.get(pid) : null;
          if (panel) panel.hidden = !selected;
        });
      }

      const initial = tabs.find((t) => t.getAttribute("aria-selected") === "true") || tabs[0];
      activateTab(initial);

      tabs.forEach((tab) => {
        tab.addEventListener("click", () => activateTab(tab));

        tab.addEventListener("keydown", (e) => {
          const idx = tabs.indexOf(tab);
          if (e.key === "ArrowRight") {
            e.preventDefault();
            const next = tabs[(idx + 1) % tabs.length];
            next.focus();
            activateTab(next);
          }
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            const prev = tabs[(idx - 1 + tabs.length) % tabs.length];
            prev.focus();
            activateTab(prev);
          }
        });
      });
    });
  }

  // ---------- vídeos (desktop swap + mobile inline) ----------
  function initVideos() {
    const featuredThumb = qs("#featuredThumb");
    const featuredTitle = qs("#featuredTitle");
    const featuredSub =
      qs("#featuredSub") || qs(".featured-caption .featured-sub");
    const featuredMeta =
      qs("#featuredMeta") || qs(".featured-body .video-meta") || qs(".featured-body .featured-meta");
    const featuredLink = qs("a.js-featured");
    const minis = qsa('a.mini-card.js-video[data-video-id]');

    if (!featuredThumb || !featuredLink || !minis.length) return;

    const miniThumbHTML = new Map();
    let currentInline = null;

    let preconnected = false;
    function preconnectYouTube() {
      if (preconnected) return;
      preconnected = true;
      ["https://www.youtube-nocookie.com", "https://i.ytimg.com", "https://www.google.com"].forEach((href) => {
        const l = document.createElement("link");
        l.rel = "preconnect";
        l.href = href;
        l.crossOrigin = "anonymous";
        document.head.appendChild(l);
      });
    }

    function isDesktop() {
      return window.matchMedia("(min-width: 981px)").matches;
    }

    function iframeHTML(videoId, title) {
      const origin = encodeURIComponent(window.location.origin || "");
      const src =
        "https://www.youtube-nocookie.com/embed/" +
        encodeURIComponent(videoId) +
        `?rel=0&modestbranding=1&playsinline=1&autoplay=1&mute=1&origin=${origin}`;

      return `
        <iframe
          src="${src}"
          title="${title || "YouTube video"}"
          referrerpolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        ></iframe>
      `;
    }

    function stopFeatured() {
      featuredThumb.querySelectorAll("iframe").forEach((f) => f.remove());
      featuredThumb.classList.remove("is-playing");
    }

    function closeInline() {
      if (!currentInline) return;
      const thumb = currentInline.querySelector(".mini-thumb");
      if (thumb && miniThumbHTML.has(currentInline)) {
        thumb.innerHTML = miniThumbHTML.get(currentInline);
      }
      currentInline.classList.remove("is-playing");
      currentInline = null;
    }

    function getFeaturedState() {
      const metaSpans = featuredMeta ? Array.from(featuredMeta.querySelectorAll("span")) : [];
      return {
        videoId: featuredThumb.dataset.videoId || "",
        title: featuredTitle?.textContent?.trim() || "",
        sub: featuredSub?.textContent?.trim() || "",
        meta1: metaSpans[0]?.textContent?.trim() || "",
        meta2: metaSpans[1]?.textContent?.trim() || "",
        meta3: metaSpans[2]?.textContent?.trim() || ""
      };
    }

    function getMiniState(a) {
      return {
        videoId: a.dataset.videoId || "",
        title: a.dataset.title || a.querySelector(".mini-title")?.textContent?.trim() || "",
        sub: a.dataset.sub || "",
        meta1: a.dataset.meta1 || "",
        meta2: a.dataset.meta2 || "",
        meta3: a.dataset.meta3 || ""
      };
    }

    function setThumbForId(imgEl, id) {
      if (!imgEl || !id) return;
      imgEl.src = `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
      imgEl.dataset.fallback = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
      imgEl.dataset.fallback2 = `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
    }

    function setFeaturedFromState(s) {
      featuredThumb.dataset.videoId = s.videoId;
      featuredLink.href = "https://www.youtube.com/watch?v=" + s.videoId;

      if (featuredTitle) featuredTitle.textContent = s.title || "";
      if (featuredSub) featuredSub.textContent = s.sub || "";

      if (featuredMeta) {
        const parts = [s.meta1, s.meta2, s.meta3].filter(Boolean).map((t) => `<span>${t}</span>`);
        if (parts.length) featuredMeta.innerHTML = parts.join("");
      }

      const img = featuredThumb.querySelector("img.yt-thumb");
      setThumbForId(img, s.videoId);
    }

    function setMiniFromState(a, s) {
      a.dataset.videoId = s.videoId;
      a.dataset.title = s.title || "";
      a.dataset.sub = s.sub || "";
      a.dataset.meta1 = s.meta1 || "";
      a.dataset.meta2 = s.meta2 || "";
      a.dataset.meta3 = s.meta3 || "";
      a.href = "https://www.youtube.com/watch?v=" + s.videoId;

      const img = a.querySelector("img.yt-thumb");
      setThumbForId(img, s.videoId);

      const t = a.querySelector(".mini-title");
      if (t) t.textContent = s.title || "Vídeo";
    }

    function playFeatured(s) {
      preconnectYouTube();
      closeInline();
      stopFeatured();

      setFeaturedFromState(s);
      featuredThumb.classList.add("is-playing");
      featuredThumb.insertAdjacentHTML("beforeend", iframeHTML(s.videoId, s.title));
    }

    function playInlineMini(a, s) {
      preconnectYouTube();
      stopFeatured();

      if (currentInline && currentInline !== a) closeInline();

      const thumb = a.querySelector(".mini-thumb");
      if (!thumb) return;

      if (!miniThumbHTML.has(a)) miniThumbHTML.set(a, thumb.innerHTML);

      a.classList.add("is-playing");
      currentInline = a;

      thumb.innerHTML = `
        ${iframeHTML(s.videoId, s.title)}
        <div class="yt-close" title="Fechar">×</div>
      `;

      thumb.querySelector(".yt-close")?.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        closeInline();
      });
    }

    featuredLink.addEventListener("click", (e) => {
      e.preventDefault();
      const s = getFeaturedState();
      if (s.videoId) playFeatured(s);
    });

    minis.forEach((a) => {
      a.addEventListener("pointerenter", preconnectYouTube, { passive: true });

      a.addEventListener("click", (e) => {
        e.preventDefault();
        const newState = getMiniState(a);
        if (!newState.videoId) return;

        if (isDesktop()) {
          const oldFeatured = getFeaturedState();
          setMiniFromState(a, oldFeatured);
          playFeatured(newState);
        } else {
          playInlineMini(a, newState);
        }
      });
    });

    window.addEventListener("resize", () => {
      if (isDesktop()) closeInline();
    });
  }

  // ---------- bootstrap ----------
  document.addEventListener("DOMContentLoaded", () => {
    initYear();
    initMenu();
    initActiveNav();
    initThumbFallbacks();
    initTabs();
    initVideos();
  });
})();
