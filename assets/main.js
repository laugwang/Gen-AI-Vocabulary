// 首頁：讀取 data/terms.json + data/candidates.json，產生卡片牆、搜尋建議與分類篩選。
// 新增分類時，請同步修改 CLAUDE.md、assets/term.js、scripts/check.py 的 CATEGORIES。
export const CATEGORIES = {
  basic: "基礎概念",
  text: "文字生成",
  image: "圖像生成",
  video: "影片生成",
  apply: "應用與微調",
};

// 「請 AI 新增」會在這個 repo 開一個 issue，由 .github/workflows/add-term.yml 處理。
const REPO = "laugwang/Gen-AI-Vocabulary";

const grid = document.getElementById("grid");
const search = document.getElementById("search");
const suggest = document.getElementById("suggest");
const filters = document.getElementById("filters");
const count = document.getElementById("count");

let terms = [];
let candidates = [];
let activeCat = "all";

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const norm = (s) => String(s).toLowerCase().replace(/\s+/g, "");
const hit = (q, fields) => fields.some((f) => norm(f).includes(q));

function issueUrl(term, en = "", category = "") {
  const p = new URLSearchParams({
    template: "add-term.yml",
    title: `新增術語：${term}`,
    term,
    en,
    category,
  });
  return `https://github.com/${REPO}/issues/new?${p}`;
}

function card(t) {
  return `<a class="card cat-${esc(t.category)}" href="terms/${esc(t.slug)}.html">
    <h3>${esc(t.term)}</h3>
    <span class="en">${esc(t.en)}</span>
    <p>${esc(t.summary)}</p>
    <span class="meta">
      <span class="badge">${esc(CATEGORIES[t.category] || t.category)}</span>
      <span class="badge level">${esc(t.level)}</span>
    </span>
  </a>`;
}

function renderSuggest() {
  const raw = search.value.trim();
  const q = norm(raw);
  if (!q) {
    suggest.hidden = true;
    return;
  }
  const have = terms.filter((t) => hit(q, [t.term, t.en, t.slug])).slice(0, 5);
  const want = candidates.filter((c) => hit(q, [c.term, c.en, ...(c.aliases || [])])).slice(0, 6);
  const exact = [...terms, ...candidates].some((t) => norm(t.term) === q || norm(t.en) === q);

  let html = "";
  html += have
    .map((t) => `<li><a class="sg sg-have cat-${esc(t.category)}" href="terms/${esc(t.slug)}.html">
        <span class="sg-term">${esc(t.term)}</span><span class="sg-en">${esc(t.en)}</span>
        <span class="sg-tag">已收錄</span></a></li>`)
    .join("");
  html += want
    .map((c) => `<li><a class="sg sg-want cat-${esc(c.category)}" target="_blank" rel="noopener" href="${esc(issueUrl(c.term, c.en, c.category))}">
        <span class="sg-term">＋ ${esc(c.term)}</span><span class="sg-en">${esc(c.en)}</span>
        <span class="sg-tag">請 AI 新增</span></a></li>`)
    .join("");
  if (!exact) {
    html += `<li><a class="sg sg-free" target="_blank" rel="noopener" href="${esc(issueUrl(raw))}">
        <span class="sg-term">＋ 請 AI 查證並新增「${esc(raw)}」</span>
        <span class="sg-en">AI 會先確認這是公認的專業術語；查無可靠來源則不新增</span></a></li>`;
  }
  suggest.innerHTML = html;
  suggest.hidden = !html;
}

function render() {
  const q = norm(search.value.trim());
  const list = terms.filter((t) => {
    if (activeCat !== "all" && t.category !== activeCat) return false;
    return !q || hit(q, [t.term, t.en, t.summary, t.slug]);
  });
  grid.innerHTML = list.length ? list.map(card).join("") : `<p class="empty">還沒有這張卡，可以從上方建議請 AI 新增。</p>`;
  count.textContent = `共 ${list.length} / ${terms.length} 張詞彙卡 · 待新增 ${candidates.length} 個術語`;
  renderSuggest();
}

function buildFilters() {
  const entries = [["all", "全部"], ...Object.entries(CATEGORIES)];
  filters.innerHTML = entries
    .map(([k, v]) => `<button class="chip" type="button" data-cat="${k}" aria-pressed="${k === activeCat}">${v}</button>`)
    .join("");
  filters.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cat]");
    if (!btn) return;
    activeCat = btn.dataset.cat;
    filters.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c === btn)));
    render();
  });
}

async function init() {
  buildFilters();
  try {
    terms = await (await fetch("data/terms.json")).json();
  } catch (err) {
    grid.innerHTML = `<p class="empty">無法讀取 data/terms.json。若是直接開啟檔案，請改用 <code>python3 -m http.server</code> 預覽。</p>`;
    return;
  }
  try {
    candidates = await (await fetch("data/candidates.json")).json();
  } catch {
    candidates = [];
  }
  const q = new URLSearchParams(location.search).get("q");
  if (q) search.value = q;
  search.addEventListener("input", render);
  search.addEventListener("focus", renderSuggest);
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-box")) suggest.hidden = true;
  });
  search.addEventListener("keydown", (e) => {
    if (e.key === "Escape") suggest.hidden = true;
  });
  render();
}

init();
