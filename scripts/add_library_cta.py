from pathlib import Path
path = Path('/home/ubuntu/prompt-auction-tolazzai/client/src/App.tsx')
text = path.read_text()
marker = '      {libraryOpen && <div className="info-backdrop"'
insert = '      <button className="library-cta" title="Abrir biblioteca de sinergias" aria-label="Abrir biblioteca de sinergias" onClick={() => setLibraryOpen(true)}><span className="library-cta-icon"><Library size={18} /></span><span className="library-cta-copy"><strong>Descubra suas sinergias</strong><small>{discoveredSynergies.length}/{LIBRARY_SYNERGIES.length} desbloqueadas · clique para explorar</small></span><ArrowRight size={15} /></button>\n'
if marker not in text:
    raise SystemExit('library modal marker not found')
path.write_text(text.replace(marker, insert + marker, 1))
print('added floating library CTA')
