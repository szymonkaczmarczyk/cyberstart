# Cyberstart

[Polski](README.md) · **English**

> Cybersecurity from zero, in 34 minigames in Polish.

Cyberstart is an app for learning cybersecurity for people starting from scratch. Instead of lectures there are
short games: you capture flags in a Kali Linux terminal simulator, spot phishing and SMS scams, set up a firewall,
read logs like a SOC analyst, investigate a compromised server and respond to ransomware. Every game starts with
a minute of theory and ends with a "Remember" list and links to legal places where you can keep practicing.

It is a static app in plain HTML, CSS and ES modules. No framework, no build step, no backend and no accounts.
Progress is saved only in the browser, and the app also works offline.

The app is in Polish.

![Cyberstart learning map with the "Today" section: daily challenge, day streak and badges](docs/screenshots/home.png)

## Who it is for

- **People who want to get into cybersecurity and don't know where to start.** No installs and no Linux knowledge
  needed. The path goes from `pwd` and `ls` through networks and cryptography to log analysis and incident response.
- **Anyone who wants to protect themselves and their family better.** Games about phishing, SMS, social engineering,
  passwords, securing accounts, routers and privacy are useful whatever your job is.
- **Teachers and companies** looking for security basics training material in Polish. The code is simple, and a new
  game is a single file written according to the [technical documentation](docs/dokumentacja-techniczna.pdf).

It is not a course on attacking systems. The content is defensive: it teaches you to recognize threats, configure
protections and understand what is legal. All companies, logs, emails and addresses in the games are fictional.

## How it works

```
index.html ──► js/app.js            hash router, learning map, game view, result screen
                  │
                  ├──► js/games/*.js     34 games, each in its own module
                  │       └──► shared components: terminal, audit panel, log viewer,
                  │            quizzes, scenarios
                  ├──► js/progress.js    progress in localStorage (nothing leaves the browser)
                  ├──► js/badges.js      badges
                  └──► js/resources.js   "Next step in practice": vetted external links
sw.js ──► offline mode and install on phone (PWA)
```

One play session looks like this:

1. On the learning map you pick a game or the "Daily challenge". Cards show your score and the number of flashcards
   due for review.
2. You read the "minute of theory", choose a level (basic or advanced) and play. Questions and situations are drawn
   from a larger pool, so every attempt is a bit different.
3. The result screen shows XP, new badges, your day streak, a "Remember" list and materials for further learning.
4. Glossary flashcards come back after 1, 3, 7, 14 and 30 days. At the end there is an exam of 25 random questions
   from the whole course that shows which games are worth revisiting.

## Features

| Section | Games |
|---|---|
| Linux and Kali | First steps in the terminal, File permissions, Terminal level 2: mini CTF, SSH hardening, Kali tools and ethics, Kali in a virtual machine |
| How the network works | Network layers (OSI), IP addresses and subnets, Ports and services, Data's journey through the network, Reading network traffic, Scan report of your own server, You are the firewall, Secure Wi-Fi |
| Passwords and cryptography | Password lab, Secure your account step by step, Ciphers, hashes and encoding, Certificates and the HTTPS padlock |
| People and the internet | Spot the phishing, Email headers (SPF, DKIM, DMARC), SMS and messenger scams, Address detective, Social engineering, Privacy audit |
| Defense in practice | Secure your home router, SOC analyst: auth.log, SOC analyst: web server logs, Investigating a compromised server, Ransomware response, Malware and updates, 3-2-1 backups, Secure code |
| Review and exam | Glossary flashcards (44 terms), Final exam |

**Mechanics**

- **Terminal simulator** with a virtual file system: pipes `|`, redirects `>`, globs `*`, Tab, history, `find`,
  `grep`, `sort`, `uniq`, `base64`, `chmod` and forensic commands (`last`, `ps aux`, `ss -tulpn`).
- **Two difficulty levels** and question pools in most games.
- **Daily challenge, day streak, 16 badges and ranks** from Novice to Network Guardian.
- **Spaced repetition flashcards** with a "due for review" counter on the map.
- **Final exam** with questions from all sections and a list of topics to review.
- **Progress export and import** to a JSON file, light and dark theme, offline mode.

## Screenshots

| Learning map | Mini CTF in the terminal |
|---|---|
| ![Learning map with the Linux and Kali section and game scores](docs/screenshots/mapa.png) | ![Terminal with a sort and uniq pipeline and the CTF level panel](docs/screenshots/ctf.png) |

| Investigating a compromised server | Spot the phishing |
|---|---|
| ![Terminal with last, ps aux and ss output and an investigation question](docs/screenshots/sledztwo.png) | ![Email with highlighted warning signs and an inbox](docs/screenshots/phishing.png) |

| Result screen | Exam: topics to review |
|---|---|
| ![Result of the You are the firewall game with a Remember list and a practice link](docs/screenshots/wynik.png) | ![Exam result with a list of games to review](docs/screenshots/egzamin.png) |

| SMS scams, dark theme | Phone: map | Phone: terminal |
|---|---|---|
| ![A bank SMS in the phone view, dark theme](docs/screenshots/sms-ciemny.png) | ![Learning map on a phone screen](docs/screenshots/telefon-mapa.png) | ![First steps in the terminal on a phone screen](docs/screenshots/telefon-terminal.png) |

Progress and all in-game data in the screenshots are sample data.

## Getting started

Requires Node.js 18 or newer. The app itself has no dependencies.

```bash
npm start
```

The app runs at `http://localhost:4180`. Don't open `index.html` by double-clicking: browsers block JavaScript modules
from `file://` URLs, so the games won't load (the page then shows run instructions). Without Node.js,
`python3 -m http.server 4180` in the project folder works too. Tests need the dev packages:

```bash
npm install
npx playwright install chromium
npm run test:e2e
```

| Script | What it does |
|---|---|
| `npm start` | Local dependency-free server (`scripts/serve.mjs`) on port 4180 |
| `npm run test:e2e` | All Playwright tests (desktop and phone), about 40 seconds |
| `npm run test:e2e:ui` | Tests in Playwright's interactive mode |

## Configuration

The app has no `.env` file and no secrets. The local server accepts two variables:

| Variable | Description |
|---|---|
| `PORT` | Server port, default `4180` |
| `HOST` | Listen address, default `127.0.0.1` (this computer only) |

### Publishing

Cyberstart runs on any static hosting, e.g. GitHub Pages, Cloudflare Pages or Netlify.

1. Fill in the `[[...]]` fields in `polityka-prywatnosci.html`, `regulamin.html`, `robots.txt` and `sitemap.xml`
   (controller details, domain, hosting).
2. Change the `CACHE` constant in `sw.js` on every deployment so users get the new version.
3. Set security headers on the hosting: CSP, HSTS, `X-Content-Type-Options` and `Referrer-Policy`.

## Structure

```
index.html                     app shell
404.html, polityka-prywatnosci.html, regulamin.html
css/
  tokens.css                   colors, typography, spacing (light and dark theme)
  main.css, games.css          shared styles and game styles
js/
  app.js                       router, map, game view, result screen
  ui.js                        DOM building, quizzes, randomization, Polish number agreement
  progress.js, badges.js, resources.js
  terminal-engine.js, config-audit.js, log-viewer.js, scenario.js   shared game components
  games/                       34 games and the index.js registry
fonts/                         DM Sans and JetBrains Mono (woff2, with OFL licenses)
img/                           icons, Open Graph image
scripts/serve.mjs              local static server
sw.js, manifest.webmanifest    PWA
tests/e2e/                     Playwright tests and a game autoplayer
docs/
  dokumentacja-techniczna.pdf / .html   game contract, components, save format, tests
  screenshots/                          screenshots used in the README
```

## Security and privacy

- No backend, accounts, tracking cookies or analytics. Progress is stored only in `localStorage`.
- Text typed by the user (terminal commands, test passwords, CTF flags) reaches the page only through
  `textContent`. Nothing is sent anywhere.
- Progress import checks the format, size (up to 512 kB) and every value. Tampered entries are skipped.
- The local server listens only on `127.0.0.1` and blocks access outside the project folder and to hidden files
  (e.g. `.git`).
- External links open in a new tab with `rel="noopener noreferrer"`.

## Accessibility

Tests run an axe-core audit (WCAG 2.2 AA) on every screen, during a game and on the result screen, in the light and
dark theme. Every game can be played with the keyboard alone (shortcuts are labeled on the buttons), touch targets
are at least 44 px, and animations turn off with the reduced motion setting.

## How to learn with Cyberstart

1. **Week 1:** terminal, permissions and the mini CTF. Then the "Kali in a virtual machine" game and a real Kali install.
2. **Week 2:** OverTheWire Bandit, levels 0 to 10, in a real terminal over SSH.
3. **5 minutes a day:** the daily challenge and flashcards. The day streak keeps you consistent.
4. **At the end:** the exam. Topics with mistakes come back as review links.

## Documentation

- [`docs/dokumentacja-techniczna.pdf`](docs/dokumentacja-techniczna.pdf): game contract, the `ctx` object, shared
  components, terminal simulator, progress save format, export and import, PWA and tests (Polish).
- [`CLAUDE.md`](CLAUDE.md): design decisions, conventions and changelog (Polish).

## License

Code under the MIT license, `Copyright (c) 2026 Szymon Kaczmarczyk`. Full text in [`LICENSE`](LICENSE).

The DM Sans and JetBrains Mono fonts are included under the SIL Open Font License 1.1, license texts in the
[`fonts/`](fonts/) folder.
