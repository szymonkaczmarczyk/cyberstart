import { h } from '../ui.js';
import { mountConfigAudit, settingsToQuestions } from '../config-audit.js';

const YES_NO = [
  { value: 'yes', label: 'yes', mono: true },
  { value: 'no', label: 'no', mono: true }
];

const SETTINGS = [
  {
    id: 'PermitRootLogin',
    section: 'Kto może się logować',
    label: 'PermitRootLogin',
    mono: true,
    caption: 'Logowanie bezpośrednio na konto root',
    initial: 'yes',
    options: [
      { value: 'yes', label: 'yes', mono: true },
      { value: 'prohibit-password', label: 'prohibit-password', mono: true },
      { value: 'no', label: 'no', mono: true }
    ],
    best: 'no',
    partial: 'prohibit-password',
    help: 'yes: root loguje się hasłem i kluczem. prohibit-password: root tylko kluczem. no: root w ogóle nie loguje się zdalnie. Konto root istnieje na każdym Linuksie, więc boty znają połowę danych logowania. Loguj się na zwykłe konto i podnoś uprawnienia przez sudo, bo każde użycie sudo zostawia ślad w logach.',
    issue: 'Można logować się bezpośrednio na konto root.'
  },
  {
    id: 'AllowUsers',
    section: 'Kto może się logować',
    label: 'AllowUsers',
    mono: true,
    caption: 'Lista kont, które mogą używać SSH',
    initial: 'all',
    options: [
      { value: 'all', label: '(brak, wszyscy)' },
      { value: 'list', label: 'admin deploy', mono: true }
    ],
    best: 'list',
    help: 'Bez tej dyrektywy przez SSH może próbować wejść każde konto w systemie, także konta usług i stare konta pracowników. AllowUsers admin deploy wpuszcza tylko te dwa konta, a wszystkie inne są odrzucane, nawet z poprawnym kluczem.',
    issue: 'Każde konto w systemie może próbować logować się przez SSH.'
  },
  {
    id: 'PermitEmptyPasswords',
    section: 'Kto może się logować',
    label: 'PermitEmptyPasswords',
    mono: true,
    caption: 'Konta z pustym hasłem',
    initial: 'yes',
    options: YES_NO,
    best: 'no',
    help: 'yes pozwala zalogować się na konto, które nie ma hasła. Takie konto z dostępem przez SSH to otwarte drzwi. Domyślnie to ustawienie jest wyłączone i tak ma zostać.',
    issue: 'Konta z pustym hasłem mogą logować się zdalnie.'
  },
  {
    id: 'PubkeyAuthentication',
    section: 'Metody logowania',
    label: 'PubkeyAuthentication',
    mono: true,
    caption: 'Logowanie kluczem SSH',
    initial: 'yes',
    options: YES_NO,
    best: 'yes',
    help: 'Para kluczy: publiczny leży na serwerze w ~/.ssh/authorized_keys, prywatny tylko u Ciebie. Klucza nie da się zgadnąć jak hasła. To jedyna metoda logowania, która ma zostać włączona.',
    issue: 'Wyłączone logowanie kluczem. To najbezpieczniejsza metoda, powinna działać.'
  },
  {
    id: 'PasswordAuthentication',
    section: 'Metody logowania',
    label: 'PasswordAuthentication',
    mono: true,
    caption: 'Logowanie hasłem',
    initial: 'yes',
    options: YES_NO,
    best: 'no',
    help: 'Hasło da się zgadywać bez końca, co widać było w grze o logach. Zanim ustawisz no, upewnij się, że logowanie kluczem działa, i nie zamykaj bieżącej sesji, dopóki nie zalogujesz się w nowym oknie.',
    issue: 'Serwer przyjmuje logowanie hasłem, więc ataki zgadywania mają sens.'
  },
  {
    id: 'KbdInteractiveAuthentication',
    section: 'Metody logowania',
    label: 'KbdInteractiveAuthentication',
    mono: true,
    caption: 'Druga furtka do haseł (PAM)',
    initial: 'yes',
    options: YES_NO,
    best: 'no',
    help: 'Tryb keyboard-interactive przekazuje pytanie o hasło do systemu PAM. Przy yes serwer nadal może przyjąć hasło, nawet gdy PasswordAuthentication ma wartość no. Na starszych systemach ta dyrektywa nazywa się ChallengeResponseAuthentication.',
    issue: 'Hasło nadal przejdzie przez tryb keyboard-interactive (PAM).'
  },
  {
    id: 'AuthenticationMethods',
    section: 'Metody logowania',
    label: 'AuthenticationMethods',
    mono: true,
    caption: 'Jedyna dozwolona metoda logowania',
    initial: 'any',
    options: [
      { value: 'any', label: '(brak, dowolna)' },
      { value: 'publickey', label: 'publickey', mono: true }
    ],
    best: 'publickey',
    help: 'Bez tej dyrektywy serwer akceptuje każdą włączoną metodę. AuthenticationMethods publickey mówi wprost: tylko klucz. Działa jak pas bezpieczeństwa, gdy inna dyrektywa zostanie włączona przez pomyłkę, np. w pliku dodanym przez obraz chmurowy.',
    issue: 'Serwer akceptuje każdą włączoną metodę logowania, nie tylko klucz.'
  },
  {
    id: 'MaxAuthTries',
    section: 'Ograniczenia połączeń',
    label: 'MaxAuthTries',
    mono: true,
    caption: 'Ile prób logowania w jednym połączeniu',
    initial: '6',
    options: [
      { value: '6', label: '6', mono: true },
      { value: '3', label: '3', mono: true }
    ],
    best: '3',
    help: 'Po tylu nieudanych próbach serwer zrywa połączenie. Mniej prób spowalnia zgadywanie i szybciej uruchamia blokadę w fail2ban. Uwaga: każdy klucz w Twoim agencie SSH liczy się jako próba, więc przy wielu kluczach wskaż właściwy przez IdentityFile.',
    issue: 'Dużo prób logowania w jednym połączeniu.'
  },
  {
    id: 'LoginGraceTime',
    section: 'Ograniczenia połączeń',
    label: 'LoginGraceTime',
    mono: true,
    caption: 'Czas na zalogowanie się (w sekundach)',
    initial: '120',
    options: [
      { value: '120', label: '120', mono: true },
      { value: '30', label: '30', mono: true }
    ],
    best: '30',
    help: 'Tyle czasu ma klient od nawiązania połączenia do zalogowania. Przy 120 sekundach boty długo trzymają otwarte, niezalogowane połączenia i blokują miejsce dla innych. Logowanie kluczem trwa ułamek sekundy, więc 30 w zupełności wystarcza.',
    issue: 'Niezalogowane połączenia mogą wisieć przez 2 minuty.'
  },
  {
    id: 'MaxStartups',
    section: 'Ograniczenia połączeń',
    label: 'MaxStartups',
    mono: true,
    caption: 'Limit jednoczesnych niezalogowanych połączeń',
    initial: '100',
    options: [
      { value: '100', label: '100', mono: true },
      { value: '10:30:60', label: '10:30:60', mono: true }
    ],
    best: '10:30:60',
    help: 'Zapis 10:30:60 znaczy: od 10 niezalogowanych połączeń serwer losowo odrzuca 30% nowych, a od 60 odrzuca wszystkie. Chroni to przed zalaniem serwera połączeniami. OpenSSH od wersji 9.8 dodatkowo sam karze adresy, które często zrywają połączenia (PerSourcePenalties).',
    issue: 'Serwer przyjmie aż 100 niezalogowanych połączeń naraz.'
  },
  {
    id: 'ClientAliveInterval',
    section: 'Ograniczenia połączeń',
    label: 'ClientAliveInterval',
    mono: true,
    caption: 'Rozłączanie porzuconych sesji (w sekundach)',
    initial: '0',
    options: [
      { value: '0', label: '0 (nigdy)', mono: true },
      { value: '300', label: '300', mono: true }
    ],
    best: '300',
    help: 'Co 300 sekund serwer sprawdza, czy klient żyje. Razem z ClientAliveCountMax 2 zamyka martwe połączenie po około 10 minutach. Otwarta, zapomniana sesja administratora na niezablokowanym komputerze to łatwy łup.',
    issue: 'Porzucone sesje nigdy się nie zamykają.'
  },
  {
    id: 'X11Forwarding',
    section: 'Zbędne funkcje',
    label: 'X11Forwarding',
    mono: true,
    caption: 'Przekazywanie okien graficznych',
    initial: 'yes',
    options: YES_NO,
    best: 'no',
    help: 'Pozwala uruchomić program graficzny na serwerze i oglądać jego okno u siebie. Serwer bez środowiska graficznego tego nie potrzebuje, a każda zbędna funkcja to dodatkowa powierzchnia ataku.',
    issue: 'Włączona zbędna funkcja przekazywania okien X11.'
  },
  {
    id: 'AllowTcpForwarding',
    section: 'Zbędne funkcje',
    label: 'AllowTcpForwarding',
    mono: true,
    caption: 'Przekierowanie portów przez serwer',
    initial: 'yes',
    options: YES_NO,
    best: 'no',
    help: 'Przekierowanie portów robi z serwera tunel do sieci wewnętrznej. Ktoś, kto przejmie konto, dostanie się przez nie do baz danych i paneli, których nie widać z internetu. Jeśli konkretne konto tego potrzebuje, włącz to tylko dla niego w bloku Match User.',
    issue: 'Serwer może posłużyć jako tunel do sieci wewnętrznej.'
  },
  {
    id: 'AllowAgentForwarding',
    section: 'Zbędne funkcje',
    label: 'AllowAgentForwarding',
    mono: true,
    caption: 'Przekazywanie agenta z kluczami',
    initial: 'yes',
    options: YES_NO,
    best: 'no',
    help: 'Przekazanie agenta udostępnia serwerowi Twoje klucze na czas sesji. Root na przejętym serwerze może ich użyć, żeby logować się dalej w Twoim imieniu. Do przeskakiwania między serwerami używaj ProxyJump (ssh -J), który nie wystawia kluczy.',
    issue: 'Przejęty serwer może użyć kluczy z agenta administratora.'
  },
  {
    id: 'PermitTunnel',
    section: 'Zbędne funkcje',
    label: 'PermitTunnel',
    mono: true,
    caption: 'Tunele sieciowe tun i tap',
    initial: 'yes',
    options: YES_NO,
    best: 'no',
    help: 'Tunel tun lub tap to pełny VPN zbudowany na SSH. Serwer WWW tego nie potrzebuje, a włączona opcja ułatwia omijanie firewalla.',
    issue: 'Przez SSH da się zestawić pełny tunel VPN.'
  },
  {
    id: 'KexAlgorithms',
    section: 'Kryptografia',
    label: 'KexAlgorithms',
    mono: true,
    caption: 'Uzgadnianie klucza sesji',
    initial: 'legacy',
    options: [
      { value: 'legacy', label: 'stare (z SHA-1)' },
      { value: 'modern', label: 'ML-KEM i Curve25519' }
    ],
    best: 'modern',
    help: 'Tym algorytmem obie strony uzgadniają wspólny klucz sesji. Warianty z SHA-1 są przestarzałe. mlkem768x25519-sha256 to hybryda odporna na przyszłe komputery kwantowe (domyślna od OpenSSH 10), a curve25519-sha256 zostaje dla starszych klientów.',
    issue: 'Serwer akceptuje przestarzałe algorytmy uzgadniania klucza z SHA-1.'
  },
  {
    id: 'Ciphers',
    section: 'Kryptografia',
    label: 'Ciphers',
    mono: true,
    caption: 'Szyfrowanie danych w sesji',
    initial: 'legacy',
    options: [
      { value: 'legacy', label: 'stare (CBC, 3DES)' },
      { value: 'modern', label: 'ChaCha20, AES-GCM' }
    ],
    best: 'modern',
    help: 'Szyfr chroni wszystko, co płynie w sesji. Tryb CBC i 3DES mają znane słabości. chacha20-poly1305 i aes-gcm szyfrują dane i jednocześnie pilnują, żeby nikt ich nie zmienił po drodze.',
    issue: 'Włączone stare szyfry CBC i 3DES.'
  },
  {
    id: 'MACs',
    section: 'Kryptografia',
    label: 'MACs',
    mono: true,
    caption: 'Kontrola integralności pakietów',
    initial: 'legacy',
    options: [
      { value: 'legacy', label: 'stare (MD5, SHA-1)' },
      { value: 'modern', label: 'SHA-2 etm' }
    ],
    best: 'modern',
    help: 'MAC to podpis każdego pakietu, który wykrywa zmiany w danych. MD5 i SHA-1 są przestarzałe. Warianty z dopiskiem etm (encrypt-then-MAC) najpierw szyfrują, a potem podpisują, co jest bezpieczniejszą kolejnością.',
    issue: 'Włączone przestarzałe podpisy pakietów MD5 i SHA-1.'
  },
  {
    id: 'HostKey',
    section: 'Kryptografia',
    label: 'HostKey',
    mono: true,
    caption: 'Klucze, którymi serwer potwierdza tożsamość',
    initial: 'all',
    options: [
      { value: 'all', label: 'RSA, ECDSA, ed25519' },
      { value: 'ed25519', label: 'ed25519', mono: true }
    ],
    best: 'ed25519',
    help: 'Klucz hosta to dowód tożsamości serwera. Klient zapamiętuje go przy pierwszym połączeniu i ostrzega, gdy się zmieni, bo to może być atak man in the middle. Zostaw ed25519, a stare klucze usuń. Jeśli musisz obsłużyć bardzo stare klienty, dodaj tylko RSA o długości co najmniej 3072 bitów.',
    issue: 'Serwer wystawia także starsze klucze hosta RSA i ECDSA.'
  },
  {
    id: 'LogLevel',
    section: 'Logi',
    label: 'LogLevel',
    mono: true,
    caption: 'Szczegółowość logów SSH',
    initial: 'INFO',
    options: [
      { value: 'INFO', label: 'INFO', mono: true },
      { value: 'VERBOSE', label: 'VERBOSE', mono: true }
    ],
    best: 'VERBOSE',
    help: 'VERBOSE zapisuje w logu odcisk klucza użytego przy każdym logowaniu. Po włamaniu od razu wiesz, który klucz zadziałał i komu go odebrać. To dokładnie te ślady, których szukasz w grze o śledztwie na serwerze.',
    issue: 'Logi nie pokazują, który klucz został użyty do logowania.'
  },
  {
    id: 'adminKey',
    section: 'Poza plikiem sshd_config',
    label: 'Klucz administratora',
    caption: 'Rodzaj klucza na Twoim komputerze',
    initial: 'rsa',
    options: [
      { value: 'rsa', label: 'RSA 2048 bez hasła' },
      { value: 'ed25519', label: 'ed25519 z hasłem' },
      { value: 'sk', label: 'ed25519-sk (klucz sprzętowy)' }
    ],
    best: 'sk',
    partial: 'ed25519',
    help: 'Klucz bez hasła to plik, który wystarczy skopiować z laptopa. ed25519 z hasłem jest dobry, ale nadal to plik na dysku. Klucz ed25519-sk mieszka na sprzętowym kluczu bezpieczeństwa FIDO2: nie da się go skopiować, a każde logowanie wymaga dotknięcia klucza. To prawdziwe dwuskładnikowe logowanie do SSH. Tworzysz go poleceniem ssh-keygen -t ed25519-sk.',
    issue: 'Klucz administratora da się skopiować i użyć bez jego wiedzy.'
  },
  {
    id: 'fail2ban',
    section: 'Poza plikiem sshd_config',
    label: 'fail2ban',
    caption: 'Automatyczne blokowanie adresów po nieudanych próbach',
    initial: 'off',
    options: [
      { value: 'off', label: 'Niezainstalowany' },
      { value: 'on', label: 'Włączony' }
    ],
    best: 'on',
    help: 'fail2ban czyta logi i po kilku nieudanych logowaniach blokuje adres na firewallu na określony czas. Boty przestają zaśmiecać logi, a powtarzające się ataki trafiają na coraz dłuższe blokady.',
    issue: 'Brak automatycznego blokowania adresów, które zgadują hasła.'
  },
  {
    id: 'updates',
    section: 'Poza plikiem sshd_config',
    label: 'Aktualizacje bezpieczeństwa',
    caption: 'Łatki dla OpenSSH i systemu',
    initial: 'manual',
    options: [
      { value: 'manual', label: 'Ręcznie, od czasu do czasu' },
      { value: 'auto', label: 'unattended-upgrades', mono: true }
    ],
    best: 'auto',
    help: 'Najlepsza konfiguracja nie pomoże, gdy sam program ma lukę. W 2024 roku błąd regreSSHion (CVE-2024-6387) pozwalał przejąć serwer z OpenSSH bez logowania. Pakiet unattended-upgrades codziennie sam instaluje łatki bezpieczeństwa.',
    issue: 'Łatki bezpieczeństwa instalowane są ręcznie i z opóźnieniem.'
  },
  {
    id: 'firewall',
    section: 'Poza plikiem sshd_config',
    label: 'Dostęp do portu 22',
    caption: 'Kto w ogóle może połączyć się z SSH',
    initial: 'all',
    options: [
      { value: 'all', label: 'Cały internet' },
      { value: 'vpn', label: 'Tylko VPN lub biuro' }
    ],
    best: 'vpn',
    help: 'Usługa, której nie widać z internetu, nie dostaje ataków z internetu. Firewall przepuszcza ruch na port 22 tylko z adresów VPN lub biura. To najskuteczniejszy krok ze wszystkich.',
    issue: 'Port SSH jest otwarty dla całego internetu.'
  }
];

const CRYPTO = {
  KexAlgorithms: {
    legacy: 'KexAlgorithms +diffie-hellman-group14-sha1,diffie-hellman-group-exchange-sha1',
    modern: 'KexAlgorithms mlkem768x25519-sha256,sntrup761x25519-sha512@openssh.com,curve25519-sha256'
  },
  Ciphers: {
    legacy: 'Ciphers +aes128-cbc,aes256-cbc,3des-cbc',
    modern: 'Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com'
  },
  MACs: {
    legacy: 'MACs +hmac-md5,hmac-sha1',
    modern: 'MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com'
  }
};

const HOST_KEYS = {
  all: ['/etc/ssh/ssh_host_rsa_key', '/etc/ssh/ssh_host_ecdsa_key', '/etc/ssh/ssh_host_ed25519_key'],
  ed25519: ['/etc/ssh/ssh_host_ed25519_key']
};

function preview(values) {
  const lines = [
    `PermitRootLogin ${values.PermitRootLogin}`,
    values.AllowUsers === 'list' ? 'AllowUsers admin deploy' : null,
    `PermitEmptyPasswords ${values.PermitEmptyPasswords}`,
    `PubkeyAuthentication ${values.PubkeyAuthentication}`,
    `PasswordAuthentication ${values.PasswordAuthentication}`,
    `KbdInteractiveAuthentication ${values.KbdInteractiveAuthentication}`,
    values.AuthenticationMethods === 'publickey' ? 'AuthenticationMethods publickey' : null,
    `MaxAuthTries ${values.MaxAuthTries}`,
    `LoginGraceTime ${values.LoginGraceTime}`,
    `MaxStartups ${values.MaxStartups}`,
    `ClientAliveInterval ${values.ClientAliveInterval}`,
    'ClientAliveCountMax 2',
    `X11Forwarding ${values.X11Forwarding}`,
    `AllowTcpForwarding ${values.AllowTcpForwarding}`,
    `AllowAgentForwarding ${values.AllowAgentForwarding}`,
    `PermitTunnel ${values.PermitTunnel}`,
    CRYPTO.KexAlgorithms[values.KexAlgorithms],
    CRYPTO.Ciphers[values.Ciphers],
    CRYPTO.MACs[values.MACs],
    ...HOST_KEYS[values.HostKey].map((path) => `HostKey ${path}`),
    `LogLevel ${values.LogLevel}`
  ].filter(Boolean);
  return h(
    'div',
    { class: 'stage' },
    h('p', { class: 't-small t-muted' }, 'Twoja konfiguracja w pliku ', h('code', { text: '/etc/ssh/sshd_config.d/00-utwardzenie.conf' }), ':'),
    h('pre', { class: 'code-block', translate: 'no', tabindex: '0' }, h('code', { text: lines.join('\n') })),
    h('p', { class: 't-small t-muted', text: 'Przed przeładowaniem sprawdź składnię, a potem obejrzyj ustawienia, które serwer naprawdę stosuje. Nie zamykaj bieżącej sesji, dopóki nie zalogujesz się w nowym oknie:' }),
    h('pre', { class: 'code-block', translate: 'no', tabindex: '0' }, h('code', { text: 'sudo sshd -t && sudo sshd -T | grep -iE "password|kbd|permitroot|authenticationmethods"\nsudo systemctl reload ssh' }))
  );
}

export default {
  id: 'ssh',
  title: 'Utwardzanie SSH',
  category: 'linux',
  icon: 'server',
  minutes: 15,
  summary: 'Utwardzasz serwer SSH wystawiony do internetu: tylko klucze, bez roota, nowoczesna kryptografia, limity połączeń, fail2ban i aktualizacje. Na żywo widzisz plik konfiguracji, a audyt przepuszcza dalej dopiero przy komplecie bezpiecznych ustawień.',
  lesson: [
    '<strong>SSH</strong> (Secure Shell) to szyfrowane zdalne logowanie do serwera. Każdy serwer z Linuksem w chmurze ma je włączone, a boty próbują się do niego dostać przez całą dobę.',
    'Konfiguracja serwera SSH siedzi w pliku <code>/etc/ssh/sshd_config</code> i w katalogu <code>/etc/ssh/sshd_config.d/</code>. Każda linia to dyrektywa i jej wartość, np. <code>PasswordAuthentication no</code>.',
    'Ważna pułapka: dla każdej dyrektywy liczy się <strong>pierwsza</strong> wartość, jaką serwer przeczyta, a pliki z katalogu <code>sshd_config.d</code> czyta alfabetycznie. Obrazy chmurowe często dokładają tam plik <code>50-cloud-init.conf</code> z <code>PasswordAuthentication yes</code>. Dlatego swój plik nazwij <code>00-utwardzenie.conf</code>, a wynik sprawdź poleceniem <code>sudo sshd -T</code>, które pokazuje ustawienia naprawdę stosowane przez serwer.',
    '<strong>Utwardzanie</strong> (hardening) to wyłączanie wszystkiego, co zbędne, i zawężanie tego, co potrzebne. Kolejność ma znaczenie: najpierw sprawdź logowanie kluczem, dopiero potem wyłącz hasła, żeby nie zamknąć się na zewnątrz.',
    'Przy każdym ustawieniu rozwiń „Dlaczego to ważne?”, żeby zobaczyć, co oznaczają poszczególne wartości. Audyt zalicza grę tylko wtedy, gdy wszystkie ustawienia są bezpieczne.'
  ],
  takeaways: [
    'Tylko klucze: <code>PasswordAuthentication no</code>, <code>KbdInteractiveAuthentication no</code> i <code>AuthenticationMethods publickey</code>, bez bezpośredniego logowania na root.',
    'Najmocniejszy klucz administratora to <code>ed25519-sk</code> na sprzętowym kluczu FIDO2, którego nie da się skopiować.',
    '<code>AllowUsers</code>, <code>MaxAuthTries</code>, <code>LoginGraceTime</code> i <code>MaxStartups</code> zawężają, kto i jak długo może próbować.',
    'Zbędne funkcje wyłączone: X11, przekierowanie portów, agenta i tunele. Kryptografia tylko nowoczesna, klucz hosta ed25519, <code>LogLevel VERBOSE</code>.',
    'Własny plik w <code>sshd_config.d</code> nazwij <code>00-...</code>, bo wygrywa pierwsza wartość. Sprawdź wynik przez <code>sudo sshd -t</code> i <code>sudo sshd -T</code>, z drugą sesją otwartą na wszelki wypadek.',
    'fail2ban, automatyczne aktualizacje i port 22 widoczny tylko z VPN chronią to, czego sam plik konfiguracji nie obejmie. Zmiana portu na inny tylko zmniejsza szum w logach.'
  ],
  mount(stage, ctx) {
    mountConfigAudit(stage, ctx, {
      settings: SETTINGS,
      title: 'Serwer web01, konfiguracja SSH',
      subtitle: 'ssh admin@web01.przyklad.pl, Debian 13, OpenSSH 10',
      iconName: 'server',
      okMessage: 'Serwer SSH jest utwardzony w komplecie. Port widać tylko z VPN, wejść można wyłącznie sprzętowym kluczem, a łatki instalują się same.',
      preview,
      passRatio: 1
    });
  }
};

export const AUDIT_SETTINGS = SETTINGS;

export function examPool() {
  return settingsToQuestions(SETTINGS);
}
