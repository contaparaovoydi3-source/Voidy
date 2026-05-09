import React, { useState, useRef, useEffect } from 'react';
import { FeedPost, PollOption } from '../types';

interface PollCreationProps {
  onBack: () => void;
  onCreate: (post: FeedPost) => void;
  userName: string;
  userAvatar: string;
  verifySafety?: (content: string, type?: 'image' | 'text') => Promise<boolean>;
}

const PRESET_COLORS = [
  { name: 'Void', hex: '#02040a' },
  { name: 'Ciano', hex: '#083344' },
  { name: 'Roxo', hex: '#1e1b4b' },
  { name: 'Vinho', hex: '#450a0a' },
  { name: 'Slate', hex: '#0f172a' }
];

const PollCreation: React.FC<PollCreationProps> = ({ onBack, onCreate, userName, userAvatar, verifySafety }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');
  const [options, setOptions] = useState<{ text: string; image: string | null }[]>([
    { text: '', image: null },
    { text: '', image: null },
    { text: '', image: null },
    { text: '', image: null }
  ]);
  const [showStyleHub, setShowStyleHub] = useState(false);
  
  const [bgType, setBgType] = useState<'color' | 'image'>('color');
  const [bgColor, setBgColor] = useState('#02040a');
  const [bgImage, setBgImage] = useState<string | null>(null);

  const bgInputRef = useRef<HTMLInputElement>(null);
  const optionImageRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const key = `void_draft_poll_${userName}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.title) setTitle(data.title);
        if (data.description) setDescription(data.description);
        if (data.options) setOptions(data.options);
        if (data.bgType) setBgType(data.bgType);
        if (data.bgColor) setBgColor(data.bgColor);
        if (data.bgImage) setBgImage(data.bgImage);
      }
    } catch (e) {
      console.error("Failed to recover poll draft", e);
    }
  }, [userName]);

  useEffect(() => {
    const key = `void_draft_poll_${userName}`;
    const timeout = setTimeout(() => {
      try {
        const data = { title, description, options, bgType, bgColor, bgImage };
        localStorage.setItem(key, JSON.stringify(data));
      } catch (e) {
        console.error("Failed to save poll draft", e);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [title, description, options, bgType, bgColor, bgImage, userName]);

  const handleOptionImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const newOptions = [...options];
        newOptions[index].image = base64;
        setOptions(newOptions);
        if (verifySafety) verifySafety(base64).catch(console.error);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddOption = () => {
    if (options.length < 7) {
      setOptions([...options, { text: '', image: null }]);
    }
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setBgImage(base64);
        setBgType('image');
        if (verifySafety) verifySafety(base64).catch(console.error);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublish = async () => {
    if (!title.trim() || options.filter(o => o.text.trim()).length < 2) return;

    if (verifySafety) {
      const isTitleSafe = await verifySafety(title, 'text');
      if (!isTitleSafe) return;
      const isDescSafe = await verifySafety(description, 'text');
      if (!isDescSafe) return;
      for (const opt of options) {
        if (opt.text.trim()) {
          const isOptSafe = await verifySafety(opt.text, 'text');
          if (!isOptSafe) return;
        }
      }
    }

    const pollOptions: PollOption[] = options
      .filter(o => o.text.trim())
      .map((o, idx) => ({
        id: `opt-${idx}-${Date.now()}`,
        text: o.text,
        votes: 0,
        votedBy: [],
        image: o.image
      }));
    const newPost: FeedPost = {
      id: `poll-${Date.now()}`,
      author: userName,
      avatar: userAvatar,
      title: title.toUpperCase(),
      content: description,
      likes: 0,
      time: 'Agora',
      tag: 'ENQUETE',
      timestamp: Date.now(),
      comments: [],
      pollOptions: pollOptions,
      customBgType: bgType,
      customBgColor: bgColor,
      customBgImage: bgImage || undefined
    };
    onCreate(newPost);
    localStorage.removeItem(`void_draft_poll_${userName}`);
  };

  return (
    <div className="fixed inset-0 z-[500] bg-white flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden font-inter text-slate-900">
      <header className="relative z-10 px-6 py-6 flex items-center justify-between bg-slate-50 border-b border-slate-200">
        <button onClick={onBack} className="p-2 bg-slate-200 rounded-xl text-slate-500 hover:text-slate-900 transition-all active:scale-90">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div className="flex flex-col items-center flex-1 mx-4 overflow-hidden">
          <h2 className="text-[10px] font-inter font-bold text-slate-900 uppercase tracking-[0.4em] truncate max-w-full">
            {title || 'SONDA DE OPINIÃO'}
          </h2>
          <div className="flex gap-4 mt-1">
             <button onClick={() => setViewMode('editor')} className={`text-[7px] font-black uppercase tracking-widest ${viewMode === 'editor' ? 'text-cyan-600' : 'text-slate-400'}`}>Editor</button>
             <button onClick={() => setViewMode('preview')} className={`text-[7px] font-black uppercase tracking-widest ${viewMode === 'preview' ? 'text-cyan-600' : 'text-slate-400'}`}>Prévia</button>
          </div>
        </div>
        <button 
          onClick={handlePublish}
          disabled={!title.trim() || options.filter(o => o.text.trim()).length < 2}
          className="px-6 py-2 bg-cyan-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest active:scale-95 disabled:opacity-20 transition-all shadow-lg"
        >
          Lançar
        </button>
      </header>

      {viewMode === 'editor' ? (
        <main className="relative z-10 flex-1 overflow-y-auto no-scrollbar p-6 space-y-8 pb-40">
          <div className="max-w-2xl mx-auto space-y-8">
            <section className="space-y-6">
              <div className="space-y-2">
                <label className="text-[7px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4">Pergunta Central</label>
                <input 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="QUAL A SUA DIRETRIZ?..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] p-5 text-xl font-inter font-bold outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-300"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[7px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4">Contexto de Transmissão</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explique o motivo da sonda de opinião..."
                  className="w-full h-24 bg-slate-50 border border-slate-200 rounded-[1.5rem] p-5 text-sm leading-relaxed outline-none focus:border-cyan-500/50 transition-all resize-none placeholder:text-slate-300"
                />
              </div>
            </section>
            <section className="space-y-4">
               <label className="text-[7px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4">Opções de Frequência</label>
               <div className="space-y-3">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                       <div 
                         onClick={() => optionImageRefs.current[idx]?.click()}
                         className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-cyan-500/30 transition-all"
                       >
                          {opt.image ? <img src={opt.image} className="w-full h-full object-cover" /> : <span className="text-lg opacity-20">📁</span>}
                          <input type="file" className="hidden" ref={el => { optionImageRefs.current[idx] = el; }} accept="image/*" onChange={(e) => handleOptionImageUpload(idx, e)} />
                       </div>
                       <input 
                         value={opt.text}
                         onChange={(e) => {
                           const newOptions = [...options];
                           newOptions[idx].text = e.target.value;
                           setOptions(newOptions);
                         }}
                         placeholder={`OPÇÃO ${idx + 1}...`}
                         className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-5 h-12 text-[11px] font-bold outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-300"
                       />
                       {idx >= 4 && (
                         <button onClick={() => setOptions(options.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500 p-2">✕</button>
                       )}
                    </div>
                  ))}
               </div>
               {options.length < 7 && (
                 <button onClick={handleAddOption} className="w-full py-4 mt-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 hover:text-cyan-600 hover:border-cyan-500/30 transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
                    <span className="text-xl">+</span>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Adicionar Frequência Extra</span>
                 </button>
               )}
            </section>
            <div className="pt-4">
               <button onClick={() => setShowStyleHub(true)} className="w-full py-6 rounded-[2.5rem] bg-slate-50 border border-slate-200 flex items-center justify-center gap-4 group active:scale-[0.98] transition-all shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">🎨</div>
                  <div className="flex flex-col items-start">
                     <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Hub de Estilo</span>
                     <span className="text-[7px] font-bold text-cyan-600 uppercase tracking-widest opacity-60">Personalizar Fundo da Enquete</span>
                  </div>
               </button>
            </div>
          </div>
        </main>
      ) : (
        <main className="flex-1 overflow-y-auto no-scrollbar pb-32 animate-in fade-in duration-300" style={{ backgroundColor: bgColor, backgroundImage: bgType === 'image' && bgImage ? `url(${bgImage})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
          {bgType === 'image' && bgImage && <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />}
          <div className="relative z-10 max-w-2xl mx-auto p-8 pt-12 space-y-8">
            <div className="flex items-center gap-3">
              <img src={userAvatar} className="w-8 h-8 rounded-full border border-white/20" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">{userName}</span>
            </div>
            <div className="space-y-6">
              <h2 className="text-3xl font-black text-white uppercase leading-tight drop-shadow-lg">{title || 'QUAL A SUA DIRETRIZ?'}</h2>
              <p className="text-base text-slate-200 font-medium">{description || 'Explicação da sonda de opinião...'}</p>
              <div className="space-y-3">
                 {options.filter(o => o.text.trim()).map((opt, i) => (
                   <div key={i} className="relative w-full h-14 rounded-2xl border border-white/10 bg-white/5 overflow-hidden flex items-center px-4 gap-4">
                      <div className="absolute left-0 top-0 h-full w-[25%] bg-white/10" />
                      {opt.image && <img src={opt.image} className="w-10 h-10 rounded-lg object-cover shrink-0 relative z-10" />}
                      <span className="text-sm font-black uppercase text-white relative z-10">{opt.text}</span>
                      <span className="ml-auto text-xs font-orbitron text-white/40 relative z-10">25%</span>
                   </div>
                 ))}
              </div>
            </div>
          </div>
        </main>
      )}

      {showStyleHub && (
        <div className="fixed inset-0 z-[600] flex flex-col justify-end animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowStyleHub(false)} />
           <div className="relative z-10 w-full bg-white border-t border-slate-200 rounded-t-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-500">
              <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-8" />
              <div className="space-y-10 max-w-xl mx-auto">
                 <div className="flex justify-between items-center">
                    <h3 className="text-xs font-syncopate font-black text-slate-900 uppercase tracking-[0.2em]">Configuração Visual</h3>
                    <button onClick={() => setShowStyleHub(false)} className="text-slate-400 hover:text-slate-900 text-xs font-black uppercase">Fechar</button>
                 </div>
                 <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                    <button onClick={() => setBgType('color')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${bgType === 'color' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Cor Sólida</button>
                    <button onClick={() => setBgType('image')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${bgType === 'image' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Wallpaper</button>
                 </div>
                 {bgType === 'color' ? (
                   <div className="space-y-6 animate-in fade-in duration-300">
                      <div className="flex justify-center gap-4">
                         {PRESET_COLORS.map(c => (
                           <button key={c.hex} onClick={() => setBgColor(c.hex)} className={`w-12 h-12 rounded-full border-2 transition-all ${bgColor === c.hex ? 'border-cyan-500 scale-110 shadow-lg' : 'border-slate-100'}`} style={{ backgroundColor: c.hex }} />
                         ))}
                         <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-12 h-12 rounded-full bg-transparent border-none cursor-pointer" />
                      </div>
                   </div>
                 ) : (
                   <div className="space-y-6 animate-in fade-in duration-300">
                      <div onClick={() => bgInputRef.current?.click()} className="w-full aspect-video rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden flex flex-col items-center justify-center gap-3 cursor-pointer group hover:border-cyan-500/30 transition-all">
                         {bgImage ? <img src={bgImage} className="w-full h-full object-cover" /> : <><div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-xl shadow-sm">🖼️</div><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Carregar Wallpaper</span></>}
                         <input type="file" ref={bgInputRef} className="hidden" accept="image/*" onChange={handleBgUpload} />
                      </div>
                   </div>
                 )}
                 <button onClick={() => setShowStyleHub(false)} className="w-full py-5 bg-cyan-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] active:scale-95 shadow-xl transition-all">Confirmar Estilo</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PollCreation;
