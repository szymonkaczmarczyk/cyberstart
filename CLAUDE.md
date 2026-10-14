# Cyberstart: zasady projektu

Edukacyjna aplikacja webowa z 34 minigrami o cyberbezpieczeństwie, sieciach, Linuksie (Kali) i zabezpieczeniach, dla osób zaczynających od zera. Wszystko po polsku, wszystko działa lokalnie w przeglądarce.

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
- `js/progress.js`: wyniki, XP, rangi (procent ukończonych gier), fiszki, seria, wyzwanie dnia, odznaki, poziom, eksport i import.
- `js/badges.js`: definicje odznak i ich ocena po każdej grze.
- `js/resources.js`: zewnętrzne materiały „Kolejny krok w praktyce” przypisane do gier.
- Wspólne komponenty gier: `js/terminal-engine.js` (symulator terminala z potokami, przekierowaniami i wzorcami), `js/config-audit.js` (panel ustawień z audytem), `js/log-viewer.js` (przeglądarka logów z filtrem), `js/scenario.js` (scenariusze z punktacją 0, 1, 2).
- `js/games/index.js`: rejestr gier i kategorii (kolejność = ścieżka nauki).
- `js/games/<id>.js`: jedna gra = jeden moduł eksportujący `{ id, title, category, icon, minutes, summary, lesson[], takeaways[], mount(stage, ctx) }`.
- `css/main.css`: style wspólne, `css/games.css`: style poszczególnych gier.

## Kontrakt gry

- `mount(stage, ctx)` rysuje grę w `stage`. Może być `async`.
- `ctx.progress(zrobione, wszystkie)` aktualizuje pasek postępu.
- `ctx.finish({ score, max })` zapisuje wynik (XP = score / max * 100, zapisywany najlepszy) i pokazuje podsumowanie z listą `takeaways`.
- `ctx.signal` (AbortSignal) przerywa nasłuch klawiatury przy zmianie widoku. Skróty klawiszowe rejestruj przez `onKey(ctx.signal, ...)`.
- `levels: true` włącza przełącznik poziomu (podstawowy, zaawansowany). Poziom trafia do `ctx.level`. Treści trzymaj w pulach, a zestaw na rozgrywkę losuj przez `draw(pula, ile, ctx.level)`. Elementy z `level: 'zaawansowany'` pojawiają się tylko na poziomie zaawansowanym.
- Opcjonalne `badge()` zwraca krótki tekst (np. „5 do powtórki”), który mapa pokazuje na karcie gry z kropką uwagi.
- Odpowiedzi w `runQuiz` są tasowane domyślnie.
- Opcjonalny eksport `examPool()` udostępnia pytania do egzaminu końcowego (`js/games/egzamin.js` losuje z nich zestaw).
- Treści z HTML (`lesson`, `takeaways`, `why`) to statyczne teksty autorskie. Tekst wpisany przez użytkownika zawsze przez `textContent`, nigdy przez `innerHTML`.

## Gry (kolejność na ścieżce)

Linux i Kali
1. terminal: symulator terminala Kali, 12 misji (pwd, ls, cd, cat, ls -a, grep)
2. uprawnienia: chmod, rwx, zapis ósemkowy, SUID, umask
3. ctf: terminal poziom 2, 12 flag (find, file, potoki, sort, uniq, base64, chmod)
4. ssh: utwardzanie sshd_config z podglądem pliku
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
22. url: czytanie domen w adresach, punycode
23. socjotechnika: scenariusze reakcji
24. prywatnosc: audyt cyfrowego śladu

Obrona w praktyce
25. router: zabezpieczanie domowego routera
26. logi: analityk SOC, auth.log
27. weblogi: analityk SOC, access.log serwera WWW
28. sledztwo: terminal na przejętym serwerze (last, ps aux, ss -tulpn, cron, /etc/passwd, authorized_keys)
29. incydent: reakcja na ransomware krok po kroku
30. malware: typy złośliwego oprogramowania, priorytety łatek CVE i CVSS, aktualizacje
31. backup: kopie 3-2-1 z symulacją awarii
32. kod: bezpieczniejszy fragment kodu (SQL injection, XSS, IDOR, path traversal)

Powtórka i egzamin
33. slownik: 44 pojęcia na fiszkach z powtórkami w odstępach
34. egzamin: 25 losowych pytań z 23 tematów, próg 80%, dyplom do druku lub PDF

## Testy

- `npm run test:e2e` uruchamia Playwright (serwer na porcie 4181 startuje sam). Projekty: `desktop` i `mobile` (375 px).
- `tests/e2e/helpers.js` zawiera autoplayera, który przechodzi każdą grę do ekranu wyniku. Nowa gra z nietypową mechaniką potrzebuje obsługi w funkcji `special()` albo przycisku z atrybutem `data-autoplay`.
- `tests/e2e/a11y.spec.js` uruchamia axe-core (WCAG 2.2 AA) na każdym ekranie, w trakcie gry i na ekranie wyniku, w obu motywach. Nowe komponenty muszą przechodzić ten audyt.
- `tests/e2e/robustness.spec.js` sprawdza silnik terminala, obsługę klawiaturą, tryb offline, odrzucanie zmanipulowanego importu i brak błędów konsoli na wszystkich trasach.
- Testy pilnują: przejścia wszystkich gier na obu poziomach, braku błędów w konsoli, braku poziomego przewijania na telefonie, celów dotyku min. 44 px, eksportu i importu postępu, przeciągania, skrótów, powtórek fiszek, zaliczenia egzaminu z dyplomem, wyzwania dnia, serii, odznak, linków do praktyki i rejestracji service workera.

## Jak dodać grę

1. Utwórz `js/games/<id>.js` według kontraktu powyżej.
2. Dodaj import i wpis w `GAMES` w `js/games/index.js`.
3. Style dopisz do `css/games.css`, używając tokenów.
4. Uruchom `npm run test:e2e` i sprawdź oba motywy.

## Do uzupełnienia przed wdrożeniem

- Pola `[[...]]` w `polityka-prywatnosci.html`, `regulamin.html`, `robots.txt` i `sitemap.xml` (dane administratora, domena, hosting).

## Dziennik zmian

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
