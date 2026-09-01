/**
 * CONTACT 表單：瀏覽器直打知識遊牧代寄 API（免登入、免 API Key）。
 * 規格見 mail-api.md。收件人為 foxfirejack 與工作室信箱，兩位都放在 to。
 * project／source_url 為必填，後端會把 project 加成主旨前綴、把兩者寫進信件頁腳。
 */
(function () {
  const MAIL_API_URL = 'https://knowmad-mail-backend.onrender.com/api/mail/send';
  const MAIL_TO = ['foxfirejack@gmail.com', 'knowledge.nomads.tw2@gmail.com'];
  const PROJECT = 'visualization.tw 聯絡表單';
  const FALLBACK_SOURCE_URL = 'https://www.visualization.tw/#contact';
  const TIMEOUT_MS = 60000;

  function sourceUrl() {
    const href = (window.location && window.location.href) || '';
    return /^https?:\/\//i.test(href) ? href.slice(0, 300) : FALLBACK_SOURCE_URL;
  }

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
      to: MAIL_TO,
      project: PROJECT,
      source_url: sourceUrl(),
      subject: payload.subject,
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
      ].join('\n'),
    };
  }

  function explainError(err) {
    const msg = err && err.message ? String(err.message) : '';
    if (err && err.name === 'AbortError') {
      return '送出逾時。寄信服務剛睡醒時可能要等 30～50 秒，請再按一次送出。';
    }
    if (err && err.status >= 400 && err.status < 500 && msg) {
      return '送出失敗：' + msg;
    }
    if (/Failed to fetch|NetworkError|Load failed|Failed to load/i.test(msg)) {
      return '送出失敗：瀏覽器無法連到寄信服務（跨網域被擋或網路中斷）。請用 http://localhost:8931 開啟本頁，不要直接開 HTML 檔。';
    }
    return msg ? '送出失敗：' + msg : '送出失敗，請稍後再試，或加 Line：divaka';
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
      const err = new Error(data.detail || ('HTTP ' + res.status));
      err.status = res.status;
      throw err;
    }
    return data;
  }

  function shouldRetry(err) {
    if (!err) return false;
    if (err.name === 'AbortError') return true;
    if (err.status >= 500) return true;
    if (!err.status && /Failed to fetch|NetworkError|Load failed/i.test(err.message || '')) return true;
    return false;
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
        if (!shouldRetry(err) || attempt === 1) break;
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
        console.error('[contact-form]', err);
        setNote(note, explainError(err), 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = prev;
      }
    });
  });
})();
