from pathlib import Path
path = Path('/home/ubuntu/prompt-auction-tolazzai/client/src/index.css')
text = path.read_text()
replacements = {
    '.footer-wordmark { width: 53px; height: auto; max-height: 10px;': '.footer-wordmark { width: 76px; height: auto; max-height: 14px;',
    '.modal-wordmark { width: 104px; height: auto; max-height: 22px;': '.modal-wordmark { width: 130px; height: auto; max-height: 28px;',
    '.inline-wordmark { width: 67px; height: auto; max-height: 14px;': '.inline-wordmark { width: 84px; height: auto; max-height: 17px;',
    '.rights-line .inline-wordmark { width: 52px; max-height: 10px; }': '.rights-line .inline-wordmark { width: 68px; max-height: 13px; }',
}
for old, new in replacements.items():
    if old not in text:
        raise SystemExit(f'not found: {old}')
    text = text.replace(old, new, 1)
path.write_text(text)
print('scaled logo placements')
