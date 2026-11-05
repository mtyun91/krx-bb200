"""Generate a source map for the modular workspace and preserved bridge."""
from pathlib import Path
import re
ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / 'docs'
def main():
    sections = ['# 코드 지도 (자동 생성)', '', '생성: `python tools/make_handoff.py`. 현재 UI와 보존된 이전 UI를 구분한다.', '']
    for name in ['partisan_investment.html', 'app/engine.js', 'app/app.js', 'app/chart.js', 'app/worker.js', 'app/screener.js', 'app/terminal.js', 'app/cases.js', 'app/style.css', 'nh_bridge_core.py']:
        lines = (ROOT / name).read_text(encoding='utf-8').splitlines()
        sections += [f'## {name}', '', f'{len(lines):,}줄', '']
        for number, line in enumerate(lines, 1):
            match = re.search(r'\b(?:async\s+)?function\s+(\w+)\s*\(|^\s*(?:def|class)\s+(\w+)', line)
            if match:
                sections.append(f'- `{match.group(1) or match.group(2)}`: {number}')
        sections.append('')
    sections += ['## 이전 버전', '', '`partisan_legacy.html` 및 `docs/LEGACY_GUIDE.md`는 이전 구현이다. 이전 성과를 새 전략 성과로 해석하지 않는다.', '']
    source_map = '\n'.join(sections)
    (DOCS / 'CODE_MAP.md').write_text(source_map, encoding='utf-8')
    parts = [(ROOT / 'GEMINI.md').read_text(encoding='utf-8'), (DOCS / 'HTS.md').read_text(encoding='utf-8'), source_map]
    (DOCS / 'HANDOFF_BUNDLE.md').write_text('\n\n---\n\n'.join(parts), encoding='utf-8')
    print('Updated CODE_MAP.md and HANDOFF_BUNDLE.md')
if __name__ == '__main__':
    main()
