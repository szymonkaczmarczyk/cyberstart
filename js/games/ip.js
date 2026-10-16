import { h, button, feedback, runQuiz, clear, draw, shuffle } from '../ui.js';
import { icon } from '../icons.js';

const BIT_VALUES = [128, 64, 32, 16, 8, 4, 2, 1];
const BIT_TARGETS = [10, 192, 168, 255, 172];

const CLASSIFY = [
  { ip: '192.168.1.1', answer: 'prywatny', why: 'Cała pula 192.168.0.0 do 192.168.255.255 jest prywatna. To typowy adres domowego routera.' },
  { ip: '8.8.8.8', answer: 'publiczny', why: 'Publiczny serwer DNS Google, dostępny z całego internetu.' },
  { ip: '10.20.30.40', answer: 'prywatny', why: 'Cała pula 10.x.x.x jest prywatna, często używana w firmach.' },
  { ip: '127.0.0.1', answer: 'lokalny', why: 'Adres pętli zwrotnej (localhost). Zawsze oznacza ten sam komputer, na którym jesteś.' },
  { ip: '172.20.4.9', answer: 'prywatny', why: 'Pula 172.16.0.0 do 172.31.255.255 jest prywatna. 172.20 mieści się w tym zakresie.' },
  { ip: '172.40.1.1', answer: 'publiczny', why: 'Podchwytliwe! Prywatna pula 172 kończy się na 172.31. Adres 172.40 jest już publiczny.' },
  { ip: '1.1.1.1', answer: 'publiczny', why: 'Publiczny serwer DNS firmy Cloudflare.' },
  { ip: '192.169.0.1', answer: 'publiczny', why: 'Podchwytliwe! Prywatna jest tylko pula 192.168. Adres 192.169 to już internet.' }
];

const CLASS_OPTIONS = [
  { value: 'prywatny', label: 'Prywatny (sieć lokalna)' },
  { value: 'publiczny', label: 'Publiczny (internet)' },
  { value: 'lokalny', label: 'Ten komputer (localhost)' }
];

const SUBNET_POOL = [
  {
    prompt: 'Domowa sieć ma adres <code>192.168.1.0/24</code>. Ile urządzeń możesz w niej zaadresować?',
    options: [
      { label: '254', correct: true, why: '/24 oznacza, że 24 bity to sieć, a 8 bitów to urządzenia. 2⁸ = 256 adresów, ale pierwszy (adres sieci) i ostatni (broadcast) są zarezerwowane, więc zostaje 254.' },
      { label: '256', why: 'Adresów jest 256, ale dwa są zarezerwowane: adres sieci (.0) i adres rozgłoszeniowy (.255).' },
      { label: '24', why: '24 to liczba bitów opisujących sieć, a nie liczba urządzeń.' }
    ]
  },
  {
    prompt: 'Czy <code>192.168.1.20</code> i <code>192.168.1.130</code> są w tej samej sieci <code>/24</code>?',
    options: [
      { label: 'Tak', correct: true, why: 'W /24 liczą się pierwsze trzy liczby: 192.168.1. Są takie same, więc to ta sama sieć.' },
      { label: 'Nie', why: 'Przy /24 porównujesz pierwsze trzy liczby: 192.168.1 i 192.168.1. Są identyczne.' }
    ]
  },
  {
    prompt: 'A czy te same adresy, <code>192.168.1.20</code> i <code>192.168.1.130</code>, są w tej samej sieci <code>/25</code>?',
    options: [
      { label: 'Tak', why: '/25 dzieli ostatnią liczbę na dwie połówki: 0 do 127 i 128 do 255. Adres .20 jest w pierwszej, .130 w drugiej.' },
      { label: 'Nie', correct: true, why: '/25 dzieli sieć na połówki 0 do 127 i 128 do 255. Adresy trafiają do różnych połówek, więc ruch między nimi musi przejść przez router.' }
    ]
  },
  {
    prompt: 'Dlaczego w domu wiele urządzeń ma adresy 192.168.x.x, a w internecie widać tylko jeden adres Twojego routera?',
    options: [
      { label: 'Router tłumaczy adresy prywatne na swój publiczny adres (NAT)', correct: true, why: 'NAT (Network Address Translation) pozwala wielu urządzeniom korzystać z jednego publicznego adresu. Przy okazji urządzenia z sieci domowej nie są bezpośrednio widoczne z internetu.' },
      { label: 'Bo adresy 192.168 są szyfrowane', why: 'Adresy nie są szyfrowane. To mechanizm NAT w routerze.' },
      { label: 'Bo każde urządzenie dostaje losowy adres przy każdym połączeniu', why: 'Za to odpowiada NAT w routerze, a nie losowanie.' }
    ]
  },
  {
    prompt: 'Co to jest IPv6 i po co powstał?',
    options: [
      { label: 'Nowsza wersja adresów IP, bo adresów IPv4 zaczęło brakować', correct: true, why: 'IPv4 ma około 4,3 miliarda adresów, co dziś nie wystarcza. Adresy IPv6 są dłuższe, np. 2001:db8::1, i jest ich praktycznie nieograniczenie wiele.' },
      { label: 'Szóste urządzenie w sieci domowej', why: 'To nazwa wersji protokołu IP, a nie numer urządzenia.' },
      { label: 'Szyfrowana wersja IPv4', why: 'IPv6 nie oznacza szyfrowania. Rozwiązuje problem braku adresów.' }
    ]
  },
  {
    prompt: 'Ile urządzeń zmieścisz w podsieci <code>/26</code>?',
    level: 'zaawansowany',
    options: [
      { label: '62', correct: true, why: '/26 zostawia 6 bitów na urządzenia: 2⁶ = 64 adresy, minus adres sieci i broadcast, czyli 62.' },
      { label: '64', why: 'Adresów jest 64, ale dwa są zarezerwowane.' },
      { label: '126', why: 'Tyle ma /25. Każdy bit więcej po ukośniku dzieli sieć na pół.' }
    ]
  },
  {
    prompt: 'Jaki jest adres sieci dla hosta <code>192.168.10.77/26</code>?',
    level: 'zaawansowany',
    options: [
      { label: '192.168.10.64', correct: true, why: 'Sieci /26 zaczynają się co 64: .0, .64, .128, .192. Adres .77 należy do bloku od .64 do .127.' },
      { label: '192.168.10.0', why: 'To byłby adres sieci przy /24. Przy /26 bloki mają po 64 adresy.' },
      { label: '192.168.10.77', why: 'To adres hosta, a nie sieci.' }
    ]
  },
  {
    prompt: 'Maska <code>255.255.255.0</code> to w zapisie CIDR:',
    level: 'zaawansowany',
    options: [
      { label: '/24', correct: true, why: 'Trzy razy 255 to trzy oktety pełne jedynek: 3 × 8 = 24 bity sieci.' },
      { label: '/8', why: '/8 to maska 255.0.0.0.' },
      { label: '/255', why: 'Liczba po ukośniku to liczba bitów, maksymalnie 32 dla IPv4.' }
    ]
  },
  {
    prompt: 'Komputer w biurze ma adres <code>169.254.13.7</code>. Co to najpewniej znaczy?',
    level: 'zaawansowany',
    options: [
      { label: 'Nie dostał adresu z serwera DHCP i nadał sobie adres awaryjny', correct: true, why: 'Adresy 169.254.x.x (link-local) system nadaje sam, gdy nikt w sieci nie przydzielił mu adresu. Zwykle oznacza to problem z kablem, Wi-Fi albo serwerem DHCP.' },
      { label: 'Ma publiczny adres z internetu', why: '169.254 to specjalna pula link-local, nieroutowalna w internecie.' },
      { label: 'Został zhakowany', why: 'To typowy objaw braku DHCP, a nie włamania.' }
    ]
  }
];

export default {
  id: 'ip',
  title: 'Adresy IP i podsieci',
  category: 'sieci',
  icon: 'binary',
  minutes: 12,
  levels: true,
  summary: 'Złóż liczby z bitów jak komputer, rozpoznaj adresy prywatne i publiczne, a na koniec rozgryź, co znaczy zapis /24.',
  lesson: [
    '<strong>Adres IP</strong> to numer urządzenia w sieci, jak adres domu na kopercie. Najpopularniejsza wersja, IPv4, wygląda tak: <code>192.168.1.20</code>, czyli cztery liczby od 0 do 255.',
    'Dlaczego akurat do 255? Bo każda z czterech liczb to 8 bitów (zer i jedynek). Bity mają wartości 128, 64, 32, 16, 8, 4, 2, 1. Gdy wszystkie są jedynkami, suma wynosi 255.',
    'Adresy dzielą się na <strong>prywatne</strong> (w domu i firmie: 10.x.x.x, 172.16 do 172.31, 192.168.x.x) i <strong>publiczne</strong> (widoczne w internecie). Adres <code>127.0.0.1</code> to zawsze Twój własny komputer.',
    'Zapis <code>/24</code> po adresie (CIDR) mówi, ile pierwszych bitów opisuje sieć. Przy <code>/24</code> sieć to pierwsze trzy liczby, a ostatnia numeruje urządzenia.'
  ],
  takeaways: [
    'IPv4 to cztery liczby 0 do 255, każda zapisana w 8 bitach o wartościach 128, 64, 32, 16, 8, 4, 2, 1.',
    'Prywatne pule: 10.0.0.0/8, 172.16.0.0/12 (172.16 do 172.31) i 192.168.0.0/16. Adres 127.0.0.1 to localhost.',
    '/24 to 256 adresów, z czego 254 dla urządzeń. Im większa liczba po ukośniku, tym mniejsza sieć.',
    'NAT w routerze ukrywa urządzenia domowe za jednym publicznym adresem.',
    'W analizie logów od razu sprawdzaj, czy adres jest z Twojej sieci czy z internetu. To zmienia ocenę zdarzenia.'
  ],
  async mount(stage, ctx) {
    const targets = ctx.level === 'zaawansowany' ? Array.from({ length: 5 }, () => 1 + Math.floor(Math.random() * 254)) : shuffle(BIT_TARGETS);
    const addresses = shuffle(CLASSIFY);
    const subnet = draw(SUBNET_POOL, 5, ctx.level);
    const total = targets.length + addresses.length + subnet.length;
    const bitScore = await playBits(stage, ctx, total, targets);
    const classifyScore = await playClassify(stage, ctx, total, addresses, targets.length);
    const subnetScore = await runQuiz(stage, ctx, subnet, { label: 'Podsieci', offset: targets.length + addresses.length, total });
    ctx.finish({ score: bitScore + classifyScore + subnetScore, max: total });
  }
};

function playBits(stage, ctx, total, targets) {
  return new Promise((resolve) => {
    let round = 0;
    let score = 0;
    const panel = h('section', { class: 'panel' });
    stage.append(panel);

    function show() {
      if (round >= targets.length) {
        panel.remove();
        resolve(score);
        return;
      }
      ctx.progress(round, total);
      const target = targets[round];
      const state = BIT_VALUES.map(() => false);
      let revealed = false;
      const sum = h('strong', { class: 'bits-sum mono', text: '0' });
      const binary = h('code', { class: 'mono', text: '00000000' });
      const status = h('div', { class: 'status-stack', 'aria-live': 'polite' });
      const bitButtons = BIT_VALUES.map((value, i) =>
        h(
          'button',
          { type: 'button', class: 'bit', 'aria-pressed': 'false', 'aria-label': `Bit o wartości ${value}`, onclick: () => toggle(i) },
          h('span', { class: 'bit-digit mono', text: '0' }),
          h('span', { class: 'bit-value mono', text: String(value) })
        )
      );

      function toggle(i) {
        if (bitButtons[0].disabled) return;
        state[i] = !state[i];
        bitButtons[i].setAttribute('aria-pressed', String(state[i]));
        bitButtons[i].querySelector('.bit-digit').textContent = state[i] ? '1' : '0';
        const current = state.reduce((acc, on, j) => acc + (on ? BIT_VALUES[j] : 0), 0);
        sum.textContent = String(current);
        binary.textContent = state.map((on) => (on ? '1' : '0')).join('');
        if (current === target) succeed();
        else if (current > target) status.replaceChildren(feedback('warn', 'Za dużo', `Suma ${current} przekracza ${target}. Wyłącz któryś bit.`));
        else status.replaceChildren();
      }

      function succeed() {
        bitButtons.forEach((btn) => { btn.disabled = true; });
        revealButton.disabled = true;
        if (!revealed) score += 1;
        status.replaceChildren(
          feedback('ok', `${target} = ${binary.textContent}`, revealed ? 'Teraz wiesz, jak to złożyć. Następnym razem bez podpowiedzi.' : 'Tak komputer zapisuje tę liczbę w jednej części adresu IP.'),
          h('div', { class: 'btn-row' }, button({ label: round === targets.length - 1 ? 'Dalej: rodzaje adresów' : 'Następna liczba', variant: 'primary', iconAfter: 'arrowRight', onclick: () => { round += 1; show(); } }))
        );
        status.querySelector('.btn-primary').focus();
      }

      const revealButton = button({ label: 'Pokaż rozwiązanie', iconName: 'eye', size: 'sm', onclick: reveal });

      function reveal() {
        revealed = true;
        let rest = target;
        BIT_VALUES.forEach((value, i) => {
          const on = rest >= value;
          if (on) rest -= value;
          if (state[i] !== on) toggle(i);
        });
      }

      clear(panel).append(
        h('div', { class: 'panel-title' }, h('span', { class: 'tag tag-accent', text: `Bity ${round + 1} z ${targets.length}` })),
        h('p', { class: 'question-prompt', html: `Włącz bity tak, żeby ich suma dała <strong class="mono">${target}</strong>.` }),
        h('p', { class: 'hint', text: 'Zacznij od największego bitu, który mieści się w liczbie, i odejmuj.' }),
        h('div', { class: 'bits', role: 'group', 'aria-label': 'Osiem bitów' }, bitButtons),
        h('div', { class: 'bits-result' }, h('span', { class: 't-muted', text: 'Suma:' }), sum, h('span', { class: 't-muted', text: 'Binarnie:' }), binary),
        h('div', { class: 'btn-row' }, revealButton),
        status
      );
    }

    show();
  });
}

function playClassify(stage, ctx, total, addresses, offset) {
  return new Promise((resolve) => {
    let round = 0;
    let score = 0;
    const panel = h('section', { class: 'panel' });
    stage.append(panel);

    function show() {
      if (round >= addresses.length) {
        panel.remove();
        resolve(score);
        return;
      }
      ctx.progress(offset + round, total);
      const item = addresses[round];
      const status = h('div', { class: 'status-stack', 'aria-live': 'polite' });
      const buttons = CLASS_OPTIONS.map((option) =>
        button({
          label: option.label,
          onclick: () => {
            buttons.forEach((btn) => { btn.disabled = true; });
            const correct = option.value === item.answer;
            if (correct) score += 1;
            status.replaceChildren(
              feedback(correct ? 'ok' : 'bad', correct ? 'Dobrze' : `To adres: ${item.answer}`, item.why),
              h('div', { class: 'btn-row' }, button({ label: round === addresses.length - 1 ? 'Dalej: podsieci' : 'Następny adres', variant: 'primary', iconAfter: 'arrowRight', onclick: () => { round += 1; show(); } }))
            );
            status.querySelector('.btn-primary').focus();
          }
        })
      );
      clear(panel).append(
        h('div', { class: 'panel-title' }, h('span', { class: 'tag tag-accent', text: `Adres ${round + 1} z ${addresses.length}` })),
        h('p', { class: 'question-prompt', text: 'Jaki to adres?' }),
        h('p', { class: 'ip-big mono', text: item.ip }),
        h('div', { class: 'btn-row' }, buttons),
        h('details', { class: 'cheatsheet' }, h('summary', {}, icon('info'), h('span', { text: 'Ściąga: prywatne pule adresów' })), h('p', { class: 't-small mono', text: '10.0.0.0 do 10.255.255.255 | 172.16.0.0 do 172.31.255.255 | 192.168.0.0 do 192.168.255.255 | 127.x.x.x to localhost' })),
        status
      );
    }

    show();
  });
}

export function examPool() {
  return SUBNET_POOL;
}
