# -*- coding: utf-8 -*-
"""precrop_images.py — image anti-distortion pre-cropping

Rule: pptxgenjs `sizing:{type:'cover'}` is not written into the XML, so images get hard-stretched
to the placement box ratio. Fix: crop every image to the exact box aspect ratio BEFORE embedding
(EXIF auto-orient + focal framing + low-res Lanczos upscale); place with a ratio-matched box and
no `sizing` option.

用法:
  python3 precrop_images.py                    # 读取 ./precrop_jobs.json
  python3 precrop_images.py path/to/jobs.json  # 指定清单

jobs.json 格式（src 相对本目录或绝对路径）:
[
  {"src": "assets/machu.jpg", "box_w": 5.10, "box_h": 7.50, "focal": 0.45},
  ...
]
- box_w/box_h : 放置框尺寸(英寸)，只取其宽高比
- focal       : 裁上下时的取景焦点 0=顶部 0.5=居中 1=底部（裁左右时恒为中心）
输出: <stem>_c.jpg（同名目录），并打印逐张核对表。
"""
import json, os, sys
from PIL import Image, ImageOps

def run(jobs_path):
    base = os.path.dirname(os.path.abspath(jobs_path))
    jobs = json.load(open(jobs_path, encoding='utf-8'))
    ok = True
    for j in jobs:
        src = j['src'] if os.path.isabs(j['src']) else os.path.join(base, j['src'])
        focal = float(j.get('focal', 0.5))
        bw, bh = float(j['box_w']), float(j['box_h'])
        target = bw / bh
        im = Image.open(src)
        im = ImageOps.exif_transpose(im).convert('RGB')
        sw, sh = im.size
        cur = sw / sh
        if abs(cur - target) > 0.005:
            if cur > target:                      # 图偏宽 → 裁左右(居中)
                nw = int(round(sh * target)); x0 = (sw - nw) // 2
                im = im.crop((x0, 0, x0 + nw, sh))
            else:                                 # 图偏高 → 裁上下(按焦点)
                nh = int(round(sw / target))
                cy = int(sh * focal)
                y0 = max(0, min(sh - nh, cy - nh // 2))
                im = im.crop((0, y0, sw, y0 + nh))
        w, h = im.size
        if max(w, h) < 1400:                      # 低分辨率补放大
            k = min(2.0, 1400 / max(w, h))
            im = im.resize((int(w * k), int(h * k)), Image.LANCZOS)
        # 终裁对齐：resize 取整会引入亚像素比例漂移，超容差时裁1-2像素对齐框比
        w, h = im.size
        if abs(w / h - target) > 0.003:
            if w / h > target:
                nw = int(round(h * target)); x0 = (w - nw) // 2
                im = im.crop((x0, 0, x0 + nw, h))
            else:
                nh = int(round(w / target)); y0 = (h - nh) // 2
                im = im.crop((0, y0, w, y0 + nh))
        stem, _ = os.path.splitext(src)
        dest = stem + '_c.jpg'
        im.save(dest, 'JPEG', quality=88, optimize=True)
        err = abs(im.size[0] / im.size[1] - target)
        flag = 'OK' if err < 0.005 else 'RATIO_DRIFT'
        ok = ok and flag == 'OK'
        print(f"[{flag}] {os.path.basename(src)} {sw}x{sh} -> {im.size[0]}x{im.size[1]} "
              f"(框比 {target:.3f} / 图比 {im.size[0]/im.size[1]:.3f}) -> {os.path.basename(dest)}")
    print('PRECROP:', 'PASS' if ok else 'FAIL')
    return 0 if ok else 1

if __name__ == '__main__':
    p = sys.argv[1] if len(sys.argv) > 1 else 'precrop_jobs.json'
    sys.exit(run(p))
