import { h, button, feedback, onKey, isTyping, clear, draw } from '../ui.js';
import { icon } from '../icons.js';

const MESSAGES = [
  {
    from: 'KurierSzybko',
    channel: 'SMS',
    text: 'Twoja przesyłka czeka na dopłatę 1,99 zł za zmianę adresu. Opłać dziś: https://kurier-szybko.pl-dostawa.top/oplata',
    scam: true,
    flags: ['Domena pl-dostawa.top nie należy do kuriera. Prawdziwa domena to ta tuż przed końcówką .top.', 'Mała dopłata ma skłonić do podania danych karty albo logowania do banku.', 'Pośpiech: „opłać dziś”.']
  },
  {
    from: 'Nieznany numer',
    channel: 'WhatsApp',
    text: 'Mamo, to mój nowy numer, stary telefon wpadł mi do wody. Zapisz go. Możesz pilnie zrobić za mnie przelew? Oddam jutro, nie mogę teraz zadzwonić.',
    scam: true,
    flags: ['Oszustwo „na dziecko”: nowy numer i brak możliwości rozmowy.', 'Pilna prośba o pieniądze.', 'Zadzwoń na stary, znany numer albo zadaj pytanie, na które odpowie tylko Twoje dziecko.']
  },
  {
    from: 'Energia Plus',
    channel: 'SMS',
    text: 'Uwaga! Dziś o 21:00 nastąpi wyłączenie prądu z powodu zaległej płatności 4,87 zł. Ureguluj: energia-plus-platnosci.online',
    scam: true,
    flags: ['Groźba odcięcia prądu w kilka godzin. Dostawcy energii wysyłają pisemne wezwania z dużym wyprzedzeniem.', 'Dziwna domena .online.', 'Groszowa kwota, żeby wyłudzić dane karty.']
  },
  {
    from: 'Nieznany numer',
    channel: 'SMS',
    text: 'Mandat za przekroczenie prędkości nieopłacony. Uniknij postępowania komorniczego, zapłać w 24h: gov-mandaty.online',
    scam: true,
    flags: ['Instytucje państwowe w Polsce używają domen gov.pl, a nie gov-mandaty.online.', 'Groźba komornika i 24 godziny na reakcję.', 'Mandaty nie przychodzą w ten sposób SMS-em z linkiem do płatności.']
  },
  {
    from: 'Kasia (znajoma)',
    channel: 'Messenger',
    text: 'Hej! Zagłosujesz na moją córkę w konkursie plastycznym? Wystarczy zalogować się przez Facebooka: konkurs-glosowanie.site',
    scam: true,
    flags: ['Konto znajomej najpewniej zostało przejęte i oszust pisze do wszystkich jej kontaktów.', 'Logowanie „przez Facebooka” na obcej stronie to kradzież Twojego konta.', 'Zapytaj znajomą innym kanałem, np. telefonicznie.']
  },
  {
    from: 'Przychodnia Zdrowie',
    channel: 'SMS',
    text: 'Przypominamy o wizycie 16.10 o 9:30 u dr Nowak. Aby odwołać, zadzwoń pod numer z karty pacjenta.',
    scam: false,
    flags: ['Brak linku i prośby o dane.', 'Konkretna informacja, której się spodziewasz.', 'Odwołanie przez numer, który już znasz.']
  },
  {
    from: 'KurierSzybko',
    channel: 'SMS',
    text: 'Paczka 48213 będzie doręczona dziś między 10:00 a 14:00. Status sprawdzisz w aplikacji Kurier Szybko.',
    scam: false,
    context: 'Czekasz na buty zamówione wczoraj w sklepie internetowym.',
    flags: ['Zgodne z tym, czego się spodziewasz.', 'Nie ma linku ani prośby o płatność.', 'Kieruje do oficjalnej aplikacji, którą masz już zainstalowaną.']
  },
  {
    from: 'Bank Horyzont',
    channel: 'SMS',
    text: 'Kod BLIK 731 902 potwierdza płatność 249,00 zł w sklepie Zielony Koszyk. Nie przekazuj kodu nikomu.',
    scam: false,
    context: 'Właśnie płacisz BLIK-iem w sklepie Zielony Koszyk za 249 zł.',
    flags: ['Kwota i sklep zgadzają się z tym, co robisz.', 'Bank przypomina, żeby nie podawać kodu nikomu.', 'Gdyby kwota albo sklep się nie zgadzały, nie potwierdzaj płatności w aplikacji.']
  },
  {
    from: 'Kupujący z serwisu Sprzedajemy',
    channel: 'WhatsApp',
    level: 'zaawansowany',
    text: 'Dzień dobry, kupuję Pana rower. Zapłaciłem przez „bezpieczną dostawę”. Żeby odebrać pieniądze, proszę wpisać dane karty tutaj: sprzedajemy-wyplata.shop',
    scam: true,
    flags: ['Kupujący nie potrzebuje Twojej karty, żeby Ci zapłacić.', 'Rozmowa przeniesiona z serwisu do komunikatora, gdzie serwis Cię nie chroni.', 'Domena udaje serwis ogłoszeniowy.']
  },
  {
    from: 'Ola (koleżanka)',
    channel: 'WhatsApp',
    level: 'zaawansowany',
    text: 'Sorki, przez pomyłkę wysłałam Ci 6-cyfrowy kod SMS. Możesz mi go przesłać? Pilne!',
    scam: true,
    flags: ['To kod do rejestracji Twojego numeru w komunikatorze. Kto go dostanie, przejmie Twoje konto.', 'Konto Oli najpewniej jest już przejęte w ten sam sposób.', 'Włącz w komunikatorze PIN weryfikacji dwuetapowej.']
  },
  {
    from: 'Nieznany numer',
    channel: 'SMS',
    level: 'zaawansowany',
    text: 'Twoje konto Bank Horyzont zostało zablokowane. Odblokuj: bankhoryzont.pl.weryfikacja-konta.info',
    scam: true,
    flags: ['Prawdziwa domena to weryfikacja-konta.info. Znana nazwa na początku to tylko subdomena.', 'Groźba blokady konta.', 'Bank nie wysyła linków do logowania w SMS-ach. Zaloguj się w aplikacji.']
  }
];

export default {
  id: 'sms',
  title: 'Oszustwa SMS i w komunikatorach',
  category: 'ludzie',
  icon: 'phone',
  minutes: 8,
  levels: true,
  summary: 'Telefon dostaje wiadomości: dopłata do paczki, „nowy numer dziecka”, mandat, prośba o kod. Oceń każdą i naucz się rozpoznawać smishing i przejęcia kont.',
  lesson: [
    '<strong>Smishing</strong> to phishing przez SMS. W komunikatorach (WhatsApp, Messenger) działa to samo, a dodatkowo oszuści przejmują konta znajomych i piszą w ich imieniu.',
    'Na telefonie trudniej sprawdzić link: adres jest skrócony, ekran mały, a my odpisujemy w biegu. Dlatego oszuści tak lubią ten kanał.',
    'Najważniejsze zasady: nie klikaj linków do płatności i logowania z SMS-ów, nie przekazuj nikomu kodów, a prośby o pieniądze potwierdzaj telefonicznie na znany numer.',
    'Klawisze: <code>O</code> oszustwo, <code>B</code> bezpieczna wiadomość. Podejrzane SMS-y możesz przekazać bezpłatnie na numer 8080 (CERT Polska).'
  ],
  takeaways: [
    'Dopłata do paczki, zaległy rachunek, mandat w SMS-ie z linkiem: zakładaj oszustwo i sprawdzaj w oficjalnej aplikacji.',
    'Nowy numer dziecka albo znajomego plus prośba o pieniądze: zadzwoń na stary numer.',
    'Kodów z SMS (BLIK, logowanie, rejestracja komunikatora) nie przekazuj nikomu.',
    'Włącz w komunikatorach PIN weryfikacji dwuetapowej.',
    'Podejrzane SMS-y przekazuj na numer 8080. Trafiają do CERT Polska, który blokuje złośliwe domeny.'
  ],
  mount(stage, ctx) {
    const messages = draw(MESSAGES, 8, ctx.level);
    let index = 0;
    let score = 0;
    const area = h('section', { class: 'panel' });
    stage.append(area);

    function show() {
      if (index >= messages.length) {
        ctx.finish({ score, max: messages.length });
        return;
      }
      ctx.progress(index, messages.length);
      const message = messages[index];
      const status = h('div', { class: 'status-stack status-stack-loose', 'aria-live': 'polite' });
      let decided = false;

      const decide = (saysScam) => {
        if (decided) return;
        decided = true;
        stopKeys();
        const correct = saysScam === message.scam;
        if (correct) score += 1;
        scamBtn.disabled = true;
        safeBtn.disabled = true;
        bubble.classList.add(message.scam ? 'is-scam' : 'is-safe');
        status.replaceChildren(
          feedback(correct ? 'ok' : 'bad', message.scam ? (correct ? 'Dobrze, to oszustwo' : 'To było oszustwo') : correct ? 'Dobrze, to prawdziwa wiadomość' : 'Ta wiadomość była prawdziwa', message.scam ? 'Sygnały ostrzegawcze:' : 'Po czym to poznać:'),
          h('ul', { class: `flag-list${message.scam ? '' : ' is-safe'}` }, message.flags.map((flag) => h('li', { text: flag }))),
          h('div', { class: 'btn-row' }, button({ label: index === messages.length - 1 ? 'Zobacz podsumowanie' : 'Następna wiadomość', variant: 'primary', iconAfter: 'arrowRight', shortcut: 'Enter', onclick: next }))
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

      const scamBtn = button({ label: 'To oszustwo', iconName: 'alert', shortcut: 'O', class: 'btn btn-secondary fw-deny', onclick: () => decide(true) });
      const safeBtn = button({ label: 'Wygląda bezpiecznie', iconName: 'shieldCheck', shortcut: 'B', class: 'btn btn-secondary fw-allow', onclick: () => decide(false) });
      const stopKeys = onKey(ctx.signal, (event) => {
        if (isTyping(event)) return;
        const key = event.key.toLowerCase();
        if (key === 'o') decide(true);
        if (key === 'b') decide(false);
      });

      const bubble = h('p', { class: 'sms-bubble', text: message.text });
      clear(area).append(
        ...[
          h('div', { class: 'panel-title' }, h('span', { class: 'tag tag-accent', text: `Wiadomość ${index + 1} z ${messages.length}` })),
          message.context ? feedback('info', 'Kontekst', message.context) : null,
          h(
            'div',
            { class: 'phone' },
            h('div', { class: 'phone-head' }, h('span', { class: 'phone-avatar' }, icon(message.channel === 'SMS' ? 'mail' : 'users')), h('div', { class: 'phone-who' }, h('strong', { text: message.from }), h('span', { class: 't-small t-muted', text: message.channel }))),
            h('div', { class: 'phone-body' }, bubble)
          ),
          h('div', { class: 'btn-row' }, scamBtn, safeBtn),
          status
        ].filter(Boolean)
      );
    }

    show();
  }
};

export function examPool() {
  return MESSAGES.filter((message) => !message.context).map((message) => ({
    prompt: `Wiadomość (${message.channel}) od „${message.from}”: <em>${message.text}</em> Jak ją ocenisz?`,
    options: [
      { label: 'To oszustwo', correct: message.scam },
      { label: 'Wygląda bezpiecznie', correct: !message.scam }
    ],
    explain: message.flags.join(' '),
    level: message.level
  }));
}
