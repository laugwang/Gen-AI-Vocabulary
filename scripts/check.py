#!/usr/bin/env python3
"""GenAI 詞彙卡 — 一致性檢查。

用法：python3 scripts/check.py
規則來源：CLAUDE.md 第 3、5 節。任何 ❌ 都必須修正後才算完成。
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATEGORIES = {"basic", "text", "image", "video", "apply"}
CAT_ORDER = ["basic", "text", "image", "video", "apply"]
LEVELS = {"入門", "進階"}
FIELDS = ["slug", "term", "en", "category", "level", "summary", "related", "sources", "updated"]
URL_RE = re.compile(r"^https://[^\s]+$")
SECTIONS = ["definition", "analogy", "how-it-works", "example", "misconceptions", "related"]
SLUG_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

errors: list[str] = []
warnings: list[str] = []


def err(msg: str) -> None:
    errors.append(msg)


def check_manifest() -> list[dict]:
    path = ROOT / "data" / "terms.json"
    try:
        terms = json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:  # noqa: BLE001
        err(f"data/terms.json 不是合法 JSON：{e}")
        return []
    if not isinstance(terms, list):
        err("data/terms.json 最外層必須是陣列")
        return []

    slugs = [t.get("slug") for t in terms]
    seen = set()
    last_cat_idx = -1
    cat_order = CAT_ORDER
    for t in terms:
        s = t.get("slug", "?")
        missing = [f for f in FIELDS if f not in t]
        if missing:
            err(f"[{s}] terms.json 缺少欄位：{', '.join(missing)}")
            continue
        if not SLUG_RE.match(s):
            err(f"[{s}] slug 必須是 kebab-case（a-z 0-9 -）")
        if s in seen:
            err(f"[{s}] slug 重複")
        seen.add(s)
        if t["category"] not in CATEGORIES:
            err(f"[{s}] category 「{t['category']}」不在 {sorted(CATEGORIES)}")
        else:
            idx = cat_order.index(t["category"])
            if idx < last_cat_idx:
                err(f"[{s}] terms.json 需依分類分組排列（{' → '.join(CAT_ORDER)}）")
            last_cat_idx = max(last_cat_idx, idx)
        if t["level"] not in LEVELS:
            err(f"[{s}] level 只能是 入門 / 進階")
        if len(t["summary"]) > 40:
            err(f"[{s}] summary 超過 40 字（目前 {len(t['summary'])}）")
        if not DATE_RE.match(t["updated"]):
            err(f"[{s}] updated 格式需為 YYYY-MM-DD")
        src = t["sources"]
        if not isinstance(src, list) or not 1 <= len(src) <= 3:
            err(f"[{s}] sources 必須是 1–3 個網址（防幻覺：每張卡都要有可查證的來源）")
        else:
            for u in src:
                if not URL_RE.match(str(u)):
                    err(f"[{s}] sources 網址需以 https:// 開頭且不含空白：{u}")
        if not isinstance(t["related"], list) or len(t["related"]) > 4:
            err(f"[{s}] related 必須是 0–4 個 slug 的陣列")
        else:
            for r in t["related"]:
                if r not in slugs:
                    err(f"[{s}] related 指向不存在的 slug：{r}")
                if r == s:
                    err(f"[{s}] related 不可包含自己")
    return terms


def check_page(t: dict) -> None:
    s = t["slug"]
    path = ROOT / "terms" / f"{s}.html"
    if not path.exists():
        err(f"[{s}] 找不到 terms/{s}.html")
        return
    html = path.read_text(encoding="utf-8")

    if "{{" in html or "}}" in html:
        err(f"[{s}] 頁面中還有未替換的 {{{{佔位符}}}}")
    if '<html lang="zh-Hant">' not in html:
        err(f'[{s}] 缺少 <html lang="zh-Hant">')
    if 'name="viewport"' not in html:
        err(f"[{s}] 缺少 viewport meta")
    if f'data-slug="{s}"' not in html:
        err(f'[{s}] <body> 缺少 data-slug="{s}"')
    if f"<title>{t['term']} · GenAI 詞彙卡</title>" not in html:
        err(f"[{s}] <title> 應為「{t['term']} · GenAI 詞彙卡」")
    if f"<h1>{t['term']}</h1>" not in html:
        err(f"[{s}] <h1> 與 terms.json 的 term 不一致")
    if 'style="' in html:
        err(f"[{s}] 不可使用 inline style，請改用 assets/style.css")
    if "../assets/term.js" not in html:
        err(f"[{s}] 未載入 ../assets/term.js")

    found = re.findall(r'<section id="([a-z-]+)"', html)
    if found != SECTIONS:
        err(f"[{s}] section 順序/名稱應為 {SECTIONS}，目前是 {found}")

    for sec in SECTIONS[:-1]:
        m = re.search(rf'<section id="{sec}">(.*?)</section>', html, re.S)
        body = re.sub(r"<h2>.*?</h2>", "", m.group(1)) if m else ""
        if not re.sub(r"<[^>]+>|\s", "", body):
            err(f"[{s}] 區塊 #{sec} 是空的")

    m = re.search(r'<section id="definition">.*?<p>(.*?)</p>', html, re.S)
    if m:
        plain = re.sub(r"<[^>]+>", "", m.group(1))
        if len(plain) > 60:
            warnings.append(f"[{s}] 一句話定義 {len(plain)} 字，建議 ≤ 60 字")

    m = re.search(r'<section id="how-it-works">(.*?)</section>', html, re.S)
    if m:
        n = m.group(1).count("<li>")
        if not 3 <= n <= 5:
            err(f"[{s}] 運作原理需 3–5 個步驟（目前 {n}）")

    m = re.search(r'<section id="misconceptions">(.*?)</section>', html, re.S)
    if m:
        items = re.findall(r"<li>(.*?)</li>", m.group(1), re.S)
        if not 2 <= len(items) <= 3:
            err(f"[{s}] 常見誤解需 2–3 條（目前 {len(items)}）")
        for it in items:
            if "<strong>誤解：</strong>" not in it or "<strong>其實：</strong>" not in it:
                err(f"[{s}] 常見誤解格式需為「<strong>誤解：</strong>… <strong>其實：</strong>…」")
                break

    m = re.search(r'<section id="related">(.*?)</section>', html, re.S)
    if m and "<li" in m.group(1):
        err(f"[{s}] #related 必須留空，由 term.js 自動產生")


def check_orphans(terms: list[dict]) -> None:
    known = {t.get("slug") for t in terms}
    for p in sorted((ROOT / "terms").glob("*.html")):
        if p.name.startswith("_"):
            continue
        if p.stem not in known:
            err(f"terms/{p.name} 沒有登記在 data/terms.json")


def check_candidates(terms: list[dict]) -> None:
    path = ROOT / "data" / "candidates.json"
    if not path.exists():
        return
    try:
        cands = json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:  # noqa: BLE001
        err(f"data/candidates.json 不是合法 JSON：{e}")
        return
    norm = lambda x: re.sub(r"\s+", "", str(x)).lower()  # noqa: E731
    have = {norm(t.get("term")) for t in terms} | {norm(t.get("en")) for t in terms}
    seen = set()
    for c in cands:
        name = c.get("term", "?")
        for f in ("term", "en", "category", "aliases"):
            if f not in c:
                err(f"[candidate {name}] 缺少欄位 {f}")
        if c.get("category") not in CATEGORIES:
            err(f"[candidate {name}] category 不合法：{c.get('category')}")
        if norm(name) in have or norm(c.get("en")) in have:
            err(f"[candidate {name}] 已經收錄，請從 data/candidates.json 移除")
        if norm(name) in seen:
            err(f"[candidate {name}] 重複")
        seen.add(norm(name))


def check_links() -> None:
    for p in [ROOT / "index.html", ROOT / "about.html", *sorted((ROOT / "terms").glob("*.html"))]:
        html = p.read_text(encoding="utf-8")
        for href in re.findall(r'(?:href|src)="([^"]+)"', html):
            if href.startswith(("http://", "https://", "#", "mailto:")):
                continue
            if href.startswith("/"):
                err(f"{p.relative_to(ROOT)}：內部連結不可用絕對路徑 {href}")
                continue
            target = (p.parent / href.split("#")[0].split("?")[0]).resolve()
            if not target.exists():
                err(f"{p.relative_to(ROOT)}：連結不存在 {href}")


def main() -> int:
    terms = check_manifest()
    for t in terms:
        if all(f in t for f in FIELDS):
            check_page(t)
    check_orphans(terms)
    check_candidates(terms)
    check_links()

    for w in warnings:
        print(f"⚠️  {w}")
    for e in errors:
        print(f"❌ {e}")
    if errors:
        print(f"\n{len(errors)} error(s). 請依 CLAUDE.md 修正。")
        return 1
    print(f"✅ All checks passed — {len(terms)} 張詞彙卡")
    return 0


if __name__ == "__main__":
    sys.exit(main())
