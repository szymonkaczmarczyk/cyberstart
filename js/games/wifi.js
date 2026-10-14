import { runQuiz, draw } from '../ui.js';

function network(name, security, note = '') {
  return `<span class="wifi-net"><strong class="mono">${name}</strong><span class="tag">${security}</span>${note ? `<span class="t-small t-muted">${note}</span>` : ''}</span>`;
}

const POOL = [
  {
    prompt: 'Jesteś w kawiarni „Ziarno”. Na ścianie wisi kartka: sieć <code>Ziarno_Goscie</code>, hasło <code>kawa2026</code>. Którą sieć wybierasz?',
    options: [
      { label: network('Ziarno_Goscie', 'WPA2', 'wymaga hasła z kartki'), correct: true, why: 'To sieć podana przez lokal i chroniona hasłem. Pamiętaj, że hasło znają wszyscy goście, więc i tak korzystaj tylko z HTTPS albo VPN.' },
      { label: network('Ziarno_Goscie_FREE', 'Otwarta', 'najmocniejszy sygnał'), why: 'Podobna nazwa, brak hasła i najmocniejszy sygnał to typowy „zły bliźniak” (evil twin), postawiony przez kogoś obok.' },
      { label: network('Darmowe_WiFi', 'Otwarta'), why: 'Nie wiadomo, czyja to sieć. Otwarta sieć bez właściciela to zaproszenie do podsłuchu.' }
    ]
  },
  {
    prompt: 'Po połączeniu z hotelowym Wi-Fi wyskakuje strona logowania, która prosi o login i hasło do… Twojej poczty Gmail. Co robisz?',
    options: [
      { label: 'Rozłączam się. Portal sieci nie ma powodu prosić o hasło do poczty', correct: true, why: 'Strony powitalne (captive portal) proszą zwykle o numer pokoju albo akceptację regulaminu. Prośba o hasło do innego serwisu to phishing.' },
      { label: 'Loguję się, hotel pewnie tak weryfikuje gości', why: 'Hotel nie potrzebuje hasła do Twojej poczty. Ktoś właśnie próbuje je przejąć.' }
    ]
  },
  {
    prompt: 'Musisz pilnie zapłacić fakturę, a jesteś na dworcu. Co jest najbezpieczniejsze?',
    options: [
      { label: 'Wyłączam Wi-Fi i płacę przez internet komórkowy w aplikacji banku', correct: true, why: 'Własne połączenie komórkowe nie dzieli się z obcymi. Aplikacja banku dodatkowo sprawdza certyfikat serwera.' },
      { label: 'Łączę się z „Dworzec_Free” i płacę w przeglądarce', why: 'Nie wiesz, kto stoi za siecią. HTTPS bardzo pomaga, ale fałszywa sieć to i tak niepotrzebne ryzyko przy płatnościach.' },
      { label: 'Proszę nieznajomego o udostępnienie hotspotu', why: 'Cały Twój ruch szedłby przez telefon obcej osoby.' }
    ]
  },
  {
    prompt: 'Czy ukrycie nazwy sieci (SSID) w routerze ją zabezpiecza?',
    options: [
      { label: 'Nie. Nazwa i tak pojawia się w ruchu, gdy urządzenia się łączą', correct: true, why: 'Ukryta sieć jest niewidoczna tylko na liście w telefonie. Każde narzędzie do analizy Wi-Fi pokaże ją w kilka sekund. Prawdziwa ochrona to szyfrowanie WPA2 lub WPA3 i mocne hasło.' },
      { label: 'Tak, nikt jej nie znajdzie', why: 'Wystarczy, że jakiekolwiek urządzenie się z nią połączy, a nazwa zostaje ujawniona.' }
    ]
  },
  {
    prompt: 'Filtrowanie adresów MAC w routerze (wpuszczam tylko znane urządzenia). To dobra ochrona?',
    options: [
      { label: 'Słaba. Adres MAC da się podejrzeć w ruchu i podrobić', correct: true, why: 'Adresy MAC przesyłane są jawnie, a zmiana własnego MAC to jedno polecenie. To utrudnienie, a nie zabezpieczenie.' },
      { label: 'Bardzo dobra, MAC jest unikalny i niezmienny', why: 'MAC da się łatwo zmienić programowo. Nowoczesne telefony same losują MAC dla każdej sieci.' }
    ]
  },
  {
    prompt: 'Co to jest atak „evil twin” (zły bliźniak)?',
    options: [
      { label: 'Fałszywa sieć Wi-Fi o takiej samej nazwie jak prawdziwa, żeby przechwycić ruch', correct: true, why: 'Telefon często łączy się sam z siecią o znanej nazwie. Dlatego warto „zapominać” publiczne sieci po użyciu i wyłączyć automatyczne łączenie.' },
      { label: 'Dwa routery w jednym domu', why: 'Chodzi o fałszywą sieć podszywającą się pod prawdziwą.' }
    ]
  },
  {
    prompt: 'Co daje VPN w publicznej sieci Wi-Fi?',
    options: [
      { label: 'Szyfrowany tunel: osoby w tej samej sieci nie widzą Twojego ruchu', correct: true, why: 'VPN chroni przed podsłuchem w lokalnej sieci. Nie chroni jednak przed phishingiem ani złośliwymi stronami, a dostawca VPN widzi Twój ruch, więc wybieraj zaufanego.' },
      { label: 'Pełną anonimowość i ochronę przed wirusami', why: 'VPN nie jest antywirusem i nie daje pełnej anonimowości. Szyfruje drogę do serwera VPN.' }
    ]
  },
  {
    prompt: 'Czym WPA3 jest lepsze od WPA2 w sieciach z hasłem?',
    level: 'zaawansowany',
    options: [
      { label: 'Uzgadnianie SAE nie pozwala zgadywać hasła offline z nagranego połączenia', correct: true, why: 'W WPA2 wystarczy nagrać moment łączenia (handshake) i zgadywać hasło u siebie bez limitu. W WPA3 każda próba wymaga interakcji z siecią.' },
      { label: 'WPA3 nie wymaga hasła', why: 'WPA3 Personal nadal używa hasła, tylko chroni je lepiej.' }
    ]
  },
  {
    prompt: 'Firma chce, żeby każdy pracownik logował się do Wi-Fi własnym kontem, a nie wspólnym hasłem. Czego użyje?',
    level: 'zaawansowany',
    options: [
      { label: 'WPA2 lub WPA3 Enterprise z uwierzytelnianiem 802.1X (np. przez serwer RADIUS)', correct: true, why: 'Każdy ma własne dane, a po odejściu pracownika wystarczy wyłączyć jego konto, bez zmieniania hasła wszystkim.' },
      { label: 'Ukrytego SSID', why: 'Ukrycie nazwy niczego nie daje, co już wiesz.' },
      { label: 'WEP z długim hasłem', why: 'WEP jest złamany niezależnie od długości hasła.' }
    ]
  },
  {
    prompt: 'Laptop co chwilę traci połączenie z Wi-Fi, a w logach routera widać masę ramek „deauthentication”. Co to może być?',
    level: 'zaawansowany',
    options: [
      { label: 'Atak deauth: ktoś wysyła fałszywe ramki rozłączające, np. żeby nagrać ponowne łączenie', correct: true, why: 'Ramki zarządzania w starszych sieciach nie są chronione. WPA3 i włączone PMF (Protected Management Frames) zabezpieczają przed tym atakiem.' },
      { label: 'Zbyt mocny sygnał', why: 'Mocny sygnał nie powoduje ramek deauthentication.' }
    ]
  }
];

export default {
  id: 'wifi',
  title: 'Bezpieczne Wi-Fi',
  category: 'sieci',
  icon: 'wifi',
  minutes: 8,
  levels: true,
  summary: 'Kawiarnia, hotel, dworzec: wybierasz sieć i reagujesz na podejrzane sytuacje. Do tego mity o ukrytej sieci i filtrowaniu MAC, a na poziomie zaawansowanym WPA3, 802.1X i ataki deauth.',
  lesson: [
    'Wi-Fi to radio: każdy w zasięgu „słyszy” Twoje pakiety. Dlatego tak ważne jest <strong>szyfrowanie</strong> sieci (WPA2 lub WPA3) i <strong>szyfrowanie połączeń</strong> (HTTPS, VPN).',
    'W sieci publicznej hasło znają wszyscy goście, więc nie chroni Cię przed innymi użytkownikami tej samej sieci. Chroni tylko przed tymi, którzy hasła nie znają.',
    'Najczęstsze zagrożenia to fałszywe sieci o znajomych nazwach, strony logowania wyłudzające hasła i podsłuch nieszyfrowanego ruchu.'
  ],
  takeaways: [
    'Wybieraj sieć podaną przez właściciela miejsca. Uważaj na podobne nazwy i otwarte sieci z najmocniejszym sygnałem.',
    'Ważne sprawy (bank, płatności) załatwiaj przez internet komórkowy albo VPN.',
    'Ukryty SSID i filtrowanie MAC to nie zabezpieczenia. Liczy się WPA2 lub WPA3 i mocne hasło.',
    'Wyłącz automatyczne łączenie z publicznymi sieciami i „zapominaj” je po użyciu.',
    'Firmy używają Wi-Fi Enterprise (802.1X), żeby każdy miał własne konto.'
  ],
  async mount(stage, ctx) {
    const questions = draw(POOL, 7, ctx.level);
    const score = await runQuiz(stage, ctx, questions, { label: 'Sytuacja' });
    ctx.finish({ score, max: questions.length });
  }
};

export function examPool() {
  return POOL;
}
