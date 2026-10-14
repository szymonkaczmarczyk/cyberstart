import { h, button, runQuiz } from '../ui.js';
import { icon } from '../icons.js';

const PACKETS = [
  { time: '0.000', src: '192.168.1.20', dst: '192.168.1.1', proto: 'DNS', info: 'Standard query A sklep-testowy.pl', layers: ['Ethernet II: 08:00:27:3a:1b:9c → 3c:84:6a:11:22:33', 'IPv4: 192.168.1.20 → 192.168.1.1', 'UDP: port 53211 → 53', 'DNS: pytanie o adres A dla sklep-testowy.pl'] },
  { time: '0.012', src: '192.168.1.1', dst: '192.168.1.20', proto: 'DNS', info: 'Standard query response A 203.0.113.80', layers: ['IPv4: 192.168.1.1 → 192.168.1.20', 'UDP: port 53 → 53211', 'DNS: sklep-testowy.pl ma adres 203.0.113.80'] },
  { time: '0.015', src: '192.168.1.20', dst: '203.0.113.80', proto: 'TCP', info: '51522 → 80 [SYN]', layers: ['IPv4: 192.168.1.20 → 203.0.113.80', 'TCP: port 51522 → 80, flagi: SYN'] },
  { time: '0.040', src: '203.0.113.80', dst: '192.168.1.20', proto: 'TCP', info: '80 → 51522 [SYN, ACK]', layers: ['IPv4: 203.0.113.80 → 192.168.1.20', 'TCP: port 80 → 51522, flagi: SYN, ACK'] },
  { time: '0.041', src: '192.168.1.20', dst: '203.0.113.80', proto: 'TCP', info: '51522 → 80 [ACK]', layers: ['IPv4: 192.168.1.20 → 203.0.113.80', 'TCP: port 51522 → 80, flagi: ACK'] },
  { time: '0.042', src: '192.168.1.20', dst: '203.0.113.80', proto: 'HTTP', info: 'POST /logowanie HTTP/1.1 (formularz)', layers: ['IPv4: 192.168.1.20 → 203.0.113.80', 'TCP: port 51522 → 80', 'HTTP: POST /logowanie HTTP/1.1', 'Host: sklep-testowy.pl', 'Content-Type: application/x-www-form-urlencoded', 'Treść: login=anna.kowalska&haslo=Jesien2026%21'] },
  { time: '0.090', src: '203.0.113.80', dst: '192.168.1.20', proto: 'HTTP', info: 'HTTP/1.1 302 Found', layers: ['IPv4: 203.0.113.80 → 192.168.1.20', 'HTTP: HTTP/1.1 302 Found', 'Location: /moje-konto', 'Set-Cookie: sesja=4f9c2a7e1b; Path=/'] },
  { time: '1.200', src: '192.168.1.20', dst: '192.168.1.1', proto: 'DNS', info: 'Standard query A bankhoryzont.pl', layers: ['UDP: port 53877 → 53', 'DNS: pytanie o adres A dla bankhoryzont.pl'] },
  { time: '1.209', src: '192.168.1.1', dst: '192.168.1.20', proto: 'DNS', info: 'Standard query response A 198.51.100.10', layers: ['DNS: bankhoryzont.pl ma adres 198.51.100.10'] },
  { time: '1.214', src: '192.168.1.20', dst: '198.51.100.10', proto: 'TCP', info: '51530 → 443 [SYN]', layers: ['TCP: port 51530 → 443, flagi: SYN'] },
  { time: '1.240', src: '192.168.1.20', dst: '198.51.100.10', proto: 'TLSv1.3', info: 'Client Hello (SNI=bankhoryzont.pl)', layers: ['TCP: port 51530 → 443', 'TLS 1.3: Client Hello', 'Server Name Indication: bankhoryzont.pl', 'Proponowane szyfry: TLS_AES_128_GCM_SHA256, TLS_CHACHA20_POLY1305_SHA256'] },
  { time: '1.268', src: '198.51.100.10', dst: '192.168.1.20', proto: 'TLSv1.3', info: 'Server Hello, Application Data', layers: ['TLS 1.3: Server Hello', 'Certyfikat i dalsza część uzgadniania są już zaszyfrowane'] },
  { time: '1.301', src: '192.168.1.20', dst: '198.51.100.10', proto: 'TLSv1.3', info: 'Application Data', layers: ['TLS 1.3: Application Data (1 184 bajty)', 'Zawartość: zaszyfrowana, nieczytelna bez klucza sesji'] },
  { time: '2.004', src: '08:00:27:3a:1b:9c', dst: 'ff:ff:ff:ff:ff:ff', proto: 'ARP', info: 'Who has 192.168.1.1? Tell 192.168.1.20', layers: ['Ethernet II: rozgłoszenie do wszystkich (ff:ff:ff:ff:ff:ff)', 'ARP: kto ma adres 192.168.1.1? Odpowiedz do 192.168.1.20'] },
  { time: '2.006', src: '3c:84:6a:11:22:33', dst: '08:00:27:3a:1b:9c', proto: 'ARP', info: '192.168.1.1 is at 3c:84:6a:11:22:33', layers: ['ARP: 192.168.1.1 ma adres MAC 3c:84:6a:11:22:33'] },
  { time: '3.110', src: '192.168.1.20', dst: '8.8.8.8', proto: 'ICMP', info: 'Echo (ping) request', layers: ['IPv4: 192.168.1.20 → 8.8.8.8', 'ICMP: Echo request, typ 8'] },
  { time: '3.131', src: '8.8.8.8', dst: '192.168.1.20', proto: 'ICMP', info: 'Echo (ping) reply', layers: ['IPv4: 8.8.8.8 → 192.168.1.20', 'ICMP: Echo reply, typ 0, czas 21 ms'] }
];

const QUESTIONS = [
  {
    prompt: 'Jakie hasło Anna wpisała w sklepie <span class="mono">sklep-testowy.pl</span>? Zajrzyj do pakietu POST.',
    options: [
      { label: '<span class="mono">Jesien2026!</span>', correct: true, why: 'Formularz poszedł zwykłym HTTP, więc hasło widać jawnym tekstem. <code>%21</code> to zakodowany wykrzyknik. Każdy w tej samej sieci Wi-Fi mógł to przechwycić.' },
      { label: 'Nie da się odczytać, jest zaszyfrowane', why: 'Port 80 i protokół HTTP oznaczają brak szyfrowania. Kliknij pakiet nr 6.' },
      { label: '<span class="mono">anna.kowalska</span>', why: 'To login. Hasło jest w tej samej linii, po <code>haslo=</code>.' }
    ]
  },
  {
    prompt: 'Co podsłuchujący widzi z wizyty Anny w banku?',
    options: [
      { label: 'Tylko nazwę domeny (SNI), adresy i ilość danych. Treść jest zaszyfrowana', correct: true, why: 'TLS chroni treść, ale nie ukrywa, z kim rozmawiasz. Nazwa serwera w Client Hello bywa widoczna, dlatego wiadomo, że to bank.' },
      { label: 'Wszystko, łącznie z saldem konta', why: 'Pakiety TLS zawierają „Application Data”, czyli zaszyfrowaną treść.' },
      { label: 'Nic, nawet adresu banku', why: 'Adresy IP i nazwa w SNI są widoczne. Szyfrowana jest treść.' }
    ]
  },
  {
    prompt: 'Który pakiet rozpoczyna połączenie TCP ze sklepem?',
    options: [
      { label: 'Nr 3, z flagą SYN', correct: true, why: 'SYN, SYN-ACK, ACK to trójstopniowe przywitanie TCP z pakietów 3, 4 i 5.' },
      { label: 'Nr 1, zapytanie DNS', why: 'DNS tylko zamienia nazwę na adres. Połączenie TCP zaczyna się od SYN.' },
      { label: 'Nr 6, POST', why: 'POST idzie już przez nawiązane połączenie.' }
    ]
  },
  {
    prompt: 'Do czego służą pakiety ARP (nr 14 i 15)?',
    options: [
      { label: 'Ustalają, jaki adres MAC ma urządzenie o danym adresie IP w sieci lokalnej', correct: true, why: 'Komputer zna IP routera, ale do wysłania ramki potrzebuje jego adresu MAC. Fałszywe odpowiedzi ARP (ARP spoofing) to klasyczny sposób na podsłuch w sieci lokalnej.' },
      { label: 'Szyfrują połączenie z routerem', why: 'ARP niczego nie szyfruje. To „pytanie do wszystkich” o adres MAC.' },
      { label: 'Sprawdzają, czy jest internet', why: 'Do tego służy raczej ping (ICMP, pakiety 16 i 17).' }
    ]
  },
  {
    prompt: 'Pakiet nr 7 ustawia ciasteczko sesji bez flagi <code>Secure</code> i przez HTTP. Co może zrobić podsłuchujący?',
    options: [
      { label: 'Skopiować ciasteczko i podszyć się pod zalogowaną Annę (przejęcie sesji)', correct: true, why: 'Ciasteczko sesji działa jak przepustka. Dlatego strony logowania muszą działać wyłącznie po HTTPS, a ciasteczka mieć flagi Secure i HttpOnly.' },
      { label: 'Nic, ciasteczko jest bezużyteczne bez hasła', why: 'Ciasteczko sesji wystarcza, żeby być zalogowanym. Hasło nie jest już potrzebne.' }
    ]
  },
  {
    prompt: 'Jaki filtr wpiszesz w Wiresharku, żeby zobaczyć tylko zapytania i odpowiedzi DNS?',
    options: [
      { label: '<code>dns</code>', correct: true, why: 'Filtry wyświetlania w Wiresharku to często po prostu nazwa protokołu: <code>dns</code>, <code>http</code>, <code>tls</code>, <code>arp</code>. Możesz też filtrować po adresie: <code>ip.addr == 192.168.1.20</code>.' },
      { label: '<code>port 80</code>', why: 'Port 80 to HTTP, a DNS działa na porcie 53. Do tego to składnia filtru przechwytywania, a nie wyświetlania.' },
      { label: '<code>grep dns</code>', why: 'grep to polecenie terminala, a nie filtr Wiresharka.' }
    ]
  }
];

function matches(packet, filter) {
  const query = filter.trim().toLowerCase();
  if (!query) return true;
  const ipMatch = query.match(/^ip\.addr\s*==\s*([\d.]+)$/);
  if (ipMatch) return packet.src === ipMatch[1] || packet.dst === ipMatch[1];
  if (query === 'tls') return packet.proto.startsWith('TLS');
  return packet.proto.toLowerCase() === query || packet.info.toLowerCase().includes(query);
}

export default {
  id: 'ruch',
  title: 'Czytanie ruchu sieciowego',
  category: 'sieci',
  icon: 'activity',
  minutes: 12,
  summary: 'Przeglądasz nagranie ruchu z domowego Wi-Fi jak w Wiresharku: DNS, przywitanie TCP, logowanie przez HTTP i rozmowa z bankiem po TLS. Sprawdzasz, co widać, a czego nie.',
  lesson: [
    '<strong>Wireshark</strong> to program, który nagrywa ruch sieciowy i pokazuje go pakiet po pakiecie. Administratorzy używają go do diagnozowania problemów, a analitycy do badania incydentów.',
    'Każdy wiersz to jeden pakiet: czas, źródło, cel, protokół i krótki opis. Po kliknięciu widzisz warstwy pakietu, od Ethernetu po aplikację, dokładnie jak w modelu OSI.',
    'Najważniejsza lekcja: wszystko, co idzie bez szyfrowania (HTTP, Telnet, FTP), widać jak na dłoni. TLS ukrywa treść, ale nie to, z kim rozmawiasz.',
    'Nagranie jest fikcyjne. Podsłuchiwanie cudzej sieci bez zgody jest przestępstwem, ale własną sieć możesz badać do woli.'
  ],
  takeaways: [
    'Nieszyfrowane HTTP pokazuje loginy, hasła i ciasteczka każdemu w tej samej sieci.',
    'TLS szyfruje treść, ale adresy IP i nazwa serwera (SNI) pozostają widoczne.',
    'SYN, SYN-ACK, ACK otwiera połączenie TCP. ARP zamienia adres IP na MAC w sieci lokalnej.',
    'Filtry Wiresharka: <code>dns</code>, <code>http</code>, <code>tls</code>, <code>ip.addr == adres</code>.',
    'Na publicznym Wi-Fi używaj tylko stron z HTTPS albo VPN.'
  ],
  async mount(stage, ctx) {
    const total = QUESTIONS.length;
    let selected = 5;
    const filter = h('input', { class: 'input mono', id: 'pcap-filter', name: 'filter', type: 'search', placeholder: 'np. http, dns, tls, ip.addr == 8.8.8.8', autocomplete: 'off', spellcheck: false });
    const tbody = h('tbody');
    const details = h('div', { class: 'pcap-details', 'aria-live': 'polite' });
    const count = h('span', { class: 't-small t-muted' });

    function renderTable() {
      const rows = PACKETS.map((packet, i) => ({ packet, i })).filter(({ packet }) => matches(packet, filter.value));
      count.textContent = `Wyświetlono ${rows.length} z ${PACKETS.length} pakietów`;
      tbody.replaceChildren(
        ...rows.map(({ packet, i }) =>
          h(
            'tr',
            { class: `proto-${packet.proto.replace(/v.*$/, '').toLowerCase()}${i === selected ? ' is-selected' : ''}` },
            h('td', {}, h('button', { type: 'button', class: 'pcap-row-btn', 'aria-label': `Pakiet ${i + 1}: ${packet.proto}, ${packet.info}`, 'aria-pressed': String(i === selected), onclick: () => { selected = i; renderTable(); renderDetails(); } }, String(i + 1))),
            h('td', { text: packet.time }),
            h('td', { text: packet.src }),
            h('td', { text: packet.dst }),
            h('td', { text: packet.proto }),
            h('td', { text: packet.info })
          )
        )
      );
    }

    function renderDetails() {
      const packet = PACKETS[selected];
      details.replaceChildren(h('strong', { text: `Pakiet ${selected + 1}: ${packet.proto}` }), h('ul', { class: 'pcap-layers' }, packet.layers.map((layer) => h('li', { text: layer }))));
    }

    filter.addEventListener('input', renderTable);
    const filters = ['dns', 'tcp', 'http', 'tls', 'arp', 'icmp'].map((value) => button({ label: value, size: 'sm', class: 'btn btn-secondary btn-sm mono', onclick: () => { filter.value = value; renderTable(); } }));

    const viewer = h(
      'section',
      { class: 'panel pcap', translate: 'no' },
      h('div', { class: 'panel-title' }, icon('activity'), h('h2', { class: 't-h4 mono', text: 'domowe-wifi.pcap' })),
      h('div', { class: 'field' }, h('label', { for: 'pcap-filter', text: 'Filtr wyświetlania' }), filter),
      h('div', { class: 'btn-row' }, filters, button({ label: 'Wyczyść', size: 'sm', iconName: 'x', class: 'btn btn-ghost btn-sm', onclick: () => { filter.value = ''; renderTable(); } })),
      count,
      h(
        'div',
        { class: 'pcap-table-wrap' },
        h('table', { class: 'pcap-table' }, h('thead', {}, h('tr', {}, ['Nr', 'Czas', 'Źródło', 'Cel', 'Protokół', 'Opis'].map((label) => h('th', { scope: 'col', text: label })))), tbody)
      ),
      details
    );
    const questions = h('div', { class: 'stage' });
    stage.append(viewer, questions);
    renderTable();
    renderDetails();

    const score = await runQuiz(questions, ctx, QUESTIONS, { label: 'Pytanie', total });
    ctx.finish({ score, max: total });
  }
};
