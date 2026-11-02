/* =====================================================
   Meridian by Sofia | app.js
   Attach it in index.html, just before </body>, AFTER the
   existing <script> block:   <script src="app.js"></script>
   It adds 4 features on top of your page:
   1. Quotation pop-up   2. Back button + username button
   3. Error-proof buttons   4. Category list that scrolls with the page
   ===================================================== */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const PAGE_IDS = ["page-home", "page-auth", "page-dash", "page-detail"];

  function make(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text) e.textContent = text;
    return e;
  }

  /* ---------- styles for everything added here ---------- */
  const style = make("style");
  style.textContent = `
    .mq-overlay { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(74, 36, 51, .45); }
    .mq-card { position: relative; background: var(--white); border-radius: 24px; padding: 48px 36px 32px; max-width: 520px; width: 100%; text-align: center; box-shadow: 0 24px 60px rgba(176, 63, 104, .3); animation: mqIn .35s ease; }
    .mq-card::before { content: "\\201C"; display: block; font-family: "Cormorant Garamond", Georgia, serif; font-size: 5rem; line-height: .6; color: var(--accent); }
    .mq-text { font-family: "Cormorant Garamond", Georgia, serif; font-size: 1.7rem; line-height: 1.3; color: var(--accent-dark); margin: 14px 0; }
    .mq-author { color: var(--muted); margin-bottom: 26px; }
    .mq-x { position: absolute; top: 12px; right: 14px; width: 40px; height: 40px; padding: 0; font-size: 1.6rem; line-height: 1; border-radius: 50%; border: none; background: var(--petal); color: var(--accent-dark); }
    .mq-x:hover { background: var(--accent); }
    @keyframes mqIn { from { opacity: 0; transform: translateY(20px) scale(.97); } to { opacity: 1; transform: none; } }
    #nav-user { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; justify-content: center; }
    .dd { position: relative; }
    .dd-btn { width: 100%; text-align: left; border-radius: 12px; padding: 12px 16px; border: 1.5px solid var(--petal); background: var(--bg); color: var(--ink); }
    .dd-list { position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 20; list-style: none; background: var(--white); border: 1.5px solid var(--petal); border-radius: 14px; box-shadow: 0 14px 30px rgba(240, 154, 180, .3); padding: 6px; }
    .dd-list[hidden] { display: none; }
    .dd-list li { padding: 10px 14px; border-radius: 10px; cursor: pointer; }
    .dd-list li:hover, .dd-list li:focus-visible, .dd-list li.on { background: var(--petal); }
    .toast { position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%); z-index: 1100; background: var(--ink); color: var(--white); padding: 12px 22px; border-radius: 999px; }
  `;
  document.head.appendChild(style);

  function toast(message) {
    const t = make("div", "toast", message);
    t.setAttribute("role", "status");
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  /* =====================================================
     1. QUOTATION POP-UP  (a different quote on every visit)
     ===================================================== */
  const QUOTES = [
    { text: "Kindness is a language the deaf can hear and the blind can see.", author: "Mark Twain" },
    { text: "Life is either a daring adventure or nothing at all.", author: "Helen Keller" },
    { text: "The best and most beautiful things in the world cannot be seen or even touched \u2014 they must be felt with the heart.", author: "Helen Keller" },
    { text: "It all comes to this: the simplest way to be happy is to do good.", author: "Helen Keller" },
    { text: "And your Lord says, \u201CCall upon Me; I will respond to you.\u201D", author: "Quran 40:60" }
  ];

  function pickQuote() {
    // The browser remembers which quote was shown last and moves to the next one
    try {
      const last = parseInt(localStorage.getItem("meridianQuoteIndex"), 10);
      const next = isNaN(last) ? 0 : (last + 1) % QUOTES.length;
      localStorage.setItem("meridianQuoteIndex", String(next));
      return QUOTES[next];
    } catch (e) {
      return QUOTES[Math.floor(Math.random() * QUOTES.length)];
    }
  }

  function showQuote() {
    const q = pickQuote();
    const overlay = make("div", "mq-overlay");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Quotation of the day");

    const card = make("div", "mq-card");
    const x = make("button", "mq-x", "\u00D7");
    x.type = "button";
    x.setAttribute("aria-label", "Close quotation");
    const closeBtn = make("button", "btn-main", "Close");
    closeBtn.type = "button";
    card.append(x, make("p", "mq-text", q.text), make("p", "mq-author", "\u2014 " + q.author), closeBtn);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";
    closeBtn.focus();

    function close() {
      overlay.remove();
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    }
    function onKey(e) { if (e.key === "Escape") close(); }
    x.addEventListener("click", close);
    closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    document.addEventListener("keydown", onKey);
  }

  /* =====================================================
     2. BACK BUTTON + USERNAME BUTTON (stay logged in)
     ===================================================== */
  function loggedUser() {
    try { if (typeof sessionUser !== "undefined" && sessionUser) return sessionUser; } catch (e) {}
    try { return JSON.parse(localStorage.getItem("currentUser")); } catch (e) { return null; }
  }

  function currentPage() {
    return PAGE_IDS.find((id) => !$(id).classList.contains("hidden"));
  }

  const userNav = make("nav");
  userNav.id = "nav-user";
  userNav.classList.add("hidden");
  document.querySelector("header").appendChild(userNav);

  function navButton(label, className, onClick) {
    const b = make("button", className, label);
    b.type = "button";
    b.addEventListener("click", onClick);
    return b;
  }

  // On the welcome page, a logged-in person never sees login options again
  function updateHero(user) {
    const buttons = document.querySelectorAll(".hero .actions button");
    if (buttons.length < 2) return;
    buttons[0].textContent = user ? "Go to my dashboard" : "Let me in, I\u2019m curious";
    buttons[1].style.display = user ? "none" : "";
  }

  function updateNav() {
    const user = loggedUser();
    updateHero(user);
    $("nav-in").classList.add("hidden");
    $("nav-out").classList.toggle("hidden", !!user);
    userNav.classList.toggle("hidden", !user);
    if (!user) return;
    userNav.innerHTML = "";
    if (currentPage() === "page-dash") {
      userNav.appendChild(navButton("\u2190 Back", "btn-soft", () => window.showPage("page-home")));
    }
    // This is the old "Log in" button: it now shows the username
    userNav.appendChild(navButton(user.name || "My account", "btn-main", () => window.openDashboard()));
    userNav.appendChild(navButton("Log out", "btn-soft", () => window.logout()));
  }

  const originalShowPage = window.showPage;
  window.showPage = function (id) { originalShowPage(id); updateNav(); };

  // Clicking the logo goes to the welcome page and keeps you logged in
  window.goHome = function () { window.showPage("page-home"); };

  const originalShowAuth = window.showAuth;
  window.showAuth = function (mode) {
    if (loggedUser()) { window.openDashboard(); return; }   // already logged in
    originalShowAuth(mode);
  };

  const originalOpenDashboard = window.openDashboard;
  window.openDashboard = function () {
    if (!loggedUser()) { originalShowAuth("login"); return; }
    originalOpenDashboard();
    buildCategoryList();
  };

  /* ---------- Remember the login for a year ---------- */
  function readCookieUser() {
    try {
      const m = document.cookie.match(/(?:^|; )meridianUser=([^;]*)/);
      return m ? JSON.parse(decodeURIComponent(m[1])) : null;
    } catch (e) { return null; }
  }
  function saveCookie(user) {
    try { document.cookie = "meridianUser=" + encodeURIComponent(JSON.stringify(user)) + "; max-age=31536000; path=/; SameSite=Lax"; } catch (e) {}
  }
  function clearCookie() {
    try { document.cookie = "meridianUser=; max-age=0; path=/"; } catch (e) {}
  }

  const originalStartSession = window.startSession;
  window.startSession = function (user) { originalStartSession(user); saveCookie(user); };

  const originalLogout = window.logout;
  window.logout = function () {
    clearCookie();
    try { fetch("/api/logout", { method: "POST", credentials: "same-origin" }).catch(() => {}); } catch (e) {}
    originalLogout();                                                  // only Log out forgets you
  };

  /* ---------- Login and sign-up through the Python server ---------- */
  const originalSubmitAuth = window.submitAuth;   // the old browser-only version (backup)
  window.submitAuth = async function () {
    const name = $("name").value.trim();
    const email = $("email").value.trim().toLowerCase();
    const password = $("password").value;
    const signup = mode === "signup";

    if (signup && !name) return showError("Enter your name so we can greet you.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return showError("Please enter a valid email, like name@example.com.");
    if (password.length < 6) return showError("Your password needs at least 6 characters.");

    let response;
    try {
      response = await fetch(signup ? "/api/signup" : "/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name, email, password })
      });
    } catch (e) { return originalSubmitAuth(); }          // server not running: demo mode
    if ([404, 405, 501].includes(response.status)) return originalSubmitAuth();

    let data = null;
    try { data = await response.json(); } catch (e) {}
    if (!response.ok || !data || !data.ok) return showError((data && data.error) || "Something went wrong. Please try again.");
    window.startSession(data.user);
  };

  /* =====================================================
     3. BUTTONS THAT NEVER BREAK
     ===================================================== */
  const originalOpenDetail = window.openDetail;
  window.openDetail = function (i) { if (currentResults[i]) originalOpenDetail(i); };
  const originalStepDetail = window.stepDetail;
  window.stepDetail = function (s) { if (currentResults.length) originalStepDetail(s); };

  // Wrap every button function so a problem shows a friendly message instead of an error
  ["showPage", "goHome", "showAuth", "submitAuth", "logout", "openDashboard", "renderCards",
   "openDetail", "stepDetail", "backToList", "goExplore"].forEach((name) => {
    const fn = window[name];
    if (typeof fn !== "function") return;
    window[name] = function () {
      try { return fn.apply(this, arguments); }
      catch (err) { console.error(name, err); toast("Something went wrong. Please try again."); }
    };
  });

  // Pressing Enter in the login form works like clicking the button
  ["name", "email", "password"].forEach((id) => {
    const field = $(id);
    if (field) field.addEventListener("keydown", (e) => { if (e.key === "Enter") window.submitAuth(); });
  });

  /* =====================================================
     4. CATEGORY LIST THAT SCROLLS WITH THE PAGE
     (replaces the browser's own drop-down, which stays fixed)
     ===================================================== */
  function closeCategoryList() {
    const list = document.querySelector("#region-dd .dd-list");
    const btn = $("region-btn");
    if (list) list.hidden = true;
    if (btn) btn.setAttribute("aria-expanded", "false");
  }

  function buildCategoryList() {
    const select = $("region");
    if (!select || !select.options.length) return;
    select.style.display = "none";
    select.setAttribute("aria-hidden", "true");
    const old = $("region-dd");
    if (old) old.remove();

    const wrap = make("div", "dd");
    wrap.id = "region-dd";
    const button = make("button", "dd-btn", select.options[select.selectedIndex].text + "  \u25BE");
    button.type = "button";
    button.id = "region-btn";
    button.setAttribute("aria-haspopup", "listbox");
    button.setAttribute("aria-expanded", "false");
    const list = make("ul", "dd-list");
    list.setAttribute("role", "listbox");
    list.hidden = true;

    Array.from(select.options).forEach((opt) => {
      const li = make("li", opt.selected ? "on" : "", opt.text);
      li.setAttribute("role", "option");
      li.tabIndex = 0;
      const choose = () => { select.value = opt.value; window.renderCards(); buildCategoryList(); };
      li.addEventListener("click", choose);
      li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(); } });
      list.appendChild(li);
    });

    button.addEventListener("click", (e) => {
      e.stopPropagation();
      const opening = list.hidden;
      list.hidden = !opening;
      button.setAttribute("aria-expanded", String(opening));
      if (opening) list.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });

    wrap.append(button, list);
    select.insertAdjacentElement("afterend", wrap);
    const label = document.querySelector('label[for="region"]');
    if (label) label.setAttribute("for", "region-btn");
  }

  document.addEventListener("click", closeCategoryList);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeCategoryList(); });

  /* ---------- start everything ---------- */
  if (!loggedUser()) {                       // restore from the backup cookie if needed
    const saved = readCookieUser();
    if (saved && saved.name) {
      try { localStorage.setItem("currentUser", JSON.stringify(saved)); } catch (e) {}
      try { sessionUser = saved; } catch (e) {}
    }
  }
  const rememberedUser = loggedUser();
  if (rememberedUser) saveCookie(rememberedUser);
  if (rememberedUser && currentPage() === "page-home") window.openDashboard();

  // Ask the Python server who is logged in (its session is the real source of truth)
  fetch("/api/me", { credentials: "same-origin" })
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (!data) return;                                   // no server: demo mode
      if (data.user) {
        if (!loggedUser()) {
          try { localStorage.setItem("currentUser", JSON.stringify(data.user)); } catch (e) {}
          try { sessionUser = data.user; } catch (e) {}
        }
        if (currentPage() === "page-home") window.openDashboard();
      } else if (loggedUser()) {                           // server says: not logged in
        clearCookie();
        try { localStorage.removeItem("currentUser"); } catch (e) {}
        try { sessionUser = null; } catch (e) {}
        window.showPage("page-home");
      }
    })
    .catch(() => {});

  buildCategoryList();   // in case the dashboard was already open
  updateNav();
  setTimeout(showQuote, 300);
})();