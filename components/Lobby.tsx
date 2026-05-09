
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Community, UserProfile } from '../types';
import { TEST_COMMUNITIES } from '../data';
import { supabase } from '../lib/supabase';

interface LobbyProps { 
  onStart: (type: any, name: string, avatar?: string, background?: string, id?: string) => void; 
  customThemes?: any[];
  communities?: Community[];
  onSelectCommunity?: (id: string) => void;
  onPreviewCommunity?: (comm: Community) => void;
  onNavigateToFeed?: () => void;
  onViewProfile?: (profile: UserProfile) => void;
  onNavigateToChats?: () => void;
  onNavigateToLocation?: () => void;
  onNavigateToHelp?: () => void;
  onAtTopChange?: (isAtTop: boolean) => void;
  isSearchOpen?: boolean;
  onCloseSearch?: () => void;
  onLeaveCommunity?: (id: string) => void;
  onCreateCommunity?: () => void;
  onOpenSearch?: () => void;
}

export const DragonO: React.FC<{ className?: string }> = React.memo(({ className = '' }) => (
  <svg viewBox="0 0 100 100" className={`w-[1em] h-[1em] overflow-visible inline-block align-middle select-none transition-transform duration-300 ${className}`}>
    <defs>
      <filter id="dragonGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2.5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <g filter="url(#dragonGlow)">
      <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 4" className="opacity-30" />
      <path 
        d="M50,12 C70.98,12 88,29.02 88,50 C88,70.98 70.98,88 50,88 C29.02,88 12,70.98 12,50 C12,38 17.5,27.5 26,20.5 L32,27 C26,32 22,40.5 22,50 C22,65.46 34.54,78 50,78 C65.46,78 78,65.46 78,50 C78,34.54 65.46,22 50,22 L50,12 Z" 
        fill="currentColor" 
        className="opacity-95"
      />
      <path d="M50,12 L56,4 L60,16 Z" fill="currentColor" />
      <path d="M50,12 L44,4 L40,16 Z" fill="currentColor" />
      <circle cx="50" cy="50" r="34" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="120 40" className="opacity-60 animate-spin-slow" />
      <circle cx="50" cy="50" r="26" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="40 80" className="opacity-20 animate-spin-reverse" />
      <circle cx="50" cy="50" r="9" fill="currentColor" className="animate-pulse shadow-[0_0_30px_white]" />
    </g>
  </svg>
));

const DEFAULT_BANNER_FALLBACK = 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=3840&auto=format&fit=crop';
const DEFAULT_RADAR_BG = "https://storage.googleapis.com/voidyapp-storage/Fundo%20jellyfish.png";

const THEME_COLORS: Record<string, string> = {
  'Geral': '#06b6d4',
  'Romance': '#ec4899',
  'Ação': '#f97316',
  'Luta': '#ef4444',
  'Suspense': '#8b5cf6',
  'Terror': '#64748b',
  'Escolar': '#10b981',
  'Anime': '#f472b6',
  'Medieval': '#d97706',
  'Futuro': '#22d3ee',
  'Recentes': '#0ea5e9'
};

const resolveImageRef = (ref: string | undefined | null): string => {
  if (!ref) return "";
  if (!ref.startsWith('ref:')) return ref;
  const key = ref.replace('ref:', '');
  try {
    return localStorage.getItem(key) || localStorage.getItem('vimg_' + key) || "";
  } catch (e) {
    return "";
  }
};

const WELCOME_MESSAGES = [
  <>Saudações, Operativo. Você ancorou na Nexus, o <span className="text-cyan-300 font-black drop-shadow-[0_0_8px_rgba(103,232,249,0.3)]">limiar da criação absoluta</span>. Onde a estática termina, sua lenda começa. Sincronize seu link com a infinitude.</>,
  <>O Vácuo não é o fim, mas o útero de infinitas histórias. <span className="text-purple-400 font-black">Sintonize sua frequência neural</span> nos setores inexplorados e descubra espaços de mundos aguardando sua narrativa.</>,
  <>Navegue pelo Radar em busca de pulsações vitais. Cada sinal interceptado é uma porta para um novo destino. <span className="text-cyan-300 font-black">Sincronize-se</span> com outras consciências e construa realidades soberanas.</>,
  <>Mantenha seu Link Neural ativo e estável. O ecossistema VOIDY respira através de suas palavras. Em caso de dissonância, nossa <span className="text-purple-400 font-black">Central de Escuta</span> permanece em vigília no horizonte de eventos.</>
];

const WhaleBackground = React.memo(({ isFiltering }: { isFiltering: boolean }) => (
  <div className="absolute inset-0 z-0 overflow-hidden" style={{ contain: 'layout style paint', transform: 'translateZ(0)' }}>
    <img src="https://storage.googleapis.com/voidyapp-storage/Fundo.png" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover pointer-events-none" alt="Deep Ocean Floor" />
    <img src="https://storage.googleapis.com/voidyapp-storage/Algas.png" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover pointer-events-none" alt="Underwater Seaweeds" />
    <img src="https://storage.googleapis.com/voidyapp-storage/Baleia.png" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover animate-float-gpu pointer-events-none" alt="Majestic Void Whale" style={{ animationDuration: '12s' }} />
    <img src="https://storage.googleapis.com/voidyapp-storage/Bolhas.png" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover animate-bubbles-gpu pointer-events-none scale-110" alt="Rising Bubbles" />
    <div className={`absolute inset-0 bg-black/60 transition-opacity duration-300 pointer-events-none ${isFiltering ? 'opacity-100' : 'opacity-0'}`} />
    <div className="absolute inset-0 bg-gradient-to-t from-[#02040a]/80 via-transparent to-transparent pointer-events-none" />
  </div>
));

const Lobby: React.FC<LobbyProps> = ({ communities = [], onSelectCommunity, onPreviewCommunity, customThemes, onAtTopChange, isSearchOpen, onCloseSearch, onLeaveCommunity, onCreateCommunity, onOpenSearch }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [welcomeIndex, setWelcomeIndex] = useState(0);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [confirmLeaveId, setConfirmLeaveId] = useState<string | null>(null);
  const [featuredItems, setFeaturedItems] = useState(() => {
    const saved = localStorage.getItem('void_radar_featured');
    return saved ? JSON.parse(saved) : [];
  });
  const [radarWallpaper] = useState(() => localStorage.getItem('void_radar_wallpaper') || DEFAULT_RADAR_BG);
  const [themeSearchQuery, setThemeSearchQuery] = useState('');
  const [activeThemeFilter, setActiveThemeFilter] = useState<string | null>(null);

  const bubbles = useMemo(() => Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 4 + 2,
    delay: Math.random() * 10,
    duration: Math.random() * 10 + 10,
    opacity: 0.1,
    sway: Math.random() * 50 - 25
  })), []);

  useEffect(() => {
    localStorage.setItem('void_radar_featured', JSON.stringify(featuredItems));
  }, [featuredItems]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    if (onAtTopChange) onAtTopChange(scrollTop < 20);
  }, [onAtTopChange]);

  const handlePin = useCallback((e: React.MouseEvent, item: any) => {
    e.preventDefault(); e.stopPropagation();
    setFeaturedItems((prev: any[]) => {
      const isPinned = prev.find((f: any) => String(f.id) === String(item.id));
      if (isPinned) return prev.filter((f: any) => String(f.id) !== String(item.id));
      const newPin = { id: item.id, name: item.name, membersCount: item.membersCount || item.members || 0, color: item.color || 'bg-slate-800', primaryColor: item.primaryColor || '#22d3ee', banner: item.banner || item.img, avatar: item.avatar, theme: item.theme, level: item.level || 1 };
      return [newPin, ...prev];
    });
    setActiveMenuId(null);
  }, []);

  const handleLeaveFinal = useCallback((item: any) => {
    const communityId = String(item.id);
    if (onLeaveCommunity) onLeaveCommunity(communityId);
    setFeaturedItems((prev: any[]) => prev.filter((f: any) => String(f.id) !== communityId));
    setConfirmLeaveId(null); setActiveMenuId(null);
  }, [onLeaveCommunity]);

  const renderSignalItem = (item: any, section: string, index: number) => {
    const uniqueInstanceId = `${section}-${item.id}`;
    const isMenuOpen = activeMenuId === uniqueInstanceId;
    const isFavorite = featuredItems.some((f: any) => String(f.id) === String(item.id));
    const isJoined = communities.some(c => String(c.id) === String(item.id));
    const canEnterDirectly = isJoined || isFavorite;
    const isConfirming = confirmLeaveId === uniqueInstanceId;
    return (
      <div key={uniqueInstanceId} className="w-full flex flex-col">
        <div onClick={() => { if (isConfirming) return; canEnterDirectly ? onSelectCommunity?.(item.id) : onPreviewCommunity?.(item); }} className={`group/signal relative w-full p-2.5 md:p-3 rounded-xl border bg-white/[0.03] backdrop-blur-md transition-all duration-200 cursor-pointer overflow-hidden flex items-center gap-3 active:scale-[0.98] ${isJoined ? 'border-cyan-500/30 shadow-[0_0_12px_rgba(34,211,238,0.08)]' : 'border-white/5 hover:border-white/10'}`}>
           <div className="absolute inset-0 z-0 opacity-[0.03] group-hover/signal:opacity-[0.06] transition-opacity"><img src={resolveImageRef(item.banner || DEFAULT_BANNER_FALLBACK)} loading="lazy" decoding="async" className="w-full h-full object-cover grayscale" /></div>
           <div className="relative z-10 w-9 h-9 md:w-11 md:h-11 rounded-lg border border-white/10 overflow-hidden shrink-0 bg-slate-900 shadow-md"><img src={resolveImageRef(item.avatar)} loading="lazy" decoding="async" className="w-full h-full object-cover" alt="Espaço" /></div>
           <div className="relative z-10 flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5"><h4 className="text-[10px] md:text-[12px] font-black text-white uppercase tracking-tight truncate group-hover/signal:text-cyan-300 transition-colors">{item.name}</h4>{isFavorite && <div className="p-0.5 bg-cyan-500 rounded-full shadow-[0_0_5px_cyan] animate-pulse"><svg className="w-1.5 h-1.5 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z" /></svg></div>}</div>
              <div className="flex items-center gap-2"><span className="text-[5px] md:text-[7px] font-black px-1 py-0.5 rounded border border-white/5 bg-white/5 text-slate-500 uppercase tracking-widest">{item.theme || 'Geral'}</span><span className="text-[5px] md:text-[7px] font-bold text-cyan-500 uppercase tracking-tighter">{item.membersCount || item.members || 0} N</span><span className="text-[5px] md:text-[7px] font-bold text-slate-700 uppercase tracking-widest">LVL {item.level || 1}</span></div>
           </div>
           <div className="relative z-20"><button onClick={(e) => { e.stopPropagation(); e.preventDefault(); setActiveMenuId(isMenuOpen ? null : uniqueInstanceId); setConfirmLeaveId(null); }} className={`p-1.5 rounded-lg transition-all active:scale-90 ${isMenuOpen ? 'bg-cyan-500 text-black' : 'bg-white/5 text-slate-500 hover:text-white'}`}><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2 s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2 s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg></button></div>
        </div>
        <div className={`mt-1 flex gap-2 px-2 transition-all duration-300 ${isMenuOpen ? 'opacity-100 h-7 visible' : 'opacity-0 h-0 invisible overflow-hidden'}`}>{!isConfirming ? (<><button onClick={(e) => handlePin(e, item)} className={`px-4 h-full rounded-lg border font-black text-[7px] uppercase tracking-widest transition-all active:scale-95 ${isFavorite ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-white/5 text-slate-400 border-white/10'}`}>{isFavorite ? 'Remover Favorito' : 'Favoritar'}</button>{(isJoined || isFavorite) && (<button onClick={(e) => { e.stopPropagation(); setConfirmLeaveId(uniqueInstanceId); }} className="px-4 h-full bg-white/5 border border-white/10 text-slate-400 rounded-lg font-black text-[7px] uppercase tracking-widest active:scale-95 hover:text-red-400 hover:border-red-500/30">Sair</button>)}</>) : (<div className="flex gap-2 w-full animate-in fade-in slide-in-from-right-2 duration-200"><div className="flex-1 flex items-center px-3 rounded-lg bg-red-500/10 border border-red-500/20"><span className="text-[7px] font-black text-red-400 uppercase tracking-widest">Tem certeza?</span></div><button onClick={(e) => { e.stopPropagation(); handleLeaveFinal(item); }} className="px-4 h-full bg-red-600 text-white rounded-lg font-black text-[7px] uppercase tracking-widest active:scale-90">Sim</button><button onClick={(e) => { e.stopPropagation(); setConfirmLeaveId(null); }} className="px-4 h-full bg-white/10 text-slate-300 rounded-lg font-black text-[7px] uppercase tracking-widest active:scale-90">Não</button></div>)}</div>
      </div>
    );
  };

  const filteredExplorar = useMemo(() => {
    const q = themeSearchQuery.trim().toLowerCase();
    const targetTheme = activeThemeFilter?.toLowerCase().trim();
    if (!targetTheme && !q) return [];
    
    // Unir comunidades de teste e do usuário, filtrando duplicatas por ID
    const pool = [...TEST_COMMUNITIES, ...communities];
    const uniquePool = Array.from(new Map(pool.map(item => [item.id, item])).values());
    
    let resultPool = [...uniquePool];
    if (targetTheme === 'recentes') {
        resultPool.sort((a, b) => b.id.localeCompare(a.id));
    }
    
    const result = [];
    for (const c of resultPool) {
        const matchesTheme = (!targetTheme || targetTheme === 'geral' || targetTheme === 'recentes') || (c.theme?.toLowerCase().trim() === targetTheme);
        const matchesSearch = !q || (c.name.toLowerCase().includes(q) || (c.theme && c.theme.toLowerCase().includes(q)) || (c.tags && c.tags.some(t => t.toLowerCase().includes(q))));
        if (matchesTheme && matchesSearch) {
             result.push(c);
        }
    }
    return result;
  }, [activeThemeFilter, themeSearchQuery, communities]);

  const handleToggleTheme = useCallback((themeLabel: string) => { setActiveThemeFilter(prev => prev === themeLabel ? null : themeLabel); if (navigator.vibrate) navigator.vibrate(5); }, []);

  return (
    <div ref={scrollRef} onScroll={handleScroll} className="flex-1 h-full w-full relative overflow-y-auto overflow-x-hidden snap-y snap-mandatory no-scrollbar bg-[#02040a]" onClick={() => { setActiveMenuId(null); setConfirmLeaveId(null); }}>
      <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden" style={{ transform: 'translateZ(0)' }}>{bubbles.map(b => (<div key={b.id} className="absolute bottom-[-5%] rounded-full bg-white/5 animate-floating-bubbles" style={{ left: b.left, width: `${b.size}px`, height: `${b.size}px`, animationDelay: `${b.delay}s`, animationDuration: `${b.duration}s`, opacity: b.opacity, '--sway': `${b.sway}px` } as any}></div>))}</div>
      <div className="h-full w-full flex flex-col items-center justify-start gap-0 relative snap-start shrink-0 overflow-hidden bg-[#02040a]">
        <div className="absolute inset-0 z-0 overflow-hidden h-[100dvh]"><img src={resolveImageRef(radarWallpaper)} loading="lazy" decoding="async" className="w-full h-full object-cover transition-all duration-500 animate-floating-bg contrast-[1.05]" alt="Radar Background" /><div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-[#02040a] via-[#02040a]/60 to-transparent z-[1]" /></div>
        <div className="w-full flex flex-col items-center z-10 pt-4 md:pt-20 px-6 md:px-10 relative h-full">
          {isSearchOpen ? (
            <div className="w-full max-w-4xl h-full flex flex-col overflow-hidden">
               <div className="text-center px-4 pt-4 md:pt-0 shrink-0"><h2 className="text-[5px] md:text-[9px] font-syncopate font-black text-white/40 uppercase tracking-[0.6em] mb-0">Canais Sincronizados</h2><h3 className="text-sm md:text-3xl font-syncopate font-black text-white uppercase tracking-tighter">Sintonizador <span className="text-cyan-400">Local</span></h3></div>
               <div className="flex flex-col items-center w-full max-w-2xl mx-auto shrink-0 mt-4"><div className={`w-full h-11 md:h-16 relative rounded-full overflow-hidden transition-all duration-300 border-[1.5px] md:border-[2px] bg-white/[0.03] flex items-center px-4 md:px-8 backdrop-blur-md group ${localSearchQuery.trim() ? 'border-cyan-500 shadow-[inset_0_0_10px_rgba(34,211,238,0.1),0_0_20px_rgba(34,211,238,0.1)]' : 'border-white/10'}`}><svg className={`w-3 h-3 md:w-5 md:h-5 mr-3 md:mr-4 transition-colors duration-300 ${localSearchQuery.trim() ? 'text-cyan-400' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg><input value={localSearchQuery} onChange={(e) => setLocalSearchQuery(e.target.value)} placeholder="Sintonizar..." className="bg-transparent border-none outline-none text-white font-medium text-[14px] md:text-sm w-full placeholder:text-slate-700" /><button onClick={onCloseSearch} className="p-1 text-slate-500 hover:text-white ml-0.5 text-[10px] md:text-base">✕</button></div></div>
               <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 md:space-y-6 mt-4 md:mt-8 pb-32 w-full max-w-2xl mx-auto px-1">{featuredItems.length > 0 && (<div className="w-full space-y-2"><div className="flex items-center gap-3 px-2"><h3 className="text-[6px] md:text-[9px] font-black uppercase tracking-[0.3em] text-cyan-400/60">Favoritos em Sincronia</h3><div className="flex-1 h-[1px] bg-cyan-500/10" /></div><div className="flex flex-col gap-2 w-full">{featuredItems.map((item: any, idx: number) => renderSignalItem(item, "search-featured", idx))}</div></div>)}</div>
            </div>
          ) : (
            <div className={`w-full max-w-4xl space-y-4 md:space-y-16 flex flex-col items-center`}>
              <div className="max-w-3xl w-full text-center mt-20 md:mt-40 mb-10 md:mb-12 relative z-20">
                <div className={`relative bg-cyan-500/[0.04] backdrop-blur-xl border border-cyan-400/20 rounded-[1.8rem] md:rounded-[2.5rem] p-4 md:p-7 shadow-[0_0_40px_rgba(34,211,238,0.1)] transition-all duration-300 animate-float-sync cursor-pointer mx-10 md:mx-0`} onClick={() => setWelcomeIndex((prev) => (prev + 1) % WELCOME_MESSAGES.length)}>
                  <div className="text-[7px] md:text-[12px] text-white/90 font-semibold leading-relaxed uppercase tracking-wider" key={welcomeIndex}>{WELCOME_MESSAGES[welcomeIndex]}</div>
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-cyan-500 text-black text-[4px] md:text-[7px] font-black uppercase rounded-full tracking-widest shadow-lg animate-pulse">Mensagem</div>
                </div>
              </div>

              {/* Sinais em Destaque no Radar */}
              <div className="w-full max-w-2xl px-6 space-y-4 animate-in fade-in slide-in-from-bottom duration-1000 delay-300 relative z-20">
                <div className="flex items-center gap-3 px-2">
                  <h3 className="text-[7px] md:text-[9px] font-black uppercase tracking-[0.4em] text-cyan-400/60">Sinais Interceptados</h3>
                  <div className="flex-1 h-[1px] bg-cyan-500/10" />
                </div>
                <div className="flex flex-col gap-3">
                  {featuredItems.length > 0 ? (
                    featuredItems.slice(0, 3).map((item: any, idx: number) => renderSignalItem(item, "radar-featured", idx))
                  ) : (
                    <div className="py-10 border-2 border-dashed border-white/5 rounded-[2rem] flex flex-col items-center justify-center opacity-20">
                      <span className="text-2xl mb-2">📡</span>
                      <p className="text-[8px] font-black uppercase tracking-widest">Aguardando Pulsações</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="h-full w-full relative snap-start shrink-0 flex flex-col overflow-hidden bg-[#02040a]">
        <WhaleBackground isFiltering={activeThemeFilter !== null || themeSearchQuery !== ''} />
        <div className="relative z-10 flex flex-col h-full pt-8 md:pt-36 px-4">
          <div className="mb-2 md:mb-6 text-center px-4"><h2 className="text-[5px] md:text-[9px] font-syncopate font-black text-white/40 uppercase tracking-[0.6em] mb-0.5">Arquivos do Vácuo</h2><h3 className="text-sm md:text-3xl font-syncopate font-black text-white uppercase tracking-tighter">Diretrizes <span className="text-cyan-400">Temáticas</span></h3></div>
          <div className="flex flex-col items-center w-full max-w-2xl mx-auto mb-2 md:mb-8 px-2 md:px-4">
             <div className={`w-full h-11 md:h-16 relative rounded-full overflow-hidden transition-all duration-200 border-[1.5px] bg-white/[0.03] flex items-center px-4 md:px-8 backdrop-blur-md group ${themeSearchQuery.trim() ? 'border-[#ec4899] shadow-[inset_0_0_10px_rgba(236,72,153,0.1),0_0_20px_rgba(236,72,153,0.1)]' : 'border-white/10'}`}><svg className={`w-3 h-3 md:w-5 md:h-5 mr-3 md:mr-4 transition-colors duration-300 ${themeSearchQuery.trim() ? 'text-pink-300/60' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg><input value={themeSearchQuery} onChange={(e) => setThemeSearchQuery(e.target.value)} placeholder="Sintonizar..." className="bg-transparent border-none outline-none text-white font-medium text-[14px] md:text-sm w-full placeholder:text-slate-700" /></div>
             <div className="flex overflow-x-auto no-scrollbar gap-1.5 mt-2 md:mt-3 w-full py-1 px-1.5 scroll-smooth">
                <button onClick={() => handleToggleTheme('Recentes')} className={`flex-shrink-0 px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[6px] md:text-[9px] font-black uppercase tracking-widest border transition-all duration-150 active:scale-95 touch-manipulation`} style={{ backgroundColor: activeThemeFilter === 'Recentes' ? '#0ea5e9' : 'rgba(255,255,255,0.05)', borderColor: activeThemeFilter === 'Recentes' ? '#0ea5e9' : 'rgba(255,255,255,0.1)', color: activeThemeFilter === 'Recentes' ? '#fff' : '#64748b' }}>Recentes</button>
                {(customThemes || []).map((theme) => { const isActive = activeThemeFilter === theme.label; return (<button key={theme.id} onClick={() => handleToggleTheme(theme.label)} className="flex-shrink-0 px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[6px] md:text-[9px] font-black uppercase tracking-widest border transition-all duration-150 active:scale-95 touch-manipulation" style={{ backgroundColor: isActive ? (THEME_COLORS[theme.label] || '#94a3b8') : 'rgba(255,255,255,0.05)', borderColor: isActive ? (THEME_COLORS[theme.label] || '#94a3b8') : 'rgba(255,255,255,0.1)', color: isActive ? '#fff' : '#64748b' }}>{theme.label}</button>); })}
             </div>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar pb-32"><div className="max-w-4xl mx-auto flex flex-col gap-3 md:gap-5 px-4">{(activeThemeFilter || themeSearchQuery.trim()) ? (filteredExplorar.length > 0 ? filteredExplorar.map((comm) => { const isFavorite = featuredItems.some((f: any) => String(f.id) === String(comm.id)); const isJoined = communities.some(c => String(c.id) === String(comm.id)); const themeColor = THEME_COLORS[comm.theme || ''] || '#22d3ee'; return (<div key={String(comm.id)} onClick={() => { if (isJoined || isFavorite) onSelectCommunity?.(comm.id); else onPreviewCommunity?.(comm); }} className="flex gap-4 md:gap-6 items-center group/item cursor-pointer z-[100] bg-white/[0.02] hover:bg-white/[0.05] p-3 md:p-4 rounded-2xl md:rounded-3xl border border-white/5 transition-all duration-300"><div className={`w-14 h-14 md:w-20 md:h-20 rounded-xl md:rounded-2xl border-2 overflow-hidden bg-slate-900 shrink-0 shadow-lg relative group transition-transform duration-300 group-hover/item:scale-105`} style={{ borderColor: themeColor }}><img src={resolveImageRef(comm.avatar)} className="w-full h-full object-cover" alt="Icon" /><div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" /></div><div className="flex-1 flex flex-col gap-1 md:gap-2 pointer-events-none"><div className="flex items-center gap-2"><h4 className="text-[9px] md:text-base font-black text-white uppercase tracking-widest truncate max-w-[120px] md:max-w-none">{comm.name}</h4><span className="text-[5px] md:text-[8px] px-1.5 py-0.5 rounded-full border border-white/10 bg-white/5 text-slate-500 font-black uppercase tracking-tighter" style={{ color: themeColor, borderColor: `${themeColor}40` }}>{comm.theme || 'Geral'}</span></div><p className="text-[7px] md:text-sm text-slate-400 font-medium heavyweight leading-relaxed line-clamp-2 md:line-clamp-3">{comm.description || 'Setor em sincronia silenciosa.'}</p><div className="flex items-center gap-3 mt-1"><div className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_5px_cyan]"></div><span className="text-[5px] md:text-[8px] font-black uppercase text-slate-500 tracking-widest">{comm.membersCount} N</span></div></div></div><div className="pr-2 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 hidden md:block"><svg className="w-5 h-5 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg></div></div>); }) : (<div className="col-span-full py-10 md:py-20 flex flex-col items-center justify-center opacity-20 text-center"><span className="text-base md:text-4xl mb-1.5">📡</span><p className="text-[5px] md:text-[10px] font-black uppercase tracking-[0.4em] text-white">Sinal nulo</p></div>)) : null}</div></div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .snap-y { scroll-snap-type: y mandatory; }
        .snap-start { scroll-snap-align: start; }
        @keyframes floating-bubbles { 0% { transform: translate3d(0, 110vh, 0) scale(0.6); opacity: 0; } 15% { opacity: 0.1; } 85% { opacity: 0.1; } 100% { transform: translate3d(var(--sway), -20vh, 0) scale(1.1); opacity: 0; } }
        .animate-floating-bubbles { animation: floating-bubbles linear infinite; will-change: transform, opacity; }
        @keyframes floating-bg { 0% { transform: translate3d(0, 0, 0) scale(1.02); } 50% { transform: translate3d(0, -12px, 0) scale(1.04); } 100% { transform: translate3d(0, 0, 0) scale(1.02); } }
        .animate-floating-bg { animation: floating-bg 12s ease-in-out infinite; }
      `}} />
    </div>
  );
};

export default Lobby;
