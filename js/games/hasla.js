import { h, button, feedback, runQuiz, formatNumber, draw } from '../ui.js';
import { icon } from '../icons.js';

const COMMON = ['haslo', 'password', 'qwerty', 'admin', 'zaq12wsx', 'polska', 'kochanie', 'iloveyou', 'monika', 'marcin', 'michal', 'kasia', 'misiek', 'football', 'dragon', 'letmein', 'welcome', 'abc', 'test', 'lato', 'zima', 'wiosna', 'jesien', 'master', 'lol', 'superman', 'batman', 'mateusz', 'agnieszka', 'legia', 'lech'];
const SEQUENCES = ['123', '234', '345', '456', '567', '678', '789', '890', 'abc', 'qwe', 'asd', 'zxc', '987', '321'];
const LEET = { '@': 'a', 4: 'a', 3: 'e', 1: 'i', '!': 'i', 0: 'o', $: 's', 5: 's', 7: 't' };

const EXAMPLES = ['haslo123', 'Monika1990!', 'P@ssw0rd', 'kot-rower-lampa-ocean', 'Xk9#mQ2!'];

const QUESTIONS = [
  {
    prompt: 'Co najbardziej podnosi odporność hasła na złamanie?',
    options: [
      { label: 'Długość', correct: true, why: 'Każdy dodatkowy znak mnoży liczbę możliwości. 20 zwykłych liter jest znacznie trudniejsze do złamania niż 8 znaków z symbolami.' },
      { label: 'Zamiana liter na podobne znaki, np. a na @', why: 'Programy do łamania haseł znają takie zamiany i sprawdzają je od razu.' },
      { label: 'Wykrzyknik na końcu', why: 'Tak robi większość ludzi, więc atakujący sprawdzają to w pierwszej kolejności.' }
    ]
  },
  {
    prompt: 'Masz jedno naprawdę mocne hasło. Czy możesz go używać we wszystkich serwisach?',
    options: [
      { label: 'Nie, każdy serwis powinien mieć inne hasło', correct: true, why: 'Gdy wycieknie baza jednego serwisu, przestępcy automatycznie próbują tych samych danych w innych (credential stuffing).' },
      { label: 'Tak, skoro jest mocne', why: 'Siła nie pomoże, jeśli hasło wycieknie z najsłabiej zabezpieczonego serwisu, którego używasz.' }
    ]
  },
  {
    prompt: 'Jak zapamiętać kilkadziesiąt unikalnych, długich haseł?',
    options: [
      { label: 'Menedżer haseł, który je generuje i przechowuje', correct: true, why: 'Pamiętasz jedno mocne hasło główne (najlepiej frazę), a resztą zarządza menedżer. Dodatkowo nie wpisze hasła na fałszywej stronie, bo nie zgodzi się adres.' },
      { label: 'Zeszyt przy monitorze', why: 'Każdy, kto przejdzie obok biurka, ma dostęp do wszystkich kont.' },
      { label: 'Jedno hasło bazowe z dopiskiem nazwy serwisu, np. Haslo!Allegro', why: 'Gdy jedno wycieknie, schemat łatwo odgadnąć dla pozostałych.' }
    ]
  },
  {
    prompt: 'Czym jest uwierzytelnianie dwuskładnikowe (2FA)?',
    options: [
      { label: 'Drugi dowód tożsamości obok hasła, np. kod z aplikacji lub klucz sprzętowy', correct: true, why: 'Nawet gdy hasło wycieknie, sama jego znajomość nie wystarczy. Najmocniejsze są klucze sprzętowe i passkeys, potem aplikacje z kodami, a SMS jest lepszy niż nic.' },
      { label: 'Dwa hasła wpisywane jedno po drugim', why: 'Oba to wciąż „coś, co wiesz”. Drugi składnik powinien być innego rodzaju, np. „coś, co masz”.' },
      { label: 'Logowanie na dwóch urządzeniach naraz', why: 'Chodzi o drugi, niezależny dowód tożsamości.' }
    ]
  },
  {
    prompt: 'Ktoś dzwoni „z banku” i prosi o kod z SMS-a, żeby „zablokować podejrzaną transakcję”. Co robisz?',
    options: [
      { label: 'Rozłączam się i samodzielnie dzwonię na numer z karty lub strony banku', correct: true, why: 'Kod z SMS-a to klucz do Twojego konta. Bank nigdy o niego nie prosi. Numer na ekranie da się podrobić (spoofing).' },
      { label: 'Podaję kod, bo numer na ekranie zgadza się z numerem banku', why: 'Numer dzwoniącego można łatwo sfałszować. Kod daje oszustowi dostęp do konta.' }
    ]
  },
  {
    prompt: 'Czy trzeba zmieniać hasło co 30 dni?',
    options: [
      { label: 'Nie, jeśli jest długie i unikalne. Zmieniaj je po wycieku lub podejrzeniu', correct: true, why: 'Aktualne zalecenia (m.in. NIST) odradzają wymuszanie częstych zmian, bo ludzie wtedy tworzą przewidywalne hasła typu Lato2025!, Jesien2025!.' },
      { label: 'Tak, im częściej, tym bezpieczniej', why: 'Częste wymuszone zmiany prowadzą do słabych, przewidywalnych wzorców.' }
    ]
  },
  {
    prompt: 'Jak sprawdzić, czy Twój adres e-mail pojawił się w znanym wycieku danych?',
    options: [
      { label: 'W serwisie Have I Been Pwned albo w powiadomieniach menedżera haseł', correct: true, why: 'Te narzędzia porównują Twój adres z bazami znanych wycieków. Jeśli adres tam jest, zmień hasła w serwisach, które go używały.' },
      { label: 'Wpisując hasło do pierwszej znalezionej strony „sprawdź swoje hasło”', why: 'Nigdy nie wpisuj prawdziwego hasła w przypadkowe strony. Sprawdzaj adres e-mail, a nie hasło.' }
    ]
  },
  {
    prompt: 'Czym jest passkey?',
    level: 'zaawansowany',
    options: [
      { label: 'Logowanie bez hasła oparte na kluczach kryptograficznych, odporne na phishing', correct: true, why: 'Klucz prywatny zostaje na Twoim urządzeniu, a przeglądarka używa go tylko na właściwej domenie. Fałszywa strona nic nie dostanie.' },
      { label: 'Bardzo długie hasło zapisane w przeglądarce', why: 'Passkey nie jest hasłem. To para kluczy: publiczny w serwisie, prywatny na Twoim urządzeniu.' },
      { label: 'Kod jednorazowy z SMS-a', why: 'Kody SMS można wyłudzić. Passkey jest powiązany z domeną i nie da się go „podyktować” oszustowi.' }
    ]
  },
  {
    prompt: 'Dlaczego kod 2FA z SMS-a jest słabszy niż aplikacja z kodami lub klucz sprzętowy?',
    level: 'zaawansowany',
    options: [
      { label: 'Numer można przejąć wyrabiając duplikat karty SIM (SIM swap), a kod łatwo wyłudzić', correct: true, why: 'Przestępca, który przekona operatora do wydania duplikatu karty, dostaje Twoje SMS-y. Aplikacja i klucz są przypisane do urządzenia.' },
      { label: 'SMS-y są wolniejsze', why: 'Szybkość nie ma znaczenia. Chodzi o to, jak łatwo przejąć lub wyłudzić kod.' }
    ]
  },
  {
    prompt: 'Co to jest atak password spraying?',
    level: 'zaawansowany',
    options: [
      { label: 'Jedno popularne hasło sprawdzane na wielu kontach, żeby ominąć blokady', correct: true, why: 'Zamiast 1000 prób na jednym koncie (blokada) atakujący robi 1 próbę hasłem „Jesien2026!” na 1000 kontach. Dlatego słabe, sezonowe hasła są groźne nawet z blokadą.' },
      { label: 'Wysyłanie haseł mailem do wielu osób', why: 'Spraying dotyczy zgadywania haseł na wielu kontach jednocześnie.' }
    ]
  }
];

function analyze(password) {
  const length = [...password].length;
  if (!length) return null;
  let pool = 0;
  const classes = [];
  if (/[a-z]/.test(password)) { pool += 26; classes.push('małe litery'); }
  if (/[A-Z]/.test(password)) { pool += 26; classes.push('wielkie litery'); }
  if (/\d/.test(password)) { pool += 10; classes.push('cyfry'); }
  if (/[^a-zA-Z0-9\s]/.test(password)) { pool += 33; classes.push('symbole'); }
  if (/\s/.test(password)) pool += 1;

  const lower = password.toLowerCase();
  const deleet = [...lower].map((ch) => LEET[ch] ?? ch).join('');
  const issues = [];
  let bits = length * Math.log2(Math.max(pool, 1));

  const passphraseWords = password.split(/[-\s_.]+/).filter((w) => w.length >= 3);
  const isPassphrase = passphraseWords.length >= 4;
  if (isPassphrase) bits = Math.max(bits * 0.75, passphraseWords.length * 12.9);

  const common = COMMON.find((word) => deleet.includes(word));
  if (common) {
    issues.push(`zawiera popularne słowo „${common}”${deleet !== lower ? ', a zamiany znaków nic nie dają' : ''}`);
    bits = Math.min(bits, 18 + (length - common.length) * 3);
  }
  if (/(19|20)\d{2}/.test(password)) {
    issues.push('zawiera rok, łatwy do odgadnięcia (np. rok urodzenia)');
    bits -= 10;
  }
  if (SEQUENCES.some((seq) => lower.includes(seq))) {
    issues.push('zawiera sekwencję z klawiatury lub kolejne znaki');
    bits -= 8;
  }
  if (/(.)\1{2,}/.test(password)) {
    issues.push('powtarza ten sam znak');
    bits -= 6;
  }
  if (/^[A-Z][a-z]+\d+[!?.]?$/.test(password)) {
    issues.push('ma najpopularniejszy schemat: Wielka litera, słowo, cyfry, wykrzyknik');
    bits = Math.min(bits, 30);
  }
  bits = Math.max(1, bits);
  const level = bits < 28 ? 0 : bits < 40 ? 1 : bits < 60 ? 2 : bits < 80 ? 3 : 4;
  return { length, classes, issues, bits, level, isPassphrase };
}

const LEVELS = [
  { name: 'Bardzo słabe', tone: 'bad' },
  { name: 'Słabe', tone: 'bad' },
  { name: 'Średnie', tone: 'warn' },
  { name: 'Silne', tone: 'ok' },
  { name: 'Bardzo silne', tone: 'ok' }
];

function crackTime(bits) {
  const guessesPerSecond = 1e10;
  const seconds = 2 ** bits / 2 / guessesPerSecond;
  if (seconds < 1) return 'natychmiast';
  if (seconds < 60) return `${Math.round(seconds)} s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} godz.`;
  if (seconds < 31557600) return `${Math.round(seconds / 86400)} dni`;
  const years = seconds / 31557600;
  if (years < 1e6) return `${formatNumber(Math.round(years))} lat`;
  if (years < 1e9) return `${formatNumber(Math.round(years / 1e6))} mln lat`;
  return 'dłużej niż istnieje Wszechświat';
}

export default {
  id: 'hasla',
  title: 'Laboratorium haseł',
  category: 'hasla',
  icon: 'key',
  minutes: 10,
  levels: true,
  summary: 'Sprawdź na żywo, jak szybko komputer odgadłby różne hasła, zbuduj frazę nie do złamania i odpowiedz na sześć pytań o 2FA i menedżery haseł.',
  lesson: [
    'Przestępcy rzadko „zgadują” hasła ręcznie. Gdy wycieknie baza serwisu, karty graficzne sprawdzają <strong>miliardy kombinacji na sekundę</strong>, zaczynając od najpopularniejszych haseł, słów ze słowników i typowych schematów.',
    'Dlatego <strong>długość</strong> wygrywa ze złożonością. Hasło <code>P@ssw0rd</code> wygląda groźnie, ale jest na każdej liście. Fraza z czterech przypadkowych słów, np. <code>kot-rower-lampa-ocean</code>, jest dużo mocniejsza i łatwiejsza do zapamiętania.',
    'Siłę hasła mierzy się w <strong>bitach entropii</strong>. Każdy dodatkowy bit podwaja liczbę prób potrzebnych do złamania. 40 bitów to słabo, 60 to przyzwoicie, 80 i więcej to bardzo mocno.',
    'Nie wpisuj tu swoich prawdziwych haseł. Nic nie jest wysyłane, ale dobry nawyk to nigdy nie wpisywać haseł w przypadkowe testery.'
  ],
  takeaways: [
    'Długość jest najważniejsza. Fraza z 4 lub 5 przypadkowych słów bije krótkie hasło z symbolami.',
    'Zamiany typu a na @, imiona, daty i wykrzyknik na końcu atakujący sprawdzają w pierwszej kolejności.',
    'Każdy serwis ma mieć inne hasło. Zapamiętanie ich ułatwia menedżer haseł.',
    'Włącz 2FA wszędzie, gdzie się da: najlepiej klucz sprzętowy, passkey albo aplikację z kodami.',
    'Nikomu nie podawaj kodów jednorazowych. Bank, kurier ani „dział IT” nigdy o nie nie proszą.'
  ],
  async mount(stage, ctx) {
    const missions = [
      { text: 'Sprawdź przykład <code>P@ssw0rd</code> i zobacz, dlaczego zamiana liter na znaki nie pomaga.', done: false, test: (pw) => pw === 'P@ssw0rd' },
      { text: 'Wymyśl hasło z oceną co najmniej „Silne” (60 bitów lub więcej).', done: false, test: (pw, a) => a && a.level >= 3 },
      { text: 'Zbuduj frazę z co najmniej 4 słów oddzielonych łącznikami, mającą 20 lub więcej znaków.', done: false, test: (pw, a) => a && a.isPassphrase && a.length >= 20 && pw.includes('-') }
    ];
    const total = missions.length + 6;
    ctx.progress(0, total);

    const input = h('input', { class: 'input mono pw-input', id: 'pw-input', type: 'text', autocomplete: 'off', spellcheck: false, autocapitalize: 'off', placeholder: 'np. kot-rower-lampa-ocean', 'aria-describedby': 'pw-note' });
    const meterBar = h('div', { class: 'pw-meter-bar' });
    const levelLabel = h('strong', { text: 'Wpisz hasło' });
    const bitsLabel = h('span', { class: 'mono t-muted', text: '0 bitów' });
    const timeLabel = h('strong', { class: 'pw-time', text: '-' });
    const details = h('div', { class: 'pw-details' });
    const missionList = h('ul', { class: 'pw-missions' });
    const status = h('div', { class: 'status-stack', 'aria-live': 'polite' });
    const continueBtn = button({ label: 'Dalej: sprawdź wiedzę', variant: 'primary', iconAfter: 'arrowRight', disabled: true });

    function renderMissions() {
      missionList.replaceChildren(...missions.map((mission) => h('li', { class: mission.done ? 'is-done' : '' }, icon(mission.done ? 'check' : 'flag'), h('span', { html: mission.text }))));
      const doneCount = missions.filter((m) => m.done).length;
      ctx.progress(doneCount, total);
      continueBtn.disabled = doneCount < missions.length;
    }

    function update() {
      const pw = input.value;
      const a = analyze(pw);
      if (!a) {
        meterBar.style.transform = 'scaleX(0)';
        meterBar.dataset.level = '';
        levelLabel.textContent = 'Wpisz hasło';
        bitsLabel.textContent = '0 bitów';
        timeLabel.textContent = '-';
        details.replaceChildren();
        return;
      }
      meterBar.style.transform = `scaleX(${Math.min(1, a.bits / 100)})`;
      meterBar.dataset.level = String(a.level);
      levelLabel.textContent = LEVELS[a.level].name;
      bitsLabel.textContent = `${Math.round(a.bits)} bitów`;
      timeLabel.textContent = crackTime(a.bits);
      const checks = [
        [a.length >= 12, `Długość: ${a.length} ${a.length === 1 ? 'znak' : a.length < 5 ? 'znaki' : 'znaków'} (dobrze od 12, świetnie od 16)`],
        [a.classes.length >= 3 || a.isPassphrase, a.isPassphrase ? 'Fraza z kilku słów, świetny wybór' : `Rodzaje znaków: ${a.classes.join(', ') || 'brak'}`],
        [a.issues.length === 0, a.issues.length ? `Słabe punkty: ${a.issues.join(', ')}` : 'Brak typowych schematów i popularnych słów']
      ];
      details.replaceChildren(h('ul', { class: 'pw-checks' }, checks.map(([ok, text]) => h('li', { class: ok ? 'ok' : 'bad' }, icon(ok ? 'check' : 'x'), h('span', { text })))));
      missions.forEach((mission, i) => {
        if (!mission.done && mission.test(pw, a)) {
          mission.done = true;
          status.replaceChildren(feedback('ok', `Misja ${i + 1} zaliczona`, i === 0 ? 'P@ssw0rd ma symbole, cyfry i wielkie litery, a mimo to jest na każdej liście popularnych haseł. Programy do łamania znają zamiany a na @ i o na 0.' : i === 1 ? 'Świetnie. Zauważ, ile dało samo wydłużenie hasła.' : 'Fraza jest długa, łatwa do zapamiętania i bardzo trudna do złamania. Słowa wybieraj losowo, a nie jako znane powiedzenie.'));
          renderMissions();
        }
      });
    }

    input.addEventListener('input', update);

    stage.append(
      h(
        'div',
        { class: 'split' },
        h(
          'section',
          { class: 'panel' },
          h('div', { class: 'field' }, h('label', { for: 'pw-input', text: 'Testowe hasło' }), input, h('p', { class: 'hint', id: 'pw-note' }, icon('alert'), ' Nie wpisuj prawdziwych haseł. Analiza dzieje się tylko w tej przeglądarce.')),
          h('div', { class: 'btn-row' }, h('span', { class: 't-small t-muted', text: 'Przykłady:' }), EXAMPLES.map((example) => button({ label: example, size: 'sm', class: 'btn btn-secondary btn-sm mono', onclick: () => { input.value = example; update(); input.focus(); } }))),
          h('div', { class: 'pw-meter' }, h('div', { class: 'pw-meter-track' }, meterBar), h('div', { class: 'pw-meter-row' }, levelLabel, bitsLabel)),
          h('div', { class: 'pw-time-box' }, h('span', { class: 't-small t-muted', text: 'Czas złamania przy 10 mld prób na sekundę (szybka karta graficzna, słabo zabezpieczona baza):' }), timeLabel),
          details,
          status
        ),
        h('aside', { class: 'panel' }, h('div', { class: 'panel-title' }, icon('flag'), h('h2', { class: 't-h4', text: 'Misje' })), missionList, continueBtn)
      )
    );
    renderMissions();
    input.focus();

    await new Promise((resolve) => continueBtn.addEventListener('click', resolve, { once: true }));
    stage.replaceChildren();
    const quizScore = await runQuiz(stage, ctx, draw(QUESTIONS, 6, ctx.level), { label: 'Pytanie', offset: missions.length, total });
    ctx.finish({ score: missions.length + quizScore, max: total });
  }
};

export function examPool() {
  return QUESTIONS;
}
