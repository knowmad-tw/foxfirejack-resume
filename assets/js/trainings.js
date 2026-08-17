/* 授課紀錄渲染與篩選（index.html 與 training.html 共用）
   依賴 assets/data/trainings.js 提供的 window.TRAINING_DATA。*/
(function(){
  const PATTERNS = {
    ai: /AI|ChatGPT|GPT|GenAI|生成式|Claude|AIGC|詠唱|LLM|Vibe Coding|人工智慧/i,
    viz: /Tableau|視覺化|商業圖表|資訊圖表|Data Visualization|Looker|Data Studio|儀表板|地圖|簡報設計/i,
    data: /數據思維|數據分析|資料分析|Excel|大數據|Data Thinking|商業數據|數據決策|數據驅動|Python/i,
    ux: /UX|UI|Figma|設計思考|體驗設計|前端|RWD|介面|Design Thinking/i
  };

  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  /* 把資料畫成 details.year-block 結構
     opts.openAll：全部年份預設展開（獨立頁面用） */
  function renderTimeline(wrap, data, opts){
    if (!wrap || !data) return;
    opts = opts || {};
    wrap.innerHTML = data.map(y => {
      const open = opts.openAll ? ' open' : (y.open ? ' open' : '');
      const lis = y.items.map(i =>
        '<li><span class="tl-org">' + esc(i.org) + '</span>' +
        '<span class="tl-topic">' + esc(i.topic) + '</span>' +
        (i.role ? '<span class="tl-role">' + esc(i.role) + '</span>' : '') +
        '</li>'
      ).join('');
      return '<details class="year-block"' + open + '>' +
        '<summary>' + esc(y.year) + '<span class="count">' + esc(y.count) + '</span></summary>' +
        '<ul class="talk-list">' + lis + '</ul>' +
      '</details>';
    }).join('');
  }

  /* 類別按鈕 + （選用）關鍵字搜尋
     opts.searchInput：搜尋框元素
     opts.counter：顯示筆數的元素 */
  function initFilters(wrap, opts){
    if (!wrap) return;
    opts = opts || {};
    const items = Array.from(wrap.querySelectorAll('.talk-list li'));
    const blocks = Array.from(wrap.querySelectorAll('details.year-block'));
    const openState = blocks.map(b => b.open);
    const buttons = Array.from(document.querySelectorAll('.tl-filter'));
    let cat = 'all', kw = '';

    function apply(){
      const re = cat === 'all' ? null : PATTERNS[cat];
      const q = kw.trim().toLowerCase();
      let shown = 0;
      items.forEach(li => {
        const text = li.textContent;
        const hit = (!re || re.test(text)) && (!q || text.toLowerCase().includes(q));
        li.style.display = hit ? '' : 'none';
        if (hit) shown++;
      });
      const filtering = !!re || !!q;
      blocks.forEach((b, i) => {
        const any = Array.from(b.querySelectorAll('.talk-list li')).some(li => li.style.display !== 'none');
        b.style.display = any ? '' : 'none';
        b.open = filtering ? any : openState[i];
      });
      if (opts.counter) opts.counter.textContent = filtering
        ? '符合條件 ' + shown + ' 筆（共 ' + items.length + ' 筆紀錄）'
        : '共 ' + items.length + ' 筆紀錄';
      if (opts.empty) opts.empty.style.display = shown ? 'none' : 'block';
    }

    buttons.forEach(btn => btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      cat = btn.dataset.f;
      apply();
    }));

    if (opts.searchInput){
      opts.searchInput.addEventListener('input', () => { kw = opts.searchInput.value; apply(); });
    }
    apply();
    return { apply, items, blocks };
  }

  window.Trainings = { PATTERNS, renderTimeline, initFilters };
})();
