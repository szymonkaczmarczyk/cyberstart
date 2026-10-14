import { h, runQuiz } from '../ui.js';
import { logViewer } from '../log-viewer.js';

const ATTACKER = '203.0.113.45';

const LOG = [
  'Oct 14 02:58:03 web01 sshd[2101]: Accepted publickey for deploy from 10.0.1.15 port 50122 ssh2',
  'Oct 14 03:12:40 web01 sshd[2188]: Failed password for root from 203.0.113.45 port 41022 ssh2',
  'Oct 14 03:12:43 web01 sshd[2188]: Failed password for root from 203.0.113.45 port 41022 ssh2',
  'Oct 14 03:12:47 web01 sshd[2190]: Failed password for invalid user test from 203.0.113.45 port 41030 ssh2',
  'Oct 14 03:12:50 web01 sshd[2192]: Failed password for invalid user oracle from 203.0.113.45 port 41038 ssh2',
  'Oct 14 03:13:02 web01 sshd[2194]: Failed password for admin from 203.0.113.45 port 41044 ssh2',
  'Oct 14 03:13:05 web01 sshd[2194]: Failed password for admin from 203.0.113.45 port 41044 ssh2',
  'Oct 14 03:13:09 web01 sshd[2197]: Failed password for admin from 203.0.113.45 port 41052 ssh2',
  'Oct 14 03:13:41 web01 sshd[2201]: Failed password for kasia from 198.51.100.23 port 52011 ssh2',
  'Oct 14 03:13:52 web01 sshd[2201]: Accepted password for kasia from 198.51.100.23 port 52011 ssh2',
  'Oct 14 03:14:11 web01 sshd[2205]: Failed password for admin from 203.0.113.45 port 41060 ssh2',
  'Oct 14 03:14:15 web01 sshd[2205]: Failed password for admin from 203.0.113.45 port 41060 ssh2',
  'Oct 14 03:14:52 web01 sshd[2209]: Accepted password for admin from 203.0.113.45 port 41071 ssh2',
  'Oct 14 03:14:52 web01 sshd[2209]: pam_unix(sshd:session): session opened for user admin',
  'Oct 14 03:15:30 web01 sudo: admin : TTY=pts/1 ; PWD=/home/admin ; USER=root ; COMMAND=/usr/bin/cat /etc/shadow',
  'Oct 14 03:16:02 web01 useradd[2230]: new user: name=support2, UID=1005, GID=1005, home=/home/support2',
  'Oct 14 07:45:10 web01 sshd[2410]: Accepted publickey for deploy from 10.0.1.15 port 50388 ssh2'
];

const FILTERS = ['Failed', 'Accepted', ATTACKER, 'admin', 'sudo'];

const QUESTIONS = [
  {
    prompt: 'Z którego adresu IP pochodzi seria nieudanych logowań?',
    options: [
      { label: `<span class="mono">${ATTACKER}</span>`, correct: true, why: 'Kilkanaście prób w krótkich odstępach, na różne konta. Użyj filtra z tym adresem, żeby zobaczyć tylko jego aktywność.' },
      { label: '<span class="mono">198.51.100.23</span>', why: 'Z tego adresu była jedna pomyłka Kasi, a potem udane logowanie. To normalne zachowanie człowieka.' },
      { label: '<span class="mono">10.0.1.15</span>', why: 'To adres wewnętrzny, z którego loguje się konto deploy kluczem. Żadnych błędów.' }
    ]
  },
  {
    prompt: `Ile nieudanych prób logowania wykonał adres <span class="mono">${ATTACKER}</span>?`,
    options: [
      { label: '3', why: 'Policz dokładniej. Wpisz w filtr słowo Failed i adres IP.' },
      { label: '9', correct: true, why: 'Dziewięć linii „Failed password” z tego adresu w niecałe 2 minuty. Człowiek tak szybko nie pisze, to automat.' },
      { label: '15', why: 'To za dużo. Filtr „Failed” pomoże policzyć.' }
    ]
  },
  {
    prompt: 'Jak nazywa się ten rodzaj ataku?',
    options: [
      { label: 'Atak siłowy (brute force) na hasła', correct: true, why: 'Automat zgaduje hasła do popularnych kont: root, admin, test, oracle. Na serwery z otwartym SSH takie ataki trwają non stop.' },
      { label: 'Phishing', why: 'Phishing to oszukańcze wiadomości do ludzi. Tu automat bezpośrednio zgaduje hasła.' },
      { label: 'DDoS', why: 'DDoS ma przeciążyć serwer ruchem. Tu ktoś próbuje się zalogować.' }
    ]
  },
  {
    prompt: 'Czy atak się udał?',
    options: [
      { label: 'Tak. Jest „Accepted password for admin” z adresu atakującego', correct: true, why: 'O 03:14:52 hasło konta admin zostało odgadnięte. To moment włamania. Zawsze szukaj udanego logowania po serii nieudanych.' },
      { label: 'Nie, wszystkie próby były nieudane', why: 'Przefiltruj po „Accepted”. Jedna z linii pochodzi z adresu atakującego.' },
      { label: 'Nie da się tego stwierdzić z logów', why: 'Da się. Linia „Accepted password for admin from 203.0.113.45” mówi to wprost.' }
    ]
  },
  {
    prompt: 'Co atakujący zrobił po zalogowaniu? Zajrzyj do ostatnich linii.',
    options: [
      { label: 'Odczytał plik ze skrótami haseł i założył nowe konto support2', correct: true, why: 'Przez sudo odczytał /etc/shadow (skróty haseł wszystkich użytkowników), a potem stworzył konto, żeby wrócić później. To tzw. persystencja.' },
      { label: 'Nic, tylko się zalogował i wylogował', why: 'Spójrz na linie z sudo i useradd po udanym logowaniu.' },
      { label: 'Zaktualizował system', why: 'Polecenie z sudo to cat /etc/shadow, a nie aktualizacja.' }
    ]
  },
  {
    prompt: 'Jesteś na dyżurze. Co robisz najpierw?',
    options: [
      { label: 'Odcinam dostęp: blokuję adres, wyłączam konta admin i support2, zmieniam hasła i zgłaszam incydent', correct: true, why: 'Najpierw powstrzymaj atak (containment), potem zabezpiecz dowody, sprawdź, co jeszcze zmieniono, i zgłoś incydent. Skradzione skróty haseł oznaczają, że wszystkie hasła na serwerze trzeba zmienić.' },
      { label: 'Usuwam logi, żeby nikt nie zobaczył mojego przeoczenia', why: 'Logi to dowody. Ich usunięcie utrudni ustalenie, co się stało, i może być naruszeniem procedur oraz prawa.' },
      { label: 'Czekam do rana na zespół', why: 'Atakujący ma już konto z dostępem. Każda godzina to więcej szkód.' }
    ]
  },
  {
    prompt: 'Jak zapobiec takim atakom w przyszłości?',
    options: [
      { label: 'Logowanie SSH tylko kluczem, wyłączone logowanie hasłem, fail2ban i SSH dostępne tylko z VPN', correct: true, why: 'Klucza SSH nie da się zgadnąć jak hasła. fail2ban automatycznie blokuje adresy po kilku nieudanych próbach, a VPN ukrywa SSH przed internetem.' },
      { label: 'Zmiana portu SSH z 22 na 2222', why: 'To zmniejszy szum w logach, ale skaner i tak znajdzie usługę. Kamuflaż to za mało.' },
      { label: 'Dłuższe hasło do konta admin i nic więcej', why: 'Pomoże, ale klucze, blokowanie prób i ograniczenie dostępu działają dużo lepiej.' }
    ]
  }
];

function lineClass(line) {
  if (line.includes('Accepted') && line.includes(ATTACKER)) return 'log-breach';
  if (line.includes('Failed')) return 'log-fail';
  if (line.includes('Accepted')) return 'log-ok';
  if (line.includes('sudo') || line.includes('useradd')) return 'log-warn';
  return '';
}

export default {
  id: 'logi',
  title: 'Analityk SOC: czytanie logów',
  category: 'obrona',
  icon: 'activity',
  minutes: 12,
  summary: 'Masz przed sobą log logowań serwera z nocy. Przefiltruj go, znajdź atak, ustal, czy włamanie się udało, i zdecyduj, co zrobić.',
  lesson: [
    '<strong>SOC</strong> (Security Operations Center) to zespół, który pilnuje bezpieczeństwa firmy całą dobę. Analityk SOC dużą część dnia spędza na czytaniu <strong>logów</strong>, czyli zapisów zdarzeń z systemów.',
    'Na Linuksie logowania zapisuje się m.in. w pliku <code>/var/log/auth.log</code>. Każda linia to data, nazwa serwera, program i opis zdarzenia, np. <code>Failed password for root from 203.0.113.45</code>.',
    'Analityk szuka wzorców: wielu nieudanych prób z jednego adresu, logowań o dziwnych porach, nowych kont, użycia <code>sudo</code>. Najważniejsze pytanie: czy po serii porażek jest sukces?',
    'Poniżej masz filtr działający jak polecenie <code>grep</code>. Wpisz tekst albo kliknij gotowy filtr, żeby zobaczyć tylko pasujące linie.'
  ],
  takeaways: [
    'Seria „Failed password” z jednego adresu w krótkim czasie to atak brute force.',
    'Zawsze sprawdzaj, czy po nieudanych próbach nie pojawiło się „Accepted”.',
    'Po włamaniu atakujący zwykle podnosi uprawnienia (sudo) i zostawia sobie furtkę (nowe konto).',
    'Kolejność reakcji: powstrzymaj atak, zabezpiecz dowody, usuń furtki, zmień hasła, zgłoś incydent.',
    'Prewencja dla SSH: logowanie kluczem, wyłączone hasła, fail2ban, dostęp przez VPN.'
  ],
  async mount(stage, ctx) {
    const total = QUESTIONS.length;
    const logPanel = logViewer({ title: '/var/log/auth.log', lines: LOG, filters: FILTERS, classify: lineClass, placeholder: 'np. Failed' });
    const questions = h('div', { class: 'stage' });
    stage.append(h('div', { class: 'split split-even log-split' }, logPanel, questions));
    const score = await runQuiz(questions, ctx, QUESTIONS, { label: 'Pytanie', total });
    ctx.finish({ score, max: total });
  }
};
