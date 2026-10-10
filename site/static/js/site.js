(() => {
  const input = document.getElementById('tool-search');
  const cards = Array.from(document.querySelectorAll('.tool-card'));
  const buttons = Array.from(document.querySelectorAll('[data-filter]'));
  const empty = document.getElementById('no-results');
  const count = document.getElementById('result-count');

  if (!input || !cards.length) return;

  let category = 'all';

  function update() {
    const query = input.value.trim().toLowerCase();
    let visible = 0;

    cards.forEach((card) => {
      const text = (card.dataset.search || '').toLowerCase();
      const cardCategory = (card.dataset.category || '').toLowerCase();
      const categoryMatch = category === 'all' ||
        cardCategory.includes(category) ||
        (category === 'productivity' && cardCategory.includes('productivity'));
      const queryMatch = !query || text.includes(query);
      const show = categoryMatch && queryMatch;
      card.hidden = !show;
      if (show) visible++;
    });

    if (empty) empty.hidden = visible !== 0;
    if (count) count.textContent = `${visible} ${visible === 1 ? 'guide' : 'guides'}`;
  }

  input.addEventListener('input', update);

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      category = button.dataset.filter || 'all';
      buttons.forEach((item) => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      update();
    });
  });

  update();
})();
