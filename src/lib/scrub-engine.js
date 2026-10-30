/* eslint-disable @typescript-eslint/no-unused-expressions -- vendored runtime, `cb && cb()` style kept as upstream */
/* Copied from the living-site skill runtime (engine.js), minus its own rAF loop.
   Shared motion engine for the scroll-film sites.
   Scrub(opts)  — canvas + pre-extracted JPEG frames scrubbed by a scroll driver.
                  ImageBitmap sliding window (off-thread decode), lerped playhead, nearest-frame fallback.
   Loop(canvas, render) — a code-drawn loop: render(ctx, t, w, h, dpr). Runs only on screen and while
                  Motion is not 'off'; in 'off' it paints one still frame (t = opts.still).
   One shared rAF for everything. Dev contract: ?jump=<y> and window.__ready. */
(function () {
  const Q = new URLSearchParams(location.search);
  const JUMP = Q.get('jump');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = new Set();
  let last = performance.now();
  const jank = { deltas: [] };

  function tick(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    jank.deltas.push(dt * 1000); if (jank.deltas.length > 240) jank.deltas.shift();
    for (const it of items) { try { it.tick(dt, now); } catch (e) { console.error(e); } }
  }
  // No loop of its own: the landing steps it from gsap.ticker, so Lenis, ScrollTrigger and the film share one RAF.

  const moving = () => !window.Motion || window.Motion.moving;

  function Scrub(o) {
    const canvas = o.canvas, ctx = canvas.getContext('2d', { alpha: false });
    const N = o.count, fps = o.fps || 24, CONC = o.concurrency || 6;
    // Decoded frames cost w*h*4 bytes each, so only a window around the playhead stays decoded. Encoded JPEGs are
    // cheap, so they are fetched a little further ahead. Everything outside both windows is released.
    const AHEAD = Math.max(2, Math.round((o.aheadSec ?? 0.75) * fps)), BEHIND = Math.max(2, Math.round((o.behindSec ?? 0.5) * fps));
    const LOAD_AHEAD = AHEAD * 2;
    const canBitmap = typeof createImageBitmap === 'function' && typeof ImageBitmap === 'function';
    const images = new Array(N).fill(null);   // loaded HTMLImageElements, only inside the load window
    const loading = new Map(), bitmaps = new Map(), decoding = new Set();
    let center = 0, current = 0, target = 0, displayed = -1, progress = 0, nLoaded = 0, misses = 0, disposed = false;
    const maxCrop = o.maxCrop ?? 0.22;
    let cw = 0, ch = 0, blendF = 0, lastBlend = -1;
    const inDecode = (i) => i >= center - BEHIND && i <= center + AHEAD;
    const inLoad = (i) => i >= center - BEHIND && i <= center + LOAD_AHEAD;
    const ready = (i) => bitmaps.has(i) || images[i] !== null;

    function releaseImage(i) {
      const im = images[i]; if (!im) return;
      images[i] = null; im.onload = im.onerror = null; im.removeAttribute('src');
    }
    function closeBitmap(i) {
      const b = bitmaps.get(i); if (!b) return;
      bitmaps.delete(i); if (displayed === i) displayed = -1;   // drop it from the map before closing, so draw never sees it
      b.close();
    }
    function resize() {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(o.dpr || 1, devicePixelRatio || 1);
      cw = Math.max(2, Math.round(r.width * dpr)); ch = Math.max(2, Math.round(r.height * dpr));
      if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; displayed = -1; }
    }
    function nearest(i) {
      for (let d = 1; d <= LOAD_AHEAD + BEHIND; d++) {
        if (i - d >= 0 && ready(i - d)) return i - d;
        if (i + d < N && ready(i + d)) return i + d;
      }
      return -1;
    }
    function draw(i, force) {
      if (disposed || (i === displayed && !force)) return;
      const k = ready(i) ? i : nearest(i);
      if (k < 0) return;   // nothing ready yet: keep the last painted pixels
      if (k !== i) misses++;
      const src = bitmaps.get(k) || images[k];
      const w0 = src.width || src.naturalWidth, h0 = src.height || src.naturalHeight;
      if (!w0 || !h0) return;
      const sCover = Math.max(cw / w0, ch / h0);
      const crop = 1 - Math.min(cw / (w0 * sCover), ch / (h0 * sCover));
      const s = (o.cover || crop <= maxCrop) ? sCover : Math.min(cw / w0, ch / h0);
      const w = w0 * s, h = h0 * s;
      if (s !== sCover) { ctx.fillStyle = o.bg || '#000'; ctx.fillRect(0, 0, cw, ch); }
      ctx.drawImage(src, (cw - w) / 2 + (o.offsetX || 0) * cw, (ch - h) / 2, w, h);
      // blend: lay the next frame over at the playhead's fraction, so slow scrolls glide instead of step
      if (blendF > 0.02 && k === i && i + 1 < N && ready(i + 1)) {
        const nx = bitmaps.get(i + 1) || images[i + 1];
        ctx.globalAlpha = blendF; ctx.drawImage(nx, (cw - w) / 2 + (o.offsetX || 0) * cw, (ch - h) / 2, w, h); ctx.globalAlpha = 1;
      }
      displayed = k === i ? i : -1;
      o.onDraw && o.onDraw(ctx, cw, ch, k);
    }
    function decode(i) {
      if (!canBitmap || disposed || bitmaps.has(i) || decoding.has(i) || !images[i] || !inDecode(i)) return;
      const img = images[i];
      decoding.add(i);
      createImageBitmap(img).then(b => {
        decoding.delete(i);
        // a late decode for a frame that left the window (or a duplicate) is closed straight away
        if (disposed || !inDecode(i) || bitmaps.has(i)) { b.close(); return; }
        bitmaps.set(i, b);
        if (images[i] === img) releaseImage(i);   // the bitmap replaces the element; the HTTP cache keeps the JPEG
        if (i === Math.floor(current) || i === Math.floor(current) + 1) draw(Math.floor(current), true);
      }).catch(() => decoding.delete(i));
    }
    function pump() {
      if (disposed) return;
      // nearest frames first, ahead before behind
      for (let d = 0; d <= LOAD_AHEAD && loading.size < CONC; d++) {
        for (const i of d === 0 ? [center] : [center + d, center - d]) {
          if (loading.size >= CONC) break;
          if (i < 0 || i >= N || !inLoad(i) || ready(i) || loading.has(i)) continue;
          const img = new Image(); img.decoding = 'async';
          loading.set(i, img);
          img.onload = () => {
            if (loading.get(i) !== img) return;
            loading.delete(i);
            if (disposed || !inLoad(i) || ready(i)) { img.onload = img.onerror = null; img.removeAttribute('src'); pump(); return; }
            images[i] = img; nLoaded++; o.onLoad && o.onLoad(nLoaded / N);
            if (i === 0 && displayed < 0) resize();
            if (canBitmap) decode(i);
            if (i === Math.floor(current) || displayed < 0) draw(Math.floor(current), true);
            pump();
          };
          img.onerror = () => { if (loading.get(i) === img) loading.delete(i); pump(); };
          img.src = o.src(i);
        }
      }
    }
    function setCenter(c) {
      c = Math.max(0, Math.min(N - 1, c));
      if (c === center && (ready(c) || loading.has(c))) return;
      center = c;
      for (const k of Array.from(bitmaps.keys())) if (!inDecode(k)) closeBitmap(k);
      for (let i = 0; i < N; i++) if (images[i] && !inLoad(i)) releaseImage(i);
      for (const [i, img] of Array.from(loading)) if (!inLoad(i)) { loading.delete(i); img.onload = img.onerror = null; img.removeAttribute('src'); }
      for (let i = Math.max(0, c - BEHIND); i <= Math.min(N - 1, c + AHEAD); i++) decode(i);
      pump();
    }

    function measure() {
      const r = o.driver.getBoundingClientRect();
      const span = r.height - innerHeight;
      return span <= 0 ? 0 : Math.max(0, Math.min(1, -r.top / span));
    }
    let lastY = NaN;   // the scroll offset of the last tick: no scroll and no glide left means nothing to do
    const onResize = () => { lastY = NaN; resize(); draw(Math.floor(current), true); };
    const api = {
      get progress() { return progress; }, get frame() { return current; }, get loadedFraction() { return nLoaded / N; },
      canvas, resize, settle() { progress = measure(); target = current = progress * (N - 1); setCenter(Math.floor(current)); draw(Math.floor(current), true); o.onProgress && o.onProgress(progress, current); },
      showFrame(i) { current = target = i; blendF = 0; setCenter(i); draw(i, true); },
      stats() {
        let bytes = 0; for (const b of bitmaps.values()) bytes += b.width * b.height * 4;
        return { bitmaps: bitmaps.size, images: images.filter(Boolean).length, loading: loading.size, decodedMB: +(bytes / 1048576).toFixed(1), misses, window: AHEAD + BEHIND + 1 };
      },
      dispose() {
        disposed = true; items.delete(api); removeEventListener('resize', onResize);
        for (const [, img] of loading) { img.onload = img.onerror = null; img.removeAttribute('src'); }
        loading.clear();
        for (const k of Array.from(bitmaps.keys())) closeBitmap(k);
        for (let i = 0; i < N; i++) releaseImage(i);
      },
      tick() {
        if (disposed || (o.frozen && o.frozen())) return;
        if (scrollY === lastY && current === target) return;
        lastY = scrollY;
        progress = measure();
        target = progress * (N - 1);
        current += (target - current) * (reduced ? 1 : (o.lerp || 0.14));
        if (Math.abs(target - current) < 0.01) current = target;
        const i0 = Math.floor(current);
        setCenter(i0);
        if (o.blend) {
          blendF = current - i0;
          const q = Math.round(blendF * 24);
          draw(i0, q !== lastBlend); lastBlend = q;
        } else draw(Math.round(current));
        o.onProgress && o.onProgress(progress, current);
      }
    };
    // pull every frame's bytes into the HTTP cache in film order, four at a time, so a fast scroll never waits on the network;
    // decoded memory stays bounded by the windows above
    if (o.prefetch) { let next = 0; const run = () => { if (disposed || next >= N) return; const i = next++; fetch(o.src(i), { priority: 'low' }).catch(() => {}).finally(run); }; for (let k = 0; k < 4; k++) run(); }
    addEventListener('resize', onResize);
    resize();
    pump();
    items.add(api);
    return api;
  }

  function Loop(canvas, render, opts = {}) {
    const ctx = canvas.getContext('2d');
    let visible = false, t = opts.start || 0, w = 0, h = 0, dpr = 1, paintedStill = false;
    function resize() {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(opts.dpr || 2, devicePixelRatio || 1);
      w = r.width; h = r.height;
      canvas.width = Math.max(2, Math.round(w * dpr)); canvas.height = Math.max(2, Math.round(h * dpr));
      paintedStill = false; paint(t);
    }
    function paint(tt) { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); render(ctx, tt, w, h, dpr); }
    new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { rootMargin: '120px' }).observe(canvas);
    new ResizeObserver(resize).observe(canvas);
    const api = {
      get t() { return t; },
      tick(dt) {
        if (!visible) return;
        if (!moving() || reduced) {
          if (!paintedStill) { paint(opts.still ?? 0); paintedStill = true; }
          return;
        }
        paintedStill = false;
        t += dt * (opts.speed || 1);
        paint(t);
      }
    };
    items.add(api);
    return api;
  }

  function ready(fn) {
    const done = () => {
      if (JUMP !== null) { history.scrollRestoration = 'manual'; scrollTo(0, +JUMP || 0); }
      fn && fn();
      requestAnimationFrame(() => requestAnimationFrame(() => { window.__ready = true; }));
    };
    done();
  }

  window.MotionEngine = {
    Scrub, Loop, ready, JUMP, reduced, step: () => tick(performance.now()),
    jank() { const d = [...jank.deltas].sort((a, b) => a - b); return { p95: d[Math.floor(d.length * 0.95)] | 0, max: d[d.length - 1] | 0 }; }
  };
})();
