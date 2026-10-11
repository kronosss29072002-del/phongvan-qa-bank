#!/usr/bin/env python3
"""Render merged.json → backend-glossary.md (basic→advanced, grouped by domain)."""
import json, os, sys
from collections import OrderedDict

HERE = os.path.dirname(__file__)
REPO = os.path.dirname(HERE)

LEVEL_TITLES = {
    'basic': 'PHẦN 1 — NỀN TẢNG (basic)',
    'intermediate': 'PHẦN 2 — TRUNG CẤP (intermediate)',
    'advanced': 'PHẦN 3 — NÂNG CAO (advanced)',
}
LEVEL_BLURBS = {
    'basic': 'Những khái niệm gặp ngay tuần đầu đi làm: HTTP, SQL, Unix, biến dạng của request. Bỏ qua phần này thì mọi thứ phía trên xây trên cát.',
    'intermediate': 'Độ sâu của người đã chạy service thật: caching, queue, transaction, test strategy. Đây là nơi phân biệt người viết code với người vận hành hệ thống.',
    'advanced': 'Phân tán, đồng thời, thất bại từng phần — những thứ chỉ hiện ra khi hệ thống đủ lớn hoặc đủ căng. Đọc khi đã gặp đau thật, không đọc để thuộc lòng.',
}

# stable domain order: broad themes first
DOMAIN_ORDER = [
    'Mạng & Giao thức',
    'Thiết kế API',
    'Cơ sở dữ liệu & Lưu trữ',
    'Caching & Hiệu năng',
    'Hiệu năng',
    'Phân tán & Đồng thời',
    'Messaging & Bất đồng bộ',
    'Kiến trúc & Khả năng mở rộng',
    'Độ tin cậy & Quan sát được',
    'Bền vững & Chị tải',
    'Bảo mật & Xác thực',
    'Kiểm thử & Chất lượng',
    'DevOps & Triển khai',
]


def md_escape(s: str) -> str:
    return s.replace('\n', ' ').strip()


def render_entry(e: dict) -> list:
    out = [f"### {e['term']}"]
    al = [a for a in (e.get('aliases') or []) if a and a != e['term']]
    if al:
        out.append(f"*còn gọi: {', '.join(al)}*")
    out.append('')
    out.append(f"**Vấn đề khiến nó ra đời:** {md_escape(e.get('problem', ''))}")
    origin = md_escape(e.get('origin', ''))
    if origin:
        out.append(f"**Nguồn gốc:** {origin}")
    out.append(f"**Giải quyết thế nào:** {md_escape(e.get('how', ''))}")
    rel = [r for r in (e.get('related') or []) if r]
    if rel:
        out.append(f"*Liên quan: {', '.join(rel)}*")
    out.append('')
    return out


def main():
    entries = json.load(open(os.path.join(HERE, 'merged.json')))
    lines = [
        '# Thuật ngữ Backend/System — từ cơ bản đến nâng cao',
        '',
        '> Mỗi mục trả lời 2 câu hỏi: **vấn đề gì khiến thuật ngữ này được sinh ra**, và **nó giải quyết thế nào**.',
        f'> {len(entries)} thuật ngữ, sắp theo mức độ rồi theo chủ đề.',
        '',
        '## Cách đọc',
        '',
        '- **Vấn đề khiến nó ra đời** — bối cảnh đau thật (traffic, crash, tranh chấp, lỗ hổng) khiến người ta phải phát minh ra thuật ngữ này, không phải định nghĩa từ điển.',
        '- **Nguồn gốc** — tác giả/năm khi tra được chắc chắn; để trống khi không có bằng chứng (không bịa).',
        '- **Giải quyết thế nào** — cơ chế ngắn gọn, kèm đánh đổi nếu có.',
        '',
    ]

    by_level = OrderedDict((lvl, []) for lvl in ('basic', 'intermediate', 'advanced'))
    for e in entries:
        by_level.setdefault(e.get('level', 'intermediate'), []).append(e)

    for lvl, title in LEVEL_TITLES.items():
        group = by_level.get(lvl) or []
        if not group:
            continue
        lines.append(f'# {title}')
        lines.append('')
        lines.append(LEVEL_BLURBS[lvl])
        lines.append('')

        # group by domain, stable order then alphabetical for unknowns
        by_dom = {}
        for e in group:
            by_dom.setdefault(e.get('domain') or 'Khác', []).append(e)
        ordered = [d for d in DOMAIN_ORDER if d in by_dom]
        ordered += sorted(d for d in by_dom if d not in DOMAIN_ORDER)

        for dom in ordered:
            lines.append(f'## {dom}')
            lines.append('')
            dom_entries = sorted(by_dom[dom], key=lambda e: e['term'].lower())
            for e in dom_entries:
                lines.extend(render_entry(e))

    out_path = os.path.join(REPO, 'backend-glossary.md')
    open(out_path, 'w').write('\n'.join(lines))
    print(f'wrote {out_path} ({len(entries)} entries, {len(lines)} lines)')


if __name__ == '__main__':
    main()
