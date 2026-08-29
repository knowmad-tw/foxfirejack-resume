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
| 收件人 | **鎖定**為同一信箱，**不能指定其他人** |
| 內文格式 | Markdown（後端會轉成 HTML） |
| 認證 | **免登入、免 API Key**——直接 `POST` 即可 |
| 頁腳 | 系統會自動加上「此信件由系統自動發送。」 |

典型用途：表單送出通知、訂單／報名通知、系統事件提醒——信會進工作室信箱。

> **不要**用這支 API 寄給你自己的使用者。收件人無法指定。若需要寄給通訊錄裡的群組，請走發信後台的「群組發信」，不是這支外部 API。

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
  "subject": "通知標題",
  "content": "內文支援 **Markdown**\n\n也可使用 {date} 佔位符（會換成當天日期，Asia/Taipei）。"
}
```

| 欄位 | 型別 | 必填 | 說明 |
|------|------|:----:|------|
| `subject` | string | ✓ | 主旨；支援 `{date}` → `YYYY-MM-DD` |
| `content` | string | ✗ | 內文 Markdown；同樣支援 `{date}` |

不可傳 `to`／收件人欄位；傳了也會被忽略（收件人永遠鎖定）。

表單會把「個人姓名／個人 Email」寫進 `content`，主旨加上 `【visualization.tw 洽詢】` 前綴。

---

## 範例

### curl

```bash
curl -X POST https://knowmad-mail-backend.onrender.com/api/mail/send \
  -H "Content-Type: application/json" \
  -d '{
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
| `400` | 缺主旨、Gmail 寄送失敗等；body 為 `{ "detail": "…" }` |
| `CORS error` | 瀏覽器呼叫時，來源網域不在白名單 |

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

---

## 與發信後台的差別

| | 外部代寄 `POST /api/mail/send` | 後台各需求（需登入） |
|--|-------------------------------|----------------------|
| 認證 | 免登入 | Firebase 登入 |
| 收件人 | 鎖定固定信箱 | 可設群組／個別 email |
| 內容 | 每次呼叫傳入 | 存在需求設定／範本 |
| 記錄 | `task_id=api-mail`，`mode=api` | `manual`／`test`／`schedule` |

---

## 注意

- Render 免費方案閒置會休眠，**第一次呼叫可能要等 30～50 秒**。
- 內文是 Markdown，不是 HTML；連結、粗體、列表可直接寫。
- 錯誤格式一律 `{ "detail": "訊息" }` + 非 2xx。
