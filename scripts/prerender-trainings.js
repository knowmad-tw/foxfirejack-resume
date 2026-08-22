#!/usr/bin/env node
/* 把 assets/data/trainings.js 的授課紀錄預先渲染成靜態 HTML，寫進
   index.html 與 training.html 的 #timeline-wrap（兩個 prerender 註解標記之間）。
   目的：不跑 JS 的爬蟲（GPTBot、ClaudeBot、PerplexityBot…）也讀得到完整紀錄；
   瀏覽器載入後 assets/js/trainings.js 仍會用同一份資料重繪並接手篩選互動。

   用法：node scripts/prerender-trainings.js
   （每次修改 assets/data/trainings.js 之後都要再跑一次） */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'assets/data/trainings.js'), 'utf8'), sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'assets/js/trainings.js'), 'utf8'), sandbox);

const { TRAINING_DATA, Trainings } = sandbox.window;
function render(opts){
  const wrap = { innerHTML: '' };
  Trainings.renderTimeline(wrap, TRAINING_DATA, opts);
  return wrap.innerHTML;
}

const targets = [
  { file: 'index.html', opts: {} },
  { file: 'training.html', opts: { openYears: ['2026', '2025'] } },
];

const START = '<!-- prerender:start（由 scripts/prerender-trainings.js 產生，請勿手改） -->';
const END = '<!-- prerender:end -->';

targets.forEach(({ file, opts }) => {
  const p = path.join(root, file);
  let html = fs.readFileSync(p, 'utf8');
  const block = START + '\n' + render(opts) + '\n' + END;
  if (html.includes(START)) {
    const re = new RegExp(escapeRe(START) + '[\\s\\S]*?' + escapeRe(END));
    html = html.replace(re, block);
  } else {
    const anchor = '<div id="timeline-wrap">';
    if (!html.includes(anchor + '</div>')) throw new Error(file + ': 找不到空的 #timeline-wrap');
    html = html.replace(anchor + '</div>', anchor + '\n' + block + '\n</div>');
  }
  fs.writeFileSync(p, html);
  const n = TRAINING_DATA.reduce((s, y) => s + y.items.length, 0);
  console.log(file + ': 已寫入 ' + TRAINING_DATA.length + ' 個年份、' + n + ' 筆紀錄');
});

function escapeRe(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
