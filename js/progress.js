const STORAGE_KEY = 'cyberstart:v1';
const EXPORT_FORMAT = 'cyberstart-progress';
const DAY_MS = 86400000;
const CARD_INTERVALS = [0, 1, 3, 7, 14, 30];

const RANKS = [
  { share: 0, name: 'Nowicjusz' },
  { share: 0.1, name: 'Kursant' },
  { share: 0.25, name: 'Adept' },
  { share: 0.45, name: 'Analityk' },
  { share: 0.7, name: 'Obrońca' },
  { share: 1, name: 'Strażnik sieci' }
];

function emptyState() {
  return { results: {}, theme: null, cards: {}, streak: { last: null, count: 0, best: 0 }, daily: null, badges: {}, difficulty: 'podstawowy' };
}

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === 'object' && parsed.results) return { ...emptyState(), ...parsed };
  } catch {}
  return emptyState();
}

let state = read();

function write() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function todayKey(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function dayDiff(fromKey, toKey) {
  return Math.round((Date.parse(toKey) - Date.parse(fromKey)) / DAY_MS);
}

export function getResult(id) {
  return state.results[id] ?? null;
}

export function xpFor(score, max) {
  return max > 0 ? Math.round((100 * Math.max(0, score)) / max) : 0;
}

export function recordResult(id, score, max) {
  const xp = xpFor(score, max);
  const previous = state.results[id];
  const improved = !previous || xp > previous.xp;
  if (improved) state.results[id] = { score, max, xp, date: new Date().toISOString() };
  const streak = touchStreak();
  write();
  return { xp, improved, previousXp: previous?.xp ?? 0, streak };
}

function touchStreak() {
  const today = todayKey();
  const { last, count } = state.streak;
  if (last === today) return { ...state.streak, extended: false };
  const next = last && dayDiff(last, today) === 1 ? count + 1 : 1;
  state.streak = { last: today, count: next, best: Math.max(state.streak.best ?? 0, next) };
  return { ...state.streak, extended: true };
}

export function getStreak() {
  const { last, count, best } = state.streak;
  const alive = last && dayDiff(last, todayKey()) <= 1;
  return { count: alive ? count : 0, best: best ?? 0, doneToday: last === todayKey() };
}

export function summary(totalGames) {
  const entries = Object.values(state.results);
  const completed = entries.length;
  const xp = entries.reduce((sum, entry) => sum + entry.xp, 0);
  const share = totalGames ? completed / totalGames : 0;
  const rank = [...RANKS].reverse().find((r) => share >= r.share) ?? RANKS[0];
  const nextRank = RANKS.find((r) => r.share > share) ?? null;
  const gamesToNext = nextRank ? Math.ceil(nextRank.share * totalGames) - completed : 0;
  return { completed, xp, maxXp: totalGames * 100, rank, nextRank, gamesToNext };
}

export function getCard(term) {
  return state.cards[term] ?? null;
}

export function isCardDue(term) {
  const card = state.cards[term];
  return !card || card.due <= todayKey();
}

export function reviewCard(term, known) {
  const card = state.cards[term] ?? { box: 0 };
  const box = known ? Math.min(card.box + 1, CARD_INTERVALS.length - 1) : 0;
  const due = todayKey(new Date(Date.now() + CARD_INTERVALS[box] * DAY_MS));
  state.cards[term] = { box, due };
  write();
  return state.cards[term];
}

export function cardStats(terms) {
  const seen = terms.filter((term) => state.cards[term]);
  return {
    due: terms.filter((term) => isCardDue(term)).length,
    learned: seen.filter((term) => state.cards[term].box >= 3).length,
    seen: seen.length
  };
}

export function getDaily() {
  return state.daily?.date === todayKey() ? state.daily : null;
}

export function setDaily(daily) {
  state.daily = { ...daily, date: todayKey() };
  write();
}

export function hasBadge(id) {
  return Boolean(state.badges[id]);
}

export function awardBadge(id) {
  if (state.badges[id]) return false;
  state.badges[id] = new Date().toISOString();
  write();
  return true;
}

export function getBadges() {
  return { ...state.badges };
}

export function getDifficulty() {
  return state.difficulty === 'zaawansowany' ? 'zaawansowany' : 'podstawowy';
}

export function setDifficulty(level) {
  state.difficulty = level === 'zaawansowany' ? 'zaawansowany' : 'podstawowy';
  write();
}

export function resetProgress() {
  state = { ...emptyState(), theme: state.theme };
  write();
}

export function getTheme() {
  return state.theme;
}

export function setTheme(theme) {
  state.theme = theme;
  write();
}

export function exportProgress() {
  return JSON.stringify({ format: EXPORT_FORMAT, version: 1, exportedAt: new Date().toISOString(), data: state }, null, 2);
}

const isDateKey = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
const isIso = (value) => typeof value === 'string' && !Number.isNaN(Date.parse(value));

export function importProgress(text, validGameIds) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('To nie jest poprawny plik JSON.');
  }
  if (parsed?.format !== EXPORT_FORMAT || typeof parsed.data !== 'object' || !parsed.data) {
    throw new Error('Ten plik nie pochodzi z eksportu Cyberstart.');
  }
  const source = parsed.data;
  const next = { ...emptyState(), theme: state.theme };

  for (const id of validGameIds) {
    const entry = source.results?.[id];
    if (!entry) continue;
    const { score, max, xp, date } = entry;
    if ([score, max, xp].every(Number.isFinite) && max > 0 && xp >= 0 && xp <= 100 && isIso(date)) {
      next.results[id] = { score, max, xp: Math.round(xp), date };
    }
  }
  for (const [term, card] of Object.entries(source.cards ?? {})) {
    if (typeof term === 'string' && term.length < 80 && Number.isInteger(card?.box) && card.box >= 0 && card.box < CARD_INTERVALS.length && isDateKey(card.due)) {
      next.cards[term] = { box: card.box, due: card.due };
    }
  }
  const streak = source.streak;
  if (streak && (streak.last === null || isDateKey(streak.last)) && Number.isInteger(streak.count) && streak.count >= 0) {
    next.streak = { last: streak.last, count: streak.count, best: Number.isInteger(streak.best) ? streak.best : streak.count };
  }
  for (const [id, date] of Object.entries(source.badges ?? {})) {
    if (/^[a-z0-9-]{1,40}$/.test(id) && isIso(date)) next.badges[id] = date;
  }
  if (source.difficulty === 'zaawansowany') next.difficulty = 'zaawansowany';

  state = next;
  write();
  return Object.keys(next.results).length;
}
