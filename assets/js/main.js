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

/* ── Contact Modal ────────────────────────────────────────── */
(function () {
  /* Don't intercept on the contact page itself */
  var isContactPage = window.location.pathname.replace(/\\/g, '/').indexOf('contact.html') !== -1;

  var MODAL_HTML = [
    '<div id="cmodal" class="cmodal" role="dialog" aria-modal="true"',
    '     aria-labelledby="cmodal-title" aria-hidden="true">',
    '  <div class="cmodal-backdrop" id="cmodalBackdrop"></div>',
    '  <div class="cmodal-panel">',
    '    <button class="cmodal-close" id="cmodalClose" aria-label="Close form">',
    '      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"',
    '           stroke-width="2.5" stroke-linecap="round" aria-hidden="true">',
    '        <path d="M18 6 6 18M6 6l12 12"/>',
    '      </svg>',
    '    </button>',
    '    <span class="eyebrow">Get in Touch</span>',
    '    <h2 id="cmodal-title" style="font-size:1.5rem;margin:.5rem 0 .4rem;">Send Us a Message</h2>',
    '    <p style="color:var(--text-muted);font-size:.92rem;margin:0 0 1.5rem;">We typically respond within one business day.</p>',
    '    <form id="cmodalForm" action="#" method="post" novalidate>',
    '      <div class="form-grid">',
    '        <div class="form-field">',
    '          <label for="m-name">Full Name <abbr title="required" aria-label="required">*</abbr></label>',
    '          <input id="m-name" name="name" type="text" autocomplete="name" required aria-required="true" placeholder="Jane Smith">',
    '        </div>',
    '        <div class="form-field">',
    '          <label for="m-email">Email Address <abbr title="required" aria-label="required">*</abbr></label>',
    '          <input id="m-email" name="email" type="email" autocomplete="email" required aria-required="true" placeholder="jane@example.com">',
    '        </div>',
    '        <div class="form-field">',
    '          <label for="m-phone">Phone Number <abbr title="required" aria-label="required">*</abbr></label>',
    '          <input id="m-phone" name="phone" type="tel" autocomplete="tel" required aria-required="true" placeholder="(904) 555-0100">',
    '        </div>',
    '        <div class="form-field">',
    '          <label for="m-package">Package Preference</label>',
    '          <select id="m-package" name="package">',
    '            <option value="">Choose a package (optional)</option>',
    '            <option value="uncrustable">The Uncrustable - from $400/mo</option>',
    '            <option value="crust">Just the Crust - from $500/mo</option>',
    '            <option value="classic">The Classic - from $1,000/mo</option>',
    '            <option value="royale">The Jelly Royale - from $1,500/mo</option>',
    '            <option value="ultimate">The Ultimate Spread - from $2,000/mo</option>',
    '            <option value="nutty">The Nutty Buddy - from $125/hr</option>',
    '            <option value="rescue">The Rescue Spread - from $800</option>',
    '            <option value="unsure">Not sure yet</option>',
    '          </select>',
    '        </div>',
    '        <div class="form-field">',
    '          <label for="m-message">Message <abbr title="required" aria-label="required">*</abbr></label>',
    '          <textarea id="m-message" name="message" required aria-required="true"',
    '            placeholder="Tell us about your business and what kind of help you\'re looking for\u2026"></textarea>',
    '        </div>',
    '        <button class="btn" type="submit" style="justify-content:center;">Send Message</button>',
    '        <p style="font-size:.8rem;color:var(--text-muted);margin-top:.25rem;">',
    '          Fields marked with * are required. Or call us at <a href="tel:9047082411">904-708-2411</a>.',
    '        </p>',
    '      </div>',
    '    </form>',
    '  </div>',
    '</div>',
  ].join('\n');

  /* Inject modal once */
  var wrap = document.createElement('div');
  wrap.innerHTML = MODAL_HTML;
  document.body.appendChild(wrap.firstChild);

  var modal    = document.getElementById('cmodal');
  var backdrop = document.getElementById('cmodalBackdrop');
  var closeBtn = document.getElementById('cmodalClose');
  var openerEl = null;

  function openModal(triggerEl) {
    openerEl = triggerEl || document.activeElement;
    modal.removeAttribute('aria-hidden');
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    /* Focus first input */
    var first = modal.querySelector('input, select, textarea, button');
    if (first) first.focus();
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (openerEl) openerEl.focus();
  }

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) {
    if (!e.target.closest('.cmodal-panel')) closeModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

  /* Focus trap */
  modal.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || !modal.classList.contains('is-open')) return;
    var focusable = modal.querySelectorAll(
      'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
    );
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* Intercept CTA buttons pointing to contact page */
  if (!isContactPage) {
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href]');
      if (!link) return;
      var href = link.getAttribute('href') || '';
      if (!href.match(/contact\.html$/)) return;
      /* Only intercept styled buttons — not plain nav/footer text links */
      if (!link.classList.contains('btn') && !link.classList.contains('btn-secondary') && !link.classList.contains('nav-cta')) return;
      e.preventDefault();
      openModal(link);
    });
  }

  /* Handle form submit (placeholder — swap for real backend) */
  document.getElementById('cmodalForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var panel = modal.querySelector('.cmodal-panel');
    panel.innerHTML = [
      '<div style="text-align:center;padding:2rem 1rem;">',
      '  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent)"',
      '       stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin:0 auto 1rem">',
      '    <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>',
      '  </svg>',
      '  <h2 style="margin:0 0 .5rem;">Message Sent!</h2>',
      '  <p style="color:var(--text-muted);margin:0 0 1.5rem;">',
      "    We'll be in touch within one business day.",
      '  </p>',
      '  <button class="btn" id="cmodalDone">Close</button>',
      '</div>',
    ].join('');
    document.getElementById('cmodalDone').addEventListener('click', closeModal);
    document.getElementById('cmodalDone').focus();
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

/* ── Gooey jelly blob spread on card hover (pricing page only) ── */
(function () {
  var cards = document.querySelectorAll('.price-card');
  if (!cards.length) return;

  var BG    = '#F6F2EF';
  var JELLY = '#C8185A';

  var wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:10;pointer-events:none;mix-blend-mode:multiply;';
  document.body.appendChild(wrap);

  var inner = document.createElement('div');
  inner.style.cssText = 'position:relative;width:100%;height:100%;filter:blur(7px) contrast(22);';
  wrap.appendChild(inner);

  var canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block;';
  inner.appendChild(canvas);
  var ctx = canvas.getContext('2d');

  var mouse  = { x: -9999, y: -9999 };
  var prev   = { x: -9999, y: -9999 };
  var vel    = { x: 0, y: 0 };
  var active = false;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  window.addEventListener('resize', resize);
  resize();

  cards.forEach(function (card) {
    card.addEventListener('mouseenter', function () { active = true; prev.x = -9999; });
    card.addEventListener('mouseleave', function () { active = false; prev.x = -9999; });
  });

  document.addEventListener('mousemove', function (e) {
    vel.x = e.clientX - mouse.x;
    vel.y = e.clientY - mouse.y;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  (function loop() {
    requestAnimationFrame(loop);

    // fade existing blobs each frame toward background
    ctx.fillStyle = 'rgba(246,242,239,0.14)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!active) { vel.x *= 0.7; vel.y *= 0.7; return; }

    var speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
    if (speed < 1.5) { vel.x *= 0.7; vel.y *= 0.7; return; }

    var r = Math.min(4 + speed * 1.4, 18);

    ctx.fillStyle = JELLY;
    if (prev.x > -999) {
      var dist  = Math.sqrt((mouse.x - prev.x) * (mouse.x - prev.x) + (mouse.y - prev.y) * (mouse.y - prev.y));
      var steps = Math.max(1, Math.ceil(dist / (r * 0.5)));
      for (var s = 0; s <= steps; s++) {
        var t  = s / steps;
        var ix = prev.x + (mouse.x - prev.x) * t;
        var iy = prev.y + (mouse.y - prev.y) * t;
        ctx.beginPath();
        ctx.arc(ix, iy, r * (0.75 + t * 0.25), 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    prev.x = mouse.x;
    prev.y = mouse.y;
    vel.x *= 0.65;
    vel.y *= 0.65;
  }());
})();
