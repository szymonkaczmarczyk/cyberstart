import { h, button, feedback, runQuiz, clear, draw, shuffle } from '../ui.js';
import { icon } from '../icons.js';

const WHO = [
  { key: 'u', label: 'Właściciel', hint: 'user' },
  { key: 'g', label: 'Grupa', hint: 'group' },
  { key: 'o', label: 'Inni', hint: 'others' }
];

const BITS = [
  { key: 'r', label: 'czytanie', value: 4 },
  { key: 'w', label: 'zapis', value: 2 },
  { key: 'x', label: 'wykonanie', value: 1 }
];

const TASKS = [
  {
    file: 'backup.sh',
    kind: 'skrypt',
    goal: 'Właściciel może czytać, zmieniać i uruchamiać skrypt. Nikt inny nie ma żadnego dostępu.',
    target: '700',
    explain: '<code>700</code>, czyli <code>rwx------</code>. Skrypt kopii zapasowej często zawiera ścieżki i hasła, więc obcy nie powinni nawet go czytać.'
  },
  {
    file: 'index.html',
    kind: 'strona WWW',
    goal: 'Właściciel czyta i zapisuje. Grupa i wszyscy inni mogą tylko czytać (serwer WWW musi plik odczytać).',
    target: '644',
    explain: '<code>644</code>, czyli <code>rw-r--r--</code>. To najczęstsze uprawnienia zwykłych plików: każdy czyta, zmienia tylko właściciel.'
  },
  {
    file: 'id_ed25519',
    kind: 'prywatny klucz SSH',
    goal: 'Tylko właściciel może czytać i zapisywać. Grupa i inni nic.',
    target: '600',
    explain: '<code>600</code>, czyli <code>rw-------</code>. Program SSH wręcz odmówi użycia klucza prywatnego, jeśli inni mają do niego dostęp. Klucz prywatny jest jak hasło.'
  },
  {
    file: 'publiczne/',
    kind: 'katalog',
    goal: 'Właściciel ma pełny dostęp. Grupa i inni mogą wejść do katalogu i przeglądać pliki, ale nie mogą nic w nim zmieniać.',
    target: '755',
    explain: '<code>755</code>, czyli <code>rwxr-xr-x</code>. Przy katalogu <code>x</code> oznacza prawo wejścia do środka (cd), a <code>r</code> prawo wyświetlenia listy plików.'
  },
  {
    file: 'raport_zespolu.docx',
    kind: 'dokument zespołu',
    goal: 'Właściciel i jego grupa (zespół) mogą czytać i zapisywać. Inni nie mają dostępu.',
    target: '660',
    explain: '<code>660</code>, czyli <code>rw-rw----</code>. Grupy pozwalają dać dostęp całemu zespołowi bez otwierania pliku dla wszystkich.'
  },
  {
    file: 'db.conf',
    kind: 'konfiguracja z hasłem do bazy',
    goal: 'Właściciel może tylko czytać (nawet on nie zmieni pliku przez przypadek). Nikt inny nic.',
    target: '400',
    explain: '<code>400</code>, czyli <code>r--------</code>. Pliki z sekretami trzymamy maksymalnie zamknięte. To zasada najmniejszych uprawnień.'
  }
];

const QUESTION_POOL = [
  {
    prompt: 'Kolega, żeby „szybko naprawić” błąd, ustawił na serwerze <code>chmod 777</code> na całym katalogu strony. Co to oznacza?',
    options: [
      { label: 'Każdy użytkownik systemu może czytać, zmieniać i uruchamiać te pliki', correct: true, why: '<code>7</code> to <code>rwx</code> dla wszystkich trzech grup. Jeśli ktoś przejmie dowolne konto lub proces na serwerze, podmieni pliki strony.' },
      { label: 'Pliki stają się tylko do odczytu', why: 'Odwrotnie. Tylko do odczytu to np. <code>444</code>.' },
      { label: 'Tylko administrator ma dostęp', why: 'Administrator (root) i tak ma dostęp do wszystkiego, a <code>777</code> otwiera pliki dla każdego.' }
    ],
    explain: '<code>777</code> prawie nigdy nie jest dobrym rozwiązaniem. Zamiast tego ustaw właściwego właściciela pliku (<code>chown</code>) i minimalne uprawnienia.'
  },
  {
    prompt: 'W wyniku <code>ls -l</code> widzisz: <code>-rwxr-x--- 1 anna dev skrypt.sh</code>. Kto może uruchomić skrypt?',
    options: [
      { label: 'Anna i członkowie grupy dev', correct: true, why: 'Właściciel (anna) ma <code>rwx</code>, grupa dev ma <code>r-x</code>, inni nie mają nic (<code>---</code>).' },
      { label: 'Tylko Anna', why: 'Grupa dev też ma <code>x</code> w środkowej trójce.' },
      { label: 'Wszyscy', why: 'Ostatnia trójka <code>---</code> oznacza brak praw dla innych.' }
    ]
  },
  {
    prompt: 'Co oznacza zasada najmniejszych uprawnień?',
    options: [
      { label: 'Każdy użytkownik i program dostaje tylko te uprawnienia, których naprawdę potrzebuje', correct: true, why: 'Dzięki temu przejęcie jednego konta lub programu daje atakującemu jak najmniej.' },
      { label: 'Użytkownik powinien mieć jak najmniej haseł', why: 'To zupełnie inny temat. Haseł powinno być dużo, każde unikalne.' },
      { label: 'Wszyscy pracują na koncie administratora, żeby było prościej', why: 'To odwrotność tej zasady i częsta przyczyna poważnych włamań.' }
    ]
  },
  {
    prompt: 'Jak zmienić właściciela pliku <code>strona.html</code> na użytkownika <code>www-data</code>?',
    options: [
      { label: '<code>sudo chown www-data strona.html</code>', correct: true, why: '<code>chown</code> (change owner) zmienia właściciela. Zmiana właściciela wymaga uprawnień administratora.' },
      { label: '<code>chmod www-data strona.html</code>', why: '<code>chmod</code> zmienia uprawnienia, a nie właściciela.' },
      { label: '<code>mv strona.html www-data</code>', why: '<code>mv</code> przenosi albo zmienia nazwę pliku.' }
    ]
  },
  {
    prompt: 'W <code>ls -l</code> widzisz <code>-rwsr-xr-x root root /usr/bin/passwd</code>. Co oznacza litera <code>s</code>?',
    level: 'zaawansowany',
    options: [
      { label: 'SUID: program działa z uprawnieniami właściciela (tu roota), niezależnie od tego, kto go uruchomił', correct: true, why: 'Dzięki temu zwykły użytkownik może zmienić swoje hasło w chronionym pliku. Każdy niepotrzebny program z SUID roota to potencjalna droga do przejęcia systemu, więc audytorzy zawsze ich szukają.' },
      { label: 'Plik jest zaszyfrowany', why: 'Uprawnienia nie mówią nic o szyfrowaniu.' },
      { label: 'Plik jest ukryty', why: 'Ukryte pliki poznaje się po kropce na początku nazwy.' }
    ]
  },
  {
    prompt: 'Co robi <code>umask 027</code>?',
    level: 'zaawansowany',
    options: [
      { label: 'Nowe pliki domyślnie nie dają innym żadnych praw, a grupie odbiera zapis', correct: true, why: 'umask „odejmuje” prawa od domyślnych. Przy 027 nowy katalog dostaje 750, a plik 640. To bezpieczniejsze ustawienie niż typowe 022.' },
      { label: 'Ustawia uprawnienia 027 wszystkim istniejącym plikom', why: 'umask działa tylko na nowo tworzone pliki.' }
    ]
  },
  {
    prompt: 'Katalog <code>/tmp</code> ma uprawnienia <code>drwxrwxrwt</code>. Do czego służy litera <code>t</code> na końcu?',
    level: 'zaawansowany',
    options: [
      { label: 'Sticky bit: każdy może tworzyć pliki, ale usuwać może tylko swoje', correct: true, why: 'Bez sticky bitu w katalogu wspólnym dla wszystkich każdy mógłby kasować cudze pliki.' },
      { label: 'Pliki są tymczasowe i znikną po minucie', why: 'Czyszczenie /tmp to osobny mechanizm. Litera t to sticky bit.' }
    ]
  }
];

function modeToString(bits) {
  return WHO.map((who) => BITS.map((bit) => (bits[who.key][bit.key] ? bit.key : '-')).join('')).join('');
}

function modeToOctal(bits) {
  return WHO.map((who) => BITS.reduce((sum, bit) => sum + (bits[who.key][bit.key] ? bit.value : 0), 0)).join('');
}

function emptyBits() {
  return Object.fromEntries(WHO.map((who) => [who.key, { r: false, w: false, x: false }]));
}

export default {
  id: 'uprawnienia',
  title: 'Uprawnienia plików',
  category: 'linux',
  icon: 'folder',
  minutes: 8,
  levels: true,
  summary: 'Ustaw właściwe uprawnienia sześciu plikom, od skryptu kopii zapasowej po klucz SSH, i naucz się czytać zapis rwx oraz liczby w chmod.',
  lesson: [
    'W Linuksie każdy plik ma <strong>właściciela</strong>, <strong>grupę</strong> i resztę świata, czyli <strong>innych</strong>. Dla każdej z tych trzech stron osobno ustala się, co wolno.',
    'Są trzy prawa: <code>r</code> czytanie (read), <code>w</code> zapis (write) i <code>x</code> wykonanie (execute, czyli uruchomienie programu albo wejście do katalogu).',
    'Każde prawo ma wartość: <code>r = 4</code>, <code>w = 2</code>, <code>x = 1</code>. Sumujesz je osobno dla każdej strony. Na przykład <code>rw-</code> to 4 + 2 = <code>6</code>, a <code>r-x</code> to 4 + 1 = <code>5</code>.',
    'Stąd zapis <code>chmod 640 plik</code>: właściciel 6 (czyta i pisze), grupa 4 (czyta), inni 0 (nic). W <code>ls -l</code> zobaczysz to jako <code>-rw-r-----</code>.'
  ],
  takeaways: [
    'Trzy strony: właściciel, grupa, inni. Trzy prawa: <code>r</code> = 4, <code>w</code> = 2, <code>x</code> = 1.',
    'Typowe zestawy: <code>644</code> zwykłe pliki, <code>755</code> katalogi i programy, <code>600</code> klucze i sekrety, <code>700</code> prywatne skrypty.',
    '<code>chmod 777</code> to otwarte drzwi. Prawie zawsze lepiej poprawić właściciela przez <code>chown</code>.',
    'Zasada najmniejszych uprawnień: dawaj tylko tyle dostępu, ile jest naprawdę potrzebne.'
  ],
  async mount(stage, ctx) {
    const tasks = shuffle(TASKS);
    const questions = draw(QUESTION_POOL, 3, ctx.level);
    const total = tasks.length + questions.length;
    let score = 0;
    const panel = h('section', { class: 'panel' });
    stage.append(panel);

    for (const [index, task] of tasks.entries()) {
      ctx.progress(index, total);
      score += await playTask(task, index);
    }
    clear(panel);
    panel.remove();
    const quizScore = await runQuiz(stage, ctx, questions, { label: 'Pytanie', offset: tasks.length, total });
    ctx.finish({ score: score + quizScore * 2, max: total * 2 });

    function playTask(task, index) {
      return new Promise((resolve) => {
        const bits = emptyBits();
        let attempts = 0;
        const symbolic = h('code', { class: 'perm-string' });
        const octal = h('code', { class: 'perm-octal' });
        const result = h('div');
        const grid = h('div', { class: 'perm-grid', role: 'group', 'aria-label': 'Uprawnienia' });

        for (const who of WHO) {
          const column = h('fieldset', { class: 'perm-col' }, h('legend', {}, h('strong', { text: who.label }), h('span', { class: 't-muted t-small', text: ` (${who.hint})` })));
          for (const bit of BITS) {
            const id = `perm-${index}-${who.key}-${bit.key}`;
            const input = h('input', { type: 'checkbox', id, onchange: () => { bits[who.key][bit.key] = input.checked; update(); } });
            column.append(h('label', { class: 'perm-toggle', for: id }, input, h('span', { class: 'perm-letter mono', text: bit.key }), h('span', { text: bit.label }), h('span', { class: 'perm-value mono', text: `+${bit.value}` })));
          }
          grid.append(column);
        }

        const check = button({ label: 'Sprawdź', variant: 'primary', iconName: 'check', onclick: verify });

        function update() {
          symbolic.textContent = `${task.file.endsWith('/') ? 'd' : '-'}${modeToString(bits)}`;
          octal.textContent = `chmod ${modeToOctal(bits)} ${task.file.replace(/\/$/, '')}`;
        }

        function verify() {
          attempts += 1;
          const value = modeToOctal(bits);
          if (value === task.target) {
            check.disabled = true;
            grid.querySelectorAll('input').forEach((input) => { input.disabled = true; });
            const points = attempts === 1 ? 2 : 1;
            result.replaceChildren(
              feedback('ok', attempts === 1 ? 'Idealnie, za pierwszym razem' : 'Dobrze', task.explain),
              h('div', { class: 'btn-row' }, button({ label: index === tasks.length - 1 ? 'Przejdź do pytań' : 'Następny plik', variant: 'primary', iconAfter: 'arrowRight', onclick: () => resolve(points) }))
            );
            result.querySelector('.btn-primary').focus();
          } else {
            const wrong = WHO.filter((who, i) => value[i] !== task.target[i]).map((who) => who.label.toLowerCase());
            result.replaceChildren(feedback('bad', 'Jeszcze nie', `Sprawdź ustawienia dla: <strong>${wrong.join(', ')}</strong>. Przeczytaj opis jeszcze raz i zastanów się, kto czego naprawdę potrzebuje.`));
            grid.classList.remove('shake');
            void grid.offsetWidth;
            grid.classList.add('shake');
          }
        }

        update();
        clear(panel).append(
          h('div', { class: 'panel-title' }, h('span', { class: 'tag tag-accent', text: `Plik ${index + 1} z ${tasks.length}` }), h('span', { class: 'tag' }, icon('file'), task.kind)),
          h('h2', { class: 't-h4 mono', text: task.file }),
          h('p', { class: 'question-prompt', text: task.goal }),
          grid,
          h('div', { class: 'perm-preview' }, h('span', { class: 't-small t-muted', text: 'W ls -l zobaczysz:' }), symbolic, h('span', { class: 't-small t-muted', text: 'Polecenie:' }), octal),
          h('div', { class: 'btn-row' }, check),
          result
        );
      });
    }
  }
};

export function examPool() {
  return QUESTION_POOL;
}
