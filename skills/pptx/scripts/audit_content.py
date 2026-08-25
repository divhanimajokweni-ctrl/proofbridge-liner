# -*- coding: utf-8 -*-
"""audit_content.py — content fidelity & density audit (brief -> build)

Rules:
  1) Per-page text volume >= density floor:
     - CJK page (code block has >=40 CJK chars): CJK char floor 120/220/300
     - non-CJK page: word floor 70/130/175 (speaker-led / reading-first / data-dense)
     - cover / section / closing pages auto-exempt (by title/layout keywords, zh or en)
     - pages whose own task_brief is too thin to demand volume (<60 CJK AND <25 words) are exempt
  2) Every number string and CJK-quoted phrase in task_brief must appear in the code (hard FAIL)
  3) English proper nouns match case-insensitively (WARN only; alternative translations allowed)

Convention: each page of generate.js must open with an `S{page_number}` comment marker,
either `// S{n} title` or `/* === S{n} title === */`. Zero markers found = hard FAIL.

Usage:
  python3 audit_content.py <generate.js> <slides_brief.json>
Output: per-page table + PASS/FAIL. FAIL -> back to Stage 4; delivery forbidden.
"""
import json, re, sys

CJK_FLOOR = {'speaker-led': 120, 'reading-first': 220, 'data-dense': 300}
WORD_FLOOR = {'speaker-led': 70, 'reading-first': 130, 'data-dense': 175}

def cn(s): return len(re.findall(r'[\u4e00-\u9fff]', s))
def words(s): return len(re.findall(r"[A-Za-z][A-Za-z'\-]*", s))

def split_pages(gen):
    """Split by S{n} comment markers (// or /* styles) -> {page_number: code_block}"""
    marks = [(int(m.group(1)), m.start()) for m in re.finditer(r'(?:/\*|//)[=\s]*S(\d+)\b', gen)]
    pages = {}
    for i, (num, pos) in enumerate(marks):
        end = marks[i + 1][1] if i + 1 < len(marks) else len(gen)
        pages[num] = gen[pos:end]
    return pages

def facts_from(tb):
    tb = re.sub(r'(?<![0-9A-Za-z])[0-9A-Fa-f]{6}(?![0-9A-Za-z])', ' ', tb)  # strip hex colors (lookaround: \b breaks on CJK)
    nums = set(re.findall(r'\d+(?:\.\d+)?', tb))                 # number strings (hard)
    zh = set(re.findall(r'「([^」]{2,12})」', tb))                # CJK-quoted phrases (hard)
    en = {t.strip() for t in re.findall(r'[A-Za-z][A-Za-z .\-]{3,}', tb)}  # English terms (WARN)
    return nums, zh, en

def main(gen_path, brief_path):
    gen = open(gen_path, encoding='utf-8').read()
    try:
        brief = json.load(open(brief_path, encoding='utf-8'))
    except json.JSONDecodeError as e:
        print(f"[FAIL] slides_brief.json is not valid JSON: {e.msg} at line {e.lineno} col {e.colno}")
        print("       Common cause: missing trailing comma in a task_brief line. Fix the brief and re-run.")
        sys.exit(2)
    mode = str(brief.get('density_mode') or '')
    if not mode:  # fallback: density may live in meta
        d = str((brief.get('meta') or {}).get('density', ''))
        mode = next((k for k in CJK_FLOOR if k in d), 'reading-first')
    cjk_floor = CJK_FLOOR.get(mode, 220)
    word_floor = WORD_FLOOR.get(mode, 130)
    pages = split_pages(gen)
    print(f"density_mode={mode} floors: {cjk_floor} CJK chars | {word_floor} words | "
          f"code blocks={len(pages)} | brief slides={len(brief['slides'])}")
    if not pages:
        print('AUDIT: FAIL — no S{n} page markers found in generate.js (convention violated); back to Stage 4')
        return 1
    all_ok = True
    for i, s in enumerate(brief['slides'], 1):
        tb = s.get('task_brief') or s.get('key_points') or ''
        if isinstance(tb, list): tb = ' '.join(str(x) for x in tb)
        block = pages.get(i, '')
        norm = block.replace(',', '').replace('，', '')   # number match ignores thousands separators
        title = s.get('title', '')
        layout = (s.get('layout', '') + ' ' + s.get('visual_form', '')).lower()
        tl = title.lower()
        is_cover = ('封面' in title) or ('cover' in layout and 'section' not in layout)
        is_section = ('章节' in title) or ('section' in layout)
        is_closing = ('尾页' in title) or ('致谢' in title) or ('closing' in layout) or ('thanks' in tl) or ('thank you' in tl)
        cjk_n, w_n = cn(block), words(block)
        is_cjk = cjk_n >= 40
        n, unit, base = (cjk_n, 'cjk', cjk_floor) if is_cjk else (w_n, 'w', word_floor)
        sec_floor = max(base // 2, 110 if is_cjk else 55)
        pg_floor = 0 if (is_cover or is_closing) else (sec_floor if is_section else base)
        nums, zh, en = facts_from(tb)
        miss_n = sorted(x for x in nums if x not in norm and x not in block)
        miss_z = sorted(x for x in zh if x not in block)
        low = gen.lower()
        warn_en = sorted(x for x in en if x.lower() not in low)
        brief_thin = cn(tb) < 60 and words(tb) < 25
        thin = pg_floor > 0 and not brief_thin and n < pg_floor
        hard_miss = (miss_n and not is_section) or miss_z or thin   # section pages: numbers downgraded to WARN
        if is_section and miss_n:
            warn_en = warn_en + ['nums restated: ' + '/'.join(miss_n[:3])]
        all_ok = all_ok and not hard_miss
        tag = 'FAIL' if hard_miss else 'PASS'
        bits = []
        if thin: bits.append(f'✗volume {n}{unit} < {pg_floor}')
        if miss_n: bits.append('✗missing nums: ' + '/'.join(miss_n[:4]))
        if miss_z: bits.append('✗missing phrases: ' + '/'.join(miss_z[:4]))
        if warn_en: bits.append('△en renamed: ' + '/'.join(warn_en[:3]))
        print(f"S{i:>2} {title[:14]:<16} {n:>4}{unit} {'✓' if not thin else '✗'} | "
              f"{'; '.join(bits) if bits else 'facts ✓ all carried'} | {tag}")
    print('AUDIT:', 'PASS — proceed to delivery' if all_ok else 'FAIL — back to Stage 4, then rerun')
    return 0 if all_ok else 1

if __name__ == '__main__':
    sys.exit(main(sys.argv[1], sys.argv[2]))
