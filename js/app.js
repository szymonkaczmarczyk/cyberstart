import { h, clear, button, rich, scrollBehavior, feedback, plural } from './ui.js';
import { icon } from './icons.js';
import { GAMES, CATEGORIES, findGame, nextGame, categoryOf } from './games/index.js';
import { getResult, recordResult, summary, resetProgress, getTheme, setTheme, exportProgress, importProgress, todayKey, getDifficulty, setDifficulty, getStreak, getDaily, setDaily } from './progress.js';
import { evaluateBadges, badgeStatus } from './badges.js';
import { practiceFor } from './resources.js';
import { TERM_NAMES } from './games/slownik.js';

const SITE_NAME = 'Cyberstart';
const DEFAULT_DESCRIPTION = `${GAMES.length} ${plural(GAMES.length, 'minigra', 'minigry', 'minigier')} po polsku, które uczą cyberbezpieczeństwa od zera: terminal Linuksa i mini CTF, sieci, hasła, phishing, firewall, analiza logów, śledztwa SOC i egzamin końcowy.`;

const main = document.getElementById('main');
const xpChip = document.getElementById('xp-chip');
const themeToggle = document.getElementById('theme-toggle');
const resetButton = document.getElementById('reset-progress');
let viewController = null;

function systemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function currentTheme() {
  return getTheme() ?? (systemPrefersDark() ? 'dark' : 'light');
}

function applyTheme() {
  const saved = getTheme();
  if (saved) document.documentElement.dataset.theme = saved;
  else delete document.documentElement.dataset.theme;
  const dark = currentTheme() === 'dark';
  themeToggle.replaceChildren(icon(dark ? 'sun' : 'moon'));
  themeToggle.setAttribute('aria-label', dark ? 'Włącz jasny motyw' : 'Włącz ciemny motyw');
  themeToggle.title = dark ? 'Jasny motyw' : 'Ciemny motyw';
}

themeToggle.addEventListener('click', () => {
  setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
  applyTheme();
});

resetButton.addEventListener('click', () => {
  if (window.confirm('Wyzerować cały postęp? Wyniki wszystkich gier zostaną usunięte z tej przeglądarki.')) {
    resetProgress();
    updateXpChip();
    route();
  }
});

document.getElementById('export-progress').addEventListener('click', () => {
  const blob = new Blob([exportProgress()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = h('a', { href: url, download: `cyberstart-postep-${todayKey()}.json` });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

const importInput = document.getElementById('import-file');
document.getElementById('import-progress').addEventListener('click', () => importInput.click());
importInput.addEventListener('change', async () => {
  const file = importInput.files?.[0];
  importInput.value = '';
  if (!file) return;
  if (file.size > 512 * 1024) {
    window.alert('Plik jest za duży. Wybierz plik wyeksportowany z Cyberstart.');
    return;
  }
  if (!window.confirm('Import zastąpi obecny postęp w tej przeglądarce danymi z pliku. Kontynuować?')) return;
  try {
    const count = importProgress(await file.text(), GAMES.map((game) => game.id));
    updateXpChip();
    route();
    window.alert(`Zaimportowano wyniki: ${count} ${plural(count, 'gra', 'gry', 'gier')}.`);
  } catch (error) {
    window.alert(`Nie udało się zaimportować postępu. ${error.message} Wybierz plik JSON pobrany przyciskiem „Eksportuj postęp”.`);
  }
});

function updateXpChip() {
  const stats = summary(GAMES.length);
  const streak = getStreak();
  xpChip.replaceChildren(
    ...[
      streak.count ? h('span', { class: 'xp-streak' }, icon('flame'), String(streak.count)) : null,
      icon('trophy'),
      h('span', { text: `${stats.xp} XP` }),
      h('span', { class: 't-muted xp-rank', text: stats.rank.name })
    ].filter(Boolean)
  );
  xpChip.setAttribute('aria-label', `Masz ${stats.xp} punktów doświadczenia, ranga ${stats.rank.name}${streak.count ? `, seria ${streak.count} dni` : ''}`);
}

function dailyGame() {
  const eligible = GAMES.filter((game) => !['egzamin', 'slownik'].includes(game.id));
  const seed = [...todayKey()].reduce((sum, ch) => (sum * 31 + ch.charCodeAt(0)) % 100003, 7);
  return eligible[seed % eligible.length];
}

function daysLabel(count) {
  return count === 1 ? 'dzień' : 'dni';
}

function setMeta(title, description) {
  document.title = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME}: cyberbezpieczeństwo od zera w minigrach`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', description ?? DEFAULT_DESCRIPTION);
}

function firstUnfinished() {
  return GAMES.find((game) => !getResult(game.id)) ?? null;
}

function renderHub() {
  setMeta(null, DEFAULT_DESCRIPTION);
  const stats = summary(GAMES.length);
  const next = firstUnfinished();
  const started = stats.completed > 0;

  const cta = next
    ? h('a', { class: 'btn btn-primary', href: `#/gra/${next.id}` }, icon('play'), h('span', { text: started ? `Kontynuuj: ${next.title}` : 'Zacznij od terminala' }))
    : h('a', { class: 'btn btn-primary', href: '#/gra/slownik' }, icon('book'), h('span', { text: 'Powtórz pojęcia na fiszkach' }));

  const hero = h(
    'section',
    { class: 'hero container' },
    h(
      'div',
      { class: 'hero-copy' },
      h('span', { class: 'tag tag-accent' }, icon('shield'), `${GAMES.length} ${plural(GAMES.length, 'minigra', 'minigry', 'minigier')}, po polsku, od zera`),
      h('h1', { class: 't-h1', html: 'Ucz się chronić sieci i dane, <span>grając</span>' }),
      h('p', { class: 't-lead', text: 'Krótkie gry, w których zdobywasz flagi w terminalu Linuksa, rozpoznajesz phishing, ustawiasz firewall, czytasz logi jak analityk SOC i prowadzisz reakcję na ransomware. Każda zaczyna się od minuty teorii napisanej dla osób, które dopiero startują.' }),
      h('div', { class: 'btn-row' }, cta, h('a', { class: 'btn btn-secondary', href: '#mapa' }, icon('map'), h('span', { text: 'Zobacz mapę nauki' })))
    ),
    statsCard(stats)
  );

  const path = h(
    'div',
    { class: 'path container', id: 'mapa' },
    CATEGORIES.map((category) => {
      const games = GAMES.filter((game) => game.category === category.id);
      return h(
        'section',
        { class: 'path-section', 'aria-labelledby': `cat-${category.id}` },
        h(
          'div',
          { class: 'path-head' },
          h('span', { class: 'tag' }, icon(category.icon), `${games.length} ${plural(games.length, 'moduł', 'moduły', 'modułów')}`),
          h('h2', { class: 't-h3', id: `cat-${category.id}`, text: category.title }),
          h('p', { text: category.description })
        ),
        h('div', { class: 'game-grid' }, games.map((game, i) => gameCard(game, i === 0 && games.length > 1)))
      );
    })
  );

  main.append(hero, todaySection(), path, badgesSection());
}

function todaySection() {
  const daily = dailyGame();
  const dailyDone = getDaily()?.done;
  const streak = getStreak();
  const badges = badgeStatus();
  const earned = badges.filter((badge) => badge.earned).length;
  return h(
    'section',
    { class: 'container today', 'aria-label': 'Dziś' },
    h(
      'div',
      { class: `card today-card today-daily${dailyDone ? ' is-done' : ''}` },
      h('span', { class: 'tag tag-accent' }, icon('calendar'), 'Wyzwanie dnia'),
      h('h2', { class: 't-h4', text: daily.title }),
      h('p', { class: 't-small t-muted', text: dailyDone ? 'Zaliczone. Jutro czeka nowe wyzwanie.' : 'Codziennie inna gra z całego kursu. Zalicz ją dziś, żeby zdobyć odznakę i podtrzymać serię.' }),
      dailyDone ? h('span', { class: 'meta status-done' }, icon('check'), 'Wyzwanie zaliczone') : h('a', { class: 'btn btn-primary', href: `#/gra/${daily.id}` }, icon('play'), h('span', { text: 'Podejmij wyzwanie' }))
    ),
    h(
      'div',
      { class: 'card today-card' },
      h('span', { class: 'tag' }, icon('flame'), 'Seria'),
      h('p', { class: 'today-number' }, h('strong', { text: String(streak.count) }), ` ${daysLabel(streak.count)} z rzędu`),
      h('p', { class: 't-small t-muted', text: streak.doneToday ? 'Dzisiejsza gra zaliczona. Wróć jutro, żeby wydłużyć serię.' : streak.count ? 'Zagraj dziś w dowolną grę, żeby nie przerwać serii.' : 'Ukończ dowolną grę, żeby rozpocząć serię.' }),
      h('p', { class: 't-small t-muted', text: `Najdłuższa seria: ${streak.best} ${daysLabel(streak.best)}` })
    ),
    h(
      'div',
      { class: 'card today-card' },
      h('span', { class: 'tag' }, icon('award'), 'Odznaki'),
      h('p', { class: 'today-number' }, h('strong', { text: `${earned}/${badges.length}` }), ' zdobytych'),
      h('div', { class: 'badge-strip', 'aria-hidden': 'true' }, badges.slice(0, 8).map((badge) => h('span', { class: `badge-mini${badge.earned ? ' is-earned' : ''}` }, icon(badge.icon)))),
      h('a', { class: 'btn btn-ghost btn-sm', href: '#odznaki' }, h('span', { text: 'Zobacz wszystkie' }), icon('chevronRight'))
    )
  );
}

function badgesSection() {
  const badges = badgeStatus();
  return h(
    'section',
    { class: 'container path-section badges-section', id: 'odznaki', 'aria-labelledby': 'badges-title' },
    h('div', { class: 'path-head' }, h('span', { class: 'tag' }, icon('award'), `${badges.filter((badge) => badge.earned).length} z ${badges.length}`), h('h2', { class: 't-h3', id: 'badges-title', text: 'Odznaki' }), h('p', { text: 'Zdobywasz je za ukończone działy, perfekcyjne wyniki, serie dni nauki i egzamin.' })),
    h(
      'ul',
      { class: 'badge-grid' },
      badges.map((badge) =>
        h(
          'li',
          { class: `badge-item${badge.earned ? ' is-earned' : ''}` },
          h('span', { class: 'badge-icon' }, icon(badge.icon)),
          h('div', {}, h('strong', { text: badge.title }), h('p', { class: 't-small t-muted', text: badge.earned ? `${badge.text} Zdobyta ${new Date(badge.earned).toLocaleDateString('pl-PL')}.` : badge.text }))
        )
      )
    )
  );
}

function statsCard(stats) {
  const percent = Math.round((stats.xp / stats.maxXp) * 100);
  const nextInfo = stats.nextRank
    ? `Do rangi ${stats.nextRank.name}: ${stats.gamesToNext} ${plural(stats.gamesToNext, 'ukończona gra', 'ukończone gry', 'ukończonych gier')}`
    : 'Najwyższa ranga zdobyta. Możesz poprawiać wyniki.';
  return h(
    'aside',
    { class: 'card stats-card', 'aria-label': 'Twój postęp' },
    h('div', { class: 'rank-row' }, h('span', { class: 't-caps t-muted', text: 'Twoja ranga' }), h('span', { class: 'rank-name', text: stats.rank.name })),
    h(
      'div',
      { class: 'progress' },
      h('div', { class: 'progress-track', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(stats.maxXp), 'aria-valuenow': String(stats.xp), 'aria-label': 'Zdobyte XP' }, h('div', { class: 'progress-bar', style: `transform:scaleX(${percent / 100})` })),
      h('span', { class: 'progress-label', text: `${percent}%` })
    ),
    h(
      'div',
      { class: 'stat-grid' },
      h('div', { class: 'stat' }, h('strong', { text: `${stats.completed}/${GAMES.length}` }), h('span', { text: 'ukończone' })),
      h('div', { class: 'stat' }, h('strong', { text: String(stats.xp) }), h('span', { text: 'XP' })),
      h('div', { class: 'stat' }, h('strong', { text: String(GAMES.reduce((sum, g) => sum + g.minutes, 0)) }), h('span', { text: 'minut nauki' }))
    ),
    h('p', { class: 't-small t-muted', text: nextInfo }),
    h('p', { class: 't-small t-muted', text: 'Postęp zapisuje się tylko w tej przeglądarce. Nic nie jest wysyłane.' })
  );
}

function gameCard(game, featured) {
  const result = getResult(game.id);
  const badge = game.badge?.() ?? null;
  const number = String(GAMES.indexOf(game) + 1).padStart(2, '0');
  return h(
    'a',
    { class: `game-card${featured ? ' is-featured' : ''}`, href: `#/gra/${game.id}`, 'aria-label': `${number}. ${game.title}${result ? `, ukończono, ${result.xp} XP` : ''}` },
    h('div', { class: 'game-card-top' }, h('span', { class: 'game-icon' }, icon(game.icon)), badge ? h('span', { class: 'attention' }, h('span', { class: 'attention-dot', 'aria-hidden': 'true' }), badge) : null, h('span', { class: 'game-num', text: number })),
    h('div', { class: 'game-card-body' }, h('h3', { class: 't-h4', text: game.title }), h('p', { text: game.summary })),
    h(
      'div',
      { class: 'game-card-foot' },
      h('span', { class: 'meta' }, icon('clock'), `${game.minutes} min`),
      result ? h('span', { class: 'meta status-done' }, icon('check'), `${result.xp} XP`) : h('span', { class: 'meta' }, 'Zagraj', icon('chevronRight'))
    )
  );
}

function renderGame(game) {
  setMeta(game.title, game.summary);
  const category = categoryOf(game);
  const result = getResult(game.id);
  const stage = h('div', { class: 'stage', id: 'game-stage' });
  const bar = h('div', { class: 'progress-bar' });
  const label = h('span', { class: 'progress-label', text: 'start' });
  const track = h('div', { class: 'progress-track', role: 'progressbar', 'aria-label': 'Postęp w grze', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '0' }, bar);
  const progressBox = h('div', { class: 'stage-progress' }, h('div', { class: 'progress' }, track, label));

  const view = h(
    'div',
    { class: 'game-view container' },
    h('div', {}, h('a', { class: 'btn btn-ghost', href: '#/' }, icon('arrowLeft'), h('span', { text: 'Wróć do mapy' }))),
    h(
      'header',
      { class: 'game-head' },
      h(
        'div',
        { class: 'game-head-meta' },
        h('span', { class: 'tag tag-accent' }, icon(category.icon), category.title),
        h('span', { class: 'tag' }, icon('clock'), `${game.minutes} min`),
        result ? h('span', { class: 'tag' }, icon('trophy'), `Najlepszy wynik: ${result.xp} XP`) : null
      ),
      game.levels ? levelSwitch() : null,
      h('h1', { class: 't-h2', text: game.title }),
      h('p', { class: 't-lead', text: game.summary })
    ),
    h(
      'details',
      { class: 'lesson', open: !result },
      h('summary', {}, icon('lightbulb'), h('span', { text: 'Zanim zaczniesz: minuta teorii' }), icon('chevronDown')),
      h('div', { class: 'lesson-body' }, game.lesson.map((part) => rich(part, part.startsWith('<ul') ? 'div' : 'p')))
    ),
    progressBox,
    stage
  );
  main.append(view);

  const ctx = {
    level: game.levels ? getDifficulty() : 'podstawowy',
    signal: viewController.signal,
    stage,
    progress(done, total) {
      progressBox.hidden = false;
      const percent = total ? Math.min(100, Math.round((done / total) * 100)) : 0;
      bar.style.transform = `scaleX(${percent / 100})`;
      track.setAttribute('aria-valuenow', String(percent));
      label.textContent = `${Math.min(done, total)}/${total}`;
    },
    hideProgress() {
      progressBox.hidden = true;
    },
    finish({ score, max }) {
      ctx.progress(max, max);
      label.textContent = 'koniec';
      const outcome = recordResult(game.id, score, max);
      outcome.level = ctx.level;
      outcome.daily = game.id === dailyGame().id && !getDaily()?.done;
      if (outcome.daily) setDaily({ id: game.id, done: true });
      const newBadges = evaluateBadges({ games: GAMES, terms: TERM_NAMES, outcome });
      updateXpChip();
      renderResult(stage, game, score, max, outcome, newBadges);
    }
  };

  Promise.resolve(game.mount(stage, ctx)).catch((error) => {
    console.error(error);
    stage.append(h('div', { class: 'empty' }, icon('alert'), h('p', { text: 'Coś poszło nie tak przy uruchamianiu gry. Odśwież stronę i spróbuj ponownie.' })));
  });
}

function levelSwitch() {
  const current = getDifficulty();
  const options = [
    { value: 'podstawowy', label: 'Podstawowy' },
    { value: 'zaawansowany', label: 'Zaawansowany' }
  ];
  return h(
    'div',
    { class: 'level-switch' },
    h('span', { class: 't-small t-muted', id: 'level-label', text: 'Poziom trudności:' }),
    h(
      'div',
      { class: 'segmented', role: 'radiogroup', 'aria-labelledby': 'level-label' },
      options.flatMap((option) => [
        h('input', { type: 'radio', name: 'level', id: `level-${option.value}`, value: option.value, checked: current === option.value, onchange: () => { setDifficulty(option.value); route(); } }),
        h('label', { for: `level-${option.value}`, text: option.label })
      ])
    )
  );
}

function renderResult(stage, game, score, max, outcome, newBadges) {
  clear(stage);
  const ratio = max ? score / max : 1;
  const verdict = ratio >= 0.9 ? 'Świetna robota' : ratio >= 0.6 ? 'Dobra robota' : 'Dobry początek';
  const comment = ratio >= 0.9 ? 'Ten temat masz opanowany. Przejdź dalej albo wróć tu za kilka dni, żeby utrwalić wiedzę.' : ratio >= 0.6 ? 'Większość już rozumiesz. Przeczytaj podsumowanie poniżej i spróbuj jeszcze raz, żeby wycisnąć komplet.' : 'Każdy ekspert zaczynał od zera. Przeczytaj podsumowanie, zagraj jeszcze raz i zobacz, jak rośnie wynik.';
  const next = nextGame(game.id);
  const scoreText = Number.isInteger(score) ? score : score.toFixed(1);

  stage.append(
    h(
      'section',
      { class: 'panel result', 'aria-live': 'polite' },
      h(
        'div',
        { class: 'result-score' },
        h('span', { class: 'result-badge' }, icon('trophy')),
        h('div', {}, h('h2', { class: 't-h3', text: verdict }), h('p', { class: 't-muted', text: `Wynik ${scoreText} z ${max}, czyli ${outcome.xp} XP${outcome.improved && outcome.previousXp ? `. Poprawiony rekord (było ${outcome.previousXp} XP)` : ''}.` }))
      ),
      h('p', { class: 'prose', text: comment }),
      outcome.daily ? feedback('ok', 'Wyzwanie dnia zaliczone', 'Jutro czeka kolejne. Wracaj codziennie, żeby wydłużać serię.') : null,
      outcome.streak.extended ? h('p', { class: 'result-streak' }, icon('flame'), `Seria: ${outcome.streak.count} ${daysLabel(outcome.streak.count)} z rzędu`) : null,
      newBadges.length ? h('div', { class: 'new-badges', role: 'status' }, h('h3', { class: 't-h4', text: newBadges.length === 1 ? 'Nowa odznaka' : 'Nowe odznaki' }), h('ul', { class: 'badge-grid' }, newBadges.map((badge) => h('li', { class: 'badge-item is-earned pop' }, h('span', { class: 'badge-icon' }, icon(badge.icon)), h('div', {}, h('strong', { text: badge.title }), h('p', { class: 't-small t-muted', text: badge.text })))))) : null,
      h('h3', { class: 't-h4', text: 'Zapamiętaj' }),
      h('ul', { class: 'takeaways' }, game.takeaways.map((item) => h('li', {}, icon('check'), rich(item)))),
      practiceFor(game.id).length ? h('div', { class: 'practice' }, h('h3', { class: 't-h4', text: 'Kolejny krok w praktyce' }), h('ul', { class: 'practice-list' }, practiceFor(game.id).map((resource) => h('li', {}, h('a', { href: resource.url, target: '_blank', rel: 'noopener noreferrer' }, h('span', { class: 'practice-label' }, resource.label, icon('external')), h('span', { class: 't-small t-muted', text: resource.note })))))) : null,
      h(
        'div',
        { class: 'btn-row' },
        next ? h('a', { class: 'btn btn-primary', href: `#/gra/${next.id}` }, h('span', { text: `Następna gra: ${next.title}` }), icon('arrowRight')) : h('a', { class: 'btn btn-primary', href: '#/' }, icon('map'), h('span', { text: 'Wróć do mapy' })),
        button({ label: 'Zagraj jeszcze raz', iconName: 'rotate', onclick: () => route() })
      )
    )
  );
  stage.scrollIntoView({ block: 'start', behavior: scrollBehavior() });
}

function renderNotFound() {
  setMeta('Nie ma takiej strony', 'Ta strona nie istnieje. Wróć do mapy nauki i wybierz minigrę.');
  main.append(
    h(
      'section',
      { class: 'container game-view' },
      h(
        'div',
        { class: 'empty' },
        h('span', { class: 'tag' }, icon('alert'), 'Błąd 404'),
        h('h1', { class: 't-h3', text: 'Tej strony nie ma na mapie' }),
        h('p', { text: 'Adres mógł się zmienić albo zawiera literówkę. To zresztą dobra lekcja: zawsze patrz, dokąd prowadzi link.' }),
        h('a', { class: 'btn btn-primary', href: '#/' }, icon('map'), h('span', { text: 'Wróć do mapy nauki' }))
      )
    )
  );
}

function route({ initial = false } = {}) {
  viewController?.abort();
  viewController = new AbortController();
  const hash = location.hash || '#/';
  if (hash === '#mapa' || hash === '#odznaki') {
    const target = hash.slice(1);
    if (!document.getElementById(target)) {
      history.replaceState(null, '', '#/');
      route();
      requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView({ behavior: scrollBehavior() }));
      return;
    }
    document.getElementById(target).scrollIntoView({ behavior: scrollBehavior() });
    return;
  }
  clear(main);
  main.classList.remove('view-enter');
  void main.offsetWidth;
  main.classList.add('view-enter');
  const gameMatch = hash.match(/^#\/gra\/([a-z0-9-]+)$/);
  if (hash === '#/' || hash === '#') renderHub();
  else if (gameMatch && findGame(gameMatch[1])) renderGame(findGame(gameMatch[1]));
  else renderNotFound();
  window.scrollTo({ top: 0, behavior: 'instant' });
  if (!initial) main.focus({ preventScroll: true });
}

document.querySelector('.skip-link').addEventListener('click', (event) => {
  event.preventDefault();
  main.focus();
});

window.addEventListener('hashchange', () => route());
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
applyTheme();
updateXpChip();
route({ initial: true });

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
