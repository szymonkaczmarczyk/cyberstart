import { playScenario, scenarioQuestion } from '../scenario.js';

const STEPS = [
  {
    icon: 'key',
    phase: 'Krok 1: hasło',
    title: 'Nowe hasło do poczty',
    story: 'Zaczynasz od skrzynki pocztowej, bo przez nią resetuje się hasła do wszystkich innych kont. Obecne hasło to Kasia1990! i używasz go jeszcze w trzech miejscach.',
    options: [
      { label: 'Generuję w menedżerze haseł długie, losowe hasło używane tylko tutaj', points: 2, best: true, why: 'Unikalne hasło z menedżera jest mocne i nie musisz go pamiętać. Hasło główne do menedżera to jedyne, które trzeba znać na pamięć.' },
      { label: 'Zmieniam na Kasia1991!', points: 0, why: 'Drobna zmiana starego hasła to pierwsze, co sprawdzi atakujący, który zna poprzednie.' },
      { label: 'Wymyślam frazę z czterech losowych słów, używaną tylko tutaj', points: 1, why: 'Dobry wybór, jeśli nie masz menedżera haseł. Fraza musi być unikalna i nie może być znanym cytatem.' }
    ]
  },
  {
    icon: 'shield',
    phase: 'Krok 2: weryfikacja dwuetapowa',
    title: 'Drugi składnik logowania',
    story: 'Ustawienia proponują kilka metod weryfikacji dwuetapowej (2FA).',
    options: [
      { label: 'Klucz dostępu (passkey) albo klucz sprzętowy', points: 2, best: true, why: 'Te metody są odporne na phishing: działają tylko na prawdziwej domenie serwisu, więc fałszywa strona nic nie dostanie.' },
      { label: 'Aplikacja uwierzytelniająca z kodami', points: 1, why: 'Bardzo dobra metoda, dużo lepsza od SMS. Kod da się jednak wyłudzić na fałszywej stronie, jeśli ktoś go przepisze.' },
      { label: 'Nie włączam, mam przecież mocne hasło', points: 0, why: 'Mocne hasło może wyciec z serwisu albo zostać wyłudzone. Drugi składnik to druga linia obrony.' }
    ]
  },
  {
    icon: 'file',
    phase: 'Krok 3: kody zapasowe',
    title: 'Kody na wypadek zgubienia telefonu',
    story: 'Serwis pokazuje 10 jednorazowych kodów zapasowych. Każdy pozwala zalogować się bez drugiego składnika.',
    options: [
      { label: 'Zapisuję je w menedżerze haseł albo drukuję i chowam w bezpiecznym miejscu w domu', points: 2, best: true, why: 'Kody muszą być dostępne, gdy stracisz telefon, ale nie mogą leżeć tam, gdzie atakujący dotrze razem z hasłem.' },
      { label: 'Robię zrzut ekranu i wysyłam sobie mailem', points: 0, why: 'Kody trafią do skrzynki, którą właśnie chronisz. Kto przejmie pocztę, dostanie też kody.' },
      { label: 'Nie zapisuję, i tak ich nie użyję', points: 0, why: 'Po utracie telefonu odzyskanie konta bez kodów bywa długie albo niemożliwe.' }
    ]
  },
  {
    icon: 'activity',
    phase: 'Krok 4: aktywne sesje',
    title: 'Kto jest teraz zalogowany?',
    story: 'Lista sesji: „Ten komputer, Kraków, teraz”, „Twój telefon, Kraków, wczoraj” oraz „Nieznane urządzenie z Linuksem, Amsterdam, dziś 03:12”.',
    options: [
      { label: 'Wylogowuję wszystkie inne sesje, zmieniam hasło i sprawdzam reguły przekazywania poczty', points: 2, best: true, why: 'Nieznana sesja o 3:12 oznacza, że ktoś miał dostęp. Intruzi często ustawiają przekazywanie poczty albo filtry, żeby czytać ją dalej po zmianie hasła.' },
      { label: 'Wylogowuję tylko nieznane urządzenie', points: 1, why: 'Dobry początek, ale bez zmiany hasła intruz po prostu zaloguje się znowu.' },
      { label: 'To pewnie VPN, nic nie robię', points: 0, why: 'Jeśli nie używasz VPN w Amsterdamie o 3 w nocy, to nie jest Twoja sesja.' }
    ]
  },
  {
    icon: 'link',
    phase: 'Krok 5: podłączone aplikacje',
    title: 'Aplikacje z dostępem do konta',
    story: 'W sekcji „Aplikacje innych firm” widzisz: kalendarz w telefonie oraz „Quiz: jaką jesteś postacią?”, który ma dostęp do czytania i wysyłania Twojej poczty.',
    options: [
      { label: 'Odbieram dostęp quizowi, zostawiam kalendarz', points: 2, best: true, why: 'Aplikacja z dostępem OAuth działa niezależnie od hasła. Zmiana hasła jej nie odetnie, trzeba odebrać dostęp ręcznie.' },
      { label: 'Zostawiam wszystko, przecież to była moja decyzja', points: 0, why: 'Quiz nie potrzebuje Twojej poczty. Takie aplikacje bywają sposobem na kradzież danych.' }
    ]
  },
  {
    icon: 'rotate',
    phase: 'Krok 6: odzyskiwanie konta',
    title: 'Dane do odzyskiwania',
    story: 'Jako zapasowy adres widnieje stara skrzynka ze studiów, do której nie pamiętasz hasła, a numer telefonu jest nieaktualny.',
    options: [
      { label: 'Ustawiam aktualny numer i zapasowy adres, do którego mam dostęp i który też ma 2FA', points: 2, best: true, why: 'Dane odzyskiwania to tylne drzwi do konta. Muszą być aktualne i równie dobrze chronione.' },
      { label: 'Usuwam wszystkie dane odzyskiwania dla bezpieczeństwa', points: 1, why: 'Mniej furtek to plus, ale bez nich łatwo utracić dostęp. Lepiej mieć aktualne i chronione dane.' },
      { label: 'Zostawiam starą skrzynkę, kiedyś odzyskam do niej hasło', points: 0, why: 'Porzucona skrzynka może zostać przejęta, a wtedy przez nią przejmie się też Twoją pocztę.' }
    ]
  },
  {
    icon: 'mail',
    phase: 'Krok 7: alerty',
    title: 'Powiadomienia o bezpieczeństwie',
    story: 'Na koniec serwis pyta, czy wysyłać Ci powiadomienia o nowych logowaniach i zmianach w zabezpieczeniach.',
    options: [
      { label: 'Włączam, na telefon i na zapasowy adres', points: 2, best: true, why: 'Szybki alert o nietypowym logowaniu daje Ci czas, żeby zareagować, zanim intruz narobi szkód.' },
      { label: 'Wyłączam, bo to tylko spam', points: 0, why: 'Te kilka wiadomości w roku to Twój system wczesnego ostrzegania.' }
    ]
  }
];

export default {
  id: 'konto',
  title: 'Zabezpiecz konto krok po kroku',
  category: 'hasla',
  icon: 'shieldCheck',
  minutes: 8,
  summary: 'Przechodzisz przez ustawienia bezpieczeństwa skrzynki pocztowej: nowe hasło, 2FA, kody zapasowe, podejrzana sesja, podłączone aplikacje, odzyskiwanie i alerty.',
  lesson: [
    'Skrzynka pocztowa to klucz do całego cyfrowego życia: przez nią resetujesz hasła do banku, sklepów i mediów społecznościowych. Dlatego zabezpieczasz ją jako pierwszą.',
    'Ta gra to przegląd, który warto potem zrobić naprawdę. Ustawienia w Google, Microsoft czy Apple nazywają się trochę inaczej, ale kroki są te same.',
    'Za każdy krok dostajesz 0, 1 albo 2 punkty.'
  ],
  takeaways: [
    'Poczta dostaje unikalne hasło z menedżera i 2FA, najlepiej passkey albo klucz sprzętowy.',
    'Kody zapasowe trzymasz w menedżerze haseł albo na papierze w bezpiecznym miejscu, nigdy w tej samej skrzynce.',
    'Raz na jakiś czas sprawdź aktywne sesje, reguły przekazywania poczty i aplikacje z dostępem do konta.',
    'Dane odzyskiwania mają być aktualne i równie dobrze chronione jak konto.',
    'Włącz alerty o logowaniu. Potem powtórz ten przegląd dla banku i mediów społecznościowych.'
  ],
  async mount(stage, ctx) {
    let score = 0;
    for (const [index, step] of STEPS.entries()) {
      ctx.progress(index, STEPS.length);
      score += await playScenario(stage, ctx, step, index, STEPS.length, { label: 'Krok', nextLabel: 'Następny krok' });
    }
    ctx.finish({ score, max: STEPS.length * 2 });
  }
};

export function examPool() {
  return STEPS.map(scenarioQuestion);
}
