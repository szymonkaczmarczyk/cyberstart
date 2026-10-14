import { h, button, feedback, runQuiz, shuffle, clear, plural } from '../ui.js';
import { icon } from '../icons.js';
import { todayKey } from '../progress.js';
import { examPool as hasla } from './hasla.js';
import { examPool as szyfry } from './szyfry.js';
import { examPool as kali } from './kali.js';
import { examPool as ip } from './ip.js';
import { examPool as uprawnienia } from './uprawnienia.js';
import { examPool as porty } from './porty.js';
import { examPool as wifi } from './wifi.js';
import { examPool as naglowki } from './naglowki.js';
import { examPool as certyfikaty } from './certyfikaty.js';
import { examPool as instalacja } from './instalacja.js';
import { examPool as socjotechnika } from './socjotechnika.js';
import { examPool as incydent } from './incydent.js';
import { examPool as router } from './router.js';
import { examPool as ssh } from './ssh.js';
import { examPool as skan } from './skan.js';
import { examPool as prywatnosc } from './prywatnosc.js';
import { examPool as kod } from './kod.js';
import { examPool as osi } from './osi.js';
import { examPool as url } from './url.js';
import { examPool as malware } from './malware.js';
import { examPool as sms } from './sms.js';
import { examPool as konto } from './konto.js';

const EXAM_SIZE = 25;
const PASS_RATIO = 0.8;

const LINUX = [
  {
    prompt: 'Które polecenie pokaże także ukryte pliki w katalogu?',
    options: [
      { label: '<code>ls -a</code>', correct: true },
      { label: '<code>ls -h</code>' },
      { label: '<code>cat -a</code>' }
    ],
    explain: 'Pliki zaczynające się od kropki są ukryte. Przełącznik <code>-a</code> (all) pokazuje wszystko.'
  },
  {
    prompt: 'Jak odczytać plik o nazwie <code>-raport</code>?',
    options: [
      { label: '<code>cat ./-raport</code>', correct: true },
      { label: '<code>cat -raport</code>' },
      { label: '<code>open -raport</code>' }
    ],
    explain: 'Bez <code>./</code> polecenie potraktuje nazwę jak opcję.'
  },
  {
    prompt: 'Jak policzyć linie zawierające <code>Failed</code> w pliku <code>auth.log</code>?',
    options: [
      { label: '<code>grep -c Failed auth.log</code>', correct: true },
      { label: '<code>wc Failed auth.log</code>' },
      { label: '<code>find -c Failed auth.log</code>' }
    ],
    explain: 'Opcja <code>-c</code> w grep zlicza pasujące linie.'
  },
  {
    prompt: 'Co robi potok <code>sort hasla.txt | uniq -c</code>?',
    options: [
      { label: 'Zlicza, ile razy powtarza się każda linia', correct: true },
      { label: 'Szyfruje plik' },
      { label: 'Usuwa plik po posortowaniu' }
    ],
    explain: 'sort ustawia identyczne linie obok siebie, a <code>uniq -c</code> je zlicza.'
  },
  {
    prompt: 'Plik ma uprawnienia <code>600</code>. Co to oznacza?',
    options: [
      { label: 'Tylko właściciel może czytać i zapisywać', correct: true },
      { label: 'Wszyscy mogą czytać, nikt nie może zapisywać' },
      { label: 'Właściciel może tylko uruchamiać' }
    ],
    explain: '6 to rw dla właściciela, a zera oznaczają brak praw dla grupy i innych.'
  },
  {
    prompt: 'Które polecenie pokazuje, w jakim katalogu jesteś?',
    options: [
      { label: '<code>pwd</code>', correct: true },
      { label: '<code>whoami</code>' },
      { label: '<code>cd</code>' }
    ],
    explain: '<code>pwd</code> to print working directory. <code>whoami</code> pokazuje użytkownika.'
  }
];

const TOPICS = [
  ['Pierwsze kroki w terminalu', 'terminal', () => LINUX],
  ['Uprawnienia plików', 'uprawnienia', uprawnienia],
  ['Utwardzanie SSH', 'ssh', ssh],
  ['Narzędzia Kali i etyka', 'kali', kali],
  ['Kali w maszynie wirtualnej', 'instalacja', instalacja],
  ['Warstwy sieci (model OSI)', 'osi', osi],
  ['Adresy IP i podsieci', 'ip', ip],
  ['Porty i usługi', 'porty', porty],
  ['Raport skanu własnego serwera', 'skan', skan],
  ['Bezpieczne Wi-Fi', 'wifi', wifi],
  ['Laboratorium haseł', 'hasla', hasla],
  ['Zabezpiecz konto krok po kroku', 'konto', konto],
  ['Szyfry, hashe i kodowanie', 'szyfry', szyfry],
  ['Certyfikaty i kłódka HTTPS', 'certyfikaty', certyfikaty],
  ['Nagłówki maila', 'naglowki', naglowki],
  ['Oszustwa SMS i w komunikatorach', 'sms', sms],
  ['Detektyw adresów', 'url', url],
  ['Socjotechnika', 'socjotechnika', socjotechnika],
  ['Audyt prywatności', 'prywatnosc', prywatnosc],
  ['Zabezpiecz domowy router', 'router', router],
  ['Reakcja na incydent', 'incydent', incydent],
  ['Malware i aktualizacje', 'malware', malware],
  ['Bezpieczny kod', 'kod', kod]
];

export function allExamQuestions() {
  return TOPICS.flatMap(([, , pool]) => pool());
}

function buildExam() {
  const pools = TOPICS.map(([title, id, pool]) => shuffle(pool().filter((q) => q.level !== 'zaawansowany')).map((q) => ({ ...q, topic: title, topicId: id })));
  const picked = pools.map((pool) => pool.shift()).filter(Boolean);
  const rest = shuffle(pools.flat());
  return shuffle([...picked, ...rest].slice(0, EXAM_SIZE));
}

function diploma(name, percent) {
  const date = new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
  return h(
    'section',
    { class: 'diploma', 'aria-label': 'Dyplom' },
    h('div', { class: 'diploma-brand' }, h('span', { class: 'brand-mark' }, icon('shieldCheck')), h('span', { translate: 'no', text: 'Cyberstart' })),
    h('p', { class: 't-caps diploma-kicker', text: 'Dyplom ukończenia' }),
    h('h2', { class: 'diploma-title', text: 'Cyberbezpieczeństwo od zera' }),
    h('p', { class: 'diploma-text', text: 'Niniejszym potwierdzamy, że' }),
    h('p', { class: 'diploma-name', text: name }),
    h('p', { class: 'diploma-text', text: `zalicza egzamin końcowy z wynikiem ${percent}%, obejmujący Linuksa i Kali, sieci, kryptografię, socjotechnikę oraz obronę systemów.` }),
    h('div', { class: 'diploma-foot' }, h('span', { text: date }), h('span', { text: `Nr ${todayKey().replaceAll('-', '')}-${percent}` })),
    h('p', { class: 'diploma-note', text: 'Dokument pamiątkowy wygenerowany lokalnie w przeglądarce.' })
  );
}

export default {
  id: 'egzamin',
  title: 'Egzamin końcowy',
  category: 'wiedza',
  icon: 'trophy',
  minutes: 20,
  summary: `${EXAM_SIZE} losowych pytań z całego kursu: od terminala po reakcję na incydent. Wynik od 80% daje dyplom do wydruku lub zapisania jako PDF.`,
  lesson: [
    'Egzamin losuje pytania ze wszystkich działów, więc każda próba jest trochę inna. Najlepiej podejść do niego po przejściu większości gier.',
    `Próg zaliczenia to ${Math.round(PASS_RATIO * 100)}%. Po egzaminie zobaczysz, z których tematów warto zrobić powtórkę.`,
    'Dyplom możesz wydrukować albo zapisać jako PDF w oknie drukowania przeglądarki. Imię wpisujesz samodzielnie i nie jest nigdzie wysyłane.'
  ],
  takeaways: [
    'Wracaj do tematów, w których pojawiły się błędy. Fiszki pomogą utrwalić pojęcia.',
    'Kolejny krok to praktyka na legalnych platformach: OverTheWire Bandit, TryHackMe, PortSwigger Web Security Academy.',
    'Bezpieczeństwo to nawyk: aktualizacje, unikalne hasła z 2FA, kopie zapasowe i zdrowa podejrzliwość.'
  ],
  async mount(stage, ctx) {
    const questions = buildExam();
    const topicCount = new Set(questions.map((q) => q.topic)).size;
    const mistakes = new Map();
    const start = button({ label: 'Rozpocznij egzamin', variant: 'primary', iconName: 'play' });
    const intro = h(
      'section',
      { class: 'panel' },
      h('div', { class: 'panel-title' }, icon('trophy'), h('h2', { class: 't-h4', text: 'Zaczynamy?' })),
      h('p', { class: 'prose', text: `Czeka ${questions.length} ${plural(questions.length, 'pytanie', 'pytania', 'pytań')} z ${topicCount} ${plural(topicCount, 'tematu', 'tematów', 'tematów')}. Nie ma limitu czasu, a każda odpowiedź od razu pokazuje wyjaśnienie.` }),
      h('div', { class: 'btn-row' }, start)
    );
    stage.append(intro);
    ctx.progress(0, questions.length);
    await new Promise((resolve) => start.addEventListener('click', resolve, { once: true }));
    intro.remove();

    const score = await runQuiz(stage, ctx, questions, {
      label: 'Pytanie',
      onAnswer: (question, correct) => {
        if (!correct) mistakes.set(question.topicId, question.topic);
      }
    });
    const percent = Math.round((100 * score) / questions.length);
    const passed = score / questions.length >= PASS_RATIO;
    const summary = h('section', { class: 'panel' });
    stage.append(summary);

    const review = mistakes.size
      ? h('div', { class: 'stage' }, h('h3', { class: 't-h4', text: 'Do powtórki' }), h('ul', { class: 'review-list' }, [...mistakes].map(([id, title]) => h('li', {}, h('a', { href: `#/gra/${id}` }, icon('rotate'), h('span', { text: title }))))))
      : null;
    const finishButton = button({ label: 'Zobacz podsumowanie', variant: passed ? 'secondary' : 'primary', iconAfter: 'arrowRight', onclick: () => ctx.finish({ score, max: questions.length }) });

    const missing = Math.ceil(PASS_RATIO * questions.length) - score;
    if (!passed) {
      clear(summary).append(
        ...[
          feedback('warn', `Wynik ${percent}%. Do zaliczenia brakuje: ${missing} ${plural(missing, 'poprawna odpowiedź', 'poprawne odpowiedzi', 'poprawnych odpowiedzi')}`, 'Powtórz tematy z listy i spróbuj ponownie. Pytania będą inne.'),
          review,
          h('div', { class: 'btn-row' }, finishButton)
        ].filter(Boolean)
      );
      return;
    }

    const nameInput = h('input', { class: 'input', id: 'diploma-name', name: 'name', type: 'text', autocomplete: 'name', maxlength: '60', placeholder: 'np. Anna Kowalska' });
    const nameError = h('p', { class: 'field-error', role: 'alert', hidden: true }, icon('alert'), ' Wpisz imię i nazwisko, które ma się pojawić na dyplomie.');
    const diplomaBox = h('div');
    const show = button({
      label: 'Pokaż dyplom',
      variant: 'primary',
      iconName: 'trophy',
      onclick: () => {
        const name = nameInput.value.trim();
        nameError.hidden = Boolean(name);
        nameInput.setAttribute('aria-invalid', String(!name));
        if (!name) {
          nameInput.focus();
          return;
        }
        diplomaBox.replaceChildren(diploma(name, percent), h('div', { class: 'btn-row' }, button({ label: 'Drukuj lub zapisz jako PDF', variant: 'primary', iconName: 'file', onclick: () => window.print() }), finishButton));
        diplomaBox.scrollIntoView({ block: 'start' });
      }
    });
    clear(summary).append(
      ...[
        feedback('ok', `Zaliczone! Wynik ${percent}%`, 'Gratulacje. Wpisz imię i nazwisko, żeby wygenerować dyplom.'),
        review,
        h('div', { class: 'field' }, h('label', { for: 'diploma-name', text: 'Imię i nazwisko na dyplomie' }), nameInput, nameError),
        h('div', { class: 'btn-row' }, show, finishButton),
        diplomaBox
      ].filter(Boolean)
    );
  }
};
