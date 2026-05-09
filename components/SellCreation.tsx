
import React, { useState, useRef, useEffect } from 'react';
import { MarketItem } from '../types';
import { GoogleGenAI } from '@google/genai';
import { DragonO } from './Lobby';
import { MODEL_TEXT, MODEL_IMAGE } from '../constants';

interface SellCreationProps {
  onBack: () => void;
  onCreate: (item: MarketItem) => void;
  userName: string;
  verifySafety?: (content: string, type?: 'image' | 'text') => Promise<boolean>;
}

const RARITY_OPTIONS = [
  { id: 'COMUM', label: 'Comum', color: 'text-slate-400', border: 'border-slate-500' },
  { id: 'RARO', label: 'Raro', color: 'text-blue-400', border: 'border-blue-500' },
  { id: 'EPICO', label: 'Épico', color: 'text-purple-400', border: 'border-purple-500' },
  { id: 'LENDARIO', label: 'Lendário', color: 'text-amber-400', border: 'border-amber-500' }
];

const ICONS = ['⚔️', '🛡️', '🧪', '💎', '🔫', '📦', '🔮', '💊', '🍖', '📜', '💾', '🔋', '⚙️', '🧿', '🧬', '🛸'];

const SellCreation: React.FC<SellCreationProps> = ({ onBack, onCreate, userName, verifySafety }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [desc, setDesc] = useState('');
  const [rarity, setRarity] = useState<'COMUM' | 'RARO' | 'EPICO' | 'LENDARIO'>('COMUM');
  const [image, setImage] = useState<string | null>(null);
  const [icon, setIcon] = useState('📦');
  
  const [attack, setAttack] = useState<string>('0');
  const [defense, setDefense] = useState<string>('0');
  const [hp, setHp] = useState<string>('0');
  const [buff, setBuff] = useState('');
  const [vulnerability, setVulnerability] = useState('');
  
  const [isSuggesting, setIsSuggesting] = useState(false);
  const aiAbortControllerRef = useRef<AbortController | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(`void_draft_sell_${userName}`);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.name) setName(data.name);
        if (data.price) setPrice(data.price);
        if (data.desc) setDesc(data.desc);
        if (data.rarity) setRarity(data.rarity);
        if (data.image) setImage(data.image);
        if (data.icon) setIcon(data.icon);
        if (data.attack) setAttack(data.attack);
        if (data.defense) setDefense(data.defense);
        if (data.hp) setHp(data.hp);
        if (data.buff) setBuff(data.buff);
        if (data.vulnerability) setVulnerability(data.vulnerability);
      } catch (e) { console.error(e); }
    }
    return () => {
      if (aiAbortControllerRef.current) aiAbortControllerRef.current.abort();
    };
  }, [userName]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem(`void_draft_sell_${userName}`, JSON.stringify({ name, price, desc, rarity, image, icon, attack, defense, hp, buff, vulnerability }));
    }, 500);
    return () => clearTimeout(timeout);
  }, [name, price, desc, rarity, image, icon, attack, defense, hp, buff, vulnerability, userName]);

  const handleSuggestStats = async () => {
    if (!name.trim()) {
      alert("Sintonize o nome do ativo para iniciar a calibração Nexus.");
      return;
    }
    
    if (aiAbortControllerRef.current) aiAbortControllerRef.current.abort();
    const controller = new AbortController();
    aiAbortControllerRef.current = controller;

    setIsSuggesting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const promptStats = `Você é um mestre de RPG galáctico na rede Nexus. Sugira atributos técnicos realistas para um item chamado "${name}" de raridade "${rarity}". 
      Retorne JSON: { "attack": número(0-100), "defense": número(0-100), "hp": número(0-500), "buff": "descrição curta do efeito", "vulnerability": "fraqueza automática", "lore": "breve descrição mística de até 100 caracteres" }`;
      
      const responseStatsPromise = ai.models.generateContent({
        model: MODEL_TEXT,
        contents: [{ role: 'user', parts: [{ text: promptStats }] }],
        config: { responseMimeType: "application/json" }
      });

      const promptImg = `Futuristic high-tech cinematic close-up artifact: ${name}. Galactic dark background, detailed materials, neon ${rarity === 'LENDARIO' ? 'golden' : rarity === 'EPICO' ? 'purple' : 'cyan'} lighting, isolated object, 8k resolution.`;
      const responseImgPromise = ai.models.generateContent({
        model: MODEL_IMAGE,
        contents: [{ role: 'user', parts: [{ text: promptImg }] }],
        config: { imageConfig: { aspectRatio: "1:1" } }
      });

      const [responseStats, responseImg] = await Promise.all([responseStatsPromise, responseImgPromise]);

      if (controller.signal.aborted) return;

      const data = JSON.parse(responseStats.text || "{}");
      if (data.attack !== undefined) setAttack(data.attack.toString());
      if (data.defense !== undefined) setDefense(data.defense.toString());
      if (data.hp !== undefined) setHp(data.hp.toString());
      if (data.buff) setBuff(data.buff);
      if (data.vulnerability) setVulnerability(data.vulnerability);
      if (data.lore) setDesc(data.lore);

      for (const part of responseImg.candidates[0].content.parts) {
        if (part.inlineData) {
          setImage(`data:image/png;base64,${part.inlineData.data}`);
          break;
        }
      }
      
      if (navigator.vibrate) navigator.vibrate(50);
    } catch (err) {
      if ((err as any).name === 'AbortError') return;
      alert("Interferência na sincronia Nexus. Tente novamente em alguns segundos.");
    } finally {
      if (!controller.signal.aborted) setIsSuggesting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImage(base64);
        if (verifySafety) verifySafety(base64).catch(console.error);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublish = async () => {
    if (!name.trim() || !price.trim()) return;

    if (verifySafety) {
      const isNameSafe = await verifySafety(name, 'text');
      if (!isNameSafe) return;
      const isDescSafe = await verifySafety(desc, 'text');
      if (!isDescSafe) return;
      const isBuffSafe = await verifySafety(buff, 'text');
      if (!isBuffSafe) return;
      const isVulnSafe = await verifySafety(vulnerability, 'text');
      if (!isVulnSafe) return;
    }

    const newItem: MarketItem = {
      id: `mk-${Date.now()}`,
      name: name.toUpperCase(),
      price: parseInt(price) || 0,
      seller: userName,
      icon: icon || '📦',
      type: 'CUSTOM',
      desc: desc,
      rarity: rarity,
      image: image || undefined,
      attack: parseInt(attack) || 0,
      defense: parseInt(defense) || 0,
      hp: parseInt(hp) || 0,
      buff: buff,
      vulnerability: vulnerability
    };
    onCreate(newItem);
    localStorage.removeItem(`void_draft_sell_${userName}`);
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-[#02040a] flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden font-inter text-white">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.05)_0%,_transparent_50%)]"></div>
        <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,_rgba(245,158,11,0.05)_0%,_transparent_50%)]"></div>
      </div>

      <header className="relative z-10 px-6 py-6 flex items-center justify-between bg-black/40 backdrop-blur-2xl border-b border-white/5 shadow-2xl">
        <button onClick={onBack} className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all active:scale-90 border border-white/10">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-[11px] font-syncopate font-black text-white uppercase tracking-[0.3em]">Anunciar Ativo</h2>
          <span className="text-[7px] text-amber-500 font-bold uppercase tracking-widest mt-1 animate-pulse">Estabelecendo Link Comercial</span>
        </div>
        <button 
          onClick={handlePublish}
          disabled={!name.trim() || !price.trim() || isSuggesting}
          className="px-6 py-2.5 bg-amber-500 text-black rounded-full text-[9px] font-black uppercase tracking-widest active:scale-95 disabled:opacity-20 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] border border-amber-400/30"
        >
          Lançar
        </button>
      </header>

      <main className="relative z-10 flex-1 overflow-y-auto no-scrollbar p-6 space-y-10 pb-48">
        <div className="max-w-2xl mx-auto space-y-8">
          
          {/* UPLOAD DE IMAGEM */}
          <section className="space-y-4">
             <div 
               onClick={() => fileInputRef.current?.click()}
               className={`w-full aspect-[21/9] rounded-[2.5rem] border-2 border-dashed transition-all relative group overflow-hidden bg-black/40 flex flex-col items-center justify-center cursor-pointer ${image ? 'border-amber-500/40 shadow-inner' : 'border-white/10 hover:border-amber-500/20'}`}
             >
                {image ? (
                  <img src={image} className="w-full h-full object-cover animate-in fade-in duration-1000" />
                ) : (
                  <div className="flex flex-col items-center gap-2 opacity-30 group-hover:opacity-60 transition-opacity">
                    <span className="text-4xl">📸</span>
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] font-black text-white uppercase tracking-widest">Carregar Prova Visual</span>
                        <span className="text-[6px] text-slate-500 uppercase font-bold">Resolução 1:1 Recomendada</span>
                    </div>
                  </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
             </div>
          </section>

          {/* FORMULÁRIO PRINCIPAL */}
          <section className="space-y-6">
            <div className="relative">
                <div className="flex items-center justify-between mb-2 px-4">
                    <label className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em]">Identificação Técnica</label>
                    {isSuggesting && <span className="text-[6px] font-black text-cyan-400 uppercase tracking-widest animate-pulse">Sincronizando Nexus Core...</span>}
                </div>
                <div className="flex gap-3">
                  <input 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="EX: LÂMINA DE FASE ZETA"
                      className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-xs font-black uppercase outline-none focus:border-amber-500/50 transition-all placeholder:text-slate-800 shadow-inner"
                  />
                  <button 
                    onClick={handleSuggestStats}
                    disabled={isSuggesting || !name.trim()}
                    className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all active:scale-90 ${isSuggesting ? 'bg-white/5 border-white/10' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:bg-cyan-500 hover:text-black'}`}
                    title="Geração por IA (Nexus)"
                  >
                    {isSuggesting ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-cyan-500 rounded-full animate-spin"></div>
                    ) : (
                      <span className="text-xl">✨</span>
                    )}
                  </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] ml-4">Preço (Créditos)</label>
                    <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-sm font-black text-amber-500 outline-none focus:border-amber-500/50" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] ml-4">Raridade</label>
                    <select 
                        value={rarity} 
                        onChange={(e) => setRarity(e.target.value as any)}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-[9px] font-black uppercase text-white outline-none focus:border-amber-500/50 appearance-none shadow-inner"
                    >
                        {RARITY_OPTIONS.map(opt => (
                        <option key={opt.id} value={opt.id} className="bg-[#0a0c1a]">{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* ATRIBUTOS RPG */}
            <div className="bg-black/60 rounded-[2.5rem] border border-white/5 p-6 space-y-6 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><DragonO className="text-7xl" /></div>
               <div className="flex items-center gap-3 mb-2 px-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_#22d3ee]"></div>
                  <h3 className="text-[8px] font-black text-white uppercase tracking-[0.4em]">Matriz de Atributos</h3>
               </div>

               <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                       <label className="text-[7px] font-black text-red-500 uppercase tracking-widest ml-1">Poder de Fogo (ATK)</label>
                       <input type="number" value={attack} onChange={(e) => setAttack(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-red-400 font-black text-sm outline-none focus:border-red-500/40 text-center" />
                   </div>
                   <div className="space-y-2">
                       <label className="text-[7px] font-black text-cyan-500 uppercase tracking-widest ml-1">Blindagem (DEF)</label>
                       <input type="number" value={defense} onChange={(e) => setDefense(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-cyan-400 font-black text-sm outline-none focus:border-cyan-500/40 text-center" />
                   </div>
                   <div className="col-span-2 space-y-2">
                       <label className="text-[7px] font-black text-amber-500 uppercase tracking-widest ml-1">Integridade (HP)</label>
                       <input type="number" value={hp} onChange={(e) => setHp(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-amber-400 font-black text-sm outline-none focus:border-amber-500/40 text-center" />
                   </div>
                   <div className="col-span-2 space-y-2">
                       <label className="text-[7px] font-black text-emerald-500 uppercase tracking-widest ml-1">Módulo de Buff</label>
                       <input value={buff} onChange={(e) => setBuff(e.target.value)} placeholder="Efeito positivo..." className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-emerald-400 font-bold text-[10px] outline-none" />
                   </div>
                   <div className="col-span-2 space-y-2">
                       <label className="text-[7px] font-black text-pink-500 uppercase tracking-widest ml-1">Ponto de Ruptura (Fraqueza)</label>
                       <input value={vulnerability} onChange={(e) => setVulnerability(e.target.value)} placeholder="Dissonância técnica..." className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-pink-400 font-bold text-[10px] outline-none" />
                   </div>
               </div>
            </div>

            <div className="space-y-2">
              <label className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] ml-4">Logs Técnicos e Lore</label>
              <textarea 
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Narre as especificações deste ativo para o vácuo..."
                className="w-full h-32 bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-6 text-xs leading-relaxed outline-none focus:border-amber-500/50 resize-none shadow-inner"
              />
            </div>
          </section>

          {/* SELETOR DE ÍCONE */}
          <section className="space-y-4">
             <div className="flex items-center gap-3 px-4">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]"></div>
                <label className="text-[8px] font-black text-white uppercase tracking-[0.4em]">Ícone de Exibição</label>
             </div>
             <div className="grid grid-cols-4 md:grid-cols-8 gap-3 p-5 bg-white/[0.02] rounded-[2rem] border border-white/5">
                {ICONS.map(i => (
                    <button 
                        key={i}
                        onClick={() => { setIcon(i); if(navigator.vibrate) navigator.vibrate(10); }}
                        className={`aspect-square rounded-2xl flex items-center justify-center text-2xl transition-all border ${icon === i ? 'bg-amber-500/20 text-amber-500 border-amber-500/40 shadow-lg scale-110' : 'bg-black/20 border-white/10 hover:border-white/20'}`}
                    >
                        {i}
                    </button>
                ))}
             </div>
          </section>

        </div>
      </main>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
};

export default SellCreation;
