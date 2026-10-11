import json, sys

path = '/home/kronosss2002/project/medium-clone/backend/prisma/translations/en-quiz/security-mastery/00.s0.json'
src_path = '/home/kronosss2002/project/medium-clone/backend/prisma/translations/tmp-quiz-slices/security-mastery/00-s0.json'

with open(path, 'r', encoding='utf-8') as f:
    raw = f.read()

# Known unescaped double-quote spots inside JSON string values (from error contexts)
fixes = [
    # id 1743 explanationEn
    ('is a "frowned upon" practice', 'is a \\"frowned upon\\" practice'),
    # id 1744 explanationEn
    ('unwittingly "verifies HS256 with the public key", the forged token',
     'unwittingly \\"verifies HS256 with the public key\\", the forged token'),
]

applied = 0
for old, new in fixes:
    if old in raw:
        raw = raw.replace(old, new)
        applied += 1
    else:
        print('NOT FOUND:', old)

print('applications:', applied)

with open(path, 'w', encoding='utf-8') as f:
    f.write(raw)

try:
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print('PARSE OK, rows:', len(data))
    print('first id:', data[0]['id'], '| last id:', data[-1]['id'])
    with open(src_path, 'r', encoding='utf-8') as f:
        src = json.load(f)
    print('src rows:', len(src))
    print('ids identical in order:', all(r['id'] == src[i]['id'] for i, r in enumerate(data)))
    print('optionsEn lengths match:', all(len(r['optionsEn']) == len(src[i]['options']) for i, r in enumerate(data)))
    print('all fields valid:', all(
        isinstance(r['id'], int) and isinstance(r['questionEn'], str) and r['questionEn']
        and isinstance(r['optionsEn'], list) and len(r['optionsEn']) > 0
        and (r['explanationEn'] is None or isinstance(r['explanationEn'], str))
        for r in data
    ))
except json.JSONDecodeError as e:
    print('STILL BROKEN at', e.lineno, e.colno, e.msg)
    print('CONTEXT:', repr(raw[max(0, e.pos-100):e.pos+100]))
    sys.exit(1)