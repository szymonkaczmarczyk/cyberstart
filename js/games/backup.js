import { h, button, feedback, scrollBehavior } from '../ui.js';
import { icon } from '../icons.js';

const CHOICES = [
  {
    id: 'copies',
    label: 'Ile kopii danych?',
    caption: 'Liczy się też oryginał na laptopie',
    options: [
      { value: '1', label: 'Tylko laptop' },
      { value: '2', label: 'Laptop i dysk USB' },
      { value: '3', label: 'Laptop, dysk USB i chmura' }
    ]
  },
  {
    id: 'usb',
    label: 'Dysk USB z kopią',
    caption: 'Kiedy jest podłączony do laptopa?',
    options: [
      { value: 'always', label: 'Zawsze podłączony' },
      { value: 'offline', label: 'Tylko na czas kopii' }
    ]
  },
  {
    id: 'versions',
    label: 'Historia wersji w chmurze',
    caption: 'Czy da się wrócić do starszej wersji pliku?',
    options: [
      { value: 'none', label: 'Tylko najnowsza wersja' },
      { value: 'days30', label: 'Wersje z 30 dni' }
    ]
  },
  {
    id: 'encrypted',
    label: 'Szyfrowanie dysków',
    caption: 'Laptop (FileVault, BitLocker) i dysk z kopią',
    options: [
      { value: 'no', label: 'Bez szyfrowania' },
      { value: 'yes', label: 'Zaszyfrowane' }
    ]
  },
  {
    id: 'tested',
    label: 'Test odtwarzania',
    caption: 'Czy sprawdzasz, że z kopii da się coś przywrócić?',
    options: [
      { value: 'never', label: 'Nigdy' },
      { value: 'quarterly', label: 'Co kwartał' }
    ]
  }
];

const DISASTERS = [
  {
    title: 'Awaria dysku laptopa',
    evaluate: (v) => (v.copies !== '1' ? [2, 'Dane są na drugim nośniku. Kupujesz nowy dysk i przywracasz.'] : [0, 'Jedyna kopia była na zepsutym dysku. Dane przepadły.'])
  },
  {
    title: 'Ransomware szyfruje laptopa, podłączone dyski i synchronizowane foldery',
    evaluate: (v) => {
      if (v.copies !== '1' && v.usb === 'offline') return [2, 'Dysk USB był odłączony, więc ransomware go nie dosięgnął.'];
      if (v.copies === '3' && v.versions === 'days30') return [2, 'Zaszyfrowane pliki zsynchronizowały się do chmury, ale historia wersji pozwala wrócić do stanu sprzed ataku.'];
      return [0, v.copies === '1' ? 'Nie ma żadnej kopii.' : 'Podłączony dysk i synchronizowana chmura bez historii wersji zostały zaszyfrowane razem z laptopem.'];
    }
  },
  {
    title: 'Włamanie do mieszkania: znika laptop i dysk USB',
    evaluate: (v) => {
      const survived = v.copies === '3';
      const leaked = v.encrypted === 'no';
      if (survived && !leaked) return [2, 'Kopia w chmurze ocalała, a skradzione dyski są zaszyfrowane, więc złodziej nie odczyta danych.'];
      if (survived) return [1, 'Dane odzyskasz z chmury, ale złodziej może przeczytać wszystko z niezaszyfrowanych dysków.'];
      return [0, leaked ? 'Wszystkie kopie były w jednym miejscu i zniknęły, a do tego nie były zaszyfrowane.' : 'Wszystkie kopie były w jednym miejscu. Dobrze chociaż, że złodziej ich nie odczyta.'];
    }
  },
  {
    title: 'Ważny plik skasowany dwa tygodnie temu. Zauważasz to dziś',
    evaluate: (v) => (v.copies === '3' && v.versions === 'days30' ? [2, 'Historia wersji sięga 30 dni wstecz. Plik wraca.'] : [0, 'Kopie przechowują tylko najnowszy stan, w którym pliku już nie ma.'])
  },
  {
    title: 'Przy odtwarzaniu okazuje się, że kopia na dysku USB od miesięcy była uszkodzona',
    evaluate: (v) => {
      if (v.tested === 'quarterly') return [2, 'Test odtwarzania wykrył problem wcześniej i kopia została naprawiona.'];
      if (v.copies === '3') return [1, 'Ratuje Cię chmura, ale gdyby to ona była uszkodzona, nikt by nie wiedział.'];
      return [0, 'Kopia, której nikt nie testował, okazała się bezużyteczna.'];
    }
  }
];

export default {
  id: 'backup',
  title: 'Kopie zapasowe 3-2-1',
  category: 'obrona',
  icon: 'rotate',
  minutes: 8,
  summary: 'Projektujesz kopie zapasowe dla swojego laptopa, a potem symulujesz pięć katastrof: awarię dysku, ransomware, kradzież, skasowany plik i uszkodzoną kopię.',
  lesson: [
    'Kopia zapasowa to jedyna pewna obrona przed ransomware, awarią i kradzieżą. Ale tylko dobrze zaprojektowana.',
    'Zasada <strong>3-2-1</strong>: <strong>3</strong> kopie danych, na <strong>2</strong> różnych nośnikach, z czego <strong>1</strong> poza domem lub biurem. Coraz częściej dodaje się też: jedna kopia offline lub niezmienialna, oraz zero błędów przy teście odtwarzania (3-2-1-1-0).',
    'Synchronizacja (np. folder w chmurze) to nie to samo co kopia: skasowany lub zaszyfrowany plik znika wszędzie. Ratuje dopiero <strong>historia wersji</strong>.',
    'Ustaw plan, uruchom symulację, popraw słabe punkty i spróbuj ponownie.'
  ],
  takeaways: [
    '3-2-1: trzy kopie, dwa nośniki, jedna poza domem.',
    'Kopia offline (odłączony dysk) albo historia wersji ratuje przed ransomware.',
    'Synchronizacja to nie backup. Potrzebujesz wersji z przeszłości.',
    'Szyfruj laptopa i dyski z kopią: kradzież nie może oznaczać wycieku.',
    'Kopia nieprzetestowana to nadzieja, a nie kopia. Testuj odtwarzanie regularnie.'
  ],
  mount(stage, ctx) {
    const values = Object.fromEntries(CHOICES.map((choice) => [choice.id, choice.options[0].value]));
    const results = h('div', { class: 'status-stack', 'aria-live': 'polite' });
    let runs = 0;
    const max = DISASTERS.length * 2;
    const simulateButton = button({ label: 'Uruchom symulację awarii', variant: 'secondary', iconName: 'play', 'data-autoplay': '', onclick: simulate });

    const rows = CHOICES.map((choice) => {
      const group = h('div', { class: 'segmented', role: 'radiogroup', 'aria-labelledby': `label-${choice.id}` });
      choice.options.forEach((option) => {
        const id = `opt-${choice.id}-${option.value}`;
        group.append(
          h('input', { type: 'radio', name: choice.id, id, value: option.value, checked: values[choice.id] === option.value, onchange: () => { values[choice.id] = option.value; } }),
          h('label', { for: id, text: option.label })
        );
      });
      return h('div', { class: 'router-row' }, h('div', { class: 'router-label' }, h('strong', { id: `label-${choice.id}`, text: choice.label }), h('span', { class: 't-small t-muted', text: choice.caption })), group);
    });

    function simulate() {
      runs += 1;
      simulateButton.removeAttribute('data-autoplay');
      const outcomes = DISASTERS.map((disaster) => ({ disaster, result: disaster.evaluate(values) }));
      const score = outcomes.reduce((sum, item) => sum + item.result[0], 0);
      ctx.progress(score, max);
      results.replaceChildren(
        feedback(score === max ? 'ok' : score >= max / 2 ? 'warn' : 'bad', `Symulacja ${runs}: ${score} z ${max} punktów`, score === max ? 'Twoje dane przetrwały wszystkie katastrofy.' : 'Popraw plan i uruchom symulację jeszcze raz albo zakończ z tym wynikiem.'),
        h(
          'ul',
          { class: 'disaster-list' },
          outcomes.map(({ disaster, result }) =>
            h('li', { class: result[0] === 2 ? 'ok' : result[0] === 1 ? 'warn' : 'bad' }, icon(result[0] === 2 ? 'check' : result[0] === 1 ? 'alert' : 'x'), h('div', {}, h('strong', { text: disaster.title }), h('p', { class: 't-small', text: result[1] })))
          )
        ),
        h('div', { class: 'btn-row' }, button({ label: score === max ? 'Zakończ' : 'Zakończ z tym wynikiem', variant: 'primary', iconAfter: 'arrowRight', onclick: () => ctx.finish({ score, max }) }))
      );
      results.scrollIntoView({ block: 'nearest', behavior: scrollBehavior() });
    }

    stage.append(
      h(
        'section',
        { class: 'panel router-panel' },
        h('div', { class: 'router-top' }, h('span', { class: 'game-icon' }, icon('rotate')), h('div', {}, h('h2', { class: 't-h4', text: 'Plan kopii zapasowych' }), h('p', { class: 't-small t-muted', text: 'Laptop z pracą dyplomową, zdjęciami i dokumentami firmy' }))),
        h('fieldset', { class: 'router-section' }, h('legend', { class: 't-caps t-muted', text: 'Twój plan' }), rows),
        h('div', { class: 'btn-row router-actions' }, simulateButton),
        results
      )
    );
    ctx.progress(0, max);
  }
};
