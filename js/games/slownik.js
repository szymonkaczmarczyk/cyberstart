import { h, button, feedback, onKey, isTyping, shuffle, plural } from '../ui.js';
import { cardStats, isCardDue, reviewCard } from '../progress.js';
import { icon } from '../icons.js';

const TERMS = [
  ['Phishing', 'Fałszywa wiadomość podszywająca się pod zaufaną instytucję lub osobę, która ma skłonić do kliknięcia, podania danych albo otwarcia załącznika.'],
  ['Socjotechnika', 'Manipulowanie ludźmi zamiast łamania zabezpieczeń technicznych, np. telefon „z działu IT” z prośbą o kod.'],
  ['Malware', 'Złośliwe oprogramowanie: ogólna nazwa wirusów, trojanów, programów szpiegujących i ransomware.'],
  ['Ransomware', 'Malware, które szyfruje pliki ofiary i żąda okupu za ich odzyskanie. Najlepsza obrona to kopie zapasowe offline.'],
  ['Brute force', 'Atak siłowy: systematyczne zgadywanie hasła lub klucza, próba po próbie.'],
  ['Credential stuffing', 'Automatyczne próby logowania danymi wykradzionymi z innego serwisu. Działa, gdy ludzie używają tych samych haseł wszędzie.'],
  ['2FA / MFA', 'Uwierzytelnianie dwu- lub wieloskładnikowe: obok hasła potrzebny jest drugi dowód tożsamości, np. kod z aplikacji lub klucz sprzętowy.'],
  ['Passkey', 'Nowoczesny sposób logowania bez hasła, oparty na kryptografii klucza publicznego i odporny na phishing.'],
  ['Menedżer haseł', 'Program, który generuje i przechowuje unikalne, długie hasła. Pamiętasz tylko jedno hasło główne.'],
  ['Hash (skrót)', 'Jednokierunkowy „odcisk palca” danych o stałej długości. Nie da się go odwrócić, a najmniejsza zmiana danych daje zupełnie inny skrót.'],
  ['Sól (salt)', 'Losowy dodatek do hasła przed liczeniem skrótu. Sprawia, że te same hasła mają różne skróty i utrudnia masowe łamanie.'],
  ['Szyfrowanie symetryczne', 'Ten sam klucz szyfruje i odszyfrowuje dane. Szybkie, np. AES.'],
  ['Szyfrowanie asymetryczne', 'Para kluczy: publiczny szyfruje (lub weryfikuje podpis), prywatny odszyfrowuje (lub podpisuje). Np. RSA, krzywe eliptyczne.'],
  ['TLS / HTTPS', 'Protokół szyfrujący połączenie między przeglądarką a serwerem. Kłódka w pasku adresu.'],
  ['Certyfikat', 'Elektroniczny dowód tożsamości serwera, wystawiony przez zaufany urząd certyfikacji. Potwierdza, że rozmawiasz z właścicielem domeny.'],
  ['Adres IP', 'Numer urządzenia w sieci, np. 192.168.1.20 (IPv4) albo 2001:db8::1 (IPv6).'],
  ['Adres MAC', 'Fizyczny identyfikator karty sieciowej, używany w obrębie sieci lokalnej.'],
  ['Port', 'Numer „drzwi” na komputerze, za którymi czeka konkretna usługa, np. 443 dla HTTPS.'],
  ['DNS', 'System zamieniający nazwy domen (np. sklep.pl) na adresy IP. Książka telefoniczna internetu.'],
  ['Router', 'Urządzenie łączące sieci i kierujące ruchem między nimi, np. Twoją sieć domową z internetem.'],
  ['NAT', 'Tłumaczenie adresów: wiele urządzeń z adresami prywatnymi korzysta z jednego publicznego adresu routera.'],
  ['Firewall', 'Zapora sieciowa: przepuszcza lub blokuje ruch według reguł (adres, port, protokół).'],
  ['VPN', 'Szyfrowany tunel do innej sieci. Firmy używają go, żeby pracownicy bezpiecznie łączyli się z siecią firmową.'],
  ['Podatność', 'Słabość w programie lub konfiguracji, którą można wykorzystać do ataku. Znane podatności mają numery CVE.'],
  ['Exploit', 'Kod lub technika wykorzystująca konkretną podatność.'],
  ['Zero-day', 'Podatność, o której producent jeszcze nie wie albo na którą nie ma poprawki.'],
  ['Łatka (patch)', 'Aktualizacja usuwająca błąd lub podatność. Regularne aktualizacje to jedna z najskuteczniejszych ochron.'],
  ['Pentest', 'Test penetracyjny: kontrolowana próba włamania wykonywana za pisemną zgodą właściciela, żeby znaleźć słabe punkty.'],
  ['Red team / Blue team', 'Red team symuluje atakujących, blue team broni i wykrywa ataki. Purple team to ich współpraca.'],
  ['SOC', 'Security Operations Center: zespół monitorujący bezpieczeństwo firmy i reagujący na incydenty.'],
  ['SIEM', 'System zbierający i analizujący logi z wielu źródeł, który alarmuje o podejrzanych zdarzeniach.'],
  ['IDS / IPS', 'Systemy wykrywania (IDS) i zapobiegania (IPS) włamaniom, analizujące ruch sieciowy pod kątem ataków.'],
  ['Man-in-the-middle', 'Atak, w którym ktoś wpina się między dwie rozmawiające strony i podsłuchuje lub zmienia komunikację.'],
  ['DDoS', 'Rozproszony atak odmowy usługi: zalewanie serwera ruchem z wielu źródeł, aż przestanie odpowiadać.'],
  ['Botnet', 'Sieć przejętych urządzeń (często routerów i kamer IoT) sterowanych zdalnie przez przestępców.'],
  ['SQL injection', 'Wstrzyknięcie kodu SQL przez dane od użytkownika, gdy aplikacja skleja zapytania z tekstem.'],
  ['XSS', 'Cross-site scripting: wstrzyknięcie skryptu, który wykona się w przeglądarce innych użytkowników strony.'],
  ['IDOR', 'Błąd, w którym zmiana identyfikatora w adresie (np. numeru faktury) daje dostęp do cudzych danych.'],
  ['Kali Linux', 'Dystrybucja Linuksa oparta na Debianie, z gotowym zestawem narzędzi do testów bezpieczeństwa.'],
  ['root / sudo', 'root to administrator systemu Linux. sudo pozwala zwykłemu użytkownikowi wykonać pojedyncze polecenie z uprawnieniami roota.'],
  ['Zasada najmniejszych uprawnień', 'Każdy użytkownik i program dostaje tylko te uprawnienia, których naprawdę potrzebuje.'],
  ['Zero trust', 'Model bezpieczeństwa „nie ufaj nikomu domyślnie”: każde żądanie jest weryfikowane, nawet z wnętrza sieci firmy.'],
  ['Kopia 3-2-1', '3 kopie danych, na 2 różnych nośnikach, w tym 1 poza domem lub biurem (najlepiej offline).'],
  ['CTF', 'Capture The Flag: zawody i zadania, w których szuka się ukrytych „flag”, rozwiązując problemy bezpieczeństwa. Świetny sposób nauki.']
];

const SESSION_SIZE = 15;
export const TERM_NAMES = TERMS.map(([term]) => term);

export default {
  id: 'slownik',
  title: 'Słowniczek na fiszkach',
  category: 'wiedza',
  icon: 'book',
  minutes: 10,
  summary: `${TERMS.length} najważniejszych pojęć: od phishingu po zero trust. Fiszki same pilnują powtórek: te, które znasz, wracają po kilku dniach, a trudne częściej.`,
  badge() {
    const { due } = cardStats(TERM_NAMES);
    return due ? `${due} do powtórki` : null;
  },
  lesson: [
    'Fiszki działają najlepiej, gdy najpierw próbujesz sobie przypomnieć odpowiedź, a dopiero potem ją sprawdzasz. To tak zwane aktywne przypominanie.',
    'Talia korzysta z <strong>powtórek w odstępach</strong>. Fiszka oznaczona jako „Znam” wraca po 1 dniu, potem po 3, 7, 14 i 30 dniach. „Powtórzę” odsyła ją na początek cyklu.',
    `Jedna sesja to najwyżej ${SESSION_SIZE} fiszek, które akurat czekają na powtórkę. Klawisze: <code>Spacja</code> odwraca, <code>Z</code> znam, <code>P</code> powtórzę.`
  ],
  takeaways: [
    'Krótka sesja codziennie daje więcej niż jedna długa raz w miesiącu. Fiszki same podpowiedzą, kiedy wrócić.',
    'Nieznane pojęcie z artykułu lub filmu? Sprawdź je tutaj albo w słowniczku CERT Polska.',
    'Kolejny krok: OverTheWire Bandit (terminal), TryHackMe ścieżka Pre Security, PortSwigger Web Security Academy.'
  ],
  mount(stage, ctx) {
    const all = TERMS.map(([term, definition]) => ({ term, definition }));
    const due = shuffle(all.filter((card) => isCardDue(card.term)));
    const practice = due.length === 0;
    let queue = (practice ? shuffle(all) : due).slice(0, practice ? 10 : SESSION_SIZE);
    const sessionSize = queue.length;
    let known = 0;
    let flipped = false;
    const card = h('button', { type: 'button', class: 'flashcard', 'aria-live': 'polite', onclick: flip });
    const counter = h('span', { class: 't-small t-muted' });
    const knowBtn = button({ label: 'Znam', variant: 'primary', iconName: 'check', shortcut: 'Z', onclick: () => answer(true) });
    const againBtn = button({ label: 'Powtórzę', iconName: 'rotate', shortcut: 'P', onclick: () => answer(false) });
    const stats = h('div', { class: 'deck-stats' });
    const deckArea = h('div', { class: 'deck' }, stats, card, h('div', { class: 'btn-row deck-actions' }, againBtn, knowBtn), counter);

    function renderStats() {
      const { learned, seen } = cardStats(TERM_NAMES);
      stats.replaceChildren(
        h('span', { class: 'tag' }, icon('check'), `Utrwalone: ${learned} z ${TERMS.length}`),
        h('span', { class: 'tag' }, icon('book'), `Poznane: ${seen}`),
        practice ? h('span', { class: 'tag tag-accent' }, icon('sparkles'), 'Powtórka dodatkowa') : null
      );
    }

    function render() {
      const current = queue[0];
      if (!current) return complete();
      ctx.progress(known, sessionSize);
      card.classList.toggle('is-flipped', flipped);
      card.replaceChildren(
        flipped
          ? h('span', { class: 'flashcard-back' }, h('span', { class: 't-caps flashcard-label', text: current.term }), h('span', { class: 'flashcard-def', text: current.definition }))
          : h('span', { class: 'flashcard-front' }, h('span', { class: 'flashcard-term', text: current.term }), h('span', { class: 't-small t-muted' }, icon('rotate'), ' Kliknij lub naciśnij spację, żeby odwrócić'))
      );
      card.setAttribute('aria-label', flipped ? `${current.term}: ${current.definition}` : `Pojęcie: ${current.term}. Odwróć, żeby zobaczyć definicję.`);
      counter.textContent = `W tej sesji: ${known} z ${sessionSize} znane. Zostało: ${queue.length}.`;
      knowBtn.disabled = !flipped;
      againBtn.disabled = !flipped;
    }

    function flip() {
      flipped = !flipped;
      render();
    }

    function answer(isKnown) {
      if (!flipped || !queue.length) return;
      const [current, ...rest] = queue;
      reviewCard(current.term, isKnown);
      queue = isKnown ? rest : [...rest, current];
      if (isKnown) known += 1;
      flipped = false;
      renderStats();
      render();
      card.classList.remove('pop');
      void card.offsetWidth;
      card.classList.add('pop');
    }

    function complete() {
      stopKeys();
      const remaining = cardStats(TERM_NAMES).due;
      deckArea.replaceChildren(
        stats,
        feedback('ok', 'Sesja zakończona', remaining ? `Przerobione: ${sessionSize} ${plural(sessionSize, 'fiszka', 'fiszki', 'fiszek')}. Na powtórkę czeka jeszcze ${remaining}, możesz zagrać ponownie.` : 'Na dziś wszystko powtórzone. Fiszki same wrócą, gdy przyjdzie ich czas.'),
        h('div', { class: 'btn-row' }, button({ label: 'Zobacz podsumowanie', variant: 'primary', iconAfter: 'arrowRight', onclick: () => ctx.finish({ score: sessionSize, max: sessionSize }) }))
      );
      ctx.progress(sessionSize, sessionSize);
    }

    renderStats();
    const stopKeys = onKey(ctx.signal, (event) => {
      if (isTyping(event)) return;
      const key = event.key.toLowerCase();
      if (event.key === ' ' && event.target !== card) {
        event.preventDefault();
        flip();
      } else if (key === 'z') answer(true);
      else if (key === 'p') answer(false);
    });

    const search = h('input', { class: 'input', id: 'term-search', type: 'search', placeholder: 'np. firewall', autocomplete: 'off' });
    const list = h('dl', { class: 'glossary' });
    const empty = h('p', { class: 'hint', hidden: true, text: 'Brak pojęć pasujących do wyszukiwania. Spróbuj krótszego słowa.' });

    function renderList() {
      const q = search.value.trim().toLowerCase();
      const items = TERMS.filter(([term, definition]) => !q || term.toLowerCase().includes(q) || definition.toLowerCase().includes(q)).sort(([a], [b]) => a.localeCompare(b, 'pl'));
      list.replaceChildren(...items.map(([term, definition]) => h('div', { class: 'glossary-item' }, h('dt', { text: term }), h('dd', { text: definition }))));
      empty.hidden = items.length > 0;
    }
    search.addEventListener('input', renderList);
    renderList();

    stage.append(
      h('section', { class: 'panel' }, deckArea),
      h(
        'details',
        { class: 'lesson' },
        h('summary', {}, icon('search'), h('span', { text: `Wszystkie pojęcia (${TERMS.length}) z wyszukiwarką` }), icon('chevronDown')),
        h('div', { class: 'lesson-body glossary-body' }, h('div', { class: 'field' }, h('label', { for: 'term-search', text: 'Szukaj pojęcia' }), search), empty, list)
      )
    );
    render();
  }
};
