/* ----------------------------------------------------------------
   Fluence — small client-side enhancements

   Kept dependency-free on purpose. Three things:
     1. Year stamp in the footer.
     2. Reveal-on-scroll for elements with .reveal.
     3. In-page tab switcher for sections with [data-tabs].

   Tab markup contract:
     <div data-tabs>
       <div class="tabs" role="tablist">
         <button class="tab" role="tab" data-tab="visuals" aria-selected="true">Visuals</button>
         <button class="tab" role="tab" data-tab="media">Media</button>
       </div>
       <div class="tab-panel" data-tab-panel="visuals" data-active="true">…</div>
       <div class="tab-panel" data-tab-panel="media">…</div>
     </div>
---------------------------------------------------------------- */

(() => {
  // ── 1. Year stamp ─────────────────────────────────────────────
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // ── 2. Reveal-on-scroll (progressive enhancement) ────────────
  // Default: content is visible. We only opt elements into the
  // fade-in by adding .is-revealable, so if anything below fails,
  // content is never trapped at opacity:0.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reveals = document.querySelectorAll('.reveal');

  if (!reduceMotion && 'IntersectionObserver' in window) {
    // Hide-then-fade-in only when we can guarantee the IO fires.
    reveals.forEach((el) => el.classList.add('is-revealable'));

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.05, rootMargin: '0px 0px -10% 0px' }
    );
    reveals.forEach((el) => io.observe(el));
  }

  // ── 3. Tabs ───────────────────────────────────────────────────
  document.querySelectorAll('[data-tabs]').forEach((root) => {
    const tabs = root.querySelectorAll('[data-tab]');
    const panels = root.querySelectorAll('[data-tab-panel]');

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-tab');
        tabs.forEach((t) => t.setAttribute('aria-selected', t === tab ? 'true' : 'false'));
        panels.forEach((p) => {
          const match = p.getAttribute('data-tab-panel') === target;
          if (match) p.setAttribute('data-active', 'true');
          else p.removeAttribute('data-active');
        });
      });
    });
  });

  // ── 4. Scroll-tied crossfades ─────────────────────────────────
  // For each [data-scrolly] element, set --scrolly-fade (0..1) on
  // it based on how far through the viewport its bounding box has
  // travelled. CSS uses that to drive opacity on the two stacked
  // images. Skipped entirely under prefers-reduced-motion (the CSS
  // handles the fallback layout).
  if (!reduceMotion) {
    const scrollyEls = document.querySelectorAll('[data-scrolly]');
    if (scrollyEls.length) {
      const FADE_START = 0.30;
      const FADE_END   = 0.70;
      let rafScheduled = false;

      const update = () => {
        rafScheduled = false;
        const vh = window.innerHeight;
        scrollyEls.forEach((el) => {
          const rect = el.getBoundingClientRect();
          const range = rect.height + vh;
          const traveled = vh - rect.top;
          const progress = Math.max(0, Math.min(1, traveled / range));
          let fade;
          if (progress <= FADE_START) fade = 0;
          else if (progress >= FADE_END) fade = 1;
          else fade = (progress - FADE_START) / (FADE_END - FADE_START);
          el.style.setProperty('--scrolly-fade', fade.toFixed(3));
          el.setAttribute('data-fade', fade < 0.5 ? 'a' : 'b');
        });
      };

      const onScroll = () => {
        if (rafScheduled) return;
        rafScheduled = true;
        requestAnimationFrame(update);
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      update();
    }
  }
})();
