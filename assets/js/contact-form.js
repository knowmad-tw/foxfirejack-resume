/**
 * CONTACT 表單：瀏覽器直打知識遊牧代寄 API（免登入、免 API Key）。
 * 規格見 mail-api.md。收件人鎖定 knowledge.nomads.tw2@gmail.com。
 * 失敗時退回 mailto，讓訪客仍能寄到 foxfirejack@gmail.com。
 */
(function () {
  const MAIL_API_URL = 'https://knowmad-mail-backend.onrender.com/api/mail/send';
  const TO_EMAIL = 'foxfirejack@gmail.com';
  const TIMEOUT_MS = 60000;

  function clip(s, n) {
    return String(s || '').trim().slice(0, n);
  }

  function validEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  function setNote(el, html, kind) {
    if (!el) return;
    el.className = 'contact-form-note' + (kind ? ' contact-form-note--' + kind : '');
    el.innerHTML = html;
  }

  function buildMail(payload) {
    return {
      subject: '【visualization.tw 洽詢】' + payload.subject,
      content: [
        'visualization.tw 聯絡表單有新的洽詢。',
        '',
        '**姓名**：' + payload.name,
        '**Email**：' + payload.email,
        '**主旨**：' + payload.subject,
        '',
        payload.content,
        '',
        '請直接回覆對方的 Email。',
        '',
        '來源：https://www.visualization.tw/#contact',
      ].join('\n'),
    };
  }

  function mailtoFallback(payload) {
    const mail = buildMail(payload);
    location.href =
      'mailto:' + TO_EMAIL +
      '?subject=' + encodeURIComponent(mail.subject) +
      '&body=' + encodeURIComponent(mail.content);
  }

  async function postOnce(mail, signal) {
    const res = await fetch(MAIL_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mail),
      signal: signal,
    });
    const data = await res.json().catch(function () { return {}; });
    if (!res.ok) {
      throw new Error(data.detail || ('HTTP ' + res.status));
    }
    return data;
  }

  async function send(payload) {
    const mail = buildMail(payload);
    var lastError = null;
    for (var attempt = 0; attempt < 2; attempt++) {
      var ctrl = new AbortController();
      var timer = setTimeout(function () { ctrl.abort(); }, TIMEOUT_MS);
      try {
        return await postOnce(mail, ctrl.signal);
      } catch (err) {
        lastError = err;
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastError || new Error('send failed');
  }

  document.querySelectorAll('form.contact-form').forEach(function (form) {
    const note = form.querySelector('.contact-form-note');
    const btn = form.querySelector('[type="submit"]');
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const fd = new FormData(form);
      if (fd.get('website')) return;

      const payload = {
        name: clip(fd.get('name'), 50),
        email: clip(fd.get('email'), 100),
        subject: clip(fd.get('subject'), 120),
        content: clip(fd.get('content'), 3000),
      };

      form.querySelectorAll('.is-error').forEach(function (el) {
        el.classList.remove('is-error');
      });

      let invalid = false;
      ['name', 'email', 'subject', 'content'].forEach(function (key) {
        if (!payload[key]) {
          const field = form.elements[key];
          if (field) field.classList.add('is-error');
          invalid = true;
        }
      });
      if (payload.email && !validEmail(payload.email)) {
        form.elements.email.classList.add('is-error');
        setNote(note, '請輸入正確的 Email 格式。', 'error');
        return;
      }
      if (invalid) {
        setNote(note, '這個是必填項，請把欄位填完再送出。', 'error');
        return;
      }

      const prev = btn.textContent;
      btn.disabled = true;
      btn.textContent = '送出中…';
      setNote(note, '正在送出，請稍候（第一次可能需要 30～50 秒）。', '');
      try {
        await send(payload);
        form.reset();
        setNote(note, '已送出，我會盡快回覆你。', 'ok');
      } catch (err) {
        mailtoFallback(payload);
        setNote(
          note,
          '線上送出暫時失敗，已開啟郵件軟體。也可直接來信 <a href="mailto:foxfirejack@gmail.com">foxfirejack@gmail.com</a> 或加 Line：divaka',
          'error'
        );
      } finally {
        btn.disabled = false;
        btn.textContent = prev;
      }
    });
  });
})();
