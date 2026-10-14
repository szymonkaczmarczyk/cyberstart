import { h, runQuiz } from '../ui.js';
import { logViewer } from '../log-viewer.js';

const SCANNER = '203.0.113.77';
const INJECTOR = '192.0.2.66';

const LOG = [
  '198.51.100.14 [14/Oct/2026:09:12:01] "GET / HTTP/1.1" 200 5123 "Mozilla/5.0 (Macintosh)"',
  '198.51.100.14 [14/Oct/2026:09:12:03] "GET /produkt?id=12 HTTP/1.1" 200 3311 "Mozilla/5.0 (Macintosh)"',
  '10.0.1.15 [14/Oct/2026:09:12:30] "GET /health HTTP/1.1" 200 2 "kube-probe/1.30"',
  `${SCANNER} [14/Oct/2026:09:14:10] "GET /admin HTTP/1.1" 404 162 "gobuster/3.6"`,
  `${SCANNER} [14/Oct/2026:09:14:10] "GET /backup.zip HTTP/1.1" 404 162 "gobuster/3.6"`,
  `${SCANNER} [14/Oct/2026:09:14:11] "GET /wp-login.php HTTP/1.1" 404 162 "gobuster/3.6"`,
  `${SCANNER} [14/Oct/2026:09:14:11] "GET /.git/config HTTP/1.1" 404 162 "gobuster/3.6"`,
  `${SCANNER} [14/Oct/2026:09:14:12] "GET /.env HTTP/1.1" 200 812 "gobuster/3.6"`,
  `${SCANNER} [14/Oct/2026:09:14:12] "GET /phpmyadmin/ HTTP/1.1" 404 162 "gobuster/3.6"`,
  '198.51.100.14 [14/Oct/2026:09:15:40] "GET /koszyk HTTP/1.1" 200 2290 "Mozilla/5.0 (Macintosh)"',
  `${INJECTOR} [14/Oct/2026:09:21:05] "GET /produkt?id=12%27%20OR%20%271%27%3D%271 HTTP/1.1" 500 0 "sqlmap/1.8"`,
  `${INJECTOR} [14/Oct/2026:09:21:06] "GET /produkt?id=12%20UNION%20SELECT%20NULL-- HTTP/1.1" 500 0 "sqlmap/1.8"`,
  `${INJECTOR} [14/Oct/2026:09:21:12] "GET /produkt?id=12%20AND%20SLEEP(5) HTTP/1.1" 200 3311 "sqlmap/1.8"`,
  '198.51.100.30 [14/Oct/2026:09:30:44] "GET /szukaj?q=%3Cscript%3Ealert(1)%3C%2Fscript%3E HTTP/1.1" 200 1840 "Mozilla/5.0 (Windows)"',
  '198.51.100.201 [14/Oct/2026:09:40:01] "POST /logowanie HTTP/1.1" 401 54 "python-requests/2.32"',
  '198.51.100.202 [14/Oct/2026:09:40:01] "POST /logowanie HTTP/1.1" 401 54 "python-requests/2.32"',
  '198.51.100.203 [14/Oct/2026:09:40:02] "POST /logowanie HTTP/1.1" 401 54 "python-requests/2.32"',
  '198.51.100.204 [14/Oct/2026:09:40:02] "POST /logowanie HTTP/1.1" 200 61 "python-requests/2.32"',
  '198.51.100.205 [14/Oct/2026:09:40:03] "POST /logowanie HTTP/1.1" 401 54 "python-requests/2.32"',
  '198.51.100.14 [14/Oct/2026:09:41:10] "POST /zamowienie HTTP/1.1" 201 88 "Mozilla/5.0 (Macintosh)"'
];

const FILTERS = [SCANNER, INJECTOR, '" 404 ', '" 500 ', '/logowanie', '.env'];

function lineClass(line) {
  if (line.includes('/.env') && line.includes('" 200 ')) return 'log-breach';
  if (line.includes('/logowanie') && line.includes('" 200 ')) return 'log-breach';
  if (line.includes('" 500 ') || line.includes('%3Cscript')) return 'log-fail';
  if (line.includes('" 404 ') || line.includes('" 401 ')) return 'log-warn';
  return '';
}

const QUESTIONS = [
  {
    prompt: 'Który adres przeszukuje serwer w poszukiwaniu ukrytych plików i paneli?',
    options: [
      { label: `<span class="mono">${SCANNER}</span>`, correct: true, why: 'Seria żądań o typowe ścieżki (/admin, /backup.zip, /.git/config) w ciągu dwóch sekund, prawie same 404. Do tego user agent narzędzia gobuster.' },
      { label: '<span class="mono">198.51.100.14</span>', why: 'Ten klient przegląda produkty, koszyk i składa zamówienie. Zwykły kupujący.' },
      { label: '<span class="mono">10.0.1.15</span>', why: 'To wewnętrzny adres i zapytania /health, czyli monitoring działania aplikacji.' }
    ]
  },
  {
    prompt: 'Która linia ze skanowania jest najgroźniejsza?',
    options: [
      { label: '<code>GET /.env</code> z kodem <code>200</code>', correct: true, why: 'Kod 200 oznacza, że plik został pobrany. Plik .env zwykle zawiera hasła do bazy i klucze API. To realny wyciek, a nie tylko próba.' },
      { label: '<code>GET /admin</code> z kodem <code>404</code>', why: '404 oznacza, że niczego nie znaleziono. To próba, ale nieudana.' },
      { label: '<code>GET /wp-login.php</code> z kodem <code>404</code>', why: 'Sklep nie działa na WordPressie, więc 404. Boty sprawdzają tę ścieżkę na każdym serwerze.' }
    ]
  },
  {
    prompt: 'Plik .env wyciekł. Co robisz najpierw?',
    options: [
      { label: 'Unieważniam i zmieniam wszystkie hasła i klucze z tego pliku, a potem usuwam go z katalogu publicznego', correct: true, why: 'Usunięcie pliku nie cofa wycieku: atakujący ma już kopię. Każdy sekret z pliku trzeba uznać za spalony. Potem blokujesz serwowanie plików zaczynających się od kropki.' },
      { label: 'Usuwam plik i sprawa załatwiona', why: 'Plik już pobrano. Bez zmiany haseł i kluczy atakujący nadal ma dostęp.' },
      { label: 'Blokuję adres skanera i nic więcej', why: 'Zablokowanie adresu nie unieważnia skradzionych sekretów, a atakujący zmieni adres w minutę.' }
    ]
  },
  {
    prompt: `Adres <span class="mono">${INJECTOR}</span> wysyła <code>id=12' OR '1'='1</code> (tu zakodowane jako %27). Co to za atak?`,
    options: [
      { label: 'SQL injection', correct: true, why: 'Apostrof i warunek zawsze prawdziwy to klasyczna próba zmiany zapytania SQL. User agent wskazuje narzędzie sqlmap.' },
      { label: 'XSS', why: 'XSS wstrzykuje skrypty do przeglądarki. Tu celem jest baza danych.' },
      { label: 'DDoS', why: 'To kilka precyzyjnych żądań, a nie zalewanie ruchem.' }
    ]
  },
  {
    prompt: 'Dlaczego odpowiedzi <code>500</code> na te żądania są niepokojące?',
    options: [
      { label: 'Błąd serwera sugeruje, że wstrzyknięty tekst trafia do zapytania SQL, czyli parametr może być podatny', correct: true, why: 'Bezpieczna aplikacja z zapytaniami parametryzowanymi potraktowałaby to jak zwykły tekst. Programiści powinni pilnie sprawdzić kod obsługujący /produkt.' },
      { label: 'Oznaczają, że atak został zablokowany', why: '500 to błąd po stronie serwera, a nie blokada. Blokada zwykle daje 403.' }
    ]
  },
  {
    prompt: 'W wyszukiwarce pojawia się <code>q=%3Cscript%3Ealert(1)%3C%2Fscript%3E</code>. Co to jest?',
    options: [
      { label: 'Próba XSS: zakodowany znacznik &lt;script&gt;', correct: true, why: '%3C to znak &lt;, a %3E to &gt;. Jeśli strona wyświetli zapytanie bez escapowania, skrypt wykona się w przeglądarce.' },
      { label: 'Zwykłe wyszukiwanie produktu', why: 'Mało kto szuka w sklepie znaczników HTML.' }
    ]
  },
  {
    prompt: 'Pięć prób logowania z pięciu różnych adresów, każda po jednej, ten sam automat. Jedna się udała. Jak się przed tym bronić?',
    options: [
      { label: 'Limity prób na konto (a nie tylko na adres), 2FA i sprawdzanie haseł z wycieków', correct: true, why: 'To credential stuffing z wielu adresów: blokada pojedynczego adresu nic nie da. Udane logowanie (200) oznacza przejęte konto, więc trzeba je zablokować i powiadomić klienta.' },
      { label: 'Zablokowanie adresu 198.51.100.201', why: 'Każda próba idzie z innego adresu. Blokowanie po jednym nie zatrzyma ataku.' }
    ]
  }
];

export default {
  id: 'weblogi',
  title: 'Analityk SOC: logi serwera WWW',
  category: 'obrona',
  icon: 'globe',
  minutes: 12,
  summary: 'Log dostępu sklepu internetowego z jednego poranka. Wśród zwykłych klientów ukryły się: skaner katalogów, próba SQL injection, XSS i przejęcie konta. Znajdź je.',
  lesson: [
    'Serwer WWW (np. nginx) zapisuje każde żądanie w logu dostępu: adres klienta, czas, metodę i ścieżkę, <strong>kod odpowiedzi</strong>, rozmiar i nazwę przeglądarki (user agent).',
    'Kody odpowiedzi: <code>200</code> sukces, <code>201</code> utworzono, <code>401</code> brak autoryzacji, <code>404</code> nie znaleziono, <code>500</code> błąd serwera. Analityk patrzy szczególnie na sukcesy tam, gdzie ich być nie powinno.',
    'Znaki specjalne w adresach są kodowane: <code>%27</code> to apostrof, <code>%20</code> spacja, <code>%3C</code> i <code>%3E</code> to znaki mniejszości i większości. To pomaga rozpoznać ataki.',
    'User agent mówi, czym przedstawia się klient, ale łatwo go podrobić. Traktuj go jako wskazówkę, a nie dowód.'
  ],
  takeaways: [
    'Seria 404 na typowe ścieżki to skanowanie katalogów. Jeden kod 200 w takiej serii to możliwy wyciek.',
    'Plik .env, kopie zapasowe i katalog .git nigdy nie mogą leżeć w katalogu publicznym serwera.',
    'Apostrofy, UNION i SLEEP w parametrach to SQL injection. Odpowiedzi 500 wskazują podatny parametr.',
    'Zakodowane <code>%3Cscript%3E</code> to próba XSS. Chroni escapowanie danych przy wyświetlaniu.',
    'Credential stuffing z wielu adresów zatrzymują limity na konto, 2FA i blokowanie haseł z wycieków.'
  ],
  async mount(stage, ctx) {
    const total = QUESTIONS.length;
    const logPanel = logViewer({ title: '/var/log/nginx/access.log', lines: LOG, filters: FILTERS, classify: lineClass, placeholder: 'np. 404 albo adres IP' });
    const questions = h('div', { class: 'stage' });
    stage.append(h('div', { class: 'split split-even log-split' }, logPanel, questions));
    const score = await runQuiz(questions, ctx, QUESTIONS, { label: 'Pytanie', total });
    ctx.finish({ score, max: total });
  }
};
