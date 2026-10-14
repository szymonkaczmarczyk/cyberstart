import { h, button, feedback, runQuiz, shuffle, draw } from '../ui.js';
import { icon } from '../icons.js';

const TOOL_POOL = [
  { name: 'Nmap', purpose: 'Sprawdza, jakie urządzenia działają w sieci i jakie porty (usługi) mają otwarte.', note: 'Administratorzy używają go do inwentaryzacji: czy na serwerze nie działa coś, czego nie powinno być.' },
  { name: 'Wireshark', purpose: 'Przechwytuje ruch sieciowy i pokazuje go pakiet po pakiecie.', note: 'Świetny do nauki protokołów i diagnozowania problemów z siecią.' },
  { name: 'Burp Suite', purpose: 'Staje między przeglądarką a stroną i pozwala oglądać oraz zmieniać żądania HTTP.', note: 'Podstawowe narzędzie testerów aplikacji webowych.' },
  { name: 'John the Ripper', purpose: 'Sprawdza siłę haseł, próbując odgadnąć je na podstawie ich skrótów (hashy).', note: 'Firmy używają go w audytach, żeby wyłapać słabe hasła pracowników, zanim zrobi to ktoś inny.' },
  { name: 'Metasploit', purpose: 'Framework do sprawdzania znanych podatności w kontrolowanych testach penetracyjnych.', note: 'Używany tylko w uzgodnionym zakresie testów. Pokazuje, czy brak aktualizacji realnie grozi włamaniem.' },
  { name: 'Aircrack-ng', purpose: 'Zestaw narzędzi do audytu bezpieczeństwa sieci Wi-Fi.', note: 'Pokazuje, dlaczego słabe hasło Wi-Fi i stare szyfrowanie WEP to zły pomysł.' },
  { name: 'Gobuster', purpose: 'Wyszukuje na serwerze WWW ukryte katalogi i pliki, np. zapomniany panel administracyjny.', note: 'Przypomina, że „ukryty adres” to nie zabezpieczenie.' },
  { name: 'Lynis', purpose: 'Audytuje konfigurację Twojego własnego systemu Linux i podpowiada, co wzmocnić.', note: 'Narzędzie typowo obronne. Dobry start do zabezpieczania własnego serwera.' },
  { name: 'Hashcat', purpose: 'Audytuje skróty haseł z wykorzystaniem mocy karty graficznej (GPU).', note: 'Pokazuje w praktyce, dlaczego szybkie funkcje skrótu jak MD5 nie nadają się do haseł.', level: 'zaawansowany' },
  { name: 'Nikto', purpose: 'Skanuje serwer WWW pod kątem znanych błędów konfiguracji i przestarzałego oprogramowania.', note: 'Hałaśliwy, ale szybki przegląd „oczywistych” problemów serwera.', level: 'zaawansowany' },
  { name: 'Autopsy', purpose: 'Informatyka śledcza: analizuje kopię dysku po incydencie i odtwarza usunięte pliki.', note: 'Narzędzie obrońców i biegłych. Pomaga ustalić, co dokładnie zrobił intruz.', level: 'zaawansowany' },
  { name: 'theHarvester', purpose: 'Zbiera publicznie dostępne adresy e-mail i subdomeny organizacji (OSINT).', note: 'Firmy sprawdzają nim, co o nich widać w internecie, zanim zrobi to ktoś do phishingu.', level: 'zaawansowany' },
  { name: 'sqlmap', purpose: 'Sprawdza, czy parametry aplikacji webowej są podatne na SQL injection.', note: 'Używany wyłącznie w uzgodnionym zakresie testów. Pokazuje, jak groźne jest sklejanie zapytań SQL.', level: 'zaawansowany' }
];

const LEGAL_POOL = [
  {
    prompt: 'Skanujesz nmapem swój domowy router i własne komputery, żeby zobaczyć, co jest otwarte.',
    options: [
      { label: 'Wolno', correct: true, why: 'To Twój sprzęt i Twoja sieć. Najlepsze miejsce do nauki.' },
      { label: 'Nie wolno', why: 'Własną sieć możesz badać. Uważaj tylko na sprzęt współlokatorów: on nie jest Twój.' }
    ]
  },
  {
    prompt: 'Sąsiad ma otwarte Wi-Fi bez hasła. Podłączasz się i skanujesz jego urządzenia.',
    options: [
      { label: 'Wolno, skoro sieć jest otwarta', why: 'Brak hasła to nie zgoda. Uzyskiwanie dostępu do cudzych systemów bez zgody jest przestępstwem (art. 267 Kodeksu karnego).' },
      { label: 'Nie wolno', correct: true, why: 'Brak zabezpieczenia nie oznacza zgody. Możesz najwyżej życzliwie powiedzieć sąsiadowi, że warto ustawić hasło.' }
    ]
  },
  {
    prompt: 'Rozwiązujesz maszyny na platformach TryHackMe albo Hack The Box.',
    options: [
      { label: 'Wolno', correct: true, why: 'Te platformy powstały do legalnej nauki. Atakujesz tylko maszyny przygotowane do tego celu, zgodnie z regulaminem.' },
      { label: 'Nie wolno', why: 'To właśnie legalne poligony. Trzymaj się tylko ich regulaminu i zakresu.' }
    ]
  },
  {
    prompt: 'Szef rzuca na korytarzu: „sprawdź, czy da się włamać na nasz serwer”. Zaczynasz test od razu.',
    options: [
      { label: 'W porządku, szef się zgodził', why: 'Ustna rozmowa to za mało. Test penetracyjny wymaga pisemnej zgody z zakresem (co wolno testować), terminem i kontaktem awaryjnym.' },
      { label: 'Najpierw pisemna zgoda z zakresem', correct: true, why: 'Pentesterzy zawsze zaczynają od dokumentu: co, kiedy, jakimi metodami i kogo powiadomić. Chroni to firmę i Ciebie.' }
    ]
  },
  {
    prompt: 'Zauważasz błąd w sklepie internetowym. Chcesz „tylko sprawdzić”, czy da się przez niego zobaczyć zamówienia innych klientów.',
    options: [
      { label: 'Wolno, przecież nic nie zepsuję', why: 'Dostęp do cudzych danych bez zgody to przestępstwo, nawet „dla sprawdzenia”.' },
      { label: 'Nie wolno. Zgłaszam błąd właścicielowi', correct: true, why: 'Zgłoś błąd bez wykorzystywania go. Wiele firm ma program bug bounty albo plik security.txt z kontaktem dla zgłoszeń.' }
    ]
  },
  {
    prompt: 'Instalujesz Kali w maszynie wirtualnej i atakujesz celowo podatną maszynę (np. Metasploitable albo DVWA) w odizolowanej sieci.',
    options: [
      { label: 'Wolno', correct: true, why: 'Własne laboratorium to najlepszy sposób nauki. Pilnuj, żeby podatna maszyna nie była dostępna z internetu.' },
      { label: 'Nie wolno', why: 'To Twoje maszyny w Twojej sieci, więc jak najbardziej wolno.' }
    ]
  },
  {
    prompt: 'Wczoraj Twoje zgłoszenie błędu trafiło do producenta programu. Dziś publikujesz gotowy exploit na GitHubie, zanim wyszła poprawka.',
    level: 'zaawansowany',
    options: [
      { label: 'W porządku, przecież zgłosiłem', why: 'To naraża wszystkich użytkowników, zanim mają szansę się zabezpieczyć.' },
      { label: 'Nie. Daję producentowi czas na poprawkę (odpowiedzialne ujawnienie)', correct: true, why: 'Standardem jest koordynowane ujawnienie: zwykle około 90 dni na poprawkę, potem publikacja szczegółów. W Polsce w koordynacji pomaga CERT Polska.' }
    ]
  },
  {
    prompt: 'W programie bug bounty firmy testujesz też domenę spoza zakresu (scope), bo „przecież też należy do tej firmy”.',
    level: 'zaawansowany',
    options: [
      { label: 'Wolno, to ta sama firma', why: 'Zgoda obejmuje tylko to, co jest wpisane w zakres. Reszta to testowanie bez zgody.' },
      { label: 'Nie wolno. Trzymam się zakresu z regulaminu programu', correct: true, why: 'Zakres to granica zgody. Poza nim nie masz ochrony programu i łamiesz prawo.' }
    ]
  }
];

export default {
  id: 'kali',
  title: 'Narzędzia Kali i etyka',
  category: 'linux',
  icon: 'wrench',
  minutes: 8,
  levels: true,
  summary: 'Dopasuj osiem popularnych narzędzi z Kali Linux do ich zastosowania, a potem rozstrzygnij sześć sytuacji: kiedy wolno ich używać, a kiedy to już przestępstwo.',
  lesson: [
    '<strong>Kali Linux</strong> to darmowa dystrybucja Linuksa rozwijana przez firmę OffSec. Ma gotowy zestaw narzędzi do testów bezpieczeństwa: od skanerów sieci po narzędzia do audytu haseł.',
    'Te same narzędzia służą obu stronom. <strong>Red team</strong> (testerzy) szuka dziur za zgodą klienta, a <strong>blue team</strong> (obrońcy) używa ich, żeby znaleźć problemy przed przestępcami.',
    'Granica jest jedna i prosta: <strong>zgoda właściciela systemu</strong>, najlepiej na piśmie. Bez niej nawet „niewinne sprawdzenie” może być przestępstwem z Kodeksu karnego.',
    'Na start: zainstaluj Kali w maszynie wirtualnej (na Macu UTM, na Windows VirtualBox lub VMware), rób migawki (snapshoty) i ćwicz na legalnych poligonach.'
  ],
  takeaways: [
    'Nmap sprawdza otwarte porty, Wireshark pokazuje ruch, Burp Suite bada aplikacje webowe, John the Ripper audytuje hasła.',
    'Te same narzędzia służą atakującym i obrońcom. Różnicę robi zgoda właściciela systemu.',
    'Pentest zawsze zaczyna się od pisemnej zgody z zakresem, terminem i kontaktem.',
    'Legalne miejsca do ćwiczeń: TryHackMe, Hack The Box, OverTheWire (Bandit to świetny start z terminalem), PortSwigger Web Security Academy.',
    'Znaleziony błąd zgłaszasz właścicielowi i nie wykorzystujesz go.'
  ],
  async mount(stage, ctx) {
    const tools = draw(TOOL_POOL, 8, ctx.level);
    const legal = draw(LEGAL_POOL, 6, ctx.level);
    const total = tools.length + legal.length;
    const matchScore = await playMatching(stage, ctx, total, tools);
    const legalScore = await runQuiz(stage, ctx, legal, { label: 'Sytuacja', offset: tools.length, total });
    ctx.finish({ score: matchScore + legalScore, max: total });
  }
};

function playMatching(stage, ctx, total, tools) {
  return new Promise((resolve) => {
    let selected = null;
    let mistakes = 0;
    let matched = 0;
    const toolButtons = new Map();
    const status = h('div', { 'aria-live': 'polite' });
    const toolsCol = h('div', { class: 'match-col match-tools', role: 'group', 'aria-label': 'Narzędzia' });
    const purposeCol = h('div', { class: 'match-col', role: 'group', 'aria-label': 'Zastosowania' });

    for (const tool of shuffle(tools)) {
      const btn = h('button', { type: 'button', class: 'match-item match-tool mono', 'aria-pressed': 'false', onclick: () => select(tool) }, icon('wrench'), h('span', { text: tool.name }));
      toolButtons.set(tool.name, btn);
      toolsCol.append(btn);
    }

    for (const tool of shuffle(tools)) {
      const btn = h('button', { type: 'button', class: 'match-item match-purpose', onclick: () => attempt(tool, btn) }, h('span', { text: tool.purpose }));
      purposeCol.append(btn);
    }

    function select(tool) {
      selected = tool;
      toolButtons.forEach((btn, name) => btn.setAttribute('aria-pressed', String(name === tool.name)));
      status.replaceChildren(h('p', { class: 'hint', text: `Wybrano ${tool.name}. Teraz kliknij jego zastosowanie po prawej.` }));
    }

    function attempt(tool, btn) {
      if (!selected) {
        status.replaceChildren(feedback('info', null, 'Najpierw wybierz narzędzie z lewej kolumny.'));
        return;
      }
      if (tool.name === selected.name) {
        const toolBtn = toolButtons.get(tool.name);
        [toolBtn, btn].forEach((el) => {
          el.disabled = true;
          el.classList.add('is-matched', 'pop');
          el.setAttribute('aria-pressed', 'false');
        });
        btn.prepend(h('strong', { class: 'mono match-label', text: tool.name }));
        matched += 1;
        ctx.progress(matched, total);
        status.replaceChildren(feedback('ok', `${tool.name}: zgadza się`, tool.note));
        selected = null;
        if (matched === tools.length) {
          const score = Math.max(0, tools.length - mistakes);
          status.append(h('div', { class: 'btn-row' }, button({ label: 'Dalej: kiedy wolno?', variant: 'primary', iconAfter: 'arrowRight', onclick: () => { panel.remove(); resolve(score); } })));
          status.querySelector('.btn-primary').focus();
        }
      } else {
        mistakes += 1;
        btn.classList.remove('shake');
        void btn.offsetWidth;
        btn.classList.add('shake');
        status.replaceChildren(feedback('bad', 'To nie ten opis', `${selected.name} służy do czegoś innego. Przeczytaj opisy jeszcze raz.`));
      }
    }

    const panel = h(
      'section',
      { class: 'panel' },
      h('div', { class: 'panel-title' }, h('span', { class: 'tag tag-accent', text: 'Część 1: dopasuj narzędzia' })),
      h('p', { class: 'question-prompt', text: 'Kliknij narzędzie, a potem opis tego, do czego służy.' }),
      h('div', { class: 'match' }, toolsCol, purposeCol),
      status
    );
    stage.append(panel);
    ctx.progress(0, total);
  });
}

export function examPool() {
  return LEGAL_POOL;
}
