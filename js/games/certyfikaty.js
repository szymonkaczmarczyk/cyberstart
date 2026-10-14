import { runQuiz, draw } from '../ui.js';

function cert({ url, subject, san, issuer, from, to, warning }) {
  const rows = [
    ['Adres w przeglądarce', url],
    ['Wystawiony dla', subject],
    ['Nazwy alternatywne (SAN)', san],
    ['Wystawca', issuer],
    ['Ważny', `od ${from} do ${to}`]
  ];
  return `<div class="cert-card" translate="no">${warning ? `<p class="cert-warning">${warning}</p>` : ''}<dl>${rows.map(([label, value]) => `<div><dt>${label}</dt><dd class="mono">${value}</dd></div>`).join('')}</dl><p class="t-small t-muted">Dzisiaj: 14.10.2026</p></div>`;
}

const POOL = [
  {
    prompt: 'Wchodzisz na stronę banku. Certyfikat wygląda tak. Ufasz połączeniu?',
    context: cert({ url: 'https://bankhoryzont.pl', subject: 'bankhoryzont.pl', san: 'bankhoryzont.pl, www.bankhoryzont.pl', issuer: 'Zaufany Urząd Certyfikacji R3', from: '01.08.2026', to: '30.10.2026' }),
    options: [
      { label: 'Tak: nazwa się zgadza, wystawca jest zaufany, certyfikat jest ważny', correct: true, why: 'To trzy rzeczy, które przeglądarka sprawdza automatycznie: domena, łańcuch zaufania i daty. Krótki okres ważności (90 dni) to dziś norma.' },
      { label: 'Nie, bo certyfikat jest ważny tylko 3 miesiące', why: 'Krótkie certyfikaty są normalne i bezpieczniejsze. Są automatycznie odnawiane.' }
    ]
  },
  {
    prompt: 'Przeglądarka pokazuje ostrzeżenie. Co jest nie tak?',
    context: cert({ url: 'https://sklep-rowerowy.pl', subject: 'sklep-rowerowy.pl', san: 'sklep-rowerowy.pl', issuer: 'Zaufany Urząd Certyfikacji R3', from: '01.06.2026', to: '30.09.2026', warning: 'Połączenie nie jest prywatne (NET::ERR_CERT_DATE_INVALID)' }),
    options: [
      { label: 'Certyfikat wygasł 30 września. Sklep zapomniał go odnowić', correct: true, why: 'Wygasły certyfikat to zwykle zaniedbanie, ale przeglądarka nie potrafi odróżnić go od ataku. Nie podawaj na takiej stronie haseł ani danych karty.' },
      { label: 'Wystawca jest niezaufany', why: 'Wystawca jest w porządku. Spójrz na daty ważności.' },
      { label: 'Nazwa domeny się nie zgadza', why: 'Nazwa pasuje. Problemem jest data.' }
    ]
  },
  {
    prompt: 'Wpisujesz adres banku, a certyfikat jest wystawiony dla innej nazwy. Co to może oznaczać?',
    context: cert({ url: 'https://bankhoryzont.pl', subject: '*.tani-hosting.pl', san: '*.tani-hosting.pl, tani-hosting.pl', issuer: 'Zaufany Urząd Certyfikacji R3', from: '01.09.2026', to: '30.11.2026', warning: 'Połączenie nie jest prywatne (NET::ERR_CERT_COMMON_NAME_INVALID)' }),
    options: [
      { label: 'Ktoś mógł przechwycić ruch (np. fałszywe Wi-Fi albo DNS) albo serwer jest źle skonfigurowany. Nie wchodzę dalej', correct: true, why: 'Niezgodność nazwy to klasyczny objaw ataku man-in-the-middle. Przy banku nigdy nie klikaj „Przejdź mimo to”.' },
      { label: 'Nic groźnego, klikam „Zaawansowane” i „Przejdź mimo to”', why: 'To dokładnie ten scenariusz, przed którym chroni certyfikat. Zrezygnuj i sprawdź połączenie.' }
    ]
  },
  {
    prompt: 'Strona banku ma certyfikat podpisany sam przez siebie. Co o tym myśleć?',
    context: cert({ url: 'https://bankhoryzont.pl', subject: 'bankhoryzont.pl', san: 'bankhoryzont.pl', issuer: 'bankhoryzont.pl (podpisany samodzielnie)', from: '14.10.2026', to: '14.10.2036', warning: 'Połączenie nie jest prywatne (NET::ERR_CERT_AUTHORITY_INVALID)' }),
    options: [
      { label: 'Podejrzane: publiczna strona banku zawsze ma certyfikat od zaufanego urzędu', correct: true, why: 'Certyfikat podpisany samodzielnie może wygenerować każdy, także atakujący. Ważność na 10 lat i wystawienie „dziś” to kolejne sygnały.' },
      { label: 'W porządku, bank sam najlepiej wie, kim jest', why: 'Właśnie dlatego istnieją urzędy certyfikacji: ktoś niezależny musi potwierdzić, że domena należy do wystawiającego.' }
    ]
  },
  {
    prompt: 'Kłódka jest, certyfikat ważny i wystawiony przez zaufany urząd. Czy ta strona jest bezpieczna?',
    context: cert({ url: 'https://bankhoryzont-logowanie.pl', subject: 'bankhoryzont-logowanie.pl', san: 'bankhoryzont-logowanie.pl', issuer: 'Zaufany Urząd Certyfikacji R3', from: '10.10.2026', to: '08.01.2027' }),
    options: [
      { label: 'Nie. Certyfikat potwierdza tylko, że łączysz się z bankhoryzont-logowanie.pl. To nie jest domena banku', correct: true, why: 'Oszuści bez problemu dostają darmowe certyfikaty dla swoich domen. Kłódka oznacza szyfrowanie, a nie uczciwość. Świeża data wystawienia pasuje do kampanii phishingowej.' },
      { label: 'Tak, kłódka oznacza zaufaną stronę', why: 'Kłódka mówi „połączenie jest szyfrowane z tą domeną”. Nie mówi nic o intencjach właściciela.' }
    ]
  },
  {
    prompt: 'Co robi urząd certyfikacji (CA)?',
    options: [
      { label: 'Sprawdza, że wnioskodawca kontroluje domenę, i podpisuje jego certyfikat swoim kluczem', correct: true, why: 'Przeglądarki mają wbudowaną listę zaufanych urzędów. Jeśli podpis pochodzi od nich, łańcuch zaufania się zgadza.' },
      { label: 'Szyfruje całą komunikację w internecie', why: 'CA nie uczestniczy w samej komunikacji. Potwierdza tożsamość serwera.' },
      { label: 'Sprawdza, czy strona nie oszukuje klientów', why: 'Większość certyfikatów (DV) potwierdza tylko kontrolę nad domeną, a nie uczciwość firmy.' }
    ]
  },
  {
    prompt: 'Panel Twojego domowego routera pod adresem 192.168.1.1 pokazuje ostrzeżenie o certyfikacie podpisanym samodzielnie. Co z tym zrobić?',
    level: 'zaawansowany',
    options: [
      { label: 'To typowe dla urządzeń w sieci lokalnej. Można sprawdzić odcisk certyfikatu w instrukcji lub na naklejce i zaakceptować go świadomie', correct: true, why: 'Urzędy certyfikacji nie wystawiają certyfikatów dla prywatnych adresów IP. Różnica między routerem w domu a bankiem w internecie jest kluczowa.' },
      { label: 'Natychmiast wyrzucić router, bo jest zhakowany', why: 'Samodzielnie podpisany certyfikat w sieci lokalnej to norma, a nie dowód włamania.' }
    ]
  },
  {
    prompt: 'Czym są logi Certificate Transparency?',
    level: 'zaawansowany',
    options: [
      { label: 'Publicznymi rejestrami wszystkich wystawionych certyfikatów. Firma może sprawdzić, czy ktoś nie dostał certyfikatu dla jej domeny', correct: true, why: 'Dzięki serwisom do przeszukiwania CT (np. crt.sh) widać też świeże domeny łudząco podobne do Twojej marki, często szykowane pod phishing.' },
      { label: 'Plikami z hasłami do certyfikatów', why: 'CT to publiczne, tylko dopisywane rejestry certyfikatów.' }
    ]
  },
  {
    prompt: 'Co daje nagłówek HSTS (Strict-Transport-Security)?',
    level: 'zaawansowany',
    options: [
      { label: 'Przeglądarka zawsze łączy się z domeną po HTTPS i nie pozwala ominąć błędów certyfikatu', correct: true, why: 'HSTS chroni przed atakiem, w którym ktoś „cofa” połączenie do zwykłego HTTP. Po jego ustawieniu przycisk „Przejdź mimo to” znika.' },
      { label: 'Przyspiesza ładowanie strony', why: 'HSTS dotyczy bezpieczeństwa połączenia, a nie szybkości.' }
    ]
  }
];

export default {
  id: 'certyfikaty',
  title: 'Certyfikaty i kłódka HTTPS',
  category: 'hasla',
  icon: 'shieldCheck',
  minutes: 10,
  levels: true,
  summary: 'Oglądasz certyfikaty stron jak przeglądarka: nazwa, wystawca, daty. Rozpoznajesz wygasły certyfikat, atak z podmienioną nazwą i phishing z „prawdziwą” kłódką.',
  lesson: [
    '<strong>Certyfikat</strong> to elektroniczny dowód tożsamości serwera. Zawiera nazwę domeny, klucz publiczny, daty ważności i podpis urzędu certyfikacji (CA), który potwierdził, że domena należy do wystawiającego.',
    'Przeglądarka przy każdym połączeniu HTTPS sprawdza trzy rzeczy: czy <strong>nazwa</strong> w certyfikacie zgadza się z adresem, czy <strong>wystawca</strong> jest na liście zaufanych i czy certyfikat jest <strong>ważny</strong>.',
    'Kliknięcie kłódki w pasku adresu pokazuje szczegóły certyfikatu. Ostrzeżenie „Połączenie nie jest prywatne” zawsze traktuj poważnie.',
    'Pamiętaj: certyfikat potwierdza domenę, a nie uczciwość. Fałszywa strona z podobną nazwą też może mieć kłódkę.'
  ],
  takeaways: [
    'Przeglądarka sprawdza nazwę, wystawcę i daty. Błąd któregokolwiek to powód, żeby się zatrzymać.',
    'Na stronach banków, sklepów i poczty nigdy nie klikaj „Przejdź mimo to”.',
    'Kłódka oznacza szyfrowanie z daną domeną. Zawsze czytaj, jaka to domena.',
    'Certyfikaty podpisane samodzielnie są normalne w sieci lokalnej (router), ale nie na publicznych stronach.',
    'Logi Certificate Transparency i HSTS to narzędzia, którymi firmy chronią swoje domeny.'
  ],
  async mount(stage, ctx) {
    const questions = draw(POOL, 6, ctx.level);
    const score = await runQuiz(stage, ctx, questions, { label: 'Certyfikat' });
    ctx.finish({ score, max: questions.length });
  }
};

export function examPool() {
  return POOL;
}
