#!/usr/bin/env python3
"""Merge all domain result JSONs, dedup by normalized term, sort basic→advanced."""
import json, os, re, sys, unicodedata

RESULTS = os.path.join(os.path.dirname(__file__), 'results')
LEVEL_ORDER = {'basic': 0, 'intermediate': 1, 'advanced': 2}

# domain label per source file (fill-* files merge into their parent theme)
DOMAIN_MAP = {
    'security_auth.json': 'Bảo mật & Xác thực',
    'testing_quality.json': 'Kiểm thử & Chất lượng',
    'performance_engineering.json': 'Hiệu năng',
    'reliability_observability.json': 'Độ tin cậy & Quan sát được',
    'resilience_capacity.json': 'Bền vững & Chị tải',
    'api_design.json': 'Thiết kế API',
    'wf_network-protocols_domain.json': 'Mạng & Giao thức',
    'wf_databases-storage_domain.json': 'Cơ sở dữ liệu & Lưu trữ',
    'database_internals.json': 'Cơ sở dữ liệu & Lưu trữ',
    'wf_caching-performance_domain.json': 'Caching & Hiệu năng',
    'wf_distributed-concurrency_domain.json': 'Phân tán & Đồng thời',
    'wf_messaging-async_domain.json': 'Messaging & Bất đồng bộ',
    'wf_architecture-scalability_domain.json': 'Kiến trúc & Khả năng mở rộng',
    'wf_devops-delivery_domain.json': 'DevOps & Triển khai',
    'wf_fill-0-observability-monitori_domain.json': 'Độ tin cậy & Quan sát được',
    'wf_fill-1-security-authenticatio_domain.json': 'Bảo mật & Xác thực',
    'wf_fill-2-testing-quality-engine_domain.json': 'Kiểm thử & Chất lượng',
    'wf_fill-5-os-network-request-pat_domain.json': 'Mạng & Giao thức',
}


def norm_term(t: str) -> str:
    t = unicodedata.normalize('NFKD', t.lower())
    t = t.replace('đ', 'd')
    t = re.sub(r'[^a-z0-9]+', '', t)
    return t


def bare_term(t: str) -> str:
    """Strip ONE trailing parenthetical: 'MVCC (Multi-Version...)' -> 'MVCC'."""
    return re.sub(r'\s*\([^)]*\)\s*$', '', t).strip()


# base keys whose parenthesized variants are DIFFERENT angles, keep both
DUP_EXCLUDE = {'replication'}


def main():
    merged, seen, skipped = [], {}, []
    files = sorted(f for f in os.listdir(RESULTS) if f.endswith('.json'))
    total_raw = 0
    all_entries = []
    for f in files:
        path = os.path.join(RESULTS, f)
        try:
            j = json.load(open(path))
        except Exception as e:
            print(f'SKIP {f}: {e}', file=sys.stderr)
            continue
        for e in j.get('entries') or []:
            if (e.get('term') or '').strip():
                all_entries.append((f, e))

    # bare-base key: 'MVCC (Multi-Version...)' dedups into 'MVCC', 'WAL
    # (Write-Ahead Logging)' into 'WAL (Write-Ahead Log)'. Exceptions in
    # DUP_EXCLUDE keep full-key (replication topology vs sync-mode differ).
    for f, e in all_entries:
        term = e['term'].strip()
        total_raw += 1
        base = norm_term(bare_term(term))
        key = norm_term(term) if base in DUP_EXCLUDE else base
        # dedup: also merge aliases into collision key (retry vs retries)
        if key in seen:
            # keep richer entry (more filled fields), merge sources
            old = seen[key]
            old_fields = sum(1 for k in ('problem', 'origin', 'how') if old.get(k))
            new_fields = sum(1 for k in ('problem', 'origin', 'how') if e.get(k))
            if new_fields > old_fields:
                e.setdefault('domain', old.get('domain'))
                e['_src'] = f
                seen[key] = e
            # union aliases/related
            tgt = seen[key]
            for a in (e.get('aliases') or []):
                if a not in tgt.setdefault('aliases', []):
                    tgt['aliases'].append(a)
            for r in (e.get('related') or []):
                if r not in tgt.setdefault('related', []):
                    tgt['related'].append(r)
            skipped.append((term, f))
            continue
        e['_src'] = f
        seen[key] = e
    for e in seen.values():
        merged.append(e)

    # attach domain from source file name when missing
    for e in merged:
        if not e.get('domain'):
            e['domain'] = DOMAIN_MAP.get(e.get('_src', ''), '')

    # rewrite related refs to the surviving term after bare-key merges
    # (a ref to 'CDN' must follow the merge into 'CDN (Content Delivery Network)')
    terms_now = {e['term'] for e in merged}
    survivor = {}
    for e in merged:
        base = norm_term(bare_term(e['term']))
        if base not in DUP_EXCLUDE:
            survivor.setdefault(base, e['term'])
    for e in merged:
        rel, seen_rel = [], set()
        for r in (e.get('related') or []):
            base = norm_term(bare_term(r))
            tgt = r if r in terms_now else survivor.get(base, r)
            if tgt not in seen_rel:
                seen_rel.add(tgt)
                rel.append(tgt)
        e['related'] = rel

    merged.sort(key=lambda e: (LEVEL_ORDER.get(e.get('level'), 3), norm_term(e.get('term', ''))))
    print(f'files={len(files)} raw={total_raw} unique={len(merged)} dup_merged={len(skipped)}')
    from collections import Counter
    print('by level:', dict(Counter(e.get('level') for e in merged)))
    out = os.path.join(os.path.dirname(__file__), 'merged.json')
    json.dump(merged, open(out, 'w'), ensure_ascii=False, indent=2)
    print('wrote', out)

    # dup report
    dups = Counter(norm_term(t) for t, _ in skipped)
    if skipped:
        print('top dup terms:', [t for t, _ in dups.most_common(20)])


if __name__ == '__main__':
    main()
