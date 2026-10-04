(function () {
  'use strict';
  var KEY = 'pbj_privacy_v1';
  var ID = 'G-K6S8TPPMMZ';
  var loaded = false;
  var choice = readChoice();
  var channel;
  var dialog;
  var opener;
  var unsavedChoice = null;

  function readChoice() {
    try {
      var cookie = document.cookie.split('; ').find(function (item) { return item.indexOf(KEY + '=') === 0; });
      if (!cookie) return null;
      var value = JSON.parse(decodeURIComponent(cookie.slice(KEY.length + 1)));
      return value.version === 1 && typeof value.analytics === 'boolean' ? value : null;
    } catch (_) { return null; }
  }

  function disableAnalytics() {
    window['ga-disable-' + ID] = true;
    if (loaded) {
      window.gtag = function () {};
      window.dataLayer = [];
      var script = document.getElementById('pbj-google-analytics');
      if (script) script.remove();
    }
  }

  function startAnalytics() {
    if (loaded || !choice || !choice.analytics) return;
    loaded = true;
    window['ga-disable-' + ID] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', ID, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_location: window.location.origin + window.location.pathname,
      page_referrer: ''
    });
    var script = document.createElement('script');
    script.id = 'pbj-google-analytics';
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
    document.head.appendChild(script);
  }

  function saveChoice(analytics) {
    var wasLoaded = loaded;
    choice = { version: 1, analytics: analytics };
    // This necessary preference cookie stores a choice, not a visitor ID.
    try {
      document.cookie = KEY + '=' + encodeURIComponent(JSON.stringify(choice)) + '; Path=/; Max-Age=15552000; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
    } catch (_) {}
    var saved = readChoice();
    var persisted = !!saved && saved.analytics === analytics;
    unsavedChoice = persisted ? null : choice;
    if (!analytics) disableAnalytics();
    if (channel) channel.postMessage(choice);
    document.getElementById('pbj-privacy-banner').hidden = persisted;
    showStorageStatus(!persisted);
    if (dialog.open) dialog.close();
    if (analytics) startAnalytics();
    // Unload the already-running vendor code after opting out. Never send a
    // Google Consent Mode denial ping or load the vendor library to reject.
    if (wasLoaded && !analytics && persisted) location.reload();
  }

  function showStorageStatus(failed) {
    var status = document.getElementById('pbj-privacy-storage-status');
    if (!status) return;
    status.textContent = failed ? 'Your browser could not save this choice. It applies to this page only. To keep analytics off on future visits, clear this site\'s preference cookie in your browser or allow it to save a new choice.' : '';
  }

  disableAnalytics();
  try {
    channel = new BroadcastChannel(KEY);
    channel.onmessage = function (event) {
      if (!event.data || event.data.version !== 1 || typeof event.data.analytics !== 'boolean') return;
      if (unsavedChoice && !unsavedChoice.analytics && event.data.analytics) return;
      choice = event.data;
      if (!choice.analytics) {
        disableAnalytics();
        var saved = readChoice();
        if (loaded && (!saved || !saved.analytics)) location.reload();
        else if (loaded) { unsavedChoice = choice; showStorageStatus(true); }
      } else startAnalytics();
      if (document.getElementById('pbj-privacy-banner')) document.getElementById('pbj-privacy-banner').hidden = !unsavedChoice;
      showStorageStatus(!!unsavedChoice);
    };
  } catch (_) {}
  // Re-check after returning to a tab, including browsers without BroadcastChannel.
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible') return;
    if (unsavedChoice) return;
    choice = readChoice();
    if (!choice || !choice.analytics) {
      disableAnalytics();
      if (loaded) location.reload();
    }
  });
  startAnalytics();

  function init() {
    var ui = document.createElement('div');
    ui.innerHTML = '<section id="pbj-privacy-banner" class="privacy-banner" aria-label="Privacy choices"><h2>Your privacy choices</h2><p>Optional Google Analytics helps us understand site use. It stays off until you choose to allow it. Contact forms and chat work without analytics. <a href="/privacy">Privacy notice</a></p><div class="privacy-actions"><button type="button" data-privacy-reject>Reject optional</button><button type="button" data-privacy-customize>Customize</button><button type="button" data-privacy-accept>Accept analytics</button></div></section><dialog id="pbj-privacy-dialog" class="privacy-dialog" aria-labelledby="pbj-privacy-title"><h2 id="pbj-privacy-title">Privacy settings</h2><p>Necessary site features and the cookie that remembers your choice remain available.</p><label class="privacy-option"><input id="pbj-privacy-analytics" type="checkbox"> Allow Google Analytics</label><p>Analytics can collect page visits and browser information and use cookies. No advertising category is enabled by this site.</p><p>Choose Reject optional to withdraw analytics permission. If analytics is running, the page reloads to stop it. This does not erase information already sent.</p><div class="privacy-actions"><button type="button" data-privacy-reject>Reject optional</button><button type="button" id="pbj-privacy-save">Save choices</button><button type="button" id="pbj-privacy-close">Close</button></div><p><a href="/privacy">Read the privacy notice</a></p></dialog>';
    document.body.appendChild(ui);
    var storageStatus = document.createElement('p');
    storageStatus.id = 'pbj-privacy-storage-status';
    storageStatus.setAttribute('role', 'status');
    document.getElementById('pbj-privacy-banner').appendChild(storageStatus);
    dialog = document.getElementById('pbj-privacy-dialog');
    document.getElementById('pbj-privacy-banner').hidden = !!choice;
    document.querySelectorAll('[data-privacy-reject]').forEach(function (button) { button.addEventListener('click', function () { saveChoice(false); }); });
    document.querySelectorAll('[data-privacy-accept]').forEach(function (button) { button.addEventListener('click', function () { saveChoice(true); }); });
    document.querySelectorAll('[data-privacy-customize], [data-privacy-settings]').forEach(function (button) {
      button.addEventListener('click', function () {
        opener = button;
        document.getElementById('pbj-privacy-analytics').checked = !!(choice && choice.analytics);
        dialog.showModal();
      });
    });
    document.getElementById('pbj-privacy-save').addEventListener('click', function () { saveChoice(document.getElementById('pbj-privacy-analytics').checked); });
    document.getElementById('pbj-privacy-close').addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('close', function () { if (opener && !opener.closest('[hidden]')) opener.focus(); });
    addNotices();
    // The existing contact/callback dialogs are assembled by the site script.
    new MutationObserver(addNotices).observe(document.body, { childList: true, subtree: true });
  }

  function addNotices() {
    [ ['cmodalForm', 'We send your name, email, phone, package choice and message through Web3Forms so PB&J can respond.'], ['cbmodalForm', 'We send your name, phone and preferred callback time through Web3Forms so PB&J can call you.'], ['chatForm', 'Messages and recent conversation history go through Cloudflare to Anthropic to generate replies.'] ].forEach(function (entry) {
      var form = document.getElementById(entry[0]);
      if (!form || document.getElementById(entry[0] + '-privacy')) return;
      var note = document.createElement('p');
      note.id = entry[0] + '-privacy';
      note.className = 'privacy-collection-note';
      note.appendChild(document.createTextNode(entry[1] + ' Please do not include passwords, account numbers, tax documents or other confidential financial details. '));
      var link = document.createElement('a');
      link.href = '/privacy';
      link.textContent = 'Privacy notice';
      note.appendChild(link);
      form.parentNode.insertBefore(note, form);
      form.setAttribute('aria-describedby', ((form.getAttribute('aria-describedby') || '') + ' ' + note.id).trim());
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
