#!/usr/bin/env python3
"""Build glossary-data.json (render_html input) from merged.json.

Pipeline: results/*.json -> merge.py -> merged.json -> build_data.py
          -> glossary-data.json -> render_html.py -> backend-glossary.html
"""
import json
import os
import re
import unicodedata
from collections import Counter

HERE = os.path.dirname(__file__)

LEVEL_ORDER = ['basic', 'intermediate', 'advanced']
DOMAIN_ORDER = [
    'Nền tảng máy tính',
    'Mạng & Giao thức',
    'Thiết kế API',
    'OOP & Design Patterns',
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


def slug(term: str) -> str:
    """Anchor id: NFKD (combining marks kept) -> lower -> [^a-z0-9]+ to '-'.

    'Phân vị ...' -> 'pha-n-vi...' (the combining mark collapses to one dash),
    matching the ids render_html.py has emitted since the first build.
    """
    t = unicodedata.normalize('NFKD', term).lower()
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')


def build_ref_index(entries):
    """Exact-match ref -> anchor index over terms plus literal aliases.

    Only aliases owned by exactly one entry are indexed: an alias shared by
    two entries ('soak test') has no single right answer, so the ref stays
    plain rather than linking somewhere arbitrary. Terms always win over an
    alias of the same spelling, matching normalize_related_v2's tier order
    (bare/exact term before bare/exact alias). No fuzzy tiers here — that
    logic lives in normalize_related_v2.py and rewrites refs before merge.
    """
    owners = {}
    for e in entries:
        for name in [e['term']] + list(e.get('aliases') or []):
            if name:
                owners.setdefault(name, set()).add(e['term'])

    index = {e['term']: slug(e['term']) for e in entries}
    for name, claimants in owners.items():
        if len(claimants) == 1 and name not in index:
            index[name] = slug(next(iter(claimants)))

    # Casefold fallback for refs written in a different case than what is
    # stored ('Branch coverage' vs the alias 'branch coverage' a merge left
    # behind). Exact keys keep their own answer; a casefold key reached from
    # two different anchors is ambiguous and gets no fallback.
    casefold = {}
    for name, anchor in index.items():
        cf = name.casefold()
        if cf in casefold and casefold[cf] != anchor:
            casefold[cf] = None
        else:
            casefold.setdefault(cf, anchor)
    for cf, anchor in casefold.items():
        if anchor and cf not in index:
            index[cf] = anchor
    return index


def main():
    entries = json.load(open(os.path.join(HERE, 'merged.json')))

    # ref index: canonical terms + unambiguous literal aliases -> anchor id
    ref_index = build_ref_index(entries)

    # related refs: strings -> {t: label, id: anchor or None}
    out_entries = []
    for e in entries:
        out = {k: v for k, v in e.items() if k != '_src'}
        out['id'] = slug(e['term'])
        out['related'] = []
        for r in (e.get('related') or []):
            # Exact key first, then the casefold gap-filler (a ref spelled in
            # different case than the stored name). Self-link -> plain text.
            ref_id = ref_index.get(r) or ref_index.get(r.casefold())
            out['related'].append({'t': r, 'id': None if ref_id == out['id'] else ref_id})
        out_entries.append(out)

    ids = [e['id'] for e in out_entries]
    dup_ids = [i for i, c in Counter(ids).items() if c > 1]
    if dup_ids:
        raise SystemExit(f'duplicate ids: {dup_ids}')

    data = {
        'meta': {
            'total': len(out_entries),
            'levels': dict(Counter(e['level'] for e in out_entries)),
            'domains': dict(Counter(e['domain'] for e in out_entries)),
            'originFilled': sum(1 for e in out_entries if e.get('origin')),
        },
        'order': {
            'levels': LEVEL_ORDER,
            'domains': DOMAIN_ORDER,
        },
        'entries': out_entries,
    }
    out_path = os.path.join(HERE, 'glossary-data.json')
    json.dump(data, open(out_path, 'w'), ensure_ascii=False, indent=1)
    print(f'wrote {out_path} ({len(out_entries)} entries, '
          f"{data['meta']['originFilled']} with origin)")


if __name__ == '__main__':
    main()
