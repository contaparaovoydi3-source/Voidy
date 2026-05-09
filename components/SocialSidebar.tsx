
import React, { useState } from 'react';
import { SidebarIcon } from './CommunitySidebar';
import { Community } from '../types';

interface SocialSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userAvatar: string;
  userName: string;
  onOpenProfile: () => void;
  onNavigateToFeed: () => void;
  onNavigateToPrivate: () => void;
  onNavigateToChats: () => void;
  onNavigateToMembers: () => void;
  onNavigateToPublicChat: () => void;
  onNavigateToRanking: () => void;
  onNavigateToDrafts?: () => void;
  onCreateCluster?: () => void;
  onHelp?: () => void;
  onReset: () => void;
  onGoHome?: () => void;
  onOpenStore?: () => void;
  communities: Community[];
  onSelectCommunity: (id: string) => void;
}

const SocialSidebar: React.FC<SocialSidebarProps> = ({ 
  isOpen, onClose, userAvatar, userName, onOpenProfile, onNavigateToFeed, 
  onNavigateToPrivate, onNavigateToChats, onNavigateToMembers, onNavigateToPublicChat, onNavigateToRanking, onNavigateToDrafts, onCreateCluster, 
  onHelp, onReset, onGoHome, onOpenStore, communities, onSelectCommunity 
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowLogoutConfirm(true);
  };

  const menuItems = [
    { id: 'inicio', icon: 'inicio', label: 'Início', action: onGoHome || onNavigateToFeed },
    { id: 'feed', icon: 'feed', label: 'Feed Principal', action: onNavigateToFeed },
    { id: 'privado', icon: 'privado', label: 'Privado', action: onNavigateToPrivate },
    { id: 'chats', icon: 'chats', label: 'Sinal', action: onNavigateToChats },
    { id: 'membros', icon: 'Membros', label: 'Membros', action: onNavigateToMembers },
    { id: 'public_chat', icon: 'chats', label: 'Nexus Global', action: onNavigateToPublicChat },
    { id: 'create_cluster', icon: 'create_cluster', label: 'Criar espaços', action: onCreateCluster || (() => {}) },
    { id: 'drafts', icon: 'CONFIGURACAO', label: 'Rascunhos', action: onNavigateToDrafts || (() => {}) },
    { id: 'ranking', icon: 'ranking', label: 'Ranking', action: onNavigateToRanking },
    { id: 'loja', icon: 'loja', label: 'Loja', action: onOpenStore || (() => {}) },
    { id: 'help', icon: 'help', label: 'Ajuda', action: onHelp || (() => {}) },
  ];

  return (
    <div className={`fixed inset-0 z-[200] flex transition-all duration-500 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      <div 
        className={`absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity duration-700 ease-out ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose} 
      />

      <div 
        className={`relative flex h-full w-[60%] max-w-[240px] bg-[#0a0c1a] shadow-2xl transition-transform duration-700 border-r border-[#0a1428] overflow-hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)' }}
      >
        
        {showLogoutConfirm && (
          <div className="absolute inset-0 z-[250] bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-300">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-5 animate-pulse">
              <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-[10px] font-syncopate font-black text-white uppercase tracking-[0.2em] mb-4">Logoff</h3>
            <div className="flex flex-col gap-2 w-full">
              <button onClick={() => onReset()} className="w-full py-3 bg-red-600 text-white rounded-xl text-[8px] font-black uppercase tracking-[0.3em] shadow-lg shadow-red-600/20">Encerrar Link</button>
              <button onClick={() => setShowLogoutConfirm(false)} className="w-full py-3 bg-white/5 border border-white/10 text-slate-400 rounded-xl text-[8px] font-black uppercase tracking-[0.3em]">Abortar</button>
            </div>
          </div>
        )}

        <div className="w-[50px] h-full bg-[#05060a] flex flex-col items-center py-5 gap-3.5 border-r border-[#0a1428] z-20">
          <button onClick={handleLogoutClick} className="w-7 h-7 flex flex-col items-center justify-center text-slate-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            <span className="text-[6px] font-black uppercase mt-0.5">Sair</span>
          </button>
          <div className="w-5 h-[1px] bg-white/5 my-0.5"></div>
          {communities.slice(0, 6).map((c) => (
            <button 
              key={c.id} 
              onClick={() => onSelectCommunity(c.id)}
              className="relative group cursor-pointer active:scale-90 transition-transform"
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 bg-slate-900/50 hover:border-cyan-500/50 transition-colors">
                <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
              </div>
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col relative overflow-hidden bg-[#0a0c14]">
          <div className="absolute inset-0 z-0 overflow-hidden">
            {/* Imagem lúcida (sem blur) */}
            <img src="https://storage.googleapis.com/voidyapp-storage/Fundo%20arraia.png" className="w-full h-full object-cover opacity-100" alt="arraia background" />
            
            {/* Película levemente escurecida (overlay) */}
            <div className="absolute inset-0 bg-black/40 z-[1]" />
            
            {/* Gradientes de profundidade */}
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#05060a] via-[#05060a]/40 to-transparent z-[2]" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0c14]/40 to-[#0a0c14] z-[3]" />
          </div>
          
          <div className="relative flex-1 overflow-y-auto no-scrollbar z-10 px-2 md:px-4 pt-12 md:pt-16">
            <div className="flex justify-between items-center py-4">
               <button onClick={onClose} className="p-1.5 rounded-lg bg-white/5 text-slate-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
               </button>
               <span className="text-[6px] font-black text-cyan-400 uppercase tracking-[0.3em] opacity-40">Conectado</span>
            </div>

            <div onClick={onOpenProfile} className="flex flex-col items-center pt-2 pb-4 cursor-pointer">
               <div className="w-14 h-14 rounded-full border-[2px] border-slate-700/50 p-0.5 mb-3 shadow-2xl">
                 <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 grayscale-[0.2]">
                   <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                 </div>
               </div>
               <h2 className="text-[10px] font-black text-white uppercase tracking-widest mb-2 drop-shadow-md">{userName}</h2>
               <div className="w-full max-w-[120px] mb-4">
                  <div className="flex justify-between items-end mb-0.5 px-1">
                     <span className="text-[6px] font-black text-slate-500 uppercase tracking-widest">Nível</span>
                     <span className="text-[8px] font-orbitron font-bold text-cyan-500">LVL 01</span>
                  </div>
                  <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-cyan-500/60 rounded-full" style={{ width: '35%' }}></div>
                  </div>
               </div>
            </div>

            <nav className="space-y-0.5 pb-4">
               {menuItems.map((item, idx) => (
                 <button key={idx} onClick={() => item.action()} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/[0.03] rounded-lg transition-all group active:scale-[0.98]">
                   <div className={`w-6 h-6 flex items-center justify-center transition-transform group-hover:scale-110 opacity-70 group-hover:opacity-100`}>
                      <SidebarIcon id={item.icon} className="w-4 h-4 text-slate-300" />
                   </div>
                   <span className="text-[9px] font-bold text-slate-300 tracking-wide group-hover:text-white transition-colors">{item.label}</span>
                 </button>
               ))}
            </nav>
          </div>

          <div className="px-4 py-2 border-t border-white/5 bg-transparent z-20 flex justify-between items-center shrink-0">
             <div className="flex flex-col">
                <span className="text-[5px] font-syncopate font-black text-white/10 tracking-[0.4em] uppercase">V1.0</span>
             </div>
             <button className="p-1 text-white/10 active:scale-90 transition-opacity opacity-40 hover:opacity-100"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg></button>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `.no-scrollbar::-webkit-scrollbar { display: none; }` }} />
    </div>
  );
};

export default SocialSidebar;
