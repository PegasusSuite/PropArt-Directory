#!/usr/bin/env python3
"""Fix UTF-8 mojibake in PropArt static files."""
from __future__ import annotations

import sys
from pathlib import Path

import ftfy

FOLLOWUP = (
    ('PropArtâ"¢', 'PropArt™'),
    ('â"¢', '™'),
    ('â–¸', '▸'),
    ('â–¾', '▾'),
)


def fix_text(text: str) -> str:
    out = ftfy.fix_text(text)
    for bad, good in FOLLOWUP:
        out = out.replace(bad, good)
    return out


def main() -> int:
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('.')
    patterns = ('*.html', '*.js', '*.mjs', '*.css', '*.md')
    files: list[Path] = []
    for pat in patterns:
        files.extend(root.rglob(pat))
    files = sorted({p for p in files if 'node_modules' not in p.parts and 'dist-sovereign' not in p.parts})

    changed = 0
    for path in files:
        original = path.read_text(encoding='utf-8')
        fixed = fix_text(original)
        if fixed == original:
            continue
        path.write_text(fixed, encoding='utf-8', newline='\n')
        changed += 1
        print(f'fixed {path.relative_to(root)}')

    print(f'done: {changed} file(s)')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
