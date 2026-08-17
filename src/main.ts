import "./styles.css";

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  root.querySelector(sel) as T | null;
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll(sel)) as T[];

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ───────────────────────── 1. Theme switcher ───────────────────────── */
const THEMES = ["tangerine", "nocturne", "bubblegum", "greenscreen"] as const;
type Theme = (typeof THEMES)[number];

const recolorBtn = $<HTMLButtonElement>("#recolor");
const recolorLabel = $("#recolorLabel");

function setTheme(t: Theme) {
  document.documentElement.dataset.theme = t;
  if (recolorLabel) recolorLabel.textContent = t;
  recolorBtn?.setAttribute("aria-label", `Recolour the site — currently ${t}`);
  const meta = document.querySelector('meta[name="theme-color"]');
  const bg = getComputedStyle(document.documentElement).getPropertyValue("--paper").trim();
  if (meta && bg) meta.setAttribute("content", bg);
  try {
    localStorage.setItem("hackify:theme", t);
  } catch { /* private mode; not important */ }
}

try {
  const saved = localStorage.getItem("hackify:theme") as Theme | null;
  if (saved && (THEMES as readonly string[]).includes(saved)) setTheme(saved);
} catch { /* noop */ }

recolorBtn?.addEventListener("click", () => {
  const cur = (document.documentElement.dataset.theme ?? "tangerine") as Theme;
  const next = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
  setTheme(next);
  if (!reduced) {
    recolorBtn.animate(
      [{ transform: "rotate(0) scale(1)" }, { transform: "rotate(-9deg) scale(1.14)" }, { transform: "none" }],
      { duration: 380, easing: "cubic-bezier(.34,1.56,.64,1)" },
    );
  }
});

/* ───────────────────────── 2. Hero mock-up theme preview ───────────────────────── */
const SKINS: Record<string, { name: string; title: string }> = {
  papercut:    { name: "papercut",     title: "Spotify — patched by you" },
  nocturne:    { name: "nocturne",     title: "Spotify — 2:14 AM build" },
  bubblegum:   { name: "bubblegum",    title: "Spotify — every corner is round now" },
  greenscreen: { name: "green_screen", title: "SPOTIFY.EXE — 80x24" },
};

const skin = $("#skin");
const skinName = $("#skinName");
const skinTitle = $("#skinTitle");
const skinBtns = $$<HTMLButtonElement>("[data-skin-btn]");

function applySkin(key: string) {
  const cfg = SKINS[key];
  if (!skin || !cfg) return;
  skin.dataset.skin = key;
  if (skinName) skinName.textContent = cfg.name;
  if (skinTitle) skinTitle.textContent = cfg.title;
  skinBtns.forEach((b) => b.classList.toggle("is-on", b.dataset.skinBtn === key));
  if (!reduced) {
    skin.animate(
      [{ transform: "rotate(-1.2deg) scale(.985)" }, { transform: "rotate(-1.2deg) scale(1)" }],
      { duration: 320, easing: "cubic-bezier(.34,1.56,.64,1)" },
    );
  }
}
skinBtns.forEach((b) => b.addEventListener("click", () => applySkin(b.dataset.skinBtn!)));

// idle cycle through skins until the visitor takes over
let skinTimer: number | undefined;
if (!reduced) {
  let i = 0;
  skinTimer = window.setInterval(() => {
    i = (i + 1) % THEMES.length;
    applySkin(Object.keys(SKINS)[i]);
  }, 4200);
  skinBtns.forEach((b) =>
    b.addEventListener("click", () => {
      if (skinTimer) { clearInterval(skinTimer); skinTimer = undefined; }
    }, { once: true }),
  );
}

/* ───────────────────────── 3. The Exchange ───────────────────────── */
const hoursInput = $<HTMLInputElement>("#hours");
const outHours = $("#outHours");
const outMonths = $("#outMonths");
const stack = $("#stack");
const stackNote = $("#stackNote");
const sliderFill = $("#sliderFill");
const sliderTicks = $("#sliderTicks");

const MAX_H = 24;

if (sliderTicks) {
  sliderTicks.innerHTML = Array.from({ length: MAX_H / 2 }, () => "<i></i>").join("");
}

const NOTES: Record<number, string> = {
  0:  "zero hours. zero months. the maths is unforgiving.",
  2:  "one month. that's a single evening of CSS.",
  4:  "two months. a weekend, basically.",
  6:  "three months. a whole season of listening.",
  8:  "four months. you've built something real by now.",
  10: "five months. your theme has users. plural.",
  12: "six months. half a year, from one project.",
  14: "seven months.",
  16: "eight months. genuinely, how good is this extension?",
  18: "nine months.",
  20: "ten months. you have a portfolio piece and a soundtrack.",
  22: "eleven months.",
  24: "twelve months — and 24h isn't the ceiling. it just ran out of room on the page.",
};

const pad2 = (n: number) => String(n).padStart(2, "0");

function bump(el: Element | null) {
  if (!el || reduced) return;
  el.classList.remove("is-bump");
  void (el as HTMLElement).offsetWidth;
  el.classList.add("is-bump");
}

let lastMonths = -1;

function renderExchange(hours: number) {
  const months = Math.floor(hours / 2);
  if (outHours) outHours.textContent = pad2(hours);
  if (outMonths) outMonths.textContent = pad2(months);
  if (sliderFill) sliderFill.style.width = `${(hours / MAX_H) * 100}%`;

  if (months !== lastMonths) {
    bump(outMonths);
    bump(outHours);
    lastMonths = months;
  }

  if (stack) {
    const existing = stack.children.length;
    if (months > existing) {
      for (let i = existing; i < months; i++) {
        const el = document.createElement("div");
        el.className = "mo";
        // Grow in height as the stack builds — visual accumulation.
        el.style.height = `${58 + i * 5.6}px`;
        el.style.animationDelay = reduced ? "0ms" : `${(i - existing) * 45}ms`;
        el.innerHTML =
          `<span class="mo__notch"></span>` +
          `<span class="mo__n">${i + 1}</span>` +
          `<span class="mo__lbl">mo</span>`;
        stack.appendChild(el);
      }
    } else if (months < existing) {
      for (let i = existing; i > months; i--) stack.lastElementChild?.remove();
    }
  }

  if (stackNote) {
    const cls = hours >= 24 ? "scrawl scrawl--light" : "scrawl scrawl--light";
    stackNote.innerHTML = `<span class="${cls}">${NOTES[hours] ?? `${months} months.`}</span>`;
  }
}

hoursInput?.addEventListener("input", () => renderExchange(Number(hoursInput.value)));
renderExchange(hoursInput ? Number(hoursInput.value) : 6);

/* ───────────────────────── 4. Idea jukebox ───────────────────────── */
type Idea = { t: string; k: string };
const IDEAS: Idea[] = [
  { t: "A monochrome theme where the entire interface is one shade of whatever album you're playing.", k: "theme" },
  { t: "Make Spotify look like an old iPod, complete with click-wheel navigation.", k: "theme" },
  { t: "A Y2K theme with chrome, tiny text, obnoxious gradients, and way too many buttons.", k: "theme" },
  { t: "Turn Spotify into a medieval manuscript with illuminated album covers.", k: "theme" },
  { t: "A paper theme where every playlist looks like a page torn from a notebook.", k: "theme" },
  { t: "Make Spotify look like a Windows XP desktop. The Start menu plays music.", k: "theme" },
  { t: "A brutalist theme with giant type, zero rounded corners, and absolutely no mercy.", k: "theme" },
  { t: "A theme that turns your current album into the entire visual identity of Spotify.", k: "theme" },
  { t: "Make the player look like a physical cassette deck with buttons you actually want to press.", k: "theme" },
  { t: "A newspaper classified-ads theme where playlists look like tiny advertisements.", k: "theme" },
  { t: "A theme inspired entirely by airport departure boards.", k: "theme" },
  { t: "Turn Spotify into a late-2000s forum. Every playlist gets an avatar and signature.", k: "theme" },
  { t: "A theme where album covers are displayed as physical records on shelves.", k: "theme" },
  { t: "Make the entire UI look like a Nintendo DS menu.", k: "theme" },
  { t: "A theme that replaces every icon with tiny hand-drawn doodles.", k: "theme" },
  { t: "A dark theme where the only bright thing on screen is the currently playing track.", k: "theme" },
  { t: "Make Spotify look like a scientific instrument from a spaceship.", k: "theme" },
  { t: "A theme that makes every playlist look like a different physical mixtape.", k: "theme" },
  { t: "Turn the library into a giant filing cabinet of records.", k: "theme" },
  { t: "A theme inspired by old Japanese train station signage.", k: "theme" },
  { t: "Automatically pause music when your Discord status changes to Do Not Disturb.", k: "extension" },
  { t: "Detect duplicate songs in your playlists and highlight them before they multiply.", k: "extension" },
  { t: "Add a 'play something I haven't heard in 6 months' button.", k: "extension" },
  { t: "Automatically lower the volume when you're listening at 3 AM.", k: "extension" },
  { t: "A skip counter that tells you which artist you apparently hate.", k: "extension" },
  { t: "Warn you before playing a song you've already heard five times today.", k: "extension" },
  { t: "Add a one-click 'put this song in every relevant playlist' button.", k: "extension" },
  { t: "Automatically create a playlist containing everything you listened to today.", k: "extension" },
  { t: "A 'never play this album again' button that actually means it.", k: "extension" },
  { t: "Detect explicit songs and replace them with clean versions when available.", k: "extension" },
  { t: "Add a sleep timer that slowly fades the interface along with the music.", k: "extension" },
  { t: "Show exactly how many times you've played the current artist this month.", k: "extension" },
  { t: "Automatically queue the shortest songs in your library when you only have 10 minutes.", k: "extension" },
  { t: "Add a button that plays the most obscure song in your library.", k: "extension" },
  { t: "Prevent shuffle from playing anything you've heard in the last 24 hours.", k: "extension" },
  { t: "Highlight songs in playlists that you haven't actually listened to yet.", k: "extension" },
  { t: "A 'one more song' mode that always queues exactly three more.", k: "extension" },
  { t: "Show the percentage of a playlist you've actually listened to.", k: "extension" },
  { t: "Automatically save every song you listen to for more than 30 seconds.", k: "extension" },
  { t: "Add a 'surprise me' button that picks a completely random artist from your library.", k: "extension" },
  { t: "A map of your music taste where artists are cities and genres are countries.", k: "custom app" },
  { t: "A calendar showing the soundtrack of every day you've listened to Spotify.", k: "custom app" },
  { t: "Turn your listening history into a giant visual timeline.", k: "custom app" },
  { t: "A page that ranks your most abandoned playlists.", k: "custom app" },
  { t: "Generate a personality report based entirely on your most-played songs.", k: "custom app" },
  { t: "A personal music museum where every room represents a different era of your listening.", k: "custom app" },
  { t: "Show your music taste as a family tree connecting artists who influenced each other.", k: "custom app" },
  { t: "A dashboard showing which songs are responsible for your total listening time.", k: "custom app" },
  { t: "Turn your top artists into a fantasy football-style league and track their standings.", k: "custom app" },
  { t: "A visual 'music DNA' profile generated from your library.", k: "custom app" },
  { t: "Show the exact moment in your listening history when you discovered every favorite artist.", k: "custom app" },
  { t: "Build a jukebox interface that lets you browse your entire library like a physical machine.", k: "custom app" },
  { t: "A 'music weather report' describing your listening habits today.", k: "custom app" },
  { t: "Generate a fake newspaper every week containing your listening statistics.", k: "custom app" },
  { t: "A constellation where every star is an artist and brighter stars mean more listening.", k: "custom app" },
  { t: "Show which artists dominate each hour of your typical day.", k: "custom app" },
  { t: "A time machine that lets you browse what your music taste looked like one year ago.", k: "custom app" },
  { t: "Turn your playlists into subway maps where transitions between songs are train lines.", k: "custom app" },
  { t: "A leaderboard of the songs you thought you'd hate but ended up replaying.", k: "custom app" },
  { t: "Generate a receipt showing exactly what your music taste 'cost' you in listening hours.", k: "custom app" },
  { t: "Put a tiny pixel-art equalizer next to the currently playing song.", k: "snippet" },
  { t: "Make the progress bar look like a vinyl record spinning toward the end.", k: "snippet" },
  { t: "Replace the volume slider with a tiny physical-looking knob.", k: "snippet" },
  { t: "Add a tiny badge showing how long you've been listening without stopping.", k: "snippet" },
  { t: "Make the album artwork bounce one pixel every time the beat hits.", k: "snippet" },
  { t: "Add a tiny 'currently obsessed' label to songs you've replayed recently.", k: "snippet" },
  { t: "Make the play button wobble slightly while music is playing.", k: "snippet" },
  { t: "Turn the seek bar into a tiny waveform.", k: "snippet" },
  { t: "Add a tiny spinning vinyl record beside every album.", k: "snippet" },
  { t: "Show a microscopic counter for how many seconds remain in the song.", k: "snippet" },
  { t: "Every time you skip a song, the entire UI moves one pixel to the left.", k: "chaos" },
  { t: "Replace your playlist names with increasingly unhinged descriptions of their contents.", k: "chaos" },
  { t: "A theme where every button is labeled with what it actually does. 'MAKE MUSIC LOUDER'.", k: "chaos" },
  { t: "Make the entire interface slowly rotate one degree every hour you listen.", k: "chaos" },
  { t: "Every time you replay a song, its album cover gets physically larger.", k: "chaos" },
  { t: "Give every song a completely unnecessary difficulty rating.", k: "chaos" },
  { t: "Replace your queue with a literal conveyor belt of album covers.", k: "chaos" },
  { t: "A theme where the UI gets progressively more cluttered the longer you listen.", k: "chaos" },
  { t: "Make Spotify look like a government website from 2004.", k: "chaos" },
  { t: "Every playlist gets assigned a completely arbitrary threat level.", k: "chaos" },
  { t: "Add a button that randomly rearranges the entire Spotify interface.", k: "chaos" },
  { t: "Make every song skip require you to confirm that you really didn't like it.", k: "chaos" },
  { t: "A theme where every album cover has googly eyes.", k: "chaos" },
  { t: "Turn the queue into a physical stack and make it collapse when you add too many songs.", k: "chaos" },
  { t: "Make the currently playing song announce itself like a wrestling entrance.", k: "chaos" },
  { t: "Replace your Spotify home page with a giant spinning wheel of everything you've ever listened to.", k: "chaos" },
  { t: "Give every artist a completely unnecessary stock-photo-style biography.", k: "chaos" },
  { t: "A button labeled 'DO NOT PRESS' that changes your entire theme when pressed.", k: "chaos" },
  { t: "A theme that slowly loses saturation the longer you stay on one album.", k: "theme" },
  { t: "Auto-skip anything shorter than 90 seconds. Interludes are a scam.", k: "extension" },
  { t: "Rebuild the whole player as a 1998 Winamp skin, bevels and all.", k: "theme" },
  { t: "A custom page that maps your library as a constellation you can pan around.", k: "custom app" },
  { t: "A button that permanently bans one specific song from your life.", k: "extension" },
  { t: "Album art that ripples in time with the seek bar.", k: "snippet" },
  { t: "A sidebar pet that gets happier the more new artists you play.", k: "custom app" },
  { t: "Make every UI corner sharper by one pixel per hour of listening.", k: "chaos" },
  { t: "A theme built entirely from the colours of the current album cover.", k: "theme" },
  { t: "Log every song you skip in the first 5 seconds and show your shame monthly.", k: "custom app" },
  { t: "Lyrics that fall from the top of the screen like Tetris blocks.", k: "chaos" },
  { t: "Keyboard shortcuts for queueing that don't require the mouse. Ever.", k: "extension" },
  { t: "A newspaper theme: serif headlines, columns, and a tiny weather box.", k: "theme" },
  { t: "Detect when you've replayed a track 3× and auto-save it to a 'lock in' playlist.", k: "extension" },
  { t: "A VU meter in the player bar that responds to nothing and looks amazing.", k: "snippet" },
  { t: "Turn the queue into a draggable stack of physical cassette tapes.", k: "custom app" },
  { t: "A theme that only reveals the UI when you hover. Otherwise: void.", k: "theme" },
  { t: "Shuffle, but it genuinely refuses to play the same artist twice in a row.", k: "extension" },
  { t: "Render the whole client in ASCII. Yes, including album art.", k: "chaos" },
  { t: "A CRT theme with scanlines, phosphor glow, and a slight screen curve.", k: "theme" },
  { t: "Show BPM and key next to every track, because you're a DJ now.", k: "extension" },
  { t: "A page that shows what you were listening to on this day, every year.", k: "custom app" },
  { t: "Replace the play button with a photo of your cat. Ship it.", k: "snippet" },
  { t: "A theme that shifts palette with the actual time of day.", k: "theme" },
];

const jukeIdea = $("#jukeIdea");
const jukeType = $("#jukeType");
const jukeNum = $("#jukeNum");
const jukeBtn = $<HTMLButtonElement>("#jukeBtn");
const juke = $(".juke");

let jukeIdx = 0;
let rolling = false;

function showIdea(i: number) {
  const idea = IDEAS[i];
  if (jukeIdea) jukeIdea.textContent = idea.t;
  if (jukeType) jukeType.textContent = idea.k;
  if (jukeNum) jukeNum.textContent = String(i + 1).padStart(3, "0");
}

function rollIdea() {
  if (rolling) return;
  let next = jukeIdx;
  while (next === jukeIdx && IDEAS.length > 1) next = Math.floor(Math.random() * IDEAS.length);

  if (reduced) { jukeIdx = next; showIdea(next); return; }

  rolling = true;
  juke?.classList.add("is-rolling");
  let ticks = 0;
  const spin = window.setInterval(() => {
    showIdea(Math.floor(Math.random() * IDEAS.length));
    if (++ticks > 7) {
      clearInterval(spin);
      jukeIdx = next;
      showIdea(next);
      juke?.classList.remove("is-rolling");
      rolling = false;
    }
  }, 55);
}

jukeBtn?.addEventListener("click", rollIdea);
showIdea(jukeIdx);

/* ───────────────────────── 5. The player bar ───────────────────────── */
const player = $("#player");
const nowTrack = $("#nowTrack");
const seekFill = $("#seekFill");
const seekHead = $("#seekHead");
const seekBtn = $<HTMLButtonElement>("#playerSeek");
const tNow = $("#tNow");
const tAll = $("#tAll");
const btnPlay = $<HTMLButtonElement>("#btnPlay");
const btnPrev = $<HTMLButtonElement>("#btnPrev");
const btnNext = $<HTMLButtonElement>("#btnNext");
const btnShuffle = $<HTMLButtonElement>("#btnShuffle");

const sections = $$("[data-track]");
const navLinks = $$<HTMLAnchorElement>(".topnav a");

// Total "runtime" = the last section's stamp.
const totalSecs = (() => {
  const last = sections[sections.length - 1]?.dataset.dur ?? "6:00";
  const [m, s] = last.split(":").map(Number);
  return m * 60 + s;
})();
if (tAll) tAll.textContent = fmt(totalSecs);

function fmt(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

let currentIdx = 0;

function setTrack(idx: number) {
  if (idx === currentIdx) return;
  currentIdx = idx;
  const name = sections[idx]?.dataset.track ?? "hackify";
  if (nowTrack) {
    nowTrack.textContent = name;
    if (!reduced) {
      nowTrack.classList.remove("is-swap");
      void (nowTrack as HTMLElement).offsetWidth;
      nowTrack.classList.add("is-swap");
    }
  }
  const id = sections[idx]?.id;
  navLinks.forEach((a) => {
    const on = a.getAttribute("href") === `#${id}`;
    if (on) a.setAttribute("aria-current", "true");
    else a.removeAttribute("aria-current");
  });
}

function scrollProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
}

let raf = 0;
function onScroll() {
  if (raf) return;
  raf = requestAnimationFrame(() => {
    raf = 0;
    const p = scrollProgress();
    if (seekFill) seekFill.style.width = `${p * 100}%`;
    if (seekHead) seekHead.style.left = `${p * 100}%`;
    if (tNow) tNow.textContent = fmt(p * totalSecs);
    seekBtn?.setAttribute("aria-valuenow", String(Math.round(p * 100)));

    // which section owns the viewport middle?
    const mid = window.scrollY + window.innerHeight * 0.4;
    let idx = 0;
    for (let i = 0; i < sections.length; i++) {
      if ((sections[i] as HTMLElement).offsetTop <= mid) idx = i;
    }
    setTrack(idx);

    player?.classList.toggle("is-up", window.scrollY > 220);
  });
}
window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onScroll, { passive: true });
onScroll();

function goto(idx: number) {
  const clamped = Math.max(0, Math.min(sections.length - 1, idx));
  sections[clamped]?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
}
btnNext?.addEventListener("click", () => goto(currentIdx + 1));
btnPrev?.addEventListener("click", () => {
  // if we're a good way into the current section, jump to its top first
  const cur = sections[currentIdx] as HTMLElement | undefined;
  if (cur && window.scrollY - cur.offsetTop > 160) goto(currentIdx);
  else goto(currentIdx - 1);
});

btnShuffle?.addEventListener("click", () => {
  $("#jukebox")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
  window.setTimeout(rollIdea, reduced ? 0 : 480);
});

// play/pause toggles the site's ambient motion
let playing = true;
function setPlaying(on: boolean) {
  playing = on;
  player?.classList.toggle("is-paused", !on);
  document.body.classList.toggle("is-paused", !on);
  btnPlay?.setAttribute("aria-pressed", String(on));
  btnPlay?.setAttribute("aria-label", on ? "Pause background motion" : "Resume background motion");
  if (!on && skinTimer) { clearInterval(skinTimer); skinTimer = undefined; }
}
btnPlay?.addEventListener("click", () => setPlaying(!playing));
if (reduced) setPlaying(false);

// click the seek bar to scrub the page
seekBtn?.addEventListener("click", (e) => {
  const r = seekBtn.getBoundingClientRect();
  const p = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
  const max = document.documentElement.scrollHeight - window.innerHeight;
  window.scrollTo({ top: p * max, behavior: reduced ? "auto" : "smooth" });
});
seekBtn?.addEventListener("keydown", (e) => {
  const step = window.innerHeight * 0.8;
  if (e.key === "ArrowRight") { e.preventDefault(); window.scrollBy({ top: step, behavior: "smooth" }); }
  if (e.key === "ArrowLeft") { e.preventDefault(); window.scrollBy({ top: -step, behavior: "smooth" }); }
});

/* ───────────────────────── 6. Scroll reveals ───────────────────────── */
const revealSel = [
  ".sec .kicker", ".sec .h2", ".sec .sub",
  ".spice__prose", ".layer", ".card", ".crate",
  ".juke", ".xchg__readout", ".xchg__deck", ".trk", ".qa", ".join",
];
const targets = $$(revealSel.join(","));

if (!reduced && "IntersectionObserver" in window) {
  targets.forEach((el, i) => {
    el.classList.add("rv");
    const d = i % 4;
    if (d) el.classList.add(`rv-d${d}`);
  });
  const io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        }
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );
  targets.forEach((el) => io.observe(el));
}

/* ───────────────────────── 7. Konami-lite easter egg ─────────────────────────
   Type "css" anywhere and the site briefly shows you its own bones. */
let buf = "";
window.addEventListener("keydown", (e) => {
  const tag = (e.target as HTMLElement | null)?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;
  if (e.key.length !== 1) return;
  buf = (buf + e.key.toLowerCase()).slice(-3);
  if (buf === "css") {
    buf = "";
    document.body.classList.toggle("show-bones");
    if (!$("#bonesStyle")) {
      const s = document.createElement("style");
      s.id = "bonesStyle";
      s.textContent = `
        .show-bones *:not(.grain):not(.player):not(.player *) {
          outline: 1px solid color-mix(in srgb, var(--cool) 60%, transparent) !important;
        }
        .show-bones::after {
          content: "inspect element, but make it a keyboard shortcut. press c-s-s again to stop.";
          position: fixed; left: 50%; bottom: calc(var(--playerh) + 14px);
          translate: -50% 0; z-index: 150;
          background: var(--cool); color: #fff;
          font-family: var(--ff-mono); font-size: .72rem;
          padding: .45rem .8rem; border-radius: 999px;
          box-shadow: 0 6px 20px rgba(0,0,0,.3);
          max-width: 90vw; text-align: center;
        }`;
      document.head.appendChild(s);
    }
  }
});
