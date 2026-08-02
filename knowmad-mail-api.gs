/**
 * 知識遊牧寄信 API（Google Apps Script）
 * 用途：個人網站「合作洽詢」表單 → 寄信到 foxfirejack@gmail.com
 *
 * 部署步驟（約 3 分鐘）：
 * 1. 開啟 https://script.google.com → 新增專案，命名「知識遊牧寄信API」
 * 2. 貼上本檔全部內容，儲存
 * 3. 右上「部署」→「新增部署作業」→ 類型選「網路應用程式」
 *    - 說明：mail-api v1
 *    - 執行身分：我（你的帳號）
 *    - 誰可以存取：任何人
 * 4. 按「部署」→ 首次會要求授權（進階 → 前往專案 → 允許）
 * 5. 複製「網路應用程式 URL」（https://script.google.com/macros/s/xxx/exec）
 *    → 貼回 index.html 的 MAIL_API_URL，或直接丟給 Claude 幫你填
 */

const TO_EMAIL = 'foxfirejack@gmail.com';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // 基本驗證
    if (!data.name || !data.contact || !data.msg) {
      return respond({ ok: false, error: 'missing fields' });
    }
    // 簡易防濫用：長度限制
    const clip = (s, n) => String(s || '').slice(0, n);

    const name = clip(data.name, 50);
    const org = clip(data.org, 100) || '—';
    const contact = clip(data.contact, 100);
    const type = clip(data.type, 20) || '其他';
    const msg = clip(data.msg, 3000);

    const subject = '【' + type + '】網站合作洽詢 - ' + name + (org !== '—' ? '（' + org + '）' : '');
    const body =
      '收到來自個人網站的合作洽詢：\n\n' +
      '稱呼：' + name + '\n' +
      '單位：' + org + '\n' +
      '聯絡方式：' + contact + '\n' +
      '合作類型：' + type + '\n\n' +
      '需求說明：\n' + msg + '\n\n' +
      '——\n寄送時間：' + new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }) + '\n' +
      '來源：https://knowmad-tw.github.io/foxfirejack-resume/';

    MailApp.sendEmail({
      to: TO_EMAIL,
      subject: subject,
      body: body,
      name: '知識遊牧網站表單',
    });

    return respond({ ok: true });
  } catch (err) {
    return respond({ ok: false, error: String(err) });
  }
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
