import { h, button, runQuiz, rich } from '../ui.js';
import { icon } from '../icons.js';

const STEPS = [
  { title: 'Sprawdź procesor Maca', text: 'Menu Apple, „Ten Mac”. Procesor M1, M2, M3 lub nowszy to Apple Silicon (architektura ARM64). Procesor Intel to AMD64. Od tego zależy, który obraz Kali pobierzesz.' },
  { title: 'Zainstaluj UTM', text: 'UTM to darmowy program do maszyn wirtualnych na Maca. Pobierz go z oficjalnej strony projektu (wersja z App Store jest płatna i działa tak samo). Na Windows zamiast UTM użyj VirtualBox lub VMware Workstation.' },
  { title: 'Pobierz obraz Kali z kali.org', text: 'Tylko z oficjalnej strony kali.org (sekcja Get Kali). Na Apple Silicon wybierz instalator dla ARM64. Kali ma też w dokumentacji osobny poradnik instalacji w UTM.' },
  { title: 'Zweryfikuj sumę SHA-256', text: 'W Terminalu Maca: <code>shasum -a 256 nazwa-pliku.iso</code>. Wynik musi być identyczny ze skrótem opublikowanym na kali.org. Inny skrót oznacza uszkodzony albo podmieniony plik.' },
  { title: 'Utwórz maszynę wirtualną', text: 'W UTM: nowa maszyna, wirtualizacja, Linux, wskaż pobrany obraz ISO. Rozsądne minimum: 4 GB RAM, 2 rdzenie procesora, dysk 40 GB lub większy.' },
  { title: 'Zainstaluj system', text: 'Wybierz instalację graficzną, ustaw własną nazwę użytkownika i mocne hasło. Domyślne środowisko i zestaw narzędzi wystarczą na start.' },
  { title: 'Odłącz obraz ISO i uruchom ponownie', text: 'Po instalacji usuń obraz z wirtualnego napędu CD w ustawieniach maszyny, inaczej instalator uruchomi się znowu.' },
  { title: 'Zaktualizuj system', text: 'W terminalu Kali: <code>sudo apt update && sudo apt full-upgrade -y</code>. Kali jest dystrybucją „rolling”, więc aktualizacje przychodzą często.' },
  { title: 'Zrób kopię „czystej” maszyny', text: 'Sklonuj gotową maszynę w UTM (albo zrób migawkę w VirtualBox lub VMware). Gdy coś zepsujesz, wrócisz do działającego stanu w minutę.' },
  { title: 'Ustaw sieć z głową', text: 'Na start wystarczy sieć współdzielona (NAT). Celowo podatne maszyny do ćwiczeń trzymaj w sieci izolowanej (host only), żeby nie były widoczne w Twojej sieci domowej.' }
];

const QUESTIONS = [
  {
    prompt: 'Dlaczego Kali instaluje się w maszynie wirtualnej, a nie jako główny system?',
    options: [
      { label: 'Łatwo ją odtworzyć po awarii, a eksperymenty nie dotykają Twoich prywatnych danych', correct: true, why: 'Kali to narzędzie do testów, a nie system do codziennej pracy. Maszyna wirtualna to bezpieczna piaskownica.' },
      { label: 'Bo Kali nie da się zainstalować na zwykłym komputerze', why: 'Da się, ale do nauki i testów maszyna wirtualna jest dużo wygodniejsza i bezpieczniejsza.' },
      { label: 'Bo w maszynie wirtualnej narzędzia działają szybciej', why: 'Zwykle jest odwrotnie. Chodzi o izolację i łatwe odtwarzanie.' }
    ]
  },
  {
    prompt: 'Po co sprawdzać sumę SHA-256 pobranego obrazu?',
    options: [
      { label: 'Żeby mieć pewność, że plik nie jest uszkodzony ani podmieniony', correct: true, why: 'Podmieniony obraz systemu dla specjalistów od bezpieczeństwa byłby idealnym koniem trojańskim.' },
      { label: 'Żeby przyspieszyć instalację', why: 'Skrót nie wpływa na szybkość. Potwierdza integralność pliku.' }
    ]
  },
  {
    prompt: 'Masz MacBooka z procesorem M3. Który obraz Kali wybierasz?',
    options: [
      { label: 'Wersję dla ARM64 (Apple Silicon)', correct: true, why: 'Procesory M1 do M4 to architektura ARM64. Obraz AMD64 nie uruchomi się w zwykłej wirtualizacji.' },
      { label: 'Wersję AMD64 (Intel)', why: 'AMD64 jest dla procesorów Intel i AMD. M3 to ARM64.' }
    ]
  },
  {
    prompt: 'Uruchamiasz celowo podatną maszynę do ćwiczeń (np. Metasploitable). Jaką sieć jej ustawić?',
    options: [
      { label: 'Izolowaną (host only), widoczną tylko dla Twojej maszyny z Kali', correct: true, why: 'Celowo dziurawy system w sieci domowej albo w internecie to zaproszenie dla prawdziwych intruzów.' },
      { label: 'Mostkowaną, żeby była widoczna w całej sieci domowej', why: 'Wtedy widzą ją wszystkie urządzenia w domu, a przy złej konfiguracji routera nawet internet.' }
    ]
  },
  {
    prompt: 'Jakie polecenie wykonasz zaraz po instalacji Kali?',
    options: [
      { label: '<code>sudo apt update && sudo apt full-upgrade -y</code>', correct: true, why: 'Najpierw odśwież listę pakietów, potem zainstaluj wszystkie aktualizacje.' },
      { label: '<code>sudo rm -rf /</code>', why: 'To polecenie próbowałoby usunąć cały system. Nigdy go nie uruchamiaj.' },
      { label: 'Nic, system jest od razu aktualny', why: 'Obraz instalacyjny powstał jakiś czas temu. Aktualizacje są zawsze pierwszym krokiem.' }
    ]
  }
];

export default {
  id: 'instalacja',
  title: 'Kali w maszynie wirtualnej',
  category: 'linux',
  icon: 'settings',
  minutes: 8,
  summary: 'Przewodnik krok po kroku: Kali Linux w UTM na Macu (albo VirtualBox na Windows). Odhaczasz kroki, a na koniec sprawdzasz wiedzę w pięciu pytaniach.',
  lesson: [
    'Do tej pory ćwiczenia odbywały się w symulatorze. Kolejny krok to prawdziwe Kali w <strong>maszynie wirtualnej</strong>, czyli komputerze udawanym przez program na Twoim komputerze.',
    'Maszyna wirtualna ma własny dysk, pamięć i sieć. Jeśli coś zepsujesz, przywracasz kopię. Twoje prywatne pliki zostają nietknięte.',
    'Lista poniżej to przewodnik. Odhaczaj kroki, gdy je wykonasz. Nie musisz robić tego teraz: pytania na końcu sprawdzają zrozumienie, a nie samą instalację.'
  ],
  takeaways: [
    'Kali tylko z kali.org, a pobrany obraz zawsze weryfikujesz sumą SHA-256.',
    'Mac z procesorem M to ARM64, Intel to AMD64. Na Macu używasz UTM, na Windows VirtualBox lub VMware.',
    'Po instalacji: aktualizacja (<code>apt update</code> i <code>full-upgrade</code>), potem kopia czystej maszyny.',
    'Podatne maszyny ćwiczeniowe trzymasz w sieci izolowanej.',
    'Gotowe? Zacznij od OverTheWire Bandit albo darmowych pokoi TryHackMe, łącząc się z Kali.'
  ],
  async mount(stage, ctx) {
    const total = STEPS.length + QUESTIONS.length;
    const done = new Set();
    const list = h('ol', { class: 'guide-steps' });
    STEPS.forEach((step, i) => {
      const id = `step-${i}`;
      const input = h('input', {
        type: 'checkbox',
        id,
        onchange: () => {
          if (input.checked) done.add(i);
          else done.delete(i);
          item.classList.toggle('is-done', input.checked);
          ctx.progress(done.size, total);
        }
      });
      const item = h('li', { class: 'guide-step' }, h('label', { for: id, class: 'guide-check' }, input, h('span', { class: 'guide-title', text: step.title })), rich(step.text, 'p'));
      list.append(item);
    });
    const next = button({ label: 'Przejdź do pytań', variant: 'primary', iconAfter: 'arrowRight', 'data-autoplay': '' });
    const panel = h(
      'section',
      { class: 'panel' },
      h('div', { class: 'panel-title' }, icon('settings'), h('h2', { class: 't-h4', text: 'Instalacja krok po kroku' })),
      list,
      h('p', { class: 'hint', text: 'Odhaczanie nie wpływa na wynik. To Twoja lista kontrolna.' }),
      h('div', { class: 'btn-row' }, next)
    );
    stage.append(panel);
    ctx.progress(0, total);
    await new Promise((resolve) => next.addEventListener('click', resolve, { once: true }));
    panel.remove();
    const score = await runQuiz(stage, ctx, QUESTIONS, { label: 'Pytanie', offset: STEPS.length, total });
    ctx.finish({ score, max: QUESTIONS.length });
  }
};

export function examPool() {
  return QUESTIONS;
}
