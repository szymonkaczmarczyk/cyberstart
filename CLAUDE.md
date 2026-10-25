# Cyberstart: zasady projektu

Edukacyjna aplikacja webowa z 36 minigrami o cyberbezpieczeństwie, sieciach, Linuksie (Kali) i zabezpieczeniach, dla osób zaczynających od zera. Wszystko po polsku, wszystko działa lokalnie w przeglądarce.

Obowiązują wspólne zasady z `~/.claude/CLAUDE.md` (styl, pisownia, design, brak komentarzy w kodzie). Ten plik je uzupełnia.

## Decyzje i ograniczenia

- Czysty HTML, CSS i JavaScript (moduły ES), bez frameworka i bez kroku budowania. Moduły ES wymagają serwera, więc lokalnie uruchamiamy `npm start` (`scripts/serve.mjs`, Node bez zależności, port 4180, tylko 127.0.0.1, blokada wyjścia poza katalog i plików ukrytych).
- Brak backendu, kont i analityki. Postęp (wyniki, motyw, fiszki, seria dni, wyzwanie dnia, odznaki, poziom trudności) zapisuje się w `localStorage` pod kluczem `cyberstart:v1`, każdy odczyt i zapis w `try/catch`. Eksport i import do pliku JSON przez stopkę.
- PWA: `manifest.webmanifest` i `sw.js` (najpierw sieć z rewalidacją `cache: 'no-cache'`, potem pamięć podręczna, więc online zawsze świeże pliki, offline ostatnia wersja). Przy wdrożeniu nowej wersji zmień stałą `CACHE` w `sw.js`.
- Liczebniki odmieniaj przez `plural(n, 'gra', 'gry', 'gier')` z `js/ui.js`. Nigdy „34 minigier”.
- Teksty do użytkownika w formach neutralnych płciowo: „Dzisiejsza gra zaliczona” zamiast „Dziś już grałeś”, „samodzielnie dzwonię” zamiast „sam dzwonię”. Postaci w scenariuszach mogą mówić w swoim rodzaju.
- Linki do zewnętrznych materiałów tylko w `js/resources.js`, sprawdzone ręcznie. Otwierane w nowej karcie z `rel="noopener noreferrer"`.
- Treści edukacyjne mają charakter obronny i koncepcyjny: rozpoznawanie ataków, konfiguracja zabezpieczeń, etyka i prawo. Brak instrukcji krok po kroku do atakowania cudzych systemów. Wszystkie symulacje (terminal, logi, maile, adresy) są fikcyjne. Marki w przykładach są fikcyjne (Bank Horyzont, Kurier Szybko, Netstream). Adresy IP w przykładach pochodzą z zakresów dokumentacyjnych (192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24) lub prywatnych.
- Fonty lokalnie z Fontsource (OFL): DM Sans (zmienny) i JetBrains Mono, podzbiory latin i latin-ext (polskie znaki).
- Ikony: własny zestaw ścieżek SVG w stylu Lucide w `js/icons.js`. Bez emoji.
- Kolory, odstępy, promienie i czasy animacji tylko z tokenów w `css/tokens.css`. Jasny i ciemny motyw (systemowy domyślnie, przełącznik w nagłówku).
- Animacje wyłącznie w CSS (bez GSAP), subtelne, z obsługą `prefers-reduced-motion`.
- Routing przez hash: `#/` mapa nauki, `#/gra/<id>` gra. Nieznany adres pokazuje widok 404 w aplikacji, a `404.html` służy serwerowi po wdrożeniu.

## Struktura

- `index.html`: szkielet, nagłówek, stopka (eksport, import, zerowanie postępu).
- `js/app.js`: router, mapa nauki z sekcją „Dziś” (wyzwanie dnia, seria, odznaki), widok gry, ekran wyniku, motyw, rejestracja service workera.
- `js/ui.js`: helper `h()` do budowania DOM, `choiceQuestion`, `runQuiz` (z `onAnswer`), `draw`, `feedback`, `onKey`, `scrollBehavior`.
- `js/progress.js`: wyniki, XP, rangi (procent ukończonych gier), fiszki, seria, wyzwanie dnia, odznaki, poziom, lista błędów do powtórki, eksport i import.
- `js/badges.js`: definicje odznak i ich ocena po każdej grze.
- `js/resources.js`: zewnętrzne materiały „Kolejny krok w praktyce” przypisane do gier.
- Wspólne komponenty gier: `js/terminal-engine.js` (symulator terminala z potokami, przekierowaniami i wzorcami), `js/config-audit.js` (panel ustawień z audytem, opcjonalny próg zaliczenia `passRatio`, np. `1` = wszystkie ustawienia bezpieczne), `js/log-viewer.js` (przeglądarka logów z filtrem), `js/scenario.js` (scenariusze z punktacją 0, 1, 2, opcjonalnie z rozmową w makiecie telefonu: pola `contact`, `channel`, `chat[]` z `{ me?, text }`).
- `js/games/index.js`: rejestr gier i kategorii (kolejność = ścieżka nauki).
- `js/games/<id>.js`: jedna gra = jeden moduł eksportujący `{ id, title, category, icon, minutes, summary, lesson[], takeaways[], mount(stage, ctx) }`.
- `css/main.css`: style wspólne, `css/games.css`: style poszczególnych gier.

## Kontrakt gry

- `mount(stage, ctx)` rysuje grę w `stage`. Może być `async`.
- `ctx.progress(zrobione, wszystkie)` aktualizuje i pokazuje pasek postępu. `ctx.hideProgress()` chowa pasek, gdy zdradzałby odpowiedź (panel audytu pokazuje go dopiero po uruchomieniu audytu).
- `ctx.finish({ score, max })` zapisuje wynik (XP = score / max * 100, zapisywany najlepszy) i pokazuje podsumowanie z listą `takeaways`.
- `ctx.signal` (AbortSignal) przerywa nasłuch klawiatury przy zmianie widoku. Skróty klawiszowe rejestruj przez `onKey(ctx.signal, ...)`.
- `levels: true` włącza przełącznik poziomu (podstawowy, zaawansowany). Poziom trafia do `ctx.level`. Treści trzymaj w pulach, a zestaw na rozgrywkę losuj przez `draw(pula, ile, ctx.level)`. Elementy z `level: 'zaawansowany'` pojawiają się tylko na poziomie zaawansowanym.
- Opcjonalne `badge()` zwraca krótki tekst (np. „5 do powtórki”), który mapa pokazuje na karcie gry z kropką uwagi.
- Odpowiedzi w `runQuiz` są tasowane domyślnie. Po każdej odpowiedzi `runQuiz` woła `ctx.answer(pytanie, poprawna)`: zła odpowiedź trafia na listę błędów, dobra ją zdejmuje. Lista trzyma tylko klucz `idGry:skrótTreści` (FNV-1a) i datę, bez treści pytania, więc import pliku nie wstrzyknie HTML. Do powtórki wracają tylko pytania, które istnieją w `examPool()` danej gry.
- Opcjonalny eksport `examPool()` udostępnia pytania do egzaminu końcowego (`js/games/egzamin.js` losuje z nich zestaw).
- Treści z HTML (`lesson`, `takeaways`, `why`) to statyczne teksty autorskie. Tekst wpisany przez użytkownika zawsze przez `textContent`, nigdy przez `innerHTML`.

## Gry (kolejność na ścieżce)

Linux i Kali
1. terminal: symulator terminala Kali, 12 misji (pwd, ls, cd, cat, ls -a, grep)
2. uprawnienia: chmod, rwx, zapis ósemkowy, SUID, umask
3. ctf: terminal poziom 2, 12 flag (find, file, potoki, sort, uniq, base64, chmod)
4. ssh: utwardzanie SSH, 24 ustawienia (metody logowania, limity, zbędne funkcje, kryptografia, logi, klucz FIDO2, fail2ban, aktualizacje, firewall), podgląd pliku `00-utwardzenie.conf`, zaliczenie tylko przy 24/24
5. kali: dopasowanie narzędzi Kali + etyka i prawo
6. instalacja: Kali w UTM lub VirtualBox, lista kontrolna i quiz

Jak działa sieć
7. osi: warstwy modelu OSI
8. ip: bity, adresy prywatne i publiczne, CIDR
9. porty: porty i usługi
10. pakiet: kolejność kroków (DNS, TCP, TLS, HTTP, logowanie, e-mail, DHCP, aktualizacje)
11. ruch: czytanie nagrania ruchu jak w Wiresharku
12. skan: raport skanu własnego serwera i plan działań
13. firewall: decyzje przepuść / zablokuj według polityki, reguły ufw
14. wifi: bezpieczne Wi-Fi, evil twin, WPA3, 802.1X

Hasła i kryptografia
15. hasla: laboratorium siły haseł + quiz o 2FA i menedżerach
16. konto: zabezpieczanie skrzynki krok po kroku (hasło, 2FA, kody zapasowe, sesje, aplikacje OAuth, odzyskiwanie, alerty)
17. szyfry: Cezar, Base64, SHA-256, klucze symetryczne i asymetryczne
18. certyfikaty: certyfikaty TLS, kłódka, HSTS, Certificate Transparency

Ludzie i internet
19. phishing: skrzynka z wiadomościami, także z kontekstem i quishingiem
20. naglowki: nagłówki maila, SPF, DKIM, DMARC, Reply-To
21. sms: smishing i oszustwa w komunikatorach (dopłata, „nowy numer dziecka”, kody, 8080)
22. ogloszenia: oszustwa przy sprzedaży i kupowaniu z ogłoszeń (link do „odbioru pieniędzy”, przejście na komunikator, fałszywy przelew, nadpłata, BLIK, fałszywa bramka płatności, kod z SMS), rozmowy w makiecie telefonu
23. url: czytanie domen w adresach, punycode
24. socjotechnika: scenariusze reakcji
25. prywatnosc: audyt cyfrowego śladu

Obrona w praktyce
26. router: zabezpieczanie domowego routera
27. logi: analityk SOC, auth.log
28. weblogi: analityk SOC, access.log serwera WWW
29. sledztwo: terminal na przejętym serwerze (last, ps aux, ss -tulpn, cron, /etc/passwd, authorized_keys)
30. incydent: reakcja na ransomware krok po kroku
31. malware: typy złośliwego oprogramowania, priorytety łatek CVE i CVSS, aktualizacje
32. backup: kopie 3-2-1 z symulacją awarii
33. kod: bezpieczniejszy fragment kodu (SQL injection, XSS, IDOR, path traversal)

Powtórka i egzamin
34. slownik: 44 pojęcia na fiszkach z powtórkami w odstępach
35. powtorka: pytania z błędami z quizów i egzaminu, dopełnione do 10 losowymi pytaniami z ukończonych gier (albo z całego kursu na początku nauki), `badge()` z liczbą do powtórki
36. egzamin: 25 losowych pytań z 24 tematów, próg 80%, lista tematów do powtórki z linkami do gier

## Testy

- `npm run test:e2e` uruchamia Playwright (serwer na porcie 4181 startuje sam). Projekty: `desktop` i `mobile` (375 px).
- `tests/e2e/helpers.js` zawiera autoplayera, który przechodzi każdą grę do ekranu wyniku. Nowa gra z nietypową mechaniką potrzebuje obsługi w funkcji `special()` albo przycisku z atrybutem `data-autoplay`.
- `tests/e2e/a11y.spec.js` uruchamia axe-core (WCAG 2.2 AA) na każdym ekranie, w trakcie gry i na ekranie wyniku, w obu motywach. Nowe komponenty muszą przechodzić ten audyt.
- `tests/e2e/robustness.spec.js` sprawdza silnik terminala, obsługę klawiaturą, tryb offline, odrzucanie zmanipulowanego importu i brak błędów konsoli na wszystkich trasach.
- `tests/e2e/visual.spec.js` porównuje zrzuty ekranu: mapa (cała strona), każda gra na starcie i po pierwszym ruchu oraz ekran wyniku, w obu motywach. `Math.random` ma stałe ziarno, czas jest zamrożony, a każda trasa jest przeładowywana, żeby losowanie zawsze startowało od początku. Tolerancja to 100 pikseli, więc drobna usterka stylu (np. brak stylów jednego elementu) wywala test. Wzorce są tylko dla macOS i nie trafiają do gita (`.gitignore`). Po zamierzonej zmianie wyglądu uruchom `npm run test:visual:update` i obejrzyj zmienione zrzuty.
- Testy pilnują: przejścia wszystkich gier na obu poziomach, braku błędów w konsoli, braku poziomego przewijania na telefonie, celów dotyku min. 44 px, eksportu i importu postępu, przeciągania, skrótów, powtórek fiszek, powtórki błędów i walidacji jej importu, zaliczenia i niezaliczenia egzaminu, wyzwania dnia, serii, odznak, linków do praktyki i rejestracji service workera.

## Jak dodać grę

1. Utwórz `js/games/<id>.js` według kontraktu powyżej.
2. Dodaj import i wpis w `GAMES` w `js/games/index.js`.
3. Style dopisz do `css/games.css`, używając tokenów.
4. Uruchom `npm run test:visual:update`, obejrzyj nowe zrzuty, a potem `npm run test:e2e` i sprawdź oba motywy.

## Do uzupełnienia przed wdrożeniem

- Pola `[[...]]` w `polityka-prywatnosci.html`, `regulamin.html`, `robots.txt` i `sitemap.xml` (dane administratora, domena, hosting).

## Dziennik zmian

- 2026-10-25: Dokumentacja techniczna (`docs/dokumentacja-techniczna.html` i `.pdf`) uzupełniona o: `ctx.answer` i `ctx.hideProgress`, rozmowę w `playScenario` (`contact`, `channel`, `chat`) z przykładem, `topicQuestions()`, nową sekcję „Powtórka błędów” (klucze, limit, decyzje), klucz `mistakes` w zapisie i walidację przy imporcie, testy wizualne i krótką listę kontrolną przed nową wersją. Układ PDF przerobiony według wzoru z `project-docs`: sekcje płyną bez wymuszonych podziałów, tabele mają `<thead>`, długie bloki kodu mogą się dzielić z `orphans`/`widows` 5. Było 23 strony, z czego 13 poniżej 75%. Jest 19 stron, każda 75-100%, bez pojedynczych wierszy tabel na nowej stronie.

- 2026-10-24: Trzy usprawnienia z listy propozycji (kolejność 1, 3, 5, zaakceptowana przez właściciela).
  1. Wizualne testy regresji `tests/e2e/visual.spec.js` (76 zrzutów, oba motywy) ze stałym ziarnem losowania, zamrożonym czasem i tolerancją 100 pikseli. Sprawdzone, że wykrywają usunięcie jednej reguły CSS (np. `.phone-who`), a trzy przebiegi z rzędu dają identyczne zrzuty. Wzorce tylko lokalnie (`.gitignore`), odświeżanie przez `npm run test:visual:update`.
  2. Powtórka błędów: `runQuiz` zapisuje każdą odpowiedź przez `ctx.answer`, `progress.js` trzyma listę błędów (klucz `idGry:skrót`, limit 300 wpisów, walidacja przy imporcie), nowa gra `powtorka` (35. na ścieżce) z licznikiem „do powtórki” na mapie, wykluczona z wyzwania dnia (jak słownik i egzamin). Egzamin udostępnia `topicQuestions()`.
  3. Nowa gra `ogloszenia` (22. na ścieżce, dział Ludzie i internet): 8 sytuacji przy sprzedaży i kupowaniu z ogłoszeń, rozmowy w makiecie telefonu (rozszerzenie `playScenario` o `chat`), pytania w egzaminie, linki do CERT Polska i Bezpiecznego Banku. Marki fikcyjne: Targowisko, Kurier Szybko. Nowa ikona `package`.
  Razem 36 gier: meta w `index.html`, oba README i obraz OG (`img/og.png` odtworzony w 1200x630 w tym samym układzie, z liczbą 36). Cache service workera `cyberstart-v9`. 113 testów e2e przechodzi.

- 2026-10-16: Gra logi, pytanie o liczbę nieudanych prób z 203.0.113.45: poprawna odpowiedź to nadal 9, ale filtr „Failed” pokazuje 10 linii (linia 09 to Kasia z 198.51.100.23) i to myliło. Odpowiedź 15 zastąpiona pułapką 10 z wyjaśnieniem, poprawna odpowiedź mówi wprost o linii 09, a podpowiedź przy 3 nie każe już wpisywać dwóch fraz naraz (filtr szuka jednego ciągu). Cache service workera `cyberstart-v8`.

- 2026-10-16: Gra sms nie miała żadnych stylów makiety telefonu (`.phone`, `.phone-head`, `.phone-avatar`, `.sms-bubble`), więc nadawca i kanał sklejały się w „Nieznany numerSMS”. Dodane style w `css/games.css`: nagłówek z okrągłym awatarem, nazwą nadawcy i kanałem pod spodem (`.phone-who`), dymek wiadomości, który po ocenie robi się czerwony (`is-scam`) albo zielony (`is-safe`). Cache service workera `cyberstart-v7`.

- 2026-10-16: W grach phishing i sms werdykt, lista sygnałów 1/2/3 i przycisk „Następna wiadomość” mają większe odstępy: nowa klasa `.status-stack-loose` (odstęp `--s-6`, 32 px zamiast 16 px), a punkty listy `.flag-list` są rozsunięte o `--s-3`. Cache service workera `cyberstart-v6`.

- 2026-10-16: Po przejściu z ekranu wyniku do kolejnej gry strona czasem zostawała na dole (widać było stopkę zamiast nagłówka i tytułu). Przyczyna: `window.scrollTo({ top: 0 })` w routerze dziedziczył `scroll-behavior: smooth` z `html`, a płynną animację przerywa bezwładność trackpada, dotyk albo karta w tle. Router przewija teraz natychmiast (`behavior: 'instant'`), to samo dla „Zagraj jeszcze raz” i zmiany poziomu. Test ekranu wyniku sprawdza, że nowa gra startuje od góry (headless Chromium nie animuje scrolla, więc sam błąd odtworzono ręcznie w przeglądarce). Cache service workera `cyberstart-v5`.

- 2026-10-14: Dopasowywanie narzędzi w grze kali ma równe rzędy: od 640 px obie kolumny mają wiersze `1fr`, więc narzędzie i opis w tym samym rzędzie mają tę samą wysokość. Miejsce na nazwę narzędzia w opisie jest zarezerwowane od startu (wyszarzony znak „?”, ukryty przed czytnikami ekranu), więc po dopasowaniu nic nie skacze. Cache service workera `cyberstart-v4`.

- 2026-10-14: Utwardzanie SSH rozbudowane z 10 do 24 ustawień, żeby dało się zabezpieczyć serwer w komplecie: KbdInteractiveAuthentication, AuthenticationMethods, LoginGraceTime, MaxStartups, AllowTcpForwarding, AllowAgentForwarding, PermitTunnel, KexAlgorithms, Ciphers, MACs, HostKey, LogLevel, klucz administratora (ed25519-sk), automatyczne aktualizacje. Opisy „Dlaczego to ważne?” tłumaczą każdą wartość. Lekcja o kolejności plików w `sshd_config.d` (wygrywa pierwsza wartość, więc `00-`) i o `sshd -T`. Decyzja właściciela: gra przepuszcza dalej tylko przy 24/24, a pasek postępu jest ukryty do pierwszego audytu i chowa się po każdej zmianie ustawień (dotyczy wszystkich gier z panelem audytu). Lista problemów pokazuje nazwę ustawienia. Kontenery komunikatów (`.status-stack`) mają odstęp między boksem a przyciskiem lub listą, we wszystkich grach. Cache service workera `cyberstart-v3`.

- 2026-10-14: Otwarcie `index.html` z dysku (`file://`) pokazywało wieczne „Ładowanie gier…”, bo przeglądarki blokują wtedy moduły ES. Teraz strona wyświetla instrukcję uruchomienia (`npm start`, adres `http://localhost:4180`). Dwa nowe testy, ostrzeżenie w README.

- 2026-10-14: Usunięty dyplom z egzaminu (na prośbę właściciela). Samodzielnie wygenerowany dyplom nie ma żadnej wartości, a nagrodą jest ukończenie gier i odznaka „Strażnik sieci”. Egzamin zostaje jako powtórka końcowa z listą tematów do powtórki. Odznaka „Dyplom” zastąpiona odznaką „Egzamin zaliczony”. Usunięte style dyplomu i wydruku.

- 2026-10-14: Przygotowanie do publikacji na GitHub. `README.md` ze zrzutami ekranu na danych demo (`docs/screenshots/`), `LICENSE` (MIT, Szymon Kaczmarczyk), rozszerzony `.gitignore`, dokumentacja techniczna `docs/dokumentacja-techniczna.html` i `.pdf` (kontrakt gry, komponenty, format zapisu, testy), licencje OFL fontów w `fonts/`. Lokalny serwer w Node (`scripts/serve.mjs`) zamiast Pythona, także w testach. Poprawki z przeglądu zrzutów: 19 tekstów w formie męskiej zamienionych na neutralne, styl kodu w opisach poziomów i w liście „Zapamiętaj”.

- 2026-10-14: Etap 5. Nowe gry: konto, sms, sledztwo, malware (razem 34). Silnik terminala obsługuje dodatkowe polecenia gry (`extraCommands`). Nowe testy: axe-core w obu motywach na wszystkich ekranach i stanach gry, silnik terminala, klawiatura, offline, zmanipulowany import, wydruk dyplomu, ponowna gra, zapamiętany poziom, pełne przejście gier na telefonie. Naprawione błędy wykryte testami: kontrast etykiet akcentowych w jasnym motywie, nieczytelne fragmenty kodu w pytaniach (jasny tekst na jasnym tle), kontrast numerów linii logów i podpowiedzi skrótów, brak dostępu klawiaturą do przewijanych logów i terminala, link „Przejdź do treści” prowadzący do strony 404, fokus przenoszony przy pierwszym wczytaniu, nieaktualne pliki po wdrożeniu nowej wersji (service worker z rewalidacją), błędna odmiana liczebników („34 minigier”).

- 2026-10-14: Plan etapu 5 (zaakceptowany): automatyczne audyty dostępności (axe-core) na wszystkich ekranach w obu motywach, testy trybu offline, klawiatury i silnika terminala, naprawa wykrytych błędów. Nowe gry: śledztwo na serwerze (terminal, szukanie śladów włamania), malware i aktualizacje (typy złośliwego oprogramowania, priorytety łatek CVE), oszustwa SMS i w komunikatorach, zabezpieczanie konta krok po kroku (2FA, kody zapasowe).

- 2026-10-14: Etap 4 rozbudowy. Egzamin końcowy (25 pytań losowanych z pul 20 gier, próg 80%, dyplom do druku lub PDF, lista tematów do powtórki). Wyzwanie dnia i seria dni na mapie oraz w nagłówku. 16 odznak. Sekcja „Kolejny krok w praktyce” z ręcznie sprawdzonymi linkami. PWA: manifest, ikony 192 i 512 px, service worker. Nowy obraz OG. Poprawki z przeglądu: atrybut `hidden` nadpisywany przez CSS, licznik postępu na końcu quizu.
- 2026-10-14: Etap 3 rozbudowy. 12 nowych gier: ctf, ssh, instalacja, ruch, skan, wifi, certyfikaty, naglowki, prywatnosc, weblogi, incydent, backup. Wspólne komponenty: silnik terminala (potoki, przekierowania, wzorce, find, sort, uniq, wc, head, tail, base64, file, chmod), panel audytu ustawień, przeglądarka logów, scenariusze z punktacją. Gry terminal, router, logi i socjotechnika przepięte na wspólne komponenty.

- 2026-10-14: Etap 2 rozbudowy. Pule treści z losowaniem i poziomem zaawansowanym w 13 grach (porty, phishing, adresy, firewall, socjotechnika, kod, hasła, szyfry, Kali, OSI, IP, uprawnienia, sekwencje sieciowe). Fiszki z powtórkami w odstępach (1, 3, 7, 14, 30 dni), sesje do 15 kart, licznik „do powtórki” na mapie.
- 2026-10-14: Etap 1 rozbudowy. Testy e2e Playwright (`npm run test:e2e`). Przegląd według Web Interface Guidelines: theme-color dla obu motywów, cyfry tabelaryczne, `translate="no"` dla terminala, scroll-padding pod przyklejone paski, safe area, paski postępu na `transform`, przewijanie z JS zgodne z ograniczonym ruchem. Na telefonie przyklejony, przewijany rząd narzędzi i elementów do dopasowania. Przeciąganie kroków za uchwyt. Eksport i import postępu do pliku JSON z walidacją. Poprawki z testów: poziome przewijanie w grach firewall i kod, aktywny przycisk podpowiedzi po rozwiązaniu bitów.

- 2026-10-14: Plan rozbudowy (zaakceptowany w całości przez właściciela), realizowany etapami:
  1. Fundamenty: testy e2e Playwright w repo, przegląd dostępności, wygodniejsze dopasowywanie na telefonie, przeciąganie w układaniu kroków, eksport i import postępu.
  2. Powtarzalność: pule pytań z losowaniem i poziomami trudności, powtórki fiszek w odstępach.
  3. Nowe moduły: terminal poziom 2 (mini CTF), utwardzanie SSH, instalacja Kali w UTM, czytanie ruchu sieciowego, raport skanu własnego serwera, bezpieczeństwo Wi-Fi, logi serwera WWW, nagłówki maila (SPF, DKIM, DMARC), reakcja na incydent, kopie 3-2-1, certyfikaty TLS, audyt prywatności.
  4. Mechaniki: egzamin końcowy z dyplomem, wyzwanie dnia i seria dni, odznaki, linki „kolejny krok w praktyce”, PWA offline.
- 2026-10-14: Pierwsza wersja. 17 minigier w 6 kategoriach, mapa nauki z rangami i XP, jasny i ciemny motyw, zapis postępu w localStorage. Strona 404, polityka prywatności i regulamin z polami do uzupełnienia, robots.txt, sitemap.xml, favicon.ico, obraz Open Graph 1200x630. Wszystkie gry przetestowane w przeglądarce od startu do ekranu wyniku, bez poziomego przewijania przy 375 px.
