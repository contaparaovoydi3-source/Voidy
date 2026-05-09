
import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, Community } from '../types';

interface CentralLocationProps {
  onStartChat?: (name: string, avatar: string) => void;
  onViewProfile?: (profile: UserProfile) => void;
  onBack: () => void;
  communities?: Community[];
  onSelectCommunity?: (id: string) => void;
  onPreviewCommunity?: (comm: Community) => void;
  onCreateCommunity?: () => void;
}

const INITIAL_FEATURED = [
  { id: 'm1', name: 'RPG Real Life', members: '1,943', color: 'bg-blue-600', primaryColor: '#3b82f6', img: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=400', description: 'Simulação da vida cotidiana com elements narrativos intensos.', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=Life' },
  { id: 'm2', name: 'RAK - RPG ABO 🐺', members: '799', color: 'bg-slate-700', primaryColor: '#22d3ee', img: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400', description: 'Universo alternativo com dinâmicas de matilha e hierarquia social.', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=Wolf' },
  { id: 'md3', name: 'Elite Nexus', members: '2.5k', color: 'bg-purple-900', primaryColor: '#a855f7', img: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=400', description: 'O ponto de encontro para os operativos de elite do sistema.', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=Elite' }
];

const INITIAL_RECENT = [
  { id: 'm3', name: 'Stranger Things: RPG', members: '133', color: 'bg-amber-900/40', primaryColor: '#f59e0b', img: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=400', description: 'Mistérios sobrenaturais e aventuras nos anos 80.', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=Stranger' },
  { id: 'm4', name: 'Divulgação', members: '332', color: 'bg-yellow-700/60', primaryColor: '#ffffff', img: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=cat', description: 'Espaço aberto para troca de frequências e divulgação de novos clusters.', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=Promo' },
  { id: 'mr5', name: 'Vácuo Profundo', members: '50', color: 'bg-slate-900', primaryColor: '#64748b', img: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=400', description: 'Exploração espacial em setores desconhecidos da galáxia.', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=Void' }
];

const CentralLocation: React.FC<CentralLocationProps> = ({ onBack, communities = [], onSelectCommunity, onPreviewCommunity, onCreateCommunity }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [transitionImg, setTransitionImg] = useState<string | null>(null);
  const [isFabHubOpen, setIsFabHubOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const [featuredItems, setFeaturedItems] = useState(() => {
    const saved = localStorage.getItem('void_radar_featured');
    return saved ? JSON.parse(saved) : INITIAL_FEATURED;
  });

  useEffect(() => {
    localStorage.setItem('void_radar_featured', JSON.stringify(featuredItems));
  }, [featuredItems]);

  const handleEnterCommunity = (comm: any) => {
    if (onSelectCommunity) {
      const img = comm.homeCover || comm.banner || comm.img;
      setTransitionImg(img);
      setTimeout(() => {
        onSelectCommunity(comm.id);
      }, 1200);
    }
  };

  const handleShare = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    setActiveMenuId(null);
    if (navigator.share) {
      navigator.share({
        title: item.name,
        text: `Sincronize-se com ${item.name} no VOIDY.`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link de sincronia copiado.");
    }
  };

  const handlePin = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    setActiveMenuId(null);
    const isPinned = featuredItems.find((f: any) => f.id === item.id);
    
    if (isPinned) {
      setFeaturedItems(featuredItems.filter((f: any) => f.id !== item.id));
      alert(`Sinal ${item.name} desafixado do núcleo central.`);
    } else {
      const newPin = {
          id: item.id,
          name: item.name,
          members: item.members || item.membersCount,
          color: item.color || 'bg-slate-800',
          primaryColor: item.primaryColor || '#22d3ee',
          img: item.img || item.banner,
          description: item.description || '',
          avatar: item.avatar
      };
      setFeaturedItems([newPin, ...featuredItems]);
      alert(`Sinal ${item.name} sincronizado em destaque.`);
    }
  };

  const renderCard = (item: any, section: string, isMinimized: boolean = false) => {
    const uniqueInstanceId = `${section}-${item.id}`;
    const isMenuOpen = activeMenuId === uniqueInstanceId;
    const isPinned = featuredItems.some((f: any) => f.id === item.id);

    return (
        <div 
          key={uniqueInstanceId} 
          onClick={() => onPreviewCommunity?.(item)}
          className={`relative rounded-2xl overflow-hidden cursor-pointer active:scale-95 transition-all shadow-lg shrink-0 border-2 ${isMinimized ? 'w-32 h-44' : 'aspect-video'}`}
          style={{ borderColor: item.primaryColor || '#22d3ee', backgroundColor: item.color || '#0a0c1a' }}
        >
          <img src={item.img || item.banner} className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay" alt={item.name} />
          
          <div className="absolute top-2 left-2 w-7 h-7 rounded-lg overflow-hidden border border-white/20 z-20 shadow-md bg-slate-900">
             <img src={item.avatar} className="w-full h-full object-cover" alt="Icon" />
          </div>
    
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent" />
          
          <div className="absolute top-2 right-2 z-[60]">
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveMenuId(isMenuOpen ? null : uniqueInstanceId); }}
                className={`p-1.5 backdrop-blur-md rounded-full text-white/70 hover:text-white transition-all border border-white/10 ${isMenuOpen ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-black/40'}`}
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2 s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2 s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </button>
    
              {isMenuOpen && (
                  <div className="absolute top-10 right-0 w-32 bg-[#0a0c14] border border-white/10 rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 pointer-events-auto">
                      <button onClick={(e) => handlePin(e, item)} className="w-full px-4 py-3 text-[9px] font-black text-white uppercase text-left hover:bg-cyan-500/10 flex items-center gap-2">
                        <span>📌</span> {isPinned ? 'Desafixar' : 'Fixar'}
                      </button>
                      <button onClick={(e) => handleShare(e, item)} className="w-full px-4 py-3 text-[9px] font-black text-white uppercase text-left border-t border-white/5 hover:bg-white/5 flex items-center gap-2">
                        <span>📡</span> Partilhar
                      </button>
                  </div>
              )}
          </div>
    
          <div className="absolute bottom-3 left-3 right-3">
            <h4 className="text-[10px] font-black text-white uppercase truncate mb-0.5 drop-shadow-md">{item.name}</h4>
            <p className="text-[8px] font-bold text-white/60 uppercase">{item.members || item.membersCount} Membros</p>
          </div>
        </div>
    );
  };

  const renderSectionHeader = (title: string) => (
    <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] px-2 mb-4">{title}</h3>
  );

  return (
    <div className="flex-1 h-full w-full bg-[#02040a] flex flex-col overflow-hidden relative animate-in fade-in duration-300" onClick={() => setActiveMenuId(null)}>
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-500/20 via-transparent to-transparent pointer-events-none" />
      
      {/* TRANSITION OVERLAY */}
      {transitionImg && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-black animate-sync-fade-bg" />
          <img 
            src={transitionImg} 
            className="w-full h-full object-cover animate-sync-wallpaper" 
          />
        </div>
      )}

      <header className="relative z-10 px-8 pt-8 pb-4 flex flex-col gap-6 border-b border-white/5 backdrop-blur-xl bg-black/20">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
          </div>
          <button onClick={onBack} className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
          </button>
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-cyan-500/5 rounded-2xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
          <div className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 transition-all group-focus-within:border-cyan-500/50 group-focus-within:bg-white/[0.08]">
            <svg className="w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sintonizar Frequência..." 
              className="flex-1 bg-transparent border-none outline-none text-white text-[11px] font-bold placeholder:text-slate-600 uppercase tracking-widest"
            />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 no-scrollbar relative z-10 pb-48">
        <div className="mb-8">
          {renderSectionHeader("Centrais em destaque")}
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-1">
            {featuredItems.map((item: any) => renderCard(item, 'featured', true))}
          </div>
        </div>

        <div className="mb-10">
          {renderSectionHeader("Centrais recentes")}
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-1">
            {INITIAL_RECENT.map(item => renderCard(item, 'recent', true))}
          </div>
        </div>

        <div>
          {renderSectionHeader("Centrais de compartilhamento")}
          <div className="grid grid-cols-2 gap-3">
            {communities.map(comm => renderCard({ ...comm, isReal: true }, 'shared', false))}
            {communities.length === 0 && Array.from({ length: 4 }).map((_, i) => (
               <div key={i} className="aspect-video rounded-2xl border-2 border-dashed border-white/5 flex items-center justify-center bg-white/[0.01]">
                  <span className="text-[8px] font-black text-slate-800 uppercase tracking-widest">Sinal Vazio</span>
               </div>
            ))}
          </div>
        </div>
        
        <div className="mt-12 opacity-20 text-center">
          <div className="w-10 h-[1px] bg-cyan-500 mx-auto mb-4"></div>
          <p className="text-[9px] font-black text-white uppercase tracking-[0.5em]">Limiar dos Registros Alcançado</p>
        </div>
      </div>

      {/* FAB - Deslocado levemente para a direita */}
      <div className="absolute bottom-28 left-[54%] -translate-x-1/2 z-[100] flex flex-col items-center">
        {isFabHubOpen && (
          <div className="mb-6 animate-in zoom-in fade-in duration-500">
             <button 
               onClick={() => { onCreateCommunity?.(); setIsFabHubOpen(false); }}
               className="px-10 py-5 bg-black/40 backdrop-blur-2xl border border-cyan-500/30 rounded-full flex items-center gap-4 shadow-[0_0_40px_rgba(0,0,0,0.5)] hover:bg-cyan-500/10 transition-all active:scale-95 group"
             >
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-lg shadow-inner">🏗️</div>
                <span className="text-[11px] font-syncopate font-black text-white uppercase tracking-[0.2em] whitespace-nowrap">Criar Espaço Compartilhado</span>
             </button>
          </div>
        )}
        <button 
          onClick={() => setIsFabHubOpen(!isFabHubOpen)}
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 active:scale-90 shadow-[0_0_50px_rgba(34,211,238,0.2)] border-2 ${isFabHubOpen ? 'bg-red-500/10 border-red-400/30 rotate-45' : 'bg-white/5 border-white/10 backdrop-blur-md'}`}
        >
          <svg className="w-12 h-12 text-white opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/>
          </svg>
        </button>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        @keyframes sync-wallpaper {
          0% { transform: scale(0.6); opacity: 0; filter: blur(50px) brightness(3); }
          30% { transform: scale(1); opacity: 1; filter: blur(0px) brightness(1.2); }
          60% { transform: scale(1.02); opacity: 1; filter: blur(0px) brightness(1); }
          100% { transform: scale(1.15); opacity: 0; filter: blur(40px) brightness(0.2); }
        }

        @keyframes sync-fade-bg {
          0% { opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { opacity: 0; }
        }

        .animate-sync-wallpaper {
          animation: sync-wallpaper 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .animate-sync-fade-bg {
          animation: sync-fade-bg 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}} />
    </div>
  );
};

export default CentralLocation;
