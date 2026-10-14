import { expect } from '@playwright/test';

export const PERMISSION_ANSWERS = {
  'backup.sh': '700',
  'index.html': '644',
  id_ed25519: '600',
  'publiczne/': '755',
  'raport_zespolu.docx': '660',
  'db.conf': '400'
};

export const CTF_FLAGS = [
  'FLAGA{myslnik_to_nie_opcja}',
  'FLAGA{spacje_w_cudzyslowie}',
  'FLAGA{ukryte_katalogi}',
  'FLAGA{file_rozpoznaje_typ}',
  'FLAGA{find_znajdzie_wszystko}',
  'FLAGA{grep_w_stogu_siana}',
  'FLAGA{sort_i_uniq_razem}',
  'FLAGA{base64_to_nie_szyfr}',
  'FLAGA{tail_patrzy_na_koniec}',
  'FLAGA{chmod_otwiera_drzwi}',
  'FLAGA{40}',
  'FLAGA{kochanie}'
];

export const TERMINAL_COMMANDS = ['whoami', 'pwd', 'ls', 'cd dok', 'cat raport.txt', 'cd ..', 'ls -a', 'cat .ukryty_klucz', 'ls -la', 'mkdir lab', 'ip a', 'grep Failed /var/log/auth.log'];

export async function gameIds(page) {
  await page.goto('/');
  return page.evaluate(async () => (await import('/js/games/index.js')).GAMES.map((game) => game.id));
}

export function trackErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

export async function resetStorage(page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
}

export async function playGame(page, id, extra = {}) {
  if (!extra.resume) {
    await page.goto(`/#/gra/${id}`);
    await expect(page.locator('#game-stage')).toBeVisible();
  }
  const outcome = await page.evaluate(autoplay, { id, permissions: PERMISSION_ANSWERS, terminal: TERMINAL_COMMANDS, ctfFlags: CTF_FLAGS, ...extra });
  return outcome;
}

async function autoplay({ id, permissions, terminal, ctfFlags, stopAfter = Infinity }) {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const visible = (el) => el && !el.disabled && el.getClientRects().length > 0;
  const all = (selector) => [...document.querySelectorAll(selector)].filter(visible);
  const first = (selector) => all(selector)[0];
  const withText = (selector, pattern) => all(selector).find((el) => pattern.test(el.textContent));
  const fire = (el, type, init = {}) => el.dispatchEvent(new KeyboardEvent(type, { bubbles: true, ...init }));
  const typeCommand = (input, command) => {
    input.value = command;
    if (command.endsWith('dok')) fire(input, 'keydown', { key: 'Tab' });
    fire(input, 'keydown', { key: 'Enter' });
  };
  const setValue = (input, value) => {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  };
  const flags = new Set();

  async function special() {
    const termInput = document.getElementById('term-input');
    if (termInput && !flags.has('terminal') && id === 'terminal') {
      flags.add('terminal');
      terminal.forEach((command) => typeCommand(termInput, command));
      return true;
    }
    const flagInput = document.getElementById('ctf-flag');
    if (flagInput && !flagInput.disabled) {
      flagInput.value = ctfFlags[Number(flagInput.dataset.level) - 1];
      withText('.stage .btn-primary', /Zgłoś flagę/).click();
      return true;
    }
    const permTitle = document.querySelector('.perm-grid') && document.querySelector('.panel h2.mono')?.textContent;
    const permCheck = withText('.stage .btn-primary', /^Sprawdź$/);
    if (permTitle && permCheck) {
      const target = permissions[permTitle];
      document.querySelectorAll('.perm-col').forEach((col, ci) => {
        const digit = Number(target[ci]);
        col.querySelectorAll('input').forEach((input, bi) => {
          if (input.checked !== Boolean(digit & [4, 2, 1][bi])) input.click();
        });
      });
      permCheck.click();
      return true;
    }
    const tools = all('.match-tool');
    if (tools.length) {
      for (const tool of tools) {
        for (const purpose of all('.match-purpose')) {
          tool.click();
          purpose.click();
          if (tool.disabled) break;
        }
      }
      return true;
    }
    const chips = all('.osi-pool .chip');
    if (chips.length) {
      for (const chip of chips) {
        for (const layer of all('.osi-layer')) {
          chip.click();
          layer.click();
          if (!chip.isConnected) break;
        }
      }
      return true;
    }
    const orderCheck = withText('.stage .btn-primary', /Sprawdź kolejność/);
    if (orderCheck) {
      orderCheck.click();
      await sleep(5);
      let items = [...document.querySelectorAll('.order-item')];
      if (items.every((item) => item.classList.contains('is-correct'))) return true;
      const position = items.findIndex((item) => !item.classList.contains('is-correct'));
      for (let k = items.length - 1; k > position; k -= 1) {
        items = [...document.querySelectorAll('.order-item')];
        items[k].querySelectorAll('.order-move')[0].click();
      }
      return true;
    }
    const pw = document.getElementById('pw-input');
    if (pw && !flags.has('pw')) {
      flags.add('pw');
      ['P@ssw0rd', 'Zx9!kd-Qr7#mPw2$Lz8&', 'kot-rower-lampa-ocean-szafa'].forEach((value) => setValue(pw, value));
      return true;
    }
    const caesar = document.getElementById('caesar-shift');
    if (caesar && !caesar.disabled && caesar.value !== '3') {
      setValue(caesar, '3');
      return true;
    }
    const card = document.querySelector('.flashcard');
    if (card) {
      if (!card.classList.contains('is-flipped')) card.click();
      else first('.deck-actions .btn-primary')?.click();
      return true;
    }
    const audit = withText('.router-actions .btn', /Uruchom audyt/);
    if (audit && !flags.has('audit')) {
      flags.add('audit');
      audit.click();
      return true;
    }
    const reveal = withText('.stage .btn', /Pokaż rozwiązanie/);
    if (reveal) {
      reveal.click();
      return true;
    }
    const decision = first('.fw-allow') || first('.fw-deny');
    if (decision) {
      decision.click();
      return true;
    }
    const classify = document.querySelector('.ip-big') && withText('.stage .btn-secondary', /Prywatny/);
    if (classify) {
      classify.click();
      return true;
    }
    return false;
  }

  for (let step = 0; step < 1500; step += 1) {
    if (step >= stopAfter) return { done: false, paused: true };
    if (document.querySelector('.result')) {
      return { done: true, score: document.querySelector('.result-score p')?.textContent ?? '' };
    }
    if (await special()) {
      await sleep(5);
      continue;
    }
    const next =
      first('.stage .choice') ||
      withText('.stage .btn', /^(Zakończ mimo to|Odkoduj Base64|Nie, to nie bank|Zakończ konfigurację)/) ||
      first('.stage .url-token') ||
      first('.stage [data-autoplay]') ||
      all('.stage .btn-primary').slice(-1)[0];
    if (!next) {
      return { done: false, step, text: document.querySelector('.stage')?.innerText.slice(0, 300) };
    }
    next.click();
    await sleep(5);
  }
  return { done: false, step: 'limit', text: document.querySelector('.stage')?.innerText.slice(0, 300) };
}
