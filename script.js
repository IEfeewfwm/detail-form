(() => {
  const menu = document.querySelector('.menu');
  const nav = document.querySelector('#nav');
  function closeMenu() { menu.setAttribute('aria-expanded', 'false'); nav.classList.remove('open'); }
  menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); nav.classList.toggle('open', open); });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav.classList.contains('open')) { closeMenu(); menu.focus(); } });
  const dialog = document.querySelector('#booking');
  const form = dialog.querySelector('form');
  const success = dialog.querySelector('.success');
  let opener;
  document.querySelectorAll('[data-book]').forEach(button => button.addEventListener('click', () => {
    opener = button; form.reset(); form.hidden = false; success.hidden = true;
    form.querySelectorAll('[aria-invalid]').forEach(input => input.removeAttribute('aria-invalid'));
    form.querySelectorAll('.error').forEach(error => error.textContent = '');
    if (button.dataset.service) form.elements.service.value = button.dataset.service;
    dialog.showModal(); form.elements.name.focus();
  }));
  dialog.querySelector('.close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => opener?.focus());
  form.addEventListener('submit', event => {
    event.preventDefault();
    const name = form.elements.name;
    const phone = form.elements.phone;
    const digits = phone.value.replace(/\D/g, '');
    const errors = [[name, name.value.trim().length < 2 ? 'Введите имя: не менее двух символов.' : ''], [phone, !/^[+\d\s()–-]+$/.test(phone.value) || digits.length < 10 || digits.length > 15 ? 'Введите телефон: от 10 до 15 цифр.' : '']];
    errors.forEach(([input, message]) => { input.setAttribute('aria-invalid', String(Boolean(message))); document.querySelector('#' + input.id + '-error').textContent = message; });
    const first = errors.find(([,message]) => message);
    if (first) { first[0].focus(); return; }
    form.hidden = true; success.hidden = false; form.reset(); success.focus();
  });
  form.querySelectorAll('input').forEach(input => input.addEventListener('input', () => {
    if (input.getAttribute('aria-invalid') === 'true') {
      input.removeAttribute('aria-invalid');
      document.querySelector('#' + input.id + '-error').textContent = '';
    }
  }));
  document.addEventListener('click', event => {
    if (!nav.contains(event.target) && !menu.contains(event.target)) closeMenu();
  });
  const desktop = matchMedia('(min-width: 651px)');
  desktop.addEventListener('change', closeMenu);

  // The image button is added only when its viewer can work.
  const viewer = document.querySelector('#photo-viewer');
  const figures = [...document.querySelectorAll('.gallery-grid figure')];
  let photoIndex = 0;
  let photoOpener;
  function showPhoto(index) {
    photoIndex = (index + figures.length) % figures.length;
    const source = figures[photoIndex].querySelector('img');
    const image = viewer.querySelector('.viewer-image');
    image.src = source.src; image.alt = source.alt;
    viewer.querySelector('.viewer-counter').textContent = `${photoIndex + 1} / ${figures.length}`;
    viewer.querySelector('#photo-caption').textContent = figures[photoIndex].querySelector('figcaption span').textContent;
  }
  figures.forEach((figure, index) => {
    const image = figure.querySelector('img');
    const button = document.createElement('button');
    button.className = 'gallery-photo'; button.type = 'button';
    button.setAttribute('aria-label', 'Увеличить: ' + image.alt);
    const icon = document.createElement('span');
    icon.className = 'enlarge'; icon.textContent = '↗'; icon.setAttribute('aria-hidden', 'true');
    image.before(button); button.append(image, icon);
    button.addEventListener('click', () => {
      photoOpener = button; showPhoto(index); viewer.showModal();
      viewer.querySelector('.viewer-close').focus();
    });
  });
  viewer.querySelector('.viewer-prev').addEventListener('click', () => showPhoto(photoIndex - 1));
  viewer.querySelector('.viewer-next').addEventListener('click', () => showPhoto(photoIndex + 1));
  viewer.querySelector('.viewer-close').addEventListener('click', () => viewer.close());
  viewer.addEventListener('close', () => photoOpener?.focus());
  viewer.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); showPhoto(photoIndex + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
  // Mark the visible section without a continuous scroll handler.
  const links = [...nav.querySelectorAll('a')];
  const sections = links.map(link => document.querySelector(link.hash));
  if ('IntersectionObserver' in window) {
    const visible = new Set();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target));
      const active = sections.find(section => visible.has(section));
      links.forEach(link => active && link.hash === '#' + active.id ? link.setAttribute('aria-current', 'location') : link.removeAttribute('aria-current'));
    }, {rootMargin:'-100px 0px -45% 0px', threshold:0});
    sections.forEach(section => observer.observe(section));
  }
})();
