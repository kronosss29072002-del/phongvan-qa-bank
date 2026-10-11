import json
path = '/home/kronosss2002/project/medium-clone/backend/prisma/translations/en-quiz/security-mastery/00.s0.json'
try:
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print('PARSE OK, rows:', len(data))
    print('first id:', data[0]['id'], 'last id:', data[-1]['id'])
except json.JSONDecodeError as e:
    print('PARSE ERROR at line', e.lineno, 'col', e.colno, ':', e.msg)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    print('CONTEXT:', repr(content[max(0, e.pos-80):e.pos+80]))