import { playScenario, scenarioQuestion } from '../scenario.js';

const STAGES = [
  {
    icon: 'alert',
    time: '08:05',
    phase: 'Wykrycie',
    title: 'Pliki z końcówką .locked',
    story: 'Dzwoni księgowa: jej pliki mają nagle rozszerzenie .locked, a na pulpicie pojawił się plik ODCZYTAJ_MNIE.txt z żądaniem okupu. Komputer nadal pracuje i dysk mieli.',
    options: [
      { label: 'Odłączam komputer od sieci (kabel i Wi-Fi), ale nie wyłączam zasilania', points: 2, best: true, why: 'Odcięcie od sieci zatrzymuje rozprzestrzenianie się na inne maszyny. Włączony komputer zachowuje pamięć RAM, w której bywają klucze i ślady przydatne dla analityków.' },
      { label: 'Każę jej wyłączyć komputer przyciskiem', points: 1, why: 'Szyfrowanie się zatrzyma, ale tracisz zawartość pamięci, czyli cenne dowody. Lepsza jest izolacja od sieci.' },
      { label: 'Uruchamiam pełne skanowanie antywirusem i czekam na wynik', points: 0, why: 'Skanowanie trwa długo, a w tym czasie ransomware szyfruje kolejne pliki i udziały sieciowe.' }
    ]
  },
  {
    icon: 'server',
    time: '08:20',
    phase: 'Powstrzymanie',
    title: 'Szyfrowanie na serwerze plików',
    story: 'Na wspólnym dysku sieciowym działu też pojawiają się pliki .locked. Zmiany idą z konta księgowej.',
    options: [
      { label: 'Odłączam serwer plików od sieci, blokuję konto księgowej i izoluję segment sieci działu', points: 2, best: true, why: 'Powstrzymanie (containment) ma ograniczyć szkody. Zablokowanie konta odcina drogę, którą szło szyfrowanie.' },
      { label: 'Wyłączam internet w całej firmie i czekam', points: 1, why: 'Odcięcie internetu może przerwać kontakt z serwerem przestępców, ale szyfrowanie wewnątrz sieci trwa dalej.' },
      { label: 'Od razu przywracam kopię zapasową na serwer', points: 0, why: 'Infekcja nadal jest aktywna, więc przywrócone pliki zostaną zaszyfrowane ponownie. Najpierw powstrzymanie.' }
    ]
  },
  {
    icon: 'users',
    time: '09:30',
    phase: 'Komunikacja',
    title: 'Kogo powiadomić?',
    story: 'Na serwerze były faktury i dane osobowe klientów. Wszystko wskazuje, że przestępcy mogli je też skopiować.',
    options: [
      { label: 'Zespół reagowania, zarząd i inspektora ochrony danych. Oceniamy naruszenie i w ciągu 72 godzin zgłaszamy je do UODO. Zgłaszamy incydent do CERT Polska', points: 2, best: true, why: 'RODO wymaga zgłoszenia naruszenia ochrony danych osobowych do UODO w ciągu 72 godzin od jego stwierdzenia, a często także powiadomienia osób, których dane dotyczą. CERT Polska pomaga w obsłudze incydentu.' },
      { label: 'Tylko szefa IT, reszta nie musi wiedzieć', points: 1, why: 'Za mało. Decyzje biznesowe i obowiązki prawne wymagają zarządu oraz inspektora ochrony danych.' },
      { label: 'Nikogo. Załatwimy to po cichu', points: 0, why: 'Ukrywanie naruszenia łamie prawo i grozi karami. Do tego klienci nie dowiedzą się, że ich dane mogą być wykorzystane.' }
    ]
  },
  {
    icon: 'key',
    time: '11:00',
    phase: 'Decyzja',
    title: 'Żądanie okupu',
    story: 'Przestępcy żądają równowartości 200 000 zł w kryptowalucie i grożą publikacją skradzionych danych za 48 godzin.',
    options: [
      { label: 'Decyzję podejmuje zarząd z prawnikami i ekspertami. Zasadą jest niepłacenie, bo zapłata nie gwarantuje odszyfrowania ani usunięcia danych', points: 2, best: true, why: 'Organy ścigania i CERT-y odradzają płacenie: finansuje to kolejne ataki, a przestępcy często publikują dane mimo zapłaty. Najlepszą „negocjacją” są sprawne kopie zapasowe.' },
      { label: 'Płacimy od razu, żeby mieć spokój', points: 0, why: 'Zapłata nie daje gwarancji. Firma, która zapłaciła, często staje się celem kolejnego ataku.' },
      { label: 'Samodzielnie negocjuję z przestępcami przez ich czat', points: 0, why: 'Takie rozmowy prowadzą wyspecjalizowane zespoły, po decyzji zarządu. Samodzielne działanie może pogorszyć sytuację.' }
    ]
  },
  {
    icon: 'rotate',
    time: 'Dzień 2',
    phase: 'Usunięcie i odtworzenie',
    title: 'Przywracanie z kopii',
    story: 'Na szczęście jest kopia z poprzedniej nocy na dysku odłączonym od sieci. Zespół chce jak najszybciej wrócić do pracy.',
    options: [
      { label: 'Najpierw ustalam, jak napastnik wszedł, usuwam jego narzędzia, zmieniam hasła i łatam system. Dopiero potem przywracam dane do czystych maszyn', points: 2, best: true, why: 'Bez usunięcia przyczyny (eradykacji) napastnik wróci tą samą drogą, czasem po kilku dniach. Przywracasz do czystego systemu i sprawdzasz kopię przed użyciem.' },
      { label: 'Przywracam dane od razu na te same maszyny', points: 0, why: 'Jeśli napastnik zostawił furtkę, za chwilę wszystko powtórzy się od nowa.' },
      { label: 'Przeinstalowuję tylko komputer księgowej', points: 1, why: 'To dobry krok, ale napastnik mógł mieć dostęp także do innych kont i serwerów. Trzeba zbadać całość.' }
    ]
  },
  {
    icon: 'file',
    time: 'Tydzień później',
    phase: 'Wnioski',
    title: 'Raport po incydencie',
    story: 'Analiza pokazała: tydzień wcześniej księgowa otworzyła załącznik faktura.pdf.exe, a firmowy VPN nie miał dwuskładnikowego logowania.',
    options: [
      { label: 'Spisuję wnioski i wdrażam zmiany: blokada plików .exe w poczcie, 2FA na VPN, szkolenia z phishingu, ochrona EDR i regularne testy odtwarzania kopii', points: 2, best: true, why: 'Celem tej fazy (lessons learned) jest naprawa przyczyn, a nie szukanie winnych. Kopie zapasowe uratowały firmę, więc warto je regularnie testować.' },
      { label: 'Zwalniam księgową', points: 0, why: 'Jedna osoba to nie przyczyna. System pozwolił, żeby jeden klik zaszyfrował firmę. Kultura obwiniania sprawia, że ludzie przestają zgłaszać incydenty.' },
      { label: 'Kupuję lepszego antywirusa i zamykam temat', points: 1, why: 'Lepsza ochrona stacji pomaga, ale nie załatwia braku 2FA, filtrów poczty ani szkoleń.' }
    ]
  }
];

export default {
  id: 'incydent',
  title: 'Reakcja na incydent: ransomware',
  category: 'obrona',
  icon: 'alert',
  minutes: 12,
  summary: 'Poniedziałek, 8:05. W firmie ktoś uruchomił ransomware. Prowadzisz reakcję krok po kroku: od odcięcia komputera, przez zgłoszenia i decyzję o okupie, po wnioski.',
  lesson: [
    '<strong>Ransomware</strong> to złośliwe oprogramowanie, które szyfruje pliki i żąda okupu. Dziś przestępcy często najpierw kradną dane, a potem grożą ich publikacją (podwójne wymuszenie).',
    'Reakcja na incydent ma fazy: <strong>wykrycie</strong>, <strong>powstrzymanie</strong> (zatrzymać rozprzestrzenianie), <strong>usunięcie</strong> przyczyny, <strong>odtworzenie</strong> i <strong>wnioski</strong>. Do tego komunikacja z zarządem, prawnikami i urzędami.',
    'W Polsce naruszenie ochrony danych osobowych zgłasza się do UODO w ciągu 72 godzin. Incydenty można zgłaszać do CERT Polska przez incydent.cert.pl.',
    'Każda decyzja ma konsekwencje. Wybierz reakcję i zobacz, co z niej wynika.'
  ],
  takeaways: [
    'Najpierw izolacja: odłącz od sieci, nie wyłączaj, blokuj konta, z których idzie atak.',
    'Powstrzymanie przed odtwarzaniem. Bez usunięcia przyczyny atak wróci.',
    'Naruszenie danych osobowych zgłaszasz do UODO w 72 godziny. CERT Polska pomaga przy incydentach.',
    'Płacenie okupu niczego nie gwarantuje. Najlepszą obroną są kopie zapasowe offline i przećwiczone odtwarzanie.',
    'Po incydencie naprawiasz przyczyny (2FA, filtry poczty, szkolenia), a nie szukasz winnych.'
  ],
  async mount(stage, ctx) {
    let score = 0;
    for (const [index, scenario] of STAGES.entries()) {
      ctx.progress(index, STAGES.length);
      score += await playScenario(stage, ctx, scenario, index, STAGES.length, { label: 'Etap', nextLabel: 'Następny etap' });
    }
    ctx.finish({ score, max: STAGES.length * 2 });
  }
};

export function examPool() {
  return STAGES.map(scenarioQuestion);
}
