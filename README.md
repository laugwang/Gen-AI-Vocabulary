# GenAI 詞彙卡

生成式 AI 術語小辭典：**一個詞一張卡，3 分鐘看懂。**
純靜態網站（HTML + CSS + 原生 JS），以 GitHub Pages 發布。

- 🧭 AI 協作規則：[`CLAUDE.md`](./CLAUDE.md)（`AGENTS.md` 指向同一份）
- 🗂 詞彙清單：[`data/terms.json`](./data/terms.json)
- 🧩 新頁面範本：[`terms/_template.html`](./terms/_template.html)
- ✅ 一致性檢查：`python3 scripts/check.py`

## 本機預覽

```bash
python3 -m http.server 8000
```

開啟 <http://localhost:8000>。

## 新增詞彙

- **網站上**：在搜尋框輸入關鍵字（例如「影格」），點下拉選單的「＋ 請 AI 新增」，GitHub Actions 會讓 Claude 查證後自動新增並部署（需設定 `ANTHROPIC_API_KEY` secret，見 `CLAUDE.md` 第 10 節）。
- **本機**：對 Claude Code 說「請依照 CLAUDE.md 新增 `<術語>`」。

## 目前收錄

| 分類 | 詞彙 |
|------|------|
| 基礎概念 | Tokenization、Embedding、Hallucination |
| 文字生成 | Attention、Temperature |
| 圖像生成 | Diffusion Model |
| 影片生成 | （待新增） |
| 應用與微調 | RAG、LoRA |

## 待新增

見 [`data/candidates.json`](./data/candidates.json)，首頁搜尋時會出現在建議清單中。
