import { draw } from '../ui.js';
import { playScenario, scenarioQuestion } from '../scenario.js';

const SCENARIOS = [
  {
    icon: 'phone',
    title: 'Telefon z „działu IT”',
    story: 'Dzwoni miły pan: „Dzień dobry, tu Marek z IT. Mamy awarię skrzynek, migrujemy konta. Za chwilę przyjdzie SMS z kodem, proszę mi go przeczytać, to potrwa minutę”.',
    options: [
      { label: 'Czytam kod, przecież to nasz dział IT', points: 0, why: 'Kod z SMS-a to drugi składnik logowania. Z nim oszust przejmie konto, nawet jeśli zna już Twoje hasło. Prawdziwy dział IT nigdy go nie potrzebuje.' },
      { label: 'Pytam o nazwisko i numer wewnętrzny, a potem podaję kod', points: 0, why: 'Oszust poda dowolne dane. Kodu nie podaje się nikomu, niezależnie od tego, kto dzwoni.' },
      { label: 'Odmawiam, rozłączam się i samodzielnie dzwonię do IT na znany numer', points: 2, best: true, why: 'Idealnie. Weryfikacja innym, znanym kanałem to najskuteczniejsza obrona przed socjotechniką. Zgłoś też próbę, bo pewnie dzwonią do kolejnych osób.' }
    ]
  },
  {
    icon: 'plug',
    title: 'Pendrive na parkingu',
    story: 'Na firmowym parkingu leży pendrive z naklejką „Wynagrodzenia 2026, poufne”.',
    options: [
      { label: 'Podłączam do komputera, żeby sprawdzić, czyj jest', points: 0, why: 'Dokładnie na to liczy atakujący. Takie urządzenie może po podłączeniu zainstalować złośliwe oprogramowanie albo udawać klawiaturę i wpisywać polecenia.' },
      { label: 'Oddaję do działu IT lub bezpieczeństwa bez podłączania', points: 2, best: true, why: 'Tak. Kusząca etykieta to klasyczna przynęta (baiting). Dział IT sprawdzi go w bezpiecznym, odizolowanym środowisku.' },
      { label: 'Wyrzucam do kosza', points: 1, why: 'Lepiej niż podłączać, ale firma nie dowie się, że ktoś próbuje ataku. Zgłoszenie jest cenne.' }
    ]
  },
  {
    icon: 'users',
    title: 'Ktoś bez identyfikatora za Tobą',
    story: 'Otwierasz kartą drzwi do biura. Osoba z dwoma kubkami kawy w rękach uśmiecha się: „Przytrzymasz? Zostawiłem kartę na biurku”.',
    options: [
      { label: 'Przytrzymuję, nie chcę być niemiły', points: 0, why: 'To tailgating: wejście „na doczepkę”. Zajęte ręce i uśmiech to celowe zagranie, żeby trudno było odmówić.' },
      { label: 'Uprzejmie proszę, żeby zgłosił się na recepcję', points: 2, best: true, why: 'Tak. Możesz być miły i stanowczy jednocześnie: „Przepraszam, każdy wchodzi swoją kartą, recepcja pomoże”.' },
      { label: 'Wpuszczam, ale obserwuję, dokąd idzie', points: 1, why: 'Lepsze niż nic, ale on już jest w środku. Kontrola dostępu działa tylko wtedy, gdy wszyscy jej przestrzegają.' }
    ]
  },
  {
    icon: 'mail',
    title: 'Pilny przelew od „prezesa”',
    story: 'Dostajesz maila od prezesa: „Finalizujemy poufne przejęcie. Pilnie zrób przelew 48 000 zł na załączone konto. Nie dzwoń, jestem na negocjacjach. Sprawa jest tajna”.',
    options: [
      { label: 'Robię przelew, sprawa jest pilna', points: 0, why: 'To atak „na prezesa” (BEC, CEO fraud). Firmy tracą przez niego miliony. Pośpiech i tajemnica to sygnały alarmowe.' },
      { label: 'Odpisuję na tego maila z prośbą o potwierdzenie', points: 0, why: 'Odpowiedź trafi do oszusta, który chętnie „potwierdzi”. Weryfikuj innym kanałem.' },
      { label: 'Weryfikuję telefonicznie na znany numer prezesa lub przez przełożonego', points: 2, best: true, why: 'Tak. Każda nietypowa prośba o pieniądze wymaga potwierdzenia innym kanałem, nawet jeśli nadawca prosi, żeby tego nie robić.' }
    ]
  },
  {
    icon: 'phone',
    title: 'Znajomy prosi o BLIK',
    story: 'Kolega pisze na komunikatorze: „Hej, jestem w sklepie, nie działa mi karta. Wyślesz mi kod BLIK na 300 zł? Oddam wieczorem”.',
    options: [
      { label: 'Wysyłam kod, to przecież kolega', points: 0, why: 'Konta w komunikatorach są często przejmowane i oszust pisze do wszystkich znajomych. Kod BLIK to gotówka dla każdego, kto go wpisze.' },
      { label: 'Dzwonię do kolegi i pytam, czy to on', points: 2, best: true, why: 'Tak. Krótki telefon rozwiewa wątpliwości. Jeśli konto zostało przejęte, uprzedź kolegę i innych znajomych.' },
      { label: 'Zadaję mu w czacie pytanie, które zna tylko on', points: 1, why: 'Lepiej niż nic, ale oszust może przeczytać historię rozmów i znaleźć odpowiedź. Telefon jest pewniejszy.' }
    ]
  },
  {
    icon: 'wifi',
    title: 'Darmowe Wi-Fi na lotnisku',
    story: 'Na lotnisku widzisz dwie otwarte sieci: „Lotnisko_Free_WiFi” i „Lotnisko-Free-WiFi-5G”. Chcesz sprawdzić konto w banku.',
    options: [
      { label: 'Łączę się z mocniejszą siecią i loguję do banku', points: 0, why: 'Każdy może postawić sieć o dowolnej nazwie (evil twin, „zły bliźniak”) i obserwować, co robisz.' },
      { label: 'Używam internetu z telefonu (hotspot) albo VPN, a bank sprawdzam w aplikacji', points: 2, best: true, why: 'Tak. Własne połączenie komórkowe jest najbezpieczniejsze. Na otwartych sieciach unikaj logowania do ważnych kont.' },
      { label: 'Wybieram sieć, której nazwa wygląda bardziej oficjalnie', points: 0, why: 'Nazwy sieci nic nie znaczą. Oszust nazwie swoją dokładnie tak samo jak prawdziwą.' }
    ]
  },
  {
    icon: 'phone',
    title: '„Policja” chroni Twoje oszczędności',
    story: 'Dzwoni „policjant z wydziału do walki z cyberprzestępczością”: na Twoje konto trwa atak, a pracownik banku jest w zmowie z hakerami. Musisz natychmiast przelać pieniądze na „bezpieczne konto techniczne”.',
    options: [
      { label: 'Przelewam, skoro to policja', points: 0, why: 'Nie istnieją „bezpieczne konta” policji ani banku. To jedno z najczęstszych oszustw telefonicznych w Polsce.' },
      { label: 'Rozłączam się, dzwonię do banku na numer z karty i zgłaszam próbę na 112', points: 2, best: true, why: 'Tak. Policja nigdy nie prosi o przelewy ani kody. Zadzwoń samodzielnie na oficjalny numer, a nie oddzwaniaj na numer z ekranu.' },
      { label: 'Proszę o numer legitymacji służbowej i dopiero wtedy przelewam', points: 0, why: 'Oszust poda dowolny numer. Prośba o przelew na „bezpieczne konto” to zawsze oszustwo.' }
    ]
  },
  {
    icon: 'shield',
    title: 'Lawina powiadomień 2FA',
    story: 'O 23:40 telefon co chwilę pokazuje prośbę: „Czy to Ty się logujesz? Zatwierdź”. Nie logujesz się nigdzie.',
    level: 'zaawansowany',
    options: [
      { label: 'Zatwierdzam, żeby przestało dzwonić', points: 0, why: 'To atak „MFA fatigue”. Atakujący zna już Twoje hasło i liczy, że w końcu klikniesz ze zmęczenia.' },
      { label: 'Odrzucam powiadomienia i idę spać', points: 1, why: 'Dobrze, że odrzucasz, ale ktoś zna Twoje hasło. Bez zmiany hasła atak wróci.' },
      { label: 'Odrzucam, od razu zmieniam hasło i zgłaszam incydent do IT', points: 2, best: true, why: 'Tak. Seria nieoczekiwanych próśb oznacza wyciek hasła. Lepsze są metody odporne na ten atak: klucz sprzętowy, passkey albo wpisywanie numeru z ekranu.' }
    ]
  },
  {
    icon: 'file',
    title: 'Zadanie rekrutacyjne od rekrutera',
    story: 'Rekruter z portalu zawodowego proponuje świetną pracę. Prosi, żebyś pobrał archiwum z „zadaniem testowym” i uruchomił projekt na swoim komputerze, najlepiej jeszcze dziś.',
    level: 'zaawansowany',
    options: [
      { label: 'Pobieram i uruchamiam, chcę zrobić dobre wrażenie', points: 0, why: 'Fałszywe rekrutacje to znana metoda dostarczania złośliwego oprogramowania, zwłaszcza programistom i pracownikom firm z kryptowalutami.' },
      { label: 'Uruchamiam w maszynie wirtualnej bez dostępu do moich danych', points: 1, why: 'Izolacja to rozsądny krok, ale najpierw warto sprawdzić, czy firma i rekruter w ogóle istnieją.' },
      { label: 'Weryfikuję firmę i rekrutera innym kanałem i nie uruchamiam nieznanego kodu na swoim sprzęcie', points: 2, best: true, why: 'Tak. Sprawdź oficjalną stronę kariery firmy i zadzwoń do niej. Prawdziwa rekrutacja nie wymaga uruchamiania podejrzanych archiwów w pośpiechu.' }
    ]
  },
  {
    icon: 'phone',
    title: 'Głos prezesa w telefonie',
    story: 'Dzwoni prezes. Głos brzmi identycznie, choć połączenie trochę trzeszczy. Prosi o pilny przelew 120 000 zł do nowego kontrahenta, bo „transakcja zamyka się za godzinę”.',
    level: 'zaawansowany',
    options: [
      { label: 'Robię przelew, poznaję przecież jego głos', points: 0, why: 'Głos da się dziś podrobić (deepfake) na podstawie kilku nagrań z internetu.' },
      { label: 'Zadaję pytanie, na które zna odpowiedź tylko prezes', points: 1, why: 'Lepsze niż nic, ale odpowiedź mogła wyciec z mediów społecznościowych lub poczty.' },
      { label: 'Rozłączam się, oddzwaniam na jego znany numer i stosuję zasadę dwóch osób przy przelewach', points: 2, best: true, why: 'Tak. Procedury (oddzwonienie, zatwierdzenie przez drugą osobę) chronią lepiej niż ludzki słuch.' }
    ]
  }
];

export default {
  id: 'socjotechnika',
  title: 'Socjotechnika: co zrobisz?',
  category: 'ludzie',
  icon: 'users',
  minutes: 8,
  levels: true,
  summary: 'Sześć sytuacji z życia: telefon „z IT”, pendrive na parkingu, prośba o BLIK. Wybierz reakcję i zobacz, jak myśli osoba, która próbuje Cię zmanipulować.',
  lesson: [
    '<strong>Socjotechnika</strong> (inżynieria społeczna) to manipulowanie ludźmi zamiast łamania zabezpieczeń technicznych. Po co zgadywać hasło, skoro można poprosić o nie miłym głosem?',
    'Manipulatorzy wykorzystują naturalne odruchy: chęć pomocy, szacunek do autorytetu, strach przed konsekwencjami, pośpiech i ciekawość.',
    'Najlepsza obrona jest prosta: gdy coś jest nietypowe i pilne, <strong>zatrzymaj się i zweryfikuj innym kanałem</strong>, np. dzwoniąc na numer, który znasz z oficjalnego źródła.',
    'Za każdą reakcję możesz dostać 0, 1 lub 2 punkty. Czasem kilka odpowiedzi jest „niezłych”, ale jedna jest najlepsza.'
  ],
  takeaways: [
    'Nikomu nie podawaj kodów z SMS-a, BLIK, haseł ani danych karty. Nikt uczciwy o nie nie prosi.',
    'Pośpiech, tajemnica i autorytet to trzy najczęstsze dźwignie manipulacji.',
    'Weryfikuj innym kanałem: telefon na znany numer, rozmowa osobiście.',
    'Znalezionych nośników USB nie podłączaj. Oddaj je do IT.',
    'Zgłaszaj próby ataku. Jedno zgłoszenie może ochronić całą firmę.'
  ],
  async mount(stage, ctx) {
    let score = 0;
    const scenarios = draw(SCENARIOS, 6, ctx.level);
    for (const [index, scenario] of scenarios.entries()) {
      ctx.progress(index, scenarios.length);
      score += await playScenario(stage, ctx, scenario, index, scenarios.length);
    }
    ctx.finish({ score, max: scenarios.length * 2 });
  }
};

export function examPool() {
  return SCENARIOS.map(scenarioQuestion);
}
