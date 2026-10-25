import { h, button, feedback, runQuiz, shuffle, plural } from '../ui.js';
import { getMistakes, getResult, mistakeKey } from '../progress.js';
import { icon } from '../icons.js';
import { topicQuestions } from './egzamin.js';

const SESSION_SIZE = 10;

function pendingQuestions() {
  const mistakes = getMistakes();
  const seen = new Set();
  return topicQuestions().filter((question) => {
    const key = mistakeKey(question.topicId, question.prompt);
    if (!mistakes[key] || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildSession() {
  const pending = shuffle(pendingQuestions()).slice(0, SESSION_SIZE);
  const taken = new Set(pending.map((question) => question.prompt));
  const basic = topicQuestions().filter((question) => question.level !== 'zaawansowany' && !taken.has(question.prompt));
  const played = basic.filter((question) => getResult(question.topicId));
  const fromPlayed = played.length >= SESSION_SIZE;
  const fillers = shuffle(fromPlayed ? played : basic);
  return { pending: pending.length, fromPlayed, questions: [...pending, ...fillers].slice(0, SESSION_SIZE) };
}

export default {
  id: 'powtorka',
  title: 'Powtórka błędów',
  category: 'wiedza',
  icon: 'rotate',
  minutes: 5,
  summary: 'Pytania, na których wcześniej padła zła odpowiedź, a do kompletu losowe pytania z kursu. Dobra odpowiedź zdejmuje pytanie z listy.',
  badge() {
    const count = pendingQuestions().length;
    return count ? `${count} do powtórki` : null;
  },
  lesson: [
    'Każda zła odpowiedź w quizie i na egzaminie trafia na listę do powtórki. Tutaj wracasz do tych pytań, aż odpowiesz dobrze.',
    'Powrót do pytania po kilku godzinach albo dniach utrwala wiedzę dużo lepiej niż czytanie notatek. To tak zwane aktywne przypominanie.',
    `Sesja ma ${SESSION_SIZE} pytań. Jeśli błędów jest mniej, resztę dopełniają losowe pytania z ukończonych gier, a na początku nauki z całego kursu.`
  ],
  takeaways: [
    'Błąd to informacja, czego jeszcze się nauczyć. Wracaj tu co kilka dni, aż lista będzie pusta.',
    'Jeśli to samo pytanie wraca kilka razy, zagraj jeszcze raz w grę, z której pochodzi.',
    'Fiszki w słowniku utrwalą pojęcia, a egzamin sprawdzi wszystko naraz.'
  ],
  async mount(stage, ctx) {
    const { pending, fromPlayed, questions } = buildSession();
    const fillSource = fromPlayed ? 'z gier, które masz już za sobą' : 'z całego kursu';
    const start = button({ label: 'Zacznij powtórkę', variant: 'primary', iconName: 'play' });
    const note = pending
      ? feedback('info', `Do powtórki: ${pending} ${plural(pending, 'pytanie', 'pytania', 'pytań')}`, pending < questions.length ? `Najpierw pojawią się pytania z błędami, a resztę sesji dopełnią losowe pytania ${fillSource}.` : 'Cała sesja to pytania, na których wcześniej padła zła odpowiedź.')
      : feedback('ok', 'Brak zaległych błędów', `Dostaniesz losowe pytania ${fillSource}. Każda zła odpowiedź trafi na listę do następnej powtórki.`);
    const intro = h(
      'section',
      { class: 'panel' },
      h('div', { class: 'panel-title' }, icon('rotate'), h('h2', { class: 't-h4', text: 'Gotowe do powtórki' })),
      note,
      h('div', { class: 'btn-row' }, start)
    );
    stage.append(intro);
    ctx.progress(0, questions.length);
    await new Promise((resolve) => start.addEventListener('click', resolve, { once: true }));
    intro.remove();

    const score = await runQuiz(stage, ctx, questions, { label: 'Pytanie' });
    const left = pendingQuestions().length;
    const verdict = left
      ? feedback('warn', `Na liście zostało: ${left} ${plural(left, 'pytanie', 'pytania', 'pytań')}`, 'Wróć tu za kilka godzin albo jutro. Przerwa między powtórkami pomaga zapamiętać na dłużej.')
      : feedback('ok', 'Lista błędów jest pusta', 'Wszystkie pytania z błędami mają już dobrą odpowiedź.');
    const finishButton = button({ label: 'Zobacz podsumowanie', variant: 'primary', iconAfter: 'arrowRight', onclick: () => ctx.finish({ score, max: questions.length }) });
    stage.append(h('section', { class: 'panel status-stack' }, verdict, h('div', { class: 'btn-row' }, finishButton)));
  }
};
