import { mountConfigAudit, settingsToQuestions } from '../config-audit.js';

const ON_OFF = [
  { value: 'on', label: 'Włączone' },
  { value: 'off', label: 'Wyłączone' }
];

const SETTINGS = [
  {
    id: 'admin',
    section: 'System',
    label: 'Hasło do panelu routera',
    initial: 'default',
    options: [
      { value: 'default', label: 'Domyślne: admin / admin' },
      { value: 'custom', label: 'Własne, długie i unikalne' }
    ],
    best: 'custom',
    help: 'Domyślne hasła routerów są publicznie dostępne w instrukcjach. Każdy, kto podłączy się do Twojej sieci, może przejąć cały router.',
    issue: 'Panel routera chroni domyślne hasło admin / admin.'
  },
  {
    id: 'firmware',
    section: 'System',
    label: 'Oprogramowanie routera (firmware)',
    initial: 'old',
    options: [
      { value: 'old', label: 'Wersja 2.1.0, jest nowsza 2.4.1' },
      { value: 'new', label: 'Zaktualizowane do 2.4.1' }
    ],
    best: 'new',
    help: 'Aktualizacje łatają znane podatności. Routery są masowo skanowane i przejmowane do botnetów właśnie przez stare oprogramowanie. Jeśli router ma automatyczne aktualizacje, włącz je.',
    issue: 'Router działa na starym oprogramowaniu ze znanymi błędami.'
  },
  {
    id: 'remote',
    section: 'System',
    label: 'Zdalne zarządzanie z internetu',
    initial: 'on',
    options: ON_OFF,
    best: 'off',
    help: 'Gdy jest włączone, panel logowania routera widzi cały internet. Boty będą bez przerwy próbowały się zalogować. W domu prawie nikt tego nie potrzebuje.',
    issue: 'Panel routera jest dostępny z całego internetu.'
  },
  {
    id: 'encryption',
    section: 'Wi-Fi',
    label: 'Szyfrowanie sieci Wi-Fi',
    initial: 'wep',
    options: [
      { value: 'none', label: 'Brak' },
      { value: 'wep', label: 'WEP' },
      { value: 'wpa2', label: 'WPA2 (AES)' },
      { value: 'wpa3', label: 'WPA3' }
    ],
    best: 'wpa3',
    partial: 'wpa2',
    help: 'WEP łamie się w kilka minut. WPA2 z AES jest wciąż akceptowalne, gdy masz starsze urządzenia. WPA3 to obecny standard, odporny na zgadywanie hasła offline. Często jest też tryb mieszany WPA2/WPA3.',
    issue: 'Szyfrowanie Wi-Fi jest przestarzałe albo wyłączone.'
  },
  {
    id: 'wifiPass',
    section: 'Wi-Fi',
    label: 'Hasło do Wi-Fi',
    initial: 'weak',
    options: [
      { value: 'weak', label: '12345678' },
      { value: 'strong', label: 'Długa fraza, co najmniej 16 znaków' }
    ],
    best: 'strong',
    help: 'Kto przechwyci moment łączenia się urządzenia z siecią, może potem zgadywać hasło Wi-Fi u siebie, bez limitu prób. Krótkie hasło padnie szybko.',
    issue: 'Hasło Wi-Fi jest krótkie i popularne.'
  },
  {
    id: 'ssid',
    section: 'Wi-Fi',
    label: 'Nazwa sieci (SSID)',
    initial: 'personal',
    options: [
      { value: 'personal', label: 'Kowalski_Mieszkanie_12' },
      { value: 'neutral', label: 'Zielony-Dom' }
    ],
    best: 'neutral',
    help: 'Nazwę sieci widzi każdy w zasięgu. Nazwisko i numer mieszkania ułatwiają ataki ukierunkowane i zdradzają, kto mieszka w lokalu.',
    issue: 'Nazwa sieci zdradza nazwisko i numer mieszkania.'
  },
  {
    id: 'wps',
    section: 'Wi-Fi',
    label: 'WPS (łączenie przyciskiem lub kodem PIN)',
    initial: 'on',
    options: ON_OFF,
    best: 'off',
    help: 'Kod PIN w WPS ma słabą konstrukcję i w wielu routerach da się go odgadnąć w kilka godzin. Wygoda nie jest tego warta.',
    issue: 'WPS jest włączony.'
  },
  {
    id: 'guest',
    section: 'Sieć',
    label: 'Osobna sieć dla gości i urządzeń IoT',
    initial: 'off',
    options: ON_OFF,
    best: 'on',
    help: 'Inteligentne żarówki, kamery i telewizory rzadko dostają aktualizacje. W osobnej sieci przejęte urządzenie nie dostanie się do Twojego laptopa. Goście też nie muszą widzieć Twoich komputerów.',
    issue: 'Goście i urządzenia IoT są w tej samej sieci co Twoje komputery.'
  },
  {
    id: 'upnp',
    section: 'Sieć',
    label: 'UPnP (automatyczne otwieranie portów)',
    initial: 'on',
    options: ON_OFF,
    best: 'off',
    help: 'UPnP pozwala każdemu programowi w sieci samodzielnie otworzyć port w routerze, także złośliwemu. Jeśli konsola do gier tego wymaga, lepiej przekierować konkretne porty ręcznie.',
    issue: 'UPnP pozwala programom samodzielnie otwierać porty.'
  }
];

export default {
  id: 'router',
  title: 'Zabezpiecz domowy router',
  category: 'obrona',
  icon: 'wifi',
  minutes: 8,
  summary: 'Panel administracyjny routera z dziewięcioma ustawieniami. Popraw wszystkie słabe punkty, uruchom audyt i zamknij domową sieć przed intruzami.',
  lesson: [
    '<strong>Router</strong> to brama między Twoją siecią domową a internetem. Jeśli ktoś go przejmie, widzi i kontroluje cały ruch wszystkich domowników.',
    'Większość routerów po wyjęciu z pudełka ma ustawienia nastawione na wygodę, a nie bezpieczeństwo: domyślne hasła, włączone WPS i UPnP, czasem stare szyfrowanie.',
    'Do panelu routera wchodzi się zwykle przez przeglądarkę, pod adresem w stylu <code>192.168.1.1</code> albo <code>192.168.0.1</code> (często podanym na naklejce pod routerem).',
    'Zmień ustawienia, a potem kliknij „Uruchom audyt”. Możesz go powtarzać dowolnie wiele razy.'
  ],
  takeaways: [
    'Zmień domyślne hasło do panelu routera i wyłącz zdalne zarządzanie z internetu.',
    'Aktualizuj oprogramowanie routera, najlepiej automatycznie.',
    'Wi-Fi: WPA3 (albo WPA2 z AES), długie hasło, WPS wyłączony.',
    'Urządzenia IoT i gości trzymaj w osobnej sieci.',
    'Nazwa sieci nie powinna zdradzać, kim jesteś ani gdzie mieszkasz.'
  ],
  mount(stage, ctx) {
    mountConfigAudit(stage, ctx, {
      settings: SETTINGS,
      title: 'Router domowy, panel administracyjny',
      subtitle: 'http://192.168.1.1, model HX-200',
      iconName: 'wifi',
      okMessage: 'Router jest dobrze zabezpieczony. Pamiętaj, żeby co jakiś czas sprawdzać aktualizacje.'
    });
  }
};

export function examPool() {
  return settingsToQuestions(SETTINGS);
}
