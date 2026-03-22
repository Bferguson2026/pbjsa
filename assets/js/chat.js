/* ============================================================
   PBJ Strategic Accounting — Chat Widget
   Calls a Cloudflare Worker proxy that securely holds the
   Anthropic API key. Replace CHAT_API with your Worker URL.
   ============================================================ */

(function () {
  'use strict';

  /* ── Replace with your deployed Cloudflare Worker URL ────── */
  var CHAT_API = 'YOUR_CLOUDFLARE_WORKER_URL';

  /* ── Resolve asset path (works from root and /blog/ pages) ── */
  var scriptSrc = (document.currentScript || {}).src || '';
  var BASE = scriptSrc.replace(/assets\/js\/chat\.js.*$/, '') ||
             (window.location.pathname.includes('/blog/') ? '../' : '');
  var AVATAR = BASE + 'assets/img/brittany-headshot.png';

  /* ── Widget HTML ─────────────────────────────────────────── */
  var WIDGET_HTML = [
    '<div id="pbjChat" class="chat-widget" role="complementary" aria-label="Chat assistant">',

      '<div class="chat-panel" id="chatPanel" aria-hidden="true">',

        '<div class="chat-header">',
          '<div class="chat-header-avatar" aria-hidden="true">',
            '<img id="chatAvatar" src="" alt="" class="chat-avatar-img">',
          '</div>',
          '<div class="chat-header-info">',
            '<p class="chat-name">PBJ Assistant</p>',
            '<p class="chat-status">\uD83E\uDD16 Ask Robo-Brittany anything!</p>',
          '</div>',
          '<button class="chat-close" id="chatClose" aria-label="Close chat">',
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
          '</button>',
        '</div>',

        '<div class="chat-messages" id="chatMessages" role="log" aria-live="polite" aria-label="Conversation">',
          '<div class="chat-msg chat-msg--bot">',
            '<p>Hi! I\'m the PBJ Assistant. I can help you find the right page or answer a quick question. What brings you here today?</p>',
          '</div>',
          '<div class="chat-chips" id="chatChips">',
            '<button class="chat-chip">What services do you offer?</button>',
            '<button class="chat-chip">How much does it cost?</button>',
            '<button class="chat-chip">How do I get started?</button>',
            '<button class="chat-chip">Where are you located?</button>',
          '</div>',
        '</div>',

        '<form class="chat-form" id="chatForm" autocomplete="off">',
          '<input type="text" id="chatInput" class="chat-input" placeholder="Ask a question\u2026" aria-label="Type your message" maxlength="300"/>',
          '<button type="submit" class="chat-send" id="chatSend" aria-label="Send">',
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4 20-7z"/><path d="M22 2 11 13"/></svg>',
          '</button>',
        '</form>',

      '</div>',

      '<button class="chat-toggle" id="chatToggle" aria-expanded="false" aria-controls="chatPanel" aria-label="Open chat assistant">',
        '<svg class="chat-toggle-open" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
        '<svg class="chat-toggle-close" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true" style="display:none"><path d="M18 6 6 18M6 6l12 12"/></svg>',
        '<span class="chat-toggle-label">Help</span>',
      '</button>',

    '</div>',
  ].join('');

  /* ── Init ────────────────────────────────────────────────── */
  function init() {
    var wrap = document.createElement('div');
    wrap.innerHTML = WIDGET_HTML;
    document.body.appendChild(wrap.firstChild);

    /* Set avatar src now that the element is in the DOM */
    var avatarEl = document.getElementById('chatAvatar');
    if (avatarEl) avatarEl.src = AVATAR;

    var panel     = document.getElementById('chatPanel');
    var toggle    = document.getElementById('chatToggle');
    var closeBtn  = document.getElementById('chatClose');
    var msgList   = document.getElementById('chatMessages');
    var chips     = document.getElementById('chatChips');
    var form      = document.getElementById('chatForm');
    var inputEl   = document.getElementById('chatInput');
    var sendBtn   = document.getElementById('chatSend');
    var history   = [];
    var chipsGone = false;

    /* ── Open / close ──────────────────────────────────────── */
    function openChat() {
      panel.classList.add('is-open');
      panel.removeAttribute('aria-hidden');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.querySelector('.chat-toggle-open').style.display  = 'none';
      toggle.querySelector('.chat-toggle-close').style.display = '';
      toggle.querySelector('.chat-toggle-label').textContent   = 'Close';
      inputEl.focus();
    }

    function closeChat() {
      panel.classList.remove('is-open');
      panel.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.querySelector('.chat-toggle-open').style.display  = '';
      toggle.querySelector('.chat-toggle-close').style.display = 'none';
      toggle.querySelector('.chat-toggle-label').textContent   = 'Help';
      toggle.focus();
    }

    toggle.addEventListener('click', function () {
      panel.classList.contains('is-open') ? closeChat() : openChat();
    });
    closeBtn.addEventListener('click', closeChat);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('is-open')) closeChat();
    });

    /* ── Chips ─────────────────────────────────────────────── */
    chips.addEventListener('click', function (e) {
      var chip = e.target.closest('.chat-chip');
      if (!chip) return;
      dismissChips();
      sendMessage(chip.textContent.trim());
    });

    function dismissChips() {
      if (!chipsGone) { chips.style.display = 'none'; chipsGone = true; }
    }

    /* ── Form submit ───────────────────────────────────────── */
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var text = inputEl.value.trim();
      if (!text) return;
      inputEl.value = '';
      dismissChips();
      sendMessage(text);
    });

    /* ── Send message flow ─────────────────────────────────── */
    function sendMessage(text) {
      addMsg('user', text);
      history.push({ role: 'user', content: text });

      /* Placeholder if worker not yet configured */
      if (CHAT_API === 'YOUR_CLOUDFLARE_WORKER_URL') {
        addMsg('bot', 'The chat is being set up. In the meantime, call us at 904-708-2411 or visit our [Contact page](/contact.html).');
        return;
      }

      setLoading(true);
      var typingEl = addTyping();

      fetch(CHAT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          typingEl.remove();
          var reply = data.reply || 'I had trouble with that. Please call 904-708-2411 or visit our [Contact page](/contact.html).';
          history.push({ role: 'assistant', content: reply });
          addMsg('bot', reply);
        })
        .catch(function () {
          typingEl.remove();
          addMsg('bot', 'Something went wrong. Please try again or call 904-708-2411.');
        })
        .finally(function () {
          setLoading(false);
        });
    }

    /* ── DOM helpers ───────────────────────────────────────── */
    function addMsg(role, text) {
      var div = document.createElement('div');
      div.className = 'chat-msg chat-msg--' + (role === 'user' ? 'user' : 'bot');
      var p = document.createElement('p');
      p.innerHTML = parseLinks(escHtml(text));
      div.appendChild(p);
      msgList.appendChild(div);
      scrollBottom();
      return div;
    }

    function addTyping() {
      var div = document.createElement('div');
      div.className = 'chat-msg chat-msg--bot';
      div.innerHTML = '<span class="chat-typing"><span></span><span></span><span></span></span>';
      msgList.appendChild(div);
      scrollBottom();
      return div;
    }

    function setLoading(on) {
      inputEl.disabled = on;
      sendBtn.disabled = on;
    }

    function scrollBottom() {
      msgList.scrollTop = msgList.scrollHeight;
    }

    /* ── Text utilities ────────────────────────────────────── */
    function escHtml(str) {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    /* Convert [text](url) markdown links to <a> tags */
    function parseLinks(str) {
      return str.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (_, t, u) {
        var safe = u.replace(/"/g, '&quot;');
        return '<a href="' + safe + '">' + t + '</a>';
      });
    }
  }

  /* ── Bootstrap ───────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
