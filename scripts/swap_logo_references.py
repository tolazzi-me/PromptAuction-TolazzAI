from pathlib import Path
path = Path('/home/ubuntu/prompt-auction-tolazzai/client/src/App.tsx')
text = path.read_text()
old = '/manus-storage/LogoSemFundoComBranco_88e091fc.png'
new = '/manus-storage/tolazzai-blue-hammer_c730bc41.png'
count = text.count(old)
if count == 0:
    raise SystemExit('old logo reference not found')
path.write_text(text.replace(old, new))
print(f'replaced {count} logo references')
