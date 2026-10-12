(() => {
  const input = document.getElementById('tool-search');
  const cards = Array.from(document.querySelectorAll('.tool-card'));
  const filterBar = document.querySelector('.filters');
  const originalButtons = Array.from(document.querySelectorAll('[data-filter]'));
  const empty = document.getElementById('no-results');
  const count = document.getElementById('result-count');
  const storageKey = 'toolscout-saved-guides-v1';

  let category = 'all';
  let savedOnly = false;
  let saved = new Set();

  try {
    saved = new Set(JSON.parse(localStorage.getItem(storageKey) || '[]'));
  } catch (_) {}

  const save = () => {
    try { localStorage.setItem(storageKey, JSON.stringify([...saved])); } catch (_) {}
  };

  cards.forEach((card, index) => {
    const link = card.querySelector('h3 a');
    const url = link ? link.getAttribute('href') : '';
    const key = url || link?.textContent?.trim() || String(index);
    card.dataset.saveKey = key;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'save-guide';
    button.dataset.saveGuide = key;
    button.setAttribute('aria-pressed', String(saved.has(key)));
    button.textContent = saved.has(key) ? '★ Saved' : '☆ Save guide';
    button.classList.toggle('is-saved', saved.has(key));
    button.setAttribute('aria-label', (saved.has(key) ? 'Remove saved guide: ' : 'Save guide: ') + (link?.textContent.trim() || 'this guide'));
    card.append(button);
  });

  let savedButton;
  if (filterBar) {
    savedButton = document.createElement('button');
    savedButton.type = 'button';
    savedButton.className = 'filter-btn saved-filter';
    savedButton.dataset.savedFilter = 'true';
    savedButton.setAttribute('aria-pressed', 'false');
    savedButton.textContent = '★ Saved guides';
    filterBar.append(savedButton);
  }

  function update() {
    const query = (input?.value || '').trim().toLowerCase();
    let visible = 0;

    cards.forEach((card) => {
      const text = ((card.dataset.search || '') + ' ' + card.textContent).toLowerCase();
      const cardCategory = (card.dataset.category || '').toLowerCase();
      const categoryMatch = category === 'all' || cardCategory.includes(category);
      const queryMatch = !query || text.includes(query);
      const savedMatch = !savedOnly || saved.has(card.dataset.saveKey);
      const show = categoryMatch && queryMatch && savedMatch;
      card.hidden = !show;
      if (show) visible++;
    });

    if (empty) {
      empty.hidden = visible !== 0;
      empty.textContent = savedOnly && saved.size === 0
        ? 'No saved guides yet. Choose “Save guide” on any guide to keep it here.'
        : 'No matching guides yet. Try another search or category.';
    }
    if (count) count.textContent = `${visible} ${visible === 1 ? 'guide' : 'guides'}`;
    if (savedButton) {
      savedButton.classList.toggle('active', savedOnly);
      savedButton.setAttribute('aria-pressed', String(savedOnly));
    }
  }

  input?.addEventListener('input', update);

  originalButtons.forEach((button) => {
    button.addEventListener('click', () => {
      category = button.dataset.filter || 'all';
      savedOnly = false;
      originalButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      update();
    });
  });

  savedButton?.addEventListener('click', () => {
    savedOnly = !savedOnly;
    originalButtons.forEach((item) => {
      const active = !savedOnly && (item.dataset.filter || 'all') === category;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    update();
    document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-save-guide]');
    if (!button) return;

    const key = button.dataset.saveGuide;
    if (saved.has(key)) saved.delete(key);
    else saved.add(key);
    save();

    const isSaved = saved.has(key);
    button.classList.toggle('is-saved', isSaved);
    button.setAttribute('aria-pressed', String(isSaved));
    button.textContent = isSaved ? '★ Saved' : '☆ Save guide';
    const title = button.closest('.tool-card')?.querySelector('h3 a')?.textContent.trim() || 'this guide';
    button.setAttribute('aria-label', (isSaved ? 'Remove saved guide: ' : 'Save guide: ') + title);
    update();
  });

  // "/" focuses search; Escape clears it.
  document.addEventListener('keydown', (event) => {
    const tag = document.activeElement?.tagName;
    const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || document.activeElement?.isContentEditable;
    if (event.key === '/' && !typing && input) {
      event.preventDefault();
      input.focus();
    }
    if (event.key === 'Escape' && document.activeElement === input && input.value) {
      input.value = '';
      update();
    }
  });

  // Reading progress and back-to-top.
  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  progress.innerHTML = '<span></span>';
  document.body.append(progress);

  const topButton = document.createElement('button');
  topButton.className = 'back-to-top';
  topButton.type = 'button';
  topButton.setAttribute('aria-label', 'Back to top');
  topButton.title = 'Back to top';
  topButton.textContent = '↑';
  document.body.append(topButton);
  topButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  let ticking = false;
  const updateScroll = () => {
    const doc = document.documentElement;
    const range = doc.scrollHeight - window.innerHeight;
    const percent = range > 0 ? (window.scrollY / range) * 100 : 0;
    progress.firstElementChild.style.width = `${Math.min(100, Math.max(0, percent))}%`;
    topButton.classList.toggle('is-visible', window.scrollY > 500);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateScroll);
      ticking = true;
    }
  }, { passive: true });
  updateScroll();

  // Reveal sections only when they enter the viewport.
  const revealItems = document.querySelectorAll('.promo-card, .value-item, .tool-card');
  revealItems.forEach((item) => item.classList.add('reveal'));
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          instance.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-revealed'));
  }

  update();
})();
