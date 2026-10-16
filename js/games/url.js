import { h, button, feedback, clear, draw, shuffle } from '../ui.js';
import { icon } from '../icons.js';

const OFFICIAL = 'bankhoryzont.pl';

const ROUNDS = [
  {
    tokens: ['https://', 'logowanie.', 'bankhoryzont.pl', '/konto'],
    domain: 2,
    official: true,
    why: 'Domena to <strong>bankhoryzont.pl</strong>. „logowanie.” przed nią to subdomena, którą może utworzyć tylko właściciel domeny banku.'
  },
  {
    tokens: ['https://', 'bankhoryzont.', 'pl.', 'logowanie-weryfikacja.com', '/konto'],
    domain: 3,
    official: false,
    why: 'Czytaj od końca nazwy hosta! Prawdziwa domena to <strong>logowanie-weryfikacja.com</strong>. „bankhoryzont.pl.” to tylko subdomeny, które oszust nazwał, jak chciał.'
  },
  {
    tokens: ['https://', 'bankh0ryzont.pl', '/logowanie'],
    domain: 1,
    official: false,
    why: 'W <strong>bankh0ryzont.pl</strong> zamiast litery o jest cyfra 0. To typosquatting: rejestracja domen łudząco podobnych do prawdziwych.'
  },
  {
    tokens: ['https://', 'www.', 'bankhoryzont.pl', '/pomoc', '?ref=logowanie-bank.com'],
    domain: 2,
    official: true,
    why: 'Domena to <strong>bankhoryzont.pl</strong>. To, co jest po ukośniku i znaku zapytania, to tylko ścieżka i parametry. Nie zmieniają miejsca docelowego.'
  },
  {
    tokens: ['http://', 'bankhoryzont.pl', '@', '185.23.10.4', '/login'],
    domain: 3,
    official: false,
    why: 'Wszystko przed znakiem <strong>@</strong> to tylko „nazwa użytkownika”, którą przeglądarka ignoruje. Naprawdę łączysz się z serwerem <strong>185.23.10.4</strong>. Do tego brak https.'
  },
  {
    tokens: ['https://', 'bank-horyzont.pl', '/oferta'],
    domain: 1,
    official: false,
    why: '<strong>bank-horyzont.pl</strong> z łącznikiem to zupełnie inna domena niż bankhoryzont.pl. Każdy znak ma znaczenie.'
  },
  {
    tokens: ['https://', 'secure.', 'bankhoryzont-pl.net', '/bankhoryzont.pl/login'],
    domain: 2,
    official: false,
    why: 'Domena to <strong>bankhoryzont-pl.net</strong>. Słowo „secure” nic nie gwarantuje, a „/bankhoryzont.pl/” w ścieżce to tylko nazwa katalogu na serwerze oszusta.'
  },
  {
    tokens: ['https://', 'bit.ly', '/3Kp9xQz'],
    domain: 1,
    official: false,
    why: 'Domena to <strong>bit.ly</strong>, czyli skracacz linków. Nie wiesz, dokąd naprawdę prowadzi. Bank nie wysyła skróconych linków do logowania. Cel skróconego linku można sprawdzić w serwisach do podglądu, bez klikania.'
  },
  {
    tokens: ['https://', 'm.', 'bankhoryzont.pl', '/aplikacja'],
    domain: 2,
    official: true,
    why: 'Domena to <strong>bankhoryzont.pl</strong>, a „m.” to subdomena wersji mobilnej. Subdomeny może tworzyć tylko właściciel domeny.'
  },
  {
    tokens: ['https://', 'bankhoryzont.com', '/pl/logowanie'],
    domain: 1,
    official: false,
    level: 'zaawansowany',
    why: 'Domena to <strong>bankhoryzont.com</strong>, a bank używa <strong>bankhoryzont.pl</strong>. Inna końcówka (TLD) to inna domena i może należeć do kogokolwiek.'
  },
  {
    tokens: ['https://', 'bankhoryzont.', 'pl-weryfikacja.online', '/start'],
    domain: 2,
    official: false,
    level: 'zaawansowany',
    why: 'Kropka i łącznik robią różnicę. Nazwa hosta to bankhoryzont.pl-weryfikacja.online, więc domena to <strong>pl-weryfikacja.online</strong>. „bankhoryzont.” to tylko subdomena.'
  },
  {
    tokens: ['https://', 'xn--bankhryzont-9ib.pl', '/logowanie'],
    domain: 1,
    official: false,
    level: 'zaawansowany',
    why: 'Przedrostek <strong>xn--</strong> oznacza zapis punycode, czyli domenę ze znakami spoza alfabetu łacińskiego. Ktoś mógł użyć cyrylickiej litery „о”, która wygląda jak łacińskie „o”. To atak homograficzny: w treści maila adres wyglądał identycznie jak prawdziwy.'
  }
];

export default {
  id: 'url',
  title: 'Detektyw adresów',
  category: 'ludzie',
  icon: 'link',
  minutes: 8,
  levels: true,
  summary: 'Osiem linków, które udają stronę banku. W każdym wskaż prawdziwą domenę i zdecyduj, czy to oficjalna strona. Nauczysz się czytać adresy jak specjalista.',
  lesson: [
    'Adres strony (URL) ma kilka części: <code>https://</code> to protokół, potem nazwa hosta, np. <code>logowanie.bankhoryzont.pl</code>, a po ukośniku ścieżka, np. <code>/konto</code>.',
    'O tym, do kogo należy strona, decyduje <strong>domena</strong>: ostatnie dwa człony nazwy hosta przed pierwszym ukośnikiem, np. <code>bankhoryzont.pl</code>. Wszystko na lewo od niej to subdomeny, które właściciel domeny nazywa dowolnie.',
    'Oszuści to wykorzystują: tworzą adresy typu <code>bankhoryzont.pl.weryfikacja.com</code>, gdzie znana nazwa stoi na początku, a prawdziwa domena chowa się na końcu.',
    'W tej grze oficjalny bank ma domenę <code>bankhoryzont.pl</code>. Kliknij fragment adresu, który jest prawdziwą domeną.'
  ],
  takeaways: [
    'Znajdź pierwszy pojedynczy ukośnik po https:// i czytaj nazwę hosta od prawej: ostatnie dwa człony to domena.',
    'Subdomeny (logowanie., secure., www.) i ścieżka (/bankhoryzont.pl/) mogą zawierać dowolne słowa i niczego nie dowodzą.',
    'Uważaj na literówki: 0 zamiast o, rn zamiast m, dodatkowy łącznik.',
    'Znak @ w adresie i skrócone linki to sygnał, żeby się zatrzymać.',
    'Kłódka i https oznaczają tylko szyfrowane połączenie. Oszuści też mają certyfikaty.'
  ],
  async mount(stage, ctx) {
    let score = 0;
    const rounds = draw(ROUNDS, 8, ctx.level);
    for (const [index, round] of rounds.entries()) {
      ctx.progress(index, rounds.length);
      score += await playRound(stage, round, index, rounds.length);
    }
    ctx.finish({ score, max: rounds.length * 2 });
  }
};

function playRound(stage, round, index, total) {
  return new Promise((resolve) => {
    let points = 0;
    const status = h('div', { class: 'status-stack', 'aria-live': 'polite' });
    const verdict = h('div');
    const bar = h('div', { class: 'url-bar', role: 'group', 'aria-label': 'Części adresu do kliknięcia' }, icon('globe'));
    const tokenButtons = round.tokens.map((token, i) =>
      h('button', { type: 'button', class: 'url-token mono', onclick: () => pickDomain(i) }, token)
    );
    bar.append(...tokenButtons);

    function pickDomain(i) {
      tokenButtons.forEach((btn) => { btn.disabled = true; });
      const correct = i === round.domain;
      if (correct) points += 1;
      tokenButtons[round.domain].classList.add('is-domain');
      if (!correct) tokenButtons[i].classList.add('is-wrong');
      status.replaceChildren(feedback(correct ? 'ok' : 'bad', correct ? 'Tak, to prawdziwa domena' : `Prawdziwa domena to ${round.tokens[round.domain].replace(/^[./]+|[./]+$/g, '')}`, correct ? 'Teraz najważniejsze pytanie:' : 'Zaznaczyliśmy ją na zielono. Teraz najważniejsze pytanie:'));
      const yes = button({ label: 'Tak, to strona banku', iconName: 'shieldCheck', onclick: () => decide(true) });
      const no = button({ label: 'Nie, to nie bank', iconName: 'alert', onclick: () => decide(false) });
      verdict.replaceChildren(h('p', { class: 'question-prompt', html: `Czy to oficjalna strona banku <span class="mono">${OFFICIAL}</span>?` }), h('div', { class: 'btn-row' }, yes, no));
      yes.focus();

      function decide(answer) {
        yes.disabled = true;
        no.disabled = true;
        const ok = answer === round.official;
        if (ok) points += 1;
        verdict.append(
          feedback(ok ? 'ok' : 'bad', ok ? 'Dobrze' : round.official ? 'To jednak strona banku' : 'To nie jest strona banku', round.why),
          h('div', { class: 'btn-row' }, button({ label: index === total - 1 ? 'Zobacz podsumowanie' : 'Następny adres', variant: 'primary', iconAfter: 'arrowRight', onclick: () => { panel.remove(); resolve(points); } }))
        );
        verdict.querySelector('.btn-primary').focus();
      }
    }

    const panel = h(
      'section',
      { class: 'panel' },
      h('div', { class: 'panel-title' }, h('span', { class: 'tag tag-accent', text: `Adres ${index + 1} z ${total}` })),
      h('p', { class: 'question-prompt', text: 'Kliknij część adresu, która jest prawdziwą domeną.' }),
      bar,
      status,
      verdict
    );
    clear(stage).append(panel);
  });
}

export function examPool() {
  const clean = (token) => token.replace(/^[./@]+|[./@]+$/g, '');
  return ROUNDS.map((round) => {
    const domain = clean(round.tokens[round.domain]);
    const hostParts = round.tokens.filter((token, i) => i > 0 && !token.startsWith('/') && !token.startsWith('?')).map(clean).filter(Boolean);
    const labels = [...new Set([domain, ...hostParts, OFFICIAL])];
    return {
      prompt: `Do kogo naprawdę prowadzi ten adres, czyli jaka jest jego domena? <span class="mono">${round.tokens.join('')}</span>`,
      options: shuffle(labels).map((label) => ({ label: `<span class="mono">${label}</span>`, correct: label === domain })),
      explain: round.why,
      level: round.level
    };
  });
}
