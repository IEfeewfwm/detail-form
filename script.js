(() => {
  // Separate fixed control panels from each dialog's native scroll area.
  const booking = document.querySelector('#booking');
  const bookingForm = booking.querySelector('form');
  bookingForm.id = 'booking-form';
  const submitButton = bookingForm.querySelector('[type="submit"]');
  submitButton.setAttribute('form', bookingForm.id);
  const bookingTop = document.createElement('div');
  bookingTop.className = 'modal-top';
  bookingTop.append(booking.querySelector('.eyebrow'), booking.querySelector('.close'));
  const bookingScroll = document.createElement('div');
  bookingScroll.className = 'modal-scroll';
  bookingScroll.append(...booking.childNodes);
  const bookingFooter = document.createElement('div');
  bookingFooter.className = 'modal-footer';
  bookingFooter.append(submitButton);
  booking.append(bookingTop, bookingScroll, bookingFooter);

  const photos = document.querySelector('#photo-viewer');
  const photoTop = photos.querySelector('.viewer-top');
  const photoScroll = document.createElement('div');
  photoScroll.className = 'modal-scroll viewer-scroll';
  photoScroll.append(photos.querySelector('.viewer-image'));
  const photoFooter = document.createElement('div');
  photoFooter.className = 'viewer-footer';
  photoFooter.append(photos.querySelector('.viewer-bottom'), photos.querySelector('.viewer-note'));
  photos.replaceChildren(photoTop, photoScroll, photoFooter);

  let savedPageX = 0;
  let savedPageY = 0;
  let viewportFrame = 0;
  const root = document.documentElement;
  function updateModalViewport() {
    const viewport = window.visualViewport;
    root.style.setProperty('--modal-vh', `${viewport ? viewport.height : window.innerHeight}px`);
    root.style.setProperty('--modal-vtop', `${viewport ? viewport.offsetTop : 0}px`);
  }
  function queueModalViewport() {
    if (!root.classList.contains('page-locked') || viewportFrame) return;
    viewportFrame = requestAnimationFrame(() => { viewportFrame = 0; updateModalViewport(); });
  }
  window.visualViewport?.addEventListener('resize', queueModalViewport);
  window.visualViewport?.addEventListener('scroll', queueModalViewport);
  window.addEventListener('resize', queueModalViewport);

  function openModal(modal, focusTarget) {
    savedPageX = window.scrollX;
    savedPageY = window.scrollY;
    root.style.setProperty('--page-scroll-offset', `${-savedPageY}px`);
    root.classList.add('page-locked');
    updateModalViewport();
    modal.showModal();
    modal.querySelector('.modal-scroll').scrollTop = 0;
    focusTarget.focus({preventScroll:true});
  }
  function restorePageFocus(target) {
    root.classList.add('restoring-scroll');
    root.classList.remove('page-locked');
    root.style.removeProperty('--page-scroll-offset');
    window.scrollTo({left:savedPageX,top:savedPageY,behavior:'instant'});
    target?.focus({preventScroll:true});
    requestAnimationFrame(() => root.classList.remove('restoring-scroll'));
  }
  // Edge-only fallback for older iOS: retain native scrolling in both directions.
  [booking, photos].forEach(modal => {
    let lastTouchX = 0;
    let lastTouchY = 0;
    modal.addEventListener('touchstart', event => {
      if (event.touches.length !== 1) return;
      lastTouchX = event.touches[0].clientX;
      lastTouchY = event.touches[0].clientY;
    }, {passive:true});
    modal.addEventListener('touchmove', event => {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      const deltaX = touch.clientX - lastTouchX;
      const deltaY = touch.clientY - lastTouchY;
      lastTouchX = touch.clientX;
      lastTouchY = touch.clientY;
      if (Math.abs(deltaY) <= Math.abs(deltaX)) return;
      const scroller = event.target.closest('.modal-scroll');
      const hasScroll = scroller && scroller.scrollHeight > scroller.clientHeight + 1;
      if (!hasScroll || (scroller.scrollTop <= 0 && deltaY > 0) ||
          (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1 && deltaY < 0)) {
        if (event.cancelable) event.preventDefault();
      }
    }, {passive:false});
  });

  const menuIcon = document.querySelector('.menu span');
  menuIcon.className = 'menu-icon';
  menuIcon.innerHTML = '<svg class="menu-bars" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg><svg class="menu-cross" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg>';
  menuIcon.setAttribute('aria-hidden','true');

  const backToTop = document.createElement('button');
  backToTop.type = 'button';
  backToTop.className = 'back-to-top';
  backToTop.setAttribute('aria-label','Наверх');
  backToTop.hidden = true;
  backToTop.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 20V4m-7 7 7-7 7 7"/></svg>';
  document.body.append(backToTop);
  let scrollFrame = 0;
  function updateBackToTop() {
    scrollFrame = 0;
    backToTop.hidden = window.scrollY < Math.max(600, window.innerHeight);
  }
  window.addEventListener('scroll', () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateBackToTop);
  }, {passive:true});
  updateBackToTop();
  backToTop.addEventListener('click', () => {
    window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
    document.querySelector('.header .wordmark').focus({preventScroll:true});
  });

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
    opener = button; form.reset(); form.hidden = false; success.hidden = true; bookingFooter.hidden = false;
    form.querySelectorAll('[aria-invalid]').forEach(input => input.removeAttribute('aria-invalid'));
    form.querySelectorAll('.error').forEach(error => error.textContent = '');
    if (button.dataset.service) form.elements.service.value = button.dataset.service;
    openModal(dialog, matchMedia('(pointer: coarse)').matches ? dialog.querySelector('.close') : form.elements.name);
  }));
  dialog.querySelector('.close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => restorePageFocus(opener));
  form.addEventListener('submit', event => {
    event.preventDefault();
    const name = form.elements.name;
    const phone = form.elements.phone;
    const digits = phone.value.replace(/\D/g, '');
    const errors = [[name, name.value.trim().length < 2 ? 'Введите имя: не менее двух символов.' : ''], [phone, !/^[+\d\s()–-]+$/.test(phone.value) || digits.length < 10 || digits.length > 15 ? 'Введите телефон: от 10 до 15 цифр.' : '']];
    errors.forEach(([input, message]) => { input.setAttribute('aria-invalid', String(Boolean(message))); document.querySelector('#' + input.id + '-error').textContent = message; });
    const first = errors.find(([,message]) => message);
    if (first) { first[0].focus(); return; }
    form.hidden = true; success.hidden = false; bookingFooter.hidden = true; form.reset(); success.focus();
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
      photoOpener = button; showPhoto(index); openModal(viewer, viewer.querySelector('.viewer-close'));
    });
  });
  viewer.querySelector('.viewer-prev').addEventListener('click', () => showPhoto(photoIndex - 1));
  viewer.querySelector('.viewer-next').addEventListener('click', () => showPhoto(photoIndex + 1));
  viewer.querySelector('.viewer-close').addEventListener('click', () => viewer.close());
  viewer.addEventListener('close', () => restorePageFocus(photoOpener));
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
