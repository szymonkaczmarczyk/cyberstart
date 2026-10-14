import { h, button, feedback, onKey, isTyping, clear, draw } from '../ui.js';
import { icon } from '../icons.js';

const POLICY = [
  'Strona sklepu (porty <code>80</code> i <code>443</code>) jest dostępna dla wszystkich.',
  'SSH (port <code>22</code>) tylko z sieci biura <code>10.0.1.0/24</code>.',
  'Baza danych (port <code>3306</code>) tylko z serwera aplikacji <code>10.0.5.20</code>.',
  'Wszystko inne blokujemy (domyślnie odmawiaj).'
];

const PACKETS = [
  { src: '198.51.100.7', port: 443, label: 'Klient otwiera stronę sklepu przez HTTPS', allow: true, why: 'Port 443 jest otwarty dla wszystkich. To podstawowa funkcja sklepu.' },
  { src: '203.0.113.50', port: 22, label: 'Próba logowania SSH z internetu', allow: false, why: 'SSH tylko z sieci biura 10.0.1.0/24. Adres 203.0.113.50 jest spoza niej.' },
  { src: '10.0.1.15', port: 22, label: 'Administrator łączy się przez SSH z biura', allow: true, why: '10.0.1.15 należy do sieci biura 10.0.1.0/24, więc reguła SSH pozwala.' },
  { src: '10.0.5.20', port: 3306, label: 'Aplikacja sklepu pobiera dane z bazy', allow: true, why: 'To dokładnie ten jeden dozwolony adres serwera aplikacji.' },
  { src: '198.51.100.99', port: 3306, label: 'Ktoś z internetu łączy się z bazą danych', allow: false, why: 'Baza tylko dla 10.0.5.20. Wystawiona do internetu baza to jedna z najczęstszych przyczyn wycieków.' },
  { src: '203.0.113.8', port: 80, label: 'Klient wpisał adres bez https://', allow: true, why: 'Port 80 jest dozwolony. Serwer od razu przekieruje klienta na bezpieczne HTTPS.' },
  { src: '203.0.113.77', port: 3389, label: 'Połączenie z pulpitem zdalnym Windows (RDP)', allow: false, why: 'Polityka nie przewiduje RDP, więc działa reguła domyślna: blokuj.' },
  { src: '10.0.1.40', port: 3306, label: 'Komputer z biura łączy się bezpośrednio z bazą', allow: false, why: 'Podchwytliwe! Biuro ma dostęp tylko do SSH. Bazę wolno odpytywać wyłącznie z serwera aplikacji.' },
  { src: '192.0.2.14', port: 23, label: 'Próba połączenia przez Telnet', allow: false, why: 'Telnet nie jest w polityce, a do tego nie szyfruje haseł. Blokuj.' },
  { src: '10.0.2.5', port: 22, label: 'SSH z sieci dla gości 10.0.2.0/24', allow: false, why: 'Podchwytliwe! 10.0.2.x to sieć gości, a nie biura (10.0.1.x). Jedna cyfra robi różnicę.' },
  { src: '198.51.100.200', port: 443, label: 'Bot sprawdza po kolei podstrony sklepu', allow: true, why: 'Firewall widzi tylko adres i port, a nie intencje. Port 443 jest dla wszystkich, więc ruch przejdzie. Z botami walczą inne warstwy: limity zapytań (rate limiting) i WAF.' },
  { src: '10.0.5.20', port: 22, label: 'Serwer aplikacji łączy się przez SSH', allow: false, why: 'SSH wolno tylko z sieci biura. Serwer aplikacji ma dostęp wyłącznie do bazy. Każdy dostaje minimum potrzebnych uprawnień.' },
  { src: '10.0.5.20', port: 3306, proto: 'UDP', label: 'Serwer aplikacji wysyła pakiet UDP na port bazy', allow: false, level: 'zaawansowany', why: 'Reguła dla bazy dotyczy TCP. MySQL nie używa UDP, więc taki ruch nie ma uzasadnienia. Reguły zawsze określają też protokół.' },
  { src: '198.51.100.31', port: 443, proto: 'UDP', label: 'Przeglądarka próbuje HTTP/3 (QUIC)', allow: false, level: 'zaawansowany', why: 'Według reguł otwarte jest tylko 443/tcp. HTTP/3 działa po UDP 443, więc zostanie zablokowane, a przeglądarka wróci do HTTP/2 po TCP. Jeśli chcesz HTTP/3, świadomie dodajesz regułę 443/udp.' },
  { src: '203.0.113.9', port: 53, proto: 'UDP', label: 'Zapytanie DNS skierowane do serwera sklepu', allow: false, level: 'zaawansowany', why: 'Ten serwer nie jest serwerem DNS. Otwarte resolvery DNS bywają wykorzystywane do ataków DDoS przez wzmocnienie (amplification).' },
  { src: '10.0.1.15', port: 3389, label: 'Administrator z biura łączy się pulpitem zdalnym (RDP)', allow: false, level: 'zaawansowany', why: 'Biuro ma dostęp tylko do SSH. To, że ktoś jest „swój”, nie otwiera automatycznie wszystkich drzwi.' }
];

const UFW_RULES = [
  'sudo ufw default deny incoming',
  'sudo ufw default allow outgoing',
  'sudo ufw allow 80/tcp',
  'sudo ufw allow 443/tcp',
  'sudo ufw allow from 10.0.1.0/24 to any port 22 proto tcp',
  'sudo ufw allow from 10.0.5.20 to any port 3306 proto tcp',
  'sudo ufw enable'
];

export default {
  id: 'firewall',
  title: 'Jesteś firewallem',
  category: 'sieci',
  icon: 'wall',
  minutes: 10,
  levels: true,
  summary: 'Chronisz serwer sklepu internetowego. Do drzwi puka 12 połączeń: każde przepuść albo zablokuj zgodnie z polityką bezpieczeństwa.',
  lesson: [
    '<strong>Firewall</strong> (zapora sieciowa) to strażnik na wejściu do sieci lub serwera. Dla każdego połączenia sprawdza reguły: skąd przychodzi (adres IP), dokąd idzie (port) i czy jest na liście dozwolonych.',
    'Najważniejsza zasada to <strong>domyślnie odmawiaj</strong> (default deny). Najpierw blokujesz wszystko, a potem otwierasz tylko to, co jest potrzebne. Odwrotne podejście zawsze coś przeoczy.',
    'Firewall nie czyta intencji. Widzi adres, port i protokół. Jeśli port jest otwarty dla wszystkich, przejdzie przez niego zarówno klient, jak i bot.',
    'Klawisze: <code>A</code> przepuść, <code>Z</code> zablokuj.'
  ],
  takeaways: [
    'Domyślnie odmawiaj, a potem otwieraj tylko to, co konieczne.',
    'Ograniczaj nie tylko porty, ale też źródła: SSH tylko z biura lub VPN, baza tylko z serwera aplikacji.',
    'Jedna cyfra w adresie (10.0.1.x zamiast 10.0.2.x) zmienia wszystko. Czytaj adresy uważnie.',
    'Firewall nie odróżni klienta od bota na otwartym porcie. Do tego służą limity zapytań i WAF.',
    'Na Linuksie prosty firewall ustawisz narzędziem <code>ufw</code>. Reguły z tej gry znajdziesz w podsumowaniu.'
  ],
  mount(stage, ctx) {
    const packets = draw(PACKETS, 12, ctx.level);
    let index = 0;
    let score = 0;
    const card = h('div', { class: 'packet-area', 'aria-live': 'polite' });
    const logList = h('ol', { class: 'fw-log' });

    stage.append(
      h(
        'div',
        { class: 'split' },
        h('section', { class: 'panel' }, card, h('div', { class: 'fw-log-wrap' }, h('h3', { class: 't-small t-caps t-muted', text: 'Dziennik decyzji' }), logList)),
        h(
          'aside',
          { class: 'panel fw-policy' },
          h('div', { class: 'panel-title' }, icon('server'), h('h2', { class: 't-h4', text: 'Polityka: serwer 10.0.5.10' })),
          h('ul', { class: 'policy-list' }, POLICY.map((rule) => h('li', { html: rule })))
        )
      )
    );

    function show() {
      if (index >= packets.length) return finish();
      ctx.progress(index, packets.length);
      const packet = packets[index];
      const status = h('div');
      let decided = false;

      const decide = (allow) => {
        if (decided) return;
        decided = true;
        stopKeys();
        const correct = allow === packet.allow;
        if (correct) score += 1;
        allowBtn.disabled = true;
        denyBtn.disabled = true;
        packetEl.classList.add(allow ? 'is-allowed' : 'is-denied');
        logList.prepend(
          h(
            'li',
            { class: correct ? 'ok' : 'bad' },
            icon(correct ? 'check' : 'x'),
            h('span', { class: 'mono', text: `${packet.src} → :${packet.port}` }),
            h('span', { text: allow ? 'przepuszczono' : 'zablokowano' })
          )
        );
        const verdict = packet.allow ? 'Ten ruch powinien przejść.' : 'Ten ruch powinien zostać zablokowany.';
        status.replaceChildren(
          feedback(correct ? 'ok' : 'bad', correct ? 'Dobra decyzja' : verdict, packet.why),
          h('div', { class: 'btn-row' }, button({ label: index === packets.length - 1 ? 'Zakończ zmianę' : 'Następne połączenie', variant: 'primary', iconAfter: 'arrowRight', shortcut: 'Enter', onclick: next }))
        );
        const stopEnter = onKey(ctx.signal, (event) => {
          if (event.key === 'Enter' && !isTyping(event)) {
            event.preventDefault();
            next();
          }
        });
        function next() {
          stopEnter();
          index += 1;
          show();
        }
        status.querySelector('.btn-primary').focus({ preventScroll: true });
      };

      const allowBtn = button({ label: 'Przepuść', variant: 'secondary', iconName: 'check', shortcut: 'A', class: 'btn btn-secondary fw-allow', onclick: () => decide(true) });
      const denyBtn = button({ label: 'Zablokuj', variant: 'secondary', iconName: 'x', shortcut: 'Z', class: 'btn btn-secondary fw-deny', onclick: () => decide(false) });
      const stopKeys = onKey(ctx.signal, (event) => {
        if (isTyping(event)) return;
        const key = event.key.toLowerCase();
        if (key === 'a') decide(true);
        if (key === 'z') decide(false);
      });

      const packetEl = h(
        'div',
        { class: 'packet' },
        h('div', { class: 'packet-head' }, h('span', { class: 'tag', text: `Połączenie ${index + 1} z ${packets.length}` }), h('span', { class: 'tag mono', text: packet.proto ?? 'TCP' })),
        h(
          'dl',
          { class: 'packet-fields' },
          h('div', {}, h('dt', { text: 'Źródło' }), h('dd', { class: 'mono', text: packet.src })),
          h('div', {}, h('dt', { text: 'Cel' }), h('dd', { class: 'mono', text: `10.0.5.10:${packet.port}` }))
        ),
        h('p', { class: 'packet-label', text: packet.label })
      );

      clear(card).append(packetEl, h('div', { class: 'btn-row' }, allowBtn, denyBtn), status);
    }

    function finish() {
      clear(card).append(
        feedback(score >= 10 ? 'ok' : 'warn', `Zmiana zakończona: ${score} z ${packets.length} trafnych decyzji`, 'Tak wyglądałaby ta polityka zapisana jako reguły firewalla <code>ufw</code> na Linuksie:'),
        h('pre', { class: 'code-block', tabindex: '0' }, h('code', { text: UFW_RULES.join('\n') })),
        h('p', { class: 'hint', text: 'Pierwsza linia to „domyślnie odmawiaj”. Każda kolejna otwiera tylko konkretne drzwi dla konkretnych gości.' }),
        h('div', { class: 'btn-row' }, button({ label: 'Zobacz podsumowanie', variant: 'primary', iconAfter: 'arrowRight', onclick: () => ctx.finish({ score, max: packets.length }) }))
      );
      ctx.progress(packets.length, packets.length);
    }

    show();
  }
};
