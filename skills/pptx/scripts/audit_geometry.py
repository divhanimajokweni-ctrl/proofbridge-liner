# -*- coding: utf-8 -*-
"""audit_geometry.py — page-bounds & text-overlap audit (unpacks the .pptx; font-independent, objective)

Checks every sp/pic/graphicFrame in the slide XML:
  A) Page bounds: x >= -tol, y >= -tol, x+w <= W+tol, y+h <= H+tol (default tol 0.03in)
  B) Text overlap: two text-bearing shapes whose intersection > 12% x the smaller one AND
     mutual intrusion > 0.03in (text-free cards/backgrounds are exempt from B — text over a
     card is legitimate layering)

用法:
  python3 audit_geometry.py <file.pptx> [--tol 0.03]
输出: 逐页 PASS/违规明细 + 总结。exit 0=PASS / 1=FAIL（FAIL 禁止交付，回 Stage 4 修坐标）
"""
import sys, os, re, shutil, tempfile, zipfile
import xml.etree.ElementTree as ET

NS = {'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
      'p': 'http://schemas.openxmlformats.org/presentationml/2006/main'}
EMU = 914400.0  # EMU per inch


def slide_size(zf):
    root = ET.fromstring(zf.read('ppt/presentation.xml'))
    sz = root.find('p:sldSz', NS)
    return int(sz.get('cx')) / EMU, int(sz.get('cy')) / EMU


def shapes_of(spTree):
    """直系子级 sp / pic / graphicFrame → (tag, x, y, w, h, text)"""
    out = []
    for tag in ('p:sp', 'p:pic', 'p:graphicFrame'):
        for el in spTree.findall(tag, NS):
            xf = el.find('.//a:xfrm', NS)
            if xf is None:
                continue
            off, ext = xf.find('a:off', NS), xf.find('a:ext', NS)
            if off is None or ext is None:
                continue
            x, y = int(off.get('x')) / EMU, int(off.get('y')) / EMU
            w, h = int(ext.get('cx')) / EMU, int(ext.get('cy')) / EMU
            text = ''.join(t.text or '' for t in el.findall('.//a:t', NS)).strip()
            out.append((tag.split(':')[1], x, y, w, h, text))
    return out


def audit(path, tol=0.03):
    zf = zipfile.ZipFile(path)
    W, H = slide_size(zf)
    slides = sorted((n for n in zf.namelist()
                     if re.fullmatch(r'ppt/slides/slide\d+\.xml', n)),
                    key=lambda n: int(re.search(r'\d+', n).group()))
    n_bad = 0
    print(f"页尺寸 {W:.2f}×{H:.2f}in · 共 {len(slides)} 页 · 容差 ±{tol}in")
    for s in slides:
        num = int(re.search(r'\d+', s).group())
        spTree = ET.fromstring(zf.read(s)).find('.//p:cSld/p:spTree', NS)
        items = shapes_of(spTree)
        bad = []
        # A) 页界
        for kind, x, y, w, h, text in items:
            if x < -tol:
                bad.append(f"✗ 出左页边: ({kind}) x={x:.2f} 「{text[:12]}」")
            if y < -tol:
                bad.append(f"✗ 出上页边: ({kind}) y={y:.2f} 「{text[:12]}」")
            if x + w > W + tol:
                bad.append(f"✗ 出右页边: ({kind}) x+w={x + w:.2f}>{W:.2f} 「{text[:12]}」")
            if y + h > H + tol:
                bad.append(f"✗ 出下页边: ({kind}) y+h={y + h:.2f}>{H:.2f} 「{text[:12]}」")
        # B) 文本重叠（仅含文本形状之间）
        texts = [it for it in items if it[5]]
        for i in range(len(texts)):
            for j in range(i + 1, len(texts)):
                _, x1, y1, w1, h1, t1 = texts[i]
                _, x2, y2, w2, h2, t2 = texts[j]
                ix = min(x1 + w1, x2 + w2) - max(x1, x2)
                iy = min(y1 + h1, y2 + h2) - max(y1, y2)
                if ix > tol and iy > tol:
                    inter = ix * iy
                    smaller = min(w1 * h1, w2 * h2)
                    if smaller > 0 and inter > 0.12 * smaller:
                        bad.append(f"✗ 文本重叠 {inter / smaller:.0%}: 「{t1[:10]}」×「{t2[:10]}」")
        if bad:
            n_bad += 1
            print(f"S{num}: FAIL")
            for b in bad:
                print(f"   {b}")
        else:
            print(f"S{num}: PASS")
    ok = n_bad == 0
    print('GEOMETRY AUDIT:', 'PASS — 可进入视觉质检' if ok
          else f'FAIL — {n_bad} 页存在几何违规，回 Stage 4 修坐标后重跑')
    return 0 if ok else 1


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    tol = 0.03
    if '--tol' in sys.argv:
        tol = float(sys.argv[sys.argv.index('--tol') + 1])
    sys.exit(audit(sys.argv[1], tol))
