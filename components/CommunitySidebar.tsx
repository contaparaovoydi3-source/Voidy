
import React from 'react';
import { Community, CommunityTab } from '../types';

interface CommunitySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  community: Community;
  allCommunities: Community[];
  onSelectCommunity: (id: string) => void;
  onNavigate: (tabId: string) => void;
  currentTab: string;
  onExit: () => void;
  userName: string;
  userAvatar: string;
  onOpenSettings?: () => void;
  onOpenPrivateChats?: () => void;
  onOpenPublicSearch?: () => void;
  onOpenLeaderPanel?: () => void;
  onOpenRanking?: () => void;
  onOpenDrafts?: () => void;
  onOpenProfile?: () => void;
  onOpenStore?: () => void;
}

export const SidebarIcon: React.FC<{ id: string; className?: string }> = ({ id, className = "" }) => {
  // Mapeamento de IDs para Ícones SVG delicados (strokeWidth 1.5)
  switch (id) {
    case 'Publicações':
    case 'DESTACADO':
    case 'inicio':
      return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7-7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>;
    case 'CHAT_PRIVADO':
    case 'privado':
      return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>;
    case 'Chats Públicos':
    case 'CHATS_PUBLICOS':
    case 'chats':
      return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>;
    case 'RANKING':
    case 'ranking':
      return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>;
    case 'LIDERES':
    case 'LEADER_PANEL':
      return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>;
    case 'CONFIGURACAO':
      return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/></svg>;
    case 'LOJA':
    case 'loja':
      return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>;
    case 'feed':
      return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.352 8.648L4.176 6.112v12l5.176-2.536m0-6.928l5.177 2.536m-5.177-2.536V15.576m5.177-6.928l5.176-2.536v12l-5.176-2.536m0-6.928v6.928"/></svg>;
    case 'create_cluster':
      return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>;
    case 'help':
      return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;
    case 'drafts':
      return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>;
    case 'Membros':
    case 'membros':
      return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>;
    default:
      return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z"/></svg>;
  }
};

const getContrastColor = (hexOrImage: string | null | undefined, isDarkMode: boolean) => {
  if (hexOrImage && (hexOrImage.startsWith('data:') || hexOrImage.startsWith('http'))) {
    return 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)]';
  }
  
  if (hexOrImage && hexOrImage.startsWith('#')) {
    const hex = hexOrImage.replace('#', '');
    const r = parseInt(hex.length === 3 ? hex[0]+hex[0] : hex.substring(0, 2), 16);
    const g = parseInt(hex.length === 3 ? hex[1]+hex[1] : hex.substring(2, 4), 16);
    const b = parseInt(hex.length === 3 ? hex[2]+hex[2] : hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 155 ? 'text-slate-950' : 'text-white';
  }

  return isDarkMode ? 'text-white' : 'text-slate-950';
};

const DEFAULT_TABS: CommunityTab[] = [
  { id: 'Publicações', label: 'Início', icon: '🏠', isVisible: true, isPrivate: false, type: 'FEED' },
  { id: 'CHAT_PRIVADO', label: 'Chat Privado', icon: '💬', isVisible: true, isPrivate: false, type: 'DEFAULT' },
  { id: 'Chats Públicos', label: 'Chats Públicos', icon: '👥', isVisible: true, isPrivate: false, type: 'DEFAULT' },
  { id: 'RANKING', label: 'Ranking', icon: '👑', isVisible: true, isPrivate: false, type: 'DEFAULT' },
  { id: 'LIDERES', label: 'Líderes', icon: '🎖️', isVisible: true, isPrivate: false, type: 'DEFAULT' },
  { id: 'CONFIGURACAO', label: 'Configuração', icon: '⚙️', isVisible: true, isPrivate: false, type: 'DEFAULT' },
  { id: 'LOJA', label: 'Loja', icon: '🛍️', isVisible: true, isPrivate: false, type: 'DEFAULT' }
];

const CommunitySidebar: React.FC<CommunitySidebarProps> = ({ 
  isOpen, onClose, community, allCommunities, onSelectCommunity, onNavigate, currentTab, onExit, userName, userAvatar, onOpenSettings, onOpenPrivateChats, onOpenPublicSearch, onOpenLeaderPanel, onOpenRanking, onOpenDrafts, onOpenProfile, onOpenStore
}) => {
  const isDarkMode = community.style?.backgroundColor !== '#ffffff';
  const sidebarBg = community.style?.sidebarBg || community.homeCover || community.banner;
  const isCreator = community.creator === userName;
  const isLeader = community.leaders.includes(userName);
  const userLevel = community.membersData?.[userName]?.cityLevel || 1;
  const baseBgColor = isDarkMode ? '#0a0c1a' : '#ffffff';
  
  const sidebarTextContrast = getContrastColor(community.style?.sidebarBg, isDarkMode);
  const tabs = community.sidebarTabs && community.sidebarTabs.length > 0 ? community.sidebarTabs : DEFAULT_TABS;

  const displayAvatar = (community.membersData?.[userName]?.personaAvatar) || userAvatar;
  const displayName = (community.membersData?.[userName]?.personaName) || userName;

  const handleTabClick = (tabId: string) => {
    if (tabId === 'CONFIGURACAO') onOpenSettings?.();
    else if (tabId === 'CHAT_PRIVADO') onOpenPrivateChats?.();
    else if (tabId === 'Chats Públicos') onOpenPublicSearch?.();
    else if (tabId === 'LEADER_PANEL' || tabId === 'LIDERES' || tabId === 'ADMIN_HUB') onOpenLeaderPanel?.();
    else if (tabId === 'RANKING') onOpenRanking?.();
    else if (tabId === 'LOJA') onOpenStore?.();
    else onNavigate(tabId);
    onClose(); 
  };

  return (
    <div className={`fixed inset-0 z-[500] flex transition-all duration-500 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      <div className={`absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity duration-700 ease-out ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      
      <div 
        className={`relative flex h-full w-[60%] max-w-[240px] shadow-2xl transition-transform duration-700 overflow-hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`} 
        style={{ 
          transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)', 
          backgroundColor: community.style?.sidebarBg?.startsWith('#') ? community.style.sidebarBg : baseBgColor,
          borderRight: 'none'
        }}
      >
        {/* Aba esquerda (ferramentas) - Linha vertical azul escura (#0a1428) */}
        <div className="w-[50px] h-full bg-[#05060a] flex flex-col items-center py-5 gap-3.5 z-20 shrink-0 overflow-y-auto no-scrollbar border-r border-[#0a1428]">
          <button onClick={onExit} className="w-7 h-7 flex flex-col items-center justify-center text-slate-500 active:scale-90 transition-all hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            <span className="text-[6px] font-black uppercase mt-0.5">Sair</span>
          </button>
          
          <div className="w-5 h-[1px] bg-white/5 my-0.5"></div>
          
          <button onClick={() => { onOpenDrafts?.(); onClose(); }} className="w-7 h-7 flex flex-col items-center justify-center text-slate-500 active:scale-90 transition-all hover:text-cyan-400">
            <SidebarIcon id="drafts" className="w-5 h-5" />
            <span className="text-[5px] font-black uppercase mt-0.5">Rascunhos</span>
          </button>

          <div className="w-5 h-[1px] bg-white/5 my-0.5"></div>
          
          {allCommunities.slice(0, 8).map((c) => (
            <button key={c.id} onClick={() => { onSelectCommunity(c.id); onClose(); }} className={`w-8 h-8 rounded-lg overflow-hidden border transition-all active:scale-90 flex-shrink-0 ${c.id === community.id ? 'border-cyan-500 shadow-lg scale-105' : 'border-white/10 opacity-60 hover:opacity-100'}`}><img src={c.avatar} className="w-full h-full object-cover" /></button>
          ))}
        </div>

        <div className="flex-1 flex flex-col relative overflow-hidden bg-transparent">
          <div className="absolute inset-0 z-0 overflow-hidden">
            {sidebarBg && (sidebarBg.startsWith('data:') || sidebarBg.startsWith('http')) && (
              <>
                <img 
                  src={sidebarBg} 
                  className="absolute inset-0 w-full h-full object-cover opacity-100 blur-[1px] border-none outline-none" 
                  style={{ margin: -1, width: 'calc(100% + 2px)', height: 'calc(100% + 2px)' }} 
                />
                <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#05060a] via-[#05060a]/60 via-[#05060a]/20 to-transparent z-[1]" />
                <div className={`absolute inset-0 z-[2] ${isDarkMode ? 'bg-gradient-to-b from-transparent via-[#0a0c14]/60 to-[#0a0c14]' : 'bg-black/10'}`} />
              </>
            )}
          </div>
          
          <div className="relative flex-1 overflow-y-auto no-scrollbar z-10 px-2 md:px-4">
            <div className="flex justify-between items-center py-4">
               <button onClick={onClose} className={`p-1.5 rounded-lg bg-white/10 ${sidebarTextContrast} active:scale-90 transition-all`}><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg></button>
               <span className={`text-[6px] font-black ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'} uppercase tracking-[0.3em] opacity-80`}>Conectado</span>
            </div>

            <div onClick={onOpenProfile} className="flex flex-col items-center pt-2 pb-4 cursor-pointer active:scale-95 transition-transform">
               <div className={`w-12 h-12 rounded-full border-[2px] ${isDarkMode ? 'border-white/20' : 'border-slate-300'} p-0.5 mb-2`}><div className="w-full h-full rounded-full overflow-hidden bg-slate-900 grayscale-[0.2]"><img src={displayAvatar} alt="Avatar" className="w-full h-full object-cover" /></div></div>
               <h2 className={`text-[9px] font-bold uppercase tracking-wide mb-2 ${sidebarTextContrast}`}>{displayName}</h2>
               <div className="w-full max-w-[120px] mb-4">
                  <div className="flex justify-between items-end mb-1 px-1"><span className={`text-[5px] font-black ${sidebarTextContrast} opacity-40 uppercase tracking-widest`}>Setor</span><span className="text-[7px] font-orbitron font-bold text-cyan-500">LVL {userLevel}</span></div>
                  <div className={`h-0.5 w-full ${isDarkMode ? 'bg-white/20' : 'bg-slate-200'} rounded-full overflow-hidden`}><div className="h-full bg-cyan-500/60 rounded-full" style={{ width: '35%' }}></div></div>
               </div>
            </div>

            <nav className="space-y-0.5 pb-4">
               {isCreator && (
                 <button onClick={() => handleTabClick('ADMIN_HUB')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border border-cyan-500/10 bg-cyan-500/5 mb-2 active:scale-[0.98] transition-all group`}>
                    <div className={`w-6 h-6 flex items-center justify-center transition-transform group-hover:scale-110`}><SidebarIcon id="LEADER_PANEL" className="w-4 h-4 text-cyan-400" /></div>
                    <span className="text-[8px] font-black text-cyan-400 uppercase tracking-widest">Hub da Administração</span>
                 </button>
               )}
               {tabs.filter(t => t.isVisible).map((item, idx) => (
                 <button key={idx} onClick={() => handleTabClick(item.id)} className={`w-full flex items-center gap-3 px-3 py-2 group transition-all rounded-lg hover:bg-white/5 active:scale-[0.98] ${currentTab === item.id ? 'bg-white/10' : ''}`}>
                   <div className={`w-6 h-6 flex items-center justify-center transition-transform group-hover:scale-110 opacity-70 group-hover:opacity-100`}>
                      <SidebarIcon id={item.id} className={`w-4 h-4 ${sidebarTextContrast}`} />
                   </div>
                   <span className={`text-[9px] font-black tracking-wide ${sidebarTextContrast} ${currentTab === item.id ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>{item.label}</span>
                 </button>
               ))}
            </nav>
          </div>
          <div className={`px-4 py-2 border-t ${isDarkMode ? 'border-white/10' : 'border-black/10'} bg-transparent z-20 flex justify-between items-center shrink-0`}><div className="flex flex-col"><span className={`text-[5px] font-syncopate font-black tracking-[0.4em] uppercase opacity-40 ${sidebarTextContrast}`}>Sincronia Estável</span></div></div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `.no-scrollbar::-webkit-scrollbar { display: none; }` }} />
    </div>
  );
};

export default CommunitySidebar;
