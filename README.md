# 彭其捷 Jack Peng｜個人履歷站（visualization.tw）

純靜態網站（HTML／CSS／少量 JS），部署在 GitHub Pages。

| 頁面 | 網址 |
|---|---|
| 首頁（中文） | https://www.visualization.tw/ |
| 歷年企業內訓與授課紀錄 | https://www.visualization.tw/training.html |
| 英文摘要頁 | https://www.visualization.tw/en/ |
| 舊路徑 `/teach` | 301 → `/training.html`（`teach/index.html`） |
| 任何不存在路徑 | `404.html` 導回首頁 |

## 網域與部署架構（2026-08-22 起）

```
visualization.tw        GoDaddy 轉址 301 ──┐
teach.visualization.tw  GoDaddy 轉址 301 ──┼──▶ https://www.visualization.tw/
www.visualization.tw    CNAME → knowmad-tw.github.io ──▶ GitHub Pages（本 repo，main 分支根目錄）
```

- DNS 代管：**GoDaddy**（ns67/ns68.domaincontrol.com）
- GitHub Pages：repo `knowmad-tw/foxfirejack-resume`，自訂網域寫在 `CNAME`（`www.visualization.tw`），HTTPS 強制
- 舊網址 `knowmad-tw.github.io/foxfirejack-resume/` 會 301 到正式網域
- 以前 `www` 與 `teach` 指向 Strikingly，已全部停用

推上 `main` 後 GitHub Pages 約 1–3 分鐘重新部署；CSS 有改時記得把 `site.css?v=YYYYMMDDx` 版本號往上加（三個 html 都要），避免快取。

## 追蹤與搜尋

| 服務 | 設定 |
|---|---|
| Google Analytics 4 | 評估 ID `G-7SWWWJFQQ8`（資源 visualization.tw - GA4），gtag 放在 index／training／en 的 `<head>` |
| Google Search Console | 資源 `https://www.visualization.tw/`（以 GA 驗證），已提交 `sitemap.xml` |
| Bing Webmaster Tools | 以 `BingSiteAuth.xml` + `<meta name="msvalidate.01">` 驗證 |
| GEO／SEO 檔案 | `robots.txt`（明確放行 GPTBot／ClaudeBot／PerplexityBot 等）、`sitemap.xml`（含 hreflang）、`llms.txt`（給 LLM 的摘要） |
| 結構化資料 | index：Person／Organization／Course／Book／FAQPage／WebSite；training：WebPage＋Breadcrumb；en：ProfilePage＋Person |

## 目錄

```
index.html            首頁
training.html         授課紀錄頁（清單由 assets/data/trainings.js 驅動）
en/index.html         英文摘要頁（獨立維護，改數字時記得同步）
teach/index.html      /teach 轉址
404.html              自訂 404（導回首頁）
assets/css/site.css   全站樣式（深淺色）
assets/js/site-fx.js  粒子背景、reveal 動畫
assets/js/trainings.js   授課紀錄渲染與篩選（index／training 共用）
assets/data/trainings.js 授課紀錄資料（唯一資料來源）
assets/img, assets/logos 圖片（webp）
scripts/              維護腳本（見下）
Logo/                 知識遊牧 logo
```

## 維護流程

### 新增／修改授課紀錄
1. 編輯 `assets/data/trainings.js`（`TRAINING_DATA` 與產業對照 `TRAINING_INDUSTRY`）
2. 執行 `node scripts/prerender-trainings.js`
   把清單預先渲染成靜態 HTML 寫進 index／training 的 `#timeline-wrap`（兩個 `<!-- prerender -->` 標記之間），讓不跑 JS 的爬蟲（GPTBot 等）也看得到；瀏覽器載入後 JS 仍會重繪並接手篩選。
3. commit index.html、training.html、trainings.js

> 已安裝 pre-commit hook 會自動做第 2 步（並順帶更新 `dateModified`／`lastmod`）；新 clone 後執行 `sh scripts/install-hooks.sh` 重新安裝。

### 新增圖片
放進 `assets/img`／`assets/logos`（建議 webp），寫好 `<img>` 後執行 `python3 scripts/add-img-dimensions.py` 自動補 `width/height`（防止版面跳動）。SVG 會略過。

### 結構化資料的更新時間（自動）
`index.html`／`en/index.html`／`training.html` 的 JSON-LD 都有 `dateModified`，`sitemap.xml` 有 `lastmod`。**pre-commit hook 會自動更新，平常不用手動改。**

`scripts/update-modified-dates.py` 的規則：

| 你改了什麼 | 會被更新的頁面 |
|---|---|
| `index.html` | 首頁 |
| `en/index.html` | 英文頁 |
| `training.html` | 授課紀錄頁 |
| `assets/data/trainings.js` | 首頁＋授課紀錄頁（英文頁沒有這份資料） |
| 其他 `assets/**`（CSS／JS／圖） | 三頁全部 |

手動執行：

```
python3 scripts/update-modified-dates.py --all      # 三頁全更新
python3 scripts/update-modified-dates.py --check    # 只檢查格式（CI／除錯用）
```

> ⚠️ `dateModified` 一定要用**完整 ISO 8601 含時區**（`2026-08-23T19:44:00+08:00`）。只寫日期 `2026-08-23` 會被 Google 判為「datetime 值無效」——Search Console 曾因此回報過 Profile Page 結構化資料錯誤。`sitemap.xml` 的 `lastmod` 則用純日期即可（W3C Datetime 規範允許）。

### 更新線上課程數字
Hahow 學員數／評價數目前分散在：`index.html` 課程卡、`index.html` JSON-LD、`en/index.html`、`llms.txt`。改一處請四處同步。

### 英文頁
`en/index.html` 是摘要而非逐句翻譯，共用同一套 CSS；hreflang 在兩頁 `<head>` 與 `sitemap.xml` 都有宣告。

### 聯絡表單寄信
首頁與授課紀錄頁的 CONTACT 表單由 `assets/js/contact-form.js` 直打代寄 API（免 API Key）。`https://www.visualization.tw` 與本機 localhost 已在 CORS 白名單。

- 規格：`mail-api.md`
- 收件人鎖定 `knowledge.nomads.tw2@gmail.com`（API 不能指定其他人）
- 姓名／Email 會寫進內文 Markdown，方便回覆
- 第一次呼叫若遇到 Render 冷啟動，可能要等 30～50 秒；失敗會顯示原因，不會開啟郵件軟體

## 本機預覽

```
python3 -m http.server 8931
# http://localhost:8931/
```

手機版檢查可用 iframe 模擬：建立一個含 `<iframe src="index.html" width="390" height="844">` 的測試頁（不要 commit）。

## 待辦／備忘
- 2026-11-03：Hahow「AI × Python 自動化分析實戰」開課後，把課程卡「募資中」改成星等與人數
- 每週看一次 Search Console 索引狀態，Strikingly 時期的舊快照會逐步被替換
