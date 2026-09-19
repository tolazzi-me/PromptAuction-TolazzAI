from pathlib import Path
path = Path('/home/ubuntu/prompt-auction-tolazzai/client/src/App.tsx')
text = path.read_text()
old = 'selectedCards.length}/6'
if old not in text:
    raise SystemExit('deck counter not found')
path.write_text(text.replace(old, 'selectedCards.length}/10', 1))
print('updated deck counter')
