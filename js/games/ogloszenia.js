import { playScenario, scenarioQuestion } from '../scenario.js';

const SERVICE_CHAT = 'Czat w serwisie Targowisko';

const SITUATIONS = [
  {
    icon: 'link',
    phase: 'Sprzedajesz',
    title: 'Link do odbioru pieniędzy',
    story: 'Wystawiasz kurtkę za 120 zł w serwisie Targowisko. Po kilku minutach kupujący pisze, że opłacił zakup z dostawą Kurier Szybko, i przysyła link, pod którym masz „odebrać pieniądze”, wpisując dane karty.',
    contact: 'Marek_88',
    channel: SERVICE_CHAT,
    chat: [
      { text: 'Dzień dobry, kurtka jeszcze aktualna?' },
      { me: true, text: 'Tak, aktualna.' },
      { text: 'Super, już opłaciłem z dostawą Kurier Szybko. Żeby odebrać pieniądze, wejdź tu i wpisz dane karty: targowisko-wyplaty.online/odbior' }
    ],
    options: [
      { label: 'Nie klikam. Sprawdzam w aplikacji Targowiska, czy jest zamówienie, i zgłaszam konto kupującego', points: 2, best: true, why: 'Żeby dostać pieniądze, nigdy nie podajesz danych karty. Prawdziwe zamówienie i wypłata są widoczne tylko w aplikacji serwisu, a domena targowisko-wyplaty.online do niego nie należy.' },
      { label: 'Klikam, ale wpisuję tylko numer karty, bez kodu z tyłu', points: 0, why: 'Fałszywa strona poprosi o kolejne dane albo o potwierdzenie w aplikacji banku. Każdy wpisany fragment przybliża oszusta do Twoich pieniędzy.' },
      { label: 'Odpisuję, że wolę zwykły przelew na numer konta', points: 1, why: 'Do przelewu wystarczy numer konta, więc to bezpieczniejsze niż link. Ta rozmowa to już jednak oszustwo, więc zgłoś konto, zanim trafi do kolejnych osób.' }
    ]
  },
  {
    icon: 'users',
    phase: 'Sprzedajesz',
    title: 'Pogadajmy na komunikatorze',
    story: 'Ktoś pyta o rower i od razu prosi, żeby dalsza rozmowa była na komunikatorze, bo „czat w serwisie mu nie działa”. Podaje numer z zagranicznym prefiksem.',
    contact: 'Anna K.',
    channel: SERVICE_CHAT,
    chat: [
      { text: 'Hej, rower dalej do kupienia? Chętnie wezmę.' },
      { text: 'Czat tutaj mi się zawiesza, napisz do mnie na komunikatorze: +44 7700 900123' }
    ],
    options: [
      { label: 'Odpisuję, że rozmawiam tylko na czacie serwisu', points: 2, best: true, why: 'Czat serwisu zostawia historię, którą moderatorzy mogą sprawdzić, a serwis ostrzega przed znanymi oszustami. Przeniesienie rozmowy poza serwis to typowy pierwszy krok oszustwa.' },
      { label: 'Piszę na komunikatorze, ale nie klikam żadnych linków', points: 1, why: 'Ostrożność pomaga, ale tracisz ochronę serwisu, a oszust dostaje Twój numer telefonu do kolejnych prób, np. SMS-ów z „dopłatą”.' },
      { label: 'Piszę na komunikatorze, bo tak faktycznie szybciej', points: 0, why: 'Poza serwisem nikt nie zobaczy rozmowy i nikt nie pomoże, gdy coś pójdzie źle. Tam zwykle pojawia się fałszywy link do „odbioru płatności”.' }
    ]
  },
  {
    icon: 'file',
    phase: 'Sprzedajesz',
    title: 'Przelew jest w drodze',
    story: 'Kupująca przysyła zrzut ekranu potwierdzenia przelewu za konsolę i prosi o wysyłkę jeszcze dziś. W aplikacji banku nie widzisz wpływu.',
    contact: 'Ola_W',
    channel: SERVICE_CHAT,
    chat: [
      { text: 'Przelałam 900 zł, potwierdzenie w załączniku. Wyślesz dziś? Syn ma jutro urodziny.' },
      { me: true, text: 'Jeszcze nie widzę wpływu na koncie.' },
      { text: 'Przelew między bankami idzie do rana, ale potwierdzenie przecież jest. Proszę, nie chcę go zawieść.' }
    ],
    options: [
      { label: 'Wysyłam dopiero wtedy, gdy pieniądze są na koncie w aplikacji banku', points: 2, best: true, why: 'Zrzut ekranu łatwo podrobić, a przelewu mogło nie być wcale. Liczy się tylko wpływ na Twoim koncie. Presja czasu i wzruszająca historia to typowe dźwignie oszustów.' },
      { label: 'Wysyłam, bo potwierdzenie wygląda prawdziwie', points: 0, why: 'Podrobione potwierdzenie przelewu to jedna z najprostszych sztuczek. Paczka wyjedzie, a pieniądze nigdy nie przyjdą.' },
      { label: 'Wysyłam za pobraniem, żeby zapłaciła kurierowi przy odbiorze', points: 1, why: 'Bezpieczniejsze niż wysyłka na słowo, choć oszuści potrafią podsunąć fałszywy link do „opłacenia pobrania”. Najprościej poczekać na wpływ.' }
    ]
  },
  {
    icon: 'scale',
    phase: 'Sprzedajesz',
    title: 'Przelałem za dużo',
    story: 'Kupujący pisze, że zamiast 150 zł przelał przez pomyłkę 1500 zł, i prosi o zwrot 1350 zł na inne konto. Przysyła zrzut ekranu z bankowości.',
    contact: 'Tomasz_Nowy',
    channel: SERVICE_CHAT,
    chat: [
      { text: 'Przepraszam, pomyliłem się przy przelewie i wysłałem 1500 zł zamiast 150 zł. Zrzut w załączniku.' },
      { text: 'Oddasz różnicę 1350 zł? Najlepiej na konto żony, to numer: 00 1111 2222 3333 4444 5555 6666' }
    ],
    options: [
      { label: 'Sprawdzam saldo w aplikacji banku. Jeśli nadpłaty nie ma, nic nie oddaję i zgłaszam konto', points: 2, best: true, why: 'Zwykle nie wpłynęło nic, a zrzut jest podrobiony. Jeśli pieniądze naprawdę przyszły, mogą pochodzić z cudzego, przejętego konta. Wtedy zwrot robisz tylko na rachunek, z którego wpłynęły, najlepiej z pomocą banku.' },
      { label: 'Oddaję różnicę na podane konto, uczciwość przede wszystkim', points: 0, why: 'Tak działa ten trik: oddajesz własne pieniądze za wpłatę, której nie było.' },
      { label: 'Proszę, żeby sam anulował przelew w swoim banku', points: 1, why: 'Rozsądnie, że nie oddajesz od razu. Najpierw jednak sprawdź, czy cokolwiek wpłynęło. Zwykle nie wpłynęło nic.' }
    ]
  },
  {
    icon: 'phone',
    phase: 'Kupujesz',
    title: 'Okazja tylko dziś',
    story: 'Znajdujesz nowy, flagowy telefon za jedną trzecią ceny. Konto sprzedawcy założono wczoraj, a on prosi o kod BLIK albo przelew na numer telefonu, bo „płatność w serwisie bierze prowizję”.',
    contact: 'Sklep_Elektro_24',
    channel: SERVICE_CHAT,
    chat: [
      { me: true, text: 'Dzień dobry, telefon nowy, nieotwierany?' },
      { text: 'Tak, nowy w folii. Mam dziś jeszcze dwóch chętnych.' },
      { text: 'Bez płatności w serwisie, bo prowizja. Wyślij kod BLIK na 2000 zł, a paczkę nadam za godzinę.' }
    ],
    options: [
      { label: 'Kupuję tylko przez płatność w serwisie z ochroną kupującego, a jak się nie zgodzi, rezygnuję', points: 2, best: true, why: 'Płatność w serwisie trzyma pieniądze do odbioru paczki. Nowe konto, cena zbyt dobra, żeby była prawdziwa, presja innych chętnych i płatność poza serwisem to cztery sygnały oszustwa naraz.' },
      { label: 'Wysyłam kod BLIK, bo to szybkie i wygodne', points: 0, why: 'Kod BLIK działa jak gotówka. Po zatwierdzeniu pieniędzy nie da się cofnąć, a kod przekazany obcej osobie to najczęstszy sposób kradzieży przy takich ogłoszeniach.' },
      { label: 'Proponuję odbiór osobisty w miejscu publicznym i płatność po sprawdzeniu telefonu', points: 1, why: 'Dużo bezpieczniej, jeśli sprawdzisz, czy telefon działa i nie jest zablokowany na konto poprzedniego właściciela. Tak niska cena może jednak oznaczać towar kradziony.' }
    ]
  },
  {
    icon: 'lock',
    phase: 'Kupujesz',
    title: 'Link do bezpiecznej płatności',
    story: 'Sprzedająca wózek dziecięcy przysyła na czacie link do zapłaty „z ochroną kupującego Kurier Szybko”. Strona wygląda jak serwis kurierski i prosi o zalogowanie do banku.',
    contact: 'Magda_mama',
    channel: SERVICE_CHAT,
    chat: [
      { text: 'Wózek czeka. Zapłać tutaj z ochroną kupującego, wtedy od razu nadam: kurier-szybko-ochrona.online/platnosc' },
      { text: 'Po wejściu wybierz swój bank i zaloguj się, to bezpieczne.' }
    ],
    options: [
      { label: 'Zamykam stronę i płacę tylko przyciskiem „Kup” w aplikacji Targowiska', points: 2, best: true, why: 'Prawdziwa płatność z ochroną zaczyna się w aplikacji serwisu, nie od linku przesłanego przez drugą stronę. Fałszywa bramka płatności przejmie login do banku i kod z SMS.' },
      { label: 'Loguję się, bo strona ma kłódkę i logo kuriera', points: 0, why: 'Kłódka oznacza tylko szyfrowane połączenie, także z fałszywą stroną. Logo da się skopiować w minutę.' },
      { label: 'Czytam dokładnie adres strony i płacę, jeśli wygląda na kurierski', points: 1, why: 'Czytanie adresu to dobry nawyk, ale oszuści rejestrują łudząco podobne domeny. Bezpieczniej w ogóle nie płacić z linku od sprzedającego.' }
    ]
  },
  {
    icon: 'key',
    phase: 'Sprzedajesz',
    title: 'Kod do weryfikacji',
    story: 'Kupujący prosi o kod, który zaraz przyjdzie SMS-em, „żeby potwierdzić, że jesteś prawdziwą osobą, a nie botem”. Po chwili przychodzi SMS z kodem do zalogowania w Twoim komunikatorze.',
    contact: 'Kupujacy_PL',
    channel: SERVICE_CHAT,
    chat: [
      { text: 'Zanim zapłacę, muszę sprawdzić, czy nie jesteś botem. Zaraz dostaniesz SMS z kodem, prześlij mi go.' },
      { text: 'To standardowa weryfikacja, wszyscy tak robią.' }
    ],
    options: [
      { label: 'Nie podaję kodu i zgłaszam konto kupującego', points: 2, best: true, why: 'Kod z SMS to klucz do Twojego konta. Ktoś próbuje zalogować się na Twój numer, a potem prosić Twoich znajomych o pieniądze. Włącz w komunikatorze PIN weryfikacji dwuetapowej.' },
      { label: 'Pytam, do czego dokładnie potrzebny jest ten kod', points: 1, why: 'Pytanie jest lepsze niż podanie kodu, ale oszust ma gotową wymówkę. Żaden kupujący nie potrzebuje kodu z Twojego SMS-a. Przeczytaj treść SMS-a, zwykle mówi wprost, do czego służy kod.' },
      { label: 'Podaję kod, przecież to tylko weryfikacja', points: 0, why: 'Po podaniu kodu tracisz konto w komunikatorze, a oszust pisze z niego do Twoich znajomych z prośbą o pilny przelew albo kod BLIK.' }
    ]
  },
  {
    icon: 'package',
    phase: 'Sprzedajesz',
    title: 'Zwykła kupująca',
    story: 'Kupująca pyta na czacie serwisu o wymiary biurka, a potem opłaca je przyciskiem „Kup” w aplikacji. Aplikacja Targowiska pokazuje zamówienie i etykietę do nadania paczki.',
    contact: 'Karolina',
    channel: SERVICE_CHAT,
    chat: [
      { text: 'Dzień dobry, jakie są wymiary blatu?' },
      { me: true, text: '120 na 60 cm.' },
      { text: 'Idealnie, kupuję przez aplikację. Dziękuję!' }
    ],
    options: [
      { label: 'Nadaję paczkę z etykietą wygenerowaną w aplikacji serwisu', points: 2, best: true, why: 'Tak wygląda bezpieczna transakcja: rozmowa i płatność w serwisie, a pieniądze trafiają do Ciebie po odbiorze paczki. Ostrożność nie oznacza traktowania każdego jak oszusta.' },
      { label: 'Proszę jeszcze o numer telefonu, żeby potwierdzić zamówienie', points: 1, why: 'Nie jest potrzebny, bo wszystko, co ważne, widać w aplikacji serwisu. Im mniej danych wymieniacie, tym lepiej dla obu stron.' },
      { label: 'Proszę o dodatkowy przelew na moje konto, żeby mieć pewność', points: 0, why: 'Zamówienie jest już opłacone w serwisie. Prośba o drugi przelew wygląda jak oszustwo, tylko w drugą stronę.' }
    ]
  }
];

export default {
  id: 'ogloszenia',
  title: 'Oszustwa przy sprzedaży z ogłoszeń',
  category: 'ludzie',
  icon: 'package',
  minutes: 7,
  summary: 'Sprzedajesz i kupujesz w serwisie z ogłoszeniami. Rozpoznajesz fałszywe linki do odbioru pieniędzy, podrobione przelewy, nadpłaty i prośby o kody.',
  lesson: [
    'Portale z ogłoszeniami i serwisy z używanymi rzeczami to jedno z ulubionych miejsc oszustów w Polsce. Najczęściej celują w sprzedających, bo ci czekają na wiadomość i chcą szybko sprzedać.',
    'Schemat jest prawie zawsze ten sam: wyprowadzić rozmowę poza serwis, podesłać link do „odbioru pieniędzy” albo „bezpiecznej płatności” i wyłudzić dane karty, logowanie do banku albo kod.',
    'Złota zasada: rozmowa, płatność i wysyłka tylko w aplikacji serwisu. Żeby dostać pieniądze, nigdy nie podajesz danych karty.',
    'Serwis Targowisko, firma Kurier Szybko i wszystkie osoby w grze są fikcyjne. Za każdą reakcję dostajesz 0, 1 albo 2 punkty.'
  ],
  takeaways: [
    'Sprzedajesz? Nigdy nie podajesz danych karty, żeby „odebrać pieniądze”. Zamówienie i wypłatę widać w aplikacji serwisu.',
    'Rozmowa, płatność i wysyłka tylko w serwisie. Prośba o przejście na komunikator to sygnał ostrzegawczy.',
    'Liczy się wpływ na koncie w aplikacji banku, nie zrzut ekranu przelewu ani historia o nadpłacie.',
    'Nie przekazujesz nikomu kodów z SMS ani kodów BLIK.',
    'Oszustwo zgłaszasz w serwisie, fałszywe strony na <code>incydent.cert.pl</code>, a podejrzane SMS-y przekazujesz na numer 8080.'
  ],
  async mount(stage, ctx) {
    let score = 0;
    for (const [index, situation] of SITUATIONS.entries()) {
      ctx.progress(index, SITUATIONS.length);
      score += await playScenario(stage, ctx, situation, index, SITUATIONS.length, { label: 'Sytuacja', nextLabel: 'Następna sytuacja' });
    }
    ctx.finish({ score, max: SITUATIONS.length * 2 });
  }
};

export function examPool() {
  return SITUATIONS.map(scenarioQuestion);
}
