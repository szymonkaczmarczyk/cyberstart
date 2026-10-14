import { icon } from './icons.js';

const PROPERTY_KEYS = new Set(['value', 'checked', 'disabled', 'type', 'name', 'id', 'htmlFor', 'tabIndex', 'hidden', 'open', 'min', 'max', 'step', 'placeholder', 'autocomplete', 'spellcheck', 'href', 'title', 'role', 'for']);

export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key === 'text') el.textContent = value;
    else if (key === 'html') el.innerHTML = value;
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (key === 'style') el.setAttribute('style', value);
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key.startsWith('aria-') || key.startsWith('data-') || !PROPERTY_KEYS.has(key)) el.setAttribute(key, value === true ? '' : value);
    else if (key === 'for') el.htmlFor = value;
    else el[key] = value;
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

export function rich(markup, tag = 'span') {
  return h(tag, { html: markup });
}

export function clear(el) {
  el.replaceChildren();
  return el;
}

export function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function button({ label, variant = 'secondary', iconName, iconAfter, shortcut, size, ...rest }) {
  return h(
    'button',
    { type: 'button', class: `btn btn-${variant}${size ? ` btn-${size}` : ''}`, ...rest },
    iconName ? icon(iconName) : null,
    h('span', { text: label }),
    iconAfter ? icon(iconAfter) : null,
    shortcut ? h('span', { class: 'kbd', 'aria-hidden': 'true', text: shortcut }) : null
  );
}

const FEEDBACK_ICONS = { ok: 'check', bad: 'x', warn: 'alert', info: 'info' };

export function feedback(kind, title, body) {
  return h(
    'div',
    { class: `feedback feedback-${kind}`, role: 'status' },
    icon(FEEDBACK_ICONS[kind]),
    h(
      'div',
      { class: 'feedback-body' },
      title ? h('span', { class: 'feedback-title', text: title }) : null,
      typeof body === 'string' ? rich(body) : body
    )
  );
}

export function isTyping(event) {
  const target = event.target;
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
}

export function onKey(signal, handler) {
  const controller = new AbortController();
  const stop = () => controller.abort();
  signal?.addEventListener('abort', stop, { once: true });
  document.addEventListener(
    'keydown',
    (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      handler(event);
    },
    { signal: controller.signal }
  );
  return stop;
}

export function choiceQuestion({ prompt, context, options, explain, signal, onDone, nextLabel = 'Dalej', shuffleOptions = false, okTitle = 'Dobrze', badTitle = 'Nie tym razem' }) {
  const list = shuffleOptions ? shuffle(options) : options;
  const choices = h('div', { class: 'choices', role: 'group', 'aria-label': 'Odpowiedzi' });
  const after = h('div', { class: 'stage' });
  const root = h(
    'div',
    { class: 'question' },
    typeof prompt === 'string' ? rich(prompt, 'p') : prompt,
    context ? (typeof context === 'string' ? h('div', { class: 'question-context', html: context }) : context) : null,
    choices,
    after
  );
  root.firstChild.classList?.add('question-prompt');

  let answered = false;
  const buttons = list.map((option, index) => {
    const stateIcon = h('span', { class: 'state-icon' });
    const btn = h(
      'button',
      { type: 'button', class: 'choice', onclick: () => pick(index) },
      h('span', { class: 'kbd', 'aria-hidden': 'true', text: String(index + 1) }),
      h('span', { class: 'choice-text', html: option.label }),
      stateIcon
    );
    btn.stateIcon = stateIcon;
    choices.append(btn);
    return btn;
  });

  const stopKeys = onKey(signal, (event) => {
    if (isTyping(event)) return;
    const n = Number(event.key);
    if (!answered && n >= 1 && n <= list.length) {
      event.preventDefault();
      pick(n - 1);
    }
  });

  function pick(index) {
    if (answered) return;
    answered = true;
    stopKeys();
    const chosen = list[index];
    const correct = Boolean(chosen.correct);
    buttons.forEach((btn, i) => {
      btn.disabled = true;
      const option = list[i];
      if (option.correct) {
        btn.classList.add('is-correct');
        btn.stateIcon.append(icon('check'));
      } else if (i === index) {
        btn.classList.add('is-wrong', 'shake');
        btn.stateIcon.append(icon('x'));
      } else {
        btn.classList.add('is-dim');
      }
    });
    const parts = [chosen.why, explain].filter(Boolean).join(' ');
    after.append(feedback(correct ? 'ok' : 'bad', correct ? okTitle : badTitle, parts));
    if (onDone) {
      const next = button({ label: nextLabel, variant: 'primary', iconAfter: 'arrowRight', shortcut: 'Enter', onclick: () => finish() });
      after.append(h('div', { class: 'btn-row' }, next));
      const stopEnter = onKey(signal, (event) => {
        if (event.key === 'Enter' && !isTyping(event)) {
          event.preventDefault();
          finish();
        }
      });
      let done = false;
      function finish() {
        if (done) return;
        done = true;
        stopEnter();
        onDone(correct, index);
      }
      requestAnimationFrame(() => next.focus({ preventScroll: true }));
      next.scrollIntoView({ block: 'nearest', behavior: scrollBehavior() });
    }
  }

  return root;
}

export function runQuiz(container, ctx, questions, { title, label = 'Pytanie', offset = 0, total, onAnswer } = {}) {
  return new Promise((resolve) => {
    let score = 0;
    let index = 0;
    const count = total ?? questions.length;
    const panel = h('section', { class: 'panel' });
    container.append(panel);

    function show() {
      if (index >= questions.length) {
        ctx.progress(offset + questions.length, count);
        panel.remove();
        resolve(score);
        return;
      }
      ctx.progress(offset + index, count);
      const q = questions[index];
      clear(panel);
      panel.append(
        h('div', { class: 'panel-title' }, h('span', { class: 'tag tag-accent', text: `${title ?? label} ${index + 1} z ${questions.length}` })),
        choiceQuestion({
          ...q,
          shuffleOptions: q.shuffleOptions ?? true,
          signal: ctx.signal,
          nextLabel: index === questions.length - 1 ? 'Zakończ' : 'Dalej',
          onDone: (correct) => {
            if (correct) score += 1;
            onAnswer?.(q, correct);
            index += 1;
            show();
          }
        })
      );
      panel.scrollIntoView({ block: 'start', behavior: scrollBehavior() });
    }

    show();
  });
}

export function draw(pool, count, level = 'podstawowy') {
  const advanced = shuffle(pool.filter((item) => item.level === 'zaawansowany'));
  const basic = shuffle(pool.filter((item) => item.level !== 'zaawansowany'));
  const picked = level === 'zaawansowany' ? [...advanced, ...basic].slice(0, count) : basic.slice(0, count);
  return shuffle(picked);
}

export function scrollBehavior() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

export function plural(count, one, few, many) {
  if (count === 1) return one;
  const tens = count % 100;
  const units = count % 10;
  return units >= 2 && units <= 4 && (tens < 12 || tens > 14) ? few : many;
}

export function formatNumber(value) {
  return new Intl.NumberFormat('pl-PL').format(value);
}
