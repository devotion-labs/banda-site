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
    // IMPORTANT: scope ao header para não apanhar outros [data-nav] dentro da página
    const header = qs("header") || document;
    const nav = qs("[data-nav]", header);
    if (!nav) return;

    const current = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    qsa("a[data-page]", nav).forEach((a) => {
      const page = (a.getAttribute("data-page") || "").toLowerCase();
      a.classList.toggle("active", page === current);
    });
  }

  // ---------- mobile menu ----------
  function initMenu() {
    const header = qs("header") || document;

    const btn = qs("[data-menu-btn]", header);
    const nav = qs("[data-nav]", header);
    if (!btn || !nav) return;

    // GUARD: evita bind duplo caso o script seja carregado 2x
    if (btn.dataset.menuInit === "1") return;
    btn.dataset.menuInit = "1";

    const openClass = "open";

    function setOpen(isOpen) {
      nav.classList.toggle(openClass, isOpen);
      btn.setAttribute("aria-expanded", String(isOpen));
    }

    btn.addEventListener("click", () => {
      setOpen(!nav.classList.contains(openClass));
    });

    qsa("a", nav).forEach((a) => a.addEventListener("click", () => setOpen(false)));

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 900) setOpen(false);
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

  // ---------- carousels (swipe mobile + setas desktop) ----------
  function initCarousels() {
    const carousels = qsa("[data-carousel]");
    if (!carousels.length) return;

    const updaters = [];

    carousels.forEach((carousel) => {
      const track = qs("[data-carousel-track]", carousel);
      const prev = qs("[data-carousel-prev]", carousel);
      const next = qs("[data-carousel-next]", carousel);
      const dotsW = qs("[data-carousel-dots]", carousel);
      const items = track ? qsa(".media-carousel-item", track) : [];

      if (!track || !items.length) return;

      // dots
      let dots = [];
      if (dotsW) {
        dotsW.innerHTML = "";
        dots = items.map((_, i) => {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "media-carousel-dot";
          b.setAttribute("aria-label", `Ir para imagem ${i + 1}`);
          b.addEventListener("click", () => scrollToIndex(i));
          dotsW.appendChild(b);
          return b;
        });
      }

      function getStep() {
        const first = items[0];
        const rect = first.getBoundingClientRect();
        const cs = getComputedStyle(track);
        const gap = parseFloat(cs.columnGap || cs.gap || "0") || 0;

        // se ainda não há layout (ex: tab escondida), rect.width pode ser 0
        const w = rect.width || track.clientWidth || 1;
        return w + gap;
      }

      function getIndex() {
        const step = getStep() || 1;
        return Math.round(track.scrollLeft / step);
      }

      function scrollToIndex(i) {
        const idx = Math.max(0, Math.min(i, items.length - 1));
        const step = getStep();
        track.scrollTo({ left: idx * step, behavior: "smooth" });
      }

      function update() {
        const idx = getIndex();
        const max = items.length - 1;

        if (prev) prev.disabled = idx <= 0;
        if (next) next.disabled = idx >= max;

        if (dots.length) {
          dots.forEach((d, i) => d.setAttribute("aria-current", String(i === idx)));
        }

        // se não houver overflow, esconde setas/dots
        const hasOverflow = track.scrollWidth > track.clientWidth + 2;
        if (prev) prev.style.visibility = hasOverflow ? "visible" : "hidden";
        if (next) next.style.visibility = hasOverflow ? "visible" : "hidden";
        if (dotsW) dotsW.style.display = (hasOverflow && items.length > 1) ? "flex" : "none";
      }

      if (prev) prev.addEventListener("click", () => scrollToIndex(getIndex() - 1));
      if (next) next.addEventListener("click", () => scrollToIndex(getIndex() + 1));

      let raf = 0;
      track.addEventListener("scroll", () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(update);
      }, { passive: true });

      window.addEventListener("resize", update);

      updaters.push(update);
      update();
    });

    // permite refrescar quando trocas tabs (painéis hidden -> visíveis)
    document.addEventListener("carousels:refresh", () => {
      updaters.forEach((fn) => fn());
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

        // Refresh carousels (para tabs que estavam hidden)
        document.dispatchEvent(new Event("carousels:refresh"));
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

  // ---------- calendário (CSV -> tabela + cards) ----------
  async function initCalendarFromCSV() {
    const tableBody = qs("#calendarTableBody");
    const cardsWrap = qs("#calendarCards");
    if (!tableBody || !cardsWrap) return; // só corre na página calendário

    const CSV_URL = "assets/data/calendario.csv";

    function escapeHTML(str) {
      return String(str ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function parseCSV(text) {
      // parser simples (suporta aspas)
      const rows = [];
      let row = [];
      let cur = "";
      let inQuotes = false;

      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        const next = text[i + 1];

        if (ch === '"' && next === '"') {
          cur += '"';
          i++;
          continue;
        }
        if (ch === '"') {
          inQuotes = !inQuotes;
          continue;
        }
        if (ch === "," && !inQuotes) {
          row.push(cur);
          cur = "";
          continue;
        }
        if ((ch === "\n" || ch === "\r") && !inQuotes) {
          if (ch === "\r" && next === "\n") i++;
          row.push(cur);
          cur = "";
          if (row.some((c) => c.trim() !== "")) rows.push(row);
          row = [];
          continue;
        }
        cur += ch;
      }

      // último campo
      row.push(cur);
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      return rows;
    }

    function formatDatePT(iso) {
      // iso: YYYY-MM-DD
      if (!iso) return "—";
      const [y, m, d] = iso.split("-").map(Number);
      if (!y || !m || !d) return iso;

      // PT-PT: 06/01/2026
      const dd = String(d).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      return `${dd}/${mm}/${y}`;
    }

    function toDateValue(iso) {
      // valor numérico para ordenar; fallback alto
      if (!iso) return Number.POSITIVE_INFINITY;
      const t = Date.parse(iso);
      return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY;
    }

    function normalizeEvent(r) {
      return {
        date: (r.date || "").trim(),
        event: (r.event || "").trim(),
        location: (r.location || "").trim(),
        time: (r.time || "").trim(),
        alternating: (r.alternating || "").trim(),
        notes: (r.notes || "").trim(),
      };
    }

    function renderEmpty(msg) {
      tableBody.innerHTML = `<tr><td colspan="5">${escapeHTML(msg)}</td></tr>`;
      cardsWrap.innerHTML = "";
    }

    try {
      const res = await fetch(CSV_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();

      const rows = parseCSV(text);
      if (rows.length < 2) {
        renderEmpty("Sem eventos para apresentar.");
        return;
      }

      const headers = rows[0].map((h) => h.trim().toLowerCase());
      const idx = (name) => headers.indexOf(name);

      const required = ["date", "event", "location", "time", "alternating"];
      const missing = required.filter((h) => idx(h) === -1);
      if (missing.length) {
        renderEmpty(`CSV inválido. Faltam colunas: ${missing.join(", ")}`);
        return;
      }

      const data = rows
        .slice(1)
        .map((cols) => {
          const obj = {};
          headers.forEach((h, i) => (obj[h] = cols[i] ?? ""));
          return normalizeEvent(obj);
        })
        .filter((e) => e.event || e.date || e.location || e.time || e.alternating);

      // ordenar por data (asc)
      data.sort((a, b) => toDateValue(a.date) - toDateValue(b.date));

      if (!data.length) {
        renderEmpty("Sem eventos para apresentar.");
        return;
      }

      // TABELA
      tableBody.innerHTML = data
        .map((e) => {
          const alt = e.alternating || "—";
          return `
            <tr>
              <td>${escapeHTML(formatDatePT(e.date))}</td>
              <td>${escapeHTML(e.event || "—")}${e.notes ? `<div class="table-note">${escapeHTML(e.notes)}</div>` : ""}</td>
              <td>${escapeHTML(e.location || "—")}</td>
              <td>${escapeHTML(e.time || "—")}</td>
              <td>${escapeHTML(alt)}</td>
            </tr>
          `;
        })
        .join("");

      // CARDS (MOBILE)
      cardsWrap.innerHTML = data
        .map((e) => {
          return `
            <div class="event-card">
              <strong>${escapeHTML(e.event || "Evento")}</strong>
              <div class="event-row"><span>Data</span><span>${escapeHTML(formatDatePT(e.date))}</span></div>
              <div class="event-row"><span>Local</span><span>${escapeHTML(e.location || "—")}</span></div>
              <div class="event-row"><span>Hora</span><span>${escapeHTML(e.time || "—")}</span></div>
              <div class="event-row"><span>Banda a alternar</span><span>${escapeHTML(e.alternating || "—")}</span></div>
              ${e.notes ? `<div class="event-note">${escapeHTML(e.notes)}</div>` : ""}
            </div>
          `;
        })
        .join("");

    } catch (err) {
      renderEmpty("Não foi possível carregar o calendário.");
      // opcional: console para debug
      console.warn("Calendar CSV load failed:", err);
    }
  }


  // ---------- bootstrap ----------
  document.addEventListener("DOMContentLoaded", () => {
    initYear();
    initMenu();
    initActiveNav();
    initThumbFallbacks();
    initCarousels();
    initTabs();
    initVideos();
    initCalendarFromCSV();
  });
})();
