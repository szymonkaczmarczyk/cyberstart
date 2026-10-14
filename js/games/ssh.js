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
    help: 'Konto root istnieje na każdym Linuksie, więc boty znają połowę danych logowania. Loguj się na zwykłe konto i podnoś uprawnienia przez sudo. Każde użycie sudo zostawia ślad w logach.',
    issue: 'Można logować się bezpośrednio na konto root.'
  },
  {
    id: 'PasswordAuthentication',
    section: 'Kto może się logować',
    label: 'PasswordAuthentication',
    mono: true,
    caption: 'Logowanie hasłem',
    initial: 'yes',
    options: YES_NO,
    best: 'no',
    help: 'Hasło da się zgadywać bez końca, co widać było w grze o logach. Klucza SSH nie da się zgadnąć. Zanim to wyłączysz, upewnij się, że logowanie kluczem działa.',
    issue: 'Serwer przyjmuje logowanie hasłem, więc ataki zgadywania mają sens.'
  },
  {
    id: 'PubkeyAuthentication',
    section: 'Kto może się logować',
    label: 'PubkeyAuthentication',
    mono: true,
    caption: 'Logowanie kluczem SSH',
    initial: 'yes',
    options: YES_NO,
    best: 'yes',
    help: 'Para kluczy: publiczny leży na serwerze w ~/.ssh/authorized_keys, prywatny tylko na Twoim komputerze. Klucz typu ed25519 generujesz poleceniem ssh-keygen -t ed25519 i chronisz hasłem.',
    issue: 'Wyłączone logowanie kluczem. To najbezpieczniejsza metoda, powinna działać.'
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
    help: 'Konto bez hasła z dostępem przez SSH to otwarte drzwi. Domyślnie to ustawienie jest wyłączone i tak ma zostać.',
    issue: 'Konta z pustym hasłem mogą logować się zdalnie.'
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
    help: 'Na serwerze bywają konta usług i stare konta pracowników. Lista dozwolonych kont sprawia, że tylko wskazane osoby mogą łączyć się zdalnie.',
    issue: 'Każde konto w systemie może próbować logować się przez SSH.'
  },
  {
    id: 'MaxAuthTries',
    section: 'Ograniczenia',
    label: 'MaxAuthTries',
    mono: true,
    caption: 'Ile prób logowania w jednym połączeniu',
    initial: '6',
    options: [
      { value: '6', label: '6', mono: true },
      { value: '3', label: '3', mono: true }
    ],
    best: '3',
    help: 'Mniej prób na połączenie spowalnia zgadywanie i szybciej uruchamia blokady w fail2ban.',
    issue: 'Dużo prób logowania w jednym połączeniu.'
  },
  {
    id: 'ClientAliveInterval',
    section: 'Ograniczenia',
    label: 'ClientAliveInterval',
    mono: true,
    caption: 'Rozłączanie porzuconych sesji (w sekundach)',
    initial: '0',
    options: [
      { value: '0', label: '0 (nigdy)', mono: true },
      { value: '300', label: '300', mono: true }
    ],
    best: '300',
    help: 'Otwarta, zapomniana sesja administratora na niezablokowanym komputerze to łatwy łup. Serwer sprawdza, czy klient żyje, i zamyka martwe połączenia.',
    issue: 'Porzucone sesje nigdy się nie zamykają.'
  },
  {
    id: 'X11Forwarding',
    section: 'Ograniczenia',
    label: 'X11Forwarding',
    mono: true,
    caption: 'Przekazywanie okien graficznych',
    initial: 'yes',
    options: YES_NO,
    best: 'no',
    help: 'Serwer bez środowiska graficznego tego nie potrzebuje. Każda zbędna funkcja to dodatkowa powierzchnia ataku.',
    issue: 'Włączona zbędna funkcja przekazywania okien X11.'
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
    help: 'fail2ban czyta logi i po kilku nieudanych logowaniach blokuje adres na firewallu na określony czas.',
    issue: 'Brak automatycznego blokowania adresów, które zgadują hasła.'
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
    help: 'Usługa, której nie widać z internetu, nie dostaje ataków z internetu. To najskuteczniejszy krok ze wszystkich.',
    issue: 'Port SSH jest otwarty dla całego internetu.'
  }
];

function preview(values) {
  const lines = [
    `PermitRootLogin ${values.PermitRootLogin}`,
    `PasswordAuthentication ${values.PasswordAuthentication}`,
    `PubkeyAuthentication ${values.PubkeyAuthentication}`,
    `PermitEmptyPasswords ${values.PermitEmptyPasswords}`,
    values.AllowUsers === 'list' ? 'AllowUsers admin deploy' : null,
    `MaxAuthTries ${values.MaxAuthTries}`,
    `ClientAliveInterval ${values.ClientAliveInterval}`,
    'ClientAliveCountMax 2',
    `X11Forwarding ${values.X11Forwarding}`
  ].filter(Boolean);
  return h(
    'div',
    { class: 'stage' },
    h('p', { class: 't-small t-muted' }, 'Twoja konfiguracja w pliku ', h('code', { text: '/etc/ssh/sshd_config.d/99-utwardzenie.conf' }), ':'),
    h('pre', { class: 'code-block', translate: 'no', tabindex: '0' }, h('code', { text: lines.join('\n') })),
    h('p', { class: 't-small t-muted', text: 'Przed przeładowaniem zawsze sprawdź składnię i nie zamykaj bieżącej sesji, dopóki nie zalogujesz się w nowym oknie:' }),
    h('pre', { class: 'code-block', translate: 'no', tabindex: '0' }, h('code', { text: 'sudo sshd -t && sudo systemctl reload ssh' }))
  );
}

export default {
  id: 'ssh',
  title: 'Utwardzanie SSH',
  category: 'linux',
  icon: 'server',
  minutes: 10,
  summary: 'Konfigurujesz serwer SSH wystawiony do internetu: wyłączasz logowanie roota i hasłem, ograniczasz dostęp i dodajesz fail2ban. Na żywo widzisz plik sshd_config.',
  lesson: [
    '<strong>SSH</strong> (Secure Shell) to szyfrowane zdalne logowanie do serwera. Każdy serwer z Linuksem w chmurze ma je włączone, a boty próbują się do niego dostać przez całą dobę.',
    'Konfiguracja serwera SSH siedzi w pliku <code>/etc/ssh/sshd_config</code> (oraz w katalogu <code>sshd_config.d</code>). Każda linia to dyrektywa i jej wartość, np. <code>PasswordAuthentication no</code>.',
    '<strong>Utwardzanie</strong> (hardening) to wyłączanie wszystkiego, co zbędne, i zawężanie tego, co potrzebne. Kolejność ma znaczenie: najpierw sprawdź logowanie kluczem, dopiero potem wyłącz hasła, żeby nie zamknąć się na zewnątrz.',
    'Ustaw wartości, obserwuj podgląd pliku i uruchom audyt.'
  ],
  takeaways: [
    'Logowanie kluczem (ed25519) zamiast hasła, bez bezpośredniego logowania na root.',
    'AllowUsers ogranicza SSH do wybranych kont, MaxAuthTries spowalnia zgadywanie.',
    'fail2ban blokuje natrętne adresy, a firewall lub VPN ukrywa port 22 przed internetem.',
    'Przed przeładowaniem: <code>sudo sshd -t</code> i druga, otwarta sesja na wszelki wypadek.',
    'Zmiana portu z 22 na inny zmniejsza szum w logach, ale nie zastępuje powyższych kroków.'
  ],
  mount(stage, ctx) {
    mountConfigAudit(stage, ctx, {
      settings: SETTINGS,
      title: 'Serwer web01, konfiguracja SSH',
      subtitle: 'ssh admin@web01.przyklad.pl, Debian 12',
      iconName: 'server',
      okMessage: 'Serwer SSH jest dobrze utwardzony. Boty mogą pukać, ale bez klucza nie wejdą, a po kilku próbach wylądują na liście zablokowanych.',
      preview
    });
  }
};

export function examPool() {
  return settingsToQuestions(SETTINGS);
}
