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

  // ── 5. Blend mode demo cycle ──────────────────────────────────
  // Walks a fixed list of CSS mix-blend-mode values on the
  // foreground layer of [data-bm-cycle], crossfading between two
  // stacked foregrounds so the change reads as smooth, not a jump.
  // Pauses when off-screen and on hover so the user can dwell.
  if (!reduceMotion) {
    document.querySelectorAll('[data-bm-cycle]').forEach((stage) => {
      const a = stage.querySelector('.bm-stage__fg--a');
      const b = stage.querySelector('.bm-stage__fg--b');
      const nameEl = stage.querySelector('.bm-stage__name');
      if (!a || !b || !nameEl) return;

      const modes = [
        { mode: 'screen',      label: 'Screen' },
        { mode: 'multiply',    label: 'Multiply' },
        { mode: 'difference',  label: 'Difference' },
        { mode: 'normal',      label: 'Normal' },
        { mode: 'overlay',     label: 'Overlay' },
      ];

      let idx = 0;
      let activeIsA = true;
      a.style.mixBlendMode = modes[0].mode;
      nameEl.textContent = modes[0].label;
      stage.setAttribute('data-active', 'a');

      let intervalId = null;
      let paused = false;

      const tick = () => {
        if (paused) return;
        idx = (idx + 1) % modes.length;
        const next = modes[idx];
        const inactive = activeIsA ? b : a;
        inactive.style.mixBlendMode = next.mode;
        // Two RAFs: ensure the mode is committed before the active swap
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            stage.setAttribute('data-active', activeIsA ? 'b' : 'a');
            activeIsA = !activeIsA;
          });
        });
        // Label crossfade — fade out, swap text, fade back in
        nameEl.style.opacity = '0';
        setTimeout(() => {
          nameEl.textContent = next.label;
          nameEl.style.opacity = '1';
        }, 350);
      };

      const start = () => { if (!intervalId) intervalId = setInterval(tick, 3500); };
      const stop  = () => { if (intervalId) { clearInterval(intervalId); intervalId = null; } };

      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          for (const entry of entries) entry.isIntersecting ? start() : stop();
        }, { threshold: 0.1 });
        io.observe(stage);
      } else {
        start();
      }

      stage.addEventListener('mouseenter', () => { paused = true; });
      stage.addEventListener('mouseleave', () => { paused = false; });
    });
  }

  // ── 6. Transitions demo cycle ────────────────────────────────
  // Two stacked clip layers cycle through cut, fade, wipe, push.
  // WAAPI is used so each transition is a self-contained
  // animation; styles get reset to a clean baseline before each
  // run, so transitions don't fight each other's leftover state.
  if (!reduceMotion) {
    document.querySelectorAll('[data-tx-cycle]').forEach((stage) => {
      const a = stage.querySelector('.tx-stage__clip--a');
      const b = stage.querySelector('.tx-stage__clip--b');
      const nameEl = stage.querySelector('.tx-stage__name');
      if (!a || !b || !nameEl) return;

      const transitions = [
        { type: 'cut',  label: 'Cut' },
        { type: 'fade', label: 'Fade' },
        { type: 'wipe', label: 'Wipe' },
        { type: 'push', label: 'Push' },
      ];

      const DWELL_MS    = 2200;
      const DURATION_MS = 900;

      // Start with A on top, B underneath. Both opaque.
      let currentIsA = true;
      let txIdx = 0;
      let timeoutId = null;
      let stopped = false;
      let paused = false;
      let running = false;

      // Reset clears INLINE first then cancels animations.
      // Order matters: if we cancelled first while fill:forwards
      // was holding the end state, computed value would briefly
      // fall back to the FROM-value inline style before we cleared
      // it. Clearing inline first keeps the animation in charge of
      // the visible state until the cancel fully takes over.
      const reset = (clip) => {
        clip.style.opacity = '';
        clip.style.transform = '';
        clip.style.clipPath = '';
        clip.style.zIndex = '';
        clip.getAnimations().forEach((anim) => anim.cancel());
      };

      // Initial state: A on top
      reset(a);
      reset(b);
      a.style.zIndex = '2';
      b.style.zIndex = '1';
      nameEl.textContent = transitions[0].label;

      // Run an animation, then commit its end state to inline so
      // we don't depend on fill:forwards hanging around between
      // transitions.
      const runAndCommit = async (clip, keyframes, options, endStyle) => {
        const anim = clip.animate(keyframes, { ...options, fill: 'forwards' });
        try {
          await anim.finished;
        } finally {
          Object.assign(clip.style, endStyle);
          anim.cancel();
        }
      };

      const runTransition = async (fromClip, toClip, type) => {
        // Clean slate
        reset(fromClip);
        reset(toClip);
        // Layering: incoming on top
        toClip.style.zIndex = '2';
        fromClip.style.zIndex = '1';
        // Force reflow so resets apply before the new animation starts
        void toClip.offsetWidth;

        if (type === 'cut') {
          fromClip.style.opacity = '0';
          return;
        }
        if (type === 'fade') {
          toClip.style.opacity = '0';
          void toClip.offsetWidth;
          await runAndCommit(
            toClip,
            [{ opacity: 0 }, { opacity: 1 }],
            { duration: DURATION_MS, easing: 'ease' },
            { opacity: '1' }
          );
          return;
        }
        if (type === 'wipe') {
          toClip.style.clipPath = 'inset(0 100% 0 0)';
          void toClip.offsetWidth;
          await runAndCommit(
            toClip,
            [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }],
            { duration: DURATION_MS, easing: 'ease' },
            { clipPath: 'inset(0 0 0 0)' }
          );
          return;
        }
        if (type === 'push') {
          toClip.style.transform = 'translateX(100%)';
          void toClip.offsetWidth;
          const easing = 'cubic-bezier(0.4, 0, 0.2, 1)';
          await Promise.all([
            runAndCommit(
              toClip,
              [{ transform: 'translateX(100%)' }, { transform: 'translateX(0)' }],
              { duration: DURATION_MS, easing },
              { transform: 'translateX(0)' }
            ),
            runAndCommit(
              fromClip,
              [{ transform: 'translateX(0)' }, { transform: 'translateX(-100%)' }],
              { duration: DURATION_MS, easing },
              { transform: 'translateX(-100%)' }
            ),
          ]);
        }
      };

      const tick = async () => {
        if (running || paused || stopped) return;
        running = true;
        const transition = transitions[txIdx % transitions.length];
        txIdx++;

        const fromClip = currentIsA ? a : b;
        const toClip   = currentIsA ? b : a;

        // Label crossfade
        nameEl.style.opacity = '0';
        setTimeout(() => {
          nameEl.textContent = transition.label;
          nameEl.style.opacity = '1';
        }, 220);

        try {
          await runTransition(fromClip, toClip, transition.type);
        } catch (e) {
          // animation cancelled (e.g., paused) — fine
        }

        currentIsA = !currentIsA;
        running = false;
      };

      const schedule = () => {
        if (stopped) return;
        timeoutId = setTimeout(async () => {
          await tick();
          schedule();
        }, DWELL_MS);
      };

      const start = () => { if (!timeoutId && !stopped) { stopped = false; schedule(); } };
      const stop  = () => { stopped = true; if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; } };

      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              stopped = false;
              if (!timeoutId) schedule();
            } else {
              stop();
            }
          }
        }, { threshold: 0.1 });
        io.observe(stage);
      } else {
        schedule();
      }

      stage.addEventListener('mouseenter', () => { paused = true; });
      stage.addEventListener('mouseleave', () => { paused = false; });
    });
  }
})();
