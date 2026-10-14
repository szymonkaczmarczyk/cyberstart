import { h, button, feedback, clear, onKey, isTyping } from './ui.js';
import { icon } from './icons.js';

export function playScenario(stage, ctx, scenario, index, total, { label = 'Sytuacja', nextLabel = 'Następna sytuacja' } = {}) {
  return new Promise((resolve) => {
    const status = h('div', { 'aria-live': 'polite' });
    const choices = h('div', { class: 'choices' });
    const buttons = scenario.options.map((option, i) =>
      h(
        'button',
        { type: 'button', class: 'choice', onclick: () => pick(i) },
        h('span', { class: 'kbd', 'aria-hidden': 'true', text: String.fromCharCode(65 + i) }),
        h('span', { class: 'choice-text', text: option.label }),
        h('span', { class: 'state-icon' })
      )
    );
    choices.append(...buttons);
    const stopKeys = onKey(ctx.signal, (event) => {
      if (isTyping(event)) return;
      const i = event.key.toLowerCase().charCodeAt(0) - 97;
      if (event.key.length === 1 && i >= 0 && i < buttons.length) pick(i);
    });

    function pick(i) {
      stopKeys();
      const chosen = scenario.options[i];
      buttons.forEach((btn, j) => {
        btn.disabled = true;
        const option = scenario.options[j];
        if (option.best) {
          btn.classList.add('is-correct');
          btn.querySelector('.state-icon').append(icon('check'));
        } else if (j === i) {
          btn.classList.add(chosen.points > 0 ? 'is-partial' : 'is-wrong');
        } else btn.classList.add('is-dim');
      });
      const kind = chosen.points === 2 ? 'ok' : chosen.points === 1 ? 'warn' : 'bad';
      const title = chosen.points === 2 ? 'Najlepsza reakcja, 2 punkty' : chosen.points === 1 ? 'Nieźle, 1 punkt' : 'Ryzykowna reakcja, 0 punktów';
      const best = scenario.options.find((option) => option.best);
      status.replaceChildren(
        ...[
          feedback(kind, title, chosen.why),
          chosen.best ? null : feedback('info', 'Najlepsza reakcja', `${best.label}. ${best.why}`),
          h('div', { class: 'btn-row' }, button({ label: index === total - 1 ? 'Zobacz podsumowanie' : nextLabel, variant: 'primary', iconAfter: 'arrowRight', onclick: () => resolve(chosen.points) }))
        ].filter(Boolean)
      );
      status.querySelector('.btn-primary').focus();
    }

    clear(stage).append(
      h(
        'section',
        { class: 'panel' },
        h('div', { class: 'panel-title' }, h('span', { class: 'tag tag-accent', text: `${label} ${index + 1} z ${total}` }), scenario.time ? h('span', { class: 'tag mono' }, icon('clock'), scenario.time) : null),
        h('div', { class: 'scenario' }, h('span', { class: 'game-icon' }, icon(scenario.icon)), h('div', { class: 'prose' }, h('h2', { class: 't-h4', text: scenario.title }), h('p', { class: 'scenario-story', text: scenario.story }), scenario.phase ? h('span', { class: 'tag', text: scenario.phase }) : null)),
        h('p', { class: 'question-prompt', text: 'Co robisz?' }),
        choices,
        status
      )
    );
  });
}

export function scenarioQuestion(scenario) {
  return {
    prompt: `<strong>${scenario.title}.</strong> ${scenario.story} Co robisz?`,
    options: scenario.options.map((option) => ({ label: option.label, correct: Boolean(option.best), why: option.why })),
    level: scenario.level
  };
}
