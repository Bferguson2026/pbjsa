/* ============================================================
   PBJ Strategic Accounting — Main JS
   Mobile nav + ADA focus management
   ============================================================ */

(function () {
  'use strict';

  /* ── Mobile Nav ──────────────────────────────────────────── */
  const hamburger  = document.getElementById('hamburger');
  const mobileNav  = document.getElementById('mobile-nav');
  const closeBtn   = document.getElementById('mobile-nav-close');

  if (!hamburger || !mobileNav || !closeBtn) return;

  function openNav() {
    mobileNav.classList.add('is-open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    // Move focus to close button
    closeBtn.focus();
  }

  function closeNav() {
    mobileNav.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    // Return focus to hamburger
    hamburger.focus();
  }

  hamburger.addEventListener('click', openNav);
  closeBtn.addEventListener('click', closeNav);

  // Close on overlay click (outside the panel)
  mobileNav.addEventListener('click', function (e) {
    if (e.target === mobileNav) closeNav();
  });

  // Close on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mobileNav.classList.contains('is-open')) {
      closeNav();
    }
  });

  // Trap focus inside mobile nav when open
  mobileNav.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || !mobileNav.classList.contains('is-open')) return;

    const focusable = mobileNav.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // Close mobile nav when a link inside it is activated
  mobileNav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeNav);
  });

})();

/* ── Audio Players ────────────────────────────────────────── */
(function () {
  function fmt(secs) {
    if (!secs || isNaN(secs)) return '0:00';
    var m = Math.floor(secs / 60);
    var s = Math.floor(secs % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function fillTrack(range, pct) {
    range.style.background =
      'linear-gradient(to right, var(--accent) ' + pct + '%, var(--border) ' + pct + '%)';
  }

  function initPlayer(wrap) {
    var audio     = wrap.querySelector('audio');
    var playBtn   = wrap.querySelector('.ap-play-btn');
    var playIcon  = wrap.querySelector('.ap-play-icon');
    var pauseIcon = wrap.querySelector('.ap-pause-icon');
    var progress  = wrap.querySelector('.ap-progress');
    var curEl     = wrap.querySelector('.ap-current');
    var durEl     = wrap.querySelector('.ap-duration');
    var volBtn    = wrap.querySelector('.ap-vol-btn');
    var volRange  = wrap.querySelector('.ap-vol-range');

    if (!audio || !playBtn) return;

    audio.addEventListener('loadedmetadata', function () {
      durEl.textContent = fmt(audio.duration);
      progress.max = audio.duration;
    });

    audio.addEventListener('timeupdate', function () {
      curEl.textContent = fmt(audio.currentTime);
      progress.value = audio.currentTime;
      fillTrack(progress, (audio.currentTime / audio.duration) * 100 || 0);
    });

    audio.addEventListener('ended', function () {
      playIcon.style.display = '';
      pauseIcon.style.display = 'none';
      playBtn.setAttribute('aria-label', 'Play');
      audio.currentTime = 0;
      fillTrack(progress, 0);
    });

    playBtn.addEventListener('click', function () {
      if (audio.paused) {
        /* Pause every other player */
        document.querySelectorAll('.audio-player audio').forEach(function (a) {
          if (a !== audio) {
            a.pause();
            var pw = a.closest('.audio-player');
            if (pw) {
              pw.querySelector('.ap-play-icon').style.display = '';
              pw.querySelector('.ap-pause-icon').style.display = 'none';
              pw.querySelector('.ap-play-btn').setAttribute('aria-label', 'Play');
            }
          }
        });
        audio.play();
        playIcon.style.display = 'none';
        pauseIcon.style.display = '';
        playBtn.setAttribute('aria-label', 'Pause');
      } else {
        audio.pause();
        playIcon.style.display = '';
        pauseIcon.style.display = 'none';
        playBtn.setAttribute('aria-label', 'Play');
      }
    });

    progress.addEventListener('input', function () {
      audio.currentTime = progress.value;
    });

    if (volBtn && volRange) {
      fillTrack(volRange, 100);
      volRange.addEventListener('input', function () {
        audio.volume = volRange.value;
        audio.muted = audio.volume === 0;
        fillTrack(volRange, volRange.value * 100);
      });
      volBtn.addEventListener('click', function () {
        audio.muted = !audio.muted;
        var v = audio.muted ? 0 : (audio.volume || 1);
        volRange.value = v;
        fillTrack(volRange, v * 100);
      });
    }
  }

  /* Init all players on page (article-page players are always visible) */
  document.querySelectorAll('.audio-player').forEach(initPlayer);

  /* Toggle collapsible players (blog index cards) */
  document.querySelectorAll('.btn-listen').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.getAttribute('aria-controls');
      var player = document.getElementById(id);
      if (!player) return;

      var opening = !player.classList.contains('is-open');

      /* Close all other collapsible players */
      document.querySelectorAll('.audio-player.is-open').forEach(function (p) {
        if (p !== player) {
          p.classList.remove('is-open');
          var a = p.querySelector('audio');
          if (a) a.pause();
          document.querySelectorAll('[aria-controls="' + p.id + '"]').forEach(function (b) {
            b.setAttribute('aria-expanded', 'false');
          });
        }
      });

      player.classList.toggle('is-open', opening);
      btn.setAttribute('aria-expanded', opening ? 'true' : 'false');

      /* Auto-play when opening */
      if (opening) {
        var playBtn = player.querySelector('.ap-play-btn');
        if (playBtn) playBtn.click();
      } else {
        var audio = player.querySelector('audio');
        if (audio) audio.pause();
      }
    });
  });
})();

/* ── Maps Address Popovers ────────────────────────────────── */
(function () {
  var triggers = document.querySelectorAll('.maps-trigger');
  if (!triggers.length) return;

  triggers.forEach(function (trigger) {
    var popover = trigger.querySelector('.maps-popover');
    if (!popover) return;

    var addr = trigger.querySelector('address');

    /* Make address keyboard-operable */
    addr.setAttribute('tabindex', '0');
    addr.setAttribute('role', 'button');
    addr.setAttribute('aria-haspopup', 'dialog');
    addr.setAttribute('aria-expanded', 'false');

    function closeAll() {
      document.querySelectorAll('.maps-popover.is-open').forEach(function (p) {
        p.classList.remove('is-open');
      });
      document.querySelectorAll('.maps-trigger address').forEach(function (a) {
        a.setAttribute('aria-expanded', 'false');
      });
    }

    function toggle() {
      var opening = !popover.classList.contains('is-open');
      closeAll();
      if (opening) {
        popover.classList.add('is-open');
        addr.setAttribute('aria-expanded', 'true');
        /* Move focus to first link in popover */
        var firstLink = popover.querySelector('a');
        if (firstLink) firstLink.focus();
      }
    }

    addr.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
    addr.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); toggle(); }
    });

    popover.addEventListener('click', function (e) { e.stopPropagation(); });
  });

  document.addEventListener('click', function () {
    document.querySelectorAll('.maps-popover.is-open').forEach(function (p) {
      p.classList.remove('is-open');
    });
    document.querySelectorAll('.maps-trigger address').forEach(function (a) {
      a.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.maps-popover.is-open').forEach(function (p) {
        p.classList.remove('is-open');
      });
      document.querySelectorAll('.maps-trigger address').forEach(function (a) {
        a.setAttribute('aria-expanded', 'false');
      });
    }
  });
})();

