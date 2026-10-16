import terminal from './terminal.js';
import uprawnienia from './uprawnienia.js';
import ctf from './ctf.js';
import ssh from './ssh.js';
import kali from './kali.js';
import instalacja from './instalacja.js';
import osi from './osi.js';
import ip from './ip.js';
import porty from './porty.js';
import pakiet from './pakiet.js';
import ruch from './ruch.js';
import skan from './skan.js';
import firewall from './firewall.js';
import wifi from './wifi.js';
import hasla from './hasla.js';
import szyfry from './szyfry.js';
import certyfikaty from './certyfikaty.js';
import phishing from './phishing.js';
import naglowki from './naglowki.js';
import url from './url.js';
import socjotechnika from './socjotechnika.js';
import prywatnosc from './prywatnosc.js';
import router from './router.js';
import logi from './logi.js';
import weblogi from './weblogi.js';
import incydent from './incydent.js';
import backup from './backup.js';
import kod from './kod.js';
import slownik from './slownik.js';
import egzamin from './egzamin.js';
import sledztwo from './sledztwo.js';
import malware from './malware.js';
import sms from './sms.js';
import konto from './konto.js';

export const CATEGORIES = [
  {
    id: 'linux',
    title: 'Linux i Kali',
    icon: 'terminal',
    description: 'Terminal to podstawowe narzędzie administratorów i pentesterów. Od poruszania się po plikach, przez uprawnienia i mini CTF, po utwardzanie SSH i własne Kali w maszynie wirtualnej.'
  },
  {
    id: 'sieci',
    title: 'Jak działa sieć',
    icon: 'network',
    description: 'Żeby chronić sieć, trzeba wiedzieć, jak płyną w niej dane. Warstwy, adresy, porty, czytanie ruchu, raport skanu, firewall i Wi-Fi.'
  },
  {
    id: 'hasla',
    title: 'Hasła i kryptografia',
    icon: 'key',
    description: 'Dlaczego długie hasło wygrywa ze skomplikowanym, jak zabezpieczyć konto krok po kroku, czym hash różni się od szyfrowania i co naprawdę oznacza kłódka w przeglądarce.'
  },
  {
    id: 'ludzie',
    title: 'Ludzie i internet',
    icon: 'users',
    description: 'Najczęściej atakuje się człowieka, nie komputer. Fałszywe maile i ich nagłówki, oszustwa SMS, podejrzane linki, manipulacja i Twój ślad w sieci.'
  },
  {
    id: 'obrona',
    title: 'Obrona w praktyce',
    icon: 'shieldCheck',
    description: 'Zabezpieczasz router, czytasz logi jak analityk SOC, prowadzisz śledztwo na przejętym serwerze i reakcję na ransomware, łatasz podatności, projektujesz kopie zapasowe i wybierasz bezpieczniejszy kod.'
  },
  {
    id: 'wiedza',
    title: 'Powtórka i egzamin',
    icon: 'book',
    description: 'Najważniejsze pojęcia na fiszkach z powtórkami i egzamin końcowy z listą tematów do powtórki.'
  }
];

export const GAMES = [
  terminal,
  uprawnienia,
  ctf,
  ssh,
  kali,
  instalacja,
  osi,
  ip,
  porty,
  pakiet,
  ruch,
  skan,
  firewall,
  wifi,
  hasla,
  konto,
  szyfry,
  certyfikaty,
  phishing,
  naglowki,
  sms,
  url,
  socjotechnika,
  prywatnosc,
  router,
  logi,
  weblogi,
  sledztwo,
  incydent,
  malware,
  backup,
  kod,
  slownik,
  egzamin
];

export function findGame(id) {
  return GAMES.find((game) => game.id === id) ?? null;
}

export function nextGame(id) {
  const index = GAMES.findIndex((game) => game.id === id);
  return GAMES[index + 1] ?? null;
}

export function categoryOf(game) {
  return CATEGORIES.find((category) => category.id === game.category);
}
