/* Gran Kaz site concept: hero video, open-now status, what's-on week, bars picker, dock, reveals. */
(function () {
  var doc = document, root = doc.documentElement;
  root.classList.add('js');
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };

  /* Seychelles wall-clock time (UTC+4, no daylight saving), whatever the visitor's own time zone */
  function sct() {
    var n = new Date();
    return new Date(n.getTime() + (n.getTimezoneOffset() + 240) * 60000);
  }
  function hourLabel(h) { return (h % 12 || 12) + (h < 12 ? 'am' : 'pm'); }

  /* hero video plays inside the letters; still poster when motion is reduced */
  var v = $('.word-v');
  if (v && !calm) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }

  /* other videos play only while they are on screen */
  if (!calm && 'IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (es) {
      es.forEach(function (x) { if (x.isIntersecting) { var q = x.target.play(); if (q && q.catch) q.catch(function () {}); } else x.target.pause(); });
    }, { threshold: 0.25 });
    $$('video[data-autoplay]').forEach(function (el) { vio.observe(el); });
  }

  /* what's on: featured slider with timed tabs */
  var slideTabs = $$('.slide-tabs button');
  if (slideTabs.length) {
    var cur = 0, timer = null, DUR = 6500;
    var go = function (i) {
      cur = (i + slideTabs.length) % slideTabs.length;
      slideTabs.forEach(function (b, n) {
        b.setAttribute('aria-selected', 'false');
        var s = doc.getElementById(b.getAttribute('aria-controls'));
        if (s) s.classList.toggle('on', n === cur);
      });
      void slideTabs[cur].offsetWidth;                      /* restart the progress bar */
      slideTabs[cur].style.setProperty('--dur', (calm ? 0 : DUR) + 'ms');
      slideTabs[cur].setAttribute('aria-selected', 'true');
      clearTimeout(timer);
      if (!calm) timer = setTimeout(function () { go(cur + 1); }, DUR);
    };
    slideTabs.forEach(function (b, n) { b.addEventListener('click', function () { go(n); }); });
    var st = $('.stage-whats');
    st.addEventListener('mouseenter', function () { clearTimeout(timer); });
    st.addEventListener('mouseleave', function () { if (!calm) timer = setTimeout(function () { go(cur + 1); }, 2500); });
    go(0);
  }

  /* giving back: filter the stories by topic */
  var topicBtns = $$('.topics button'), cards = $$('.sgrid .scard'), allBtn = $('#alltopics');
  var filter = function (t) {
    cards.forEach(function (c) { c.classList.toggle('hide', !!t && c.dataset.topic !== t); c.classList.add('in'); });
    topicBtns.forEach(function (b) { b.classList.toggle('on', b.dataset.topic === t); });
    var box = $('.topics'); if (box) box.classList.toggle('filtering', !!t);
    if (allBtn) allBtn.hidden = !t;
    var big = $('.sgrid .scard.big'); if (big) big.classList.toggle('plain', !!t);
  };
  topicBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      filter(b.classList.contains('on') ? '' : b.dataset.topic);
      var g = $('.sgrid'); if (g) g.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
    });
  });
  if (allBtn) allBtn.addEventListener('click', function () { filter(''); });

  /* menu: highlight the section pill for the part of the menu on screen */
  var pills = $$('.mnav a');
  if (pills.length && 'IntersectionObserver' in window) {
    var mio = new IntersectionObserver(function (es) {
      es.forEach(function (x) {
        if (!x.isIntersecting) return;
        pills.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + x.target.id); });
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    $$('#food .mcat').forEach(function (c) { mio.observe(c); });
  }

  /* open-now status on the hero cards and the visit cards */
  function status() {
    var h = sct().getHours();
    $$('[data-open]').forEach(function (el) {
      var open = +el.dataset.open, close = +el.dataset.close;
      var isOpen = h >= open || h < close;
      var state = el.classList.contains('venue-state') ? el : $('.venue-state', el);
      if (!state) return;
      state.classList.toggle('open', isOpen);
      $('b', state).textContent = isOpen ? 'Open now, until ' + hourLabel(close) : 'Closed, opens ' + hourLabel(open);
    });
  }
  status(); setInterval(status, 60000);

  /* what's on: a week of day buttons, today picked first */
  var daysEl = $('.days'), promos = $$('.promo');
  if (daysEl && promos.length) {
    var names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var today = sct(); today.setHours(0, 0, 0, 0);
    var monday = new Date(today); monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    var lastTwoThu = function (d) {
      if (d.getDay() !== 4) return false;
      var last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      return d.getDate() + 14 > last;
    };
    var show = function (d, btn, animate) {
      $$('button', daysEl).forEach(function (b) { b.setAttribute('aria-selected', b === btn ? 'true' : 'false'); });
      promos.forEach(function (li, i) {
        var on = li.dataset.rule === 'last2thu' ? lastTwoThu(d) : (li.dataset.days || '').split(',').indexOf(String(d.getDay())) > -1;
        li.classList.toggle('off', !on);
        li.classList.remove('swap');
        if (on && animate && !calm) { void li.offsetWidth; li.style.animationDelay = (i * 60) + 'ms'; li.classList.add('swap'); }
      });
    };
    for (var i = 0; i < 7; i++) {
      (function (d) {
        var b = doc.createElement('button');
        var isToday = d.getTime() === today.getTime();
        b.type = 'button'; b.setAttribute('role', 'tab');
        b.innerHTML = (isToday ? 'Today' : names[d.getDay()]) + '<small>' + d.getDate() + '</small>';
        b.addEventListener('click', function () { show(d, b, true); });
        daysEl.appendChild(b);
        if (isToday) show(d, b, false);
      })(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i));
    }
  }

  /* bars picker */
  var tabs = $$('.bars-names button');
  tabs.forEach(function (t) {
    var pick = function () {
      tabs.forEach(function (o) { o.setAttribute('aria-selected', o === t ? 'true' : 'false'); });
      $$('.bars-show .bar').forEach(function (b) { b.classList.toggle('on', b.id === t.getAttribute('aria-controls')); });
    };
    t.addEventListener('click', pick);
    t.addEventListener('mouseenter', pick);
    t.addEventListener('focus', pick);
  });

  /* dock: a slim menu bar once the hero has scrolled away */
  var stage = $('.stage'), top = $('.top');
  if (stage && top && 'IntersectionObserver' in window) {
    var dock = doc.createElement('div');
    dock.className = 'dock';
    dock.innerHTML = '<a href="#top" aria-label="Back to top"><img src="assets/img/logo-h-white.png" alt="Gran Kaz" width="720" height="241"></a>' +
      '<nav class="nav" aria-label="Quick menu">' + $('.nav', top).innerHTML + '</nav>' +
      '<a class="btn solid sm" href="visit.html">Find us</a>';
    doc.body.appendChild(dock);
    new IntersectionObserver(function (e) { dock.classList.toggle('show', !e[0].isIntersecting); }, { rootMargin: '-80px 0px 0px 0px' }).observe(stage);
  }

  /* phone menu */
  var burger = $('.burger');
  if (burger) {
    var sheet = doc.createElement('div');
    sheet.className = 'sheet';
    sheet.innerHTML = $('.nav', top).innerHTML + '<a href="visit.html">Find us</a>';
    doc.body.appendChild(sheet);
    var toggle = function (open) {
      sheet.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      burger.style.position = open ? 'fixed' : '';
      burger.style.right = open ? 'calc(var(--pad) + 12px)' : '';
      burger.style.top = open ? '28px' : '';
      burger.style.zIndex = open ? '70' : '';
      doc.body.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', function () { toggle(!sheet.classList.contains('open')); });
    sheet.addEventListener('click', function (e) { if (e.target.tagName === 'A') toggle(false); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') toggle(false); });
  }

  /* gentle rise as sections come into view */
  var risers = $$('[data-rise]');
  if (calm || !('IntersectionObserver' in window)) {
    risers.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    risers.forEach(function (el) { io.observe(el); });
  }
})();
