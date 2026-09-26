(() => {
  const doc = document.documentElement;
  doc.classList.replace('no-js', 'js');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Header: logo sticker shrinks once the page leaves the top
  const header = document.querySelector('[data-header]');
  const sentinel = document.querySelector('[data-header-sentinel]');
  if (header && sentinel) {
    new IntersectionObserver(([entry]) => {
      header.classList.toggle('is-scrolled', !entry.isIntersecting);
    }).observe(sentinel);
  }

  // Mobile menu
  const toggle = document.querySelector('[data-nav-toggle]');
  if (header && toggle) {
    const setMenu = (open) => {
      header.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    toggle.addEventListener('click', () => setMenu(!header.classList.contains('is-open')));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && header.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
    });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });
  }

  // Scroll reveal: one pass per element, then stop observing
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      revealObserver.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
  document.querySelectorAll('[data-reveal], [data-reveal-stagger]').forEach((el) => revealObserver.observe(el));

  // Product finder (homepage): filter by core skill
  const grid = document.querySelector('[data-product-grid]');
  if (grid) {
    const chips = [...document.querySelectorAll('[data-skill-filter] .chip')];
    const products = [...grid.querySelectorAll('[data-skills]')];
    const status = document.querySelector('[data-filter-status]');
    const labels = { social: 'social interaction', motor: 'motor coordination', creativity: 'creativity', strategy: 'strategic thinking' };
    const skillsOf = (li) => li.dataset.skills.split(' ');

    chips.forEach((chip) => {
      const skill = chip.dataset.skill;
      chip.querySelector('.chip-count').textContent = skill === 'all'
        ? products.length
        : products.filter((p) => skillsOf(p).includes(skill)).length;
    });

    const applyFilter = (skill) => {
      let shown = 0;
      products.forEach((li) => {
        const match = skill === 'all' || skillsOf(li).includes(skill);
        li.hidden = !match;
        if (match) shown += 1;
      });
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.skill === skill)));
      status.textContent = skill === 'all'
        ? `Showing all ${shown} products`
        : `Showing ${shown} of ${products.length} products that build ${labels[skill]}`;
      grid.scrollTo({ left: 0 });
    };

    chips.forEach((chip) => chip.addEventListener('click', () => {
      if (chip.getAttribute('aria-pressed') === 'true') return;
      const run = () => applyFilter(chip.dataset.skill);
      if (document.startViewTransition && !reduce.matches) document.startViewTransition(run);
      else run();
    }));

    // Dice: roll, then spotlight a random product from the current filter
    const dice = document.querySelector('[data-dice]');
    let last = null;
    if (dice) dice.addEventListener('click', () => {
      const pool = products.filter((p) => !p.hidden && p !== last);
      const pick = pool[Math.floor(Math.random() * pool.length)];
      if (!pick) return;
      last = pick;
      products.forEach((p) => p.classList.remove('is-picked'));
      dice.classList.remove('is-rolling');
      void dice.offsetWidth;
      dice.classList.add('is-rolling');
      setTimeout(() => {
        pick.classList.add('is-picked');
        pick.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'center', inline: 'center' });
        const link = pick.querySelector('a');
        if (link) link.focus({ preventScroll: true });
        status.textContent = `The dice picked ${pick.querySelector('.tile-name').textContent}`;
      }, reduce.matches ? 0 : 520);
    });
  }

  // YouTube: open the video large in a dialog; the YouTube script only loads on click
  const player = document.querySelector('[data-player]');
  if (player && player.showModal) {
    const frameBox = player.querySelector('[data-player-frame]');
    const fsBtn = player.querySelector('[data-player-fs]');
    document.querySelectorAll('[data-yt]').forEach((link) => {
      link.addEventListener('click', (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        player.classList.toggle('is-vertical', !!link.closest('.yt--short'));
        player.querySelector('[data-player-title]').textContent = link.dataset.ytTitle;
        const id = link.dataset.yt;
        const origin = location.protocol === 'https:' ? `&origin=${encodeURIComponent(location.origin)}` : '';
        player.querySelector('[data-player-yt]').href = `https://www.youtube.com/watch?v=${id}`;
        const frame = document.createElement('iframe');
        // YouTube rejects embeds without a referrer (error 153), so send the page origin explicitly
        frame.referrerPolicy = 'strict-origin-when-cross-origin';
        frame.src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&playsinline=1&fs=1${origin}`;
        frame.title = link.dataset.ytTitle;
        frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen';
        frame.allowFullscreen = true;
        frameBox.replaceChildren(frame);
        player.showModal();
      });
    });
    player.querySelector('[data-player-close]').addEventListener('click', () => player.close());
    player.addEventListener('click', (e) => { if (e.target === player) player.close(); });
    player.addEventListener('close', () => frameBox.replaceChildren());
    const goFull = frameBox.requestFullscreen || frameBox.webkitRequestFullscreen;
    if (goFull) fsBtn.addEventListener('click', () => goFull.call(frameBox));
    else fsBtn.hidden = true;
  }

  // Flip cards: tap or keyboard shows the second photo (hover does it on desktop)
  document.querySelectorAll('.flip').forEach((btn) => {
    btn.addEventListener('click', () => btn.setAttribute('aria-pressed', String(btn.getAttribute('aria-pressed') !== 'true')));
  });

  const year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
