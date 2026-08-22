#!/usr/bin/env python3
"""幫 index.html / training.html 裡缺少 width/height 的本機 <img> 補上原始像素尺寸（CLS 優化）。
用法：python3 scripts/add-img-dimensions.py   （新增圖片後可重跑，已有尺寸的不會動）"""
import re, subprocess, os, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def dims(path):
    if path.lower().endswith('.svg'):
        return None
    out = subprocess.run(['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', path], capture_output=True, text=True).stdout
    m = re.findall(r'pixel(Width|Height): (\d+)', out)
    d = {k: int(v) for k, v in m}
    return (d.get('Width'), d.get('Height')) if d.get('Width') and d.get('Height') else None

for fn in ['index.html', 'training.html']:
    p = os.path.join(root, fn)
    html = open(p, encoding='utf-8').read()
    n = 0
    def fix(m):
        global n
        tag = m.group(0)
        if re.search(r'\swidth=|\sheight=', tag):
            return tag
        src = re.search(r'src="([^"]+)"', tag)
        if not src or src.group(1).startswith(('http', 'data:')):
            return tag
        f = os.path.join(root, src.group(1))
        if not os.path.exists(f):
            return tag
        d = dims(f)
        if not d:
            return tag
        n += 1
        return tag[:-1] + f' width="{d[0]}" height="{d[1]}">'
    html = re.sub(r'<img\b[^>]*>', fix, html)
    open(p, 'w', encoding='utf-8').write(html)
    print(f'{fn}: 補上 {n} 張圖片尺寸')
