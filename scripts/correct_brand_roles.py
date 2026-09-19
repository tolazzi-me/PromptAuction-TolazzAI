from pathlib import Path
path = Path('/home/ubuntu/prompt-auction-tolazzai/client/src/App.tsx')
text = path.read_text()
old_logo = '/manus-storage/LogoSemFundoComBranco_88e091fc.png'
blue_logo = '/manus-storage/tolazzai-blue-hammer_c730bc41.png'
text = text.replace(blue_logo, old_logo)
old_mark = f'<div className="brand-mark"><img src="/manus-storage/prompt-auction-mark_fe17135f.png" alt="" /></div>'
new_mark = f'<div className="brand-mark"><img src="{blue_logo}" alt="Prompt Auction" /></div>'
if old_mark not in text:
    raise SystemExit('game brand mark not found')
text = text.replace(old_mark, new_mark, 1)
path.write_text(text)

css = Path('/home/ubuntu/prompt-auction-tolazzai/client/src/index.css')
styles = css.read_text()
styles = styles.replace('.brand-wordmark { width: 38px; height: 38px; object-fit: contain; object-position: center; filter: drop-shadow(0 3px 7px rgba(0,126,194,.25)); }', '.brand-wordmark { width: 103px; height: auto; max-height: 25px; object-fit: contain; object-position: left center; }')
styles = styles.replace('.footer-wordmark { width: 30px; height: 30px; max-height: 30px;', '.footer-wordmark { width: 76px; height: auto; max-height: 14px;')
styles = styles.replace('.modal-wordmark { width: 44px; height: 44px; max-height: 44px;', '.modal-wordmark { width: 130px; height: auto; max-height: 28px;')
styles = styles.replace('.inline-wordmark { width: 30px; height: 30px; max-height: 30px;', '.inline-wordmark { width: 84px; height: auto; max-height: 17px;')
styles = styles.replace('.rights-line .inline-wordmark { width: 24px; max-height: 24px; }', '.rights-line .inline-wordmark { width: 68px; max-height: 13px; }')
css.write_text(styles)
print('corrected game mark and TolazzAI logo roles')
