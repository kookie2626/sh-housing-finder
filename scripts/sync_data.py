"""관리용 JSON으로부터 브라우저 데이터와 CSV를 생성합니다."""
import csv
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
data = json.loads((root / 'data/apartments.json').read_text(encoding='utf-8'))
rows = data['rows']
codes = [row['code'] for row in rows]
if len(codes) != len(set(codes)):
    raise ValueError('중복된 code가 있습니다.')
for row in rows:
    if not row.get('name') or not row.get('url', '').startswith('https://www.i-sh.co.kr/'):
        raise ValueError(f"이름 또는 SH URL을 확인하세요: {row.get('code')}")
data['rows'] = sorted(rows, key=lambda row: row['code'])
(root / 'assets/data.js').write_text('const DATA = ' + json.dumps(data, ensure_ascii=False) + ';\n', encoding='utf-8')
keys = ['code', 'name', 'shName', 'address', 'type', 'units', 'sizes', 'status', 'note', 'url', 'source']
with (root / 'data/apartments.csv').open('w', encoding='utf-8-sig', newline='') as stream:
    writer = csv.writer(stream, lineterminator="\n")
    writer.writerow(['biznsCd', '단지명', 'SH 표시명', 'SH 주소', '공급유형', 'SH 임대세대수', '공급형', '확인상태', '참고', 'SH URL', '이름 대조 출처'])
    writer.writerows([[row.get(key, '') for key in keys] for row in data['rows']])
print(f"{len(rows)}개 항목의 브라우저 데이터와 CSV를 갱신했습니다.")
