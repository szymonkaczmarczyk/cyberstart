import { h } from '../ui.js';
import { icon } from '../icons.js';
import { mountConfigAudit, settingsToQuestions } from '../config-audit.js';

const REPORT = [
  '$ nmap -sV web01.przyklad.pl',
  'Nmap scan report for web01.przyklad.pl (203.0.113.20)',
  'Host is up (0.012s latency).',
  'Not shown: 992 closed tcp ports (reset)',
  'PORT     STATE    SERVICE  VERSION',
  '21/tcp   open     ftp      vsftpd 3.0.3',
  '22/tcp   open     ssh      OpenSSH 9.2p1 Debian',
  '25/tcp   filtered smtp',
  '80/tcp   open     http     nginx 1.24.0',
  '443/tcp  open     https    nginx 1.24.0',
  '3306/tcp open     mysql    MySQL 8.0.36',
  '6379/tcp open     redis    Redis key-value store 7.0.15',
  '8080/tcp open     http     Jetty (Jenkins 2.440)',
  'Nmap done: 1 IP address (1 host up) scanned in 14.21 seconds'
].join('\n');

const ACTIONS = [
  { value: 'keep', label: 'Zostaw publiczny' },
  { value: 'limit', label: 'Ogranicz do VPN' },
  { value: 'close', label: 'Zamknij' }
];

const SETTINGS = [
  {
    id: 'p21', section: 'Otwarte porty', label: '21/tcp ftp', mono: true, caption: 'vsftpd 3.0.3, wgrywanie plików na stronę', initial: 'keep', options: ACTIONS, best: 'close',
    help: 'FTP przesyła login i hasło jawnym tekstem. Pliki wgrywa się przez SFTP, który działa po SSH, więc FTP można całkiem wyłączyć.',
    issue: 'FTP nadal działa i wysyła hasła bez szyfrowania. Zastąp go SFTP.'
  },
  {
    id: 'p22', section: 'Otwarte porty', label: '22/tcp ssh', mono: true, caption: 'OpenSSH 9.2p1, administracja serwerem', initial: 'keep', options: ACTIONS, best: 'limit',
    help: 'SSH jest potrzebne administratorom, ale nie całemu internetowi. Dostęp przez VPN albo z adresów biura ucina ataki zgadywania haseł.',
    issue: 'SSH jest dostępne z całego internetu.'
  },
  {
    id: 'p80', section: 'Otwarte porty', label: '80/tcp http', mono: true, caption: 'nginx, strona sklepu', initial: 'keep', options: ACTIONS, best: 'keep',
    help: 'Port 80 zostaje otwarty, żeby osoby wpisujące adres bez https trafiły na stronę. Serwer powinien od razu przekierować je na HTTPS.',
    issue: 'Port 80 jest potrzebny do przekierowania na HTTPS.'
  },
  {
    id: 'p443', section: 'Otwarte porty', label: '443/tcp https', mono: true, caption: 'nginx, strona sklepu', initial: 'keep', options: ACTIONS, best: 'keep',
    help: 'To właściwa strona sklepu. Ma być dostępna dla wszystkich klientów.',
    issue: 'Port 443 to sklep. Klienci muszą mieć do niego dostęp.'
  },
  {
    id: 'p3306', section: 'Otwarte porty', label: '3306/tcp mysql', mono: true, caption: 'Baza danych sklepu, aplikacja działa na tym samym serwerze', initial: 'keep', options: ACTIONS, best: 'close', partial: 'limit',
    help: 'Skoro aplikacja działa na tym samym serwerze, baza może słuchać tylko na 127.0.0.1 (bind-address). Z zewnątrz nie powinno jej być widać wcale.',
    issue: 'Baza danych jest widoczna z zewnątrz serwera.'
  },
  {
    id: 'p6379', section: 'Otwarte porty', label: '6379/tcp redis', mono: true, caption: 'Pamięć podręczna aplikacji', initial: 'keep', options: ACTIONS, best: 'close', partial: 'limit',
    help: 'Redis wystawiony do internetu, często bez hasła, był masowo przejmowany. Ma słuchać tylko lokalnie.',
    issue: 'Redis jest dostępny z zewnątrz serwera.'
  },
  {
    id: 'p8080', section: 'Otwarte porty', label: '8080/tcp http', mono: true, caption: 'Jenkins, automatyczne wdrażanie strony', initial: 'keep', options: ACTIONS, best: 'limit', partial: 'close',
    help: 'Panel Jenkinsa daje kontrolę nad wdrożeniami, a więc nad całym serwerem. Zespół go potrzebuje, ale tylko przez VPN. Do tego wersja jest stara i wymaga aktualizacji.',
    issue: 'Panel Jenkinsa jest dostępny z internetu.'
  }
];

export default {
  id: 'skan',
  title: 'Raport skanu własnego serwera',
  category: 'sieci',
  icon: 'search',
  minutes: 10,
  summary: 'Skan Twojego serwera sklepu jest gotowy. Czytasz raport w stylu Nmap i dla każdego otwartego portu decydujesz: zostawić, ograniczyć do VPN czy zamknąć.',
  lesson: [
    'Skanowanie własnych serwerów to podstawowe zadanie administratora: sprawdzasz, co widzi świat, zanim sprawdzi to ktoś inny. Skanuj tylko systemy, które są Twoje albo do których masz pisemną zgodę.',
    'W raporcie każdy wiersz to port: numer i protokół, stan (<code>open</code> otwarty, <code>closed</code> zamknięty, <code>filtered</code> zablokowany przez firewall), rozpoznana usługa i jej wersja.',
    'Wersja usługi jest ważna: stare wersje mają znane podatności (numery CVE). Raport to lista zadań: każda usługa musi mieć uzasadnienie, właściwy zakres dostępu i aktualizacje.',
    'Przy każdym porcie wybierz działanie i uruchom audyt.'
  ],
  takeaways: [
    'Publicznie zostają tylko usługi dla klientów: tu 80 (przekierowanie) i 443.',
    'Panele administracyjne i SSH tylko przez VPN lub z wybranych adresów.',
    'Bazy danych i cache (MySQL, Redis) słuchają lokalnie albo w sieci wewnętrznej, nigdy w internecie.',
    'Usługi bez szyfrowania (FTP, Telnet) zastępujesz bezpiecznymi odpowiednikami (SFTP, SSH).',
    'Wersje z raportu porównuj z bazą podatności i aktualizuj. Skanuj regularnie, bo konfiguracja lubi się zmieniać.'
  ],
  mount(stage, ctx) {
    stage.append(
      h(
        'section',
        { class: 'panel' },
        h('div', { class: 'panel-title' }, icon('search'), h('h2', { class: 't-h4', text: 'Raport skanu' })),
        h('pre', { class: 'code-block', translate: 'no', tabindex: '0' }, h('code', { text: REPORT })),
        h('p', { class: 'hint', text: 'Port 25 jest „filtered”, czyli firewall już go blokuje. Zajmij się portami „open”.' })
      )
    );
    mountConfigAudit(stage, ctx, {
      settings: SETTINGS,
      title: 'Plan działań dla web01',
      subtitle: '203.0.113.20, sklep internetowy',
      iconName: 'server',
      okMessage: 'Świetnie. Z internetu widać już tylko stronę sklepu, a wszystko inne jest ukryte za VPN albo wyłączone.'
    });
  }
};

export function examPool() {
  return settingsToQuestions(SETTINGS);
}
