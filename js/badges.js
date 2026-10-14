import { getResult, getStreak, cardStats, getBadges, awardBadge } from './progress.js';

function categoryDone(games, category) {
  return games.filter((game) => game.category === category).every((game) => getResult(game.id));
}

function perfectCount(games) {
  return games.filter((game) => getResult(game.id)?.xp === 100).length;
}

export const BADGES = [
  { id: 'pierwszy-krok', title: 'Pierwszy krok', text: 'Ukończ pierwszą grę.', icon: 'play', test: ({ games }) => games.some((game) => getResult(game.id)) },
  { id: 'bez-pudla', title: 'Bez pudła', text: 'Zdobądź 100 XP w dowolnej grze.', icon: 'check', test: ({ games }) => perfectCount(games) >= 1 },
  { id: 'piec-perfekcji', title: 'Pięć perfekcji', text: 'Zdobądź 100 XP w pięciu grach.', icon: 'sparkles', test: ({ games }) => perfectCount(games) >= 5 },
  { id: 'lowca-flag', title: 'Łowca flag', text: 'Ukończ mini CTF w terminalu.', icon: 'flag', test: () => Boolean(getResult('ctf')) },
  { id: 'linuksiarz', title: 'Linuksiarz', text: 'Ukończ wszystkie gry z działu Linux i Kali.', icon: 'terminal', test: ({ games }) => categoryDone(games, 'linux') },
  { id: 'sieciowiec', title: 'Sieciowiec', text: 'Ukończ wszystkie gry z działu o sieciach.', icon: 'network', test: ({ games }) => categoryDone(games, 'sieci') },
  { id: 'kryptograf', title: 'Kryptograf', text: 'Ukończ wszystkie gry o hasłach i kryptografii.', icon: 'key', test: ({ games }) => categoryDone(games, 'hasla') },
  { id: 'czujny', title: 'Czujny', text: 'Ukończ wszystkie gry z działu Ludzie i internet.', icon: 'eye', test: ({ games }) => categoryDone(games, 'ludzie') },
  { id: 'obronca', title: 'Obrońca', text: 'Ukończ wszystkie gry z działu Obrona w praktyce.', icon: 'shieldCheck', test: ({ games }) => categoryDone(games, 'obrona') },
  { id: 'wyzszy-poziom', title: 'Wyższy poziom', text: 'Zdobądź co najmniej 80 XP na poziomie zaawansowanym.', icon: 'award', test: ({ outcome }) => Boolean(outcome && outcome.level === 'zaawansowany' && outcome.xp >= 80) },
  { id: 'seria-3', title: 'Trzy dni z rzędu', text: 'Graj trzy dni z rzędu.', icon: 'flame', test: () => getStreak().count >= 3 },
  { id: 'seria-7', title: 'Tydzień nauki', text: 'Graj siedem dni z rzędu.', icon: 'flame', test: () => getStreak().count >= 7 },
  { id: 'wyzwanie', title: 'Wyzwanie przyjęte', text: 'Zalicz wyzwanie dnia.', icon: 'calendar', test: ({ outcome }) => Boolean(outcome?.daily) },
  { id: 'pamiec', title: 'Pamięć słonia', text: 'Utrwal 20 pojęć na fiszkach.', icon: 'book', test: ({ terms }) => cardStats(terms).learned >= 20 },
  { id: 'dyplom', title: 'Dyplom', text: 'Zalicz egzamin końcowy (co najmniej 80%).', icon: 'trophy', test: () => (getResult('egzamin')?.xp ?? 0) >= 80 },
  { id: 'straznik', title: 'Strażnik sieci', text: 'Ukończ wszystkie gry.', icon: 'shield', test: ({ games }) => games.every((game) => getResult(game.id)) }
];

export function evaluateBadges(context) {
  return BADGES.filter((badge) => badge.test(context) && awardBadge(badge.id));
}

export function badgeStatus() {
  const earned = getBadges();
  return BADGES.map((badge) => ({ ...badge, earned: earned[badge.id] ?? null }));
}
