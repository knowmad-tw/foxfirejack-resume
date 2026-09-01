# 代寄信 API 開發說明

給要從**其他網站／後端**觸發寄信的開發者。只需接一支端點，不必登入知識遊牧 AI 中心。

本站 CONTACT 表單由 `assets/js/contact-form.js` 以瀏覽器 `fetch` 直打這支 API（`https://www.visualization.tw` 與本機 localhost 已在 CORS 白名單）。

- **正式 Base URL**：`https://knowmad-mail-backend.onrender.com`
- **互動式文件**：https://knowmad-mail-backend.onrender.com/docs
- **本機**：`http://localhost:8025`

---

## 這支 API 能做什麼

你的伺服器（或瀏覽器）送出主旨與內文，知識遊牧的發信系統就會用工作室 Gmail 寄出一封信。

| 項目 | 說明 |
|------|------|
| 寄件帳號 | `knowledge.nomads.tw2@gmail.com`（固定，不可改） |
| 收件人 | 由你用 `to` 指定，數量不限；省略就寄給寄件帳號自己 |
| 內文格式 | Markdown（後端會轉成 HTML） |
| 認證 | **免登入、免 API Key**——直接 `POST` 即可 |
| 自報家門 | **必填**：`project`（哪一個專案）＋ `source_url`（哪一個網址） |
| 主旨 | 寄出時自動變成 `[專案名稱] 你的主旨` |
| 頁腳 | 系統會自動加上 `project`／`source_url`，表明這封信的來源 |

寄件人一律顯示為「自動發信系統 `<knowledge.nomads.tw2@gmail.com>`」，不能改成你的網域。收件人按回覆會回到工作室信箱，不是回到你。

---

## Endpoint

```
POST /api/mail/send
```

完整網址（正式）：

```
https://knowmad-mail-backend.onrender.com/api/mail/send
```

---

## Headers

| Header | 必填 | 說明 |
|--------|:----:|------|
| `Content-Type` | ✓ | `application/json` |

不需要 `Authorization`、不需要 `X-API-Key`。

---

## Body

```json
{
  "to": ["someone@example.com"],
  "project": "visualization.tw 聯絡表單",
  "source_url": "https://www.visualization.tw/contact",
  "subject": "通知標題",
  "content": "內文支援 **Markdown**\n\n也可使用 {date} 佔位符（會換成當天日期，Asia/Taipei）。"
}
```

| 欄位 | 型別 | 必填 | 說明 |
|------|------|:----:|------|
| `to` | string \| string[] | ✗ | 收件人 email，數量不限。省略就寄給寄件帳號自己（見下） |
| `project` | string | ✓ | 呼叫端專案名稱，80 字內。會加在主旨前面成為 `[專案名稱] 主旨` |
| `source_url` | string | ✓ | 呼叫端網址，300 字內，需 `http://` 或 `https://` 開頭 |
| `subject` | string | ✓ | 主旨；支援佔位符（見下） |
| `content` | string | ✗ | 內文 Markdown；同樣支援佔位符。省略就只會有系統頁腳 |

### 收件人 `to`

三種寫法都可以，會依 email 小寫去重：

```json
"to": "someone@example.com"                    // 單一
"to": "a@example.com, b@example.com"           // 逗號分隔
"to": ["a@example.com", "b@example.com"]       // 陣列
```

| 規則 | 說明 |
|------|------|
| 數量 | 不設上限。實際天花板是 Gmail 每日投遞量 |
| 省略／空值 | 寄給寄件帳號自己 `knowledge.nomads.tw2@gmail.com` |
| 多位收件人 | 全部放在 `to`，沒有副本／密件副本；收件人看得到彼此 |
| 格式 | 任一筆不像 email 就整個請求 `400`，不會「寄成功幾封」 |

本站表單固定寄給 `foxfirejack@gmail.com` 與 `knowledge.nomads.tw2@gmail.com`。

### 佔位符

`subject` 與 `content` 都會做代換，時間一律以**寄出當下**的 Asia/Taipei 計算。

| 佔位符 | 代換成 | 範例 |
|--------|--------|------|
| `{date}` | 西元日期 | `2026-09-01` |
| `{date_cn}` | 中文日期 | `2026年9月1日` |
| `{time}` | 時分 | `14:30` |
| `{datetime}` | 日期＋時分 | `2026-09-01 14:30` |
| `{weekday}` | 星期 | `週二` |
| `{year}` / `{month}` / `{day}` | 年／月／日（不補零） | `2026` / `9` / `1` |
| `{sender}` | 寄件帳號 | `knowledge.nomads.tw2@gmail.com` |
| `{task}` | 需求名稱 | `代寄信 API` |

**認不得的 `{xxx}` 會原樣保留**，不會被清掉也不會報錯。所以內文放 JSON 或程式碼片段是安全的，只要別剛好用到上表的名字。

---

## 範例

### curl

```bash
curl -X POST https://knowmad-mail-backend.onrender.com/api/mail/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": ["someone@example.com"],
    "project": "visualization.tw 聯絡表單",
    "source_url": "https://www.visualization.tw/contact",
    "subject": "通知 {date}",
    "content": "各位好：\n\n這是一封測試信。"
  }'
```

### JavaScript（瀏覽器 fetch）

來源網域必須在後端 CORS 白名單內（見下方）。

```js
await fetch("https://knowmad-mail-backend.onrender.com/api/mail/send", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    to: ["someone@example.com"],        // 省略就寄給工作室信箱
    project: "visualization.tw 聯絡表單",
    source_url: window.location.href,   // 或寫死實際頁面網址
    subject: "通知 {date}",
    content: "各位好：\n\n表單已送出。",
  }),
});
```

### 成功回應

```json
{ "detail": "已寄給 1 位收件人" }
```

### 常見錯誤

| HTTP | 說明 |
|------|------|
| `400` | 少填或格式不對（`project`／`source_url`／`subject`／`to`）、Gmail 寄送失敗 |
| `CORS error` | 瀏覽器呼叫時，來源網域不在白名單 |

`detail` 一定是可直接顯示給使用者的中文字串（字串，不是陣列）：

```json
{ "detail": "網址（source_url）需為 http:// 或 https:// 開頭的完整網址" }
```

```js
const res = await fetch(url, { /* … */ });
if (!res.ok) {
  const { detail } = await res.json();
  throw new Error(detail);          // detail 一定是可直接顯示的中文字串
}
```

伺服器端（curl、Node、Python）不受 CORS 限制。

---

## 瀏覽器跨網域（CORS）白名單

從網頁用 `fetch`／XHR 呼叫時，`Origin` 必須在白名單。目前內建包含：

| Origin | 說明 |
|--------|------|
| `https://knowmad-tw.github.io` | 知識遊牧前端 |
| `https://knowmad-mail-backend.onrender.com` | 後端自身 |
| `https://www.visualization.tw` | visualization.tw |

本機 `http://localhost`／`http://127.0.0.1`（任意 port）也放行。

要加其他正式網域，請通知後端在 `CORS_DEFAULT_ORIGINS` 或環境變數 `CORS_ORIGINS` 補上（完整字串、**不要**尾斜線）。

> CORS 白名單管的是「**哪個網頁**可以用瀏覽器打這支 API」，不是認證機制；伺服器端呼叫不受影響。

---

## 與發信後台的差別

| | 外部代寄 `POST /api/mail/send` | 後台各需求（需登入） |
|--|-------------------------------|----------------------|
| 認證 | 免登入 | Firebase 登入 |
| 收件人 | `to` 指定，數量不限 | 可設群組／個別 email |
| 內容 | 每次呼叫傳入 | 存在需求設定／範本 |
| 記錄 | `task_id=api-mail`、`mode=api`，另存 `project`／`source_url`／來源 IP | `manual`／`test`／`schedule` |

---

## 注意

### 內文裡的連結會被改寫成追蹤網址

`content` 寫的連結，寄出後在信裡會變成轉址網址，點下去才跳到原網址：

```
你寫的：   https://www.example.com/form
信裡變成： https://knowmad-mail-backend.onrender.com/r/api-mail/{記錄ID}/0
```

這是點擊追蹤，點擊數會記在發信記錄。原網址不會遺失、轉址是 302。**不想被改寫**就別用連結語法，直接把網址當純文字寫（前後不要有 `<>` 或 `[]()`）。

信末頁腳的「來源網址」本來就是純文字，不會被改寫也不會被追蹤。

### 其他

- Render 免費方案閒置會休眠，**第一次呼叫可能要等 30～50 秒**。建議 timeout 設 60 秒以上，並且失敗重試一次。
- 內文是 Markdown，不是 HTML；連結、粗體、列表可直接寫。
- 錯誤格式一律 `{ "detail": "訊息" }`（字串）+ 非 2xx。
