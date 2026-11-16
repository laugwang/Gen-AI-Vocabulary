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

對 AI 說：「請依照 CLAUDE.md 新增一張 `<術語>` 的詞彙卡」即可，詳細步驟見 `CLAUDE.md` 第 3 節。

## 目前收錄

| 分類 | 詞彙 |
|------|------|
| 基礎概念 | Tokenization、Embedding、Hallucination |
| 文字生成 | Attention、Temperature |
| 圖像生成 | Diffusion Model |
| 應用與微調 | RAG、LoRA |

## 待新增

- Transformer、Prompt Engineering、Classifier-Free Guidance (CFG)、VAE、Fine-tuning、AI Agent、Top-p Sampling、CLIP
