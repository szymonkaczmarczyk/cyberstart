import { h } from './ui.js';

export const dir = (children = {}) => ({ type: 'dir', children });
export const file = (content, mode = '-rw-r--r--', owner) => ({ type: 'file', content, mode, owner });

const MAN_PAGES = {
  ls: 'ls: wyświetla zawartość katalogu.\n  -a  pokazuje też ukryte pliki (zaczynające się od kropki)\n  -l  długi format: uprawnienia, właściciel, rozmiar\nPrzykład: ls -la /etc',
  cd: 'cd: zmienia bieżący katalog.\n  cd nazwa   wejście do katalogu\n  cd ..      katalog wyżej\n  cd ~       katalog domowy\n  cd /       katalog główny systemu',
  cat: 'cat: wyświetla zawartość pliku.\nPrzykład: cat notatki.txt\nPlik o nazwie zaczynającej się od myślnika: cat ./-plik',
  pwd: 'pwd: pokazuje pełną ścieżkę do katalogu, w którym jesteś (print working directory).',
  grep: 'grep: wyszukuje linie zawierające tekst.\n  -i  ignoruje wielkość liter\n  -v  pokazuje linie, które NIE zawierają tekstu\n  -c  zlicza pasujące linie\nPrzykład: grep Failed /var/log/auth.log',
  find: 'find: szuka plików.\n  find KATALOG -name WZORZEC   po nazwie, np. -name "*.txt"\n  find KATALOG -size 1033c     po rozmiarze w bajtach\n  find KATALOG -type f         tylko pliki (d: katalogi)',
  sort: 'sort: sortuje linie.\n  -r  odwrotnie\n  -n  liczbowo',
  uniq: 'uniq: usuwa sąsiadujące powtórzenia (najpierw użyj sort).\n  -c  liczy powtórzenia\n  -u  pokazuje tylko linie, które występują raz',
  wc: 'wc: liczy.\n  -l  liczba linii',
  head: 'head: pierwsze linie.\n  -n LICZBA  ile linii (domyślnie 10)',
  tail: 'tail: ostatnie linie.\n  -n LICZBA  ile linii (domyślnie 10)',
  base64: 'base64: kodowanie Base64.\n  -d  dekodowanie\nPrzykład: base64 -d plik.txt',
  file: 'file: rozpoznaje typ pliku po zawartości.\nPrzykład: file ./*',
  chmod: 'chmod: zmienia uprawnienia.\n  chmod 600 plik     zapis liczbowy\n  chmod u+r plik     dodaj właścicielowi (u) czytanie (r)',
  mkdir: 'mkdir: tworzy nowy katalog.\nPrzykład: mkdir projekty',
  sudo: 'sudo: uruchamia polecenie z uprawnieniami administratora (root).\nZawsze czytaj, co uruchamiasz przez sudo.',
  ip: 'ip: konfiguracja sieci.\n  ip a   pokazuje interfejsy sieciowe i adresy IP',
  whoami: 'whoami: wypisuje nazwę zalogowanego użytkownika.',
  rm: 'rm: usuwa pliki. Nie ma kosza, usunięcie jest od razu.\n  -r  usuwa katalog z zawartością (ostrożnie!)',
  touch: 'touch: tworzy pusty plik albo aktualizuje datę modyfikacji.',
  echo: 'echo: wypisuje tekst.\n  echo tekst > plik.txt    zapisuje do pliku\n  echo tekst >> plik.txt   dopisuje na końcu',
  '|': 'Potok | przekazuje wynik jednego polecenia do następnego, np. sort dane.txt | uniq -c'
};

const HELP = [
  '  pwd, ls [-a] [-l], cd KATALOG      poruszanie się po plikach',
  '  cat PLIK, head, tail [-n N]         czytanie plików',
  '  grep [-i -v -c] TEKST PLIK          wyszukiwanie tekstu',
  '  find KATALOG -name|-size|-type      szukanie plików',
  '  sort [-r -n], uniq [-c -u], wc -l   obróbka tekstu',
  '  file PLIK, base64 [-d] PLIK         typ pliku, Base64',
  '  mkdir, touch, rm, chmod, echo       zmiany w plikach',
  '  whoami, id, hostname, uname -a, ip a  informacje o systemie',
  '  history, clear, man POLECENIE       pomoc i historia',
  '  POLECENIE | POLECENIE               potok: wynik jednego trafia do drugiego'
].join('\n');

function tokenize(input) {
  const tokens = [];
  const pattern = /"([^"]*)"|'([^']*)'|((?:\\.|[^\s"'\\])+)/g;
  let match;
  while ((match = pattern.exec(input))) {
    tokens.push(match[1] ?? match[2] ?? match[3].replace(/\\(.)/g, '$1'));
  }
  return tokens;
}

function splitPipeline(line) {
  const parts = [];
  let current = '';
  let quote = null;
  for (const ch of line) {
    if (quote) {
      if (ch === quote) quote = null;
      current += ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
    } else if (ch === '|') {
      parts.push(current);
      current = '';
    } else current += ch;
  }
  parts.push(current);
  return parts.map((part) => part.trim());
}

function globToRegex(glob) {
  return new RegExp(`^${glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.')}$`);
}

function plain(line) {
  if (typeof line === 'string') return line;
  if (line.parts) return line.parts.map((part) => (typeof part === 'string' ? part : part.text)).join('');
  return line.text;
}

function isBinary(content) {
  return /[\u0000-\u0008\u000e-\u001f\u007f-\u009f]/.test(content);
}

function flagSet(argv, valueFlags = []) {
  const flags = new Set();
  const values = {};
  const rest = [];
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (valueFlags.includes(token)) {
      values[token] = argv[i + 1];
      i += 1;
    } else if (/^-[a-zA-Z]+$/.test(token)) [...token.slice(1)].forEach((flag) => flags.add(flag));
    else rest.push(token);
  }
  return { flags, values, rest };
}

export function createTerminal({ tree, user, host, intro = [], quick = [], onRun, extraCommands = {} }) {
  const home = `/home/${user}`;
  const state = { cwd: home, last: { name: null, flags: new Set(), targets: [] }, read: new Set(), history: [], historyIndex: 0 };
  const output = h('div', { class: 'term-output', role: 'log', 'aria-live': 'polite', 'aria-label': 'Wynik poleceń', tabindex: '0' });
  const promptLabel = h('label', { class: 'term-prompt', for: `term-input` });
  const input = h('input', { class: 'term-input', id: 'term-input', name: 'command', type: 'text', autocomplete: 'off', spellcheck: false, autocapitalize: 'off', 'aria-label': 'Polecenie terminala', 'aria-describedby': 'term-help' });
  const element = h(
    'div',
    { class: 'term', translate: 'no', onclick: (event) => { if (!window.getSelection()?.toString() && event.target.tagName !== 'BUTTON') input.focus(); } },
    h('div', { class: 'term-bar' }, h('span', { class: 'term-dot' }), h('span', { class: 'term-dot' }), h('span', { class: 'term-dot' }), h('span', { class: 'term-title', text: `${user}@${host}: terminal` })),
    output,
    h('div', { class: 'term-line term-input-row' }, promptLabel, input)
  );
  const quickBar = h(
    'div',
    { class: 'term-quick' },
    h('span', { class: 't-small t-muted', id: 'term-help', text: 'Szybkie wstawianie (Enter uruchamia):' }),
    quick.map((cmd) => h('button', { type: 'button', class: 'btn btn-secondary btn-sm mono', onclick: () => { input.value = cmd; input.focus(); } }, cmd))
  );

  function getNode(path) {
    let node = tree;
    for (const part of path.split('/').filter(Boolean)) {
      if (node?.type !== 'dir') return null;
      node = node.children[part];
    }
    return node ?? null;
  }

  function resolve(path) {
    if (!path || path === '~') return home;
    let raw = path.startsWith('~') ? home + path.slice(1) : path;
    if (!raw.startsWith('/')) raw = `${state.cwd}/${raw}`;
    const stack = [];
    for (const part of raw.split('/')) {
      if (!part || part === '.') continue;
      if (part === '..') stack.pop();
      else stack.push(part);
    }
    return `/${stack.join('/')}`;
  }

  function parentAndName(abs) {
    const index = abs.lastIndexOf('/');
    return [abs.slice(0, index) || '/', abs.slice(index + 1)];
  }

  function displayPath(path) {
    return path === home ? '~' : path.startsWith(`${home}/`) ? `~${path.slice(home.length)}` : path;
  }

  function canRead(node) {
    if (node.type === 'dir') return true;
    const owner = node.owner ?? user;
    return (owner === user ? node.mode[1] : node.mode[7]) === 'r';
  }

  function renderPrompt() {
    promptLabel.replaceChildren(h('span', { class: 'term-user', text: `${user}@${host}` }), ':', h('span', { class: 'term-path', text: displayPath(state.cwd) }), '$ ');
  }

  function printLine(line, cls = '') {
    if (typeof line === 'string') {
      output.append(h('div', { class: `term-line ${cls}`.trim(), text: line || ' ' }));
    } else if (line.parts) {
      output.append(h('div', { class: 'term-line' }, line.parts.map((part) => (typeof part === 'string' ? part : h(part.tag ?? 'span', { class: part.cls, text: part.text })))));
    } else {
      output.append(h('div', { class: `term-line ${line.cls ?? ''}`.trim(), text: line.text || ' ' }));
    }
  }

  function print(text, cls = '') {
    for (const line of String(text).split('\n')) printLine(line, cls);
  }

  function scrollDown() {
    output.scrollTop = output.scrollHeight;
  }

  function expandGlobs(tokens) {
    return tokens.flatMap((token) => {
      if (!token.includes('*') && !token.includes('?')) return [token];
      const slash = token.lastIndexOf('/');
      const base = slash >= 0 ? token.slice(0, slash + 1) : '';
      const pattern = globToRegex(token.slice(slash + 1));
      const node = getNode(resolve(base || '.'));
      if (node?.type !== 'dir') return [token];
      const matches = Object.keys(node.children).filter((name) => pattern.test(name) && !name.startsWith('.')).sort((a, b) => a.localeCompare(b, 'pl'));
      return matches.length ? matches.map((name) => base + name) : [token];
    });
  }

  function readFile(target, command) {
    const abs = resolve(target);
    const node = getNode(abs);
    if (!node) throw new Error(`${command}: ${target}: Nie ma takiego pliku ani katalogu`);
    if (node.type === 'dir') throw new Error(`${command}: ${target}: Jest katalogiem`);
    if (!canRead(node)) throw new Error(`${command}: ${target}: Brak dostępu`);
    state.read.add(abs);
    return node.content.split('\n');
  }

  function textInput(rest, stdin, command) {
    if (!rest.length) return stdin ?? [];
    return rest.flatMap((target) => readFile(target, command));
  }

  function listing(node, showAll, long) {
    const names = Object.keys(node.children).filter((name) => showAll || !name.startsWith('.')).sort((a, b) => a.replace(/^\./, '').localeCompare(b.replace(/^\./, ''), 'pl'));
    const entries = showAll ? ['.', '..', ...names] : names;
    if (long) {
      const lines = [`razem ${entries.length * 4}`];
      for (const name of entries) {
        const child = name === '.' || name === '..' ? dir() : node.children[name];
        const isDir = child.type === 'dir';
        const mode = isDir ? 'drwxr-xr-x' : child.mode;
        const owner = child.owner ?? user;
        const size = isDir ? 4096 : new TextEncoder().encode(child.content).length;
        lines.push({ parts: [`${mode} 1 ${owner.padEnd(7)} ${owner.padEnd(7)} ${String(size).padStart(5)} paź 14 09:41 `, { text: name, cls: isDir ? 'term-dir' : '' }] });
      }
      return lines;
    }
    if (!entries.length) return [];
    return [{ parts: entries.flatMap((name) => {
      const isDir = name === '.' || name === '..' || node.children[name]?.type === 'dir';
      return [{ text: name, cls: isDir ? 'term-dir' : '' }, '  '];
    }) }];
  }

  function walk(path, node, visit) {
    visit(path, node);
    if (node.type === 'dir') {
      for (const [name, child] of Object.entries(node.children)) walk(path === '/' ? `/${name}` : `${path}/${name}`, child, visit);
    }
  }

  const commands = {
    help: () => ['Dostępne polecenia:', HELP],
    pwd: () => [state.cwd],
    whoami: () => [user],
    hostname: () => [host],
    id: () => [`uid=1000(${user}) gid=1000(${user}) grupy=1000(${user}),27(sudo)`],
    uname: (argv) => [flagSet(argv).flags.has('a') ? `Linux ${host} 6.11.2-amd64 #1 SMP PREEMPT_DYNAMIC Kali 6.11.2-1kali1 x86_64 GNU/Linux` : 'Linux'],
    date: () => [new Date().toLocaleString('pl-PL', { dateStyle: 'full', timeStyle: 'medium' })],
    clear: () => {
      output.replaceChildren();
      return [];
    },
    history: () => state.history.map((cmd, i) => `${String(i + 1).padStart(4)}  ${cmd}`),
    echo: (argv) => [argv.join(' ')],
    ls(argv) {
      const { flags, rest } = flagSet(argv);
      state.last.flags = flags;
      state.last.targets = rest;
      const targets = rest.length ? rest : ['.'];
      return targets.flatMap((target, i) => {
        const node = getNode(resolve(target));
        if (!node) throw new Error(`ls: nie ma dostępu do '${target}': Nie ma takiego pliku ani katalogu`);
        const header = targets.length > 1 ? [`${i ? '\n' : ''}${target}:`] : [];
        if (node.type === 'file') return [...header, target];
        return [...header, ...listing(node, flags.has('a'), flags.has('l'))];
      });
    },
    cd(argv) {
      const target = resolve(argv[0]);
      const node = getNode(target);
      if (!node) throw new Error(`bash: cd: ${argv[0]}: Nie ma takiego pliku ani katalogu`);
      if (node.type !== 'dir') throw new Error(`bash: cd: ${argv[0]}: To nie jest katalog`);
      state.cwd = target;
      return [];
    },
    cat(argv, stdin) {
      const { flags, rest } = flagSet(argv);
      if (flags.size && !rest.length) throw new Error(`cat: nieprawidłowa opcja -- '${[...flags][0]}'. Plik zaczyna się od myślnika? Spróbuj: cat ./-nazwa`);
      if (!rest.length && !stdin) throw new Error('cat: podaj nazwę pliku, np. cat notatki.txt');
      return textInput(rest, stdin, 'cat');
    },
    head(argv, stdin) {
      const { values, rest } = flagSet(argv, ['-n']);
      return textInput(rest, stdin, 'head').slice(0, Number(values['-n'] ?? 10));
    },
    tail(argv, stdin) {
      const { values, rest } = flagSet(argv, ['-n']);
      const lines = textInput(rest, stdin, 'tail');
      return lines.slice(Math.max(0, lines.length - Number(values['-n'] ?? 10)));
    },
    wc(argv, stdin) {
      const { rest } = flagSet(argv);
      return [String(textInput(rest, stdin, 'wc').length)];
    },
    sort(argv, stdin) {
      const { flags, rest } = flagSet(argv);
      const lines = [...textInput(rest, stdin, 'sort')];
      lines.sort(flags.has('n') ? (a, b) => Number.parseFloat(a) - Number.parseFloat(b) : (a, b) => a.localeCompare(b, 'pl'));
      return flags.has('r') ? lines.reverse() : lines;
    },
    uniq(argv, stdin) {
      const { flags, rest } = flagSet(argv);
      const groups = [];
      for (const line of textInput(rest, stdin, 'uniq')) {
        const last = groups[groups.length - 1];
        if (last && last.line === line) last.count += 1;
        else groups.push({ line, count: 1 });
      }
      const filtered = flags.has('u') ? groups.filter((g) => g.count === 1) : groups;
      return filtered.map((g) => (flags.has('c') ? `${String(g.count).padStart(7)} ${g.line}` : g.line));
    },
    grep(argv, stdin) {
      const { flags, rest } = flagSet(argv);
      const [pattern, ...targets] = rest;
      state.last.pattern = pattern;
      state.last.matched = 0;
      if (!pattern) throw new Error('grep: użycie: grep TEKST PLIK, np. grep Failed /var/log/auth.log');
      if (!targets.length && !stdin) throw new Error('grep: podaj plik albo użyj potoku, np. cat plik | grep tekst');
      const needle = flags.has('i') ? pattern.toLowerCase() : pattern;
      const result = [];
      for (const line of textInput(targets, stdin, 'grep')) {
        const hay = flags.has('i') ? line.toLowerCase() : line;
        const at = hay.indexOf(needle);
        const hit = at >= 0;
        if (hit === flags.has('v')) continue;
        state.last.matched += 1;
        if (flags.has('c')) continue;
        result.push(hit && !flags.has('v') ? { parts: [line.slice(0, at), { tag: 'mark', cls: 'term-match', text: line.slice(at, at + pattern.length) }, line.slice(at + pattern.length)] } : line);
      }
      return flags.has('c') ? [String(state.last.matched)] : result;
    },
    find(argv) {
      const start = argv[0] && !argv[0].startsWith('-') ? argv[0] : '.';
      const { values } = flagSet(argv, ['-name', '-size', '-type']);
      const base = resolve(start);
      const root = getNode(base);
      if (!root) throw new Error(`find: '${start}': Nie ma takiego pliku ani katalogu`);
      const nameRe = values['-name'] ? globToRegex(values['-name']) : null;
      const size = values['-size'] ? Number.parseInt(values['-size'], 10) : null;
      const type = values['-type'];
      const found = [];
      walk(base, root, (path, node) => {
        const name = path.split('/').pop();
        if (nameRe && !nameRe.test(name)) return;
        if (type === 'f' && node.type !== 'file') return;
        if (type === 'd' && node.type !== 'dir') return;
        if (size !== null && (node.type !== 'file' || new TextEncoder().encode(node.content).length !== size)) return;
        found.push(start === '.' ? `.${path.slice(base.length)}` : path);
      });
      return found;
    },
    file(argv) {
      const { rest } = flagSet(argv);
      return rest.map((target) => {
        const node = getNode(resolve(target));
        if (!node) return `${target}: nie można otworzyć (Nie ma takiego pliku ani katalogu)`;
        if (node.type === 'dir') return `${target}: katalog`;
        return `${target}: ${isBinary(node.content) ? 'dane binarne' : node.content.trim() ? 'tekst ASCII' : 'pusty'}`;
      });
    },
    base64(argv, stdin) {
      const { flags, rest } = flagSet(argv);
      const text = textInput(rest, stdin, 'base64').join('\n').trim();
      if (!flags.has('d')) return [btoa(String.fromCharCode(...new TextEncoder().encode(text)))];
      try {
        return new TextDecoder().decode(Uint8Array.from(atob(text), (ch) => ch.charCodeAt(0))).split('\n');
      } catch {
        throw new Error('base64: nieprawidłowe dane wejściowe');
      }
    },
    chmod(argv) {
      const [mode, ...targets] = argv;
      if (!mode || !targets.length) throw new Error('chmod: użycie: chmod 600 plik albo chmod u+r plik');
      for (const target of targets) {
        const node = getNode(resolve(target));
        if (!node) throw new Error(`chmod: nie można uzyskać dostępu do '${target}': Nie ma takiego pliku ani katalogu`);
        if (node.type === 'dir') continue;
        if ((node.owner ?? user) !== user) throw new Error(`chmod: zmiana uprawnień '${target}': Operacja niedozwolona`);
        const bits = [...node.mode];
        if (/^[0-7]{3}$/.test(mode)) {
          [...mode].forEach((digit, who) => {
            const value = Number(digit);
            bits[1 + who * 3] = value & 4 ? 'r' : '-';
            bits[2 + who * 3] = value & 2 ? 'w' : '-';
            bits[3 + who * 3] = value & 1 ? 'x' : '-';
          });
        } else {
          const match = mode.match(/^([ugoa]*)([+-])([rwx]+)$/);
          if (!match) throw new Error(`chmod: nieprawidłowy tryb: '${mode}'`);
          const whos = (match[1] || 'a').replace('a', 'ugo');
          for (const who of whos) {
            const offset = { u: 1, g: 4, o: 7 }[who];
            for (const perm of match[3]) {
              const index = offset + 'rwx'.indexOf(perm);
              bits[index] = match[2] === '+' ? perm : '-';
            }
          }
        }
        node.mode = bits.join('');
      }
      return [];
    },
    mkdir(argv) {
      if (!argv.length) throw new Error('mkdir: brak argumentu, np. mkdir lab');
      for (const target of argv) {
        const [parent, name] = parentAndName(resolve(target));
        const parentNode = getNode(parent);
        if (parentNode?.type !== 'dir') throw new Error(`mkdir: nie można utworzyć katalogu '${target}': Nie ma takiego pliku ani katalogu`);
        if (parentNode.children[name]) throw new Error(`mkdir: nie można utworzyć katalogu '${target}': Plik istnieje`);
        parentNode.children[name] = dir();
      }
      return [];
    },
    touch(argv) {
      for (const target of argv) {
        const [parent, name] = parentAndName(resolve(target));
        const parentNode = getNode(parent);
        if (parentNode?.type !== 'dir') throw new Error(`touch: nie można dotknąć '${target}': Nie ma takiego pliku ani katalogu`);
        if (!parentNode.children[name]) parentNode.children[name] = file('');
      }
      return [];
    },
    rm(argv) {
      const { flags, rest } = flagSet(argv);
      if (rest.includes('/') || rest.includes('/*')) return [{ text: 'Stop! To polecenie próbowałoby usunąć cały system. W prawdziwym Linuksie nie ma cofania ani kosza. Tutaj nic się nie stało.', cls: 'term-warn' }];
      for (const target of rest) {
        const abs = resolve(target);
        const [parent, name] = parentAndName(abs);
        const node = getNode(abs);
        if (!node) throw new Error(`rm: nie można usunąć '${target}': Nie ma takiego pliku ani katalogu`);
        if (node.type === 'dir' && !flags.has('r')) throw new Error(`rm: nie można usunąć '${target}': Jest katalogiem (rm -r usuwa katalogi, używaj ostrożnie)`);
        if (abs === home || !abs.startsWith(`${home}/`)) throw new Error(`rm: nie można usunąć '${target}': Brak dostępu`);
        delete getNode(parent).children[name];
      }
      return [];
    },
    ip(argv) {
      if (argv[0] && !['a', 'addr', 'address'].includes(argv[0])) return [{ text: 'W tym symulatorze działa: ip a', cls: 'term-warn' }];
      return ['1: lo: <LOOPBACK,UP> mtu 65536', '    inet 127.0.0.1/8 scope host lo', '2: eth0: <BROADCAST,MULTICAST,UP> mtu 1500', '    link/ether 08:00:27:3a:1b:9c brd ff:ff:ff:ff:ff:ff', '    inet 192.168.1.20/24 brd 192.168.1.255 scope global eth0'];
    },
    ifconfig: () => [{ text: 'ifconfig to starsze polecenie, nowsze systemy używają ip a. Wynik:', cls: 'term-warn' }, ...commands.ip([])],
    man: (argv) => [MAN_PAGES[argv[0]] ?? (argv[0] ? `Brak instrukcji dla ${argv[0]} w tym symulatorze. Spróbuj: man ls` : 'Podaj polecenie, np. man ls')],
    sudo: (argv) => [`[sudo] hasło dla ${user}:`, { text: `W symulatorze sudo jest wyłączone. sudo ${argv.join(' ')} uruchomiłoby polecenie jako administrator (root). Jedno złe polecenie z sudo może uszkodzić system.`, cls: 'term-warn' }],
    exit: () => [{ text: 'Na prawdziwym serwerze exit kończy sesję. Tutaj zostajemy, misje czekają.', cls: 'term-warn' }],
    nmap: () => [{ text: 'nmap jest w Kali, ale ten symulator niczego nie skanuje. Raport skanu przeanalizujesz w grze o skanowaniu własnego serwera.', cls: 'term-warn' }],
    ...extraCommands
  };

  function redirect(segment) {
    const match = segment.match(/^(.*?)\s*(>>?)\s*(\S+)$/);
    if (!match || /["']/.test(match[3])) return { command: segment, target: null };
    return { command: match[1], target: match[3], append: match[2] === '>>' };
  }

  function execute(line) {
    const segments = splitPipeline(line);
    const last = redirect(segments[segments.length - 1]);
    segments[segments.length - 1] = last.command;
    let stdin = null;
    let result = [];
    for (const [index, segment] of segments.entries()) {
      const tokens = expandGlobs(tokenize(segment));
      const [name, ...argv] = tokens;
      if (!name) throw new Error('bash: błąd składni w pobliżu „|”');
      const command = commands[name];
      state.last = { ...state.last, name, flags: flagSet(argv).flags, targets: flagSet(argv).rest };
      if (!command) throw new Error(`${name}: nie znaleziono polecenia. Wpisz help, żeby zobaczyć dostępne polecenia.`);
      result = command(argv, index === 0 ? null : stdin) ?? [];
      stdin = result.map(plain);
    }
    if (last.target) {
      const [parent, name] = parentAndName(resolve(last.target));
      const parentNode = getNode(parent);
      if (parentNode?.type !== 'dir') throw new Error(`bash: ${last.target}: Nie ma takiego pliku ani katalogu`);
      const previous = last.append && parentNode.children[name]?.type === 'file' ? `${parentNode.children[name].content}\n` : '';
      parentNode.children[name] = file(previous + stdin.join('\n'));
      return [];
    }
    return result;
  }

  function run(raw) {
    const line = raw.trim();
    printLine({ parts: [{ text: `${user}@${host}`, cls: 'term-user' }, ':', { text: displayPath(state.cwd), cls: 'term-path' }, `$ ${raw}`] });
    if (line) {
      state.history.push(line);
      state.historyIndex = state.history.length;
      try {
        for (const item of execute(line)) {
          if (typeof item === 'string') print(item);
          else printLine(item);
        }
      } catch (error) {
        print(error.message, 'term-error');
      }
    }
    renderPrompt();
    onRun?.(state);
    scrollDown();
  }

  function complete() {
    const value = input.value;
    const tokens = value.split(' ');
    const lastToken = tokens.pop();
    if (tokens.length === 0) {
      const match = Object.keys(commands).filter((cmd) => cmd.startsWith(lastToken));
      if (match.length === 1) input.value = `${match[0]} `;
      return;
    }
    const slash = lastToken.lastIndexOf('/');
    const base = slash >= 0 ? lastToken.slice(0, slash + 1) : '';
    const partial = lastToken.slice(slash + 1);
    const node = getNode(resolve(base || '.'));
    if (node?.type !== 'dir') return;
    const matches = Object.keys(node.children).filter((name) => name.startsWith(partial) && (partial.startsWith('.') || !name.startsWith('.')));
    if (matches.length === 1) {
      const name = matches[0].replace(/ /g, '\\ ');
      const suffix = node.children[matches[0]].type === 'dir' ? '/' : ' ';
      input.value = [...tokens, base + name + suffix].join(' ');
    } else if (matches.length > 1) {
      print(matches.join('  '), 'term-muted');
      scrollDown();
    }
  }

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      run(input.value);
      input.value = '';
    } else if (event.key === 'Tab') {
      event.preventDefault();
      complete();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      state.historyIndex = Math.max(0, state.historyIndex - 1);
      input.value = state.history[state.historyIndex] ?? '';
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      state.historyIndex = Math.min(state.history.length, state.historyIndex + 1);
      input.value = state.history[state.historyIndex] ?? '';
    } else if (event.key === 'l' && event.ctrlKey) {
      event.preventDefault();
      commands.clear();
    }
  });

  intro.forEach(([text, cls]) => print(text, cls));
  renderPrompt();

  return { element, quickBar, state, print, getNode, resolve, focus: () => input.focus() };
}
