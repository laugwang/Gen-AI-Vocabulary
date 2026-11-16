// 首頁：讀取 data/terms.json，產生卡片牆、搜尋與分類篩選。
// 新增分類時，請同步修改 CLAUDE.md 與 scripts/check.py 的 CATEGORIES。
export const CATEGORIES = {
  basic: "基礎概念",
  text: "文字生成",
  image: "圖像生成",
  apply: "應用與微調",
};

const grid = document.getElementById("grid");
const search = document.getElementById("search");
const filters = document.getElementById("filters");
const count = document.getElementById("count");

let terms = [];
let activeCat = "all";

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
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

function render() {
  const q = search.value.trim().toLowerCase();
  const list = terms.filter((t) => {
    if (activeCat !== "all" && t.category !== activeCat) return false;
    if (!q) return true;
    return [t.term, t.en, t.summary, t.slug].join(" ").toLowerCase().includes(q);
  });
  grid.innerHTML = list.length ? list.map(card).join("") : `<p class="empty">找不到符合「${esc(q)}」的詞彙。</p>`;
  count.textContent = `共 ${list.length} / ${terms.length} 張詞彙卡`;
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
    const res = await fetch("data/terms.json");
    terms = await res.json();
  } catch (err) {
    grid.innerHTML = `<p class="empty">無法讀取 data/terms.json。若是直接開啟檔案，請改用 <code>python3 -m http.server</code> 預覽。</p>`;
    return;
  }
  const q = new URLSearchParams(location.search).get("q");
  if (q) search.value = q;
  search.addEventListener("input", render);
  render();
}

init();
