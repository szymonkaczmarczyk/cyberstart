import { h, button, feedback, shuffle, clear, draw } from '../ui.js';
import { icon } from '../icons.js';

const ROUNDS = [
  {
    title: 'Wpisujesz w przeglądarce https://sklep.pl i naciskasz Enter',
    steps: [
      { text: 'Przeglądarka sprawdza, czy pamięta już adres IP dla sklep.pl', why: 'Najpierw pamięć podręczna, żeby nie pytać za każdym razem.' },
      { text: 'Komputer pyta serwer DNS o adres IP domeny sklep.pl', why: 'DNS to książka telefoniczna internetu: nazwa na numer.' },
      { text: 'Serwer DNS odpowiada adresem IP, np. 203.0.113.10', why: 'Teraz przeglądarka wie, dokąd wysłać dane.' },
      { text: 'Przeglądarka nawiązuje połączenie TCP z serwerem na porcie 443', why: 'Trójstopniowe „przywitanie” TCP: SYN, SYN-ACK, ACK.' },
      { text: 'Uzgadnianie TLS: serwer pokazuje certyfikat, ustalany jest klucz szyfrowania', why: 'Tu powstaje szyfrowany tunel. Przeglądarka sprawdza, czy certyfikat pasuje do domeny.' },
      { text: 'Przeglądarka wysyła żądanie HTTP GET o stronę główną', why: 'Właściwa prośba o stronę, już wewnątrz szyfrowanego tunelu.' },
      { text: 'Serwer odpowiada kodem 200 i kodem HTML strony', why: '200 oznacza „OK”. 404 oznaczałoby „nie znaleziono”.' },
      { text: 'Przeglądarka wyświetla stronę i dociąga obrazki, style i skrypty', why: 'Każdy z tych plików to kolejne żądania HTTP.' }
    ],
    lesson: 'Każde wejście na stronę to cała sekwencja kroków. Atak może celować w każdy z nich: fałszywa odpowiedź DNS, podrobiony certyfikat, podsłuch nieszyfrowanego HTTP.'
  },
  {
    title: 'Trójstopniowe uzgadnianie TCP (three-way handshake)',
    steps: [
      { text: 'Klient wysyła SYN: „chcę się połączyć”', why: 'SYN od synchronize. Klient proponuje początek rozmowy.' },
      { text: 'Serwer odpowiada SYN-ACK: „zgoda, też chcę”', why: 'Serwer potwierdza (ACK) i wysyła własne SYN.' },
      { text: 'Klient wysyła ACK: „potwierdzam”', why: 'Od teraz połączenie jest nawiązane.' },
      { text: 'Strony zaczynają przesyłać dane', why: 'TCP pilnuje kolejności i ponawia zgubione pakiety.' }
    ],
    lesson: 'Atak SYN flood polega na wysyłaniu tysięcy SYN bez kończenia rozmowy. Serwer czeka na każde połączenie i w końcu brakuje mu zasobów. Obroną są m.in. SYN cookies.'
  },
  {
    title: 'Logujesz się do serwisu hasłem',
    steps: [
      { text: 'Wpisujesz login i hasło w formularzu', why: 'Hasło jest jeszcze tylko w Twojej przeglądarce.' },
      { text: 'Przeglądarka wysyła je przez szyfrowane połączenie HTTPS', why: 'Dzięki TLS nikt po drodze, np. w publicznym Wi-Fi, go nie odczyta.' },
      { text: 'Serwer liczy skrót (hash) podanego hasła', why: 'Porządny serwer nie przechowuje haseł, tylko ich skróty.' },
      { text: 'Serwer porównuje ten skrót ze skrótem zapisanym w bazie', why: 'Zgodne skróty oznaczają poprawne hasło, bez przechowywania samego hasła.' },
      { text: 'Serwer tworzy sesję i odsyła ciasteczko sesji', why: 'Ciasteczko to przepustka, żeby nie logować się przy każdym kliknięciu.' },
      { text: 'Przeglądarka dołącza ciasteczko do kolejnych żądań', why: 'Dlatego kradzież ciasteczka sesji bywa równie groźna jak kradzież hasła.' }
    ],
    lesson: 'Ciasteczko sesji powinno mieć flagi HttpOnly (niedostępne dla skryptów), Secure (tylko przez HTTPS) i SameSite. Wylogowanie powinno je unieważniać po stronie serwera.'
  },
  {
    title: 'Wysyłasz e-mail do kolegi z innej firmy',
    steps: [
      { text: 'Program pocztowy wysyła wiadomość do Twojego serwera poczty (SMTP)', why: 'Logujesz się do własnego serwera, który przyjmuje wiadomość do wysłania.' },
      { text: 'Twój serwer pyta DNS o rekord MX domeny odbiorcy', why: 'Rekord MX mówi, który serwer przyjmuje pocztę dla danej domeny.' },
      { text: 'Twój serwer łączy się z serwerem odbiorcy i przekazuje wiadomość', why: 'Serwery rozmawiają protokołem SMTP, najlepiej szyfrowanym przez TLS.' },
      { text: 'Serwer odbiorcy sprawdza SPF, DKIM i DMARC', why: 'Te rekordy pozwalają ocenić, czy nadawca może wysyłać z tej domeny i czy treść nie została zmieniona.' },
      { text: 'Wiadomość trafia do skrzynki albo do spamu', why: 'Wynik kontroli i filtry antyspamowe decydują, gdzie wyląduje list.' },
      { text: 'Kolega pobiera ją programem pocztowym (IMAP)', why: 'IMAP pobiera i synchronizuje pocztę między urządzeniami.' }
    ],
    lesson: 'Bez SPF, DKIM i DMARC każdy mógłby wysyłać maile „z Twojej domeny”. To podstawa ochrony firmy przed podszywaniem się. Nagłówki maila przeanalizujesz w osobnej grze.'
  },
  {
    title: 'Laptop dostaje adres IP w nowej sieci (DHCP)',
    level: 'zaawansowany',
    steps: [
      { text: 'DISCOVER: laptop woła do całej sieci „czy jest tu serwer DHCP?”', why: 'Laptop nie ma jeszcze adresu, więc wysyła rozgłoszenie do wszystkich.' },
      { text: 'OFFER: serwer DHCP proponuje wolny adres IP', why: 'Zwykle robi to router w domu lub serwer w firmie.' },
      { text: 'REQUEST: laptop prosi o zaproponowany adres', why: 'Jeśli serwerów jest kilka, ta prośba mówi, którą ofertę wybrał.' },
      { text: 'ACK: serwer potwierdza i przydziela adres, bramę i DNS', why: 'Od teraz laptop może rozmawiać z siecią i internetem.' }
    ],
    lesson: 'Fałszywy serwer DHCP w sieci (rogue DHCP) może rozdać złą bramę i serwer DNS, kierując cały ruch przez atakującego. Switche w firmach mają ochronę DHCP snooping.'
  },
  {
    title: 'Komputer instaluje aktualizację systemu',
    level: 'zaawansowany',
    steps: [
      { text: 'System pyta serwer producenta o listę nowych aktualizacji', why: 'Połączenie idzie przez HTTPS do znanego serwera aktualizacji.' },
      { text: 'Pobiera paczkę aktualizacji', why: 'Paczka może przyjść z dowolnego serwera lustrzanego, dlatego sam transport to za mało.' },
      { text: 'Sprawdza podpis cyfrowy paczki kluczem publicznym producenta', why: 'Podpis potwierdza, że paczkę wydał producent i nikt jej nie zmienił.' },
      { text: 'Instaluje aktualizację i prosi o restart', why: 'Część poprawek działa dopiero po ponownym uruchomieniu.' }
    ],
    lesson: 'Ataki na łańcuch dostaw (supply chain) celują właśnie w aktualizacje. Podpis cyfrowy i kontrola integralności sprawiają, że podmieniona paczka zostanie odrzucona.'
  }
];

export default {
  id: 'pakiet',
  title: 'Podróż danych przez sieć',
  category: 'sieci',
  icon: 'route',
  minutes: 8,
  levels: true,
  summary: 'Ułóż w kolejności kroki, które dzieją się w sieci: wejście na stronę, przywitanie TCP, logowanie, wysyłka maila, a na poziomie zaawansowanym także DHCP i aktualizacje.',
  lesson: [
    'Kliknięcie linku wygląda na jedną chwilę, ale za kulisami dzieje się kilkanaście kroków: zamiana nazwy na adres, nawiązanie połączenia, szyfrowanie, prośba o stronę i odpowiedź.',
    '<strong>DNS</strong> zamienia nazwę (sklep.pl) na adres IP. <strong>TCP</strong> nawiązuje niezawodne połączenie. <strong>TLS</strong> szyfruje je i sprawdza tożsamość serwera certyfikatem. <strong>HTTP</strong> przenosi właściwą treść.',
    'Znajomość kolejności przydaje się w praktyce: gdy strona nie działa, wiesz, czy szukać problemu w DNS, w połączeniu czy w samej aplikacji. A analityk bezpieczeństwa wie, w którym miejscu atak mógł się wydarzyć.',
    'Każdy krok przeciągasz za uchwyt albo przesuwasz strzałkami w górę i w dół. Gdy kolejność wydaje się dobra, kliknij „Sprawdź”.'
  ],
  takeaways: [
    'Wejście na stronę: DNS, połączenie TCP, uzgadnianie TLS, żądanie HTTP, odpowiedź serwera.',
    'TCP zaczyna się od SYN, SYN-ACK, ACK. Zalewanie serwera samymi SYN to atak SYN flood.',
    'HTTPS szyfruje dane w drodze, ale nie gwarantuje, że strona po drugiej stronie jest uczciwa.',
    'Serwer powinien przechowywać skróty haseł, a nie hasła. Po zalogowaniu przepustką jest ciasteczko sesji.',
    'Ciasteczko sesji chronią flagi HttpOnly, Secure i SameSite.'
  ],
  async mount(stage, ctx) {
    let score = 0;
    const rounds = draw(ROUNDS, 3, ctx.level);
    for (const [index, round] of rounds.entries()) {
      ctx.progress(index, rounds.length);
      score += await playRound(stage, round, index, rounds.length);
    }
    ctx.finish({ score, max: rounds.length * 3 });
  }
};

function playRound(stage, round, index, total) {
  return new Promise((resolve) => {
    let order = shuffle(round.steps.map((step, i) => ({ ...step, index: i })));
    while (order.every((item, i) => item.index === i)) order = shuffle(order);
    let attempts = 0;
    const list = h('ol', { class: 'order-list' });
    const status = h('div', { class: 'status-stack', 'aria-live': 'polite' });
    const check = button({ label: 'Sprawdź kolejność', variant: 'primary', iconName: 'check', onclick: verify });

    function move(from, to) {
      if (to < 0 || to >= order.length) return;
      const [item] = order.splice(from, 1);
      order.splice(to, 0, item);
      render(to, to > from ? 'down' : 'up');
    }

    function render(focusIndex, direction) {
      clear(list);
      order.forEach((item, i) => {
        const up = h('button', { type: 'button', class: 'btn btn-ghost btn-icon order-move', 'aria-label': `Przesuń wyżej: ${item.text}`, disabled: i === 0, onclick: () => move(i, i - 1) }, icon('chevronUp'));
        const down = h('button', { type: 'button', class: 'btn btn-ghost btn-icon order-move', 'aria-label': `Przesuń niżej: ${item.text}`, disabled: i === order.length - 1, onclick: () => move(i, i + 1) }, icon('chevronDown'));
        const grip = h('span', { class: 'order-grip', 'aria-hidden': 'true', onpointerdown: (event) => startDrag(event, li, i) }, icon('grip'));
        const li = h('li', { class: 'order-item' }, grip, h('span', { class: 'order-num mono', text: String(i + 1) }), h('span', { class: 'order-text', text: item.text }), h('span', { class: 'order-actions' }, up, down));
        list.append(li);
        if (i === focusIndex) {
          li.classList.add('pop');
          const target = direction === 'up' ? (i === 0 ? down : up) : i === order.length - 1 ? up : down;
          requestAnimationFrame(() => target.focus());
        }
      });
    }

    function startDrag(event, li, from) {
      if (check.disabled) return;
      event.preventDefault();
      const grip = event.currentTarget;
      grip.setPointerCapture(event.pointerId);
      const startY = event.clientY;
      const items = [...list.children];
      const rects = items.map((el) => el.getBoundingClientRect());
      const height = rects[from].height + 8;
      let to = from;
      li.classList.add('is-dragging');

      function onMove(moveEvent) {
        const dy = moveEvent.clientY - startY;
        li.style.transform = `translateY(${dy}px)`;
        const center = rects[from].top + rects[from].height / 2 + dy;
        to = rects.filter((rect, index) => index !== from && center > rect.top + rect.height / 2).length;
        items.forEach((el, index) => {
          if (index === from) return;
          const shift = from < to && index > from && index <= to ? -height : from > to && index < from && index >= to ? height : 0;
          el.style.transform = shift ? `translateY(${shift}px)` : '';
        });
      }

      function onUp() {
        grip.removeEventListener('pointermove', onMove);
        grip.removeEventListener('pointerup', onUp);
        grip.removeEventListener('pointercancel', onUp);
        items.forEach((el) => { el.style.transform = ''; });
        li.classList.remove('is-dragging');
        if (to !== from) move(from, to);
      }

      grip.addEventListener('pointermove', onMove);
      grip.addEventListener('pointerup', onUp);
      grip.addEventListener('pointercancel', onUp);
    }

    function verify() {
      attempts += 1;
      const items = [...list.children];
      let correctCount = 0;
      order.forEach((item, i) => {
        const ok = item.index === i;
        if (ok) correctCount += 1;
        items[i].classList.toggle('is-correct', ok);
        items[i].classList.toggle('is-wrong', !ok);
      });
      if (correctCount === order.length) {
        const points = Math.max(1, 4 - attempts);
        check.disabled = true;
        list.querySelectorAll('button').forEach((btn) => { btn.disabled = true; });
        status.replaceChildren(
          feedback('ok', attempts === 1 ? 'Bezbłędnie, za pierwszym razem' : `Gotowe w ${attempts} próbach`, 'Oto co dzieje się w każdym kroku:'),
          h('ol', { class: 'order-explain' }, round.steps.map((step) => h('li', {}, h('strong', { text: step.text }), h('span', { class: 't-muted', text: ` ${step.why}` })))),
          feedback('info', 'Wątek bezpieczeństwa', round.lesson),
          h('div', { class: 'btn-row' }, button({ label: index === total - 1 ? 'Zobacz podsumowanie' : 'Następna sekwencja', variant: 'primary', iconAfter: 'arrowRight', onclick: () => { panel.remove(); resolve(points); } }))
        );
        status.querySelector('.btn-primary:not(:disabled)')?.focus();
      } else {
        status.replaceChildren(feedback('bad', `${correctCount} z ${order.length} na swoim miejscu`, 'Zielone kroki są dobrze. Przesuń czerwone i sprawdź ponownie.'));
      }
    }

    const panel = h(
      'section',
      { class: 'panel' },
      h('div', { class: 'panel-title' }, h('span', { class: 'tag tag-accent', text: `Sekwencja ${index + 1} z ${total}` })),
      h('h2', { class: 'question-prompt', text: round.title }),
      h('p', { class: 'hint', text: 'Ułóż kroki od pierwszego do ostatniego: przeciągnij za uchwyt po lewej albo użyj strzałek.' }),
      list,
      h('div', { class: 'btn-row' }, check),
      status
    );
    render(-1);
    stage.append(panel);
  });
}
