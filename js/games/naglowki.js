import { runQuiz, draw } from '../ui.js';

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
}

function headers(lines) {
  return `<code class="code-block" translate="no">${escapeHtml(lines.join('\n'))}</code>`;
}

const LEGIT = headers([
  'From: Bank Horyzont <powiadomienia@bankhoryzont.pl>',
  'To: anna.kowalska@poczta.pl',
  'Subject: Wyciąg za wrzesień',
  'Return-Path: <powiadomienia@bankhoryzont.pl>',
  'Received: from mail.bankhoryzont.pl (198.51.100.25)',
  'Authentication-Results: mx.poczta.pl;',
  '  spf=pass smtp.mailfrom=bankhoryzont.pl;',
  '  dkim=pass header.d=bankhoryzont.pl;',
  '  dmarc=pass header.from=bankhoryzont.pl'
]);

const SPOOFED = headers([
  'From: Bank Horyzont <powiadomienia@bankhoryzont.pl>',
  'To: anna.kowalska@poczta.pl',
  'Subject: Pilne: zablokowaliśmy Twoje konto',
  'Return-Path: <powiadomienia@bankhoryzont.pl>',
  'Received: from unknown (203.0.113.140)',
  'Authentication-Results: mx.poczta.pl;',
  '  spf=fail (203.0.113.140 is not permitted) smtp.mailfrom=bankhoryzont.pl;',
  '  dkim=none;',
  '  dmarc=fail (p=reject) header.from=bankhoryzont.pl'
]);

const LOOKALIKE = headers([
  'From: Bank Horyzont <kontakt@bankhoryzont-pomoc.pl>',
  'To: anna.kowalska@poczta.pl',
  'Subject: Potwierdź dane, aby uniknąć blokady',
  'Return-Path: <kontakt@bankhoryzont-pomoc.pl>',
  'Received: from mx1.bankhoryzont-pomoc.pl (192.0.2.90)',
  'Authentication-Results: mx.poczta.pl;',
  '  spf=pass smtp.mailfrom=bankhoryzont-pomoc.pl;',
  '  dkim=pass header.d=bankhoryzont-pomoc.pl;',
  '  dmarc=pass header.from=bankhoryzont-pomoc.pl'
]);

const REPLY_TO = headers([
  'From: Anna Nowak <anna.nowak@firma.pl>',
  'Reply-To: <anna.nowak.prezes@gmail.com>',
  'To: ksiegowosc@firma.pl',
  'Subject: Pilny przelew dla kontrahenta',
  'Authentication-Results: mx.firma.pl;',
  '  spf=pass smtp.mailfrom=firma.pl;',
  '  dkim=pass header.d=firma.pl;',
  '  dmarc=pass header.from=firma.pl'
]);

const POOL = [
  {
    prompt: 'Spójrz na nagłówki. Czy ta wiadomość naprawdę przyszła z serwerów banku?',
    context: LEGIT,
    options: [
      { label: 'Tak. SPF, DKIM i DMARC przeszły dla domeny bankhoryzont.pl', correct: true, why: 'Serwer nadawcy jest na liście dozwolonych (SPF), podpis się zgadza (DKIM), a domena z pola From pasuje do sprawdzonej (DMARC).' },
      { label: 'Nie da się tego stwierdzić z nagłówków', why: 'Właśnie po to są wyniki w Authentication-Results. Tu wszystko wskazuje na bank.' }
    ]
  },
  {
    prompt: 'Co oznacza <code>spf=fail</code> w tej wiadomości?',
    context: SPOOFED,
    options: [
      { label: 'Serwer, który wysłał maila, nie jest na liście serwerów uprawnionych przez domenę bankhoryzont.pl', correct: true, why: 'Bank publikuje w DNS listę swoich serwerów pocztowych (rekord SPF). Adres 203.0.113.140 na niej nie jest, więc ktoś podszywa się pod bank.' },
      { label: 'Wiadomość jest zbyt duża', why: 'SPF nie ma nic wspólnego z rozmiarem. Sprawdza, kto może wysyłać pocztę z danej domeny.' },
      { label: 'Odbiorca ma pełną skrzynkę', why: 'SPF ocenia nadawcę, a nie skrzynkę odbiorcy.' }
    ]
  },
  {
    prompt: 'DMARC tej wiadomości to <code>fail (p=reject)</code>. Co zrobi porządny serwer odbiorcy?',
    context: SPOOFED,
    options: [
      { label: 'Odrzuci wiadomość, bo tak każe polityka DMARC domeny banku', correct: true, why: 'p=reject to najmocniejsza polityka: maile, które nie przejdą kontroli, mają nie dotrzeć. Słabsze to p=quarantine (do spamu) i p=none (tylko raport).' },
      { label: 'Dostarczy ją normalnie do skrzynki', why: 'Polityka reject prosi serwery odbiorców o odrzucenie takich wiadomości.' }
    ]
  },
  {
    prompt: 'Tu wszystkie trzy testy dają <code>pass</code>. Czy to znaczy, że mail jest od banku?',
    context: LOOKALIKE,
    options: [
      { label: 'Nie. Testy potwierdzają tylko domenę bankhoryzont-pomoc.pl, którą zarejestrował oszust', correct: true, why: 'SPF, DKIM i DMARC mówią „ta wiadomość naprawdę pochodzi z tej domeny”. Nie mówią, czy domena jest uczciwa. Zawsze patrz, jaka domena została sprawdzona.' },
      { label: 'Tak, skoro wszystko przeszło', why: 'Przeszło dla domeny oszusta. Bank używa bankhoryzont.pl.' }
    ]
  },
  {
    prompt: 'Mail od prezesa przeszedł wszystkie testy. Na co trzeba uważać?',
    context: REPLY_TO,
    options: [
      { label: 'Pole Reply-To kieruje odpowiedź na prywatny adres Gmail, a nie do prezesa', correct: true, why: 'Konto prezesa mogło zostać przejęte albo wiadomość tak ustawiona, żeby rozmowa toczyła się dalej z oszustem. Przy przelewach zawsze weryfikuj telefonicznie.' },
      { label: 'Na nic, wszystko jest w porządku', why: 'Sprawdź pole Reply-To. Odpowiedź trafi gdzie indziej niż nadawca.' }
    ]
  },
  {
    prompt: 'Czym jest SPF?',
    options: [
      { label: 'Rekordem w DNS z listą serwerów, które mogą wysyłać pocztę z danej domeny', correct: true, why: 'Przykład: <code>v=spf1 include:_spf.dostawca.pl -all</code>. Końcówka -all oznacza „wszystkie inne odrzuć”.' },
      { label: 'Filtrem antyspamowym w programie pocztowym', why: 'SPF to rekord publikowany przez właściciela domeny w DNS.' },
      { label: 'Szyfrowaniem poczty', why: 'SPF niczego nie szyfruje. Mówi tylko, kto może wysyłać.' }
    ]
  },
  {
    prompt: 'Czym jest DKIM?',
    options: [
      { label: 'Podpisem cyfrowym dodawanym przez serwer nadawcy, sprawdzanym kluczem publicznym z DNS', correct: true, why: 'Dzięki DKIM odbiorca wie, że treść i ważne nagłówki nie zostały zmienione po drodze.' },
      { label: 'Hasłem do skrzynki pocztowej', why: 'DKIM to podpis cyfrowy całej wiadomości.' }
    ]
  },
  {
    prompt: 'Twoja firma ma domenę firma.pl, ale nie ustawiła DMARC. Czym to grozi?',
    level: 'zaawansowany',
    options: [
      { label: 'Oszuści mogą łatwiej wysyłać maile z adresem @firma.pl w polu From, a Ty się o tym nie dowiesz', correct: true, why: 'DMARC wiąże SPF i DKIM z widocznym polem From, mówi serwerom, co robić z podróbkami, i wysyła Ci raporty o próbach podszycia.' },
      { label: 'Niczym, SPF wystarczy', why: 'Sam SPF sprawdza ukryty adres zwrotny, a nie to, co widzi odbiorca w polu From. DMARC domyka tę lukę.' }
    ]
  },
  {
    prompt: 'Gdzie w programie pocztowym zobaczysz pełne nagłówki?',
    level: 'zaawansowany',
    options: [
      { label: 'W opcji „Pokaż oryginał” lub „Wyświetl źródło wiadomości”', correct: true, why: 'Gmail ma „Pokaż oryginał”, Outlook „Wyświetl źródło” lub „Właściwości”. Tam znajdziesz Authentication-Results.' },
      { label: 'Nigdzie, nagłówki widzi tylko administrator', why: 'Każdy użytkownik może zajrzeć do pełnego źródła swojej wiadomości.' }
    ]
  }
];

export default {
  id: 'naglowki',
  title: 'Nagłówki maila: SPF, DKIM, DMARC',
  category: 'ludzie',
  icon: 'mail',
  minutes: 10,
  levels: true,
  summary: 'Zaglądasz pod maskę wiadomości: kto ją naprawdę wysłał, czy przeszła kontrole SPF, DKIM i DMARC, i dlaczego „pass” nie zawsze oznacza uczciwego nadawcę.',
  lesson: [
    'Pole „Od” w mailu można wpisać dowolnie, jak adres nadawcy na kopercie. Dlatego powstały trzy mechanizmy, które serwer odbiorcy sprawdza automatycznie.',
    '<strong>SPF</strong>: domena publikuje listę serwerów, które mogą wysyłać jej pocztę. <strong>DKIM</strong>: serwer nadawcy podpisuje wiadomość cyfrowo. <strong>DMARC</strong>: domena mówi, co zrobić z wiadomościami, które nie przejdą kontroli, i prosi o raporty.',
    'Wyniki tych kontroli znajdziesz w nagłówku <code>Authentication-Results</code>. Zobaczysz go w opcji „Pokaż oryginał” albo „Źródło wiadomości”.',
    'Pamiętaj: kontrole potwierdzają domenę, a nie uczciwość. Domena łudząco podobna do prawdziwej też przejdzie wszystkie testy.'
  ],
  takeaways: [
    'SPF to lista dozwolonych serwerów, DKIM to podpis, DMARC to polityka i raporty.',
    'spf=fail lub dmarc=fail przy znanej marce to mocny sygnał podszycia.',
    '„pass” dotyczy domeny, która została sprawdzona. Zawsze czytaj, jaka to domena.',
    'Sprawdzaj pole Reply-To: odpowiedź może trafić do kogoś innego niż nadawca.',
    'Twoja firma powinna mieć SPF, DKIM i DMARC z polityką co najmniej quarantine.'
  ],
  async mount(stage, ctx) {
    const questions = draw(POOL, 7, ctx.level);
    const score = await runQuiz(stage, ctx, questions, { label: 'Pytanie' });
    ctx.finish({ score, max: questions.length });
  }
};

export function examPool() {
  return POOL;
}
