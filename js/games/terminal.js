import { h, button, feedback, rich } from '../ui.js';
import { createTerminal, dir, file } from '../terminal-engine.js';
import { icon } from '../icons.js';

const USER = 'kursant';
const HOST = 'kali';
const HOME = `/home/${USER}`;

function buildFileSystem() {
  return dir({
    home: dir({
      [USER]: dir({
        'notatki.txt': file('Witaj w terminalu!\nTwoja misja: znajdź ukryty klucz w katalogu domowym.\nWskazówka: pliki zaczynające się od kropki są ukryte.'),
        '.ukryty_klucz': file('FLAGA{terminal_to_twoj_przyjaciel}\nBrawo! Pliki z kropką na początku nazwy nie pokazują się w zwykłym ls.\nTak często wyglądają pliki konfiguracyjne, np. .bashrc albo .ssh', '-rw-------'),
        '.bashrc': file('alias ll="ls -la"\nexport PS1="\\u@\\h:\\w$ "'),
        dokumenty: dir({
          'raport.txt': file('Raport bezpieczeństwa\n- serwer WWW: aktualny\n- router: ZMIENIĆ domyślne hasło admin/admin!\n- kopie zapasowe: codziennie o 2:00\n- SSH: wyłączyć logowanie hasłem, zostawić klucze'),
          'plan.txt': file('1. Opanować terminal\n2. Zrozumieć sieci\n3. Poznać ataki, żeby skutecznie się przed nimi bronić')
        }),
        pobrane: dir({})
      })
    }),
    etc: dir({
      hostname: file(HOST),
      'os-release': file('PRETTY_NAME="Kali GNU/Linux Rolling"\nNAME="Kali GNU/Linux"\nID=kali\nID_LIKE=debian'),
      shadow: file('Ten plik przechowuje skróty haseł użytkowników.', '-rw-r-----', 'root')
    }),
    tmp: dir({}),
    var: dir({
      log: dir({
        'auth.log': file(
          [
            'Oct 14 08:01:12 kali sshd[812]: Accepted publickey for kursant from 192.168.1.20 port 51522',
            'Oct 14 08:15:40 kali sshd[901]: Failed password for root from 203.0.113.45 port 40112',
            'Oct 14 08:15:42 kali sshd[901]: Failed password for root from 203.0.113.45 port 40118',
            'Oct 14 08:15:44 kali sshd[903]: Failed password for invalid user admin from 203.0.113.45 port 40121',
            'Oct 14 08:15:47 kali sshd[905]: Failed password for invalid user test from 203.0.113.45 port 40130',
            'Oct 14 09:02:03 kali sudo: kursant : TTY=pts/0 ; PWD=/home/kursant ; COMMAND=/usr/bin/apt update',
            'Oct 14 09:30:55 kali sshd[1022]: Accepted publickey for kursant from 192.168.1.20 port 52210'
          ].join('\n'),
          '-rw-r--r--'
        )
      })
    })
  });
}

const MISSIONS = [
  {
    title: 'Kim jestem?',
    task: 'Sprawdź, jakie konto jest teraz zalogowane.',
    hint: 'Wpisz <code>whoami</code> (ang. who am I, kim jestem) i naciśnij Enter.',
    explain: '<code>whoami</code> zwraca nazwę użytkownika. To pierwsze, co sprawdza administrator, a także pentester po uzyskaniu dostępu: z jakimi uprawnieniami tu jestem? W Kali od 2020 roku domyślnie pracujesz jako zwykły użytkownik, nie root.',
    check: (s) => s.last.name === 'whoami'
  },
  {
    title: 'Gdzie jestem?',
    task: 'Wyświetl pełną ścieżkę katalogu, w którym teraz jesteś.',
    hint: 'Wpisz <code>pwd</code> (print working directory).',
    explain: '<code>/home/kursant</code> to Twój katalog domowy. W Linuksie wszystko zaczyna się od katalogu głównego <code>/</code>, a znak <code>~</code> to skrót do katalogu domowego.',
    check: (s) => s.last.name === 'pwd'
  },
  {
    title: 'Co tu jest?',
    task: 'Wyświetl zawartość bieżącego katalogu.',
    hint: 'Wpisz <code>ls</code> (list).',
    explain: 'Niebieskie nazwy to katalogi, białe to pliki. Zauważ, że nie widać wszystkiego. Do tego jeszcze wrócimy.',
    check: (s) => s.last.name === 'ls' && s.cwd === HOME && !s.last.targets.length
  },
  {
    title: 'Wejdź głębiej',
    task: 'Przejdź do katalogu <code>dokumenty</code>.',
    hint: 'Wpisz <code>cd dokumenty</code>. Możesz wpisać <code>cd dok</code> i nacisnąć Tab, terminal dokończy nazwę.',
    explain: 'Prompt zmienił się na <code>~/dokumenty</code>. Tab to najważniejszy klawisz w terminalu: dokańcza nazwy i chroni przed literówkami.',
    check: (s) => s.cwd === `${HOME}/dokumenty`
  },
  {
    title: 'Przeczytaj raport',
    task: 'Wyświetl zawartość pliku <code>raport.txt</code>.',
    hint: 'Wpisz <code>cat raport.txt</code>.',
    explain: '<code>cat</code> wypisuje plik na ekran. W raporcie widać typowe zalecenia: zmiana domyślnych haseł, kopie zapasowe, logowanie SSH kluczem zamiast hasła.',
    check: (s) => s.read.has(`${HOME}/dokumenty/raport.txt`)
  },
  {
    title: 'Poziom wyżej',
    task: 'Wróć do katalogu domowego, o jeden poziom wyżej.',
    hint: 'Wpisz <code>cd ..</code> (dwie kropki oznaczają katalog nadrzędny). Działa też samo <code>cd</code>.',
    explain: '<code>..</code> to zawsze katalog wyżej, a <code>.</code> to katalog bieżący. Te dwa skróty istnieją w każdym katalogu.',
    check: (s) => s.cwd === HOME && s.last.name === 'cd'
  },
  {
    title: 'Ukryte pliki',
    task: 'Wyświetl zawartość katalogu razem z ukrytymi plikami.',
    hint: 'Dodaj do <code>ls</code> przełącznik <code>-a</code> (all): <code>ls -a</code>.',
    explain: 'Pojawiły się pliki z kropką na początku nazwy, np. <code>.bashrc</code>. Linux ukrywa je, bo to zwykle konfiguracja. Atakujący i obrońcy zawsze zaglądają też tutaj.',
    check: (s) => s.last.name === 'ls' && s.last.flags.has('a') && s.cwd === HOME
  },
  {
    title: 'Znajdź flagę',
    task: 'Odczytaj zawartość ukrytego pliku z kluczem.',
    hint: 'Wpisz <code>cat .ukryty_klucz</code>. Pamiętaj o kropce na początku.',
    explain: 'Zdobyta flaga! W zawodach CTF (Capture The Flag) zadania kończą się właśnie znalezieniem takiego tekstu. To świetny i legalny sposób nauki.',
    check: (s) => s.read.has(`${HOME}/.ukryty_klucz`)
  },
  {
    title: 'Szczegóły plików',
    task: 'Wyświetl pliki w długim formacie, z uprawnieniami i rozmiarem.',
    hint: 'Wpisz <code>ls -l</code> albo połącz przełączniki: <code>ls -la</code>.',
    explain: 'Pierwsza kolumna, np. <code>-rw-------</code>, to uprawnienia. Plik z kluczem może czytać tylko właściciel. Uprawnienia ćwiczysz w następnej grze.',
    check: (s) => s.last.name === 'ls' && s.last.flags.has('l')
  },
  {
    title: 'Własne laboratorium',
    task: 'Utwórz w katalogu domowym nowy katalog o nazwie <code>lab</code>.',
    hint: 'Wpisz <code>mkdir lab</code> (make directory), a potem sprawdź wynik przez <code>ls</code>.',
    explain: 'Porządek w katalogach to podstawa. Pentesterzy trzymają wyniki każdego zlecenia w osobnym katalogu, żeby niczego nie pomieszać.',
    check: (s, getNode) => getNode(`${HOME}/lab`)?.type === 'dir'
  },
  {
    title: 'Mój adres w sieci',
    task: 'Sprawdź adres IP swojego komputera.',
    hint: 'Wpisz <code>ip a</code> (skrót od ip address).',
    explain: '<code>lo</code> to interfejs pętli zwrotnej (127.0.0.1, czyli ten sam komputer). <code>eth0</code> to karta sieciowa z adresem 192.168.1.20 w sieci lokalnej. Adresy IP poznasz bliżej w module o sieciach.',
    check: (s) => ['ip', 'ifconfig'].includes(s.last.name)
  },
  {
    title: 'Pierwsze śledztwo',
    task: 'W pliku <code>/var/log/auth.log</code> znajdź tylko linie z nieudanymi logowaniami (słowo <code>Failed</code>).',
    hint: 'Wpisz <code>grep Failed /var/log/auth.log</code>. grep pokazuje tylko linie zawierające podany tekst.',
    explain: 'Widać serię nieudanych prób z adresu 203.0.113.45 na konta root, admin i test, w odstępach 2 sekund. To klasyczny atak zgadywania haseł. Takie logi przeanalizujesz w module Analityk SOC.',
    check: (s) => s.last.name === 'grep' && s.last.matched > 0 && /fail/i.test(s.last.pattern ?? '')
  }
];

export default {
  id: 'terminal',
  title: 'Pierwsze kroki w terminalu',
  category: 'linux',
  icon: 'terminal',
  minutes: 12,
  summary: 'Symulator terminala Kali Linux. Wykonaj 12 misji: poruszaj się po katalogach, znajdź ukryty plik z flagą i przeszukaj log logowań.',
  lesson: [
    '<strong>Terminal</strong> to okno, w którym wydajesz komputerowi polecenia tekstem zamiast klikać. Wygląda surowo, ale daje pełną kontrolę i działa tak samo na serwerach, które nie mają ekranu.',
    '<strong>Kali Linux</strong> to odmiana Linuksa (oparta na Debianie) przygotowana dla specjalistów od bezpieczeństwa: ma zainstalowane setki narzędzi do testów. Podstawowe polecenia są w niej takie same jak w każdym innym Linuksie, więc ta nauka przyda się wszędzie.',
    'Linia z nazwą użytkownika, np. <code>kursant@kali:~$</code>, to <strong>prompt</strong>. Mówi kto (kursant), na jakim komputerze (kali) i w którym katalogu (~, czyli katalog domowy). Znak <code>$</code> oznacza zwykłego użytkownika, a <code>#</code> administratora (root).',
    'Polecenie wpisujesz i zatwierdzasz klawiszem Enter. Klawisz Tab dokańcza nazwy, a strzałki w górę i w dół przywołują poprzednie polecenia. Gdy się zgubisz, wpisz <code>help</code>.'
  ],
  takeaways: [
    '<code>pwd</code> mówi, gdzie jesteś, <code>ls</code> co jest wokół, <code>cd</code> przenosi Cię gdzie indziej.',
    '<code>ls -la</code> pokazuje wszystko: ukryte pliki i uprawnienia. To odruch każdego, kto bada system.',
    '<code>cat</code> czyta pliki, <code>grep</code> wyszukuje w nich tekst. Razem to podstawowe narzędzia analizy logów.',
    'Tab dokańcza nazwy, strzałka w górę przywołuje historię, a <code>man polecenie</code> wyświetla instrukcję.',
    'Kali najlepiej uruchamiać w maszynie wirtualnej (UTM na Macu, VirtualBox na Windows), a nie jako główny system.'
  ],
  mount(stage, ctx) {
    let missionIndex = 0;
    const hintsUsed = new Set();
    const terminal = createTerminal({
      tree: buildFileSystem(),
      user: USER,
      host: HOST,
      quick: ['help', 'ls', 'ls -a', 'pwd', 'cd ..', 'clear'],
      intro: [
        ['Kali GNU/Linux Rolling (symulator edukacyjny)', 'term-accent'],
        ['Wpisz help, żeby zobaczyć listę poleceń. Misje znajdziesz obok terminala.', 'term-muted']
      ],
      onRun: checkMission
    });
    const missionList = h('ol', { class: 'missions' });
    const missionPanel = h('aside', { class: 'panel' }, h('div', { class: 'panel-title' }, icon('flag'), h('h2', { class: 't-h4', text: 'Misje' })), missionList);

    stage.append(h('div', { class: 'split' }, h('div', { class: 'stage' }, terminal.element, terminal.quickBar), missionPanel));

    function checkMission(state) {
      const mission = MISSIONS[missionIndex];
      if (!mission || !mission.check(state, terminal.getNode)) return;
      missionIndex += 1;
      renderMissions();
      if (missionIndex === MISSIONS.length) {
        const score = MISSIONS.reduce((sum, _, i) => sum + (hintsUsed.has(i) ? 1 : 2), 0);
        terminal.print('Wszystkie misje ukończone. Świetna robota!', 'term-accent');
        const finishBtn = button({ label: 'Zobacz podsumowanie', variant: 'primary', iconAfter: 'arrowRight', onclick: () => ctx.finish({ score, max: MISSIONS.length * 2 }) });
        missionPanel.append(feedback('ok', 'Terminal opanowany', 'Wszystkie misje wykonane. Możesz jeszcze poeksperymentować z poleceniami albo przejść do podsumowania. Następny krok: terminal poziom 2, czyli mini CTF.'), finishBtn);
      }
    }

    function renderMissions() {
      ctx.progress(missionIndex, MISSIONS.length);
      missionList.replaceChildren(
        ...MISSIONS.map((mission, i) => {
          const done = i < missionIndex;
          const current = i === missionIndex;
          const body = h('div', { class: 'mission-body' }, h('strong', { text: mission.title }));
          if (current) {
            const hintBox = h('div');
            const hintBtn = button({
              label: hintsUsed.has(i) ? 'Podpowiedź widoczna' : 'Pokaż podpowiedź',
              iconName: 'lightbulb',
              size: 'sm',
              disabled: hintsUsed.has(i),
              onclick: () => {
                hintsUsed.add(i);
                hintBtn.disabled = true;
                hintBox.replaceChildren(feedback('info', null, mission.hint));
              }
            });
            if (hintsUsed.has(i)) hintBox.append(feedback('info', null, mission.hint));
            body.append(rich(mission.task, 'p'), hintBox, hintBtn);
          }
          if (done && i === missionIndex - 1) body.append(feedback('ok', 'Zaliczone', mission.explain));
          return h(
            'li',
            { class: `mission${done ? ' is-done' : ''}${current ? ' is-current' : ''}`, 'aria-current': current ? 'step' : null },
            h('span', { class: 'mission-state' }, done ? icon('check') : h('span', { text: String(i + 1) })),
            body
          );
        })
      );
    }

    renderMissions();
  }
};
