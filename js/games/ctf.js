import { h, button, feedback, rich } from '../ui.js';
import { createTerminal, dir, file } from '../terminal-engine.js';
import { icon } from '../icons.js';

const USER = 'kursant';
const HOST = 'ctf';
const WORDS = ['serwer', 'router', 'pakiet', 'klucz', 'port', 'sesja', 'token', 'proxy', 'skaner', 'brama', 'tunel', 'ramka', 'protokół', 'adres', 'domena', 'certyfikat', 'skrót', 'sól', 'log', 'alert'];
const PASSWORDS = ['123456', 'qwerty', 'zaq12wsx', 'polska', 'kochanie', 'haslo1', 'monika', 'misiek', 'marcin', 'iloveyou'];

function seeded(seed) {
  let value = seed;
  return () => {
    value = (value * 1103515245 + 12345) % 2147483648;
    return value / 2147483648;
  };
}

function binary(random, length) {
  return Array.from({ length }, () => String.fromCharCode(Math.floor(random() * 32))).join('');
}

function buildTree() {
  const random = seeded(2026);
  const pick = (list) => list[Math.floor(random() * list.length)];

  const haystack = Array.from({ length: 300 }, (_, i) => `${String(i + 1).padStart(3, '0')} ${pick(WORDS)} ${pick(WORDS)} ${pick(WORDS)}`);
  haystack.splice(187, 0, '188 hasło do następnego poziomu: FLAGA{grep_w_stogu_siana}');

  const repeated = [];
  WORDS.forEach((word) => {
    const times = 2 + Math.floor(random() * 4);
    for (let i = 0; i < times; i += 1) repeated.push(`${word}-${word.length * 7}`);
  });
  repeated.push('FLAGA{sort_i_uniq_razem}');
  repeated.sort(() => random() - 0.5);

  const serverLog = Array.from({ length: 200 }, (_, i) => `2026-10-14 03:${String(Math.floor(i / 4)).padStart(2, '0')}:${String((i * 13) % 60).padStart(2, '0')} INFO zadanie ${i + 1} zakończone`);
  serverLog.push('2026-10-14 04:59:59 INFO koniec dnia, FLAGA{tail_patrzy_na_koniec}');

  const accessLog = [];
  for (let i = 0; i < 160; i += 1) {
    const ip = i % 4 === 0 ? '203.0.113.45' : `198.51.100.${(i * 7) % 250}`;
    accessLog.push(`${ip} - - [14/Oct/2026:10:${String(i % 60).padStart(2, '0')}:00] "GET /produkt/${i} HTTP/1.1" 200`);
  }
  const attackerCount = accessLog.filter((line) => line.startsWith('203.0.113.45')).length;

  const leaked = [];
  PASSWORDS.forEach((password, i) => {
    const times = password === 'kochanie' ? 41 : 5 + ((i * 7) % 23);
    for (let n = 0; n < times; n += 1) leaked.push(password);
  });
  leaked.sort(() => random() - 0.5);

  const level4 = {};
  for (let i = 0; i < 10; i += 1) {
    level4[`plik0${i}`] = file(i === 7 ? 'FLAGA{file_rozpoznaje_typ}' : binary(random, 40));
  }

  const archive = {};
  ['2023', '2024', '2025'].forEach((year) => {
    archive[year] = dir({
      q1: dir({ 'raport.txt': file(`Raport ${year} Q1`) }),
      q2: dir({ 'raport.txt': file(`Raport ${year} Q2`), notatki: dir({ 'todo.txt': file('przejrzeć logi') }) }),
      q3: dir({ stare: dir(year === '2025' ? { 'klucz.txt': file('FLAGA{find_znajdzie_wszystko}') } : { 'kopia.txt': file('nic ciekawego') }) })
    });
  });

  return {
    attackerCount,
    tree: dir({
      home: dir({
        [USER]: dir({
          'START.txt': file('Witaj w mini CTF!\nKażdy poziom ma swój katalog: poziom1, poziom2 i tak dalej.\nZnajdź flagę w formacie FLAGA{...} i wpisz ją w polu obok terminala.\nZacznij od: cd poziom1'),
          poziom1: dir({ '-flaga': file('FLAGA{myslnik_to_nie_opcja}') }),
          poziom2: dir({ 'moja notatka.txt': file('FLAGA{spacje_w_cudzyslowie}') }),
          poziom3: dir({ '.schowek': dir({ '.jeszcze_glebiej': dir({ 'flaga.txt': file('FLAGA{ukryte_katalogi}') }) }), 'wskazowka.txt': file('Tu nic nie widać... a może jednak?') }),
          poziom4: dir(level4),
          poziom5: dir({ 'wskazowka.txt': file('Flaga jest w pliku klucz.txt, gdzieś w katalogu /srv.\nNie szukaj ręcznie, użyj find.') }),
          poziom6: dir({ 'dane.txt': file(haystack.join('\n')) }),
          poziom7: dir({ 'lista.txt': file(repeated.join('\n')) }),
          poziom8: dir({ 'zakodowane.txt': file(btoa('FLAGA{base64_to_nie_szyfr}')) }),
          poziom9: dir({ 'serwer.log': file(serverLog.join('\n')) }),
          poziom10: dir({ 'sejf.txt': file('FLAGA{chmod_otwiera_drzwi}', '----------') }),
          poziom11: dir({ 'dostep.log': file(accessLog.join('\n')) }),
          poziom12: dir({ 'wyciek.txt': file(leaked.join('\n')) })
        })
      }),
      srv: dir({ archiwum: dir(archive) }),
      etc: dir({ hostname: file(HOST) })
    })
  };
}

const LEVELS = [
  {
    title: 'Myślnik w nazwie',
    task: 'W katalogu <code>poziom1</code> jest plik <code>-flaga</code>. Odczytaj go.',
    hint: 'Polecenie traktuje <code>-flaga</code> jak opcję. Podaj ścieżkę z kropką: <code>cat ./-flaga</code>.',
    flag: 'FLAGA{myslnik_to_nie_opcja}',
    learn: 'Ścieżka <code>./</code> mówi wprost „plik w bieżącym katalogu”. Ten sam trik działa przy usuwaniu dziwnych plików.'
  },
  {
    title: 'Spacje w nazwie',
    task: 'W <code>poziom2</code> czeka plik ze spacją w nazwie.',
    hint: 'Weź nazwę w cudzysłów: <code>cat "moja notatka.txt"</code> albo użyj Tab, który doda <code>\\</code> przed spacją.',
    flag: 'FLAGA{spacje_w_cudzyslowie}',
    learn: 'Spacja rozdziela argumenty. Cudzysłów albo ukośnik wsteczny sprawiają, że nazwa jest jednym argumentem.'
  },
  {
    title: 'Schowek w schowku',
    task: 'W <code>poziom3</code> flaga jest głęboko w ukrytych katalogach.',
    hint: 'Użyj <code>ls -a</code>, wejdź do ukrytego katalogu przez <code>cd</code> i powtórz.',
    flag: 'FLAGA{ukryte_katalogi}',
    learn: 'Ukryte katalogi to ulubione miejsce na konfigurację, ale też na pozostawione przez intruza narzędzia.'
  },
  {
    title: 'Jedyny czytelny plik',
    task: 'W <code>poziom4</code> jest 10 plików. Tylko jeden zawiera tekst.',
    hint: 'Polecenie <code>file ./*</code> rozpozna typ każdego pliku po zawartości.',
    flag: 'FLAGA{file_rozpoznaje_typ}',
    learn: 'Rozszerzenie można zmienić, zawartości nie. <code>file</code> patrzy na zawartość, dlatego analitycy go uwielbiają.'
  },
  {
    title: 'Igła w archiwum',
    task: 'Flaga jest w pliku <code>klucz.txt</code> gdzieś w <code>/srv</code>. Przeczytaj wskazówkę w <code>poziom5</code>.',
    hint: 'Wpisz <code>find /srv -name klucz.txt</code>, a potem odczytaj znalezioną ścieżkę przez <code>cat</code>.',
    flag: 'FLAGA{find_znajdzie_wszystko}',
    learn: '<code>find</code> przeszukuje całe drzewo katalogów po nazwie, rozmiarze albo typie.'
  },
  {
    title: 'Stóg siana',
    task: 'Plik <code>poziom6/dane.txt</code> ma ponad 300 linii. Jedna z nich zawiera słowo <code>hasło</code>.',
    hint: 'Wpisz <code>grep hasło poziom6/dane.txt</code>.',
    flag: 'FLAGA{grep_w_stogu_siana}',
    learn: 'Zamiast przewijać, filtruj. To podstawowa umiejętność przy analizie logów.'
  },
  {
    title: 'Jedyna bez pary',
    task: 'W <code>poziom7/lista.txt</code> każda linia się powtarza, oprócz jednej.',
    hint: 'Posortuj i zostaw tylko unikalne: <code>sort poziom7/lista.txt | uniq -u</code>.',
    flag: 'FLAGA{sort_i_uniq_razem}',
    learn: 'Potok <code>|</code> przekazuje wynik jednego polecenia do następnego. <code>uniq</code> działa tylko na sąsiednich liniach, stąd najpierw <code>sort</code>.'
  },
  {
    title: 'Zakodowany sekret',
    task: 'Plik <code>poziom8/zakodowane.txt</code> wygląda na bełkot.',
    hint: 'To Base64. Odkoduj: <code>base64 -d poziom8/zakodowane.txt</code>.',
    flag: 'FLAGA{base64_to_nie_szyfr}',
    learn: 'Base64 to kodowanie, a nie szyfrowanie. Każdy je odwróci bez klucza.'
  },
  {
    title: 'Koniec dnia',
    task: 'Flaga jest w ostatniej linii długiego pliku <code>poziom9/serwer.log</code>.',
    hint: 'Wpisz <code>tail -n 1 poziom9/serwer.log</code>.',
    flag: 'FLAGA{tail_patrzy_na_koniec}',
    learn: '<code>tail</code> pokazuje koniec pliku, czyli najświeższe wpisy w logach. Na serwerze <code>tail -f</code> śledzi log na żywo.'
  },
  {
    title: 'Zamknięty sejf',
    task: 'Plik <code>poziom10/sejf.txt</code> należy do Ciebie, ale nie masz prawa go czytać.',
    hint: 'Nadaj sobie prawo odczytu: <code>chmod u+r poziom10/sejf.txt</code>, a potem <code>cat</code>.',
    flag: 'FLAGA{chmod_otwiera_drzwi}',
    learn: 'Właściciel pliku może zmieniać jego uprawnienia. Sprawdź to przez <code>ls -l</code> przed i po.'
  },
  {
    title: 'Liczenie wizyt',
    task: 'Ile razy adres <code>203.0.113.45</code> pojawia się w <code>poziom11/dostep.log</code>? Flaga to <code>FLAGA{liczba}</code>.',
    hint: 'grep z opcją <code>-c</code> liczy pasujące linie: <code>grep -c 203.0.113.45 poziom11/dostep.log</code>.',
    flag: null,
    learn: 'Liczenie zdarzeń z jednego adresu to pierwszy krok przy wykrywaniu skanowania i ataków.'
  },
  {
    title: 'Najpopularniejsze hasło',
    task: 'Plik <code>poziom12/wyciek.txt</code> to hasła z fikcyjnego wycieku. Które pojawia się najczęściej? Flaga to <code>FLAGA{hasło}</code>.',
    hint: 'Policz i posortuj: <code>sort poziom12/wyciek.txt | uniq -c | sort -n -r | head -n 1</code>.',
    flag: 'FLAGA{kochanie}',
    learn: 'Tak obrońcy analizują wycieki: zliczają najpopularniejsze hasła i dopisują je do list zakazanych przy rejestracji.'
  }
];

export default {
  id: 'ctf',
  title: 'Terminal poziom 2: mini CTF',
  category: 'linux',
  icon: 'flag',
  minutes: 20,
  summary: 'Dwanaście poziomów w stylu OverTheWire Bandit: dziwne nazwy plików, ukryte katalogi, find, grep, potoki, Base64 i chmod. Na każdym poziomie szukasz flagi.',
  lesson: [
    '<strong>CTF</strong> (Capture The Flag) to zadania, w których szukasz ukrytego tekstu, czyli flagi. To najpopularniejszy i w pełni legalny sposób nauki bezpieczeństwa.',
    'Tu ćwiczysz polecenia, których naprawdę używa się na co dzień: <code>find</code>, <code>grep</code>, <code>sort</code>, <code>uniq</code>, <code>head</code>, <code>tail</code>, <code>base64</code> i <code>chmod</code>.',
    'Najważniejsza nowość to <strong>potok</strong> <code>|</code>: wynik jednego polecenia trafia do następnego. Przykład: <code>sort plik.txt | uniq -c</code> liczy powtórzenia.',
    'Znalezioną flagę wklej w pole obok terminala. Podpowiedź kosztuje połowę punktów za poziom. Instrukcje poleceń: <code>man polecenie</code>.'
  ],
  takeaways: [
    'Plik z myślnikiem czytasz przez <code>./-nazwa</code>, nazwę ze spacją bierzesz w cudzysłów.',
    '<code>find /srv -name klucz.txt</code> znajduje pliki, <code>file</code> rozpoznaje ich typ po zawartości.',
    'Potoki to supermoc terminala: <code>sort | uniq -c | sort -n -r | head</code> pokazuje najczęstsze wartości.',
    '<code>grep -c</code> liczy, <code>tail -n</code> pokazuje koniec pliku, <code>base64 -d</code> dekoduje.',
    'Dalej ćwicz na prawdziwym serwerze w grze OverTheWire Bandit. To ta sama mechanika, tylko przez SSH.'
  ],
  mount(stage, ctx) {
    const { tree, attackerCount } = buildTree();
    const levels = LEVELS.map((level) => ({ ...level, flag: level.flag ?? `FLAGA{${attackerCount}}` }));
    let current = 0;
    const hintsUsed = new Set();
    const terminal = createTerminal({
      tree,
      user: USER,
      host: HOST,
      quick: ['cat START.txt', 'ls -a', 'cd ..', 'man find', 'clear'],
      intro: [
        ['Mini CTF (symulator edukacyjny). Zacznij od: cat START.txt', 'term-accent'],
        ['Wpisz help, żeby zobaczyć polecenia, albo man nazwa, żeby poznać szczegóły.', 'term-muted']
      ]
    });

    const levelBox = h('div', { class: 'stage' });
    const flagInput = h('input', { class: 'input mono', id: 'ctf-flag', name: 'flag', type: 'text', autocomplete: 'off', spellcheck: false, autocapitalize: 'off', placeholder: 'FLAGA{...}' });
    const flagStatus = h('div', { 'aria-live': 'polite' });
    const submit = button({ label: 'Zgłoś flagę', variant: 'primary', iconName: 'flag', onclick: check });
    flagInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        check();
      }
    });
    const levelList = h('ol', { class: 'ctf-levels', 'aria-label': 'Poziomy' });

    const panel = h(
      'aside',
      { class: 'panel' },
      h('div', { class: 'panel-title' }, icon('flag'), h('h2', { class: 't-h4', text: 'Poziomy' })),
      levelList,
      levelBox,
      h('div', { class: 'field' }, h('label', { for: 'ctf-flag', text: 'Znaleziona flaga' }), flagInput),
      h('div', { class: 'btn-row' }, submit),
      flagStatus
    );

    stage.append(h('div', { class: 'split' }, h('div', { class: 'stage' }, terminal.element, terminal.quickBar), panel));

    function renderLevel() {
      ctx.progress(current, levels.length);
      levelList.replaceChildren(
        ...levels.map((level, i) => h('li', { class: i < current ? 'is-done' : i === current ? 'is-current' : '', title: level.title, 'aria-label': `Poziom ${i + 1}: ${level.title}${i < current ? ', zaliczony' : ''}` }, i < current ? icon('check') : String(i + 1)))
      );
      const level = levels[current];
      if (!level) return;
      flagInput.dataset.level = String(current + 1);
      const hintBox = h('div');
      const hintBtn = button({
        label: 'Pokaż podpowiedź',
        iconName: 'lightbulb',
        size: 'sm',
        onclick: () => {
          hintsUsed.add(current);
          hintBtn.disabled = true;
          hintBox.replaceChildren(feedback('info', null, level.hint));
        }
      });
      levelBox.replaceChildren(
        h('span', { class: 'tag tag-accent', text: `Poziom ${current + 1} z ${levels.length}` }),
        h('h3', { class: 't-h4', text: level.title }),
        rich(level.task, 'p'),
        hintBox,
        h('div', {}, hintBtn)
      );
    }

    function check() {
      const level = levels[current];
      if (!level) return;
      const value = flagInput.value.trim();
      if (!value) {
        flagStatus.replaceChildren(feedback('info', null, 'Wpisz flagę w formacie FLAGA{...}. Skopiuj ją z terminala.'));
        return;
      }
      if (value !== level.flag) {
        flagStatus.replaceChildren(feedback('bad', 'To nie ta flaga', 'Sprawdź, czy skopiowana jest całość razem z nawiasami klamrowymi. Wielkość liter ma znaczenie.'));
        flagInput.classList.remove('shake');
        void flagInput.offsetWidth;
        flagInput.classList.add('shake');
        return;
      }
      flagInput.value = '';
      flagStatus.replaceChildren(feedback('ok', `Poziom ${current + 1} zaliczony`, level.learn));
      current += 1;
      renderLevel();
      if (current === levels.length) {
        const score = levels.reduce((sum, _, i) => sum + (hintsUsed.has(i) ? 1 : 2), 0);
        flagInput.disabled = true;
        submit.disabled = true;
        levelBox.replaceChildren(feedback('ok', 'Wszystkie flagi zdobyte', 'Masz za sobą 12 poziomów. Tak samo wygląda praca w OverTheWire Bandit, tylko na prawdziwym serwerze przez SSH.'));
        flagStatus.append(h('div', { class: 'btn-row' }, button({ label: 'Zobacz podsumowanie', variant: 'primary', iconAfter: 'arrowRight', onclick: () => ctx.finish({ score, max: levels.length * 2 }) })));
      }
    }

    renderLevel();
  }
};
