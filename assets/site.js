var root = document.documentElement;
var still = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Old addresses: the collective's page was #depravity-girlz.
if (location.hash === '#depravity-girlz') history.replaceState(null, '', '#depravity');

// Spines: open one at a time; Escape closes.
(function () {
  var spines = Array.prototype.slice.call(document.querySelectorAll('.spine'));
  function set(spine, open) {
    spine.classList.toggle('is-open', open);
    spine.querySelector('.spine-face').setAttribute('aria-expanded', String(open));
  }
  spines.forEach(function (spine) {
    spine.querySelector('.spine-face').addEventListener('click', function () {
      var open = !spine.classList.contains('is-open');
      spines.forEach(function (s) { if (s !== spine) set(s, false); });
      set(spine, open);
      if (open && spine.parentElement.scrollWidth > spine.parentElement.clientWidth) {
        setTimeout(function () { spine.scrollIntoView({ inline: 'center', block: 'nearest', behavior: still ? 'auto' : 'smooth' }); }, 120);
      }
    });
  });
  addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    spines.forEach(function (s) { if (s.classList.contains('is-open')) { set(s, false); s.querySelector('.spine-face').focus(); } });
  });
})();

// Page morphs: the open spine (or paper) becomes the page header and back again. The link names the page; its
// spine and its header share that page id as their view-transition name for the length of the navigation.
(function () {
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-vt-link]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || !document.startViewTransition || still) return;
    e.preventDefault();
    var hash = a.getAttribute('href');
    var name = a.dataset.vtLink;
    var named = [document.querySelector('[data-vt="' + name + '"]'), document.querySelector('#' + name + ' :is(.dhead, .ahead)')]
      .filter(Boolean);
    named.forEach(function (el) { el.style.viewTransitionName = name; });
    root.classList.add('vt-nav');
    var vt = document.startViewTransition(function () {
      location.hash = hash;
      var target = document.querySelector(hash);
      if (target && target.classList.contains('page')) scrollTo(0, 0);
      else if (target) target.scrollIntoView({ block: 'start' });
    });
    vt.finished.finally(function () {
      root.classList.remove('vt-nav');
      named.forEach(function (el) { el.style.viewTransitionName = ''; });
    });
  });
})();

// Nav: underline the section in view; detail pages underline their parent section (data-parent).
(function () {
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav a'));
  var SECTIONS = links.map(function (a) { return a.hash.slice(1); });
  var visible = {};
  function mark(id) { links.forEach(function (a) { a.setAttribute('aria-current', String(a.hash === '#' + id)); }); }
  function update() {
    var page = location.hash && document.getElementById(location.hash.slice(1));
    if (page && page.classList.contains('page') && page.dataset.parent) return mark(page.dataset.parent);
    var best = null;
    SECTIONS.forEach(function (id) { if (visible[id]) best = best || id; });
    mark(best || '');
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting; });
    update();
  }, { rootMargin: '-45% 0px -45% 0px' });
  SECTIONS.forEach(function (id) { io.observe(document.getElementById(id)); });
  addEventListener('hashchange', update);
})();

// Pop Maker Studio screenshots.
(function () {
  var shot = document.getElementById('shot');
  var buttons = document.querySelectorAll('.thumbs button');
  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      buttons.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      shot.src = b.dataset.src; shot.alt = b.dataset.alt;
      shot.classList.remove('swap'); void shot.offsetWidth; shot.classList.add('swap');
    });
  });
})();

// mk-mmd: the exported scene loads when its page is first opened; it follows the site's theme (dark is its 1-bit
// mono), sizes its frame to its content, and the hero video goes quiet while the timeline plays.
(function () {
  var frame = document.getElementById('mk-scene');
  var hero = document.getElementById('mk-hero');
  var sound = document.getElementById('mk-sound');
  var theme = function () { return root.dataset.theme === 'dark' ? 'mono' : 'light'; };
  function load() {
    if (location.hash !== '#mk-mmd' || frame.src) return;
    frame.src = frame.dataset.src + '?theme=' + theme() + '&maxh=' + (innerWidth < 760 ? 420 : 520);
  }
  addEventListener('hashchange', load);
  load();
  new MutationObserver(function () {
    if (frame.contentWindow) frame.contentWindow.postMessage({ source: 'mk-host', type: 'theme', theme: theme() }, '*');
  }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  function setSound(on) {
    hero.muted = !on;
    sound.setAttribute('aria-pressed', String(on));
    sound.textContent = on ? 'Sound on' : 'Sound off';
  }
  sound.addEventListener('click', function () {
    setSound(hero.muted);
    if (!hero.muted) { hero.currentTime = 0; hero.play(); }
  });
  addEventListener('message', function (e) {
    var m = e.data;
    if (e.source !== frame.contentWindow || !m || m.source !== 'mk-export') return;
    if (m.type === 'height') frame.style.height = m.height + 'px';
    if (m.type === 'clock' && m.playing && !hero.muted) setSound(false);
  });
  addEventListener('hashchange', function () { if (location.hash !== '#mk-mmd') setSound(false); });
})();

// Depravity box set: the box opens a drawer of members below the shelf.
// #depravity deep-links to it open; Escape closes it.
(function () {
  var box = document.querySelector('.box');
  var drawer = document.getElementById('depravity-members');
  function set(open) {
    box.setAttribute('aria-expanded', String(open));
    drawer.classList.toggle('is-open', open);
    drawer.inert = !open;
    if (open) drawer.querySelectorAll('img').forEach(function (img) { img.loading = 'eager'; });
  }
  box.addEventListener('click', function () {
    var open = box.getAttribute('aria-expanded') !== 'true';
    set(open);
    history.replaceState(null, '', open ? '#depravity' : '#artists');
  });
  addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && box.getAttribute('aria-expanded') === 'true') { set(false); box.focus(); }
  });
  function fromHash() {
    if (location.hash !== '#depravity') return;
    set(true);
    document.getElementById('depravity').scrollIntoView({ block: 'start' });
  }
  addEventListener('hashchange', fromHash);
  fromHash();
})();

// Member photos: skim one person's own photos by moving across their card (tap steps on touch).
(function () {
  document.querySelectorAll('[data-skim]').forEach(function (skim) {
    var imgs = Array.prototype.slice.call(skim.querySelectorAll('img'));
    var ticks = document.createElement('div');
    ticks.className = 'skim-ticks';
    ticks.setAttribute('aria-hidden', 'true');
    imgs.forEach(function () { ticks.appendChild(document.createElement('i')); });
    skim.appendChild(ticks);
    var bars = ticks.querySelectorAll('i');
    var cur = 0;
    function show(i) {
      cur = i;
      imgs.forEach(function (img, k) { img.classList.toggle('on', k === i); if (k === i) img.loading = 'eager'; });
      bars.forEach(function (b, k) { b.classList.toggle('on', k === i); });
    }
    skim.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var r = skim.getBoundingClientRect();
      show(Math.min(imgs.length - 1, Math.max(0, Math.floor((e.clientX - r.left) / r.width * imgs.length))));
    });
    skim.addEventListener('pointerleave', function () { show(0); });
    skim.addEventListener('click', function () { show((cur + 1) % imgs.length); });
    show(0);
  });
})();
