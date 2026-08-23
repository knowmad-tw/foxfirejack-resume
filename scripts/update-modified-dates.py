#!/usr/bin/env python3
"""依變更的檔案，更新對應頁面 JSON-LD 的 dateModified 與 sitemap.xml 的 lastmod。

由 pre-commit hook 呼叫，也可以手動執行。

用法：
  python3 scripts/update-modified-dates.py index.html en/index.html   # 只更新指定頁面
  python3 scripts/update-modified-dates.py --all                      # 三頁全更新
  python3 scripts/update-modified-dates.py --check                    # 只檢查格式，不改檔

規則：
  - 直接改到某個頁面 → 只更新該頁
  - 改到 assets/ 共用資源（CSS / JS / 圖）→ 三頁全更新
  - dateModified 用完整 ISO 8601 +08:00（Google Profile Page 規格要求，純日期會被判無效）
  - sitemap 的 lastmod 依 W3C Datetime 用純日期即可

輸出：實際被修改的檔案路徑，一行一個（給 hook 拿去 git add）。
"""
import os
import re
import sys
from datetime import datetime, timedelta, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TPE = timezone(timedelta(hours=8))

# 頁面 → sitemap 的 <loc>
PAGES = {
    "index.html": "https://www.visualization.tw/",
    "en/index.html": "https://www.visualization.tw/en/",
    "training.html": "https://www.visualization.tw/training.html",
}

DT_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$")

# 只影響部分頁面的共用資源（其餘 assets/ 一律視為影響全部頁面）
SCOPED_ASSETS = {
    "assets/data/trainings.js": ["index.html", "training.html"],  # 授課紀錄只出現在中文頁
}


def targets_for(changed):
    """把變更檔案清單對應到需要更新的頁面。"""
    pages = set()
    for path in changed:
        path = path.strip().lstrip("./")
        if not path:
            continue
        if path in PAGES:
            pages.add(path)
        elif path in SCOPED_ASSETS:
            pages.update(SCOPED_ASSETS[path])
        elif path.startswith("assets/"):
            # 共用 CSS / JS / 圖片改動會影響全部頁面
            pages.update(PAGES)
    return sorted(pages)


def update_page(page, stamp):
    """更新單一頁面的 dateModified。回傳是否有實際改動。"""
    path = os.path.join(ROOT, page)
    if not os.path.exists(path):
        return False
    html = open(path, encoding="utf-8").read()
    new, n = re.subn(r'("dateModified"\s*:\s*")[^"]*(")', r"\g<1>" + stamp + r"\g<2>", html)
    if n == 0:
        print(f"[dates] 警告：{page} 找不到 dateModified 欄位", file=sys.stderr)
        return False
    if new == html:
        return False
    open(path, "w", encoding="utf-8").write(new)
    return True


def update_sitemap(pages, day):
    """更新 sitemap.xml 中對應 <url> 區塊的 lastmod。回傳是否有實際改動。"""
    path = os.path.join(ROOT, "sitemap.xml")
    if not os.path.exists(path):
        return False
    xml = open(path, encoding="utf-8").read()
    original = xml
    for page in pages:
        loc = PAGES[page]

        def bump(m):
            return re.sub(r"<lastmod>[^<]*</lastmod>", f"<lastmod>{day}</lastmod>", m.group(0))

        # 只動包含這個 <loc> 的那一段 <url>...</url>
        xml, n = re.subn(
            r"<url>(?:(?!</url>).)*?<loc>" + re.escape(loc) + r"</loc>(?:(?!</url>).)*?</url>",
            bump,
            xml,
            flags=re.S,
        )
        if n == 0:
            print(f"[dates] 警告：sitemap.xml 找不到 {loc}", file=sys.stderr)
    if xml == original:
        return False
    open(path, "w", encoding="utf-8").write(xml)
    return True


def check():
    """驗證三頁所有日期欄位都是合法的完整 ISO 8601，回傳 exit code。"""
    bad = 0
    for page in PAGES:
        path = os.path.join(ROOT, page)
        if not os.path.exists(path):
            continue
        html = open(path, encoding="utf-8").read()
        found = re.findall(r'"(dateModified|dateCreated|datePublished)"\s*:\s*"([^"]*)"', html)
        if not found:
            print(f"[dates] {page}：沒有日期欄位")
            continue
        for key, value in found:
            ok = bool(DT_PATTERN.match(value))
            print(f"[dates] {'OK ' if ok else '!! '} {page} {key} = {value}")
            if not ok:
                bad += 1
    return 1 if bad else 0


def main():
    args = [a for a in sys.argv[1:] if a]
    if "--check" in args:
        return check()

    if "--all" in args:
        pages = sorted(PAGES)
    else:
        pages = targets_for(args)
    if not pages:
        return 0

    now = datetime.now(TPE)
    stamp = now.strftime("%Y-%m-%dT%H:%M:%S+08:00")
    day = now.strftime("%Y-%m-%d")

    touched = [p for p in pages if update_page(p, stamp)]
    if update_sitemap(pages, day):
        touched.append("sitemap.xml")

    for path in touched:
        print(path)
    return 0


if __name__ == "__main__":
    sys.exit(main())
