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
    const products = [...grid.querySelectorAll('.product')];
    const status = document.querySelector('[data-filter-status]');
    const labels = { social: 'social interaction', motor: 'motor coordination', creativity: 'creativity', strategy: 'strategic thinking' };
    const skillsOf = (li) => li.dataset.skills.split(' ');

    chips.forEach((chip) => {
      const skill = chip.dataset.skill;
      if (skill !== 'all') chip.querySelector('.chip-count').textContent = products.filter((p) => skillsOf(p).includes(skill)).length;
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
  }

  const year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
