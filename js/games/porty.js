import { runQuiz, shuffle, draw } from '../ui.js';

const PORTS = [
  { port: 22, service: 'SSH', desc: 'szyfrowane zdalne logowanie do serwera', note: 'SSH wystawiony do internetu jest stale atakowany zgadywaniem haseł. Dlatego logujemy się kluczem, a nie hasłem.' },
  { port: 23, service: 'Telnet', desc: 'stare zdalne logowanie bez szyfrowania', note: 'Telnet przesyła hasła jawnym tekstem. Każdy, kto podsłucha ruch, je zobaczy. Zastąp go SSH.' },
  { port: 25, service: 'SMTP', desc: 'wysyłanie poczty między serwerami', note: 'Źle skonfigurowany serwer SMTP może posłużyć spamerom do rozsyłania wiadomości.' },
  { port: 53, service: 'DNS', desc: 'tłumaczenie nazw domen na adresy IP', note: 'DNS to książka telefoniczna internetu. Atakujący próbują ją fałszować, żeby przekierować Cię na podrobioną stronę.' },
  { port: 80, service: 'HTTP', desc: 'strony WWW bez szyfrowania', note: 'Na porcie 80 dane płyną jawnie. Dziś serwer powinien od razu przekierować na HTTPS.' },
  { port: 443, service: 'HTTPS', desc: 'strony WWW z szyfrowaniem TLS', note: 'Kłódka w przeglądarce oznacza szyfrowane połączenie. Nie oznacza jednak, że strona jest uczciwa.' },
  { port: 445, service: 'SMB', desc: 'udostępnianie plików w sieciach Windows', note: 'W 2017 roku ransomware WannaCry rozprzestrzeniał się właśnie przez SMB. Ten port nigdy nie powinien być dostępny z internetu.' },
  { port: 3306, service: 'MySQL', desc: 'baza danych MySQL i MariaDB', note: 'Baza danych powinna być dostępna tylko dla serwera aplikacji, a nie dla całego świata.' },
  { port: 3389, service: 'RDP', desc: 'pulpit zdalny Windows', note: 'Wystawiony do internetu RDP to jedna z najczęstszych dróg wejścia grup ransomware. Dostęp tylko przez VPN.' },
  { port: 143, service: 'IMAP', desc: 'odbieranie poczty z serwera', note: 'Wersja szyfrowana działa na porcie 993. Zawsze wybieraj szyfrowane warianty protokołów pocztowych.' },
  { port: 21, service: 'FTP', desc: 'stary protokół przesyłania plików', note: 'FTP wysyła login i hasło jawnym tekstem. Zamiast niego używa się SFTP (przez SSH, port 22).', level: 'zaawansowany' },
  { port: 110, service: 'POP3', desc: 'pobieranie poczty na jedno urządzenie', note: 'Szyfrowana wersja to POP3S na porcie 995.', level: 'zaawansowany' },
  { port: 161, service: 'SNMP', desc: 'monitorowanie urządzeń sieciowych (UDP)', note: 'Stare wersje SNMP używają „community string” zamiast hasła, często domyślnego „public”. Wyciek konfiguracji urządzeń sieciowych gwarantowany.', level: 'zaawansowany' },
  { port: 389, service: 'LDAP', desc: 'katalog użytkowników, np. Active Directory', note: 'Szyfrowany wariant to LDAPS na porcie 636. Katalog użytkowników to łakomy kąsek dla atakującego.', level: 'zaawansowany' },
  { port: 5432, service: 'PostgreSQL', desc: 'baza danych PostgreSQL', note: 'Jak każda baza: dostęp tylko z serwera aplikacji, nigdy z całego internetu.', level: 'zaawansowany' },
  { port: 6379, service: 'Redis', desc: 'szybka baza w pamięci, często jako cache', note: 'Redis wystawiony do internetu bez hasła był masowo przejmowany. Domyślnie powinien słuchać tylko na 127.0.0.1.', level: 'zaawansowany' },
  { port: 5900, service: 'VNC', desc: 'zdalny pulpit (wieloplatformowy)', note: 'Jak RDP: zdalny pulpit tylko przez VPN, nigdy wprost z internetu.', level: 'zaawansowany' },
  { port: 27017, service: 'MongoDB', desc: 'dokumentowa baza danych MongoDB', note: 'Tysiące niezabezpieczonych baz MongoDB padły ofiarą wymuszeń: dane kasowano i żądano okupu.', level: 'zaawansowany' },
  { port: 8080, service: 'HTTP (alternatywny)', desc: 'serwery aplikacji i panele testowe', note: 'Na 8080 często zostają zapomniane panele administracyjne i wersje testowe. Sprawdzaj, co tam działa.', level: 'zaawansowany' }
];

const CONCEPTS = [
  {
    prompt: 'Co oznacza, że port na serwerze jest „otwarty”?',
    options: [
      { label: 'Jakiś program na nim nasłuchuje i przyjmuje połączenia', correct: true, why: 'Otwarty port to usługa gotowa do rozmowy. Każda taka usługa to potencjalne drzwi, które trzeba pilnować.' },
      { label: 'Serwer jest zhakowany', why: 'Otwarte porty są normalne, np. 443 na serwerze WWW. Problem zaczyna się, gdy otwarte jest coś zbędnego.' },
      { label: 'Kabel sieciowy jest odłączony', why: 'Port to pojęcie logiczne, nie fizyczne gniazdo.' }
    ]
  },
  {
    prompt: 'Administrator skanuje swój serwer i widzi otwarte porty 22, 443 i 3306. Strona potrzebuje tylko HTTPS. Co robi?',
    options: [
      { label: 'Zamyka 3306 dla internetu, a 22 ogranicza do swojego adresu lub VPN', correct: true, why: 'Mniej otwartych drzwi to mniejsza powierzchnia ataku. Baza danych i panel administracyjny nie powinny być widoczne dla wszystkich.' },
      { label: 'Nic, skoro strona działa', why: 'Działająca strona to nie to samo co bezpieczna. Zbędne usługi zwiększają ryzyko.' },
      { label: 'Zmienia numer portu bazy na losowy i uznaje, że jest bezpiecznie', why: 'Zmiana numeru portu tylko utrudnia znalezienie usługi, ale skaner i tak ją wykryje. To nie zastępuje firewalla.' }
    ]
  },
  {
    prompt: 'Ile jest wszystkich możliwych numerów portów TCP?',
    options: [
      { label: '65 536 (od 0 do 65535)', correct: true, why: 'Numer portu zapisuje się na 16 bitach, a 2¹⁶ = 65 536.' },
      { label: '1024', why: '1024 to tylko porty „dobrze znane” (0 do 1023).' },
      { label: '255', why: 'To zakres jednej liczby w adresie IPv4, a nie portów.' }
    ]
  },
  {
    prompt: 'Czym różni się port TCP od portu UDP o tym samym numerze, np. 53?',
    options: [
      { label: 'To osobne „drzwi”: usługa może słuchać na TCP, UDP albo na obu', correct: true, why: 'DNS używa zwykle UDP 53 dla zwykłych zapytań i TCP 53 dla dużych odpowiedzi. Skanując, trzeba sprawdzać oba protokoły.' },
      { label: 'Niczym, to ten sam port', why: 'TCP i UDP mają niezależne przestrzenie portów.' }
    ],
    level: 'zaawansowany'
  },
  {
    prompt: 'Skaner pokazuje port w stanie „filtered”. Co to najpewniej znaczy?',
    options: [
      { label: 'Firewall po drodze nie przepuszcza sond, więc nie wiadomo, czy usługa działa', correct: true, why: '„open” oznacza działającą usługę, „closed” brak usługi, a „filtered” to brak odpowiedzi przez filtr pakietów.' },
      { label: 'Usługa działa i jest szyfrowana', why: 'Stan portu nie mówi nic o szyfrowaniu.' },
      { label: 'Port jest otwarty tylko dla administratora', why: 'Skaner nie zna takich szczegółów. „filtered” to brak odpowiedzi.' }
    ],
    level: 'zaawansowany'
  }
];

function serviceQuestion(entry) {
  const distractors = shuffle(PORTS.filter((p) => p.port !== entry.port)).slice(0, 3);
  return {
    prompt: `Na którym porcie domyślnie działa <strong>${entry.service}</strong>, czyli ${entry.desc}?`,
    options: shuffle([entry, ...distractors]).map((p) => ({ label: `<span class="mono">${p.port}</span>`, correct: p.port === entry.port })),
    explain: `${entry.service} to port ${entry.port}. ${entry.note}`
  };
}

function portQuestion(entry) {
  const distractors = shuffle(PORTS.filter((p) => p.port !== entry.port)).slice(0, 3);
  return {
    prompt: `Skaner pokazuje otwarty port <strong class="mono">${entry.port}</strong>. Jaka usługa najpewniej na nim działa?`,
    options: shuffle([entry, ...distractors]).map((p) => ({ label: `${p.service}: ${p.desc}`, correct: p.port === entry.port })),
    explain: entry.note
  };
}

export default {
  id: 'porty',
  title: 'Porty i usługi',
  category: 'sieci',
  icon: 'plug',
  minutes: 8,
  levels: true,
  summary: 'Dopasuj najważniejsze porty do usług, od SSH po RDP, i dowiedz się, dlaczego niektóre z nich nigdy nie powinny być widoczne z internetu.',
  lesson: [
    'Adres IP prowadzi do komputera, ale na jednym komputerze działa wiele programów naraz. <strong>Port</strong> to numer drzwi, za którymi czeka konkretny program. Jeśli adres IP to adres bloku, port to numer mieszkania.',
    'Portów jest 65 536 (od 0 do 65535). Pierwsze 1024 to porty „dobrze znane”, przypisane popularnym usługom, np. 443 dla HTTPS.',
    'Program, który czeka na połączenia, <strong>nasłuchuje</strong> na porcie. Taki port jest <strong>otwarty</strong>. Każdy otwarty port to drzwi, przez które można próbować wejść.',
    'Dlatego pierwsza rzecz przy zabezpieczaniu serwera to sprawdzić, które drzwi są otwarte, i zamknąć zbędne. Narzędzie Nmap robi taki przegląd w kilka sekund.'
  ],
  takeaways: [
    'Najważniejsze porty: 22 SSH, 53 DNS, 80 HTTP, 443 HTTPS, 445 SMB, 3306 MySQL, 3389 RDP.',
    'Otwarty port oznacza nasłuchującą usługę. Zamykaj wszystko, czego nie potrzebujesz.',
    'Telnet (23) i HTTP (80) przesyłają dane jawnie. Ich szyfrowane odpowiedniki to SSH (22) i HTTPS (443).',
    'SMB, RDP i bazy danych nie powinny być dostępne z internetu. Dostęp do nich tylko przez VPN lub z wybranych adresów.',
    'Zmiana numeru portu to kamuflaż, a nie zabezpieczenie.'
  ],
  async mount(stage, ctx) {
    const picks = draw(PORTS, 10, ctx.level);
    const questions = [
      ...picks.slice(0, 5).map(serviceQuestion),
      ...picks.slice(5, 10).map(portQuestion),
      ...draw(CONCEPTS, 2, ctx.level)
    ];
    const score = await runQuiz(stage, ctx, questions, { label: 'Pytanie' });
    ctx.finish({ score, max: questions.length });
  }
};

export function examPool() {
  return [...CONCEPTS, ...PORTS.map(serviceQuestion)];
}
