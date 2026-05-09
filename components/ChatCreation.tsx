
import React, { useState, useEffect, useRef } from 'react';
import { CommunityChannel } from '../types';

interface ChatCreationProps {
  onBack: () => void;
  onCreate: (channel: CommunityChannel) => void;
  userName: string;
  verifySafety?: (content: string, type?: 'image' | 'text') => Promise<boolean>;
}

const RPG_THEMES = [
  { id: 'MEDIEVAL', label: 'Fantasia Medieval', icon: '🏰', color: 'bg-amber-600' },
  { id: 'CYBERPUNK', label: 'Cyberpunk', icon: '🌆', color: 'bg-pink-600' },
  { id: 'HORROR', label: 'Terror Cósmico', icon: '🐙', color: 'bg-purple-900' },
  { id: 'POST_APOC', label: 'Pós-Apocalipse', icon: '☢️', color: 'bg-stone-700' },
  { id: 'GALACTIC', label: 'Sci-Fi Dark', icon: '🚀', color: 'bg-blue-800' }
];

const SHOP_TYPES = [
  { id: 'WEAPON', label: 'Armaria', icon: '⚔️' },
  { id: 'ITEM', label: 'Mercado', icon: '🎒' },
  { id: 'MAGIC', label: 'Arcano', icon: '🔮' },
  { id: 'FOOD', label: 'Taverna', icon: '🍺' }
];

const ChatCreation: React.FC<ChatCreationProps> = ({ onBack, onCreate, userName, verifySafety }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'TEXT' | 'RPG'>('TEXT');
  const [isPrivate, setIsPrivate] = useState(false);
  const [showStyleHub, setShowStyleHub] = useState(false);
  
  // Customization assets
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  // RPG Specific State
  const [rpgTheme, setRpgTheme] = useState('MEDIEVAL');
  const [isCustomTheme, setIsCustomTheme] = useState(false);
  const [customThemeName, setCustomThemeName] = useState('');
  const [customThemeIcon, setCustomThemeIcon] = useState('🎲');

  const [scenery, setScenery] = useState('');
  const [shops, setShops] = useState<{ name: string; type: string; owner: string; items: any[] }[]>([
    { name: 'Arsenal Central', type: 'WEAPON', owner: '', items: [] },
    { name: 'Suprimentos', type: 'ITEM', owner: '', items: [] }
  ]);
  const [newShopName, setNewShopName] = useState('');
  const [newShopType, setNewShopType] = useState('WEAPON');

  const coverInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  // Draft Logic
  useEffect(() => {
    const key = `void_draft_chat_${userName}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.name) setName(data.name);
        if (data.description) setDescription(data.description);
        if (data.type) setType(data.type);
        if (data.coverImage) setCoverImage(data.coverImage);
        if (data.backgroundImage) setBackgroundImage(data.backgroundImage);
        if (data.isPrivate !== undefined) setIsPrivate(data.isPrivate);
        // RPG Drafts
        if (data.rpgTheme) setRpgTheme(data.rpgTheme);
        if (data.scenery) setScenery(data.scenery);
        if (data.shops) setShops(data.shops);
      } catch (e) { console.error(e); }
    }
  }, [userName]);

  useEffect(() => {
    const key = `void_draft_chat_${userName}`;
    const timeout = setTimeout(() => {
      localStorage.setItem(key, JSON.stringify({ 
        name, description, type, coverImage, backgroundImage, isPrivate,
        rpgTheme, scenery, shops 
      }));
    }, 500);
    return () => clearTimeout(timeout);
  }, [name, description, type, coverImage, backgroundImage, isPrivate, userName, rpgTheme, scenery, shops]);

  const [isCreating, setIsCreating] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setter(base64);
        if (verifySafety) verifySafety(base64).catch(console.error);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddShop = () => {
    if (newShopName.trim() && shops.length < 6) {
      setShops([...shops, { name: newShopName, type: newShopType, owner: '', items: [] }]);
      setNewShopName('');
    }
  };

  const handleCreate = async () => {
    if (!name.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const channelId = `ch-${Date.now()}`;
      
      // Construct extra data for RPG
      let finalTheme = { id: rpgTheme, label: '', icon: '' };
      
      if (isCustomTheme) {
          finalTheme = {
              id: 'CUSTOM',
              label: customThemeName || 'Tema Personalizado',
              icon: customThemeIcon || '🎲'
          };
      } else {
          const selected = RPG_THEMES.find(t => t.id === rpgTheme);
          finalTheme = {
              id: rpgTheme,
              label: selected?.label || 'RPG',
              icon: selected?.icon || '⚔️'
          };
      }

      const rpgData = type === 'RPG' ? {
        theme: finalTheme,
        scenery: scenery,
        shops: shops
      } : undefined;

      const newChannel: CommunityChannel = {
        id: channelId,
        name: name.toUpperCase(),
        type: type as any,
        messages: [],
        description: description,
        cover: coverImage || undefined,
        background: backgroundImage || undefined,
        isPrivate: isPrivate,
        membersCount: 1,
        rpgData: rpgData,
        admins: [userName],
        coAdmins: []
      };

      onCreate(newChannel);
      localStorage.removeItem(`void_draft_chat_${userName}`);
    } catch (error) {
      console.error("Erro ao criar chat:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[700] bg-[#02040a] flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden font-inter text-white">
      <header className="relative z-10 px-6 py-6 flex items-center justify-between bg-black/20 backdrop-blur-md border-b border-white/5">
        <button onClick={onBack} className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all active:scale-90">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-[10px] font-syncopate font-black text-white uppercase tracking-[0.4em]">Nova Frequência</h2>
          <span className={`text-[7px] font-bold uppercase tracking-widest mt-1 ${type === 'RPG' ? 'text-amber-500' : 'text-emerald-500'}`}>
            {type === 'RPG' ? 'Construtor de Vila RPG' : 'Gerador de Canais'}
          </span>
        </div>
        <button 
          onClick={handleCreate}
          disabled={!name.trim() || isCreating}
          className={`px-6 py-2 text-black rounded-full text-[9px] font-black uppercase tracking-widest active:scale-95 disabled:opacity-50 transition-all shadow-lg flex items-center gap-2 ${type === 'RPG' ? 'bg-amber-500 shadow-amber-500/30' : 'bg-emerald-500 shadow-emerald-500/30'}`}
        >
          {isCreating ? (
            <>
              <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
              <span>Criando...</span>
            </>
          ) : (
            'Criar'
          )}
        </button>
      </header>

      <main className="relative z-10 flex-1 overflow-y-auto no-scrollbar p-6 space-y-8 pb-40">
        <div className="max-w-2xl mx-auto space-y-8">
          
          <section className="space-y-4">
             <div className="grid grid-cols-2 gap-3 bg-white/[0.02] p-1 rounded-2xl border border-white/5">
                <button onClick={() => setType('TEXT')} className={`py-3 rounded-xl flex flex-col items-center gap-1 transition-all ${type === 'TEXT' ? 'bg-emerald-500 text-black shadow-lg' : 'text-slate-500 hover:text-emerald-400'}`}>
                   <span className="text-xl">💬</span>
                   <span className="text-[8px] font-black uppercase tracking-widest">Texto Padrão</span>
                </button>
                <button onClick={() => setType('RPG')} className={`py-3 rounded-xl flex flex-col items-center gap-1 transition-all ${type === 'RPG' ? 'bg-amber-500 text-black shadow-lg' : 'text-slate-500 hover:text-amber-400'}`}>
                   <span className="text-xl">🏰</span>
                   <span className="text-[8px] font-black uppercase tracking-widest">Sistema RPG</span>
                </button>
             </div>
          </section>

          <section className="space-y-6">
            <div className="space-y-2">
              <label className="text-[7px] font-black text-slate-500 uppercase tracking-[0.4em] ml-4">Identificação {type === 'RPG' ? 'da Vila' : 'do Canal'}</label>
              <input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={type === 'RPG' ? "NOME DA VILA..." : "NOME_DO_CANAL..."}
                className={`w-full bg-white/5 border rounded-[1.5rem] p-5 text-xl font-black uppercase outline-none transition-all placeholder:text-slate-800 ${type === 'RPG' ? 'border-amber-500/30 focus:border-amber-500' : 'border-emerald-500/30 focus:border-emerald-500'}`}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[7px] font-black text-slate-500 uppercase tracking-[0.4em] ml-4">{type === 'RPG' ? 'Lore do Cenário' : 'Diretriz do Canal'}</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={type === 'RPG' ? "Descreva a atmosfera, o clima e a história desta localidade..." : "Descreva o propósito desta frequência..."}
                className={`w-full h-32 bg-white/5 border rounded-[2rem] p-6 text-base outline-none transition-all resize-none placeholder:text-slate-800 ${type === 'RPG' ? 'border-amber-500/30 focus:border-amber-500' : 'border-emerald-500/30 focus:border-emerald-500'}`}
              />
            </div>
          </section>

          {type === 'RPG' && (
            <div className="animate-in slide-in-from-bottom duration-500 space-y-8">
               
               <section className="space-y-4 bg-amber-900/10 border border-amber-500/20 rounded-[2rem] p-6">
                  <div className="flex items-center justify-between">
                     <label className="text-[8px] font-black text-amber-400 uppercase tracking-[0.3em]">Comércio Local (Lojas)</label>
                     <span className="text-[7px] font-bold text-amber-600/60 uppercase">{shops.length}/6 Ativos</span>
                  </div>

                  <div className="space-y-3">
                     {shops.map((shop, idx) => (
                        <div key={idx} className="flex flex-col gap-2 p-3 bg-black/40 rounded-xl border border-amber-500/10">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <span className="text-lg">{SHOP_TYPES.find(t => t.id === shop.type)?.icon || '🏪'}</span>
                                 <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-white uppercase tracking-wider">{shop.name}</span>
                                    <span className="text-[6px] font-bold text-amber-500 uppercase">{SHOP_TYPES.find(t => t.id === shop.type)?.label}</span>
                                 </div>
                              </div>
                              <button onClick={() => setShops(shops.filter((_, i) => i !== idx))} className="text-slate-600 hover:text-red-500 p-2">✕</button>
                           </div>
                           <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-lg border border-white/5">
                              <span className="text-[6px] font-black text-slate-500 uppercase">Dono:</span>
                              <span className="text-[7px] font-bold text-amber-400 uppercase">{shop.owner || 'SEM DONO'}</span>
                           </div>
                        </div>
                     ))}
                  </div>

                  {shops.length < 6 && (
                     <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-amber-500/10">
                        <div className="flex gap-2">
                           <div className="relative group">
                              <select 
                                value={newShopType} 
                                onChange={(e) => setNewShopType(e.target.value)}
                                className="appearance-none bg-black/40 border border-amber-500/30 rounded-xl h-10 pl-3 pr-8 text-[10px] text-amber-400 font-bold outline-none"
                              >
                                 {SHOP_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                              </select>
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-amber-500 text-[8px]">▼</div>
                           </div>
                           <input 
                              value={newShopName}
                              onChange={(e) => setNewShopName(e.target.value)}
                              placeholder="Nome da Loja..."
                              className="flex-1 bg-black/40 border border-amber-500/30 rounded-xl px-4 text-[10px] text-white outline-none focus:border-amber-500 placeholder:text-amber-900"
                           />
                           <button onClick={handleAddShop} disabled={!newShopName.trim()} className="bg-amber-500 text-black h-10 w-10 rounded-xl flex items-center justify-center font-black active:scale-95 disabled:opacity-50">+</button>
                        </div>
                     </div>
                  )}
               </section>

            </div>
          )}

          <section className="pt-4">
             <button 
               onClick={() => setShowStyleHub(true)}
               className={`w-full py-6 rounded-[2rem] bg-gradient-to-r border flex items-center justify-center gap-4 active:scale-[0.98] transition-all shadow-xl group ${type === 'RPG' ? 'from-amber-900/20 to-orange-900/20 border-amber-500/30' : 'from-emerald-900/20 to-teal-900/20 border-emerald-500/30'}`}
             >
                <div className={`w-10 h-10 rounded-full border flex items-center justify-center text-xl group-hover:scale-110 transition-transform ${type === 'RPG' ? 'bg-amber-500/20 border-amber-500/40' : 'bg-emerald-500/20 border-emerald-500/40'}`}>✨</div>
                <div className="flex flex-col items-start text-left">
                   <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Hub de Estilo</span>
                   <span className={`text-[7px] font-bold uppercase tracking-widest opacity-60 ${type === 'RPG' ? 'text-amber-400' : 'text-emerald-400'}`}>Personalizar Capa e Fundo</span>
                </div>
             </button>
          </section>

          <section className="space-y-4 pt-4 border-t border-white/5">
             <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="flex flex-col">
                   <span className="text-[10px] font-black text-white uppercase tracking-widest">Acesso Restrito</span>
                   <span className="text-[7px] font-bold text-slate-500 uppercase tracking-tighter">Apenas membros autorizados (Staff)</span>
                </div>
                <button 
                  onClick={() => setIsPrivate(!isPrivate)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${isPrivate ? (type === 'RPG' ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-slate-700'}`}
                >
                   <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isPrivate ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
             </div>
          </section>

        </div>
      </main>

      {showStyleHub && (
        <div className="fixed inset-0 z-[800] flex flex-col justify-end animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowStyleHub(false)} />
           <div className={`relative z-10 w-full bg-[#050714] border-t rounded-t-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-500 ${type === 'RPG' ? 'border-amber-500/30' : 'border-emerald-500/30'}`}>
              <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-8" />
              
              <div className="space-y-8 max-w-xl mx-auto">
                 <div className="flex justify-between items-center">
                    <h3 className={`text-xs font-syncopate font-black uppercase tracking-[0.2em] ${type === 'RPG' ? 'text-amber-400' : 'text-emerald-400'}`}>Sincronia Visual</h3>
                    <button onClick={() => setShowStyleHub(false)} className="text-slate-500 hover:text-white text-xs font-black uppercase">Fechar</button>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                       <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest text-center block">Capa da Frequência</label>
                       <div 
                         onClick={() => coverInputRef.current?.click()}
                         className={`aspect-square rounded-3xl border-2 border-dashed bg-white/5 overflow-hidden flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group ${type === 'RPG' ? 'border-white/10 hover:border-amber-500/30' : 'border-white/10 hover:border-emerald-500/30'}`}
                       >
                          {coverImage ? (
                            <img src={coverImage} className="w-full h-full object-cover" alt="Cover" />
                          ) : (
                            <>
                              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-lg">🖼️</div>
                              <span className="text-[7px] font-black text-slate-600 uppercase">Subir Foto</span>
                            </>
                          )}
                          <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setCoverImage)} />
                       </div>
                       {coverImage && <button onClick={() => setCoverImage(null)} className="w-full text-[6px] font-black text-red-500 uppercase">Remover</button>}
                    </div>

                    <div className="space-y-3">
                       <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest text-center block">Fundo do Chat</label>
                       <div 
                         onClick={() => bgInputRef.current?.click()}
                         className={`aspect-square rounded-3xl border-2 border-dashed bg-white/5 overflow-hidden flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group ${type === 'RPG' ? 'border-white/10 hover:border-amber-500/30' : 'border-white/10 hover:border-emerald-500/30'}`}
                       >
                          {backgroundImage ? (
                            <img src={backgroundImage} className="w-full h-full object-cover" alt="Background" />
                          ) : (
                            <>
                              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-lg">🎨</div>
                              <span className="text-[7px] font-black text-slate-600 uppercase">Subir Wallpaper</span>
                            </>
                          )}
                          <input type="file" ref={bgInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setBackgroundImage)} />
                       </div>
                       {backgroundImage && <button onClick={() => setBackgroundImage(null)} className="w-full text-[6px] font-black text-red-500 uppercase">Remover</button>}
                    </div>
                 </div>

                 <button 
                   onClick={() => setShowStyleHub(false)}
                   className={`w-full py-5 text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] active:scale-95 shadow-xl transition-all ${type === 'RPG' ? 'bg-amber-500 shadow-amber-500/20' : 'bg-emerald-500 shadow-emerald-500/20'}`}
                 >Confirmar Design</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ChatCreation;
