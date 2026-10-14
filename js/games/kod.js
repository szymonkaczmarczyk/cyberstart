import { runQuiz, shuffle, draw } from '../ui.js';

const PAIRS = [
  {
    topic: 'Wyszukiwanie użytkownika w bazie',
    safe: 'const user = await db.query(\n  "SELECT * FROM users WHERE email = $1",\n  [email]\n);',
    unsafe: 'const user = await db.query(\n  "SELECT * FROM users WHERE email = \'" + email + "\'"\n);',
    explain: 'Sklejanie zapytania z tekstem od użytkownika to <strong>SQL injection</strong>. Wpisując w pole e-mail fragment kodu SQL, można zmienić sens zapytania i np. pobrać całą bazę. Zapytanie z parametrem (<code>$1</code>) traktuje dane zawsze jako dane, nigdy jako kod.'
  },
  {
    topic: 'Wyświetlanie komentarza użytkownika',
    safe: 'commentBox.textContent = comment.text;',
    unsafe: 'commentBox.innerHTML = comment.text;',
    explain: '<code>innerHTML</code> interpretuje tekst jako HTML. Komentarz z ukrytym skryptem wykona się w przeglądarce każdego, kto go zobaczy. To <strong>XSS</strong> (cross-site scripting). <code>textContent</code> wyświetla tekst dosłownie.'
  },
  {
    topic: 'Zapisywanie hasła przy rejestracji',
    safe: 'const hash = await argon2.hash(password, {\n  type: argon2.argon2id\n});\nawait db.saveUser(email, hash);',
    unsafe: 'const hash = md5(password);\nawait db.saveUser(email, hash);',
    explain: 'MD5 jest bardzo szybki i nie ma soli, więc po wycieku bazy większość haseł da się odgadnąć w kilka godzin. <strong>Argon2id</strong> (albo bcrypt) jest celowo powolny i automatycznie dodaje sól.'
  },
  {
    topic: 'Klucz do płatności w aplikacji webowej',
    safe: 'const paymentKey = process.env.PAYMENT_SECRET_KEY;',
    unsafe: 'const PAYMENT_SECRET_KEY = "TAJNY_KLUCZ_123";',
    explain: 'Sekret wpisany w kod trafia do repozytorium, a często do plików wysyłanych przeglądarce, gdzie każdy może go podejrzeć. Sekrety trzymaj w zmiennych środowiskowych (plik <code>.env</code> poza repozytorium) i używaj ich tylko na serwerze.'
  },
  {
    topic: 'Pobieranie faktury po numerze',
    safe: 'app.get("/faktury/:id", auth, async (req, res) => {\n  const f = await db.faktura(req.params.id);\n  if (!f || f.userId !== req.user.id) {\n    return res.status(404).end();\n  }\n  res.json(f);\n});',
    unsafe: 'app.get("/faktury/:id", auth, async (req, res) => {\n  const f = await db.faktura(req.params.id);\n  res.json(f);\n});',
    explain: 'Bez sprawdzenia właściciela wystarczy zmienić numer w adresie (<code>/faktury/1001</code> na <code>/faktury/1002</code>), żeby zobaczyć cudzą fakturę. To błąd <strong>IDOR</strong>, jeden z najczęstszych w aplikacjach webowych. Samo zalogowanie nie oznacza prawa do każdego rekordu.'
  },
  {
    topic: 'Ustawianie ciasteczka sesji',
    safe: 'res.cookie("sesja", sessionId, {\n  httpOnly: true,\n  secure: true,\n  sameSite: "lax",\n  maxAge: 8 * 60 * 60 * 1000\n});',
    unsafe: 'res.cookie("sesja", sessionId);',
    explain: '<code>httpOnly</code> ukrywa ciasteczko przed skryptami (utrudnia kradzież przez XSS), <code>secure</code> wysyła je tylko przez HTTPS, <code>sameSite</code> chroni przed atakami CSRF, a <code>maxAge</code> ogranicza czas życia sesji.'
  },
  {
    topic: 'Obsługa błędu na serwerze',
    safe: 'catch (error) {\n  logger.error(error);\n  res.status(500).json({ message: "Coś poszło nie tak" });\n}',
    unsafe: 'catch (error) {\n  res.status(500).json({ message: error.message, stack: error.stack });\n}',
    explain: 'Szczegóły błędu (ścieżki plików, wersje bibliotek, fragmenty zapytań) to cenna mapa dla atakującego. Użytkownik dostaje ogólny komunikat, a szczegóły trafiają do logów serwera.'
  },
  {
    topic: 'Pobieranie pliku po nazwie',
    level: 'zaawansowany',
    safe: 'const name = path.basename(req.query.name);\nconst file = path.resolve(UPLOADS, name);\nif (!file.startsWith(UPLOADS + path.sep)) {\n  return res.status(400).end();\n}\nres.sendFile(file);',
    unsafe: 'res.sendFile(path.join(UPLOADS, req.query.name));',
    explain: 'Nazwa w stylu <code>../../etc/passwd</code> wyprowadza poza katalog z plikami. To <strong>path traversal</strong>. Bezpieczna wersja zostawia samą nazwę pliku i sprawdza, czy wynikowa ścieżka leży w dozwolonym katalogu.'
  },
  {
    topic: 'Endpoint logowania',
    level: 'zaawansowany',
    safe: 'app.post("/login",\n  rateLimit({ windowMs: 15 * 60 * 1000, limit: 10 }),\n  login\n);',
    unsafe: 'app.post("/login", login);',
    explain: 'Bez limitu prób automat może zgadywać hasła bez końca. Limit zapytań (rate limiting) na logowanie, rejestrację i reset hasła to podstawa. Uzupełnia go blokada po serii błędów i 2FA.'
  },
  {
    topic: 'Przyjmowanie przesłanego pliku',
    level: 'zaawansowany',
    safe: 'if (file.size > 5 * 1024 * 1024) throw new Error("Za duży");\nconst type = await fileTypeFromBuffer(file.buffer);\nif (!["image/png", "image/jpeg"].includes(type?.mime)) {\n  throw new Error("Niedozwolony typ");\n}\nawait save(file.buffer, crypto.randomUUID() + "." + type.ext);',
    unsafe: 'if (file.originalname.endsWith(".jpg")) {\n  await save(file.buffer, file.originalname);\n}',
    explain: 'Rozszerzenie i nazwę wymyśla użytkownik, więc łatwo przemycić skrypt jako <code>zdjecie.jpg</code> albo nadpisać cudzy plik. Bezpiecznie: limit rozmiaru, typ sprawdzany po zawartości pliku i losowa nazwa nadana przez serwer.'
  }
];

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
}

function snippet(code) {
  return `<code class="code-block code-choice">${escapeHtml(code)}</code>`;
}

function pairQuestion(pair) {
  return {
    prompt: `<strong>${pair.topic}.</strong> Która wersja jest bezpieczniejsza?`,
    options: shuffle([
      { label: snippet(pair.safe), correct: true },
      { label: snippet(pair.unsafe) }
    ]),
    explain: pair.explain,
    level: pair.level
  };
}

export default {
  id: 'kod',
  title: 'Bezpieczny kod',
  category: 'obrona',
  icon: 'code',
  minutes: 10,
  levels: true,
  summary: 'Siedem par fragmentów kodu aplikacji webowej. W każdej wskaż bezpieczniejszą wersję i poznaj najczęstsze błędy: SQL injection, XSS, IDOR i wycieki sekretów.',
  lesson: [
    'Większość włamań do aplikacji to nie magia, tylko kilka powtarzających się błędów programistów. Lista <strong>OWASP Top 10</strong> zbiera najczęstsze z nich i jest punktem wyjścia dla każdego, kto pisze lub testuje aplikacje webowe.',
    'Złota zasada: <strong>nie ufaj danym od użytkownika</strong>. Wszystko, co przychodzi z formularza, adresu czy ciasteczka, może być spreparowane. Sprawdzaj to na serwerze i nigdy nie traktuj tego jako kodu.',
    'Nie musisz znać programowania. Czytaj kod jak przepis: zwróć uwagę, skąd biorą się dane i czy ktoś je sprawdza.'
  ],
  takeaways: [
    'Zapytania do bazy tylko z parametrami. Sklejanie z tekstem użytkownika to SQL injection.',
    'Tekst od użytkownika wyświetlaj jako tekst (<code>textContent</code>), a nie jako HTML.',
    'Hasła przechowuj jako skróty Argon2id lub bcrypt. Nigdy MD5, SHA-1 ani jawnym tekstem.',
    'Sekrety w zmiennych środowiskowych na serwerze, a nie w kodzie.',
    'Przy każdym odczycie sprawdzaj, czy użytkownik ma prawo do tego konkretnego rekordu.',
    'Na zewnątrz ogólne komunikaty błędów, szczegóły tylko w logach.'
  ],
  async mount(stage, ctx) {
    const questions = draw(PAIRS, 7, ctx.level).map(pairQuestion);
    const score = await runQuiz(stage, ctx, questions, { label: 'Przegląd kodu' });
    ctx.finish({ score, max: questions.length });
  }
};

export function examPool() {
  return PAIRS.map(pairQuestion);
}
