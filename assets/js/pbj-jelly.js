/**
 * PB&J bread cards + jelly mascot — progressive enhancement for /pricing.
 *
 * Adapted from the PBJ-Jelly-Handoff reference module (revision 3).
 * Differences from the reference, all deliberate:
 *   - Missing templates are a silent no-op instead of a thrown error, so the
 *     page can never be broken by the enhancement failing to find its art.
 *   - `pbj-jelly-arriving` is cleared when the arrival animation finishes, so
 *     no stale animation class is left on a card.
 *   - A `pbj-jelly-root` class is put on the root and `pbj-jelly-ready` is
 *     added one frame later, so the resting tilt is painted without a
 *     transition on first load (the brief forbids any intro motion).
 *   - The ResizeObserver also sizes the top/bottom padding, because the bread
 *     crown stretches with card height (preserveAspectRatio="none"); values
 *     are quantised to 4px so the observer settles instead of oscillating.
 *   - The resting tilt is budgeted against the page gutter beside each card
 *     rather than a flat fraction of its width, so ordinary cards rest at the
 *     brief's full 2.2 degrees and only tall or edge-hugging ones are reduced.
 *   - It clears the inline script's .pbj-jelly-pending size reservation on
 *     every exit path, and warns once (rather than throwing, or failing
 *     silently) when it has nothing to work with.
 *
 * Only ever feed this trusted, author-written SVG templates.
 * Returns a cleanup function that restores the original DOM exactly.
 * Calling it twice on the same root tears the first instance down first.
 */

const pbjJellyInstances = new WeakMap();
let pbjJellySerial = 0;
let pbjJellyWarned = false;

export function initPbjJelly({
  root = document,
  cardSelector = '.price-card',
  characterTemplate = document.getElementById('pbj-jelly-template'),
  breadTemplate = document.getElementById('pbj-bread-template')
} = {}) {
  const noop = () => {};
  const rootEl = root ? (root.nodeType === 1 ? root : root.documentElement) : null;
  // The inline reservation script pre-sizes the cards before first paint; give
  // that back whenever this function declines to enhance, so a page with JS on
  // but the enhancement unavailable renders exactly like a page with JS off.
  const clearPending = () => rootEl?.classList.remove('pbj-jelly-pending');

  const decline = reason => {
    clearPending();
    if (!pbjJellyWarned) {
      pbjJellyWarned = true;
      console.warn(`PB&J jelly: ${reason} — leaving the original pricing cards untouched.`);
    }
    return noop;
  };

  // Without both SVG templates the original cards are the (perfectly good) result.
  if (!root) return decline('no root element was given');
  if (!characterTemplate?.content?.querySelector('svg') || !breadTemplate?.content?.querySelector('svg')) {
    return decline('the #pbj-jelly-template / #pbj-bread-template SVG templates are missing');
  }

  pbjJellyInstances.get(root)?.();

  const cards = Array.from(root.querySelectorAll(cardSelector));
  if (!cards.length) return decline(`no "${cardSelector}" cards were found inside the root`);

  const controller = new AbortController();
  const signal = controller.signal;
  const timers = new Map();
  const inserted = [];
  const surfaces = [];
  const priorSafeTilts = new Map();
  const group = ++pbjJellySerial;
  let current = null;
  let readyFrame = 0;

  function select(card) {
    // Any interaction ends the welcome wave for the rest of the page session.
    cards.forEach(item => item.classList.remove('pbj-jelly-welcome'));
    if (card === current) return;

    if (current) {
      const previous = current;
      previous.classList.remove('pbj-jelly-active', 'pbj-jelly-arriving');
      previous.classList.add('pbj-jelly-leaving');
      clearTimeout(timers.get(previous));
      timers.set(previous, setTimeout(() => {
        previous.classList.remove('pbj-jelly-leaving');
        timers.delete(previous);
      }, 180));
    }

    clearTimeout(timers.get(card));
    timers.delete(card);
    card.classList.remove('pbj-jelly-leaving');
    card.classList.add('pbj-jelly-active', 'pbj-jelly-arriving');
    current = card;

    // The arrival keyframes end exactly on the static seated/tilted values,
    // so dropping the class when they finish is visually seamless.
    timers.set(card, setTimeout(() => {
      if (current === card) card.classList.remove('pbj-jelly-arriving');
      timers.delete(card);
    }, 1000));
  }

  cards.forEach((card, index) => {
    const perch = document.createElement('span');
    perch.className = 'pbj-jelly-perch';
    perch.setAttribute('aria-hidden', 'true');

    const character = characterTemplate.content.querySelector('svg').cloneNode(true);
    character.removeAttribute('aria-labelledby');
    character.removeAttribute('role');
    character.setAttribute('aria-hidden', 'true');
    character.setAttribute('focusable', 'false');
    // Per-instance id prefix keeps the document free of duplicate ids while
    // the stylesheet targets the stable data-jelly-part names.
    character.querySelectorAll('[id]').forEach(part => {
      part.dataset.jellyPart = part.id;
      part.id = `pbj-${group}-${index}-${part.id}`;
    });
    perch.append(character);

    const bread = breadTemplate.content.querySelector('svg').cloneNode(true);
    bread.classList.add('pbj-bread-art');
    bread.removeAttribute('aria-labelledby');
    bread.removeAttribute('role');
    bread.setAttribute('aria-hidden', 'true');
    bread.setAttribute('focusable', 'false');
    bread.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));

    const shadow = document.createElement('span');
    shadow.className = 'pbj-jelly-shadow';
    shadow.setAttribute('aria-hidden', 'true');

    const surface = document.createElement('div');
    surface.className = 'pbj-card-surface';
    // Move (never re-create) the original nodes: identity, listeners and the
    // article's accessible name association all survive untouched.
    while (card.firstChild) surface.append(card.firstChild);
    surface.prepend(bread, shadow, perch);
    card.append(surface);

    surfaces.push({ card, surface });
    inserted.push(bread, shadow, perch);
    card.classList.add('pbj-bread-card');

    card.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse' || event.pointerType === 'pen') select(card);
    }, { signal });
    card.addEventListener('focusin', () => select(card), { signal });
    // Passive: never blocks a quote link's first tap, nor vertical scrolling.
    card.addEventListener('pointerdown', event => {
      if (event.pointerType === 'touch') select(card);
    }, { signal, passive: true });
  });

  /* Long copy makes narrow cards very tall. Two consequences are corrected
     here: the resting tilt has to shrink so the card's corners do not swing
     sideways, and the stretched bread crown/heel need proportional padding
     so text never lands on the crust. Both are quantised so the
     ResizeObserver converges instead of looping. */
  const quantise = value => Math.ceil(value / 4) * 4;

  function fit() {
    const docWidth = document.documentElement.clientWidth;
    surfaces.forEach(({ card, surface }) => {
      const height = surface.offsetHeight;
      if (!height) return;

      /* Resting tilt. Rotating about 50% 96% swings the card's top-right
         corner — and the character riding above it — to the right by about
         (0.96 * height + 116) * sin(angle); measured against the real box,
         0.96 * height is the corner and the +116 covers the character. The
         arrival overshoots to 1.6x the resting angle, so the peak is what has
         to fit inside the page gutter beside the card, or the page grows a
         horizontal scrollbar mid-hop. Ordinary desktop cards have 60px of
         gutter and rest at the brief's full 2.2 degrees; tall cards and cards
         whose container hugs the viewport are reduced. */
      const rect = card.getBoundingClientRect();
      const lift = height * 0.96 + 116;
      const gutter = Math.min(rect.left, docWidth - rect.right) - 2;
      const budget = Math.min(46, Math.max(6, gutter));
      const peak = Math.asin(Math.min(1, budget / lift)) * 180 / Math.PI;
      card.style.setProperty('--pbj-safe-tilt', `${Math.min(2.2, peak / 1.6).toFixed(3)}deg`);

      /* The crumb starts 4.33% down the bread SVG and its heel ends 2.5% up
         from the bottom, and both stretch with the card. Padding is solved
         from the *content* height, not the current box height, so the value
         does not depend on the padding we are about to write — the observer
         re-runs once, computes the same numbers, and stops. */
      const style = getComputedStyle(surface);
      const content = height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      const settled = (content + 38) / 0.9317;
      card.style.setProperty('--pbj-card-padding-top', `${quantise(Math.max(72, settled * 0.0433 + 20))}px`);
      card.style.setProperty('--pbj-card-padding-bottom', `${quantise(Math.max(44, settled * 0.025 + 18))}px`);
    });
  }

  cards.forEach(card => priorSafeTilts.set(card, {
    tilt: card.style.getPropertyValue('--pbj-safe-tilt'),
    top: card.style.getPropertyValue('--pbj-card-padding-top'),
    bottom: card.style.getPropertyValue('--pbj-card-padding-bottom')
  }));

  rootEl?.classList.add('pbj-jelly-root');
  clearPending();

  // Seated before the first paint the visitor sees: no intro hop, and the
  // recommended card already carries its resting tilt.
  current = cards.find(card => card.classList.contains('price-card--featured')) || cards[0];
  current.classList.add('pbj-jelly-active', 'pbj-jelly-welcome');

  fit();
  const sizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(fit);
  surfaces.forEach(({ surface }) => sizeObserver?.observe(surface));

  // Surface transitions only start once the resting state has been painted.
  readyFrame = requestAnimationFrame(() => {
    readyFrame = 0;
    rootEl?.classList.add('pbj-jelly-ready');
  });

  function destroy() {
    controller.abort();
    sizeObserver?.disconnect();
    if (readyFrame) cancelAnimationFrame(readyFrame);
    timers.forEach(timer => clearTimeout(timer));
    timers.clear();
    inserted.forEach(node => node.remove());
    surfaces.forEach(({ card, surface }) => {
      while (surface.firstChild) card.insertBefore(surface.firstChild, surface);
      surface.remove();
    });
    cards.forEach(card => card.classList.remove(
      'pbj-bread-card', 'pbj-jelly-active', 'pbj-jelly-leaving', 'pbj-jelly-arriving', 'pbj-jelly-welcome'
    ));
    priorSafeTilts.forEach((prior, card) => {
      const restore = (name, value) => {
        if (value) card.style.setProperty(name, value);
        else card.style.removeProperty(name);
      };
      restore('--pbj-safe-tilt', prior.tilt);
      restore('--pbj-card-padding-top', prior.top);
      restore('--pbj-card-padding-bottom', prior.bottom);
      if (!card.getAttribute('style')) card.removeAttribute('style');
    });
    rootEl?.classList.remove('pbj-jelly-root', 'pbj-jelly-ready', 'pbj-jelly-pending');
    current = null;
    pbjJellyInstances.delete(root);
  }

  pbjJellyInstances.set(root, destroy);
  return destroy;
}
