import { h, button, feedback, runQuiz, choiceQuestion, draw } from '../ui.js';

const PLAIN = 'SPOTKANIE PRZY SERWEROWNI O PIATEJ';
const SECRET_SHIFT = 3;
const BASE64_SECRET = 'c3VwZXJ0YWpuZTEyMw==';

const BASE64_QUESTION = {
  prompt: 'Programista „zaszyfrował” hasło w Base64 i umieścił je w kodzie strony. Czy jest bezpieczne?',
  options: [
    { label: 'Nie. Base64 to kodowanie, które każdy odwróci bez żadnego klucza', correct: true, why: 'Wystarczyło do tego jedno kliknięcie. Base64 służy do zapisu danych binarnych jako tekstu, a nie do ich ukrywania.' },
    { label: 'Tak, bo nie da się go przeczytać na pierwszy rzut oka', why: 'Nieczytelne nie znaczy zaszyfrowane. Każdy dekoder Base64 odczyta to w sekundę.' }
  ]
};

const HASH_QUESTIONS = [
  {
    prompt: 'Masz skrót SHA-256 jakiegoś hasła. Czy da się z niego „odszyfrować” hasło?',
    options: [
      { label: 'Nie wprost. Można tylko zgadywać hasła, liczyć ich skróty i porównywać', correct: true, why: 'Funkcja skrótu działa w jedną stronę. Dlatego słabe hasła i tak padają: atakujący liczy skróty milionów popularnych haseł i szuka zgodności.' },
      { label: 'Tak, wystarczy klucz', why: 'Funkcje skrótu nie mają klucza i nie da się ich odwrócić. To nie jest szyfrowanie.' }
    ]
  },
  {
    prompt: 'Dlaczego do przechowywania haseł używa się specjalnych funkcji, np. Argon2 lub bcrypt, a nie zwykłego SHA-256?',
    options: [
      { label: 'Są celowo powolne i dodają sól, więc masowe zgadywanie staje się bardzo drogie', correct: true, why: 'SHA-256 jest bardzo szybki: karta graficzna liczy miliardy skrótów na sekundę. Argon2 i bcrypt spowalniają każdą próbę, a sól (losowy dodatek) sprawia, że te same hasła mają różne skróty.' },
      { label: 'Dają krótsze skróty, więc baza zajmuje mniej miejsca', why: 'Nie o rozmiar chodzi, tylko o koszt zgadywania.' }
    ]
  },
  {
    prompt: 'Pobierasz obraz Kali Linux. Obok linku jest skrót SHA-256. Po co?',
    options: [
      { label: 'Żeby sprawdzić, czy plik nie został uszkodzony ani podmieniony', correct: true, why: 'Liczysz skrót pobranego pliku (np. <code>shasum -a 256 plik.iso</code>) i porównujesz z opublikowanym. Każda różnica oznacza inny plik.' },
      { label: 'To hasło do rozpakowania obrazu', why: 'Skrót nie jest hasłem. To odcisk palca pliku.' }
    ]
  },
  {
    prompt: 'Dlaczego MD5 i SHA-1 uznaje się dziś za złamane?',
    level: 'zaawansowany',
    options: [
      { label: 'Da się celowo stworzyć dwa różne pliki o tym samym skrócie (kolizja)', correct: true, why: 'Skoro można podrobić plik o tym samym skrócie, skrót przestaje potwierdzać autentyczność. Dlatego do podpisów i integralności używa się SHA-256 lub nowszych.' },
      { label: 'Bo da się je odwrócić kluczem', why: 'Nadal nie da się ich „odwrócić”. Problemem są kolizje.' }
    ]
  },
  {
    prompt: 'Czym jest tęczowa tablica (rainbow table) i co ją unieszkodliwia?',
    level: 'zaawansowany',
    options: [
      { label: 'Gotowa baza skrótów popularnych haseł. Unieszkodliwia ją sól', correct: true, why: 'Z solą każde hasło ma unikalny skrót, więc gotowe tablice są bezużyteczne i atakujący musi liczyć wszystko od nowa dla każdego konta.' },
      { label: 'Kolorowy wykres siły haseł. Nic jej nie unieszkodliwia', why: 'To baza wcześniej policzonych skrótów, a obroną jest sól.' }
    ]
  }
];

const CRYPTO_QUESTIONS = [
  {
    prompt: 'Szyfrowanie <strong>symetryczne</strong> (np. AES) oznacza, że:',
    options: [
      { label: 'Ten sam klucz szyfruje i odszyfrowuje dane', correct: true, why: 'Jest bardzo szybkie, ale obie strony muszą jakoś bezpiecznie wymienić się tym samym kluczem.' },
      { label: 'Są dwa klucze: publiczny i prywatny', why: 'To opis szyfrowania asymetrycznego.' }
    ]
  },
  {
    prompt: 'W szyfrowaniu <strong>asymetrycznym</strong> klucz publiczny działa jak otwarta kłódka. Kto może otworzyć zatrzaśniętą nią skrzynkę?',
    options: [
      { label: 'Tylko właściciel klucza prywatnego', correct: true, why: 'Klucz publiczny możesz rozdawać każdemu: każdy zatrzaśnie kłódkę. Otworzy ją tylko ten, kto ma klucz prywatny. Dlatego klucza prywatnego nie pokazuje się nikomu.' },
      { label: 'Każdy, kto ma klucz publiczny', why: 'Klucz publiczny tylko zamyka. Otwiera wyłącznie klucz prywatny.' }
    ]
  },
  {
    prompt: 'Jak HTTPS łączy oba rodzaje szyfrowania?',
    options: [
      { label: 'Asymetryczne służy do bezpiecznego ustalenia klucza, a symetryczne do szybkiego przesyłania danych', correct: true, why: 'Najlepsze z obu światów: kryptografia asymetryczna rozwiązuje problem wymiany klucza, a szybka symetryczna szyfruje całą resztę rozmowy.' },
      { label: 'Używa tylko asymetrycznego, bo jest bezpieczniejsze', why: 'Asymetryczne jest za wolne do szyfrowania dużych ilości danych.' },
      { label: 'Wysyła klucz symetryczny jawnym tekstem na początku rozmowy', why: 'Wtedy każdy podsłuchujący poznałby klucz. Właśnie dlatego używa się kryptografii asymetrycznej.' }
    ]
  },
  {
    prompt: 'Do czego służy podpis cyfrowy?',
    options: [
      { label: 'Potwierdza, kto wysłał dane i że nikt ich nie zmienił', correct: true, why: 'Nadawca podpisuje kluczem prywatnym, a każdy sprawdza podpis kluczem publicznym. Tak weryfikuje się m.in. aktualizacje oprogramowania.' },
      { label: 'Ukrywa treść wiadomości', why: 'Podpis nie szyfruje treści. Potwierdza autora i integralność.' }
    ]
  },
  {
    prompt: 'Czym jest Perfect Forward Secrecy w TLS?',
    level: 'zaawansowany',
    options: [
      { label: 'Każda sesja ma własny, jednorazowy klucz, więc kradzież klucza serwera nie odszyfruje dawnych nagrań ruchu', correct: true, why: 'Dzięki wymianie kluczy typu ECDHE nagrany dziś ruch pozostanie bezpieczny, nawet jeśli za rok wycieknie klucz prywatny serwera.' },
      { label: 'Szyfrowanie, którego nie da się złamać nigdy', why: 'Chodzi o ochronę przeszłych sesji przed przyszłym wyciekiem klucza.' }
    ]
  },
  {
    prompt: 'Co oznacza szyfrowanie end-to-end (E2E) w komunikatorze?',
    level: 'zaawansowany',
    options: [
      { label: 'Treść odszyfrować mogą tylko urządzenia rozmówców, a nie serwer komunikatora', correct: true, why: 'Serwer przekazuje tylko zaszyfrowane dane. Dlatego ważne jest porównanie kodów bezpieczeństwa z rozmówcą przy podejrzeniu podszycia.' },
      { label: 'Wiadomości są szyfrowane tylko w drodze do serwera', why: 'To zwykłe szyfrowanie transportu (np. TLS). E2E oznacza, że serwer nie widzi treści.' }
    ]
  }
];

function caesar(text, shift) {
  return [...text].map((ch) => {
    const code = ch.charCodeAt(0);
    if (code < 65 || code > 90) return ch;
    return String.fromCharCode(((code - 65 + shift + 26) % 26) + 65);
  }).join('');
}

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export default {
  id: 'szyfry',
  title: 'Szyfry, hashe i kodowanie',
  category: 'hasla',
  icon: 'lock',
  minutes: 12,
  levels: true,
  summary: 'Złam szyfr Cezara suwakiem, odkoduj „ukryte” hasło w Base64, zobacz efekt lawinowy funkcji skrótu i zrozum, jak działa kłódka HTTPS.',
  lesson: [
    'Trzy pojęcia, które początkujący często mylą: <strong>kodowanie</strong> zmienia zapis danych i każdy może je odwrócić (np. Base64). <strong>Szyfrowanie</strong> ukrywa dane i odwraca się je tylko kluczem (np. AES). <strong>Skrót</strong> (hash) to odcisk palca danych, którego nie da się odwrócić (np. SHA-256).',
    'Szyfr Cezara przesuwa każdą literę o stałą liczbę miejsc w alfabecie. Ma tylko 25 możliwych kluczy, więc łamie się go, sprawdzając wszystkie. To najprostsza ilustracja ataku brute force.',
    'Współczesne szyfry mają tak wiele możliwych kluczy (np. 2²⁵⁶), że sprawdzenie wszystkich trwałoby dłużej niż istnieje Wszechświat. Dlatego atakuje się raczej ludzi i słabe hasła niż matematykę.'
  ],
  takeaways: [
    'Kodowanie (Base64) to nie ochrona. Szyfrowanie wymaga klucza. Skrótu nie da się odwrócić.',
    'Mała liczba możliwych kluczy oznacza, że szyfr padnie przez sprawdzenie wszystkich (brute force).',
    'Najmniejsza zmiana danych daje zupełnie inny skrót. Dlatego skróty służą do sprawdzania integralności plików.',
    'Hasła przechowuje się jako skróty z solą, policzone wolną funkcją: Argon2id lub bcrypt.',
    'Klucz publiczny zamyka, prywatny otwiera. HTTPS używa obu rodzajów szyfrowania naraz.'
  ],
  async mount(stage, ctx) {
    const total = 4;
    ctx.progress(0, total);
    const caesarScore = await playCaesar(stage);
    ctx.progress(1, total);
    const base64Score = await playBase64(stage, ctx);
    ctx.progress(2, total);
    await playHashLab(stage);
    const hashScore = await runQuiz(stage, ctx, draw(HASH_QUESTIONS, 2, ctx.level), { title: 'Skróty, pytanie', offset: 2, total: 4 });
    ctx.progress(3, total);
    const cryptoScore = await runQuiz(stage, ctx, draw(CRYPTO_QUESTIONS, 3, ctx.level), { title: 'Klucze, pytanie', offset: 3, total: 4 });
    ctx.finish({ score: caesarScore + base64Score + hashScore + cryptoScore, max: 8 });
  }
};

function playCaesar(stage) {
  return new Promise((resolve) => {
    const cipher = caesar(PLAIN, SECRET_SHIFT);
    let attempts = 0;
    const output = h('p', { class: 'cipher-text mono', 'aria-live': 'polite', text: cipher });
    const shiftLabel = h('output', { class: 'mono', for: 'caesar-shift', text: '0' });
    const slider = h('input', { type: 'range', id: 'caesar-shift', class: 'range', min: '0', max: '25', value: '0', step: '1' });
    const status = h('div');
    slider.addEventListener('input', () => {
      const shift = Number(slider.value);
      shiftLabel.textContent = String(shift);
      output.textContent = caesar(cipher, -shift);
    });
    const submit = button({
      label: 'Wiadomość odczytana',
      variant: 'primary',
      iconName: 'check',
      onclick: () => {
        attempts += 1;
        if (Number(slider.value) === SECRET_SHIFT) {
          submit.disabled = true;
          slider.disabled = true;
          status.replaceChildren(
            feedback('ok', `Klucz to ${SECRET_SHIFT}`, `Tak szyfrował podobno Juliusz Cezar. Zauważ, że wystarczyło sprawdzić najwyżej 25 możliwości. Komputer zrobi to w ułamku milisekundy.`),
            h('div', { class: 'btn-row' }, button({ label: 'Dalej: Base64', variant: 'primary', iconAfter: 'arrowRight', onclick: () => { panel.remove(); resolve(attempts === 1 ? 2 : 1); } }))
          );
          status.querySelector('.btn-primary').focus();
        } else {
          status.replaceChildren(feedback('bad', 'To jeszcze nie to', 'Tekst wciąż wygląda jak przypadkowe litery. Przesuwaj suwak, aż pojawią się polskie słowa.'));
        }
      }
    });
    const panel = h(
      'section',
      { class: 'panel' },
      h('div', { class: 'panel-title' }, h('span', { class: 'tag tag-accent', text: 'Część 1: szyfr Cezara' })),
      h('p', { class: 'question-prompt', text: 'Oto przechwycona, zaszyfrowana wiadomość. Przesuwaj suwak, aż odczytasz tekst.' }),
      output,
      h('div', { class: 'field' }, h('label', { for: 'caesar-shift' }, 'Przesunięcie: ', shiftLabel), slider),
      h('div', { class: 'btn-row' }, submit),
      status
    );
    stage.append(panel);
  });
}

function playBase64(stage, ctx) {
  return new Promise((resolve) => {
    const decoded = h('code', { class: 'mono', text: BASE64_SECRET });
    const status = h('div');
    const decodeBtn = button({
      label: 'Odkoduj Base64',
      iconName: 'eye',
      onclick: () => {
        decoded.textContent = atob(BASE64_SECRET);
        decoded.classList.add('pop', 'is-decoded');
        decodeBtn.disabled = true;
        status.append(
          choiceQuestion({
            ...BASE64_QUESTION,
            signal: ctx.signal,
            onDone: (correct) => {
              panel.remove();
              resolve(correct ? 1 : 0);
            }
          })
        );
      }
    });
    const panel = h(
      'section',
      { class: 'panel' },
      h('div', { class: 'panel-title' }, h('span', { class: 'tag tag-accent', text: 'Część 2: Base64' })),
      h('p', { class: 'question-prompt', text: 'W kodzie strony logowania jest taki fragment:' }),
      h('pre', { class: 'code-block', tabindex: '0' }, h('code', {}, 'const adminPassword = atob("', decoded, '");')),
      h('div', { class: 'btn-row' }, decodeBtn),
      status
    );
    stage.append(panel);
  });
}

function playHashLab(stage) {
  return new Promise((resolve) => {
    const makeSide = (id, value) => {
      const input = h('input', { class: 'input mono', id, type: 'text', value, autocomplete: 'off', spellcheck: false });
      const out = h('code', { class: 'hash-out mono' });
      return { input, out };
    };
    const a = makeSide('hash-a', 'kot');
    const b = makeSide('hash-b', 'Kot');
    const diff = h('p', { class: 'hint', 'aria-live': 'polite' });

    async function update() {
      const [ha, hb] = await Promise.all([sha256(a.input.value), sha256(b.input.value)]);
      a.out.replaceChildren(ha);
      b.out.replaceChildren(...[...hb].map((ch, i) => (ch === ha[i] ? ch : h('mark', { text: ch }))));
      const same = [...hb].filter((ch, i) => ch === ha[i]).length;
      diff.textContent = a.input.value === b.input.value ? 'Te same dane dają zawsze ten sam skrót.' : `Różni się ${64 - same} z 64 znaków skrótu (zaznaczone). Zmiana jednej litery zmienia prawie wszystko.`;
    }

    [a, b].forEach((side) => side.input.addEventListener('input', update));
    update();

    const panel = h(
      'section',
      { class: 'panel' },
      h('div', { class: 'panel-title' }, h('span', { class: 'tag tag-accent', text: 'Część 3: funkcja skrótu SHA-256' })),
      h('p', { class: 'question-prompt', text: 'Zmień tekst w jednym z pól i obserwuj skróty. Spróbuj dodać kropkę albo spację.' }),
      h('div', { class: 'hash-grid' },
        h('div', { class: 'field' }, h('label', { for: 'hash-a', text: 'Tekst A' }), a.input, a.out),
        h('div', { class: 'field' }, h('label', { for: 'hash-b', text: 'Tekst B' }), b.input, b.out)
      ),
      diff,
      feedback('info', 'Efekt lawinowy', 'Skrót ma zawsze tę samą długość, niezależnie od tego, czy liczysz go z jednego słowa, czy z całego filmu. Dlatego przy pobieraniu programów publikuje się skróty: jeśli Twój plik daje inny skrót, coś go zmieniło.'),
      h('div', { class: 'btn-row' }, button({ label: 'Dalej: pytania o skróty', variant: 'primary', iconAfter: 'arrowRight', onclick: () => { panel.remove(); resolve(); } }))
    );
    stage.append(panel);
  });
}

export function examPool() {
  return [BASE64_QUESTION, ...HASH_QUESTIONS, ...CRYPTO_QUESTIONS];
}
