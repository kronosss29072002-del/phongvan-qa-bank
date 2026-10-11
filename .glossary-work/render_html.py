#!/usr/bin/env python3
"""Render glossary-data.json → backend-glossary.html (single self-contained file).

Design tokens live in DESIGN; everything else is engine. Swap DESIGN without
touching the render logic.
"""
import json, os, sys, html as H

HERE = os.path.dirname(os.path.abspath(__file__))
# -I (isolated) omits the script dir from sys.path; the shared ref-index
# constructor lives next door in build_data.py.
if HERE not in sys.path:
    sys.path.insert(0, HERE)
from build_data import build_ref_index

REPO = os.path.dirname(HERE)

LEVEL_TITLES = {
    'basic': 'Nền tảng',
    'intermediate': 'Trung cấp',
    'advanced': 'Nâng cao',
}
LEVEL_BLURBS = {
    'basic': 'Những khái niệm gặp ngay tuần đầu đi làm. Bỏ qua phần này thì mọi thứ phía trên xây trên cát.',
    'intermediate': 'Độ sâu của người đã chạy service thật. Đây là nơi phân biệt người viết code với người vận hành hệ thống.',
    'advanced': 'Phân tán, đồng thời, thất bại từng phần — chỉ hiện ra khi hệ thống đủ lớn hoặc đủ căng. Đọc khi đã gặp đau thật.',
}
LEVEL_CODES = {'basic': 'B', 'intermediate': 'I', 'advanced': 'A'}
LEVEL_SR = {'basic': 'Cơ bản', 'intermediate': 'Trung cấp', 'advanced': 'Nâng cao'}
PART_NUMERALS = ['I', 'II', 'III', 'IV', 'V']
DOMAIN_ORDER = [
    'Nền tảng máy tính', 'Mạng & Giao thức', 'Thiết kế API',
    'OOP & Design Patterns', 'Cơ sở dữ liệu & Lưu trữ',
    'Caching & Hiệu năng', 'Hiệu năng', 'Phân tán & Đồng thời',
    'Messaging & Bất đồng bộ', 'Kiến trúc & Khả năng mở rộng',
    'Độ tin cậy & Quan sát được', 'Bền vững & Chị tải',
    'Bảo mật & Xác thực', 'Kiểm thử & Chất lượng', 'DevOps & Triển khai',
]

DESIGN = json.load(open(os.path.join(HERE, 'design.json')))


def esc(s):
    return H.escape(s or '', quote=False)


def render_entry(e, no):
    """One ledger row. e['id'] is a bare slug; DOM id is e-{slug}."""
    eid = f"e-{e['id']}"
    lvl = e['level']
    out = []
    out.append(
        f'<article class="entry" id="{eid}" data-level="{lvl}" '
        f'data-domain="{esc(e["domain"])}" tabindex="-1">'
    )
    # level word sits OUTSIDE the aria-hidden gutter so screen readers announce it
    out.append(
        f'<div class="entry-gutter" aria-hidden="true">'
        f'<span class="entry-no">№ {no:03d}</span>'
        f'<span class="entry-lvl">{LEVEL_CODES[lvl]}</span>'
        f'</div>'
        f'<span class="visually-hidden">{LEVEL_SR[lvl]}</span>'
    )
    out.append('<div class="entry-main">')
    out.append('<header class="entry-head">')
    out.append(f'<h4 class="entry-term">{esc(e["term"])}</h4>')
    out.append(
        f'<button type="button" class="permalink" data-permalink="{eid}" '
        f'aria-label="Liên kết tới {esc(e["term"])}">#</button>'
    )
    out.append(f'<span class="entry-domain">{esc(e["domain"])}</span>')
    out.append('</header>')

    aliases = [a for a in e['aliases'] if a and a.lower() != e['term'].lower()]
    if aliases:
        names = ' · '.join(esc(a) for a in aliases)
        out.append(f'<p class="entry-aliases"><span class="lbl">Hay</span>{names}</p>')

    out.append(
        f'<p class="entry-block entry-problem"><span class="lbl">Vấn đề</span>'
        f'{esc(e["problem"])}</p>'
    )
    if e['origin']:
        out.append(
            f'<p class="entry-origin"><span class="lbl">Nguồn gốc</span>'
            f'{esc(e["origin"])}</p>'
        )
    out.append(
        f'<p class="entry-block entry-how"><span class="lbl">Xử lý</span>'
        f'{esc(e["how"])}</p>'
    )
    if e['related']:
        parts = []
        for r in e['related']:
            label = esc(r['t'])
            if r['id']:
                parts.append(f'<a href="#e-{r["id"]}">{label}</a>')
            else:
                parts.append(
                    f'<span class="rel-plain" title="chưa tách thành mục riêng">{label}</span>'
                )
        out.append(
            f'<p class="entry-related"><span class="lbl">Liên quan</span>'
            f'{" · ".join(parts)}</p>'
        )
    out.append('</div>')
    out.append('</article>')
    return '\n'.join(out)


def render_interview(iv, term_to_id):
    """Situational interview section. Returns (html, question_count)."""
    cats = iv['categories']
    n_q = sum(len(c['questions']) for c in cats)
    out = [
        '<section class="interview" id="interview">',
        '<header class="iv-head">',
        '<p class="iv-kicker">Phỏng vấn</p>',
        f'<h2 class="iv-title">{esc(iv["title"])}</h2>',
        f'<p class="iv-intro">{esc(iv["intro"])}</p>',
        f'<p class="iv-stats">{n_q} tình huống · {len(cats)} nhóm</p>',
        '</header>',
    ]
    for c in cats:
        out.append(f'<div class="iv-cat" id="iv-{c["id"]}">')
        out.append(
            f'<h3 class="iv-cat-title">{esc(c["title"])}'
            f'<span class="iv-cat-count">{len(c["questions"])} câu</span></h3>'
        )
        out.append(f'<p class="iv-cat-intro">{esc(c["intro"])}</p>')
        out.append('<ol class="iv-qs">')
        for q in c['questions']:
            out.append(f'<li class="iv-q" id="ivq-{esc(q["id"])}">')
            out.append(f'<p class="iv-scenario">{esc(q["scenario"])}</p>')
            out.append(f'<h4 class="iv-ask">{esc(q["question"])}</h4>')
            out.append('<ol class="iv-steps">')
            for s in q['steps']:
                out.append(f'<li>{esc(s)}</li>')
            out.append('</ol>')
            chips = []
            for t in q['terms']:
                tid = term_to_id.get(t) or term_to_id.get(t.casefold())
                label = esc(t)
                if tid:
                    chips.append(f'<a href="#e-{tid}">{label}</a>')
                else:
                    chips.append(
                        f'<span class="rel-plain" title="chưa có trong glossary">{label}</span>'
                    )
            out.append(
                '<p class="iv-terms"><span class="lbl">Thuật ngữ</span>'
                + ' · '.join(chips) + '</p>'
            )
            out.append(
                '<div class="iv-signals">'
                f'<p class="iv-signal good"><span class="lbl">Tín hiệu tốt</span>'
                f'{esc(q["good_signal"])}</p>'
                f'<p class="iv-signal bad"><span class="lbl">Dấu hiệu sai</span>'
                f'{esc(q["red_flag"])}</p>'
                '</div>'
            )
            out.append('</li>')
        out.append('</ol>')
        out.append('</div>')
    out.append('</section>')
    return '\n'.join(out), n_q


def build(data, design, interview=None):
    entries = data['entries']
    by_level = {lv: {} for lv in data['order']['levels']}
    for e in entries:
        by_level[e['level']].setdefault(e['domain'], []).append(e)

    slug_map = {}
    for i, d in enumerate(DOMAIN_ORDER):
        slug_map[d] = f'd{i:02d}'
    for d in {e['domain'] for e in entries} - set(slug_map):
        slug_map[d] = f'dx{len(slug_map)}'

    # stable № = position in data order (1-based)
    no_by_id = {e['id']: i + 1 for i, e in enumerate(entries)}

    parts_html = []
    toc_html = []
    part_no = 0
    for lv in data['order']['levels']:
        group = by_level[lv]
        if not group:
            continue
        part_no += 1
        numeral = PART_NUMERALS[part_no - 1] if part_no <= len(PART_NUMERALS) else str(part_no)
        ordered = [d for d in DOMAIN_ORDER if d in group]
        ordered += sorted(d for d in group if d not in DOMAIN_ORDER)
        total_lv = sum(len(v) for v in group.values())

        toc_html.append(
            f'<li class="toc-part"><a href="#p-{lv}">'
            f'<span class="toc-part-no">{numeral}</span>'
            f'<span class="toc-part-name">{LEVEL_TITLES[lv]}</span>'
            f'<span class="toc-count">{total_lv}</span></a><ul>'
        )
        for d in ordered:
            toc_html.append(
                f'<li><a href="#dom-p{part_no}-{slug_map[d]}">'
                f'<span class="toc-dom-name">{esc(d)}</span>'
                f'<span class="toc-count">{len(group[d])}</span></a></li>'
            )
        toc_html.append('</ul></li>')

        dom_html = []
        for d in ordered:
            items = sorted(group[d], key=lambda x: x['term'].lower())
            dom_html.append(
                f'<section class="domain" id="dom-p{part_no}-{slug_map[d]}" data-domain="{esc(d)}">'
            )
            dom_html.append(
                f'<h3 class="domain-title">{esc(d)}'
                f'<span class="domain-count">{len(items)}</span></h3>'
            )
            for e in items:
                dom_html.append(render_entry(e, no_by_id[e['id']]))
            dom_html.append('</section>')

        parts_html.append(
            f'<section class="part" id="p-{lv}" data-level="{lv}">'
            f'<header class="part-band">'
            f'<p class="part-numeral" aria-hidden="true">{numeral}</p>'
            f'<div class="part-meta">'
            f'<p class="part-kicker">Phần {part_no}</p>'
            f'<h2 class="part-title">{LEVEL_TITLES[lv]}</h2>'
            f'<p class="part-blurb">{esc(LEVEL_BLURBS[lv])}</p>'
            f'<p class="part-stats">{total_lv} thuật ngữ · {len(ordered)} chủ đề</p>'
            f'</div></header>'
            + '\n'.join(dom_html) +
            '</section>'
        )

    # interview section (optional). Term chips link into the ledger where the
    # term exists — via its canonical name or via an unambiguous literal alias
    # (e.g. 'test coverage (line vs branch)' → Code coverage) — plain where the
    # candidate term never made it to the glossary.
    iv_html, iv_count = ('', 0)
    term_to_id = build_ref_index(entries)
    if interview:
        iv_html, iv_count = render_interview(interview, term_to_id)

    iv_stats = f' · {iv_count} tình huống phỏng vấn' if iv_count else ''
    lv_meta = data['meta']['levels']
    total = data['meta']['total']
    if iv_count:
        toc_html.append(
            f'<li class="toc-interview"><a href="#interview">'
            f'<span class="toc-dom-name">Câu hỏi phỏng vấn</span>'
            f'<span class="toc-count">{iv_count}</span></a></li>'
        )
    ll_cls = {'basic': 'll-basic', 'intermediate': 'll-inter', 'advanced': 'll-adv'}
    legend = ''.join(
        f'<span class="{ll_cls[k]}">{LEVEL_TITLES[k]} {lv_meta.get(k, 0)}</span>'
        for k in ('basic', 'intermediate', 'advanced')
    )
    seg_html = (
        f'<button type="button" data-filter-level="" aria-pressed="true">Tất cả <b>{total}</b></button>'
        + ''.join(
            f'<button type="button" data-filter-level="{lv}" aria-pressed="false">'
            f'{LEVEL_TITLES[lv]} <b>{lv_meta.get(lv, 0)}</b></button>'
            for lv in data['order']['levels']
        )
    )

    dom_meta = data['meta']['domains']
    dom_opts = ['<option value="">Tất cả lĩnh vực</option>']
    for d in data['order']['domains']:
        if d in dom_meta:
            dom_opts.append(
                f'<option value="{esc(d)}">{esc(d)} ({dom_meta[d]})</option>'
            )
    for d, c in sorted(dom_meta.items()):
        if d not in data['order']['domains']:
            dom_opts.append(f'<option value="{esc(d)}">{esc(d)} ({c})</option>')

    lb = ''.join(
        f'<span class="lb-{k}" style="width:{lv_meta.get(k,0)/max(total,1)*100:.2f}%" '
        f'title="{LEVEL_TITLES[k]} {lv_meta.get(k,0)}"></span>'
        for k in ('basic', 'intermediate', 'advanced')
    )

    payload = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    payload = payload.replace('</', '<\\/')

    doc = TEMPLATE
    for token, val in (
        ('[[TITLE]]', design['title']),
        ('[[CSS]]', design['css']),
        ('[[JS]]', ENGINE_JS),
        ('[[TOTAL]]', str(total)),
        ('[[PART_COUNT]]', str(len(data['order']['levels']))),
        ('[[DOM_COUNT]]', str(len(data['meta']['domains']))),
        ('[[ORIGIN_FILLED]]', str(data['meta']['originFilled'])),
        ('[[IV_STATS]]', iv_stats),
        ('[[LEVEL_BAR]]', lb),
        ('[[LEVEL_LEGEND]]', legend),
        ('[[SEG]]', seg_html),
        ('[[DOM_OPTS]]', '\n'.join(dom_opts)),
        ('[[TOC]]', '\n'.join(toc_html)),
        ('[[PARTS]]', '\n'.join(parts_html)),
        ('[[INTERVIEW]]', iv_html),
        ('[[PAYLOAD]]', payload),
        ('[[FONTS]]', design['fonts_link']),
    ):
        doc = doc.replace(token, val)
    return doc


ENGINE_JS = r'''
(function () {
  'use strict';
  var payload = JSON.parse(document.getElementById('glossary-data').textContent);
  var entries = payload.entries;
  var TOTAL = entries.length;

  var input = document.getElementById('q');
  var liveCount = document.getElementById('live-count');
  var emptyState = document.getElementById('empty-state');
  var resetBtn = document.getElementById('reset-filters');
  var domSelect = document.getElementById('domain-select');
  var themeBtn = document.getElementById('theme-btn');
  var articles = Array.prototype.slice.call(document.querySelectorAll('.entry'));
  var domainSecs = Array.prototype.slice.call(document.querySelectorAll('.domain'));
  var parts = Array.prototype.slice.call(document.querySelectorAll('.part'));
  var secEntryLists = domainSecs.map(function (sec) {
    return Array.prototype.slice.call(sec.querySelectorAll('.entry'));
  });
  var partDomLists = parts.map(function (p) {
    return Array.prototype.slice.call(p.querySelectorAll('.domain'));
  });
  var chips = Array.prototype.slice.call(document.querySelectorAll('[data-filter-level]'));

  // đ must be mapped BEFORE NFD-strip: U+0111 does not decompose under NFD.
  function norm(s) {
    return s.toLowerCase()
      .replace(/[đĐ]/g, 'd')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  var normHay = {};
  var termPlain = {};
  var aliasPlain = {};
  entries.forEach(function (e) {
    normHay[e.id] = norm(
      e.term + ' ' + e.aliases.join(' ') + ' ' + e.problem + ' ' + e.how + ' ' + e.domain +
      ' ' + (e.origin || '')
    );
    termPlain[e.id] = e.term;
    aliasPlain[e.id] = e.aliases.filter(function (a) {
      return a && a.toLowerCase() !== e.term.toLowerCase();
    });
  });

  var termNodes = {};
  var aliasNodes = {};
  articles.forEach(function (art) {
    var slug = art.id.slice(2);
    termNodes[slug] = art.querySelector('.entry-term');
    aliasNodes[slug] = art.querySelector('.entry-aliases');
  });

  // memoize rendered HTML per node: skip identical innerHTML rewrites (576 entries/keystroke otherwise)
  function setHtml(el, html) {
    if (!el || el.__html === html) return;
    el.innerHTML = html;
    el.__html = html;
  }
  Object.keys(termNodes).forEach(function (slug) {
    if (termNodes[slug]) termNodes[slug].__html = termNodes[slug].innerHTML;
    if (aliasNodes[slug]) aliasNodes[slug].__html = aliasNodes[slug].innerHTML;
  });

  var activeLevel = '';
  var activeDomain = '';
  var query = '';
  var rafPending = false;

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Build a stripped string + index map back to original code units.
  // Same transforms as norm() so "duong" hits "đường" and "dich" hits "dịch".
  function stripMap(s) {
    var lower = s.toLowerCase().replace(/[đĐ]/g, 'd');
    var stripped = '';
    var map = [];
    var nfd = lower.normalize('NFD');
    // NFD may expand one code unit into base+marks; walk original `lower` via NFC?
    // Safer: iterate NFD and map each surviving base char to nearest original index
    // by walking lower with a cursor.
    var cursor = 0;
    for (var i = 0; i < nfd.length; i++) {
      var code = nfd.charCodeAt(i);
      // combining diacritics U+0300–U+036F (and Vietnamese stacked marks)
      if (code >= 0x0300 && code <= 0x036f) continue;
      // advance cursor to the next character in `lower` that produces this base
      while (cursor < lower.length) {
        var ch = lower[cursor];
        var base = ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
        cursor++;
        if (base) {
          for (var b = 0; b < base.length; b++) {
            stripped += base[b];
            map.push(cursor - 1);
          }
          break;
        }
      }
    }
    return { stripped: stripped, map: map, lower: lower };
  }

  function highlightPlain(text, terms) {
    if (!terms.length) return escapeHtml(text);
    var sm = stripMap(text);
    var pieces = [];
    var i = 0; // original index cursor
    while (i < text.length) {
      var hitOrig = -1, hitEnd = -1;
      for (var t = 0; t < terms.length; t++) {
        var sidx = sm.stripped.indexOf(terms[t]);
        // prefer matches at or after current position
        while (sidx !== -1 && sm.map[sidx] < i) {
          sidx = sm.stripped.indexOf(terms[t], sidx + 1);
        }
        if (sidx === -1) continue;
        var start = sm.map[sidx];
        var lastMap = sm.map[sidx + terms[t].length - 1];
        var end = (lastMap !== undefined ? lastMap : start) + 1;
        if (hitOrig === -1 || start < hitOrig) {
          hitOrig = start;
          hitEnd = end;
        }
      }
      if (hitOrig === -1) {
        pieces.push(escapeHtml(text.slice(i)));
        break;
      }
      // include combining marks that trail the final base char of the match,
      // so the accent stays inside <mark> (background covers the glyph)
      while (hitEnd < text.length) {
        var cc = text.charCodeAt(hitEnd);
        if (cc >= 0x0300 && cc <= 0x036f) hitEnd++;
        else break;
      }
      if (hitOrig > i) pieces.push(escapeHtml(text.slice(i, hitOrig)));
      pieces.push('<mark>' + escapeHtml(text.slice(hitOrig, hitEnd)) + '</mark>');
      i = hitEnd;
    }
    return pieces.join('');
  }

  function restoreMarks(slug) {
    var termEl = termNodes[slug];
    if (termEl) setHtml(termEl, escapeHtml(termPlain[slug]));
    var alEl = aliasNodes[slug];
    if (!alEl) return;
    var aliases = aliasPlain[slug];
    if (!aliases.length) return;
    setHtml(alEl, '<span class="lbl">Hay</span>' +
      aliases.map(escapeHtml).join(' · '));
  }

  function applyMarks(slug, terms) {
    var termEl = termNodes[slug];
    if (termEl) setHtml(termEl, highlightPlain(termPlain[slug], terms));
    var alEl = aliasNodes[slug];
    var aliases = aliasPlain[slug];
    if (alEl && aliases.length) {
      setHtml(alEl, '<span class="lbl">Hay</span>' +
        aliases.map(function (a) { return highlightPlain(a, terms); }).join(' · '));
    }
  }

  function apply() {
    var nq = norm(query);
    var terms = nq ? nq.split(' ').filter(Boolean) : [];
    var filtering = !!(terms.length || activeLevel || activeDomain);
    var visible = 0;

    articles.forEach(function (art) {
      var id = art.id.slice(2);
      var okLevel = !activeLevel || art.dataset.level === activeLevel;
      var okDom = !activeDomain || art.dataset.domain === activeDomain;
      var okQuery = true;
      if (terms.length) {
        var h = normHay[id];
        for (var i = 0; i < terms.length; i++) {
          if (h.indexOf(terms[i]) === -1) { okQuery = false; break; }
        }
      }
      var show = okLevel && okDom && okQuery;
      art.hidden = !show;
      if (show) {
        visible++;
        if (terms.length) applyMarks(id, terms);
        else restoreMarks(id);
      }
    });

    domainSecs.forEach(function (sec, si) {
      var any = secEntryLists[si].some(function (a) { return !a.hidden; });
      sec.hidden = !any;
    });
    parts.forEach(function (p, pi) {
      var any = partDomLists[pi].some(function (d) { return !d.hidden; });
      p.hidden = !any;
    });

    document.body.classList.toggle('is-filtered', filtering);
    emptyState.hidden = visible !== 0 || !filtering;
    liveCount.innerHTML = '<span class="lc-pre">Đang hiển thị </span>'
      + visible + ' / ' + TOTAL + '<span class="lc-post"> mục</span>';

    var params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (activeLevel) params.set('level', activeLevel);
    if (activeDomain) params.set('domain', activeDomain);
    var qs = params.toString();
    try {
      history.replaceState(null, '', qs ? '?' + qs : location.pathname);
    } catch (e) { /* file:// may throw */ }
  }

  function scheduleApply() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(function () {
      rafPending = false;
      apply();
    });
  }

  input.addEventListener('input', function () {
    query = input.value;
    scheduleApply();
  });

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var lv = chip.dataset.filterLevel || '';
      activeLevel = (activeLevel === lv) ? '' : lv;
      chips.forEach(function (c) {
        c.setAttribute('aria-pressed', String((c.dataset.filterLevel || '') === activeLevel));
      });
      apply();
    });
  });

  domSelect.addEventListener('change', function () {
    activeDomain = domSelect.value;
    apply();
  });

  function resetFilters() {
    query = '';
    activeLevel = '';
    activeDomain = '';
    input.value = '';
    domSelect.value = '';
    chips.forEach(function (c) {
      c.setAttribute('aria-pressed', String((c.dataset.filterLevel || '') === activeLevel));
    });
    apply();
    input.focus();
  }
  resetBtn.addEventListener('click', resetFilters);

  var THEMES = ['', 'light', 'dark'];
  // label must contain the visible button text (auto / sáng / tối) for Name in Label
  var THEME_LABEL = { '': 'Giao diện: auto theo hệ thống', 'light': 'Giao diện: sáng', 'dark': 'Giao diện: tối' };
  function setTheme(t, persist) {
    if (t) document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
    themeBtn.textContent = t === 'dark' ? 'tối' : t === 'light' ? 'sáng' : 'auto';
    themeBtn.setAttribute('aria-label', THEME_LABEL[t] + '. Nhấn để đổi.');
    if (persist) {
      try { localStorage.setItem('glossary-theme', t); } catch (e) {}
    }
  }
  (function () {
    var saved = '';
    try { saved = localStorage.getItem('glossary-theme') || ''; } catch (e) {}
    if (THEMES.indexOf(saved) === -1) saved = '';
    setTheme(saved, false);
  })();
  themeBtn.addEventListener('click', function () {
    var cur = document.documentElement.getAttribute('data-theme') || '';
    var next = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
    setTheme(next, true);
  });

  (function () {
    var params = new URLSearchParams(location.search);
    var q = params.get('q');
    var lv = params.get('level');
    var dm = params.get('domain');
    if (q) { input.value = q; query = q; }
    if (lv && ['basic', 'intermediate', 'advanced'].indexOf(lv) !== -1) {
      activeLevel = lv;
      chips.forEach(function (c) {
        c.setAttribute('aria-pressed', String((c.dataset.filterLevel || '') === activeLevel));
      });
    }
    if (dm) {
      activeDomain = dm;
      if (!domSelect.querySelector('option[value="' + CSS.escape(dm) + '"]')) {
        var opt = document.createElement('option');
        opt.value = dm;
        opt.textContent = dm;
        domSelect.appendChild(opt);
      }
      domSelect.value = dm;
    }
    if (q || lv || dm) apply();
  })();

  document.addEventListener('keydown', function (ev) {
    var tag = (document.activeElement && document.activeElement.tagName) || '';
    var editable = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' ||
      (document.activeElement && document.activeElement.isContentEditable);
    if ((ev.key === '/' || ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k')) &&
        !editable && !ev.altKey) {
      ev.preventDefault();
      input.focus();
      input.select();
    }
    if (ev.key === 'Escape' && document.activeElement === input) {
      if (input.value) {
        input.value = '';
        query = '';
        apply();
      } else {
        input.blur();
      }
    }
  });

  var tocLinks = Array.prototype.slice.call(document.querySelectorAll('.toc a[href^="#"]'));
  var targets = tocLinks.map(function (a) {
    return document.getElementById(a.getAttribute('href').slice(1));
  });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (obs) {
      obs.forEach(function (en) {
        if (!en.isIntersecting) return;
        tocLinks.forEach(function (a, i) {
          if (targets[i] === en.target) a.setAttribute('aria-current', 'location');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-15% 0px -70% 0px' });
    targets.forEach(function (t) { if (t) io.observe(t); });
  }

  var tocEl = document.querySelector('.toc');
  if (tocEl) {
    // desktop hides <summary>, so a closed <details> would strand the TOC;
    // open at >=1024, collapse on mobile. Sync only on breakpoint change so a
    // user's manual toggle on mobile survives plain resizes.
    var mqDesk = window.matchMedia('(min-width:1024px)');
    var syncToc = function () { tocEl.open = mqDesk.matches; };
    syncToc();
    if (mqDesk.addEventListener) mqDesk.addEventListener('change', syncToc);
    else if (mqDesk.addListener) mqDesk.addListener(syncToc);
  }

  var toolbar = document.querySelector('.toolbar');
  function setToolbarH() {
    if (!toolbar) return;
    document.documentElement.style.setProperty('--toolbar-h', toolbar.offsetHeight + 'px');
  }
  setToolbarH();
  if ('ResizeObserver' in window && toolbar) {
    new ResizeObserver(setToolbarH).observe(toolbar);
  } else {
    window.addEventListener('resize', setToolbarH);
  }

  var toTop = document.getElementById('to-top');
  window.addEventListener('scroll', function () {
    toTop.classList.toggle('is-visible', window.scrollY > 1200);
  }, { passive: true });
  toTop.addEventListener('click', function () {
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });

  document.addEventListener('click', function (ev) {
    var btn = ev.target.closest('.permalink');
    if (btn) {
      var slug = btn.getAttribute('data-permalink');
      var url = location.href.split('#')[0] + '#' + slug;
      function ok() {
        btn.classList.add('is-ok');
        btn.textContent = '✓';
        setTimeout(function () {
          btn.classList.remove('is-ok');
          btn.textContent = '#';
        }, 1500);
      }
      function fallbackCopy() {
        var ta = document.createElement('textarea');
        ta.value = url;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        var done = false;
        try { done = document.execCommand('copy'); } catch (e) { done = false; }
        document.body.removeChild(ta);
        if (done) ok();
        else window.prompt('Sao chép liên kết:', url);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(ok, fallbackCopy);
      } else {
        fallbackCopy();
      }
      return;
    }
    var a = ev.target.closest('a[href^="#e-"]');
    if (a) {
      var target = document.getElementById(a.getAttribute('href').slice(1));
      if (target && target.classList.contains('entry')) {
        target.classList.remove('flash');
        void target.offsetWidth;
        target.classList.add('flash');
      }
    }
  });
})();
'''


TEMPLATE = '''<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>[[TITLE]]</title>
<meta name="description" content="[[TOTAL]] thuật ngữ backend/system từ cơ bản đến nâng cao — mỗi mục trả lời vấn đề gì khiến nó ra đời.">
<meta name="color-scheme" content="light dark">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
[[FONTS]]
<style>
[[CSS]]
</style>
</head>
<body>
<a class="skip-link" href="#main">Bỏ tới nội dung</a>

<header class="masthead">
  <div class="masthead-inner">
    <p class="masthead-kicker">Tham chiếu</p>
    <h1 class="masthead-title">Thuật ngữ Backend &amp; System</h1>
    <p class="masthead-dek">Mỗi mục trả lời hai câu: <strong>vấn đề gì khiến thuật ngữ này được sinh ra</strong>, và <strong>nó giải quyết thế nào</strong>. Sắp từ cơ bản đến nâng cao.</p>
    <p class="masthead-stats">[[TOTAL]] mục · [[PART_COUNT]] phần · [[DOM_COUNT]] lĩnh vực · [[ORIGIN_FILLED]] có nguồn gốc[[IV_STATS]]</p>
    <div class="level-bar" aria-hidden="true">[[LEVEL_BAR]]</div>
    <p class="level-legend">[[LEVEL_LEGEND]]</p>
  </div>
</header>

<div class="toolbar" role="search">
  <div class="toolbar-inner">
    <div class="searchwrap">
      <label class="visually-hidden" for="q">Tìm thuật ngữ</label>
      <input type="search" id="q" placeholder="Tìm: retry, MVCC, cache stampede…" autocomplete="off" spellcheck="false">
    </div>
    <div class="seg" role="group" aria-label="Lọc theo mức độ">[[SEG]]</div>
    <label class="visually-hidden" for="domain-select">Lọc theo lĩnh vực</label>
    <select id="domain-select" class="dom-select">[[DOM_OPTS]]</select>
    <p class="live-count" id="live-count" role="status" aria-live="polite"><span class="lc-pre">Đang hiển thị </span>[[TOTAL]] / [[TOTAL]]<span class="lc-post"> mục</span></p>
    <button type="button" id="theme-btn" class="theme-btn" aria-label="Giao diện: auto theo hệ thống">auto</button>
  </div>
</div>

<div class="shell">
<details class="toc" open>
  <summary>Mục lục</summary>
  <nav class="toc-body" aria-label="Mục lục">
    <p class="toc-head">Mục lục</p>
    <ul>
    [[TOC]]
    </ul>
  </nav>
</details>

<main id="main" class="content">
  <div id="empty-state" class="empty-state" hidden>
    <p>Không có mục nào khớp bộ lọc hiện tại.</p>
    <button type="button" id="reset-filters" class="reset-btn">Xoá bộ lọc</button>
  </div>
[[PARTS]]
[[INTERVIEW]]
</main>
</div>

<footer class="colophon">
  <p>[[TOTAL]] mục · [[ORIGIN_FILLED]] có nguồn gốc · dữ liệu tĩnh, không theo dõi, một file HTML.</p>
</footer>

<div class="to-top-wrap"><button id="to-top" class="to-top" type="button" aria-label="Về đầu trang">↑</button></div>

<script id="glossary-data" type="application/json">[[PAYLOAD]]</script>
<script>
[[JS]]
</script>
</body>
</html>
'''


def main():
    data = json.load(open(os.path.join(HERE, 'glossary-data.json')))
    iv_path = os.path.join(HERE, 'interview.json')
    interview = json.load(open(iv_path)) if os.path.exists(iv_path) else None
    doc = build(data, DESIGN, interview)
    out = os.path.join(REPO, 'backend-glossary.html')
    with open(out, 'w') as f:
        f.write(doc)
    iv_note = f', {sum(len(c["questions"]) for c in interview["categories"])} interview questions' if interview else ''
    print(f'wrote {out} ({os.stat(out).st_size} bytes{iv_note})')


if __name__ == '__main__':
    main()
