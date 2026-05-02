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

  // ── 2. Reveal-on-scroll ───────────────────────────────────────
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reveals = document.querySelectorAll('.reveal');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
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
})();
