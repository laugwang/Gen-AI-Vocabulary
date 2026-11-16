// 詞彙頁：依 <body data-slug> 從 data/terms.json 自動產生
//   1) 分類色  2) 「相關詞彙」區塊  3) 上一張 / 下一張
// 詞彙頁的 #related 區塊請保持空白，交給這支程式。
const CATEGORIES = {
  basic: "基礎概念",
  text: "文字生成",
  image: "圖像生成",
  apply: "應用與微調",
};

const slug = document.body.dataset.slug;

async function init() {
  let terms;
  try {
    terms = await (await fetch("../data/terms.json")).json();
  } catch {
    return;
  }
  const i = terms.findIndex((t) => t.slug === slug);
  if (i < 0) return;
  const me = terms[i];

  document.body.classList.add(`cat-${me.category}`);
  const catBadge = document.getElementById("cat-badge");
  if (catBadge) catBadge.textContent = CATEGORIES[me.category] || me.category;
  const updated = document.getElementById("updated");
  if (updated) updated.textContent = `更新於 ${me.updated}`;

  const box = document.querySelector("#related .related-list");
  if (box) {
    const rel = (me.related || []).map((s) => terms.find((t) => t.slug === s)).filter(Boolean);
    box.innerHTML = rel.length
      ? rel.map((t) => `<li><a href="${t.slug}.html">${t.term}</a></li>`).join("")
      : `<li class="note">目前還沒有相關詞彙。</li>`;
  }

  const pager = document.getElementById("pager");
  if (pager) {
    const prev = terms[i - 1];
    const next = terms[i + 1];
    pager.innerHTML =
      (prev ? `<a class="prev" href="${prev.slug}.html"><small>← 上一張</small>${prev.term}</a>` : "<span></span>") +
      (next ? `<a class="next" href="${next.slug}.html"><small>下一張 →</small>${next.term}</a>` : "<span></span>");
  }
}

init();
