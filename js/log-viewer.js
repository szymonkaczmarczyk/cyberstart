import { h, button } from './ui.js';
import { icon } from './icons.js';

function highlight(line, needle) {
  if (!needle) return [line];
  const parts = [];
  const lowerLine = line.toLowerCase();
  const lowerNeedle = needle.toLowerCase();
  let start = 0;
  let at = lowerLine.indexOf(lowerNeedle);
  while (at >= 0) {
    parts.push(line.slice(start, at), h('mark', { text: line.slice(at, at + needle.length) }));
    start = at + needle.length;
    at = lowerLine.indexOf(lowerNeedle, start);
  }
  parts.push(line.slice(start));
  return parts;
}

export function logViewer({ title, lines, filters, classify, placeholder }) {
  const filterInput = h('input', { class: 'input mono', id: 'log-filter', name: 'filter', type: 'search', placeholder, autocomplete: 'off', spellcheck: false });
  const count = h('span', { class: 't-small t-muted', 'aria-live': 'polite' });
  const view = h('ol', { class: 'log-view', 'aria-label': 'Linie logu', translate: 'no', tabindex: '0' });

  function render() {
    const needle = filterInput.value.trim();
    const visible = lines.map((line, i) => ({ line, i })).filter(({ line }) => !needle || line.toLowerCase().includes(needle.toLowerCase()));
    view.replaceChildren(...visible.map(({ line, i }) => h('li', { class: classify(line) }, h('span', { class: 'log-num', text: String(i + 1).padStart(2, '0') }), h('span', {}, highlight(line, needle)))));
    count.textContent = needle ? `${visible.length} z ${lines.length} linii pasuje do „${needle}”` : `${lines.length} linii`;
  }

  filterInput.addEventListener('input', render);
  const filterButtons = filters.map((value) => button({ label: value, size: 'sm', class: 'btn btn-secondary btn-sm mono', onclick: () => { filterInput.value = value; render(); } }));
  const clearButton = button({ label: 'Wyczyść', size: 'sm', iconName: 'x', class: 'btn btn-ghost btn-sm', onclick: () => { filterInput.value = ''; render(); filterInput.focus(); } });
  render();

  return h(
    'section',
    { class: 'panel log-panel' },
    h('div', { class: 'panel-title' }, icon('file'), h('h2', { class: 't-h4 mono', text: title })),
    h('div', { class: 'field' }, h('label', { for: 'log-filter', html: 'Filtr (jak <code>grep</code>)' }), filterInput),
    h('div', { class: 'btn-row' }, filterButtons, clearButton),
    count,
    view
  );
}
