// Load synchronously in <head>: sets data-theme before first paint.
// Stored choice wins; otherwise follow the OS and keep following it.
(function () {
  var KEY = 'vr-theme';
  var root = document.documentElement;
  var media = matchMedia('(prefers-color-scheme: dark)');
  var stored = null;
  try { stored = localStorage.getItem(KEY); } catch (e) {}
  root.dataset.theme = stored || (media.matches ? 'dark' : 'light');

  media.addEventListener('change', function (e) {
    if (!stored) root.dataset.theme = e.matches ? 'dark' : 'light';
  });

  // Theme switch is a wipe from the toggle: circle by default, or a top-down
  // pour when the page sets `--theme-wipe: pour` on :root.
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-theme-toggle]');
    if (!btn) return;
    stored = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(KEY, stored); } catch (e) {}
    var apply = function () { root.dataset.theme = stored; };
    if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return apply();

    var r = btn.getBoundingClientRect();
    var x = r.left + r.width / 2, y = r.top + r.height / 2;
    var radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    var pour = getComputedStyle(root).getPropertyValue('--theme-wipe').trim() === 'pour';
    var clip = pour
      ? ['inset(0 0 100% 0)', 'inset(0 0 0% 0)']
      : ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)'];
    document.startViewTransition(apply).ready.then(function () {
      root.animate({ clipPath: clip }, {
        duration: pour ? 900 : 650,
        easing: pour ? 'cubic-bezier(.5,0,.3,1)' : 'cubic-bezier(.7,0,.2,1)',
        pseudoElement: '::view-transition-new(root)'
      });
    });
  });
})();
