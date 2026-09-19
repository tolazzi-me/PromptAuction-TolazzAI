from pathlib import Path
path = Path('/home/ubuntu/prompt-auction-tolazzai/client/src/index.css')
text = path.read_text()
replacements = {
    '.footer-wordmark { width: 76px; height: auto; max-height: 14px;': '.footer-wordmark { width: 30px; height: 30px; max-height: 30px;',
    '.modal-wordmark { width: 130px; height: auto; max-height: 28px;': '.modal-wordmark { width: 44px; height: 44px; max-height: 44px;',
    '.inline-wordmark { width: 84px; height: auto; max-height: 17px;': '.inline-wordmark { width: 30px; height: 30px; max-height: 30px;',
    '.rights-line .inline-wordmark { width: 68px; max-height: 13px; }': '.rights-line .inline-wordmark { width: 24px; max-height: 24px; }',
}
for old, new in replacements.items():
    if old not in text:
        raise SystemExit(f'not found: {old}')
    text = text.replace(old, new, 1)
path.write_text(text)
print('tuned new logo sizes')
