from pathlib import Path

path = Path('/home/ubuntu/prompt-auction-tolazzai/client/src/App.tsx')
text = path.read_text()
marker = '      {infoOpen && <div className="info-backdrop"'
insert = '''      {libraryOpen && <div className="info-backdrop" role="presentation" onClick={() => setLibraryOpen(false)}><section className="info-modal synergy-library-modal" role="dialog" aria-modal="true" aria-labelledby="library-title" onClick={(event) => event.stopPropagation()}><button className="info-close" aria-label="Fechar biblioteca" onClick={() => setLibraryOpen(false)}>×</button><div className="eyebrow"><Library size={13} /> biblioteca de descobertas</div><div className="library-title-row"><div><h2 id="library-title">Sinergias descobertas</h2><p>Explore as combinações que você já revelou. As demais permanecem em segredo.</p></div><strong className="library-progress">{discoveredSynergies.length}/{LIBRARY_SYNERGIES.length}</strong></div><div className="synergy-library-list">{LIBRARY_SYNERGIES.map((synergy) => { const discovered = discoveredSynergies.includes(synergy.id); return <div className={`library-item ${discovered ? "is-discovered" : "is-locked"}`} key={synergy.id}><div className="library-item-icon">{discovered ? <Sparkles size={16} /> : <LockKeyhole size={15} />}</div><div className="library-item-copy"><div><span>{synergy.category}</span><strong>{discovered ? synergy.label : "Sinergia bloqueada"}</strong></div>{discovered ? <><p>{synergy.detail}</p><small>{synergy.requirement} · +{synergy.bonus} qualidade</small></> : <p className="locked-copy">Descubra uma nova combinação durante uma rodada para revelar esta entrada.</p>}</div></div>; })}</div><small className="help-footer">A biblioteca fica salva neste navegador e cresce conforme você aprende a construir prompts melhores.</small></section></div>}
'''
if marker not in text:
    raise SystemExit('modal marker not found')
path.write_text(text.replace(marker, insert + marker, 1))
print('added synergy library modal')
