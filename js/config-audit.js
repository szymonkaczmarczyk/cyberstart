import { h, button, feedback, scrollBehavior } from './ui.js';
import { icon } from './icons.js';

function pointsFor(setting, value) {
  if (value === setting.best) return 2;
  if (value === setting.partial) return 1;
  return 0;
}

export function mountConfigAudit(stage, ctx, { settings, title, subtitle, iconName, okMessage, preview }) {
  const values = Object.fromEntries(settings.map((s) => [s.id, s.initial]));
  const auditBox = h('div', { 'aria-live': 'polite' });
  const previewBox = preview ? h('div', { class: 'config-preview' }) : null;
  const sections = [...new Set(settings.map((s) => s.section))];

  function secureCount() {
    return settings.filter((s) => values[s.id] === s.best).length;
  }

  function update() {
    ctx.progress(secureCount(), settings.length);
    if (previewBox) previewBox.replaceChildren(preview(values));
  }

  function control(setting) {
    const group = h('div', { class: 'segmented', role: 'radiogroup', 'aria-labelledby': `label-${setting.id}` });
    setting.options.forEach((option) => {
      const id = `opt-${setting.id}-${option.value}`;
      const input = h('input', { type: 'radio', name: setting.id, id, value: option.value, checked: values[setting.id] === option.value, onchange: () => { values[setting.id] = option.value; update(); } });
      group.append(input, h('label', { for: id, class: option.mono ? 'mono' : null, text: option.label }));
    });
    return group;
  }

  const panelBody = sections.map((section) =>
    h(
      'fieldset',
      { class: 'router-section' },
      h('legend', { class: 't-caps t-muted', text: section }),
      settings.filter((s) => s.section === section).map((setting) =>
        h(
          'div',
          { class: 'router-row' },
          h(
            'div',
            { class: 'router-label' },
            h('strong', { id: `label-${setting.id}`, class: setting.mono ? 'mono' : null, text: setting.label }),
            setting.caption ? h('span', { class: 't-small t-muted', text: setting.caption }) : null,
            h('details', { class: 'router-help' }, h('summary', {}, icon('info'), h('span', { text: 'Dlaczego to ważne?' })), h('p', { class: 't-small', text: setting.help }))
          ),
          control(setting)
        )
      )
    )
  );

  function audit() {
    const issues = settings.filter((s) => values[s.id] !== s.best);
    const count = secureCount();
    if (!issues.length) {
      auditBox.replaceChildren(
        feedback('ok', `Audyt: ${count} z ${settings.length} ustawień bezpiecznych`, okMessage),
        h('div', { class: 'btn-row' }, button({ label: 'Zakończ konfigurację', variant: 'primary', iconAfter: 'arrowRight', onclick: finish }))
      );
    } else {
      auditBox.replaceChildren(
        feedback(count >= settings.length * 0.66 ? 'warn' : 'bad', `Audyt: ${count} z ${settings.length} ustawień bezpiecznych`, 'Wykryte problemy:'),
        h('ul', { class: 'audit-list' }, issues.map((s) => h('li', {}, icon(values[s.id] === s.partial ? 'alert' : 'x'), h('span', { text: values[s.id] === s.partial ? `${s.issue} Akceptowalne, ale da się lepiej.` : s.issue })))),
        h('div', { class: 'btn-row' }, button({ label: 'Zakończ mimo to', iconAfter: 'arrowRight', onclick: finish }))
      );
    }
    auditBox.scrollIntoView({ block: 'nearest', behavior: scrollBehavior() });
  }

  function finish() {
    const score = settings.reduce((sum, s) => sum + pointsFor(s, values[s.id]), 0);
    ctx.finish({ score, max: settings.length * 2 });
  }

  stage.append(
    h(
      'section',
      { class: 'panel router-panel' },
      h('div', { class: 'router-top' }, h('span', { class: 'game-icon' }, icon(iconName)), h('div', {}, h('h2', { class: 't-h4', text: title }), h('p', { class: 't-small t-muted mono', text: subtitle }))),
      panelBody,
      previewBox,
      h('div', { class: 'btn-row router-actions' }, button({ label: 'Uruchom audyt', variant: 'primary', iconName: 'shieldCheck', onclick: audit })),
      auditBox
    )
  );
  update();
}

export function settingsToQuestions(settings) {
  return settings
    .filter((setting) => setting.options.some((option) => option.value !== setting.best))
    .map((setting) => ({
      prompt: `Które ustawienie jest bezpieczniejsze? <strong>${setting.label}</strong>${setting.caption ? ` (${setting.caption.toLowerCase()})` : ''}`,
      options: setting.options.map((option) => ({ label: option.label, correct: option.value === setting.best })),
      explain: setting.help
    }));
}
