import React, { useState, useRef } from 'react';
import { Character } from '../types';

interface CharacterCreationProps {
  onComplete: (char: Character) => void;
  onBack: () => void;
  verifySafety?: (content: string, type?: 'image' | 'text') => Promise<boolean>;
}

const CharacterCreation: React.FC<CharacterCreationProps> = ({ onComplete, onBack, verifySafety }) => {
  const [wikiName, setWikiName] = useState('');
  const [wikiAbout, setWikiAbout] = useState('');
  const [keywords, setKeywords] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [background, setBackground] = useState<string | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);
  
  const [points, setPoints] = useState(20);
  const [stats, setStats] = useState({
    'Força': 0,
    'Agilidade': 0,
    'Inteligência': 0,
    'Vontade': 0
  });

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleStatChange = (stat: string, delta: number) => {
    const currentVal = (stats as any)[stat];
    if (delta > 0 && points <= 0) return;
    if (delta < 0 && currentVal <= 0) return;

    setStats(prev => ({ ...prev, [stat]: (prev as any)[stat] + delta }));
    setPoints(prev => prev - delta);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: any) => void, isGallery: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (isGallery) {
        setGallery(prev => [...prev, base64].slice(0, 4));
      } else {
        setter(base64);
      }
      if (verifySafety) verifySafety(base64).catch(console.error);
    };
    reader.readAsDataURL(file);
  };

  const handleFinalize = async () => {
    if (!wikiName.trim()) return;
    
    if (verifySafety) {
      const isNameSafe = await verifySafety(wikiName, 'text');
      if (!isNameSafe) return;
      const isAboutSafe = await verifySafety(wikiAbout, 'text');
      if (!isAboutSafe) return;
      const isKeywordsSafe = await verifySafety(keywords, 'text');
      if (!isKeywordsSafe) return;
    }

    const rawInv = keywords.split(',').map(s => s.trim()).filter(x => x);
    const paddedInv = Array(10).fill(null);
    rawInv.forEach((item, idx) => {
      if (idx < 10) paddedInv[idx] = item;
    });

    onComplete({
      name: wikiName.toUpperCase(),
      class: "WIKI_ENTRY",
      stats: {
        strength: stats['Força'],
        agility: stats['Agilidade'],
        intelligence: stats['Inteligência'],
        willpower: stats['Vontade'],
        hp: 100 + (stats['Força'] * 10)
      },
      inventory: paddedInv,
      background: wikiAbout
    });
  };

  return (
    <div className="fixed inset-0 z-[500] bg-[#050b18] flex flex-col font-inter text-white overflow-hidden">
      <header className="px-6 py-5 flex items-center justify-between border-b border-white/5 bg-[#050b18] shrink-0 shadow-lg">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-400 active:scale-90 transition-all hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M15 19l-7-7 7-7"/></svg>
        </button>
        <h1 className="text-[11px] font-syncopate font-black text-white uppercase tracking-[0.4em]">Nova Entrada Wiki</h1>
        <div className="flex items-center gap-6">
          <button onClick={handleFinalize} disabled={!wikiName.trim()} className="text-cyan-400 hover:text-cyan-300 transition-colors disabled:opacity-20 active:scale-90">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-32 bg-[#02040a]">
        <div className="max-w-xl mx-auto">
          <section className="p-8 flex items-center gap-8 border-b border-white/5 relative bg-gradient-to-r from-cyan-500/5 to-transparent">
            <div 
              onClick={() => avatarInputRef.current?.click()}
              className="w-28 h-28 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center shrink-0 cursor-pointer overflow-hidden relative group shadow-2xl transition-all hover:border-cyan-500/40"
            >
              {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : (
                <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M12 4.5v15m7.5-7.5h-15" /></svg>
                </div>
              )}
              <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setAvatar)} />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[7px] font-black text-slate-600 uppercase tracking-[0.3em] ml-1">Identificação</label>
              <input 
                value={wikiName}
                onChange={(e) => setWikiName(e.target.value)}
                placeholder="NOME DO REGISTRO"
                className="w-full bg-transparent border-b border-white/10 py-3 text-xl font-bold text-white outline-none focus:border-cyan-500 transition-all placeholder:text-slate-800 uppercase"
              />
            </div>
          </section>

          <section 
            onClick={() => bgInputRef.current?.click()}
            className="px-8 py-6 flex items-center justify-between border-b border-white/5 bg-white/[0.01] cursor-pointer hover:bg-white/[0.03] transition-all group"
          >
            <div className="flex items-center gap-6">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-cyan-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1-1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.446 6.33a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" /></svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-200">Definir Plano de Fundo</span>
                <span className="text-[7px] text-slate-600 font-bold uppercase">(Opcional)</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-black border border-white/10 overflow-hidden relative shadow-inner">
              {background && <img src={background} className="w-full h-full object-cover" />}
              <input type="file" ref={bgInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setBackground)} />
            </div>
          </section>

          <section 
            onClick={() => galleryInputRef.current?.click()}
            className="px-8 py-6 flex items-center gap-6 border-b border-white/5 bg-white/[0.01] cursor-pointer hover:bg-white/[0.03] transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-cyan-400 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6.75a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6.75v11.25a1.5 1.5 0 001.5 1.5zM12 12.75h.007v.007H12v-.007z" /></svg>
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-200">Galeria de Registros Visuais</span>
            <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, null, true)} />
          </section>

          <section className="p-8 space-y-4">
            <label className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] ml-1">Relatório Biográfico</label>
            <textarea 
              value={wikiAbout}
              onChange={(e) => setWikiAbout(e.target.value)}
              placeholder="Descreva a lore e os dados profundos deste operativo..."
              className="w-full h-48 bg-white/[0.02] border border-white/10 rounded-[2rem] p-6 text-sm text-slate-300 outline-none focus:border-cyan-500/40 resize-none placeholder:text-slate-800 leading-relaxed shadow-inner"
            />
          </section>

          <section className="p-8 space-y-4 border-t border-white/5">
            <label className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] ml-1">Palavras-chave de Indexação</label>
            <input 
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="EX: HUMANO, EXPLORADOR, VÁCUO..."
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xs font-bold text-white outline-none focus:border-cyan-500/40 uppercase placeholder:text-slate-800"
            />
          </section>

          <section className="bg-black/60 shadow-2xl">
            <div className="px-8 py-4 border-y border-white/5 flex items-center justify-between bg-white/[0.02]">
               <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Matriz de Atributos</h3>
               <div className="flex flex-col items-end">
                  <span className="text-xl font-orbitron font-black text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">{points}</span>
                  <span className="text-[5px] font-bold text-slate-700 uppercase">Pontos Disponíveis</span>
                </div>
            </div>

            <div className="divide-y divide-white/5">
              {Object.entries(stats).map(([key, val]) => (
                <div key={key} className="px-8 py-6 flex items-center justify-between group hover:bg-white/[0.02] transition-colors">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">{key}</span>
                  <div className="flex items-center gap-8">
                    <button 
                      onClick={() => handleStatChange(key, -1)}
                      className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 active:scale-90 transition-all hover:border-red-500/30 hover:text-red-400"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M19.5 12h-15" /></svg>
                    </button>
                    <span className="w-8 text-center font-orbitron font-black text-lg text-white">{val}</span>
                    <button 
                      onClick={() => handleStatChange(key, 1)}
                      className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all hover:bg-white/10 shadow-lg"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `.no-scrollbar::-webkit-scrollbar { display: none; }` }} />
    </div>
  );
};

export default CharacterCreation;