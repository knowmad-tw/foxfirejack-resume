/* 背景粒子動畫 + 進場淡入（index.html 與 training.html 共用） */
(function(){
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cv = document.getElementById('particles'), cx = cv.getContext('2d');
  let W, H, ps = [], mouse = {x:-9999, y:-9999};
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  function resize(){
    W = innerWidth; H = innerHeight;
    cv.width = W * DPR; cv.height = H * DPR;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    cx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const N = Math.min(110, Math.floor(W / 14));
    ps = Array.from({length: N}, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35,
      r: Math.random() * 1.8 + .8,
      c: (document.documentElement.getAttribute('data-theme')==='dark') ? (Math.random() < .5 ? '159,195,232' : '109,182,221') : (Math.random() < .5 ? '35,51,99' : '46,126,166')
    }));
  }
  addEventListener('resize', resize); resize();
  addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  addEventListener('pointerleave', () => { mouse.x = -9999; mouse.y = -9999; });
  const LINK = 140;
  function tick(){
    cx.clearRect(0, 0, W, H);
    for (const p of ps){
      p.x += p.vx; p.y += p.vy;
      if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
      if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx*dx + dy*dy;
      if (d2 < 22500){ const d = Math.sqrt(d2) || 1, f = (150 - d) / 150 * .6; p.x += dx / d * f; p.y += dy / d * f; }
      cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.2832);
      cx.fillStyle = 'rgba(' + p.c + ',.55)'; cx.fill();
    }
    for (let i = 0; i < ps.length; i++){
      for (let j = i + 1; j < ps.length; j++){
        const a = ps[i], b = ps[j], dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx*dx + dy*dy;
        if (d2 < LINK * LINK){
          const alpha = (1 - Math.sqrt(d2) / LINK) * .16;
          cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y);
          cx.strokeStyle = (document.documentElement.getAttribute('data-theme')==='dark' ? 'rgba(159,195,232,' : 'rgba(35,51,99,') + alpha.toFixed(3) + ')';
          cx.lineWidth = 1; cx.stroke();
        }
      }
    }
    if (!document.hidden) requestAnimationFrame(tick); else setTimeout(tick, 300);
  }
  tick();
})();
(function(){
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
  }), {threshold: .1, rootMargin: '0px 0px -40px 0px'});
  const sels = '.pillar,.course-card,.book,.stats-row,.logo-cell,details.year-block,.photo-strip img,.about-grid > *,.edu-list,section h2,.section-lead,.contact-inner';
  document.querySelectorAll(sels).forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = (i % 5) * 70 + 'ms';
    io.observe(el);
  });
})();

/* 點擊複製（data-copy="要複製的文字"）＋ 底部提示 */
(function(){
  let toast, timer;
  function showToast(msg){
    if (!toast){
      toast = document.createElement('div');
      toast.className = 'copy-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(() => toast.classList.remove('show'), 2200);
  }
  async function copyText(text){
    try { await navigator.clipboard.writeText(text); return true; }
    catch(e){
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', '');
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch(_){}
      ta.remove(); return ok;
    }
  }
  document.addEventListener('click', async e => {
    const el = e.target.closest('[data-copy]');
    if (!el) return;
    e.preventDefault();
    const text = el.getAttribute('data-copy');
    el.classList.add('copied');
    setTimeout(() => el.classList.remove('copied'), 1200);
    showToast('已複製 ' + text + ' ✓');
    const ok = await copyText(text);
    if (!ok) showToast('複製失敗，請手動選取：' + text);
  });
})();
