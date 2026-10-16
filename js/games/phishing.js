import { h, button, feedback, onKey, isTyping, clear, draw } from '../ui.js';
import { icon } from '../icons.js';

const EMAILS = [
  {
    fromName: 'Kurier Szybko',
    fromAddress: 'powiadomienia@kurier-szybko-doplata.top',
    fromFlag: 0,
    subject: 'Twoja paczka czeka. Dopłać 1,99 zł',
    time: '08:12',
    body: [
      'Dzień dobry,',
      ['Paczka nr 48213 nie mogła zostać doręczona z powodu ', { text: 'brakującej opłaty 1,99 zł', flag: 1 }, '.'],
      [{ text: 'Jeśli nie dopłacisz w ciągu 24 godzin, paczka wróci do nadawcy.', flag: 2 }]
    ],
    link: { text: 'Opłać teraz', href: 'https://kurier-szybko-doplata.top/platnosc', flag: 0 },
    phishing: true,
    flags: [
      { title: 'Dziwna domena', text: 'Firma kurierska nie wysyła maili z domeny typu „kurier-szybko-doplata.top”. Prawdziwy adres to zwykle krótka nazwa firmy.' },
      { title: 'Mała kwota', text: '1,99 zł ma uśpić czujność. Celem nie jest ta kwota, tylko dane Twojej karty lub logowania do banku.' },
      { title: 'Presja czasu', text: '„W ciągu 24 godzin” ma sprawić, że zadziałasz, zanim pomyślisz.' }
    ]
  },
  {
    fromName: 'Bank Horyzont',
    fromAddress: 'powiadomienia@bankhoryzont.pl',
    subject: 'Wyciąg za wrzesień jest dostępny',
    time: '07:45',
    body: [
      'Dzień dobry, Pani Anno,',
      'Wyciąg z rachunku za wrzesień jest dostępny w bankowości internetowej.',
      'Aby go zobaczyć, zaloguj się, wpisując adres banku samodzielnie w przeglądarce. Nigdy nie prosimy o podanie hasła ani kodów w wiadomościach e-mail.'
    ],
    phishing: false,
    flags: [
      { title: 'Brak linku do logowania', text: 'Bank prosi o samodzielne wpisanie adresu. To dobra praktyka i dobry znak.' },
      { title: 'Personalizacja i spokojny ton', text: 'Wiadomość zwraca się po imieniu, nie straszy i niczego nie wymaga.' },
      { title: 'Zgodna domena', text: 'Nadawca jest z domeny banku. Pamiętaj jednak, że adres nadawcy da się sfałszować, więc najważniejsze jest to, że nie trzeba w nic klikać.' }
    ]
  },
  {
    fromName: 'Dział IT',
    fromAddress: 'it-support@firma-helpdesk.com',
    fromFlag: 0,
    subject: 'Twoja skrzynka jest pełna w 98%',
    time: 'wczoraj',
    body: [
      ['Szanowny ', { text: 'Użytkowniku', flag: 1 }, ','],
      'Twoja skrzynka pocztowa przekroczyła limit. Nowe wiadomości mogą nie docierać.',
      [{ text: 'Zaloguj się w ciągu 2 godzin, aby zwiększyć limit, w przeciwnym razie konto zostanie zablokowane.', flag: 2 }]
    ],
    link: { text: 'Zwiększ limit', href: 'https://firma-pl.helpdesk-login.com/owa', flag: 0 },
    phishing: true,
    flags: [
      { title: 'Obca domena', text: 'Twoja firma ma domenę firma.pl. Nadawca firma-helpdesk.com, a link prowadzi do helpdesk-login.com.' },
      { title: 'Ogólnikowe powitanie', text: 'Twój dział IT zna Twoje imię. „Szanowny Użytkowniku” to masowa wysyłka.' },
      { title: 'Groźba i pośpiech', text: 'Blokada konta i 2 godziny na reakcję to klasyczne wywieranie presji.' }
    ]
  },
  {
    fromName: 'Anna Nowak (Prezes)',
    fromAddress: 'prezes.anna.nowak@gmail.com',
    fromFlag: 0,
    subject: 'Pilne, potrzebuję przysługi',
    time: 'wczoraj',
    body: [
      'Cześć,',
      ['jestem na spotkaniu i nie mogę rozmawiać. ', { text: 'Potrzebuję, żebyś pilnie kupił 5 kart podarunkowych po 200 zł', flag: 1 }, ' i przesłał mi zdjęcia kodów.'],
      [{ text: 'Nie mów nikomu, to niespodzianka dla zespołu.', flag: 2 }, ' Zwrócę Ci pieniądze jutro.']
    ],
    phishing: true,
    flags: [
      { title: 'Prywatna skrzynka', text: 'Prezes firmy nie pisze służbowo z Gmaila. Nazwę wyświetlaną może ustawić każdy.' },
      { title: 'Karty podarunkowe', text: 'Ulubiona forma zapłaty oszustów: szybka, anonimowa i nie do odzyskania.' },
      { title: 'Prośba o tajemnicę', text: 'Zakaz rozmowy z innymi ma uniemożliwić sprawdzenie. To atak typu „na prezesa” (CEO fraud).' }
    ]
  },
  {
    fromName: 'Akademia firmy',
    fromAddress: 'no-reply@akademia.firma.pl',
    subject: 'Przypomnienie: szkolenie BHP do 30 października',
    time: 'pon.',
    body: [
      'Cześć Anno,',
      'przypominamy o obowiązkowym szkoleniu BHP. Masz czas do 30 października.',
      'Szkolenie znajdziesz w intranecie, w zakładce Szkolenia. W razie pytań napisz do działu kadr.'
    ],
    link: { text: 'Intranet: szkolenia', href: 'https://intranet.firma.pl/szkolenia' },
    phishing: false,
    flags: [
      { title: 'Domena firmy', text: 'akademia.firma.pl i intranet.firma.pl to subdomeny Twojej firmowej domeny firma.pl. Liczy się to, co stoi tuż przed .pl.' },
      { title: 'Rozsądny termin', text: 'Kilka tygodni na wykonanie zadania, bez gróźb.' },
      { title: 'Zgodność z kontekstem', text: 'Szkolenie BHP to coś, czego się spodziewasz. Wiadomość podaje też alternatywną drogę: intranet i kadry.' }
    ]
  },
  {
    fromName: 'Netstream',
    fromAddress: 'billing@netstream-konto.info',
    fromFlag: 0,
    subject: 'Płatność odrzucona. Konto zostanie zawieszone',
    time: 'pon.',
    body: [
      'Witaj,',
      [{ text: 'Nie udało się pobrać opłaty za subskrypcję. Twoje konto zostanie dziś zawieszone.', flag: 2 }],
      'Szczegóły znajdziesz w załączonej fakturze. Otwórz ją i zaktualizuj dane karty.'
    ],
    attachment: { name: 'faktura_102938.pdf.exe', flag: 1 },
    phishing: true,
    flags: [
      { title: 'Domena .info zamiast domeny serwisu', text: 'Serwisy streamingowe wysyłają rozliczenia z własnej, głównej domeny.' },
      { title: 'Podwójne rozszerzenie', text: 'Plik kończy się na .exe, czyli jest programem, a nie fakturą PDF. Otwarcie może zainstalować złośliwe oprogramowanie.' },
      { title: 'Groźba zawieszenia', text: '„Dziś” to znowu presja czasu. Sprawdź status konta, logując się samodzielnie w aplikacji.' }
    ]
  },
  {
    fromName: 'Tomek Wiśniewski',
    fromAddress: 'tomasz.wisniewski@firma.pl',
    subject: 'Prezentacja z wczorajszego spotkania',
    time: 'pt.',
    body: [
      'Hej Anno,',
      'w załączniku slajdy z wczorajszego spotkania o budżecie. Popraw proszę liczby na slajdzie 7, tak jak ustaliliśmy.',
      'Dzięki!'
    ],
    attachment: { name: 'budzet_q4.pptx' },
    phishing: false,
    flags: [
      { title: 'Kontekst się zgadza', text: 'Odnosi się do konkretnego spotkania i ustaleń, o których wiesz.' },
      { title: 'Zwykły załącznik', text: 'Plik .pptx od współpracownika z firmowej domeny. Jeśli przy otwieraniu pojawi się prośba o włączenie makr, zatrzymaj się.' },
      { title: 'Gdy masz wątpliwości', text: 'Konto znajomego też może zostać przejęte. Jeśli coś nie pasuje, zapytaj go innym kanałem, np. telefonicznie.' }
    ]
  },
  {
    fromName: 'Zwroty podatku',
    fromAddress: 'zwrot@podatki-zwrot-online.net',
    fromFlag: 0,
    subject: 'Należy Ci się zwrot 1 280,50 zł',
    time: 'czw.',
    body: [
      'Szanowny Podatniku,',
      ['po ponownym przeliczeniu Twojego zeznania ', { text: 'należy Ci się zwrot 1 280,50 zł', flag: 1 }, '.'],
      [{ text: 'Aby otrzymać przelew, podaj numer karty, datę ważności i kod CVV.', flag: 2 }]
    ],
    link: { text: 'Odbierz zwrot', href: 'https://podatki-zwrot-online.net/odbierz', flag: 0 },
    phishing: true,
    flags: [
      { title: 'Nieoficjalna domena', text: 'Urzędy w Polsce używają domen gov.pl. Tu mamy przypadkową domenę .net.' },
      { title: 'Nieoczekiwany prezent', text: 'Obietnica pieniędzy to przynęta tak samo skuteczna jak strach.' },
      { title: 'Prośba o dane karty', text: 'Do wysłania przelewu nikt nie potrzebuje numeru karty i kodu CVV. Te dane służą do płacenia, czyli do zabierania pieniędzy.' }
    ]
  },
  {
    fromName: 'Jan Kowal, Stal-Pol',
    fromAddress: 'jan.kowal@stalpol-faktury.com',
    fromFlag: 0,
    subject: 'RE: Faktura 2026/10/118, zmiana rachunku',
    time: 'śr.',
    context: 'Firma Stal-Pol to Wasz stały dostawca. Do tej pory pisał do Was z adresu jan.kowal@stal-pol.pl.',
    body: [
      'Dzień dobry,',
      ['w nawiązaniu do faktury z zeszłego tygodnia informuję, że ', { text: 'zmieniliśmy bank i prosimy o przelew na nowy rachunek', flag: 1 }, ': 61 1090 0000 0000 0000 0000 0000.'],
      [{ text: 'Prosimy o pilną płatność do końca dnia, inaczej wstrzymamy dostawy.', flag: 2 }]
    ],
    phishing: true,
    level: 'zaawansowany',
    flags: [
      { title: 'Podobna, ale inna domena', text: 'stalpol-faktury.com zamiast stal-pol.pl. Oszuści często przejmują albo podrabiają wątek z prawdziwą korespondencją.' },
      { title: 'Zmiana numeru konta', text: 'Każdą zmianę rachunku weryfikuj telefonicznie na numer znany z wcześniejszej współpracy, a nie z tego maila.' },
      { title: 'Presja i groźba', text: 'Pilna płatność i wstrzymanie dostaw to typowa dźwignia w ataku na faktury (BEC).' }
    ]
  },
  {
    fromName: 'Biuro Rachunkowe Lis',
    fromAddress: 'kontakt@biuro-lis.pl',
    fromFlag: 0,
    subject: 'Udostępniono Ci dokument: Rozliczenie_Q3.xlsx',
    time: 'śr.',
    context: 'Nie współpracujesz z żadnym Biurem Rachunkowym Lis.',
    body: [
      'Biuro Rachunkowe Lis udostępniło Ci plik w chmurze.',
      [{ text: 'Aby otworzyć dokument, zaloguj się kontem służbowym.', flag: 1 }]
    ],
    link: { text: 'Otwórz w Chmurze Dokumentów', href: 'https://chmura-dokumenty.share-view.net/login', flag: 2 },
    phishing: true,
    level: 'zaawansowany',
    flags: [
      { title: 'Nieznany nadawca', text: 'Nie znasz tej firmy, a dostajesz dokument „dla Ciebie”. Konto nadawcy mogło zostać przejęte i rozsyła to do wszystkich kontaktów.' },
      { title: 'Logowanie, żeby zobaczyć plik', text: 'Strona logowania po kliknięciu to sposób na kradzież hasła do poczty służbowej.' },
      { title: 'Obca domena logowania', text: 'share-view.net nie jest domeną Twojej firmy ani znanej usługi chmurowej.' }
    ]
  },
  {
    fromName: 'Zielony Koszyk',
    fromAddress: 'konto@zielonykoszyk.pl',
    subject: 'Reset hasła do Twojego konta',
    time: '09:01',
    context: 'Właśnie klikasz w sklepie Zielony Koszyk „Nie pamiętam hasła” i czekasz na maila.',
    body: [
      'Cześć Anno,',
      'otrzymaliśmy prośbę o zmianę hasła. Link jest ważny 30 minut.',
      'Jeśli to nie Ty, zignoruj tę wiadomość, a Twoje hasło się nie zmieni.'
    ],
    link: { text: 'Ustaw nowe hasło', href: 'https://zielonykoszyk.pl/konto/reset?token=8f3a91c2' },
    phishing: false,
    level: 'zaawansowany',
    flags: [
      { title: 'Spodziewasz się tej wiadomości', text: 'Reset hasła to Twoja prośba sprzed chwili. Kontekst się zgadza.' },
      { title: 'Zgodna domena linku', text: 'Link prowadzi do zielonykoszyk.pl, tej samej domeny, co sklep.' },
      { title: 'Uczciwa informacja', text: 'Krótki czas ważności i opcja „zignoruj, jeśli to nie Ty” to dobre praktyki. Ta sama wiadomość bez Twojej prośby byłaby jednak podejrzana.' }
    ]
  },
  {
    fromName: 'Dział Kadr',
    fromAddress: 'kadry@firma-premie.com',
    fromFlag: 0,
    subject: 'Premia kwartalna, potwierdź do piątku',
    time: 'wt.',
    body: [
      'Dzień dobry,',
      [{ text: 'przyznano Ci premię kwartalną.', flag: 1 }, ' Aby ją potwierdzić, ', { text: 'zeskanuj telefonem kod QR z załącznika', flag: 2 }, ' i zaloguj się kontem służbowym.']
    ],
    attachment: { name: 'premia_Q3_kod.png' },
    phishing: true,
    level: 'zaawansowany',
    flags: [
      { title: 'Obca domena', text: 'Kadry piszą z firma.pl, a nie z firma-premie.com.' },
      { title: 'Przynęta', text: 'Nieoczekiwana premia, którą trzeba „potwierdzić”, ma wyłączyć ostrożność.' },
      { title: 'Kod QR zamiast linku', text: 'To tzw. quishing. Kod QR omija filtry linków w poczcie, a telefon prywatny jest zwykle słabiej chroniony niż komputer służbowy.' }
    ]
  }
];

function segmentNodes(segments) {
  return segments.map((part) => (typeof part === 'string' ? part : h('span', { class: 'flaggable', 'data-flag': String(part.flag), text: part.text })));
}

export default {
  id: 'phishing',
  title: 'Wykryj phishing',
  category: 'ludzie',
  icon: 'mail',
  minutes: 10,
  levels: true,
  summary: 'W skrzynce czeka osiem wiadomości. Oceń każdą: prawdziwa czy próba wyłudzenia? Po decyzji zobaczysz zaznaczone sygnały ostrzegawcze.',
  lesson: [
    '<strong>Phishing</strong> to wiadomość podszywająca się pod kogoś zaufanego: kuriera, bank, szefa albo dział IT. Jej celem jest skłonienie Cię do kliknięcia w link, podania danych lub otwarcia załącznika.',
    'Oszuści grają na emocjach: <strong>strachu</strong> (blokada konta), <strong>pośpiechu</strong> (24 godziny), <strong>chciwości</strong> (zwrot podatku) i <strong>autorytecie</strong> (prezes).',
    'Sprawdzaj zawsze: <strong>adres nadawcy</strong> (a nie tylko wyświetlaną nazwę), <strong>dokąd prowadzi link</strong> (na komputerze najedź na niego kursorem), <strong>rozszerzenie załącznika</strong> i to, czy wiadomość pasuje do sytuacji.',
    'Klawisze: <code>P</code> to phishing, <code>B</code> to bezpieczna wiadomość.'
  ],
  takeaways: [
    'Czerwone flagi: obca domena, presja czasu, groźba, nagroda, prośba o dane, hasło, kod lub kartę.',
    'Nazwę nadawcy może wpisać każdy. Patrz na adres i domenę.',
    'Nie loguj się z linku w mailu. Wpisz adres samodzielnie albo użyj aplikacji.',
    'Załącznik .exe, .scr, .js lub podwójne rozszerzenie (.pdf.exe) to program, a nie dokument.',
    'Masz wątpliwości? Sprawdź innym kanałem: zadzwoń na znany numer. Podejrzane maile zgłaszaj w CERT Polska (incydent.cert.pl) i w firmie do działu IT.'
  ],
  mount(stage, ctx) {
    const emails = draw(EMAILS, 8, ctx.level);
    let index = 0;
    let score = 0;
    const results = [];
    const inbox = h('ul', { class: 'inbox', 'aria-label': 'Skrzynka odbiorcza' });
    const reader = h('section', { class: 'panel mail-reader', 'aria-live': 'polite' });

    stage.append(h('div', { class: 'mail-layout' }, h('aside', { class: 'panel inbox-panel' }, h('div', { class: 'panel-title' }, icon('mail'), h('h2', { class: 't-h4', text: 'Odebrane' })), inbox), reader));

    function renderInbox() {
      inbox.replaceChildren(
        ...emails.map((mail, i) => {
          const result = results[i];
          return h(
            'li',
            { class: `inbox-item${i === index ? ' is-active' : ''}${i > index ? ' is-unread' : ''}` },
            h('span', { class: 'inbox-state' }, result === undefined ? h('span', { class: 'dot' }) : icon(result ? 'check' : 'x')),
            h('span', { class: 'inbox-text' }, h('strong', { text: mail.fromName }), h('span', { text: mail.subject })),
            h('span', { class: 'inbox-time t-muted', text: mail.time })
          );
        })
      );
    }

    function show() {
      if (index >= emails.length) {
        ctx.finish({ score, max: emails.length });
        return;
      }
      ctx.progress(index, emails.length);
      renderInbox();
      const mail = emails[index];
      const status = h('div', { class: 'status-stack status-stack-loose' });
      let decided = false;

      const fromEl = h('span', { class: 'mono mail-address', text: `<${mail.fromAddress}>` });
      if (mail.fromFlag !== undefined) {
        fromEl.classList.add('flaggable');
        fromEl.dataset.flag = String(mail.fromFlag);
      }
      const linkEl = mail.link
        ? h(
            'div',
            { class: 'mail-link' },
            h('span', { class: 'btn btn-primary btn-sm mail-fake-btn', 'aria-hidden': 'true', text: mail.link.text }),
            h('span', { class: `mail-href mono${mail.link.flag !== undefined ? ' flaggable' : ''}`, 'data-flag': mail.link.flag !== undefined ? String(mail.link.flag) : null }, icon('link'), `Link prowadzi do: ${mail.link.href}`)
          )
        : null;
      const attachmentEl = mail.attachment
        ? h('div', { class: `mail-attachment mono${mail.attachment.flag !== undefined ? ' flaggable' : ''}`, 'data-flag': mail.attachment.flag !== undefined ? String(mail.attachment.flag) : null }, icon('paperclip'), mail.attachment.name)
        : null;

      const decide = (saysPhishing) => {
        if (decided) return;
        decided = true;
        stopKeys();
        const correct = saysPhishing === mail.phishing;
        if (correct) score += 1;
        results[index] = correct;
        phishBtn.disabled = true;
        safeBtn.disabled = true;
        message.classList.add('is-revealed');
        renderInbox();
        status.replaceChildren(
          feedback(correct ? 'ok' : 'bad', correct ? (mail.phishing ? 'Dobrze, to phishing' : 'Dobrze, to prawdziwa wiadomość') : mail.phishing ? 'To był phishing' : 'Ta wiadomość była prawdziwa', mail.phishing ? 'Zaznaczone fragmenty to sygnały ostrzegawcze:' : 'Po czym poznać, że to w porządku:'),
          h('ol', { class: `flag-list${mail.phishing ? '' : ' is-safe'}` }, mail.flags.map((flag) => h('li', {}, h('strong', { text: flag.title }), h('span', { text: ` ${flag.text}` })))),
          h('div', { class: 'btn-row' }, button({ label: index === emails.length - 1 ? 'Zobacz podsumowanie' : 'Następna wiadomość', variant: 'primary', iconAfter: 'arrowRight', shortcut: 'Enter', onclick: next }))
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

      const phishBtn = button({ label: 'To phishing', iconName: 'alert', shortcut: 'P', class: 'btn btn-secondary fw-deny', onclick: () => decide(true) });
      const safeBtn = button({ label: 'Wygląda bezpiecznie', iconName: 'shieldCheck', shortcut: 'B', class: 'btn btn-secondary fw-allow', onclick: () => decide(false) });
      const stopKeys = onKey(ctx.signal, (event) => {
        if (isTyping(event)) return;
        const key = event.key.toLowerCase();
        if (key === 'p') decide(true);
        if (key === 'b') decide(false);
      });

      const message = h(
        'article',
        { class: `mail${mail.phishing ? '' : ' is-legit'}` },
        h('header', { class: 'mail-head' },
          h('h3', { class: 't-h4', text: mail.subject }),
          h('p', { class: 'mail-from' }, h('strong', { text: mail.fromName }), ' ', fromEl),
          h('p', { class: 't-small t-muted', text: `Do: anna.kowalska@firma.pl, ${mail.time}` })
        ),
        h('div', { class: 'mail-body' }, mail.body.map((paragraph) => h('p', {}, segmentNodes(Array.isArray(paragraph) ? paragraph : [paragraph])))),
        linkEl,
        attachmentEl
      );

      clear(reader).append(
        ...[
          h('div', { class: 'panel-title' }, h('span', { class: 'tag tag-accent', text: `Wiadomość ${index + 1} z ${emails.length}` })),
          mail.context ? feedback('info', 'Kontekst', mail.context) : null,
          message
        ].filter(Boolean),
        h('div', { class: 'btn-row' }, phishBtn, safeBtn),
        status
      );
      message.querySelectorAll('.flaggable').forEach((el) => {
        el.dataset.number = String(Number(el.dataset.flag) + 1);
      });
    }

    show();
  }
};
