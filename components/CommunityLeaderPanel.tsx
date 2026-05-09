
import React, { useState, useRef } from 'react';
import { Community, CommunityTab, CommunityTabType, CityMemberData } from '../types';

interface CommunityLeaderPanelProps {
  community: Community;
  onBack: () => void;
  onUpdate: (updater: (comm: Community) => Community) => void;
  verifySafety?: (base64: string) => Promise<boolean>;
}

const PRESET_COLORS = [
  { name: 'Ciano', hex: '#22d3ee' },
  { name: 'Rosa', hex: '#ec4899' },
  { name: 'Roxo', hex: '#a855f7' },
  { name: 'Vermelho', hex: '#ef4444' },
  { name: 'Branco', hex: '#ffffff' },
  { name: 'Âmbar', hex: '#f59e0b' },
  { name: 'Esmeralda', hex: '#10b981' },
  { name: 'Void', hex: '#02040a' },
  { name: 'Slate', hex: '#0f172a' }
];

const DEFAULT_SIDEBAR_TABS: CommunityTab[] = [
  { id: 'DESTACADO', label: 'Início', icon: '🏠', isVisible: true, isPrivate: false, type: 'FEED' },
  { id: 'CHAT_PRIVADO', label: 'Chat Privado', icon: '💬', isVisible: true, isPrivate: false, type: 'DEFAULT' },
  { id: 'CHATS_PUBLICOS', label: 'Chats Públicos', icon: '👥', isVisible: true, isPrivate: false, type: 'DEFAULT' },
  { id: 'RANKING', label: 'Ranking', icon: '👑', isVisible: true, isPrivate: false, type: 'DEFAULT' },
  { id: 'LIDERES', label: 'Líderes', icon: '🎖️', isVisible: true, isPrivate: false, type: 'DEFAULT' },
  { id: 'CONFIGURACAO', label: 'Configuração', icon: '⚙️', isVisible: true, isPrivate: false, type: 'DEFAULT' },
  { id: 'LOJA', label: 'Loja', icon: '🛍️', isVisible: true, isPrivate: false, type: 'DEFAULT' }
];

const DEFAULT_HEADER_TABS: CommunityTab[] = [
  { id: 'SEGUINDO', label: 'Seguindo', icon: '👤', isVisible: true, type: 'FEED' },
  { id: 'DESTACADO', label: 'Destacado', icon: '⭐', isVisible: true, type: 'FEED' },
  { id: 'CHATS', label: 'Conversas', icon: '💬', isVisible: true, type: 'CHAT' },
  { id: 'ENQUETES', label: 'Enquetes', icon: '📊', isVisible: true, type: 'FEED' },
  { id: 'QUIZZES', label: 'Quizzes', icon: '🧠', isVisible: true, type: 'FEED' },
  { id: 'WIKI', label: 'Wiki', icon: '📚', isVisible: true, type: 'WIKI' }
];

type PanelTab = 'GERAL' | 'ESTRUTURA' | 'MEMBROS';

const CommunityLeaderPanel: React.FC<CommunityLeaderPanelProps> = ({ community, onBack, onUpdate, verifySafety }) => {
  const [activeTab, setActiveTab] = useState<PanelTab>('GERAL');
  const [activeView, setActiveView] = useState<'EDIT' | 'PREVIEW'>('EDIT');
  const [expandedHub, setExpandedHub] = useState<'SIDEBAR_TABS' | 'HEADER_TABS' | null>(null);
  const [configuringTab, setConfiguringTab] = useState<{ source: 'SIDEBAR' | 'HEADER', id: string } | null>(null);

  const [isMemberSelectorOpen, setIsMemberSelectorOpen] = useState(false);
  const [targetRoleForPromotion, setTargetRoleForPromotion] = useState<'LEADER' | 'COLEADER' | null>(null);

  const [tempName, setTempName] = useState(community.name);
  const [tempDesc, setTempDesc] = useState(community.description);
  const [tempColor, setTempColor] = useState(community.primaryColor || '#ef4444');
  const [tempBgColor, setTempBgColor] = useState(community.style?.backgroundColor || '#02040a');
  
  const [tempBanner, setTempBanner] = useState(community.banner || '');
  const [tempHomeCover, setTempHomeCover] = useState(community.homeCover || '');
  const [tempSidebarBg, setTempSidebarBg] = useState(community.style?.sidebarBg || '');
  const [tempHeaderBg, setTempHeaderBg] = useState(community.style?.headerBg || '');
  const [tempBottomBarBg, setTempBottomBarBg] = useState(community.style?.bottomBarBg || '');
  const [tempAvatar, setTempAvatar] = useState(community.avatar || '');
  
  const [tempSidebarTabs, setTempSidebarTabs] = useState<CommunityTab[]>(community.sidebarTabs || DEFAULT_SIDEBAR_TABS);
  const [tempHeaderTabs, setTempHeaderTabs] = useState<CommunityTab[]>(community.headerTabs || DEFAULT_HEADER_TABS);

  const bannerRef = useRef<HTMLInputElement>(null);
  const homeCoverRef = useRef<HTMLInputElement>(null);
  const sidebarBgRef = useRef<HTMLInputElement>(null);
  const headerBgRef = useRef<HTMLInputElement>(null);
  const bottomBarBgRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  
  const sidebarIconRefs = useRef<(HTMLInputElement | null)[]>([]);
  const headerIconRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  const handleTabChange = (source: 'SIDEBAR' | 'HEADER', index: number, field: keyof CommunityTab, value: any) => {
    if (source === 'SIDEBAR') {
      const newTabs = [...tempSidebarTabs];
      newTabs[index] = { ...newTabs[index], [field]: value };
      setTempSidebarTabs(newTabs);
    } else {
      const newTabs = [...tempHeaderTabs];
      newTabs[index] = { ...newTabs[index], [field]: value };
      setTempHeaderTabs(newTabs);
    }
  };

  const updateConfiguringTab = (field: keyof CommunityTab, value: any) => {
    if (!configuringTab) return;
    if (configuringTab.source === 'SIDEBAR') {
      setTempSidebarTabs(prev => prev.map(t => t.id === configuringTab.id ? { ...t, [field]: value } : t));
    } else {
      setTempHeaderTabs(prev => prev.map(t => t.id === configuringTab.id ? { ...t, [field]: value } : t));
    }
  };

  const handleAddTab = (source: 'SIDEBAR' | 'HEADER') => {
    const newId = `CUSTOM_${Date.now()}`;
    const newTab: CommunityTab = {
      id: newId,
      label: 'Novo Componente',
      icon: '📄',
      isVisible: true,
      isPrivate: false,
      type: 'STATIC',
      data: 'Conteúdo em construção...'
    };
    if (source === 'SIDEBAR') {
      setTempSidebarTabs([...tempSidebarTabs, newTab]);
    } else {
      setTempHeaderTabs([...tempHeaderTabs, newTab]);
    }
  };

  const handleRemoveTab = (source: 'SIDEBAR' | 'HEADER', index: number) => {
    if (source === 'SIDEBAR') {
      setTempSidebarTabs(tempSidebarTabs.filter((_, i) => i !== index));
    } else {
      setTempHeaderTabs(tempHeaderTabs.filter((_, i) => i !== index));
    }
  };

  const handlePromoteMember = (userId: string) => {
    if (!targetRoleForPromotion) return;
    
    onUpdate(prev => {
        const newLeaders = new Set(prev.leaders);
        const newCoLeaders = new Set(prev.coLeaders);
        newLeaders.delete(userId);
        newCoLeaders.delete(userId);
        if (targetRoleForPromotion === 'LEADER') {
            if (newLeaders.size < 4) newLeaders.add(userId);
            else alert("Máximo de 4 líderes atingido.");
        } else {
            if (newCoLeaders.size < 6) newCoLeaders.add(userId);
            else alert("Máximo de 6 co-líderes atingido.");
        }
        return { ...prev, leaders: Array.from(newLeaders), coLeaders: Array.from(newCoLeaders) };
    });
    setIsMemberSelectorOpen(false);
    setTargetRoleForPromotion(null);
  };

  const handleRemoveStaff = (userId: string) => {
      onUpdate(prev => ({ ...prev, leaders: prev.leaders.filter(l => l !== userId), coLeaders: prev.coLeaders.filter(l => l !== userId) }));
  };

  const handleSave = () => {
    onUpdate(prev => ({
      ...prev,
      name: tempName.toUpperCase(),
      description: tempDesc,
      primaryColor: tempColor,
      banner: tempBanner,
      homeCover: tempHomeCover,
      avatar: tempAvatar,
      sidebarTabs: tempSidebarTabs,
      headerTabs: tempHeaderTabs,
      style: {
        ...prev.style!,
        primaryColor: tempColor,
        accentColor: tempColor,
        backgroundColor: tempBgColor,
        sidebarBg: tempSidebarBg,
        headerBg: tempHeaderBg,
        bottomBarBg: tempBottomBarBg
      }
    }));
    onBack();
  };

  const renderPreview = () => {
    const visibleSidebar = tempSidebarTabs.filter(t => t.isVisible);
    return (
      <div className="flex-1 flex flex-col bg-[#02050e] overflow-hidden relative">
         <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent z-50 animate-pulse"></div>
         <div className="p-4 bg-cyan-900/20 text-cyan-400 text-center text-[10px] font-black uppercase tracking-widest border-b border-cyan-500/20 z-50">
            Preview - Estrutura Visual
         </div>

         <div className="flex-1 relative flex" style={{ backgroundColor: tempBgColor }}>
            <div className="w-[80%] max-w-[280px] h-full border-r border-white/5 flex flex-col relative overflow-hidden bg-[#02050e]">
               <div className="absolute inset-0 z-0">
                  <img src={tempSidebarBg || tempHomeCover} className="w-full h-full object-cover blur-md opacity-20" />
                  <div className="absolute inset-0 bg-gradient-to-b from-[#02050e]/80 via-[#02050e]/90 to-[#02050e]" />
               </div>

               <div className="relative z-10 flex flex-col h-full p-4">
                  <div className="p-6 flex flex-col items-center border-b border-white/5 mb-4">
                     <div className="w-16 h-16 rounded-2xl border-2 border-white/10 p-0.5 mb-3 shadow-xl bg-black">
                        <img src={tempAvatar} className="w-full h-full object-cover rounded-xl" />
                     </div>
                     <h3 className="text-white font-black text-[10px] uppercase tracking-widest text-center">{tempName}</h3>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-1">
                     {visibleSidebar.map((tab) => (
                        <div key={tab.id} className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${tab.isPrivate ? 'bg-red-500/10 border border-red-500/20' : 'hover:bg-white/5 opacity-80 hover:opacity-100'}`}>
                           <div className="flex items-center gap-4">
                              <span className="text-lg">{tab.icon}</span>
                              <span className={`text-[9px] font-black uppercase tracking-widest ${tab.isPrivate ? 'text-red-400' : 'text-slate-300'}`}>{tab.label}</span>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            <div className="flex-1 bg-black/50 backdrop-blur-sm flex items-center justify-center">
               <button onClick={() => setActiveView('EDIT')} className="py-4 px-8 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                  Voltar à Edição
               </button>
            </div>
         </div>
      </div>
    );
  };

  const renderTabConfig = () => {
    if (!configuringTab) return null;
    const list = configuringTab.source === 'SIDEBAR' ? tempSidebarTabs : tempHeaderTabs;
    const tab = list.find(t => t.id === configuringTab.id);
    if (!tab) return null;
    const options: { type: CommunityTabType; label: string; icon: string; desc: string }[] = [
        { type: 'FEED', label: 'Feed de Dados', icon: '📰', desc: 'Lista de postagens com suporte a imagens e mídia.' },
        { type: 'CHAT', label: 'Frequência de Chat', icon: '💬', desc: 'Canal de comunicação em tempo real.' },
        { type: 'STATIC', label: 'Protocolo de Texto', icon: '📜', desc: 'Página estática para diretrizes, lore ou avisos.' },
        { type: 'WIKI', label: 'Banco de Dados', icon: '📚', desc: 'Coleção organizada de entradas wiki.' }
    ];
    return (
        <div className="fixed inset-0 z-[900] bg-black/90 backdrop-blur-xl flex flex-col animate-in zoom-in duration-300">
            <header className="px-6 py-6 border-b border-white/5 flex items-center justify-between bg-black/40">
                <button onClick={() => setConfiguringTab(null)} className="flex items-center gap-2 text-slate-400 hover:text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
                    <span className="text-[10px] font-black uppercase tracking-widest">Voltar</span>
                </button>
                <div className="flex flex-col items-center">
                   <h2 className="text-xs font-syncopate font-black text-cyan-400 uppercase tracking-[0.3em]">Configurar Componente</h2>
                   <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">{configuringTab.source === 'HEADER' ? 'Navegação Superior' : 'Menu Lateral'}</span>
                </div>
                <div className="w-10"></div>
            </header>
            <div className="flex-1 overflow-y-auto p-8 max-w-2xl mx-auto w-full">
                <div className="mb-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mx-auto mb-4">{tab.icon}</div>
                    <h3 className="text-xl font-black text-white uppercase tracking-widest mb-1">{tab.label}</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">ID: {tab.id}</p>
                </div>
                <div className="space-y-8">
                    <div className="space-y-4">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] ml-2">Definir Função do Sistema</label>
                        <div className="grid grid-cols-2 gap-4">
                            {options.map(opt => (
                                <button key={opt.type} onClick={() => updateConfiguringTab('type', opt.type)} className={`p-4 rounded-2xl border flex flex-col items-start gap-2 transition-all active:scale-95 ${tab.type === opt.type ? 'bg-cyan-500/10 border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.15)]' : 'bg-white/5 border-white/5 hover:border-white/20'}`}><div className="flex items-center justify-between w-full"><span className="text-2xl">{opt.icon}</span>{tab.type === opt.type && <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_5px_cyan]"></div>}</div><span className={`text-[10px] font-black uppercase tracking-widest ${tab.type === opt.type ? 'text-cyan-400' : 'text-white'}`}>{opt.label}</span><p className="text-[8px] text-slate-500 font-medium text-left leading-relaxed">{opt.desc}</p></button>
                            ))}
                        </div>
                    </div>
                    {tab.type === 'STATIC' && (
                        <div className="space-y-4 animate-in slide-in-from-bottom duration-500">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] ml-2">Conteúdo do Protocolo</label>
                            <textarea value={tab.data || ''} onChange={(e) => updateConfiguringTab('data', e.target.value)} className="w-full h-64 bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-sm text-slate-200 focus:border-cyan-500 outline-none resize-none font-mono" placeholder="Insira o texto das diretrizes, regras ou lore aqui..." />
                        </div>
                    )}
                </div>
            </div>
            <div className="p-6 border-t border-white/5 bg-black/40 backdrop-blur-xl">
                <button onClick={() => setConfiguringTab(null)} className="w-full py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] active:scale-95 transition-all shadow-xl hover:bg-cyan-50">Confirmar Configuração</button>
            </div>
        </div>
    );
  };

  const renderMemberSelector = () => {
      const members = community.membersData ? Object.values(community.membersData) as CityMemberData[] : [];
      return (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setIsMemberSelectorOpen(false)} />
              <div className="relative w-full max-sm bg-[#050714] border border-white/10 rounded-[2.5rem] p-6 shadow-2xl flex flex-col h-[70vh]">
                  <h3 className="text-center text-xs font-black text-white uppercase tracking-widest mb-6">Selecionar Membro</h3>
                  <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
                      {members.map(m => (
                          <button key={m.userId} onClick={() => handlePromoteMember(m.userId)} className="w-full p-4 rounded-xl bg-white/5 flex items-center gap-3 hover:bg-cyan-500/10 hover:text-cyan-400 transition-all text-left"><div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden"><img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${m.userId}`} className="w-full h-full object-cover" /></div><span className="text-[10px] font-bold uppercase tracking-widest">{m.userId}</span></button>
                      ))}
                  </div>
                  <button onClick={() => setIsMemberSelectorOpen(false)} className="mt-4 py-3 bg-white/10 rounded-xl text-[9px] font-black uppercase">Cancelar</button>
              </div>
          </div>
      );
  };

  const renderEditableList = (tabs: CommunityTab[], source: 'SIDEBAR' | 'HEADER', refs: React.MutableRefObject<(HTMLInputElement | null)[]>) => (
    <div className="space-y-4">
        {tabs.map((tab, idx) => (
        <div key={tab.id} className={`group relative rounded-2xl p-4 flex flex-col gap-3 transition-all border ${tab.isPrivate ? 'bg-red-500/5 border-red-500/20' : 'bg-white/[0.03] border-white/5 hover:border-cyan-500/30'}`}>
            <div className="flex items-center gap-4">
                <div onClick={() => refs.current[idx]?.click()} className="w-10 h-10 rounded-xl bg-black border border-white/10 flex items-center justify-center cursor-pointer relative overflow-hidden group/icon shrink-0">
                    {tab.icon.startsWith('http') || tab.icon.startsWith('data:') ? (<img src={tab.icon} className="w-full h-full object-cover" />) : (<span className="text-sm">{tab.icon}</span>)}
                    <input type="file" className="hidden" accept="image/*" ref={el => { refs.current[idx] = el }} onChange={(e) => handleImageUpload(e, (val) => handleTabChange(source, idx, 'icon', val))} />
                </div>
                <div className="flex-1">
                    <input value={tab.label} onChange={(e) => handleTabChange(source, idx, 'label', e.target.value)} className="bg-transparent border-none outline-none text-white text-xs font-bold w-full placeholder:text-slate-600 uppercase" placeholder="Nome da Aba" />
                    <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[6px] font-bold text-slate-500 uppercase tracking-widest">ID: {tab.id}</span>
                    <span className="text-[6px] font-black bg-white/10 px-1 rounded text-cyan-400 uppercase">{tab.type || 'DEFAULT'}</span>
                    </div>
                </div>
                <button onClick={() => setConfiguringTab({ source, id: tab.id })} className="w-8 h-8 flex items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all active:scale-90 border border-cyan-500/20"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg></button>
                <button onClick={() => handleRemoveTab(source, idx)} className="text-slate-600 hover:text-red-500 transition-colors p-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
            </div>
            <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                <button onClick={() => handleTabChange(source, idx, 'isPrivate', !tab.isPrivate)} className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-[8px] font-black uppercase tracking-widest transition-all border ${tab.isPrivate ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'}`}>{tab.isPrivate ? (<><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg> Privado (Staff)</>) : (<><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Público (Livre)</>)}</button>
                <button onClick={() => handleTabChange(source, idx, 'isVisible', !tab.isVisible)} className={`p-2 rounded-lg border transition-all ${tab.isVisible ? 'bg-white/10 border-white/20 text-white' : 'bg-black/20 border-white/5 text-slate-600'}`}>{tab.isVisible ? (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>) : (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>)}</button>
            </div>
        </div>
        ))}
    </div>
  );

  if (activeView === 'PREVIEW') {
    return (
      <div className="absolute inset-0 z-[800] bg-[#02040a] flex flex-col animate-in zoom-in duration-300">
        {renderPreview()}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-[800] bg-[#02040a] flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden font-inter">

      {configuringTab && renderTabConfig()}
      {isMemberSelectorOpen && renderMemberSelector()}

      <header className="px-6 py-6 border-b border-white/5 bg-black/40 backdrop-blur-xl shrink-0 z-50">
        <div className="flex items-center justify-between mb-4">
           <button onClick={onBack} className="p-2 text-slate-400 hover:text-white transition-all active:scale-90"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M15 19l-7-7 7-7"/></svg></button>
           <div className="flex flex-col items-center"><h2 className="text-xs font-syncopate font-black text-cyan-400 uppercase tracking-[0.3em]">Hub da Administração</h2><span className="text-[7px] text-slate-500 font-bold uppercase tracking-widest mt-1">Controle de Espaço</span></div>
           <button onClick={handleSave} className="p-2 text-cyan-400 font-black text-[10px] uppercase tracking-widest active:scale-95 bg-cyan-500/10 rounded-lg px-4 border border-cyan-500/20">Salvar</button>
        </div>
        <div className="flex bg-white/[0.03] p-1 rounded-xl">{(['GERAL', 'ESTRUTURA', 'MEMBROS'] as PanelTab[]).map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === tab ? 'bg-cyan-500 text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}>{tab}</button>))}</div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 no-scrollbar space-y-6 pb-32">
        {activeTab === 'GERAL' && (
           <div className="space-y-8 animate-in fade-in duration-500 relative">
              <div className="absolute top-0 right-2 z-20">
                 <div onClick={() => avatarRef.current?.click()} className="w-20 h-20 rounded-2xl border-2 border-purple-500 p-0.5 bg-black cursor-pointer shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:scale-105 transition-all group/avatar overflow-hidden relative"><img src={tempAvatar} className="w-full h-full object-cover rounded-xl" /><div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity"><span className="text-[8px] font-black text-purple-400 uppercase">Mudar</span></div><input type="file" ref={avatarRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setTempAvatar)} /></div>
                 <span className="text-[7px] font-bold text-purple-500 uppercase tracking-widest mt-1 block text-center">Avatar</span>
              </div>
              <div className="space-y-3 pr-24"><label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] ml-2">Identificação</label><input value={tempName} onChange={(e) => setTempName(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 p-5 rounded-2xl text-white font-black outline-none focus:border-purple-500 transition-all uppercase" placeholder="NOME DO ESPAÇO" /></div>
              <div className="space-y-3"><label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] ml-2">Frequência Narrativa</label><textarea value={tempDesc} onChange={(e) => setTempDesc(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 p-5 rounded-2xl text-white text-sm outline-none focus:border-purple-500 h-28 resize-none transition-all" placeholder="Descrição do RP..." /></div>
              
              {/* COMPONENTES DE SINC VISUAL */}
              <div className="space-y-4 pt-6 border-t border-white/5">
                 <label className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.4em] ml-2 block text-center">Sincronia Visual das Abas</label>
                 <div className="grid grid-cols-1 gap-6 bg-white/[0.02] p-6 rounded-[2.5rem] border border-white/5">
                    {/* Header Custom (Imagens e Cores) */}
                    <div className="space-y-2">
                       <div className="flex items-center justify-between px-2"><label className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Aba Superior (Fotos/Cores)</label><div className="flex gap-2"><input type="color" value={tempHeaderBg?.startsWith('#') ? tempHeaderBg : '#1e3a8a'} onChange={(e) => setTempHeaderBg(e.target.value)} className="w-6 h-6 rounded cursor-pointer" /><button onClick={() => headerBgRef.current?.click()} className="p-1 bg-white/10 rounded text-[6px] font-black uppercase text-white">Upload</button></div><input type="file" ref={headerBgRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setTempHeaderBg)} /></div>
                       <div className="h-10 w-full rounded-xl overflow-hidden border border-white/5 relative bg-slate-900">{tempHeaderBg?.startsWith('data:') ? <img src={tempHeaderBg} className="w-full h-full object-cover" /> : <div className="w-full h-full" style={{ backgroundColor: tempHeaderBg || '#1e3a8a' }}></div>}</div>
                    </div>

                    {/* Fundo Principal do Espaço (Apenas Cores) */}
                    <div className="space-y-2">
                       <div className="flex items-center justify-between px-2"><label className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Fundo do Espaço (Apenas Cores)</label><div className="flex gap-2"><input type="color" value={tempBgColor} onChange={(e) => setTempBgColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-2 border-white/10" /></div></div>
                       <div className="h-10 w-full rounded-xl border border-white/5" style={{ backgroundColor: tempBgColor }}></div>
                    </div>

                    {/* Sidebar Custom */}
                    <div className="space-y-2">
                       <div className="flex items-center justify-between px-2"><label className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Aba Lateral</label><div className="flex gap-2"><input type="color" value={tempSidebarBg?.startsWith('#') ? tempSidebarBg : '#02050e'} onChange={(e) => setTempSidebarBg(e.target.value)} className="w-6 h-6 rounded cursor-pointer" /><button onClick={() => sidebarBgRef.current?.click()} className="p-1 bg-white/10 rounded text-[6px] font-black uppercase text-white">Upload</button></div><input type="file" ref={sidebarBgRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setTempSidebarBg)} /></div>
                       <div className="h-10 w-full rounded-xl overflow-hidden border border-white/5 relative bg-slate-900">{tempSidebarBg?.startsWith('data:') ? <img src={tempSidebarBg} className="w-full h-full object-cover" /> : <div className="w-full h-full" style={{ backgroundColor: tempSidebarBg || '#02050e' }}></div>}</div>
                    </div>

                    {/* Bottom Bar Custom */}
                    <div className="space-y-2">
                       <div className="flex items-center justify-between px-2"><label className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Aba Inferior</label><div className="flex gap-2"><input type="color" value={tempBottomBarBg?.startsWith('#') ? tempBottomBarBg : '#ffffff'} onChange={(e) => setTempBottomBarBg(e.target.value)} className="w-6 h-6 rounded cursor-pointer" /><button onClick={() => bottomBarBgRef.current?.click()} className="p-1 bg-white/10 rounded text-[6px] font-black uppercase text-white">Upload</button></div><input type="file" ref={bottomBarBgRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setTempBottomBarBg)} /></div>
                       <div className="h-10 w-full rounded-xl overflow-hidden border border-white/5 relative bg-slate-900">{tempBottomBarBg?.startsWith('data:') ? <img src={tempBottomBarBg} className="w-full h-full object-cover" /> : <div className="w-full h-full" style={{ backgroundColor: tempBottomBarBg || '#ffffff' }}></div>}</div>
                    </div>
                 </div>
              </div>

              <div className="space-y-4"><label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] ml-2">Cromia de Comando</label><div className="flex flex-wrap gap-4 justify-center bg-white/[0.02] p-6 rounded-[2rem] border border-white/5">{PRESET_COLORS.map(c => (<button key={c.hex} onClick={() => setTempColor(c.hex)} className={`w-10 h-10 rounded-full border-2 transition-all ${tempColor === c.hex ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'border-transparent opacity-40 hover:opacity-80'}`} style={{ backgroundColor: c.hex }} />))}</div></div>
              <div className="grid grid-cols-2 gap-4"><div className="space-y-3"><label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] text-center block">Banner (Radar)</label><div onClick={() => bannerRef.current?.click()} className="aspect-[3/4] rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden bg-white/5 cursor-pointer hover:border-purple-500/30 transition-all group relative">{tempBanner ? <img src={tempBanner} className="w-full h-full object-cover group-hover:scale-110 transition-transform" /> : <span className="text-2xl opacity-20">📡</span>}<div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-[8px] font-bold text-white uppercase">Alterar</span></div><input type="file" ref={bannerRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setTempBanner)} /></div></div><div className="space-y-3"><label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] text-center block">Capa de Sincronia</label><div onClick={() => homeCoverRef.current?.click()} className="aspect-[3/4] rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden bg-white/5 cursor-pointer hover:border-purple-500/30 transition-all group relative">{tempHomeCover ? <img src={tempHomeCover} className="w-full h-full object-cover group-hover:scale-110 transition-transform" /> : <span className="text-2xl opacity-20">🖼️</span>}<div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-[8px] font-bold text-white uppercase">Alterar</span></div><input type="file" ref={homeCoverRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setTempHomeCover)} /></div></div></div>
           </div>
        )}

        {activeTab === 'ESTRUTURA' && (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className={`bg-[#050714] border border-cyan-500/30 rounded-[2.5rem] overflow-hidden transition-all duration-700 ${expandedHub === 'SIDEBAR_TABS' ? 'shadow-[0_0_50px_rgba(34,211,238,0.15)] ring-1 ring-cyan-500/30' : 'shadow-none hover:bg-white/5'}`}><button onClick={() => setExpandedHub(expandedHub === 'SIDEBAR_TABS' ? null : 'SIDEBAR_TABS')} className="w-full p-6 flex items-center justify-between group bg-gradient-to-r from-transparent via-cyan-900/5 to-transparent"><div className="flex items-center gap-4"><div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all ${expandedHub === 'SIDEBAR_TABS' ? 'bg-cyan-500 text-black shadow-lg' : 'bg-white/5 text-cyan-500 border border-white/5'}`}>📑</div><div className="flex flex-col text-left"><h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] group-hover:text-cyan-400 transition-colors">Menu Lateral</h3><span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">Estrutura Vertical</span></div></div><div className={`transition-transform duration-500 ${expandedHub === 'SIDEBAR_TABS' ? 'rotate-180 text-cyan-400' : 'text-slate-600'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/></svg></div></button>{expandedHub === 'SIDEBAR_TABS' && (<div className="px-6 pb-8 pt-4 animate-in slide-in-from-top-4 duration-500 border-t border-white/5"><div className="flex justify-between items-center mb-6"><span className="text-[9px] font-black text-white uppercase tracking-widest">Componentes Ativos</span><button onClick={() => setActiveView('PREVIEW')} className="text-[8px] font-bold text-cyan-400 uppercase tracking-widest hover:underline decoration-cyan-500/30">Ver Preview</button></div>{renderEditableList(tempSidebarTabs, 'SIDEBAR', sidebarIconRefs)}<button onClick={() => handleAddTab('SIDEBAR')} className="w-full mt-6 py-4 rounded-2xl border-2 border-dashed border-white/10 text-slate-500 hover:text-white hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3"><span className="text-xl">+</span> Adicionar Componente</button></div>)}</div>
                <div className={`bg-[#050714] border border-blue-500/30 rounded-[2.5rem] overflow-hidden transition-all duration-700 ${expandedHub === 'HEADER_TABS' ? 'shadow-[0_0_50px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/30' : 'shadow-none hover:bg-white/5'}`}><button onClick={() => setExpandedHub(expandedHub === 'HEADER_TABS' ? null : 'HEADER_TABS')} className="w-full p-6 flex items-center justify-between group bg-gradient-to-r from-transparent via-blue-900/5 to-transparent"><div className="flex items-center gap-4"><div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all ${expandedHub === 'HEADER_TABS' ? 'bg-blue-500 text-white shadow-lg' : 'bg-white/5 text-blue-500 border border-white/5'}`}>🧭</div><div className="flex flex-col text-left"><h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] group-hover:text-blue-400 transition-colors">Navegação Superior</h3><span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">Abas do Topo</span></div></div><div className={`transition-transform duration-500 ${expandedHub === 'HEADER_TABS' ? 'rotate-180 text-blue-400' : 'text-slate-600'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/></svg></div></button>{expandedHub === 'HEADER_TABS' && (<div className="px-6 pb-8 pt-4 animate-in slide-in-from-top-4 duration-500 border-t border-white/5"><div className="flex justify-between items-center mb-6"><span className="text-[9px] font-black text-white uppercase tracking-widest">Abas do Cabeçalho</span></div>{renderEditableList(tempHeaderTabs, 'HEADER', headerIconRefs)}<button onClick={() => handleAddTab('HEADER')} className="w-full mt-6 py-4 rounded-2xl border-2 border-dashed border-white/10 text-slate-500 hover:text-white hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3"><span className="text-xl">+</span> Adicionar Aba</button></div>)}</div>
            </div>
        )}

        {activeTab === 'MEMBROS' && (
            <div className="space-y-10 animate-in fade-in duration-500 pb-20">
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.3em] text-center mb-6">Administradores</h3>
                    <div className="flex justify-center gap-6 flex-wrap">{Array.from({ length: 4 }).map((_, i) => { const leader = community.leaders[i]; return (<button key={i} onClick={() => { if (leader) { if (window.confirm(`Remover ${leader} da administração?`)) handleRemoveStaff(leader); } else { setTargetRoleForPromotion('LEADER'); setIsMemberSelectorOpen(true); } }} className={`w-20 h-20 rounded-full border-2 flex items-center justify-center transition-all active:scale-90 shadow-xl ${leader ? 'border-cyan-500 p-0.5 bg-black' : 'border-white/10 border-dashed bg-white/5 hover:border-cyan-500/50'}`}>{leader ? (<div className="w-full h-full rounded-full overflow-hidden bg-slate-900"><img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${leader}`} className="w-full h-full object-cover" /></div>) : (<span className="text-2xl text-slate-600">+</span>)}</button>); })}</div>
                </div>
                
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-purple-500 uppercase tracking-[0.3em] text-center mb-6">Co-Admins</h3>
                    <div className="grid grid-cols-3 gap-4 justify-items-center">{Array.from({ length: 6 }).map((_, i) => { const coLeader = community.coLeaders[i]; return (<button key={i} onClick={() => { if (coLeader) { if (window.confirm(`Remover ${coLeader} da co-administração?`)) handleRemoveStaff(coLeader); } else { setTargetRoleForPromotion('COLEADER'); setIsMemberSelectorOpen(true); } }} className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all active:scale-90 shadow-lg ${coLeader ? 'border-purple-500 p-0.5 bg-black' : 'border-white/10 border-dashed bg-white/5 hover:border-purple-500/50'}`}>{coLeader ? (<div className="w-full h-full rounded-full overflow-hidden bg-slate-900"><img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${coLeader}`} className="w-full h-full object-cover" /></div>) : (<span className="text-sm text-slate-600">+</span>)}</button>); })}</div>
                </div>

                <div className="pt-8 border-t border-white/5 space-y-4">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] ml-2 block text-center">Hubs de Disciplina</label>
                    <div className="grid grid-cols-2 gap-4">
                        <button className="flex flex-col items-center justify-center gap-3 p-6 rounded-[2rem] bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 hover:border-red-500/40 transition-all group active:scale-95">
                            <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">🚫</div>
                            <div className="flex flex-col items-center">
                                <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Banidos</span>
                                <span className="text-[6px] font-bold text-red-500/60 uppercase tracking-tighter">Acesso Revogado</span>
                            </div>
                        </button>
                        <button className="flex flex-col items-center justify-center gap-3 p-6 rounded-[2rem] bg-amber-500/5 border border-amber-500/20 hover:bg-amber-500/10 hover:border-amber-500/40 transition-all group active:scale-95">
                            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">🤐</div>
                            <div className="flex flex-col items-center">
                                <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Castigados</span>
                                <span className="text-[6px] font-bold text-amber-500/60 uppercase tracking-tighter">Silenciados Temp.</span>
                            </div>
                        </button>
                    </div>
                </div>

                <div className="pt-4">
                    <button onClick={() => { setTargetRoleForPromotion(null); setIsMemberSelectorOpen(true); }} className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-black text-[9px] uppercase tracking-[0.3em] hover:text-white hover:bg-white/10 transition-all">Ver Membros da Comunidade</button>
                </div>
            </div>
        )}

      </main>
    </div>
  );
};

export default CommunityLeaderPanel;
