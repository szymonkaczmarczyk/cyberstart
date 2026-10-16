import { h, button, feedback, runQuiz, shuffle, plural } from '../ui.js';
import { icon } from '../icons.js';
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

export default {
  id: 'egzamin',
  title: 'Egzamin końcowy',
  category: 'wiedza',
  icon: 'trophy',
  minutes: 20,
  summary: `${EXAM_SIZE} losowych pytań z całego kursu, od terminala po reakcję na incydent. Pokazuje, co już umiesz i do których gier warto wrócić.`,
  lesson: [
    'Egzamin losuje pytania ze wszystkich działów, więc każda próba jest trochę inna. Najlepiej podejść do niego po przejściu większości gier.',
    'Pytania wymieszane z różnych tematów to jedna z najskuteczniejszych form utrwalania wiedzy: mózg musi najpierw rozpoznać, o czym jest pytanie.',
    `Próg zaliczenia to ${Math.round(PASS_RATIO * 100)}%. Po egzaminie zobaczysz listę tematów do powtórki z linkami do gier.`
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
    const missing = Math.ceil(PASS_RATIO * questions.length) - score;
    const verdict = passed
      ? feedback('ok', `Zaliczone, wynik ${percent}%`, mistakes.size ? 'Świetnie. Przejrzyj jeszcze tematy, w których pojawiły się błędy.' : 'Bez ani jednego błędu. Gratulacje.')
      : feedback('warn', `Wynik ${percent}%. Do zaliczenia brakuje: ${missing} ${plural(missing, 'poprawna odpowiedź', 'poprawne odpowiedzi', 'poprawnych odpowiedzi')}`, 'Powtórz tematy z listy i spróbuj ponownie. Pytania będą inne.');
    const review = mistakes.size
      ? h('div', { class: 'stage' }, h('h3', { class: 't-h4', text: 'Do powtórki' }), h('ul', { class: 'review-list' }, [...mistakes].map(([id, title]) => h('li', {}, h('a', { href: `#/gra/${id}` }, icon('rotate'), h('span', { text: title }))))))
      : null;
    const finishButton = button({ label: 'Zobacz podsumowanie', variant: 'primary', iconAfter: 'arrowRight', onclick: () => ctx.finish({ score, max: questions.length }) });
    stage.append(h('section', { class: 'panel' }, ...[verdict, review, h('div', { class: 'btn-row' }, finishButton)].filter(Boolean)));
  }
};
