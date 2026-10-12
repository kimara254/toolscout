(() => {
  'use strict';
  document.documentElement.classList.add('js-enabled');

  const input = document.getElementById('tool-search');
  const form = document.getElementById('search-form');
  const grid = document.getElementById('tool-cards');
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll('.tool-card'));
  const empty = document.getElementById('no-results');
  const count = document.getElementById('result-count');
  const subtitle = document.getElementById('results-subtitle');
  const categoryButtons = Array.from(document.querySelectorAll('[data-filter]'));
  const sortButtons = Array.from(document.querySelectorAll('[data-sort]'));
  const quickButtons = Array.from(document.querySelectorAll('[data-quick-filter]'));
  const savedFilter = document.getElementById('saved-filter');
  const savedCount = document.getElementById('saved-count');
  const storageKey = 'toolscout-saved-guides-v2';

  let category = 'all';
  let sortMode = 'curated';
  let savedOnly = false;
  let saved = new Set();

  try { saved = new Set(JSON.parse(localStorage.getItem(storageKey) || '[]')); }
  catch (_) {}

  cards.forEach((card, index) => {
    card.dataset.originalIndex = String(index);
    const titleLink = card.querySelector('h3 a');
    const key = titleLink ? titleLink.getAttribute('href') : String(index);
    card.dataset.saveKey = key;

    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.className = 'save-guide';
    saveButton.dataset.saveGuide = key;
    saveButton.setAttribute('aria-pressed', String(saved.has(key)));
    saveButton.textContent = saved.has(key) ? '★ Saved' : '☆ Save guide';
    saveButton.classList.toggle('is-saved', saved.has(key));
    saveButton.setAttribute('aria-label', (saved.has(key) ? 'Remove saved guide: ' : 'Save guide: ') + (titleLink?.textContent.trim() || 'guide'));
    card.append(saveButton);
  });

  function saveStorage() {
    try { localStorage.setItem(storageKey, JSON.stringify([...saved])); }
    catch (_) {}
  }

  function updateCategoryButtons() {
    categoryButtons.forEach(button => {
      const active = (button.dataset.filter || 'all') === category;
      button.classList.toggle('is-active', active);
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    quickButtons.forEach(button => {
      button.classList.toggle('is-active', button.dataset.quickFilter === category);
    });
  }

  function updateSortButtons() {
    sortButtons.forEach(button => {
      const active = button.dataset.sort === sortMode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function updateCategoryCounts() {
    const countMap = new Map();
    cards.forEach(card => {
      const c = (card.dataset.category || '').toLowerCase();
      countMap.set(c, (countMap.get(c) || 0) + 1);
    });
    document.querySelectorAll('[data-count]').forEach(node => {
      const wanted = node.dataset.count;
      const number = wanted === 'all' ? cards.length : (countMap.get(wanted) || 0);
      node.textContent = String(number);
    });
    if (savedCount) savedCount.textContent = String(saved.size);
  }

  function update() {
    const query = (input?.value || '').trim().toLowerCase();
    const ordered = [...cards];

    if (sortMode === 'latest') {
      ordered.sort((a, b) => (b.dataset.date || '').localeCompare(a.dataset.date || ''));
    } else if (sortMode === 'az') {
      ordered.sort((a, b) => (a.querySelector('h3')?.textContent || '').localeCompare(b.querySelector('h3')?.textContent || ''));
    } else {
      ordered.sort((a, b) => Number(a.dataset.originalIndex) - Number(b.dataset.originalIndex));
    }

    let visible = 0;
    ordered.forEach(card => {
      const text = ((card.dataset.search || '') + ' ' + card.textContent).toLowerCase();
      const cardCategory = (card.dataset.category || '').toLowerCase();
      const categoryMatch = category === 'all' || cardCategory.includes(category);
      const queryMatch = !query || text.includes(query);
      const partnerMatch = sortMode !== 'partner' || card.dataset.partner === 'true';
      const savedMatch = !savedOnly || saved.has(card.dataset.saveKey);
      const show = categoryMatch && queryMatch && partnerMatch && savedMatch;
      card.hidden = !show;
      if (show) visible++;
    });

    grid.append(...ordered);
    if (empty) {
      empty.hidden = visible !== 0;
      if (sortMode === 'partner' && visible === 0) {
        empty.querySelector('h3').textContent = 'No partner guides found';
        empty.querySelector('p').textContent = 'There are no partner guides matching your current filters.';
      } else if (savedOnly && saved.size === 0) {
        empty.querySelector('h3').textContent = 'No saved guides yet';
        empty.querySelector('p').textContent = 'Select “Save guide” on any guide to keep it in your saved list.';
      } else {
        empty.querySelector('h3').textContent = 'No guides found';
        empty.querySelector('p').textContent = 'Try a different search or clear your filters to see the full collection.';
      }
      grid.append(empty);
    }
    if (count) count.textContent = `${visible} ${visible === 1 ? 'guide' : 'guides'}`;
    if (subtitle) {
      subtitle.textContent = savedOnly ? 'Your saved guides' :
        sortMode === 'partner' ? 'Partner-linked guides are clearly identified' :
        sortMode === 'latest' ? 'Recently published first' :
        sortMode === 'az' ? 'Alphabetical order' : 'Browse our current collection';
    }
    if (savedFilter) {
      savedFilter.classList.toggle('is-active', savedOnly);
      savedFilter.setAttribute('aria-pressed', String(savedOnly));
      savedFilter.firstChild.textContent = savedOnly ? '★ ' : '☆ ';
    }
  }

  function resetFilters() {
    category = 'all';
    sortMode = 'curated';
    savedOnly = false;
    if (input) input.value = '';
    updateCategoryButtons();
    updateSortButtons();
    update();
  }

  input?.addEventListener('input', update);
  form?.addEventListener('submit', event => {
    event.preventDefault();
    document.getElementById('directory')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    input?.blur();
  });

  categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
      category = button.dataset.filter || 'all';
      savedOnly = false;
      updateCategoryButtons();
      update();
    });
  });

  quickButtons.forEach(button => {
    button.addEventListener('click', () => {
      category = button.dataset.quickFilter || 'all';
      savedOnly = false;
      updateCategoryButtons();
      update();
      document.getElementById('directory')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  sortButtons.forEach(button => {
    button.addEventListener('click', () => {
      sortMode = button.dataset.sort || 'curated';
      savedOnly = false;
      updateSortButtons();
      update();
    });
  });

  savedFilter?.addEventListener('click', () => {
    savedOnly = !savedOnly;
    update();
    document.getElementById('directory')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-save-guide]');
    if (!button) return;
    const key = button.dataset.saveGuide;
    if (saved.has(key)) saved.delete(key);
    else saved.add(key);
    saveStorage();
    const isSaved = saved.has(key);
    button.classList.toggle('is-saved', isSaved);
    button.setAttribute('aria-pressed', String(isSaved));
    button.textContent = isSaved ? '★ Saved' : '☆ Save guide';
    const title = button.closest('.tool-card')?.querySelector('h3 a')?.textContent.trim() || 'guide';
    button.setAttribute('aria-label', (isSaved ? 'Remove saved guide: ' : 'Save guide: ') + title);
    updateCategoryCounts();
    update();
  });

  document.getElementById('clear-filters')?.addEventListener('click', resetFilters);
  document.getElementById('empty-reset')?.addEventListener('click', resetFilters);

  document.addEventListener('keydown', event => {
    const active = document.activeElement;
    const typing = active && (['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName) || active.isContentEditable);
    if (event.key === '/' && !typing && input) {
      event.preventDefault();
      input.focus();
    }
    if (event.key === 'Escape' && active === input && input.value) {
      input.value = '';
      update();
    }
  });

  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  progress.innerHTML = '<span></span>';
  document.body.append(progress);

  const topButton = document.createElement('button');
  topButton.type = 'button';
  topButton.className = 'back-to-top';
  topButton.setAttribute('aria-label', 'Back to top');
  topButton.textContent = '↑';
  document.body.append(topButton);
  topButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  let scrollPending = false;
  function onScroll() {
    if (scrollPending) return;
    scrollPending = true;
    window.requestAnimationFrame(() => {
      const root = document.documentElement;
      const range = root.scrollHeight - window.innerHeight;
      const percent = range > 0 ? (window.scrollY / range) * 100 : 0;
      progress.firstElementChild.style.width = `${Math.max(0, Math.min(100, percent))}%`;
      topButton.classList.toggle('is-visible', window.scrollY > 450);
      scrollPending = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  updateCategoryCounts();
  updateCategoryButtons();
  updateSortButtons();
  update();
})();
