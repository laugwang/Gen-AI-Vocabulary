# CLAUDE.md — GenAI 詞彙卡

> 給 AI 助手（Claude Code、Codex、Cursor…）的專案說明書。
> 每次開始工作前請完整讀完本檔。若本檔與你的直覺衝突，**以本檔為準**。

---

## 1. 專案目的

「GenAI 詞彙卡」是一個**生成式 AI 術語小辭典**，對象是修「生成式 AI：文字與圖像生成」的大學生。

**內容必須專業、可查證、為學界／業界公認**：每張卡都附參考資料，寧缺勿濫，不收錄來路不明的詞。

- 每個術語 = 一張「詞彙卡」= 一個獨立 HTML 頁面。
- 目標是讓沒有數學背景的同學 **3 分鐘內看懂一個術語**：先一句話、再比喻、再原理。
- 網站是純靜態（HTML + CSS + 原生 JS），直接用 GitHub Pages 從 `main` 分支根目錄發布，**沒有任何建置步驟**。

這個專案的價值在於「可以一直長下去」，而且**使用者不用自己動手**：

> 在首頁搜尋框輸入「影格」→ 下拉選單出現「＋ 影格差分 Frame Differencing　請 AI 新增」→ 點下去開一個 GitHub issue → GitHub Actions 讓 Claude 依本檔查證、撰寫、檢查、提交、部署 → 在 issue 回覆新卡片連結。

（流程細節見第 10 節。AI 在背後做的仍是第 3 節的步驟。）

---

## 2. 目錄結構

```
Gen-AI-Vocabulary/
├── CLAUDE.md            ← 本檔（規則的唯一來源）
├── AGENTS.md            ← 指向本檔，給非 Claude 的 agent
├── README.md            ← 給人看的簡介
├── index.html           ← 首頁：搜尋 + 分類篩選 + 卡片牆（由 JS 讀清單產生）
├── about.html           ← 關於本站 & 如何新增詞彙
├── .nojekyll            ← 讓 GitHub Pages 不跑 Jekyll，勿刪
├── .github/
│   ├── workflows/pages.yml       ← 每次 push 到 main：跑 check.py → 部署 GitHub Pages
│   ├── workflows/add-term.yml    ← issue 帶 add-term 標籤：Claude 新增詞彙卡（第 10 節）
│   ├── ai-add-term-prompt.md     ← 給 workflow 中 Claude 的任務說明
│   └── ISSUE_TEMPLATE/add-term.yml ← 「請 AI 新增」的 issue 表單
├── assets/
│   ├── style.css        ← 全站唯一樣式表
│   ├── main.js          ← 首頁邏輯（搜尋建議、篩選、「請 AI 新增」連結；REPO 常數）
│   └── term.js          ← 詞彙頁邏輯（自動產生「相關詞彙」「參考資料」與上一張/下一張）
├── data/
│   ├── terms.json       ← ★ 已收錄的詞彙清單（Single Source of Truth）
│   └── candidates.json  ← 待新增的公認術語，供搜尋建議使用
├── terms/
│   ├── _template.html   ← ★ 新詞彙頁的範本，一律從這裡複製
│   └── <slug>.html      ← 每個詞彙一頁
└── scripts/
    └── check.py         ← 一致性檢查腳本，每次修改後必跑
```

**不要**新增其他頂層資料夾（`.github/` 除外）、框架（React/Vue）、套件管理檔（package.json）或建置工具。

---

## 3. 新增一張詞彙卡（最常見的任務）

請**嚴格依序**完成以下 5 步：

### 步驟 1：決定 slug
- 用英文術語轉成 kebab-case：全小寫、單字以 `-` 連接、只能有 `a-z 0-9 -`。
- 例：`Retrieval-Augmented Generation` → `rag`（有通用縮寫時用縮寫）；`Diffusion Model` → `diffusion-model`。
- 檔名 = `terms/<slug>.html`，slug 不可與現有重複。

### 步驟 2：複製範本
```bash
cp terms/_template.html terms/<slug>.html
```
然後把範本中所有 `{{...}}` 佔位符換掉。**不可**留下任何 `{{`。

### 步驟 3：填寫六個固定區塊（順序與 id 不可更動）

| 順序 | section id      | 標題         | 寫作規則 |
|-----|-----------------|--------------|----------|
| 1 | `definition`     | 一句話定義   | 1 句，≤ 60 字，不用術語解釋術語 |
| 2 | `analogy`        | 白話比喻     | 用生活中的例子比喻，2–4 句 |
| 3 | `how-it-works`   | 運作原理     | 3–5 個步驟，用 `<ol>`；可以有一個公式或程式碼，但不要超過一個 |
| 4 | `example`        | 小例子       | 一個具體可想像的例子；程式或 prompt 放在 `<pre><code>` |
| 5 | `misconceptions` | 常見誤解     | 2–3 條，用 `<ul>`，每條格式：`<strong>誤解：</strong>… <strong>其實：</strong>…` |
| 6 | `related`        | 相關詞彙     | **留空**，由 `term.js` 依 `terms.json` 自動產生 |

「參考資料」區塊不寫在 HTML 裡，由 `term.js` 依 `terms.json` 的 `sources` 自動產生在最後。

### 步驟 4：登記到 `data/terms.json`
在陣列中加入一筆（依 `category` 分組放置，組內順序即網站顯示順序）：

```json
{
  "slug": "rag",
  "term": "檢索增強生成",
  "en": "Retrieval-Augmented Generation (RAG)",
  "category": "apply",
  "level": "入門",
  "summary": "先查資料、再讓模型根據查到的內容回答，降低幻覺。",
  "related": ["embedding", "hallucination"],
  "sources": ["https://arxiv.org/abs/2005.11401"],
  "updated": "2026-11-16"
}
```

欄位規則：
- `category` 只能是下列五個 key 之一（新增分類需同時修改本表、`assets/main.js` 與 `assets/term.js` 的 `CATEGORIES`、`scripts/check.py` 的 `CATEGORIES`/`CAT_ORDER`、`assets/style.css` 的分類色）。`terms.json` 依此表順序分組：

  | key     | 顯示名稱   | 收錄範圍 |
  |---------|------------|----------|
  | `basic` | 基礎概念   | 不分文字/圖像都會用到的概念（token、embedding…） |
  | `text`  | 文字生成   | LLM、Transformer、取樣參數… |
  | `image` | 圖像生成   | Diffusion、VAE、CFG… |
  | `video` | 影片生成   | 影格差分、影格插值、光流、時間一致性… |
  | `apply` | 應用與微調 | RAG、LoRA、Prompt、Agent… |

- `level`：`入門` 或 `進階`。
- `summary`：≤ 40 字，會出現在首頁卡片上。必須和頁面的「一句話定義」意思一致，但可以更短。
- `related`：0–4 個 slug。**只能填已存在的 slug**；若想連到還沒寫的詞，先不要填，寫進 README 的「待新增」清單。
- `sources`：1–3 個 `https://` 網址，必須是**實際打開確認過**的權威來源（見第 7 節）。
- `updated`：`YYYY-MM-DD`，每次修改該頁內容都要更新。
- 若此術語原本在 `data/candidates.json`，新增後要從那裡**移除**（`check.py` 會檢查）。

### 步驟 5：執行檢查
```bash
python3 scripts/check.py
```
必須看到 `✅ All checks passed`。有任何 ❌ 都要修好才算完成。

---

## 4. 頁面與視覺風格

- **語言**：繁體中文（台灣用語），術語第一次出現時附英文，如「注意力機制（Attention）」。
- **語氣**：專業、精確，像助教講解。比喻是輔助理解，不可為了好懂而犧牲正確性；不用表情符號。
- **用詞**：採台灣學界常用譯名（如「影格」而非「幀」、「擴散模型」）；有多種譯名時於第一次出現時並列。
- **中英混排**：中文與英文/數字之間加半形空格（`使用 GPT 模型`）。
- **配色**：只用 `assets/style.css` 中 `:root` 定義的 CSS 變數，**不可**在 HTML 裡寫 `style="..."` 或新增顏色碼。
  - 分類色：`--c-basic`（藍）、`--c-text`（綠）、`--c-image`（橘）、`--c-video`（桃紅）、`--c-apply`（紫）。
- **深色模式**：已用 `prefers-color-scheme` 支援；新增 CSS 時要同時考慮兩種模式。
- **RWD**：版面要在 375px 寬的手機上不能橫向捲動。
- **字型**：Noto Sans TC（Google Fonts），程式碼用系統等寬字型。

## 5. HTML 規則

- 每頁都必須有：`<html lang="zh-Hant">`、`<meta charset="utf-8">`、viewport meta、`<title>術語 · GenAI 詞彙卡</title>`。
- 詞彙頁的 `<body>` 必須帶 `data-slug="<slug>"`，`term.js` 靠它找資料。
- 共用的頁首/頁尾直接沿用範本中的 HTML，**不要**自行改動導覽列；若要改，三種頁面（index、about、_template 與所有 terms）要一起改。
- 內部連結一律用相對路徑（GitHub Pages 會放在 `/<repo>/` 子路徑底下，絕對路徑 `/` 會壞掉）。
- 不引入外部 JS 函式庫。

## 6. 修改既有內容時

- 修正錯誤：直接改，並更新 `terms.json` 中該筆的 `updated`。
- 改 slug（重新命名檔案）：要同步修改 `terms.json` 的 `slug`、所有別人的 `related`、頁面 `data-slug`，再跑 `check.py`。
- 刪除詞彙：刪 HTML、刪 `terms.json` 該筆、從其他人的 `related` 移除。
- 改共用樣式：只改 `assets/style.css`，並確認首頁、about、至少一張詞彙卡在淺色與深色模式都正常。

## 7. AI 助手必須遵守

1. **先讀後寫**：動手前先讀 `data/terms.json` 和至少一個現有的 `terms/*.html`，模仿既有寫法。
2. **小步提交**：一張詞彙卡 = 一個 commit，訊息格式：
   - `feat(term): add <slug>` 新增
   - `fix(term): <slug> <說明>` 修正內容
   - `style: <說明>` 樣式
   - `docs: <說明>` 文件/規則
3. **防幻覺（最重要）**：
   - 只收錄**學界或業界公認**的術語：至少能在原始論文（arXiv／頂會）、官方文件（PyTorch、Hugging Face、OpenCV…）、大學課程講義或英文維基百科之一找到明確定義。
   - 寫卡片前必須用 WebFetch **實際打開**來源並確認內容；`sources` 只能填打開過的網址，**禁止憑記憶編造網址、論文標題、作者、年份或數據**。
   - 卡片內容只寫來源支持的事實；不確定的細節寧可不寫。
   - 使用者輸入不完整時（如「影格」），對應到最標準的正式術語（如「影格差分 Frame Differencing」）；對應不到就拒絕，並說明原因。
   - 已收錄（含同義詞）、非公認、查無來源、與本站主題無關 → **不新增**。
4. **不要**修改 `CLAUDE.md` 的規則，除非使用者明確要求；若規則需要調整，先提出建議。
5. 完成後回報：新增/修改了哪些檔案、`check.py` 結果、本機預覽方式（`python3 -m http.server`）。

## 8. 本機預覽

```bash
python3 -m http.server 8000
# 開啟 http://localhost:8000
```
（直接雙擊 `index.html` 會因 `fetch()` 的 CORS 限制而讀不到 `terms.json`。）

## 9. 完成的定義（Definition of Done）

- [ ] `terms/<slug>.html` 六個區塊都有內容（`related` 除外）且無 `{{`
- [ ] `data/terms.json` 已登記，欄位齊全，`sources` 為實際查證過的網址
- [ ] 若在 `data/candidates.json` 中，已移除
- [ ] `python3 scripts/check.py` 全數通過
- [ ] 本機預覽：首頁看得到新卡片、搜尋得到、點進去相關詞彙有出現
- [ ] commit 訊息符合格式

## 10. 「請 AI 新增」自動流程

```
搜尋框輸入 → 下拉建議（terms.json 已收錄 / candidates.json 待新增 / 任意關鍵字）
  → 點「請 AI 新增」→ 開 issue（.github/ISSUE_TEMPLATE/add-term.yml，自動帶 add-term 標籤）
  → .github/workflows/add-term.yml：
      Claude Code 讀 CLAUDE.md + .github/ai-add-term-prompt.md
      → WebSearch / WebFetch 查證 → 依第 3 節寫卡片 → check.py
      → 寫 .ai-result.json（ADDED / DUPLICATE / REJECTED）
  → ADDED：workflow commit `feat(term): add <slug>` 到 main 並重新部署 Pages
  → 在 issue 回覆結果與連結，然後關閉 issue
```

- 需要 repo Secret：`ANTHROPIC_API_KEY`（Settings → Secrets and variables → Actions）。
- 只有 repo 擁有者／協作者開的 issue 會觸發，避免陌生人消耗額度。
- `candidates.json` 只放**確定為公認術語**的項目，欄位：`term`、`en`、`category`、`aliases`（同義詞、常見簡稱，用於搜尋比對）。
- 在本機用 Claude Code 也可以達到相同效果：「請依照 CLAUDE.md 新增 影格差分」。
- 換 repo 名稱時，要改 `assets/main.js` 的 `REPO` 常數。
