import { mountConfigAudit, settingsToQuestions } from '../config-audit.js';

const SETTINGS = [
  {
    id: 'profile', section: 'Media społecznościowe', label: 'Kto widzi Twój profil i posty', initial: 'public',
    options: [{ value: 'public', label: 'Wszyscy' }, { value: 'friends', label: 'Tylko znajomi' }], best: 'friends',
    help: 'Publiczny profil to kopalnia wiedzy dla oszustów: kim są Twoi bliscy, gdzie pracujesz, kiedy jesteś na urlopie. Z tego buduje się wiarygodny phishing i odpowiedzi na pytania pomocnicze.',
    issue: 'Profil i posty widzi każdy.'
  },
  {
    id: 'birth', section: 'Media społecznościowe', label: 'Data urodzenia, miasto i szkoła w profilu', initial: 'visible',
    options: [{ value: 'visible', label: 'Widoczne publicznie' }, { value: 'hidden', label: 'Ukryte' }], best: 'hidden',
    help: 'Data urodzenia i miejsce to często fragmenty haseł i odpowiedzi na pytania bezpieczeństwa. Przydają się też przy kradzieży tożsamości.',
    issue: 'Data urodzenia i miasto są publiczne.'
  },
  {
    id: 'vacation', section: 'Media społecznościowe', label: 'Zdjęcia z wakacji', initial: 'live',
    options: [{ value: 'live', label: 'Na bieżąco z lokalizacją' }, { value: 'after', label: 'Po powrocie' }], best: 'after',
    help: 'Relacja na żywo z drugiego końca świata to informacja, że mieszkanie stoi puste. Wspomnienia można publikować po powrocie.',
    issue: 'Publikujesz na bieżąco, gdzie jesteś.'
  },
  {
    id: 'exif', section: 'Telefon', label: 'Zapisywanie lokalizacji w zdjęciach (EXIF)', initial: 'on',
    options: [{ value: 'on', label: 'Włączone' }, { value: 'off', label: 'Wyłączone' }], best: 'off',
    help: 'Zdjęcie wysłane jako plik może zawierać dokładne współrzędne miejsca, np. Twojego domu. Wiele serwisów usuwa te dane, ale komunikatory przy wysyłaniu plików już nie zawsze.',
    issue: 'Zdjęcia zapisują dokładną lokalizację.'
  },
  {
    id: 'location', section: 'Telefon', label: 'Dostęp aplikacji do lokalizacji', initial: 'always',
    options: [{ value: 'always', label: 'Zawsze' }, { value: 'using', label: 'Tylko podczas używania' }], best: 'using',
    help: 'Aplikacja z dostępem „zawsze” może budować pełną mapę Twojego dnia, a dane o lokalizacji są sprzedawane przez brokerów danych.',
    issue: 'Aplikacje mogą śledzić lokalizację cały czas.'
  },
  {
    id: 'permissions', section: 'Telefon', label: 'Uprawnienia aplikacji „Latarka”', initial: 'all',
    options: [{ value: 'all', label: 'Kontakty, mikrofon, lokalizacja' }, { value: 'none', label: 'Żadnych zbędnych' }], best: 'none',
    help: 'Latarka nie potrzebuje kontaktów ani mikrofonu. Nadmiarowe uprawnienia to typowy objaw aplikacji, które zbierają dane. Raz na jakiś czas przejrzyj uprawnienia w ustawieniach telefonu.',
    issue: 'Aplikacja ma uprawnienia niezwiązane z jej działaniem.'
  },
  {
    id: 'adid', section: 'Telefon', label: 'Śledzenie reklamowe między aplikacjami', initial: 'on',
    options: [{ value: 'on', label: 'Zezwalaj' }, { value: 'off', label: 'Poproś aplikacje o brak śledzenia' }], best: 'off',
    help: 'Identyfikator reklamowy pozwala łączyć Twoją aktywność z różnych aplikacji w jeden profil. iOS i Android pozwalają to ograniczyć.',
    issue: 'Aplikacje mogą łączyć Twoją aktywność w jeden profil reklamowy.'
  },
  {
    id: 'cookies', section: 'Konta i przeglądarka', label: 'Banery zgody na ciasteczka', initial: 'all',
    options: [{ value: 'all', label: 'Klikam „Akceptuj wszystkie”' }, { value: 'necessary', label: 'Wybieram „Tylko niezbędne”' }], best: 'necessary',
    help: 'Zgodnie z RODO odmowa powinna być tak samo łatwa jak zgoda. Niezbędne ciasteczka wystarczą, żeby strona działała.',
    issue: 'Zgadzasz się na wszystkie ciasteczka śledzące.'
  },
  {
    id: 'recovery', section: 'Konta i przeglądarka', label: 'Odzyskiwanie konta pocztowego', initial: 'question',
    options: [{ value: 'question', label: 'Pytanie: nazwisko panieńskie matki' }, { value: 'key', label: 'Klucz odzyskiwania lub drugi adres' }], best: 'key',
    help: 'Odpowiedzi na pytania pomocnicze często da się znaleźć w internecie. Skrzynka pocztowa to klucz do resetowania haseł wszędzie indziej, więc jej odzyskiwanie musi być mocne.',
    issue: 'Konto pocztowe da się odzyskać odpowiedzią, którą można znaleźć w sieci.'
  },
  {
    id: 'breach', section: 'Konta i przeglądarka', label: 'Powiadomienia o wyciekach danych', initial: 'off',
    options: [{ value: 'off', label: 'Wyłączone' }, { value: 'on', label: 'Włączone' }], best: 'on',
    help: 'Menedżery haseł i serwis Have I Been Pwned informują, gdy Twój adres pojawi się w wycieku. Wtedy od razu zmieniasz hasło w tym serwisie.',
    issue: 'Nie dowiesz się, że Twoje dane wyciekły.'
  },
  {
    id: 'alias', section: 'Konta i przeglądarka', label: 'Adres e-mail przy rejestracji w sklepach i newsletterach', initial: 'main',
    options: [{ value: 'main', label: 'Główny adres' }, { value: 'alias', label: 'Osobny adres lub alias' }], best: 'alias',
    help: 'Alias (np. funkcja ukrywania adresu w Apple albo w skrzynce pocztowej) chroni główny adres przed spamem i wyciekami. Gdy alias zaczyna dostawać phishing, wiesz, który serwis wyciekł.',
    issue: 'Wszędzie używasz tego samego, głównego adresu.'
  }
];

export default {
  id: 'prywatnosc',
  title: 'Audyt prywatności',
  category: 'ludzie',
  icon: 'eye',
  minutes: 8,
  summary: 'Przeglądasz własny ślad w sieci: ustawienia profilu, zdjęcia z lokalizacją, uprawnienia aplikacji, zgody na ciasteczka i odzyskiwanie konta. Każda zmiana zmniejsza to, co da się o Tobie znaleźć.',
  lesson: [
    'Przestępcy często zaczynają od <strong>OSINT</strong>, czyli zbierania informacji z publicznych źródeł. Profil w mediach społecznościowych, zdjęcia i stare konta mówią o Tobie więcej, niż myślisz.',
    'Z tych okruchów powstaje spersonalizowany phishing, odpowiedzi na pytania pomocnicze, a czasem kradzież tożsamości.',
    'Prywatność to nie paranoja, tylko higiena: mniej publicznych danych oznacza mniej materiału dla oszusta.',
    'Ustawienia w grze odpowiadają tym, które znajdziesz w prawdziwych aplikacjach. Po grze warto przejść je u siebie.'
  ],
  takeaways: [
    'Profil tylko dla znajomych, bez daty urodzenia i relacji z urlopu na żywo.',
    'Wyłącz lokalizację w zdjęciach, daj aplikacjom tylko potrzebne uprawnienia i lokalizację „podczas używania”.',
    'Wybieraj „Tylko niezbędne” ciasteczka i ogranicz śledzenie reklamowe.',
    'Skrzynka pocztowa to klucz do wszystkich kont: mocne odzyskiwanie i 2FA.',
    'Aliasy e-mail i alerty o wyciekach pomagają szybko zauważyć problem.'
  ],
  mount(stage, ctx) {
    mountConfigAudit(stage, ctx, {
      settings: SETTINGS,
      title: 'Twój cyfrowy ślad',
      subtitle: 'Profil, telefon i konta Anny Kowalskiej',
      iconName: 'eye',
      okMessage: 'Twój ślad w sieci jest dużo mniejszy. Oszust znajdzie niewiele materiału do spersonalizowanego ataku.'
    });
  }
};

export function examPool() {
  return settingsToQuestions(SETTINGS);
}
