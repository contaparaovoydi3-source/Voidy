import React, { useState, useRef, useMemo, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { MODEL_TEXT } from "../constants";
import { Community, UserProfile, FeedPost, PostComment, PollOption, CommunityChannel, CityMemberData, MarketItem, RpgMission, Message, MuralPost, Npc } from '../types';
import CommunitySidebar, { SidebarIcon } from './CommunitySidebar';
import CommunitySettings from './CommunitySettings';
import CommunityLeaderPanel from './CommunityLeaderPanel';
import CommunityRanking from './CommunityRanking';
import BlogCreation from './BlogCreation';
import PollCreation from './PollCreation';
import WikiCreation from './WikiCreation';
import CommunityDrafts from './CommunityDrafts';
import ChatCreation from './ChatCreation';
import ProfileView from './ProfileView';
import SellCreation from './SellCreation';
import CommunityMembersView from './CommunityMembersView';
import CommunityProfileView from './CommunityProfileView';

interface CommunityViewProps {
  community: Community;
  allCommunities?: Community[];
  onSelectCommunity?: (id: string) => void;
  userName: string;
  userAvatar: string;
  userProfile?: UserProfile;
  onProfileUpdate: (name: string, avatar: string, pCol?: string, cCol?: string, pImg?: string, cImg?: string, fCol?: string, fStyle?: string, bio?: string, sIcon?: string, hStats?: boolean, nCol?: string, mTop?: string, mFeed?: string, mImg?: string, mFeedImg?: string, mural?: MuralPost[], posts?: FeedPost[], voidyCoins?: number, dailyAdCount?: number, lastAdReset?: number) => void;
  onBack: () => void;
  onUpdate: (updater: (comm: Community) => Community) => void;
  onDelete: (id: string) => void;
  onAddMemberClick: () => void;
  onViewProfile: (profile: UserProfile) => void;
  onNavigateToPrivate?: () => void;
  onNavigateToPublicSearch?: () => void;
  onNavigateToDrafts?: () => void;
  onNavigateToMembers?: () => void;
  onNavigateToRanking?: () => void;
  onNavigateToChats?: () => void;
  onNavigateToValue?: () => void;
  onNavigateToValueAd?: () => void;
  onOpenNotifications?: () => void;
  onShowBio?: (comm: Community) => void;
  addNotification: (notif: any) => void;
  verifySafety?: (base64: string) => Promise<boolean>;
  onStartChat?: (type: any, name: string, avatar?: string, background?: string, id?: string, rpgData?: any, initialMessages?: Message[]) => void;
  onOpenStore?: () => void;
  onAddFeedPost?: (post: FeedPost) => void;
  character?: any;
  onUpdateCharacter?: (updates: any) => void;
}

const TABS = ['Publicações', 'Enquetes', 'Chats Públicos', 'Sistema RPG'];

type SubView = 'MAIN' | 'SETTINGS' | 'LEADER_PANEL' | 'RANKING' | 'DRAFTS' | 'BLOG_CREATION' | 'POLL_CREATION' | 'WIKI_CREATION' | 'CHAT_CREATION' | 'COMMUNITY_PROFILE' | 'CHARACTER_WIKI_CREATION' | 'SELL_CREATION' | 'MARKET_FULL_VIEW' | 'COMMUNITY_STORE' | 'COMMUNITY_FRAMES' | 'COMMUNITY_BUBBLES' | 'COMMUNITY_MEMBERS' | 'MISSION_CREATION' | 'STORY_RECRUITMENT' | 'PROFESSION_SELECTION' | 'CUSTOM_PROFESSION_CREATION';

const MARKET_RARITY_STYLES: Record<string, string> = {
  'COMUM': 'border-[#64748b]/30 text-slate-400',
  'RARO': 'border-[#3b82f6]/40 text-blue-400',
  'EPICO': 'border-[#a855f7]/40 text-purple-400',
  'LENDARIO': 'border-[#f59e0b]/50 text-[#f59e0b]'
};

const getContrastColor = (hexOrImage: string | null | undefined, isDarkMode: boolean) => {
  if (hexOrImage && (hexOrImage.startsWith('data:') || hexOrImage.startsWith('http'))) return 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)]';
  if (hexOrImage && hexOrImage.startsWith('#')) {
    const hex = hexOrImage.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return ((r * 299 + g * 587 + b * 114) / 1000) > 155 ? 'text-slate-950' : 'text-white';
  }
  return isDarkMode ? 'text-white' : 'text-slate-950';
};

const formatTags = (text: string, isOverlay = false) => {
  if (!text) return "";
  let p = text;
  const tagRegex = /\[([cbisuBCISU]+)\]([\s\S]*?)(\[\/\1\]|$)/gi;
  let oldP;
  do {
    oldP = p;
    p = p.replace(tagRegex, (match, tags, content) => {
      let res = content;
      const t = tags.toLowerCase();
      if (t.includes('i')) res = `<em class="italic opacity-90">${res}</em>`;
      if (t.includes('b')) res = `<strong class="font-black text-white ${isOverlay ? 'text-[1.2em] inline-block' : ''}">${res}</strong>`;
      if (t.includes('u')) res = `<span class="underline">${res}</span>`;
      if (t.includes('s')) res = `<span class="line-through opacity-60">${res}</span>`;
      if (t.includes('c')) res = `<div style="text-align: center; width: 100%; display: block; margin: 2px 0;">${res}</div>`;
      return res;
    });
  } while (p !== oldP);
  return p;
};

const getWikiNarrative = (content: string) => {
  if (!content) return "";
  const parts = content.split('[B]REGISTRO:[/B]\n');
  if (parts.length > 1) {
    const afterRegistro = parts[1];
    const narrativeParts = afterRegistro.split('\n\n[B]TAGS:[/B]');
    return narrativeParts[0];
  }
  return content;
};

const formatBioText = (text: string, customTextColor?: string, contextImages?: any[]) => {
  if (!text) return "";
  let p = text;
  
  const imgRegex = /\[\s*([^\]\s=]+)(?:\s*=\s*([^\]\s]*))?\s*([^\]]*)\](?:\s*(?:["']([^"']*)["']|\{([^}]*)\}))?/gi;
  const images: { html: string, align: string }[] = [];
  
  p = p.replace(imgRegex, (match, tagOrId, idValue, attrs, overlayQ, overlayB) => {
      const overlay = overlayQ || overlayB;
      let id = tagOrId;
      let finalAttrs = attrs || "";
      let savedSrc: string | null = null;

      // Keywords support
      const lowerTag = tagOrId.toLowerCase();
      const keywords = ['header', 'capa', 'banner', 'imagem', 'image', 'atm', 'atmosfera'];
      
      if (keywords.includes(lowerTag)) {
        if (contextImages && contextImages.length > 0) {
          let idx = 0;
          if (idValue && !isNaN(Number(idValue))) {
            idx = Number(idValue) - 1; // 1-based indexing
          }
          if (idx >= 0 && idx < contextImages.length) {
            const img = contextImages[idx];
            savedSrc = typeof img === 'string' ? img : img.src;
          }
        }
      }

      if (!savedSrc) {
        if (idValue) id = idValue;
        const lowerId = id.toLowerCase();
        
        if (['b', 'i', 'u', 's', 'c', '/b', '/i', '/u', '/s', '/c'].includes(lowerId)) return match;
        if (lowerId.length === 1 && 'biusc'.includes(lowerId)) return match;

        // Extensive lookup strategy
        savedSrc = localStorage.getItem('vimg_' + id);
        if (!savedSrc) savedSrc = localStorage.getItem(id);
        
        // Data URL or direct link
        if (!savedSrc && (id.startsWith('data:image') || id.startsWith('http'))) {
            savedSrc = id;
        }
        
        if (!savedSrc && !id.startsWith('img_')) {
            savedSrc = localStorage.getItem('vimg_img_' + id) || localStorage.getItem('img_' + id);
        }
        if (!savedSrc && id.startsWith('img_')) {
            const shortId = id.replace('img_', '');
            savedSrc = localStorage.getItem('vimg_' + shortId) || localStorage.getItem(shortId);
        }
      }
      
      if (!savedSrc) return match; 
      
      let height = '';
      let pos = '';
      let width = '';
      let align = '';
      
      if (finalAttrs) {
        const hMatch = finalAttrs.match(/h=(\d+)/);
        const pMatch = finalAttrs.match(/p=(\d+)/);
        const wMatch = finalAttrs.match(/w=(\d+)/);
        const aMatch = finalAttrs.match(/a=([lcr])/);
        if (hMatch) {
          const hVal = Number(hMatch[1]);
          height = hVal > 1500 ? '1500' : hMatch[1];
        }
        if (pMatch) pos = pMatch[1];
        if (wMatch) {
          const wVal = Number(wMatch[1]);
          width = (wVal > 500 ? 500 : wVal).toString();
        }
        if (aMatch) align = aMatch[1];
      }
      
      const isHeaderKeyword = keywords.includes(lowerTag);
      const isTransparent = savedSrc.includes('image/png') || savedSrc.includes('image/webp');
      const defaultHeight = isHeaderKeyword ? '280px' : (overlay !== undefined ? '150px' : 'auto');
      const customHeight = height ? `${height}px` : defaultHeight;
      const customPos = pos ? `center ${pos}%` : 'center center';
      const customWidth = width ? `${width}%` : '100%';
      const borderStyle = isTransparent ? 'border: none;' : 'border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 0 20px rgba(0,0,0,0.5);';
      const renderStyleBase = `height: 100%; width: 100%; object-position: ${customPos}; image-rendering: auto; display: block;`;
      
      let imgHtml = "";
      const hasOverlayText = overlay && overlay.trim() !== "";
      if (overlay !== undefined && overlay !== null) {
        const formattedOverlay = formatTags(overlay.trim(), true);
        imgHtml = `<div class="relative rounded-2xl overflow-hidden flex items-center justify-center flex-1 min-w-0" style="height: ${customHeight}; ${width ? `max-width: ${customWidth};` : ''} ${borderStyle}">
                    <img src="${savedSrc}" loading="lazy" decoding="async" class="absolute inset-0 w-full h-full object-cover" style="${renderStyleBase}" />
                    ${hasOverlayText ? `
                    <div class="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4">
                       <div class="text-white font-syncopate font-black uppercase tracking-[0.2em] text-center text-[10px] leading-tight drop-shadow-lg">${formattedOverlay}</div>
                    </div>
                    ` : ''}
                  </div>`;
      } else {
        imgHtml = `<div class="flex-1 min-w-0" style="${width ? `max-width: ${customWidth};` : ''}">
                  <img src="${savedSrc}" loading="lazy" decoding="async" class="w-full rounded-2xl object-cover block" style="${renderStyleBase} ${borderStyle} height: ${customHeight};" />
                </div>`;
      }
      images.push({ html: imgHtml, align: align || 'c' });
      return `__IMG_PLACEHOLDER_${images.length - 1}__`;
  });
  
  p = formatTags(p, false);
  
  // Agrupar placeholders consecutivos (máximo 8 por linha)
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
      resultHtml += `<div class="w-full flex flex-wrap ${rowAlign} gap-3 my-4 leading-[0] m-0 p-0">${rowHtml}</div>`;
    }
    return resultHtml;
  });
  return `<div class="min-h-[1.2em] leading-relaxed whitespace-pre-wrap" style="${customTextColor ? `color: ${customTextColor}` : ''}">${p}</div>`;
};

const SlideshowWallpaper = ({ images, color, opacity, filter, noGradient = false, bottomColor = 'transparent' }: { images: string[], color: string, opacity: number, filter: string, noGradient?: boolean, bottomColor?: string }) => {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      {images.length > 0 ? images.map((img, i) => (
        <img 
          key={i} 
          src={img} 
          loading={i === 0 ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={i === 0 ? "high" : "low"}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out 4k-texture`}
          style={{ 
            opacity: i === index ? opacity : 0, 
            filter: filter, 
            imageRendering: 'high-quality',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden'
          }} 
          alt="Wallpaper"
        />
      )) : (
         <div className="absolute inset-0 bg-slate-900 opacity-20" />
      )}
      {!noGradient && (
        <div className="absolute inset-0 z-10" style={{ background: `linear-gradient(to bottom, ${color} 0%, ${bottomColor} 100%)` }}></div>
      )}
    </div>
  );
};

const StarIcon = ({ active, className }: { active: boolean, className?: string }) => (
  <svg className={className} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const HeartIcon = ({ active, className }: { active: boolean, className?: string }) => (
  <svg className={className} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const CommunityView: React.FC<CommunityViewProps> = ({ 
  community, allCommunities = [], userName, userAvatar, userProfile, onProfileUpdate, onBack, onUpdate, onDelete, onAddMemberClick, onViewProfile, onSelectCommunity, onNavigateToPrivate, onNavigateToPublicSearch, onNavigateToDrafts, onNavigateToMembers, onNavigateToRanking, onNavigateToChats, onOpenNotifications, onStartChat, onShowBio, verifySafety, addNotification, onOpenStore, onAddFeedPost, character, onUpdateCharacter
}) => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [activePostMenuId, setActivePostMenuId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);
  const [viewedMemberId, setViewedMemberId] = useState<string | null>(null);
  const [missionName, setMissionName] = useState('');
  const [missionReward, setMissionReward] = useState(100);
  const [missionLocation, setMissionLocation] = useState('');
  const [missionType, setMissionType] = useState('EXPLORAÇÃO');
  const [missionDescription, setMissionDescription] = useState('');
  const [missionDuration, setMissionDuration] = useState(24);
  const [missionTheme, setMissionTheme] = useState('FUTURISTA');
  const [missionFinalBoss, setMissionFinalBoss] = useState('');
  const [isGeneratingMission, setIsGeneratingMission] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [customProfessionName, setCustomProfessionName] = useState('');
  const [customProfessionDesc, setCustomProfessionDesc] = useState('');

  const professions = [
    { name: 'PALADINO MÍSTICO', theme: 'FANTASIA ÉPICA', desc: 'Guerreiro sagrado que protege os ideais da comunidade com escudos de energia astral e justiça implacável.' },
    { name: 'MERCANTE DE RELÍQUIAS', theme: 'COMÉRCIO', desc: 'Mestre das trocas. Consegue negociar itens raros, avaliar tesouros e encontrar oportunidades onde outros veem lixo.' },
    { name: 'HACKER DE REALIDADE', theme: 'CYBERPUNK', desc: 'Especialista em manipular as regras do sistema. Pode alterar mensagens, esconder rastros e infiltrar sub-setores.' },
    { name: 'DRUIDA URBANO', theme: 'ECOLÓGICO', desc: 'Guardião do equilíbrio entre o concreto e a natureza. Usa flora modificada para curar e vigiar os setores da Voidy.' },
    { name: 'DETETIVE DE ALMAS', theme: 'NOIR SOBRENATURAL', desc: 'Investigador de mistérios que desafiam a lógica. Especialista em encontrar usuários desaparecidos e segredos ocultos.' },
    { name: 'ENGENHEIRO DE SONHOS', theme: 'SURREALISTA', desc: 'Criador de arquiteturas impossíveis. Constrói espaços mentais e ferramentas que desafiam a própria física da comunidade.' }
  ];

  const handleSelectProfession = (name: string) => {
    const membersData = community.membersData || {};
    const myData = membersData[userName] || {
      userId: userName,
      cityLevel: 1,
      cityReputation: 0,
      cityRank: 'CIDADÃO',
      joinDate: Date.now()
    };

    onUpdate(prev => ({
      ...prev,
      membersData: {
        ...prev.membersData,
        [userName]: {
          ...myData,
          rpgJob: name
        }
      }
    }));

    addNotification({
      type: 'SYSTEM',
      title: 'HISTÓRIA INICIADA',
      content: `Sua jornada como ${name} começou na comunidade ${community.name}.`,
      sender: 'SISTEMA'
    });
    
    // Clear stack to go back to RPG Main
    setViewStack(['MAIN']);
  };

  const handleCreateCustomProfession = () => {
    if (!customProfessionName.trim() || !customProfessionDesc.trim()) return alert("Preencha o nome e a descrição.");
    
    handleSelectProfession(customProfessionName.toUpperCase());

    addNotification({
      type: 'SYSTEM',
      title: 'PROFISSÃO SUBMETIDA',
      content: `Sua profissão "${customProfessionName}" foi criada e poderá ser reconhecida globalmente pelos líderes.`,
      sender: 'SISTEMA'
    });
  };

  const redeemableMissions = useMemo(() => {
    if (!community.rpgMissions) return [];
    return community.rpgMissions.filter(mission => {
      if (!mission.deadline || Date.now() <= mission.deadline) return false;
      
      const channel = community.channels?.find(c => c.id === mission.chatId);
      if (!channel || !channel.rpgData) return false;
      
      const missionState = channel.rpgData.missionState;
      if (!missionState) return false;
      
      const playerState = channel.rpgData.playerStates?.[userName];
      const groupId = playerState?.groupId || userName;
      
      const hasWon = missionState.group_boss_vencidos?.[groupId] === true;
      const alreadyRedeemed = localStorage.getItem(`redeemed_${userName}_${mission.id}`) === 'true';
      
      return hasWon && !alreadyRedeemed;
    });
  }, [community.rpgMissions, community.channels, userName]);

  const handleRedeemReward = (mission: RpgMission) => {
    const goldReward = mission.reward || 1000;
    
    // Add to profile voidyCoins
    onProfileUpdate(
      userName, 
      userAvatar, 
      undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 
      (userProfile?.voidyCoins || 0) + goldReward
    );

    // Add to RPG character wallet and voidyCoins
    if (onUpdateCharacter) {
      onUpdateCharacter({
        wallet: (character?.wallet || 0) + goldReward,
        voidyCoins: (userProfile?.voidyCoins || 0) + goldReward
      });
    }

    // Mark as redeemed
    localStorage.setItem(`redeemed_${userName}_${mission.id}`, 'true');
    
    addNotification({
      type: 'SYSTEM',
      title: 'RECOMPENSA RESGATADA',
      content: `Você resgatou ${goldReward} G pela conclusão da missão: ${mission.title}`,
      sender: 'SISTEMA'
    });

    if (redeemableMissions.length <= 1) setShowRewardModal(false);
  };

  const handleCollectSalary = () => {
    const lastCollection = localStorage.getItem(`last_salary_collection_${userName}_${community.id}`);
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;

    if (lastCollection && now - parseInt(lastCollection) < oneWeek) {
      const remaining = oneWeek - (now - parseInt(lastCollection));
      const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
      const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      alert(`Você já coletou seu salário. Próxima coleta em ${days}d ${hours}h ${minutes}m.`);
      return;
    }

    const job = community.membersData?.[userName]?.rpgJob || 'EXPLORADOR';
    let salary = job.toUpperCase() === 'MERCADOR' ? 1000 : 200;

    // "Podendo aumentar caso o usuário venda algum item que ele obtiver"
    const salesBonus = parseInt(localStorage.getItem(`sales_bonus_${userName}_${community.id}`) || '0');
    salary += salesBonus;

    // Update profile and character
    onProfileUpdate(
      userName, 
      userAvatar, 
      undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 
      (userProfile?.voidyCoins || 0) + salary
    );

    if (onUpdateCharacter) {
      onUpdateCharacter({
        wallet: (character?.wallet || 0) + salary,
        voidyCoins: (userProfile?.voidyCoins || 0) + salary
      });
    }

    localStorage.setItem(`last_salary_collection_${userName}_${community.id}`, now.toString());
    localStorage.setItem(`sales_bonus_${userName}_${community.id}`, '0');

    addNotification({
      type: 'SYSTEM',
      title: 'SALÁRIO RECEBIDO',
      content: `Você recebeu seu salário semanal de ${salary} G como ${job}.${salesBonus > 0 ? ` (Incluindo ${salesBonus} G de bônus por vendas)` : ''}`,
      sender: 'SISTEMA'
    });
  };

  const handleGenerateMissionAI = async () => {
    if (!missionName) return alert("Insira um nome para a missão primeiro.");
    setIsGeneratingMission(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: MODEL_TEXT,
        contents: `Gere uma história detalhada de aproximadamente 20 linhas para uma missão de RPG com o tema "${missionTheme}" chamada "${missionName}". Explique a história por trás da missão, o que deve ser feito passo a passo e mencione o chefe final. Inclua também uma recompensa sugerida (número), um local e um tipo de missão (ex: EXPLORAÇÃO, COMBATE, INFILTRAÇÃO). Retorne em JSON.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING, description: "História detalhada de 20 linhas" },
              reward: { type: Type.NUMBER },
              location: { type: Type.STRING },
              type: { type: Type.STRING },
              boss: { type: Type.STRING }
            },
            required: ["description", "reward", "location", "type", "boss"]
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      if (data.description) setMissionDescription(data.description);
      if (data.reward) setMissionReward(data.reward);
      if (data.location) setMissionLocation(data.location);
      if (data.type) setMissionType(data.type);
      if (data.boss) setMissionFinalBoss(data.boss);
    } catch (error) {
      console.error("AI Generation failed:", error);
      alert("Falha ao gerar missão com IA.");
    } finally {
      setIsGeneratingMission(false);
    }
  };

  const generateNpcIntro = (mission: RpgMission, npc: Npc) => {
    return `Olá pessoal! Eu sou o ${npc.name} (${npc.role}) e vou guiar vocês na missão ${mission.title}.

Aqui está o que sabemos:
📍 LOCAL: ${mission.location}
🎭 TEMA: ${mission.theme}
⚔️ TIPO: ${mission.type}
💰 RECOMPENSA: ${mission.reward} G
💀 CHEFE FINAL: ${mission.finalBoss || 'DESCONHECIDO'}

HISTÓRIA E OBJETIVOS:
${mission.description}

O tempo está correndo! Preparem seus equipamentos. A Voidy conta com vocês. Boa sorte!`;
  };

  const handleCreateMission = () => {
    if (!missionName || !missionDescription || !missionLocation) return alert("Preencha todos os campos.");
    
    const missionId = `mission-${Date.now()}`;
    const channelId = `channel-mission-${Date.now()}`;

    const npc: Npc = {
        id: 'npc-auto-guide',
        name: 'OPERADOR DE MISSÃO',
        role: 'COORDENADOR',
        avatar: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Operator&backgroundColor=0a0c1a'
    };

    const missionData: RpgMission = {
      id: missionId,
      title: missionName.toUpperCase(),
      reward: missionReward,
      location: missionLocation.toUpperCase(),
      type: missionType.toUpperCase(),
      description: missionDescription,
      creator: userName,
      createdAt: Date.now(),
      deadline: Date.now() + (missionDuration * 60 * 60 * 1000),
      isMain: false,
      theme: missionTheme,
      status: 'PUBLISHED',
      duration: missionDuration,
      chatId: channelId,
      npcs: [npc],
      finalBoss: missionFinalBoss.toUpperCase()
    };

    const initialMessages: Message[] = [{
        id: `msg-npc-${Date.now()}`,
        role: 'user',
        text: generateNpcIntro(missionData, npc),
        timestamp: Date.now(),
        personaName: npc.name,
        personaAvatar: npc.avatar
    }];

    const newChannel: CommunityChannel = {
        id: channelId,
        name: `MISSÃO: ${missionName.toUpperCase()}`,
        type: 'RPG',
        messages: initialMessages,
        description: missionDescription,
        isPrivate: false,
        rpgData: { missionId: missionId },
        admins: [userName]
    };

    onUpdate(prev => ({
      ...prev,
      rpgMissions: [missionData, ...(prev.rpgMissions || [])],
      channels: [newChannel, ...(prev.channels || [])]
    }));

    onStartChat?.('RPG', newChannel.name, undefined, undefined, newChannel.id, newChannel.rpgData, initialMessages);
    popView();
    // Reset form
    setMissionName('');
    setMissionReward(100);
    setMissionLocation('');
    setMissionType('EXPLORAÇÃO');
    setMissionDescription('');
    setMissionDuration(24);
    setMissionTheme('FUTURISTA');
    setMissionFinalBoss('');
  };

  const handleLaunchMission = (mission: RpgMission) => {
    onUpdate(prev => {
        const updatedMissions = prev.rpgMissions?.map(m => {
            if (m.id === mission.id) {
                return { ...m, status: 'PUBLISHED' };
            }
            return m;
        });

        const updatedChannels = prev.channels?.map(c => {
            if (c.id === mission.chatId) {
                return { ...c, isPrivate: false };
            }
            return c;
        });

        return { ...prev, rpgMissions: updatedMissions, channels: updatedChannels };
    });

    // Universal Notification
    const members = Object.keys(community.membersData || {});
    members.forEach(memberId => {
        if (memberId !== userName) {
            addNotification({
                id: `notif-mission-${Date.now()}-${memberId}`,
                type: 'SYSTEM',
                title: 'NOVA MISSÃO DISPONÍVEL',
                content: `Uma nova missão foi lançada na comunidade ${community.name}: ${mission.title}`,
                read: false,
                timestamp: Date.now(),
                sender: 'SISTEMA',
                targetSessionId: mission.chatId
            });
        }
    });
  };

  const handleEnterMission = (mission: RpgMission) => {
    // If it's published and timer hasn't started, start it
    if (mission.status === 'PUBLISHED' && !mission.deadline) {
        const deadline = Date.now() + (mission.duration || 24) * 60 * 60 * 1000;
        
        onUpdate(prev => ({
            ...prev,
            rpgMissions: prev.rpgMissions?.map(m => 
                m.id === mission.id 
                ? { ...m, deadline } 
                : m
            )
        }));
    }
    
    // Open the chat
    const channel = community.channels?.find(c => c.id === mission.chatId);
    if (channel) {
        onStartChat?.('CLUSTER', channel.name, channel.cover, channel.background, channel.id, channel.rpgData);
    }
  };

  const amILeader = useMemo(() => community.leaders.includes(userName), [community.leaders, userName]);
  const amICoLeader = useMemo(() => community.coLeaders.includes(userName), [community.coLeaders, userName]);
  const amIStaff = amILeader || amICoLeader;
  const isDarkMode = community.style?.backgroundColor !== '#ffffff';
  const headerTextContrast = getContrastColor(community.style?.headerBg, isDarkMode);
  const bottomBarTextContrast = getContrastColor(community.style?.bottomBarBg, isDarkMode);
  const baseBgColor = community.style?.backgroundColor || '#02040a';

  const [viewStack, setViewStack] = useState<SubView[]>(['MAIN']);
  const currentView = viewStack[viewStack.length - 1];
  const pushView = (view: SubView) => setViewStack(prev => [...prev, view]);
  const popView = () => setViewStack(prev => prev.slice(0, -1));
  
  const handleViewMember = (authorName: string) => {
    const memberId = Object.keys(community.membersData || {}).find(id => 
      (community.membersData?.[id].personaName || id) === authorName
    ) || authorName;
    
    setViewedMemberId(memberId);
    pushView('COMMUNITY_PROFILE');
  };

  const handleDeletePost = (postId: string) => {
    if (window.confirm("Deseja purgar este registro permanentemente?")) {
      onUpdate(prev => ({ ...prev, posts: prev.posts.filter(p => p.id !== postId) }));
      setActivePostMenuId(null);
    }
  };

  const handleToggleFeature = (post: FeedPost) => {
    onUpdate(prev => ({ ...prev, posts: prev.posts.map(p => p.id === post.id ? { ...p, isFeatured: !p.isFeatured } : p) }));
    setActivePostMenuId(null);
  };

  const renderMarketHub = () => {
    const marketItems = [
      { id: '1', name: 'FRAGMENTO DE ESTRELA', price: 500, rarity: 'RARO', icon: '💎', seller: 'MERCADOR.V' },
      { id: '2', name: 'INJETOR DE ADRENALINA', price: 120, rarity: 'COMUM', icon: '💉', seller: 'DOC.PAIN' },
      { id: '3', name: 'CHIP DE ACESSO NV.2', price: 2500, rarity: 'EPICO', icon: '💾', seller: 'CYBER.GHOST' },
      { id: '4', name: 'RIFLE GAUSS', price: 4000, rarity: 'LENDARIO', icon: '🔫', seller: 'ARSENAL.CO' }
    ];

    return (
      <div className="absolute inset-0 z-[1000] bg-[#02040a] flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden font-inter text-white">
        <header className="px-6 py-10 flex items-center gap-6 bg-black/20 backdrop-blur-xl shrink-0 z-50">
          <button onClick={popView} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full text-slate-400 active:scale-90 transition-all border border-white/5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M15 19l-7-7 7-7"/></svg>
          </button>
          <h2 className="text-[11px] font-syncopate font-black text-[#f97316] uppercase tracking-[0.4em]">HUB DE MERCADO</h2>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-10 no-scrollbar pb-32">
          <div className="w-full p-6 rounded-[1.5rem] bg-[#1a120b] border border-[#f97316]/20 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#f97316]/5 border border-[#f97316]/10 flex items-center justify-center shrink-0">
               <span className="text-xl opacity-60">💼</span>
            </div>
            <p className="text-[9px] font-black text-[#f97316] uppercase leading-relaxed tracking-wider">
              Apenas operativos da raça <span className="underline decoration-1 underline-offset-2">MERCANTE</span> possuem privilégios de abertura de loja neste setor.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {marketItems.map(item => (
              <div key={item.id} className={`p-5 rounded-[2.2rem] border bg-[#050714] flex flex-col gap-6 shadow-2xl transition-all active:scale-[0.98] ${MARKET_RARITY_STYLES[item.rarity].split(' ')[0]}`}>
                <div className="aspect-square rounded-[2rem] bg-black/40 border border-white/5 flex items-center justify-center relative overflow-hidden shadow-inner">
                  <span className="text-4xl drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">{item.icon}</span>
                  <div className={`absolute top-4 right-4 px-2.5 py-0.5 rounded-full bg-black/60 text-[6px] font-black uppercase tracking-widest border border-white/5 ${MARKET_RARITY_STYLES[item.rarity].split(' ')[1]}`}>
                    {item.rarity}
                  </div>
                </div>
                <div className="space-y-1.5 px-1">
                  <h4 className="text-[9px] font-black text-white uppercase tracking-tighter truncate leading-tight">{item.name}</h4>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[9px] font-black text-[#f97316] tracking-tighter">{item.price} G</span>
                    <span className="text-[5px] font-black text-slate-700 uppercase tracking-widest">{item.seller}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  };

  const renderRpgTab = () => {
    const missions = community.rpgMissions || [];
    const hasJob = community.membersData?.[userName]?.rpgJob;

    if (!hasJob) {
      return (
        <div key="Recrutamento RPG" className="w-full h-full flex flex-col items-center justify-center p-8 space-y-12 animate-in fade-in duration-1000">
          <div className="relative">
             <div className="absolute inset-0 bg-white/5 blur-[80px] opacity-40"></div>
             <div className="relative text-center space-y-6">
                <div className="flex justify-center gap-1">
                   <div className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-ping"></div>
                   <div className="w-1.5 h-1.5 bg-[#22c55e] rounded-full opacity-50"></div>
                </div>
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-tight drop-shadow-2xl">
                  Sua Identidade <br/> Aguarda
                </h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">O sistema RPG está online</p>
             </div>
          </div>

          <button 
            onClick={() => pushView('PROFESSION_SELECTION')}
            className="group relative px-14 py-6 bg-transparent border-[3px] border-[#22c55e] text-[#22c55e] font-black text-[10px] uppercase tracking-[0.5em] rounded-2xl overflow-hidden transition-all hover:bg-[#22c55e] hover:text-black hover:shadow-[0_0_40px_rgba(34,197,94,0.4)] active:scale-95"
          >
            <span className="relative z-10">Comece sua história</span>
            <div className="absolute inset-0 bg-[#22c55e] scale-x-0 group-hover:scale-x-100 transition-transform origin-center duration-500"></div>
          </button>

          <div className="flex flex-col items-center gap-4 max-w-[280px]">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest text-center leading-relaxed opacity-60">
              Escolha um papel fundamental ou forje seu próprio caminho único neste setor.
            </p>
            <div className="w-12 h-[1px] bg-white/10"></div>
          </div>
        </div>
      );
    }
    
    return (
      <div key="Sistema RPG" className="w-full h-full flex-shrink-0 overflow-y-auto no-scrollbar p-6 space-y-12 pb-40">
        <div className="flex flex-col items-center gap-4 pt-6">
          <button 
            onClick={() => pushView('MARKET_FULL_VIEW')}
            className="w-56 py-4 bg-[#f97316] text-black rounded-full font-black text-xs uppercase tracking-[0.4em] shadow-[0_15px_35px_rgba(249,115,22,0.25)] active:scale-95 transition-all"
          >
            MERCADO
          </button>
          
          {amIStaff && (
            <button 
              onClick={() => pushView('MISSION_CREATION')}
              className="w-56 py-4 bg-white text-black rounded-full font-black text-xs uppercase tracking-[0.4em] shadow-[0_15px_35px_rgba(255,255,255,0.15)] active:scale-95 transition-all"
            >
              CRIAR MISSÃO
            </button>
          )}
        </div>

        <section className="space-y-8">
          <div className="flex items-center justify-center gap-6 opacity-30">
            <div className="h-[1px] w-12 bg-slate-500"></div>
            <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.5em]">MISSÕES VOIDY</h3>
            <div className="h-[1px] w-12 bg-slate-500"></div>
          </div>

          <div className="flex gap-5 overflow-x-auto no-scrollbar pb-6 px-2 snap-x">
            {missions.length === 0 ? (
              <div className="w-full flex flex-col items-center justify-center py-10 opacity-20">
                <span className="text-4xl mb-4">🎯</span>
                <p className="text-[9px] font-black uppercase tracking-widest text-white">Nenhuma missão ativa</p>
              </div>
            ) : (
              missions.map((mission) => {
                const isExpired = mission.deadline && Date.now() > mission.deadline;
                const timeLeft = mission.deadline ? Math.max(0, mission.deadline - Date.now()) : null;
                const hoursLeft = timeLeft ? Math.floor(timeLeft / (1000 * 60 * 60)) : null;
                const minutesLeft = timeLeft ? Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)) : null;

                // Hide drafts from non-staff
                if (mission.status === 'DRAFT' && !amIStaff) return null;

                return (
                  <div key={mission.id} className={`min-w-[300px] p-6 rounded-[2rem] bg-[#0a0c1a]/60 border-2 ${mission.isMain ? 'border-[#f59e0b] shadow-[0_0_40px_rgba(245,158,11,0.1)]' : 'border-white/10'} ${mission.status === 'DRAFT' ? 'opacity-60 border-dashed' : ''} relative snap-center group overflow-hidden`}>
                    {mission.isMain && (
                      <div className="absolute -top-3 left-6 px-4 py-1.5 bg-[#f59e0b] rounded-lg text-[8px] font-black text-black uppercase tracking-[0.2em] shadow-lg">PRINCIPAL</div>
                    )}
                    
                    {mission.status === 'DRAFT' && (
                      <div className="absolute -top-3 right-6 px-4 py-1.5 bg-slate-500 rounded-lg text-[8px] font-black text-white uppercase tracking-[0.2em] shadow-lg">RASCUNHO</div>
                    )}

                    {mission.deadline && mission.status === 'PUBLISHED' && (
                      <div className="absolute top-4 right-6 flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${isExpired ? 'bg-red-500' : 'bg-cyan-400 animate-pulse'}`}></div>
                        <span className={`text-[7px] font-black uppercase tracking-widest ${isExpired ? 'text-red-500' : 'text-cyan-400'}`}>
                          {isExpired ? 'EXPIRADA' : `${hoursLeft}H ${minutesLeft}M`}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-[1.2rem] bg-black/40 border border-white/10 flex items-center justify-center text-3xl shadow-inner">
                        <span className={mission.isMain ? "animate-pulse" : ""}>{mission.imageUrl || '🎯'}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                           <h4 className="text-[13px] font-black text-white uppercase tracking-[0.1em] truncate w-32">{mission.title}</h4>
                           {mission.theme && (
                              <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[5px] font-black text-slate-500 uppercase tracking-widest">
                                 {mission.theme}
                              </span>
                           )}
                        </div>
                        <p className={`text-[8px] font-black ${mission.isMain ? 'text-[#f59e0b]' : 'text-slate-400'} uppercase tracking-widest opacity-80`}>
                          {mission.location} • {mission.reward} G
                        </p>
                      </div>
                    </div>
                    
                    <p className="mt-4 text-[9px] font-medium text-slate-400 line-clamp-2 leading-relaxed uppercase tracking-widest">
                      {mission.description}
                    </p>

                    <div className="mt-6 flex justify-between items-center gap-2">
                      <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">TIPO: {mission.type}</span>
                      
                      <div className="flex gap-2">
                        {mission.status === 'DRAFT' && amIStaff && (
                          <button 
                            onClick={() => handleLaunchMission(mission)}
                            className="px-4 py-2 bg-cyan-500 text-black rounded-xl text-[8px] font-black uppercase tracking-widest transition-all active:scale-95"
                          >
                            LANÇAR
                          </button>
                        )}
                        
                        <button 
                          onClick={() => handleEnterMission(mission)}
                          className={`px-4 py-2 ${mission.status === 'DRAFT' ? 'bg-white/10' : 'bg-[#f97316] text-black'} rounded-xl text-[8px] font-black uppercase tracking-widest transition-all active:scale-95`}
                        >
                          {mission.status === 'DRAFT' ? 'PREPARAR' : 'ENTRAR'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-7 md:p-10 relative overflow-hidden shadow-2xl">
           <div className="flex justify-between items-center relative z-10">
              <div className="space-y-1.5">
                 <span className="text-[8px] font-black text-[#f59e0b] uppercase tracking-[0.5em] opacity-80">STATUS OPERACIONAL</span>
                 <h4 
                   onClick={() => setShowRewardModal(true)}
                   className="text-base font-black text-white uppercase tracking-widest cursor-pointer hover:text-[#f59e0b] transition-colors"
                 >
                   {community.membersData?.[userName]?.rpgJob || 'EXPLORADOR'}
                 </h4>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Créditos: <span className="text-white font-black ml-1">{userProfile?.voidyCoins || 0} G</span></p>
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={handleCollectSalary}
                  className="px-6 py-3 bg-[#f59e0b] text-black rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-[0_10px_25px_rgba(245,158,11,0.2)]"
                >
                  COLETAR RENDA
                </button>
                {redeemableMissions.length > 0 && (
                  <button 
                    onClick={() => setShowRewardModal(true)}
                    className="px-6 py-2 bg-cyan-500 text-black rounded-xl font-black text-[8px] uppercase tracking-widest animate-pulse shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                  >
                    RESGATAR RECOMPENSA ({redeemableMissions.length})
                  </button>
                )}
              </div>
           </div>
        </section>

        {showRewardModal && (
          <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-[#0a0c1a] border border-white/10 rounded-[2.5rem] p-8 space-y-8 shadow-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-syncopate font-black text-cyan-400 uppercase tracking-widest">Recompensas Pendentes</h3>
                <button onClick={() => setShowRewardModal(false)} className="text-slate-500 hover:text-white transition-colors">✕</button>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
                {redeemableMissions.length === 0 ? (
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center py-10">Nenhuma recompensa disponível no momento.</p>
                ) : (
                  redeemableMissions.map(mission => (
                    <div key={mission.id} className="p-5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group hover:border-cyan-500/30 transition-all">
                      <div className="space-y-1">
                        <h4 className="text-[10px] font-black text-white uppercase tracking-widest">{mission.title}</h4>
                        <p className="text-[8px] font-bold text-cyan-400 uppercase tracking-widest">+{mission.reward} G</p>
                      </div>
                      <button 
                        onClick={() => handleRedeemReward(mission)}
                        className="px-4 py-2 bg-cyan-500 text-black rounded-xl font-black text-[8px] uppercase tracking-widest active:scale-95 transition-all"
                      >
                        RESGATAR
                      </button>
                    </div>
                  ))
                )}
              </div>

              <p className="text-[7px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed text-center">
                As recompensas são liberadas apenas após o encerramento oficial da missão para operativos que completaram os objetivos a tempo.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPublicacoesTab = () => {
    const allPosts = community.posts.filter(p => p.tag !== 'WIKI' && p.tag !== 'WIKI_ENTRADA' && p.tag !== 'ENQUETE');
    const featuredPosts = allPosts.filter(p => p.isFeatured);
    return (
      <div key="Publicações" className="w-full h-full flex-shrink-0 overflow-y-auto no-scrollbar p-6 space-y-8 pb-40">
        {featuredPosts.length > 0 && (
           <section className="space-y-4 animate-in fade-in duration-700">
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 px-1 snap-x">
                 {featuredPosts.map((post) => (
                    <div key={post.id} onClick={() => setSelectedPost(post)} className="min-w-[280px] h-[160px] rounded-[2rem] border border-cyan-500/30 bg-[#0a0c1a]/60 backdrop-blur-xl relative overflow-hidden group cursor-pointer snap-center shadow-xl transition-all active:scale-[0.98]">
                       {post.customBgImage && <img src={post.customBgImage} className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale-[0.5]" alt="bg" />}
                       <div className="absolute inset-0 bg-gradient-to-t from-[#02040a] via-transparent to-transparent" />
                       <div className="absolute inset-0 p-5 flex flex-col justify-end">
                          <h4 className="text-sm font-black text-white uppercase tracking-widest mb-1">{post.title || 'Sinal'}</h4>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleViewMember(post.author); }}
                            className="text-[7px] font-bold text-slate-300 uppercase hover:text-cyan-400 transition-colors text-left"
                          >
                            {post.author}
                          </button>
                       </div>
                    </div>
                 ))}
              </div>
           </section>
        )}
        <div className="grid grid-cols-1 gap-6 max-w-sm mx-auto">
          {allPosts.map((post) => (
            <div key={post.id} className="relative aspect-square rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl bg-white/[0.03]">
               {post.customBgImage && <img src={post.customBgImage} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="post-bg" />}
               <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent z-[1]" />
               <div onClick={() => setSelectedPost(post)} className="absolute inset-0 z-[2] cursor-pointer" />
               <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-between z-[5] pointer-events-none">
                  <div className="flex items-center justify-between w-full">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleViewMember(post.author); }}
                      className="text-[10px] font-black text-white/80 uppercase tracking-widest pointer-events-auto hover:text-cyan-400 transition-colors"
                    >
                      {post.author}
                    </button>
                    <div className="relative pointer-events-auto">
                      <button onClick={(e) => { e.stopPropagation(); setActivePostMenuId(activePostMenuId === post.id ? null : post.id); }} className="p-1 rounded-full text-white/60">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2 s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2 s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                      </button>
                      {activePostMenuId === post.id && (
                        <div className="absolute top-10 right-0 w-44 bg-[#0a0c1a]/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-[100] animate-in zoom-in-95">
                          {(post.author === userName || amIStaff) && (
                            <button onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id); }} className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-red-500/10 text-red-500"><span className="text-[9px] font-black uppercase">Apagar</span></button>
                          )}
                          {amIStaff && (
                            <button onClick={(e) => { e.stopPropagation(); handleToggleFeature(post); }} className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-white/5 text-white"><span className="text-[9px] font-black uppercase">{post.isFeatured ? 'Remover Destaque' : 'Destacar'}</span></button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <h3 className="text-lg md:text-xl font-black text-white uppercase leading-tight line-clamp-2">{post.title || post.content.substring(0, 30)}</h3>
               </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderEnquetesTab = () => {
    const pollPosts = community.posts.filter(p => p.tag === 'ENQUETE');
    return (
      <div key="Enquetes" className="w-full h-full flex-shrink-0 overflow-y-auto no-scrollbar p-6 space-y-6 pb-40">
        {pollPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-20">
            <span className="text-4xl mb-4">📊</span>
            <p className="text-[9px] font-black uppercase tracking-widest text-white">Nenhuma sonda ativa</p>
          </div>
        ) : (
          pollPosts.map(post => (
            <div key={post.id} onClick={() => setSelectedPost(post)} className="p-6 rounded-[2rem] bg-white/[0.03] border border-white/10 shadow-xl cursor-pointer hover:bg-white/[0.05] transition-all">
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-3">{post.title}</h3>
              <div className="space-y-2">
                {post.pollOptions?.slice(0, 2).map(opt => (
                  <div key={opt.id} className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500/50" style={{ width: '30%' }}></div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between items-center opacity-40">
                <span className="text-[7px] font-bold uppercase tracking-widest">{post.author}</span>
                <span className="text-[7px] font-black text-cyan-400">PARTICIPAR →</span>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  const renderChatsTab = () => {
    const channels = community.channels || [];
    return (
      <div key="Chats Públicos" className="w-full h-full flex-shrink-0 overflow-y-auto no-scrollbar p-6 pb-40">
        <div className="grid grid-cols-2 gap-4">
            {channels.filter(ch => !ch.isPrivate).map(channel => (
              <button key={channel.id} onClick={() => onStartChat?.('CLUSTER', channel.name, channel.cover, channel.background, channel.id, channel.rpgData)} className="relative w-full aspect-square rounded-[2rem] bg-white/[0.03] border border-white/10 overflow-hidden shadow-2xl group">
                <div className="absolute inset-0 z-0">
                  {channel.cover ? <img src={channel.cover} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="channel-cover" /> : <div className="w-full h-full bg-slate-900" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent" />
                </div>
                <div className="absolute inset-0 p-4 flex flex-col justify-end text-left z-10"><h4 className="text-[11px] font-black text-white uppercase tracking-widest truncate">{channel.name}</h4></div>
              </button>
            ))}
        </div>
      </div>
    );
  };

  if (currentView === 'BLOG_CREATION') return <BlogCreation onBack={popView} onCreate={(post) => { onUpdate(prev => ({ ...prev, posts: [post, ...prev.posts] })); onAddFeedPost?.(post); popView(); }} userName={userName} userAvatar={userAvatar} verifySafety={verifySafety} />;
  if (currentView === 'POLL_CREATION') return <PollCreation onBack={popView} onCreate={(post) => { onUpdate(prev => ({ ...prev, posts: [post, ...prev.posts] })); onAddFeedPost?.(post); popView(); }} userName={userName} userAvatar={userAvatar} verifySafety={verifySafety} />;
  if (currentView === 'WIKI_CREATION') return <WikiCreation onBack={popView} onCreate={(post) => { onUpdate(prev => ({ ...prev, posts: [post, ...prev.posts] })); onAddFeedPost?.(post); popView(); }} userName={userName} userAvatar={userAvatar} verifySafety={verifySafety} />;
  if (currentView === 'CHARACTER_WIKI_CREATION') return <WikiCreation onBack={popView} onCreate={(post) => { onUpdate(prev => ({ ...prev, posts: [post, ...prev.posts] })); onAddFeedPost?.(post); popView(); }} userName={userName} userAvatar={userAvatar} verifySafety={verifySafety} isCharacterSheet={true} />;
  if (currentView === 'CHAT_CREATION') return <ChatCreation onBack={popView} onCreate={(channel) => { 
    const systemMsg = {
      id: `sys-${Date.now()}`,
      role: 'model' as const,
      text: `${userName} criou o chat ${channel.name}`,
      timestamp: Date.now(),
      personaName: 'SISTEMA'
    };
    onUpdate(prev => ({ ...prev, channels: [channel, ...(prev.channels || [])] })); 
    onStartChat?.('CLUSTER', channel.name, channel.cover, channel.background, channel.id, channel.rpgData, [systemMsg]); 
  }} userName={userName} verifySafety={verifySafety} />;

  if (currentView === 'PROFESSION_SELECTION') {
    return (
      <div className="fixed inset-0 z-[1000] bg-[#02040a] flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden font-inter text-white">
        <header className="px-6 py-6 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between shrink-0">
          <button onClick={popView} className="p-2 bg-white/5 rounded-xl text-slate-400">✕</button>
          <h2 className="text-[10px] font-syncopate font-black uppercase tracking-widest text-[#22c55e]">Selecione seu Caminho</h2>
          <div className="w-10"></div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar pb-32">
          <div className="grid grid-cols-1 gap-4">
            {professions.map((prof) => (
              <button 
                key={prof.name}
                onClick={() => handleSelectProfession(prof.name)}
                className="w-full p-6 bg-white/[0.03] border border-white/10 rounded-[2rem] text-left transition-all hover:bg-white/[0.05] hover:border-[#22c55e]/30 group active:scale-[0.98]"
              >
                <div className="flex justify-between items-start mb-2">
                   <h3 className="text-xs font-black text-white uppercase tracking-widest group-hover:text-[#22c55e] transition-colors">{prof.name}</h3>
                   <span className="text-[6px] font-bold text-slate-600 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">{prof.theme}</span>
                </div>
                <p className="text-[9px] font-medium text-slate-400 leading-relaxed uppercase tracking-wider">{prof.desc}</p>
              </button>
            ))}
            
            <button 
              onClick={() => pushView('CUSTOM_PROFESSION_CREATION')}
              className="w-full p-6 bg-[#22c55e]/5 border border-[#22c55e]/20 rounded-[2rem] text-left transition-all hover:bg-[#22c55e]/10 group active:scale-[0.98]"
            >
              <div className="flex justify-between items-start mb-2">
                 <h3 className="text-xs font-black text-[#22c55e] uppercase tracking-widest">CRIAR MINHA PRÓPRIA</h3>
                 <span className="text-[6px] font-bold text-[#22c55e] uppercase tracking-widest bg-[#22c55e]/10 px-2 py-1 rounded-md">UNIVERAL</span>
              </div>
              <p className="text-[9px] font-medium text-[#22c55e]/60 leading-relaxed uppercase tracking-wider">
                Defina sua própria especialidade. Ela poderá ser reconhecida pelos líderes e lançada globalmente na Voidy.
              </p>
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (currentView === 'CUSTOM_PROFESSION_CREATION') {
    return (
      <div className="fixed inset-0 z-[1100] bg-[#02040a] flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden font-inter text-white">
        <header className="px-6 py-6 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between shrink-0">
          <button onClick={popView} className="p-2 bg-white/5 rounded-xl text-slate-400">✕</button>
          <h2 className="text-[10px] font-syncopate font-black uppercase tracking-widest text-[#22c55e]">Forjar Destino</h2>
          <div className="w-10"></div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto no-scrollbar">
          <div className="max-w-xl mx-auto space-y-10">
             <div className="space-y-4">
               <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">NOME DA PROFISSÃO</label>
               <input 
                 value={customProfessionName}
                 onChange={(e) => setCustomProfessionName(e.target.value)}
                 placeholder="EX: GUARDIÃO DAS SOMBRAS"
                 className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-[#22c55e]/50 transition-all uppercase"
               />
             </div>

             <div className="space-y-4">
               <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">DESCRIÇÃO E PAPEL</label>
               <textarea 
                 value={customProfessionDesc}
                 onChange={(e) => setCustomProfessionDesc(e.target.value)}
                 placeholder="DESCREVA O QUE SUA PROFISSÃO FAZ E QUAL SEU IMPACTO NO MUNDO..."
                 className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-6 py-6 text-xs font-bold outline-none focus:border-[#22c55e]/50 transition-all min-h-[150px] resize-none uppercase"
               />
             </div>

             <button 
               onClick={handleCreateCustomProfession}
               className="w-full py-6 bg-[#22c55e] text-black rounded-3xl font-black uppercase text-[11px] tracking-[0.4em] shadow-[0_15px_35px_rgba(34,197,94,0.3)] active:scale-95 transition-all"
             >
               Confirmar Profissão
             </button>

             <p className="text-[7px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed text-center italic">
               * Profissões customizadas entram em um registro especial acessível pelos líderes da comunidade.
             </p>
          </div>
        </main>
      </div>
    );
  }

  if (currentView === 'RANKING') return <CommunityRanking community={community} onBack={popView} />;
  if (currentView === 'LEADER_PANEL') return <CommunityLeaderPanel community={community} onBack={popView} onUpdate={onUpdate} />;
  if (currentView === 'SETTINGS') return <CommunitySettings community={community} onBack={popView} onUpdate={onUpdate} userName={userName} onLeave={() => { onDelete?.(community.id); onBack(); }} />;
  if (currentView === 'COMMUNITY_MEMBERS') return (
    <CommunityMembersView 
      community={community} 
      onBack={popView} 
      onViewProfile={(profile) => {
        // Find the member ID from the profile name or assume it's the ID
        // In CommunityMembersView, profile.name is personaName || userId
        // We need a better way to get the userId.
        // For now, let's try to find it in membersData
        const memberId = Object.keys(community.membersData || {}).find(id => 
          (community.membersData?.[id].personaName || id) === profile.name
        ) || profile.name;
        
        setViewedMemberId(memberId);
        pushView('COMMUNITY_PROFILE');
      }} 
    />
  );
  
  if (currentView === 'MARKET_FULL_VIEW') return renderMarketHub();

  if (currentView === 'MISSION_CREATION') {
      return (
        <div className="fixed inset-0 z-[1000] bg-[#02040a] flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden font-inter text-white">
           <header className="px-6 py-6 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between">
              <button onClick={popView} className="p-2 bg-white/5 rounded-xl text-slate-400">✕</button>
              <h2 className="text-xs font-syncopate font-black uppercase tracking-widest text-cyan-400">Criar Missão</h2>
              <div className="w-10"></div>
           </header>
           <main className="flex-1 p-8 overflow-y-auto no-scrollbar">
              <div className="max-w-xl mx-auto space-y-8">
                 <div className="space-y-4">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">NOME DA MISSÃO</label>
                    <div className="flex gap-2">
                       <input 
                          value={missionName}
                          onChange={(e) => setMissionName(e.target.value)}
                          placeholder="EX: INTERCEPTAÇÃO ALPHA"
                          className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-cyan-500/50 transition-all uppercase"
                       />
                       <button 
                          onClick={handleGenerateMissionAI}
                          disabled={isGeneratingMission}
                          className="px-6 bg-cyan-500 text-black rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
                       >
                          {isGeneratingMission ? '...' : 'IA'}
                       </button>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                       <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">RECOMPENSA (G)</label>
                       <input 
                          type="number"
                          value={missionReward}
                          onChange={(e) => setMissionReward(Number(e.target.value))}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-cyan-500/50 transition-all"
                       />
                    </div>
                    <div className="space-y-4">
                       <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">DURAÇÃO (HORAS - MÁX 72H)</label>
                       <input 
                          type="number"
                          max={72}
                          min={1}
                          value={missionDuration}
                          onChange={(e) => setMissionDuration(Math.min(72, Number(e.target.value)))}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-cyan-500/50 transition-all"
                       />
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">LOCALIZAÇÃO</label>
                    <input 
                       value={missionLocation}
                       onChange={(e) => setMissionLocation(e.target.value)}
                       placeholder="EX: SETOR DE DADOS 4"
                       className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-cyan-500/50 transition-all uppercase"
                    />
                 </div>

                 <div className="space-y-4">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">TEMA DA MISSÃO</label>
                    <select 
                       value={missionTheme}
                       onChange={(e) => setMissionTheme(e.target.value)}
                       className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-cyan-500/50 transition-all uppercase appearance-none"
                    >
                       <option value="FUTURISTA">FUTURISTA</option>
                       <option value="MEDIEVAL">MEDIEVAL</option>
                       <option value="TERROR">TERROR</option>
                       <option value="ROMANCE">ROMANCE</option>
                       <option value="FANTASIA">FANTASIA</option>
                       <option value="CYBERPUNK">CYBERPUNK</option>
                       <option value="MISTÉRIO">MISTÉRIO</option>
                    </select>
                 </div>

                 <div className="space-y-4">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">TIPO DE MISSÃO</label>
                    <select 
                       value={missionType}
                       onChange={(e) => setMissionType(e.target.value)}
                       className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-cyan-500/50 transition-all uppercase appearance-none"
                    >
                       <option value="EXPLORAÇÃO">EXPLORAÇÃO</option>
                       <option value="COMBATE">COMBATE</option>
                       <option value="INFILTRAÇÃO">INFILTRAÇÃO</option>
                       <option value="RESGATE">RESGATE</option>
                       <option value="SABOTAGEM">SABOTAGEM</option>
                    </select>
                 </div>

                 <div className="space-y-4">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">CHEFE FINAL (BOSS)</label>
                    <input 
                       value={missionFinalBoss}
                       onChange={(e) => setMissionFinalBoss(e.target.value)}
                       placeholder="EX: O OBSERVADOR DO VÁCUO"
                       className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-cyan-500/50 transition-all uppercase"
                    />
                 </div>

                 <div className="space-y-4">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">DESCRIÇÃO DOS OBJETIVOS</label>
                    <textarea 
                       value={missionDescription}
                       onChange={(e) => setMissionDescription(e.target.value)}
                       placeholder="DESCREVA OS DETALHES DA MISSÃO..."
                       className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-6 py-6 text-xs font-bold outline-none focus:border-cyan-500/50 transition-all min-h-[150px] resize-none uppercase"
                    />
                 </div>

                 <button 
                    onClick={handleCreateMission}
                    className="w-full py-6 bg-white text-black rounded-3xl font-black uppercase text-[11px] tracking-[0.4em] shadow-2xl active:scale-95 transition-all mt-8"
                 >
                    ESTABELECER CONEXÃO
                 </button>
              </div>
           </main>
        </div>
      );
  }

  if (currentView === 'SELL_CREATION') {
      return <SellCreation userName={userName} onBack={popView} onCreate={(item) => { 
          onUpdate(prev => ({ ...prev, rpgMarket: [item, ...(prev.rpgMarket || [])] })); 
          popView(); 
          if(navigator.vibrate) navigator.vibrate([10, 50, 10]);
      }} verifySafety={verifySafety} />;
  }

  if (currentView === 'COMMUNITY_PROFILE') {
    const targetId = viewedMemberId || userName;
    let member = community.membersData?.[targetId] || { 
      userId: targetId, 
      cityLevel: 1, 
      cityReputation: 0, 
      cityRank: 'RECRUTA', 
      joinDate: Date.now() 
    };

    // Sync current user data if it's their profile
    if (targetId === userName) {
      member = {
        ...member,
        voidyCoins: userProfile?.voidyCoins || 0,
        wallet: character?.wallet || 0
      };
    }

    return (
      <CommunityProfileView
        member={member}
        community={community}
        currentUserId={userName}
        currentUserAvatar={userAvatar}
        onBack={() => {
          setViewedMemberId(null);
          popView();
        }}
        onUpdate={(updater) => {
          onUpdate(prev => ({
            ...prev,
            membersData: {
              ...(prev.membersData || {}),
              [targetId]: updater(prev.membersData?.[targetId] || member)
            }
          }));
        }}
        verifySafety={verifySafety}
        addNotification={addNotification}
        onAddFeedPost={onAddFeedPost}
      />
    );
  }

  return (
    <div className="absolute inset-0 z-[150] flex flex-col overflow-hidden animate-in slide-in-from-left duration-75 font-inter touch-pan-y" style={{ backgroundColor: baseBgColor }}>
      <CommunitySidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        community={community} 
        allCommunities={allCommunities} 
        onSelectCommunity={onSelectCommunity || (() => {})} 
        currentTab={TABS[activeTabIndex]} 
        onNavigate={(t) => setActiveTabIndex(TABS.indexOf(t))} 
        onExit={onBack} 
        userName={userName} 
        userAvatar={userAvatar} 
        onOpenSettings={() => pushView('SETTINGS')} 
        onOpenLeaderPanel={() => pushView('COMMUNITY_MEMBERS')} 
        onOpenRanking={() => pushView('RANKING')} 
        onOpenProfile={() => pushView('COMMUNITY_PROFILE')} 
        onOpenPrivateChats={onNavigateToPrivate}
        onOpenPublicSearch={onNavigateToPublicSearch}
        onOpenDrafts={onNavigateToDrafts}
        onOpenStore={onOpenStore}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="backdrop-blur-xl pt-6 md:pt-10 pb-1 px-3 md:px-4 flex flex-col gap-2 md:gap-4 shadow-xl shrink-0 z-20 relative overflow-hidden" style={{ backgroundColor: community.style?.headerBg || (isDarkMode ? 'rgba(2, 4, 10, 0.95)' : 'rgba(255, 255, 255, 1)') }}>
          <div className="flex items-center justify-between relative z-10">
            <button onClick={() => setIsSidebarOpen(true)} className={`p-1.5 md:p-2 active:scale-90 transition-all ${headerTextContrast}`}><svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16" /></svg></button>
            <button onClick={() => onShowBio?.(community)} className="flex-1 overflow-hidden text-center mx-2 active:scale-95 transition-transform cursor-pointer">
              <h1 className={`font-black text-[10px] md:text-sm uppercase tracking-widest truncate ${headerTextContrast}`}>{community.name}</h1>
            </button>
            <button onClick={onOpenNotifications} className={`p-1.5 md:p-2 ${headerTextContrast}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg></button>
          </div>
          <div className="flex items-end h-7 md:h-10 overflow-x-auto no-scrollbar gap-4 md:gap-6 px-3 relative z-10">
            {TABS.map((tab, idx) => {
                const isActive = activeTabIndex === idx;
                return (
                    <button key={tab} onClick={() => setActiveTabIndex(idx)} className={`relative pb-1.5 px-0.5 text-[9px] md:text-[12px] font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0 ${isActive ? headerTextContrast : 'opacity-40'}`}>
                        {tab}
                        {isActive && <div className={`absolute bottom-0 left-0 w-full h-[2px] ${headerTextContrast.includes('text-white') ? 'bg-white' : 'bg-slate-950'} shadow-lg rounded-t-full`}></div>}
                    </button>
                );
            })}
          </div>
        </header>

        <main className="flex-1 flex flex-col bg-transparent overflow-hidden relative">
            {activeTabIndex === 0 && renderPublicacoesTab()}
            {activeTabIndex === 1 && renderEnquetesTab()}
            {activeTabIndex === 2 && renderChatsTab()}
            {activeTabIndex === 3 && renderRpgTab()}
        </main>

        <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 w-[85%] md:w-[90%] max-lg h-12 md:h-20 z-[200] flex items-center justify-around px-3 md:px-4 overflow-visible">
            <div className="absolute inset-0 rounded-full border border-black/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-0" style={{ backgroundColor: community.style?.bottomBarBg || (isDarkMode ? '#0a0c1a' : '#ffffff') }}></div>
            <button onClick={() => setIsSidebarOpen(true)} className={`relative z-10 p-1.5 active:scale-90 transition-all ${bottomBarTextContrast}`}><svg className="w-5 h-5 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button>
            <button onClick={() => setIsActionMenuOpen(true)} className="relative z-20 w-12 h-12 md:w-16 md:h-16 rounded-full bg-cyan-500 flex items-center justify-center text-white shadow-xl -mt-10 md:-mt-14 active:scale-90 transition-all border-[3px]" style={{ borderColor: isDarkMode ? '#02040a' : '#ffffff' }}><svg className="w-7 h-7 md:w-9 md:h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3.5"><path d="M12 4v16m8-8H4"/></svg></button>
            <div onClick={() => pushView('COMMUNITY_PROFILE')} className="relative z-10 p-0.5 rounded-full border-2 border-slate-300 w-8 h-8 md:w-11 md:h-11 shadow-sm shrink-0 cursor-pointer active:scale-95 transition-all"><img src={userAvatar} className="w-full h-full object-cover rounded-full" alt="avatar" /></div>
        </div>
      </div>

      {isActionMenuOpen && (
        <div className="fixed inset-0 z-[400] flex flex-col justify-end animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsActionMenuOpen(false)} />
           <div className="relative z-10 w-full max-xl mx-auto px-6 pb-32 animate-in slide-in-from-bottom duration-500">
              <div className="grid grid-cols-2 gap-y-8 gap-x-4">
                 {[
                   { id: 'blog', label: 'Criar Blog', icon: '📝', action: () => pushView('BLOG_CREATION') },
                   { id: 'poll', label: 'Criar Enquete', icon: '📊', action: () => pushView('POLL_CREATION') },
                   { id: 'wiki', label: 'Criar Wiki', icon: '📚', action: () => pushView('WIKI_CREATION') },
                   { id: 'character', label: 'Ficha RPG', icon: '👤', action: () => pushView('CHARACTER_WIKI_CREATION') },
                   { id: 'chat', label: 'Chat Público', icon: '💬', action: () => pushView('CHAT_CREATION') },
                   { id: 'nexus', label: 'Conversar com Nexus', icon: '🤖', action: () => onStartChat?.('IA', 'NEXUS', 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Nexus&backgroundColor=0a0c1a', undefined, 'nexus-default') },
                 ].map((action) => (
                   <button key={action.id} onClick={() => { action.action(); setIsActionMenuOpen(false); }} className="flex flex-col items-center gap-2">
                     <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-cyan-600 flex items-center justify-center text-2xl shadow-xl border-2 border-white/10">{action.icon}</div>
                     <span className="text-[8px] md:text-[10px] font-black text-white uppercase tracking-widest">{action.label}</span>
                   </button>
                 ))}
              </div>
           </div>
        </div>
      )}

      {selectedPost && (
        <div className="fixed inset-0 z-[2000] flex flex-col animate-in slide-in-from-bottom duration-500 font-inter text-white overflow-hidden" 
             style={{ 
               background: (selectedPost.tag === 'WIKI' || selectedPost.tag === 'WIKI_ENTRADA') 
                 ? `linear-gradient(to bottom, ${selectedPost.customTopColor || '#1a2036'} 0%, ${selectedPost.customBgColor || '#02040a'} 100%)`
                 : `linear-gradient(to bottom, ${selectedPost.customTopColor || '#1a2036'} 0%, ${selectedPost.customBgColor || '#02040a'} 100%)` 
             }}>
          {(selectedPost.tag === 'WIKI' || selectedPost.tag === 'WIKI_ENTRADA') && selectedPost.customBgImage && (
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
               <img 
                 src={selectedPost.customBgImage} 
                 className="absolute inset-0 w-full h-full object-cover opacity-80" 
                 style={{ filter: 'brightness(1.1)', imageRendering: 'high-quality' }} 
                 alt="bg" 
               />
               <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#02040a]" />
            </div>
          )}
          <header className={`relative z-10 px-6 ${(selectedPost.tag === 'WIKI' || selectedPost.tag === 'WIKI_ENTRADA') ? 'py-8' : 'py-6'} flex items-center justify-between shrink-0 bg-black/40 backdrop-blur-md border-b border-white/10 shadow-2xl`}>
             <button onClick={() => setSelectedPost(null)} className={`${(selectedPost.tag === 'WIKI' || selectedPost.tag === 'WIKI_ENTRADA') ? 'p-2.5' : 'p-2'} bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all active:scale-90 border border-white/5`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M15 19l-7-7 7-7"/></svg>
             </button>
             {!(selectedPost.tag === 'WIKI' || selectedPost.tag === 'WIKI_ENTRADA') && (
               <h2 className="text-xs font-black uppercase tracking-widest">{selectedPost.title || 'DETALHES'}</h2>
             )}
             <div className="w-10"></div>
          </header>
          <main className="relative z-10 flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
             {(selectedPost.tag === 'WIKI' || selectedPost.tag === 'WIKI_ENTRADA') ? (
               <div className="relative z-10 w-full animate-in fade-in duration-700 pb-40">
                  {/* Banner / Header Section */}
                  <div className="relative w-full h-48 md:h-64 overflow-hidden">
                     <SlideshowWallpaper 
                       images={selectedPost.galleryImages && selectedPost.galleryImages.length > 0 ? selectedPost.galleryImages : []} 
                       color={selectedPost.customTopColor || '#1a2036'} 
                       opacity={selectedPost.hideTopOverlay ? 1 : 0.95} 
                       filter="brightness(1.1)" 
                       noGradient={selectedPost.hideTopOverlay}
                     />
                     {!selectedPost.hideTopOverlay && <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-black/20" />}
                  </div>

                  <div className="max-w-2xl mx-auto px-6 -mt-12 relative z-20 space-y-4">
                     {/* Header: Avatar and Title left aligned */}
                     <div className="flex items-end gap-6">
                        {selectedPost.avatar && (
                          <div className="w-28 h-28 rounded-3xl border-4 overflow-hidden shadow-2xl shrink-0 bg-[#1a2036]" style={{ borderColor: (selectedPost.customBgColor === 'transparent' || !selectedPost.customBgColor) ? '#02040a' : selectedPost.customBgColor }}>
                            <img src={selectedPost.avatar} className="w-full h-full object-cover" alt="Wiki Avatar" />
                          </div>
                        )}
                        <div className="flex flex-col pb-2">
                           <h1 className="text-xl font-black uppercase tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                             {selectedPost.title || "SEM TÍTULO"}
                           </h1>
                        </div>
                     </div>

                     {/* Tags centered below title section */}
                     {selectedPost.customKeywords && (
                       <div className="flex justify-start pl-1 -mt-2">
                          <div className="opacity-60 text-[8px] font-black uppercase tracking-[0.3em] text-left bg-white/5 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
                             {selectedPost.customKeywords.split(',').map(tag => `#${tag.trim()}`).join(' ')}
                          </div>
                       </div>
                     )}

                     {/* Creator info and Narrative content */}
                     <div className="space-y-4 pt-6 border-t border-white/5">
                        {/* Technical Data Matrix */}
                        {selectedPost.customInfoRows && selectedPost.customInfoRows.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                             {selectedPost.customInfoRows.map((row, i) => row.label && row.value && (
                                <div key={i} className="bg-white/5 p-4 rounded-2xl flex flex-col gap-1 border border-white/10">
                                   <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">{row.label}</span>
                                   {row.type === 'rating_star' || row.type === 'rating_heart' ? (
                                       <div className="flex gap-1">
                                           {[1, 2, 3, 4, 5].map(v => (
                                               <span key={v} className={`${Number(row.value) >= v ? 'text-cyan-400' : 'text-white/10'}`}>
                                                   {row.type === 'rating_star' ? <StarIcon active={Number(row.value) >= v} className="w-3 h-3" /> : <HeartIcon active={Number(row.value) >= v} className="w-3 h-3" />}
                                               </span>
                                           ))}
                                       </div>
                                   ) : (
                                       <span className="text-xs font-medium text-white">{row.value}</span>
                                   )}
                                </div>
                             ))}
                          </div>
                        )}

                        <div className="text-[14px] font-medium leading-relaxed text-slate-200 px-1 font-inter" dangerouslySetInnerHTML={{ __html: formatBioText(getWikiNarrative(selectedPost.content), undefined, [...(selectedPost.customTopImages || []), ...(selectedPost.galleryImages || [])]) }} />

               {/* Wiki Top Images as Medium Cards (Imagens de +Adicionar) */}
               {selectedPost.customTopImages && selectedPost.customTopImages.length > 0 && (
                 <div className="flex gap-4 overflow-x-auto no-scrollbar w-full pt-4 pb-2">
                   {selectedPost.customTopImages.map((img, i) => (
                     <div key={i} className="aspect-video w-48 shrink-0 rounded-2xl border border-white/10 overflow-hidden bg-black/20 shadow-xl">
                       <img src={typeof img === 'string' ? img : (img as any).src} className="w-full h-full object-cover" alt={`Top Image ${i}`} />
                     </div>
                   ))}
                 </div>
               )}

                        <div className="flex flex-col items-start gap-3 pt-1">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full border border-white/20 overflow-hidden">
                                 <img src={selectedPost.avatar} className="w-full h-full object-cover" alt="Creator" />
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{selectedPost.author}</span>
                           </div>
                        </div>

                      </div>
                  </div>
               </div>
             ) : (
               <div className="max-w-xl mx-auto space-y-6 pb-20">
                  {selectedPost.customBgImage && <img src={selectedPost.customBgImage} className="w-full rounded-[2rem] border border-white/10 shadow-2xl" alt="post-bg" />}
                  <h1 className="text-2xl font-black uppercase tracking-tight">{selectedPost.title}</h1>
                  
                  <button 
                    onClick={() => handleViewMember(selectedPost.author)}
                    className="flex items-center gap-3 bg-white/[0.03] border border-white/5 px-4 py-3 rounded-2xl w-fit hover:bg-white/10 transition-all active:scale-95"
                  >
                     <div className="w-8 h-8 rounded-xl border border-white/10 overflow-hidden shrink-0">
                        <img src={selectedPost.avatar} className="w-full h-full object-cover" alt="Author" />
                     </div>
                     <div className="flex flex-col items-start">
                        <span className="text-[5px] font-black text-slate-600 uppercase tracking-widest">REGISTRADO POR</span>
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-wider">{selectedPost.author}</span>
                     </div>
                  </button>

                  <div className="text-sm leading-relaxed opacity-80 whitespace-pre-wrap">{selectedPost.content}</div>
               </div>
             )}
          </main>
        </div>
      )}
    </div>
  );
};

export default CommunityView;