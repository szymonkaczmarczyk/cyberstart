import { h, button, feedback, draw, shuffle } from '../ui.js';
import { icon } from '../icons.js';

const LAYERS = [
  { n: 7, name: 'Aplikacji', desc: 'protokoły, z których korzystają programy' },
  { n: 6, name: 'Prezentacji', desc: 'format danych, kodowanie, kompresja' },
  { n: 5, name: 'Sesji', desc: 'otwieranie i utrzymywanie rozmowy' },
  { n: 4, name: 'Transportowa', desc: 'dostarczenie danych do właściwego programu' },
  { n: 3, name: 'Sieciowa', desc: 'adresowanie i trasa między sieciami' },
  { n: 2, name: 'Łącza danych', desc: 'przesył w obrębie jednej sieci lokalnej' },
  { n: 1, name: 'Fizyczna', desc: 'kable, fale radiowe, sygnały' }
];

const ITEM_POOL = [
  { label: 'HTTP i HTTPS', layer: 7, why: 'Protokoły stron WWW, z których korzysta przeglądarka.' },
  { label: 'DNS', layer: 7, why: 'Zamienia nazwy domen na adresy IP. To usługa dla aplikacji.' },
  { label: 'SSH', layer: 7, why: 'Zdalne logowanie do serwera, protokół aplikacji.' },
  { label: 'Kodowanie znaków UTF-8, format JPEG', layer: 6, why: 'Warstwa prezentacji dba o to, w jakim formacie są dane.' },
  { label: 'Utrzymywanie sesji między programami', layer: 5, why: 'Warstwa sesji pilnuje otwarcia, trwania i zamknięcia rozmowy.' },
  { label: 'TCP', layer: 4, why: 'Niezawodny transport: numeruje pakiety i ponawia zgubione.' },
  { label: 'UDP', layer: 4, why: 'Szybki transport bez potwierdzeń, np. dla rozmów wideo i gier.' },
  { label: 'Numer portu', layer: 4, why: 'Port mówi, do którego programu trafiają dane. To zadanie warstwy transportowej.' },
  { label: 'Adres IP', layer: 3, why: 'Adres komputera w sieci, potrzebny do wyznaczenia trasy.' },
  { label: 'Router', layer: 3, why: 'Kieruje pakiety między sieciami na podstawie adresów IP.' },
  { label: 'Adres MAC', layer: 2, why: 'Fizyczny adres karty sieciowej, używany w sieci lokalnej.' },
  { label: 'Switch (przełącznik)', layer: 2, why: 'Przesyła ramki w sieci lokalnej na podstawie adresów MAC.' },
  { label: 'Kabel sieciowy (skrętka)', layer: 1, why: 'Fizyczne medium, którym płyną sygnały elektryczne.' },
  { label: 'Fale radiowe Wi-Fi', layer: 1, why: 'Bezprzewodowe medium fizyczne.' },
  { label: 'ICMP (ping)', layer: 3, why: 'ICMP przenosi komunikaty diagnostyczne warstwy sieciowej, np. „host nieosiągalny”. Ping to jego najpopularniejsze użycie.', level: 'zaawansowany' },
  { label: 'Ramka Ethernet', layer: 2, why: 'W warstwie łącza danych dane podróżują w ramkach, adresowanych adresami MAC.', level: 'zaawansowany' },
  { label: 'VLAN (wirtualna sieć lokalna)', layer: 2, why: 'VLAN dzieli jeden switch na kilka odseparowanych sieci, np. biuro, goście, kamery. To segmentacja w warstwie 2.', level: 'zaawansowany' },
  { label: 'Światłowód', layer: 1, why: 'Kolejne medium fizyczne: sygnał płynie światłem.', level: 'zaawansowany' },
  { label: 'SMTP (wysyłanie poczty)', layer: 7, why: 'Protokół aplikacji, którym serwery pocztowe przekazują sobie wiadomości.', level: 'zaawansowany' },
  { label: 'IPsec', layer: 3, why: 'IPsec szyfruje same pakiety IP, dlatego często służy do budowy tuneli VPN między sieciami.', level: 'zaawansowany' }
];

export default {
  id: 'osi',
  title: 'Warstwy sieci (model OSI)',
  category: 'sieci',
  icon: 'layers',
  minutes: 8,
  levels: true,
  summary: 'Przypisz 14 elementów sieci, od kabla po HTTPS, do właściwej warstwy modelu OSI i zobacz, jak dane wędrują od aplikacji do kabla.',
  lesson: [
    'Sieć to wiele zadań naraz: trzeba wysłać sygnał kablem, trafić do właściwego komputera, a potem do właściwego programu. Model <strong>OSI</strong> dzieli te zadania na 7 warstw. Każda warstwa robi swoje i korzysta z warstwy pod nią.',
    'Pomyśl o wysyłce listu. Treść listu to warstwa aplikacji, koperta z adresem to warstwa sieciowa (adres IP), a listonosz i droga to warstwa fizyczna.',
    'Polski skrót od dołu: <strong>F</strong>izyczna, <strong>Ł</strong>ącza danych, <strong>S</strong>ieciowa, <strong>T</strong>ransportowa, <strong>S</strong>esji, <strong>P</strong>rezentacji, <strong>A</strong>plikacji. Zapamiętaj zdanie: „Fajne Łodzie Szybko Transportują Soczyste Pomarańcze Afrykańskie”.',
    'W praktyce częściej używa się prostszego modelu <strong>TCP/IP</strong> z 4 warstwami, ale nazwy z OSI (np. „atak w warstwie 7”) słychać w branży cały czas.'
  ],
  takeaways: [
    'Warstwa 1 to kable i radio, 2 to adresy MAC i switche, 3 to adresy IP i routery, 4 to TCP, UDP i porty, 7 to protokoły aplikacji, np. HTTP, DNS, SSH.',
    'TCP jest niezawodny (potwierdza dostarczenie), UDP jest szybszy, ale niczego nie gwarantuje.',
    'Ataki i zabezpieczenia też mają swoje warstwy. Firewall zwykle działa na warstwach 3 i 4, a WAF (firewall aplikacji webowych) na warstwie 7.',
    'Gdy coś nie działa, diagnozuj od dołu: kabel lub Wi-Fi, adres IP, port, aplikacja.'
  ],
  mount(stage, ctx) {
    const items = draw(ITEM_POOL, 14, ctx.level);
    let selected = null;
    let placed = 0;
    const firstTry = new Set(items.map((item) => item.label));
    const status = h('div', { class: 'status-stack', 'aria-live': 'polite' });
    const pool = h('div', { class: 'osi-pool', role: 'group', 'aria-label': 'Elementy do przypisania' });
    const itemButtons = new Map();
    const slots = new Map();

    for (const item of items) {
      const btn = h('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', onclick: () => select(item) }, h('span', { text: item.label }));
      itemButtons.set(item.label, btn);
      pool.append(btn);
    }

    const layerList = h(
      'ol',
      { class: 'osi-layers' },
      LAYERS.map((layer) => {
        const slot = h('div', { class: 'osi-slot' });
        slots.set(layer.n, slot);
        return h(
          'li',
          {},
          h(
            'button',
            { type: 'button', class: 'osi-layer', onclick: (event) => place(layer, event.currentTarget), 'aria-label': `Warstwa ${layer.n}: ${layer.name}` },
            h('span', { class: 'osi-num mono', text: String(layer.n) }),
            h('span', { class: 'osi-name' }, h('strong', { text: layer.name }), h('span', { class: 't-small t-muted', text: layer.desc }))
          ),
          slot
        );
      })
    );

    function select(item) {
      selected = item;
      itemButtons.forEach((btn, label) => btn.setAttribute('aria-pressed', String(label === item.label)));
      status.replaceChildren(h('p', { class: 'hint', text: `Wybrano: ${item.label}. Kliknij warstwę, do której należy.` }));
    }

    function place(layer, layerBtn) {
      if (!selected) {
        status.replaceChildren(feedback('info', null, 'Najpierw wybierz element z puli powyżej.'));
        return;
      }
      if (selected.layer === layer.n) {
        const btn = itemButtons.get(selected.label);
        btn.remove();
        slots.get(layer.n).append(h('span', { class: 'chip is-placed pop' }, icon('check'), h('span', { text: selected.label })));
        placed += 1;
        ctx.progress(placed, items.length);
        status.replaceChildren(feedback('ok', `${selected.label}: warstwa ${layer.n}`, selected.why));
        selected = null;
        if (placed === items.length) finish();
      } else {
        firstTry.delete(selected.label);
        layerBtn.classList.remove('shake');
        void layerBtn.offsetWidth;
        layerBtn.classList.add('shake');
        const direction = selected.layer > layer.n ? 'wyżej' : 'niżej';
        status.replaceChildren(feedback('bad', 'Nie ta warstwa', `${selected.label} pasuje ${direction}. Wskazówka: ${hintFor(selected.layer)}`));
      }
    }

    function hintFor(n) {
      return LAYERS.find((layer) => layer.n === n).desc + '.';
    }

    function finish() {
      const score = firstTry.size;
      status.append(
        h('div', { class: 'btn-row' }, button({ label: 'Zobacz podsumowanie', variant: 'primary', iconAfter: 'arrowRight', onclick: () => ctx.finish({ score, max: items.length }) }))
      );
      status.querySelector('.btn-primary').focus();
    }

    stage.append(
      h(
        'section',
        { class: 'panel' },
        h('p', { class: 'question-prompt', text: 'Wybierz element z puli, a potem kliknij warstwę, do której należy.' }),
        pool,
        status,
        layerList
      )
    );
    ctx.progress(0, items.length);
  }
};

export function examPool() {
  return ITEM_POOL.map((item) => {
    const others = shuffle(LAYERS.filter((layer) => layer.n !== item.layer)).slice(0, 3);
    return {
      prompt: `Do której warstwy modelu OSI należy <strong>${item.label}</strong>?`,
      options: shuffle([LAYERS.find((layer) => layer.n === item.layer), ...others]).map((layer) => ({ label: `${layer.n}. ${layer.name}`, correct: layer.n === item.layer })),
      explain: item.why,
      level: item.level
    };
  });
}
