from pathlib import Path
path = Path('/home/ubuntu/prompt-auction-tolazzai/client/src/App.tsx')
text = path.read_text()
cta = '      <button className="library-cta" title="Abrir biblioteca de sinergias" aria-label="Abrir biblioteca de sinergias" onClick={() => setLibraryOpen(true)}><span className="library-cta-icon"><Library size={18} /></span><span className="library-cta-copy"><strong>Descubra suas sinergias</strong><small>{discoveredSynergies.length}/{LIBRARY_SYNERGIES.length} desbloqueadas · clique para explorar</small></span><ArrowRight size={15} /></button>\n'
if cta not in text:
    raise SystemExit('floating CTA not found')
text = text.replace(cta, '', 1)
needle = '</section>\n            <section className="cpu-panel">'
if needle not in text:
    raise SystemExit('cpu panel insertion point not found')
text = text.replace(needle, '</section>\n            ' + cta.strip() + '\n            <section className="cpu-panel">', 1)
path.write_text(text)
print('moved library CTA into right sidebar')
