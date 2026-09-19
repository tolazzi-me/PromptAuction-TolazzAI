from pathlib import Path
path = Path('/home/ubuntu/prompt-auction-tolazzai/client/src/App.tsx')
text = path.read_text()
old = 'PITACO na ordem rara.'
if old not in text:
    raise SystemExit('PITACO help copy not found')
path.write_text(text.replace(old, 'PITACO com os cinco elementos, em qualquer ordem.', 1))
print('updated PITACO help copy')
