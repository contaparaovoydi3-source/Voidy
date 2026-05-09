
import React, { useState, useRef } from 'react';
import { Community } from '../types';
import { SidebarIcon } from './CommunitySidebar';

interface CommunityCreationProps {
  onCancel: () => void;
  onCreate: (comm: Community) => void;
  userName: string;
  userAvatar: string;
  verifySafety?: (content: string, type?: 'image' | 'text') => Promise<boolean>;
}

const PRESET_COLORS = [
  { name: 'Ciano', hex: '#22d3ee' },
  { name: 'Rosa', hex: '#ec4899' },
  { name: 'Roxo', hex: '#a855f7' },
  { name: 'Vermelho', hex: '#ef4444' },
  { name: 'Branco', hex: '#ffffff' }
];

const PREVIEW_MENU_ITEMS = [
  { id: 'inicio', icon: 'inicio', label: 'Início' },
  { id: 'feed', icon: 'feed', label: 'Feed Principal' },
  { id: 'privado', icon: 'privado', label: 'Privado' },
  { id: 'chats', icon: 'chats', label: 'Chats' },
  { id: 'create_cluster', icon: 'create_cluster', label: 'Criar espaços' },
  { id: 'ranking', icon: 'ranking', label: 'Ranking' },
  { id: 'loja', icon: 'loja', label: 'Loja' },
  { id: 'help', icon: 'help', label: 'Ajuda' },
];

const formatTags = (text: string, isOverlay = false) => {
  let p = text;
  const tagRegex = /\[([cbisuBCISU]+)\](.*?)(\[\/\1\]|$)/gi;
  let oldP;
  do {
    oldP = p;
    p = p.replace(tagRegex, (match, tags, content) => {
      let res = content;
      const t = tags.toLowerCase();
      if (t.includes('i')) res = `<em class="italic not-italic-fix" style="opacity: 0.9;">${res}</em>`;
      if (t.includes('b')) res = `<strong class="font-black ${isOverlay ? 'text-[1.25em] inline-block' : 'text-[1.1em]'}">${res}</strong>`;
      if (t.includes('u')) res = `<span class="underline">${res}</span>`;
      if (t.includes('s')) res = `<span class="line-through opacity-60">${res}</span>`;
      if (t.includes('c')) res = `<div style="text-align: center; width: 100%; display: block; margin: 2px 0;">${res}</div>`;
      return res;
    });
  } while (p !== oldP);
  return p;
};

const formatBioText = (text: string) => {
  if (!text) return "";
  return text.split('\n').map(line => {
    let p = line;
    const imgRegex = /\[(img_[a-z0-9]+)(?:\s+h=(\d+))?(?:\s+p=(\d+))?(?:\s+w=(\d+))?(?:\s+a=([lcr]))?\]\s*(?:"([^"]*)")?/gi;
    const images: { html: string, align: string }[] = [];
    p = p.replace(imgRegex, (match, id, height, pos, width, align, overlay) => {
      const savedSrc = localStorage.getItem('vimg_' + id);
      if (!savedSrc) return "";
      
      let finalHeight = height;
      if (finalHeight) {
        const hVal = Number(finalHeight);
        if (hVal > 1500) finalHeight = '1500';
      }
      
      let finalWidth = width;
      if (finalWidth) {
        const wVal = Number(finalWidth);
        if (wVal > 500) finalWidth = '500';
      }

      const isTransparent = savedSrc.includes('image/png') || savedSrc.includes('image/webp');
      const customHeight = finalHeight ? `${finalHeight}px` : (overlay !== undefined ? '150px' : 'auto');
      const customPos = pos ? `center ${pos}%` : 'center center';
      const customWidth = finalWidth ? `${finalWidth}%` : '100%';
      const borderStyle = isTransparent ? 'border: none; background: transparent; box-shadow: none;' : 'border: 1px solid rgba(255,255,255,0.1); background: transparent; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);';
      const renderStyleBase = `height: 100%; width: 100%; object-position: ${customPos}; image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges; transform: translateZ(0); -webkit-backface-visibility: hidden; display: block;`;
      let imgHtml = "";
      if (overlay !== undefined && overlay.trim() !== "") {
        const formattedOverlay = formatTags(overlay, true);
        imgHtml = `<div class="relative rounded-2xl overflow-hidden flex items-center justify-center flex-1 min-w-0" style="height: ${customHeight}; ${finalWidth ? `max-width: ${customWidth};` : ''} ${borderStyle}">
                    <img src="${savedSrc}" class="absolute inset-0 w-full h-full object-cover" style="${renderStyleBase}" />
                    <div class="absolute inset-0 bg-black/15 flex items-center justify-center p-2">
                       <div class="text-white font-black uppercase tracking-[0.25em] text-center text-[8px] md:text-[10px] select-none leading-tight">${formattedOverlay}</div>
                    </div>
                  </div>`;
      } else {
        imgHtml = `<div class="flex-1 min-w-0" style="${finalWidth ? `max-width: ${customWidth};` : ''}">
                  <img src="${savedSrc}" class="w-full rounded-2xl object-cover block" style="${renderStyleBase} ${borderStyle} height: ${customHeight};" />
                </div>`;
      }
      images.push({ html: imgHtml, align: align || 'c' });
      return `__IMG_PLACEHOLDER_${images.length - 1}__`;
    });
    p = formatTags(p);
    
    // Grouping
    const placeholderClusterRegex = /((?:__IMG_PLACEHOLDER_\d+__[\t ]*)+)/g;
    p = p.replace(placeholderClusterRegex, (cluster) => {
      const ids = cluster.match(/\d+/g) || [];
      if (ids.length === 0) return cluster;
      
      let resultHtml = "";
      for (let i = 0; i < ids.length; i += 8) {
        const chunk = ids.slice(i, i + 8);
        const firstImg = images[Number(chunk[0])];
        const rowAlign = firstImg.align === 'l' ? 'justify-start' : firstImg.align === 'r' ? 'justify-end' : 'justify-center';
        
        const rowHtml = chunk.map(id => images[Number(id)].html).join('');
        resultHtml += `<div class="w-full flex flex-wrap ${rowAlign} gap-2 my-2 leading-[0] m-0 p-0">${rowHtml}</div>`;
      }
      return resultHtml;
    });
    return `<div class="min-h-[1.2em] leading-tight mb-0 m-0 p-0">${p}</div>`;
  }).join('');
};

const getContrastColor = (hexOrImage: string | null, isDarkMode: boolean) => {
  if (!hexOrImage) return isDarkMode ? 'text-white' : 'text-slate-950';
  
  // Se for imagem (wallpaper), forçamos branco com drop-shadow
  if (hexOrImage.startsWith('data:') || hexOrImage.startsWith('http')) {
    return 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)]';
  }
  
  const hex = hexOrImage.replace('#', '');
  if (hex.length < 6) return isDarkMode ? 'text-white' : 'text-slate-950';
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  return brightness > 155 ? 'text-slate-950' : 'text-white';
};

const CommunityCreation: React.FC<CommunityCreationProps> = ({ onCancel, onCreate, userName, userAvatar, verifySafety }) => {
  const [activeSection, setActiveSection] = useState<'INFO' | 'ESTILO' | 'BIO' | 'ESPAÇO'>('INFO');
  const [previewInternalTab, setPreviewInternalTab] = useState('Publicações');
  const [isPreviewSidebarOpen, setIsPreviewSidebarOpen] = useState(false);
  const [name, setName] = useState('');
  const [catchphrase, setCatchphrase] = useState('');
  const [description, setDescription] = useState('');
  const [primaryTag, setPrimaryTag] = useState('GERAL');
  const [subTag, setSubTag] = useState('');
  const [selectedColor, setSelectedColor] = useState('#22d3ee');
  const [hubImage, setHubImage] = useState<string | null>(null);
  const [homeCover, setHomeCover] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [headerBg, setHeaderBg] = useState<string | null>(null);
  const [bottomBarBg, setBottomBarBg] = useState<string | null>(null);
  const [sidebarBg, setSidebarBg] = useState<string | null>(null);
  const [communityBg, setCommunityBg] = useState<string>('#02040a');

  const hubInputRef = useRef<HTMLInputElement>(null);
  const homeInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);
  const bottomInputRef = useRef<HTMLInputElement>(null);
  const sidebarInputRef = useRef<HTMLInputElement>(null);

  const isFormValid = name.trim().length > 0 && hubImage !== null && homeCover !== null;

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

  const handleFinalize = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isFormValid) {
      const missing = [];
      if (!name.trim()) missing.push("Nome do Espaço");
      if (!hubImage) missing.push("Avatar");
      if (!homeCover) missing.push("Wallpaper");
      
      setErrorMessage(`Protocolo de Lançamento Falhou: Defina ${missing.join(', ')} antes de prosseguir.`);
      setActiveSection('INFO');
      return;
    }

    if (verifySafety) {
      const isNameSafe = await verifySafety(name, 'text');
      if (!isNameSafe) return;
      const isCatchphraseSafe = await verifySafety(catchphrase, 'text');
      if (!isCatchphraseSafe) return;
      const isDescSafe = await verifySafety(description, 'text');
      if (!isDescSafe) return;
    }
    
    const themeLabel = primaryTag.charAt(0).toUpperCase() + primaryTag.slice(1).toLowerCase();
    const processedSubtag = subTag.trim() 
      ? (subTag.startsWith('#') ? subTag.toLowerCase() : '#' + subTag.toLowerCase())
      : null;

    const newComm: Community = {
      id: `city-${Date.now()}`,
      name: name.toUpperCase(),
      catchphrase: catchphrase,
      description: description || "Um novo espaço no vácuo.",
      avatar: hubImage || `https://api.dicebear.com/7.x/identicon/svg?seed=${name}`,
      banner: hubImage || 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=400',
      homeCover: homeCover || hubImage || 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1000',
      primaryColor: selectedColor,
      theme: themeLabel, 
      creator: userName,
      leaders: [userName],
      coLeaders: [],
      membersCount: 1,
      level: 1,
      posts: [],
      messages: [],
      tags: processedSubtag ? [primaryTag.toLowerCase(), processedSubtag] : [primaryTag.toLowerCase()],
      isPublic: true,
      style: {
        primaryColor: selectedColor,
        accentColor: selectedColor,
        backgroundColor: communityBg,
        patternType: 'GRID',
        glassOpacity: 0.6,
        borderRoundness: '1.5rem',
        sidebarBg: sidebarBg || undefined,
        headerBg: headerBg || undefined,
        bottomBarBg: bottomBarBg || undefined
      },
      membersData: {
        [userName]: { userId: userName, cityLevel: 1, cityReputation: 100, cityRank: 'FUNDADOR', joinDate: Date.now() }
      }
    };
    onCreate(newComm);
  };

  const renderPreviewContent = () => {
    const themeBg = 'bg-[#02040a]';
    const themeText = 'text-white';
    const themeSub = 'text-slate-400';

    return (
      <div className={`fixed inset-0 z-[3000] flex flex-col ${themeBg} animate-in slide-in-from-left duration-75 overflow-y-auto no-scrollbar font-inter ${themeText}`}>
        <div className="relative w-full h-[220px] md:h-[420px] shrink-0 overflow-hidden">
          <img src={homeCover || hubImage || 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=3840&auto=format&fit=crop'} className="w-full h-full object-cover opacity-80" alt="Banner" />
          <div className={`absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-[#02040a]`} />
          
          <button onClick={() => setActiveSection('ESTILO')} className="absolute top-4 md:top-8 left-4 md:left-6 p-1.5 md:p-2 bg-black/60 backdrop-blur-md rounded-xl text-white border border-white/10 active:scale-95 transition-all shadow-xl z-20"><svg className="w-4 h-4 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg></button>
          
          <div className="absolute top-4 md:top-8 right-4 md:right-6 flex gap-2 z-20">
            <button onClick={() => setActiveSection('ESPAÇO')} className="px-3 py-1.5 bg-cyan-500/20 backdrop-blur-md rounded-xl text-cyan-400 border border-cyan-500/30 text-[8px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl">Ver Espaço →</button>
            <button onClick={(e) => handleFinalize(e)} className="px-3 py-1.5 bg-emerald-500/20 backdrop-blur-md rounded-xl text-emerald-400 border border-emerald-500/30 text-[8px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl">Lançar Espaço</button>
          </div>
        </div>
        
        <div className="px-5 md:px-8 -mt-12 md:-mt-24 relative z-10 flex flex-col items-center text-center pb-8 md:pb-12">
          <div className={`w-20 h-20 md:w-36 md:h-36 rounded-[1.5rem] md:rounded-[2.5rem] border-[4px] border-[#02040a] shadow-2xl overflow-hidden bg-slate-900 mb-4 md:mb-6 transition-transform hover:scale-105 duration-500`}>
            <img src={hubImage || `https://api.dicebear.com/7.x/identicon/svg?seed=${name}`} className="w-full h-full object-cover" alt="Avatar" />
          </div>
          
          <div className="mb-2 md:mb-4">
            <h2 className={`text-base md:text-2xl font-black uppercase tracking-tighter heavyweight leading-none ${themeText}`}>{name || 'NOME DO ESPAÇO'}</h2>
          </div>
          
          <div className="w-full max-lg space-y-4 md:space-y-6 animate-in fade-in duration-1000">
             <div className="flex flex-col gap-1.5 md:gap-3">
                <h3 className="text-[6px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Diretriz Operacional</h3>
                <p className={`text-[10px] md:text-base leading-relaxed font-medium heavyweight whitespace-pre-wrap ${themeSub}`}>
                  {catchphrase || 'Sem bordão definido.'}
                </p>
             </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 mt-4 mb-6 md:mb-10">
             <span className="px-2 md:px-4 py-0.5 md:py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-[5px] md:text-[9px] font-black text-cyan-400 uppercase tracking-widest shadow-lg">Setor Nível 1</span>
             <span className={`text-[6px] md:text-[10px] heavyweight font-bold uppercase tracking-widest ${themeSub}`}>1 Consciência</span>
          </div>

          <button onClick={(e) => handleFinalize(e)} className={`w-fit px-10 md:px-20 py-3 md:py-5 bg-white text-black rounded-xl md:rounded-[2.5rem] font-black text-[8px] md:text-[11px] uppercase tracking-[0.2em] md:tracking-[0.4em] shadow-xl hover:bg-cyan-50 transition-all active:scale-95`}>
            Lançar Espaço no Vácuo
          </button>
        </div>

        <div className={`bg-[#02040a] w-full p-8 md:p-16 flex flex-col items-center`}>
           <div className="max-w-xl w-full text-left">
              <div className={`text-[10px] md:text-base leading-relaxed font-medium heavyweight text-slate-400`}>
                 <div dangerouslySetInnerHTML={{ __html: description ? formatBioText(description) : 'Sem descrição definida.' }} />
              </div>
           </div>
        </div>
      </div>
    );
  };

  const renderInternalPreview = () => {
    const previewBg = communityBg || (isDarkMode ? '#02040a' : '#ffffff');
    const sidebarBgColor = isDarkMode 
        ? (sidebarBg?.startsWith('#') ? sidebarBg : '#0a0c1a') 
        : (sidebarBg?.startsWith('#') ? sidebarBg : '#ffffff');

    const headerTextContrast = getContrastColor(headerBg, isDarkMode);
    const sidebarTextContrast = getContrastColor(sidebarBg, isDarkMode);
    const bottomBarTextContrast = getContrastColor(bottomBarBg, isDarkMode);

    return (
      <div className={`absolute inset-0 z-[150] flex flex-col overflow-hidden animate-in slide-in-from-left duration-75 font-inter`} style={{ backgroundColor: previewBg }}>
          <div className={`fixed inset-0 z-[500] flex transition-all duration-500 ${isPreviewSidebarOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
            <div className={`absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity duration-700 ease-out ${isPreviewSidebarOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsPreviewSidebarOpen(false)} />
            <div className={`relative flex h-full w-[60%] max-w-[240px] shadow-2xl transition-transform duration-700 border-r ${isDarkMode ? 'border-white/5' : 'border-slate-200'} overflow-hidden ${isPreviewSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)', backgroundColor: sidebarBgColor }}>
              <div className="w-[50px] h-full bg-[#05060a] flex flex-col items-center py-5 gap-3.5 border-r border-white/5 z-20">
                <button className="w-7 h-7 flex flex-col items-center justify-center text-slate-500 active:scale-90 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg><span className="text-[6px] font-black uppercase mt-1">Sair</span></button>
                <div className="w-5 h-[1px] bg-white/5 my-1"></div>
                <div className="w-8 h-8 rounded-lg overflow-hidden border-2 border-cyan-500 shadow-xl bg-slate-900"><img src={hubImage || ''} alt="Espaço" className="w-full h-full object-cover" /></div>
              </div>

              <div className="flex-1 flex flex-col relative overflow-hidden bg-transparent">
                <div className="absolute inset-0 z-0 overflow-hidden">
                  {sidebarBg && (sidebarBg.startsWith('data:') || sidebarBg.startsWith('http')) ? (
                    <>
                      <img src={sidebarBg} className="w-full h-full object-cover opacity-100 blur-[1px]" />
                      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#05060a] via-[#05060a]/60 to-transparent z-[1]" />
                      <div className="absolute inset-0 bg-black/20 z-[2]" />
                    </>
                  ) : null}
                  {isDarkMode && !sidebarBg && <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0c14]/60 to-[#0a0c14]" />}
                </div>
                
                <div className="relative flex-1 overflow-y-auto no-scrollbar z-10 px-2 md:px-4">
                  <div className="flex justify-between items-center py-5">
                     <button onClick={() => setIsPreviewSidebarOpen(false)} className={`p-2 rounded-xl bg-white/10 ${sidebarTextContrast}`}><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg></button>
                     <span className={`text-[7px] font-black ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'} uppercase tracking-[0.3em] opacity-80`}>Simulação</span>
                  </div>

                  <div className="flex flex-col items-center pt-4 pb-6">
                     <div className={`w-12 h-12 rounded-full border-[3px] ${isDarkMode ? 'border-white/20' : 'border-slate-300'} p-1 mb-3`}><div className="w-full h-full rounded-full overflow-hidden bg-slate-900 grayscale-[0.2]"><img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" /></div></div>
                     <h2 className={`text-[9px] font-bold uppercase tracking-wide mb-3 ${sidebarTextContrast}`}>{userName}</h2>
                     <div className="w-full max-w-[120px] mb-6">
                        <div className="flex justify-between items-end mb-1 px-1"><span className={`text-[5px] font-black ${sidebarTextContrast} opacity-40 uppercase tracking-widest`}>Nível</span><span className="text-[7px] font-orbitron font-bold text-cyan-500">LVL 01</span></div>
                        <div className={`h-1 w-full ${isDarkMode ? 'bg-white/20' : 'bg-slate-200'} rounded-full overflow-hidden border border-black/5`}><div className="h-full bg-cyan-500/60 rounded-full" style={{ width: '35%' }}></div></div>
                     </div>
                  </div>

                  <nav className="space-y-1 pb-4">
                     {PREVIEW_MENU_ITEMS.map((item, idx) => (
                       <div key={idx} className="w-full flex items-center gap-3 px-3 py-2 group">
                         <div className={`w-6 h-6 flex items-center justify-center transition-transform opacity-70`}>
                            <SidebarIcon id={item.icon} className={`w-4 h-4 ${sidebarTextContrast}`} />
                         </div>
                         <span className={`text-[9px] font-black tracking-wide ${sidebarTextContrast}`}>{item.label}</span>
                       </div>
                     ))}
                  </nav>
                </div>

                <div className={`px-4 py-2 border-t ${isDarkMode ? 'border-white/10' : 'border-black/10'} bg-transparent z-20 flex justify-between items-center shrink-0`}>
                   <div className="flex flex-col">
                      <span className={`text-[5px] font-syncopate font-black tracking-[0.4em] uppercase opacity-40 ${sidebarTextContrast}`}>PREVIEW</span>
                   </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden relative">
            <header 
                className="backdrop-blur-xl pt-6 md:pt-10 pb-1 px-3 md:px-4 flex flex-col gap-2 md:gap-4 shadow-xl shrink-0 z-20 relative overflow-hidden" 
                style={{ 
                    backgroundColor: headerBg?.startsWith('#') ? `${headerBg}` : (isDarkMode ? 'rgba(2, 4, 10, 0.95)' : 'rgba(255, 255, 255, 1)'), 
                }}
            >
              {(headerBg?.startsWith('data:') || headerBg?.startsWith('http')) && (
                <>
                  <img src={headerBg} className="absolute inset-0 w-full h-full object-cover z-[-1]" />
                  <div className="absolute inset-0 bg-black/25 z-[-1]" />
                </>
              )}
              <div className="flex items-center justify-between relative z-10">
                <button onClick={() => setIsPreviewSidebarOpen(true)} className={`p-1.5 md:p-2 shrink-0 active:scale-90 ${headerTextContrast}`}><svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg></button>
                <div className="flex-1 overflow-hidden text-center mx-2"><h1 className={`font-black text-[10px] md:text-sm uppercase tracking-widest truncate ${headerTextContrast}`}>{name || 'NOME DO ESPAÇO'}</h1></div>
                <button className={`p-1.5 md:p-2 shrink-0 opacity-50 ${headerTextContrast}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg></button>
              </div>
              <div className="flex items-end h-7 md:h-10 overflow-x-auto no-scrollbar gap-4 md:gap-6 px-3 relative z-10">
                {['Publicações', 'Enquetes', 'Chats Públicos', 'Ficha', 'Sistema RPG'].map((tab) => { 
                    const isActive = previewInternalTab === tab; 
                    return ( 
                        <button key={tab} onClick={() => setPreviewInternalTab(tab)} className={`relative pb-1.5 px-0.5 text-[9px] md:text-[12px] font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0 ${isActive ? headerTextContrast : 'opacity-40'}`}>
                            {tab}
                            {isActive && <div className={`absolute bottom-0 left-0 w-full h-[2px] ${headerTextContrast.includes('text-white') ? 'bg-white' : 'bg-slate-950'} shadow-lg rounded-t-full`}></div>}
                        </button> 
                    ); 
                })}
              </div>
            </header>

            <main className="flex-1 flex flex-col bg-transparent overflow-hidden relative">
              <div className="flex-1 flex flex-col items-center justify-center p-10 opacity-10 text-center">
                 <SidebarIcon id="Publicações" className={`w-10 h-10 mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`} />
                 <p className={`text-[8px] md:text-[10px] font-black uppercase ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Nada aqui!</p>
              </div>
              
              <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 w-[85%] md:w-[90%] max-lg h-12 md:h-20 z-[200] flex items-center justify-around px-3 md:px-4 overflow-visible">
                {/* Camada de Fundo Simulação */}
                <div 
                  className="absolute inset-0 rounded-full border border-black/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-0"
                  style={{ backgroundColor: bottomBarBg?.startsWith('#') ? bottomBarBg : (isDarkMode ? '#0a0c1a' : '#ffffff') }}
                >
                  {(bottomBarBg?.startsWith('data:') || bottomBarBg?.startsWith('http')) && (
                    <>
                      <img src={bottomBarBg} className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20" />
                    </>
                  )}
                </div>

                <button onClick={() => setIsPreviewSidebarOpen(false)} className={`relative z-10 p-1.5 scale-90 md:scale-100 active:scale-90 transition-all ${bottomBarTextContrast}`}><svg className="w-5 h-5 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg></button>
                <div className={`relative z-10 p-1.5 scale-90 md:scale-100 ${bottomBarTextContrast} opacity-60`}><svg className="w-5 h-5 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg></div>
                
                {/* Simulação Botão "+" sem corte */}
                <div className="relative z-20 w-12 h-12 md:w-16 md:h-16 rounded-full bg-cyan-500 flex items-center justify-center text-white shadow-[0_10px_25px_rgba(34,211,238,0.2)] -mt-10 md:-mt-14 active:scale-90 transition-all border-[3px]" style={{ borderColor: isDarkMode ? '#02040a' : '#ffffff' }}>
                  <svg className="w-7 h-7 md:w-9 md:h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3.5"><path d="M12 4v16m8-8H4"/></svg>
                </div>

                <div className={`relative z-10 p-1.5 scale-90 md:scale-100 ${bottomBarTextContrast} opacity-60`}><svg className="w-5 h-5 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg></div>
                <div className="relative z-10 p-0.5 rounded-full border-2 border-slate-300 w-8 h-8 md:w-11 md:h-11 shadow-sm opacity-80 shrink-0"><img src={userAvatar} className="w-full h-full object-cover rounded-full" /></div>
              </div>
            </main>
          </div>

          <div className="fixed top-6 right-4 md:right-8 z-[300] flex gap-2">
            <button onClick={(e) => handleFinalize(e)} className={`bg-emerald-500 text-white px-4 py-2 rounded-full text-[7px] md:text-[8px] font-black uppercase tracking-widest shadow-2xl active:scale-90 transition-all border border-emerald-400/50`}>Lançar Espaço ✓</button>
            <button onClick={() => setActiveSection('ESTILO')} className={`bg-white text-black px-4 py-2 rounded-full text-[7px] md:text-[8px] font-black uppercase tracking-widest shadow-2xl active:scale-90 transition-all border border-black/10`}>Sair ✕</button>
          </div>
      </div>
    );
  };

  const currentStep = ['INFO', 'ESTILO', 'BIO', 'ESPAÇO'].indexOf(activeSection);

  return (
    <div 
      className="absolute inset-0 z-[180] bg-[#02040a] flex flex-col overflow-hidden"
      onTouchStart={(e) => e.stopPropagation()} 
      onTouchMove={(e) => e.stopPropagation()}  
    >
      {/* WALLPAPER ARRAIA NO NEXUS BUILDER */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <img 
          src="https://storage.googleapis.com/voidyapp-storage/Fundo%20arraia.png" 
          className="w-full h-full object-cover opacity-100 saturate-150 contrast-[1.1]" 
          alt="Nexus Builder Background" 
        />
        <div className="absolute inset-0 bg-black/40 z-[1]" />
      </div>

      {activeSection !== 'BIO' && activeSection !== 'ESPAÇO' && (
        <header className="relative z-10 px-5 md:px-6 py-3.5 md:py-4 border-b border-white/5 bg-black/40 backdrop-blur-xl shrink-0">
          <div className="flex items-center justify-between">
            <button onClick={onCancel} className="p-1.5 text-slate-400 hover:text-white transition-all active:scale-90"><svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg></button>
            <div className="flex flex-col items-center">
              <h2 className="text-[8px] md:text-[10px] font-syncopate font-black text-white uppercase tracking-widest">NEXUS BUILDER</h2>
              <div className="flex gap-1 mt-1 md:mt-1.5">{['INFO', 'ESTILO', 'BIO', 'ESPAÇO'].map((s, idx) => (<div key={s} className={`h-0.5 md:h-1 rounded-full transition-all duration-500 ${currentStep === idx ? 'bg-cyan-500 w-4 md:w-6' : 'bg-white/10 w-2 md:w-3'}`} />))}</div>
            </div>
            <div className="w-7 md:w-8"></div>
          </div>
        </header>
      )}

      {activeSection === 'BIO' || activeSection === 'ESPAÇO' ? (
        <div className="flex-1 flex flex-col overflow-hidden relative">{activeSection === 'BIO' ? renderPreviewContent() : renderInternalPreview()}</div>
      ) : (
        <main className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-5 space-y-5 md:space-y-6 relative z-10">
          <div className="flex gap-1 md:gap-2 justify-center mb-3 md:mb-4 overflow-x-auto no-scrollbar pb-1">{['INFO', 'ESTILO', 'BIO', 'ESPAÇO'].map(tab => (<button key={tab} onClick={() => setActiveSection(tab as any)} className={`px-2.5 py-1 md:px-6 md:py-2 rounded-full text-[6px] md:text-[8px] font-black uppercase tracking-widest border transition-all duration-300 whitespace-nowrap ${activeSection === tab ? 'bg-white text-black border-white shadow-lg' : 'border-white/10 text-slate-500 hover:text-slate-300'}`}>{tab}</button>))}</div>

          {activeSection === 'INFO' && (
            <div className="space-y-5 md:space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-1 md:space-y-1.5"><label className="text-[6px] md:text-[7px] font-black text-slate-600 uppercase tracking-[0.3em] ml-3 md:ml-4">Título do Espaço</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="• Ex: NEO TOKYO" className="w-full bg-black/60 backdrop-blur-md border border-white/10 p-3 md:p-3.5 rounded-2xl md:rounded-3xl text-white font-black text-sm md:text-base outline-none focus:border-cyan-500 transition-all placeholder:text-slate-800" /></div>
              <div className="grid grid-cols-2 gap-3"><div className="space-y-1 md:space-y-1.5"><label className="text-[6px] md:text-[7px] font-black text-slate-600 uppercase tracking-[0.3em] ml-3 md:ml-4">TAG Principal</label><input value={primaryTag} onChange={(e) => setPrimaryTag(e.target.value.toUpperCase().slice(0, 15))} placeholder="• Ex: RPG" className="w-full bg-black/60 backdrop-blur-md border border-white/10 p-3 md:p-3.5 rounded-xl md:rounded-3xl text-cyan-400 font-black text-[8px] md:text-[10px] outline-none focus:border-cyan-500 transition-all placeholder:text-slate-800" /></div><div className="space-y-1 md:space-y-1.5"><label className="text-[6px] md:text-[7px] font-black text-slate-600 uppercase tracking-[0.3em] ml-3 md:ml-4">Subtag (Nicho)</label><input value={subTag} onChange={(e) => setSubTag(e.target.value.slice(0, 20))} placeholder="• Ex: #vampiro" className="w-full bg-black/60 backdrop-blur-md border border-white/10 p-3 md:p-3.5 rounded-xl md:rounded-3xl text-purple-400 font-black text-[8px] md:text-[10px] outline-none focus:border-cyan-500 transition-all placeholder:text-slate-800" /></div></div>
              <div className="space-y-1 md:space-y-1.5"><label className="text-[6px] md:text-[7px] font-black text-slate-600 uppercase tracking-[0.3em] ml-3 md:ml-4">Bordão</label><input value={catchphrase} onChange={(e) => setCatchphrase(e.target.value)} placeholder="• Ex: Onde o futuro colide." className="w-full bg-black/60 backdrop-blur-md border border-white/10 p-3 md:p-3.5 rounded-2xl md:rounded-3xl text-white text-[9px] md:text-[10px] outline-none focus:border-cyan-500 transition-all placeholder:text-slate-800" /></div>
              <div className="space-y-1 md:space-y-1.5"><label className="text-[6px] md:text-[7px] font-black text-slate-600 uppercase tracking-[0.3em] ml-3 md:ml-4">Bibliografia Completa</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva a lore, regras e boas-vindas deste universo..." className="w-full bg-black/60 backdrop-blur-md border border-white/10 p-3 md:p-3.5 rounded-2xl md:rounded-3xl text-white text-xs outline-none focus:border-cyan-500 h-24 md:h-32 resize-none transition-all placeholder:text-slate-800" /></div>
            </div>
          )}

          {activeSection === 'ESTILO' && (
            <div className="space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4 duration-500">
               <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-2 md:space-y-3">
                    <label className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] text-center block">Radar (Avatar)</label>
                    <div onClick={() => hubInputRef.current?.click()} className="relative aspect-square w-full rounded-2xl md:rounded-3xl border-2 border-dashed border-white/10 overflow-hidden flex items-center justify-center bg-black/40 backdrop-blur-md cursor-pointer group transition-all">
                      {hubImage ? <img src={hubImage} className="absolute inset-0 w-full h-full object-cover" /> : <div className="flex flex-col items-center gap-1.5 md:gap-2"><SidebarIcon id="feed" className="w-8 h-8 text-slate-600" /><span className="text-[6px] md:text-[7px] font-black text-slate-600 uppercase">Avatar</span></div>}
                      <input type="file" ref={hubInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setHubImage)} />
                    </div>
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    <label className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] text-center block">Banner de Sincronia</label>
                    <div onClick={() => homeInputRef.current?.click()} className="relative aspect-square w-full rounded-2xl md:rounded-3xl border-2 border-dashed border-white/10 flex items-center justify-center bg-black/40 backdrop-blur-md cursor-pointer transition-all overflow-hidden">
                      {homeCover ? <img src={homeCover} className="absolute inset-0 w-full h-full object-cover" /> : <div className="flex flex-col items-center gap-1.5 md:gap-2"><SidebarIcon id="Publicações" className="w-8 h-8 text-slate-600" /><span className="text-[6px] md:text-[7px] font-black text-slate-600 uppercase">Banner</span></div>}
                      <input type="file" ref={homeInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setHomeCover)} />
                    </div>
                  </div>
               </div>

               <div className="space-y-4 pt-4 border-t border-white/5">
                  <label className="text-[8px] md:text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] text-center block mb-4">Cor de Fundo do Espaço</label>
                  <div className="flex flex-col items-center gap-3">
                    <input type="color" value={communityBg} onChange={(e) => setCommunityBg(e.target.value)} className="w-16 h-16 rounded-full bg-transparent border-2 border-white/20 cursor-pointer shadow-xl" />
                    <span className="text-[6px] font-black uppercase text-slate-500 tracking-widest">Sincronia Cromática Principal</span>
                  </div>
               </div>

               <div className="space-y-4 pt-4 border-t border-white/5">
                  <label className="text-[8px] md:text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] text-center block mb-4">Sincronia de Componentes</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="space-y-2"><label className="text-[7px] font-black text-slate-500 uppercase tracking-widest ml-2">Aba Superior (Fotos/Cores)</label><div className="flex gap-2"><input type="color" value={headerBg?.startsWith('#') ? headerBg : '#1e3a8a'} onChange={(e) => setHeaderBg(e.target.value)} className="w-6 h-6 rounded cursor-pointer" /><button onClick={() => headerInputRef.current?.click()} className={`flex-1 rounded-lg border border-white/10 text-[7px] font-black uppercase flex items-center justify-center gap-2 ${headerBg?.startsWith('data:') ? 'bg-cyan-500 text-black' : 'bg-white/5 text-slate-400'}`}>{headerBg?.startsWith('data:') ? 'Wallpaper Ativo' : 'Upload BG'}</button><input type="file" ref={headerInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setHeaderBg)} /></div></div>
                     <div className="space-y-2"><label className="text-[7px] font-black text-slate-500 uppercase tracking-widest ml-2">Barra Lateral</label><div className="flex gap-2"><input type="color" value={sidebarBg?.startsWith('#') ? sidebarBg : '#0a0c1a'} onChange={(e) => setSidebarBg(e.target.value)} className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer" /><button onClick={() => sidebarInputRef.current?.click()} className={`flex-1 rounded-lg border border-white/10 text-[7px] font-black uppercase flex items-center justify-center gap-2 ${sidebarBg?.startsWith('data:') ? 'bg-cyan-500 text-black' : 'bg-white/5 text-slate-400'}`}>{sidebarBg?.startsWith('data:') ? 'Wallpaper Ativo' : 'Upload BG'}</button><input type="file" ref={sidebarInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setSidebarBg)} /></div></div>
                     <div className="space-y-2"><label className="text-[7px] font-black text-slate-500 uppercase tracking-widest ml-2">Barra Inferior</label><div className="flex gap-2"><input type="color" value={bottomBarBg?.startsWith('#') ? bottomBarBg : '#ffffff'} onChange={(e) => setBottomBarBg(e.target.value)} className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer" /><button onClick={() => bottomInputRef.current?.click()} className={`flex-1 rounded-lg border border-white/10 text-[7px] font-black uppercase flex items-center justify-center gap-2 ${bottomBarBg?.startsWith('data:') ? 'bg-cyan-500 text-black' : 'bg-white/5 text-slate-400'}`}>{bottomBarBg?.startsWith('data:') ? 'Wallpaper Ativo' : 'Upload BG'}</button><input type="file" ref={bottomInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setBottomBarBg)} /></div></div>
                  </div>
               </div>
               <div className="space-y-3 md:space-y-4"><label className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] text-center block">Cromia de Comando (Acentos)</label><div className="flex justify-center gap-2.5 md:gap-3">{PRESET_COLORS.map(c => (<button key={c.hex} onClick={() => setSelectedColor(c.hex)} className={`w-7 h-7 md:w-8 md:h-8 rounded-full border-2 transition-all ${selectedColor === c.hex ? 'border-white scale-110' : 'border-transparent opacity-30'}`} style={{ backgroundColor: c.hex }} />))}</div></div>
               <button onClick={(e) => handleFinalize(e)} disabled={!isFormValid} className={`w-full py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl ${isFormValid ? 'bg-cyan-500 text-black' : 'bg-white/5 text-slate-700 border border-white/5'}`}>Confirmar Espaço</button>
            </div>
          )}
        </main>
      )}

      {activeSection !== 'BIO' && activeSection !== 'ESPAÇO' && (
        <footer className="p-5 md:p-6 bg-black/40 border-t border-white/5 backdrop-blur-xl relative z-10">
          <button onClick={() => setActiveSection(activeSection === 'INFO' ? 'ESTILO' : 'BIO')} className="w-full py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] transition-all active:scale-95 shadow-lg bg-white text-black">Avançar Protocolo</button>
        </footer>
      )}

      {/* ABA INFERIOR DE ERRO */}
      {errorMessage && (
        <div className="fixed inset-x-0 bottom-0 z-[4000] p-4 md:p-6 animate-in slide-in-from-bottom duration-500">
           <div className="max-w-xl mx-auto bg-[#0f0505]/95 backdrop-blur-3xl border border-red-500/30 rounded-[2rem] p-6 shadow-[0_-20px_50px_rgba(239,68,68,0.15)] flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-xl animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                ⚠️
              </div>
              <div className="text-center space-y-1">
                 <h3 className="text-xs font-syncopate font-black text-red-500 uppercase tracking-widest">Sinal Bloqueado</h3>
                 <p className="text-[10px] md:text-xs text-slate-300 font-medium leading-relaxed uppercase tracking-wider px-2">
                    {errorMessage}
                 </p>
              </div>
              <button 
                onClick={() => setErrorMessage(null)} 
                className="w-full py-3 bg-red-600/10 border border-red-600/40 text-red-400 rounded-xl font-black text-[9px] uppercase tracking-[0.3em] active:scale-95 transition-all mt-2"
              >
                Entendido
              </button>
           </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: `
        .not-italic-fix { font-style: italic !important; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}} />
    </div>
  );
};

export default CommunityCreation;
