
import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Community, CityMemberData, MuralPost, Notification, FeedPost } from '../types';
import { DragonO } from './Lobby';

interface CommunityProfileViewProps {
  member: CityMemberData & { customTags?: string[]; customTagColor?: string };
  community: Community;
  currentUserId: string;
  currentUserAvatar: string;
  onBack: () => void;
  onUpdate: (updater: (m: any) => any) => void;
  verifySafety?: (base64: string) => Promise<boolean>;
  addNotification: (notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  onAddFeedPost?: (post: FeedPost) => void;
}

const hexToHsla = (hex: string) => {
  if (!hex || hex === 'transparent') return { h: 0, s: 0, l: 0, a: 0 };
  let r = 0, g = 0, b = 0, a = 1;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16); g = parseInt(hex[2] + hex[2], 16); b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length >= 7) {
    r = parseInt(hex.substring(1, 3), 16); g = parseInt(hex.substring(3, 5), 16); b = parseInt(hex.substring(5, 7), 16);
    if (hex.length === 9) a = parseInt(hex.substring(7, 9), 16) / 255;
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100), a };
};

const hslaToHex = (h: number, s: number, l: number, a: number) => {
  if (a === 0) return 'transparent';
  l /= 100;
  const a_val = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a_val * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  const alpha = Math.round(a * 255).toString(16).padStart(2, '0');
  return `#${f(0)}${f(8)}${f(4)}${alpha === 'ff' ? '' : alpha}`;
};

const getAutoContrastHex = (hex: string) => {
  if (!hex || hex === 'transparent' || hex === '#00000000') return '#ffffff';
  const hsla = hexToHsla(hex);
  const isDarkBg = hsla.l < 55;
  const targetL = isDarkBg ? 92 : 12;
  const targetH = (hsla.h + 180) % 360;
  const targetS = hsla.s > 20 ? 40 : 10;
  return hslaToHex(targetH, targetS, targetL, 1);
};

const getContrastBase = (hex: string) => {
  if (!hex || hex.length < 7 || hex === 'transparent') return '255, 255, 255';
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155 ? '0, 0, 0' : '255, 255, 255';
};

const stripBioTags = (text: string | undefined | null) => {
  if (!text) return "";
  let clean = text.replace(/\[img_[a-z0-9]+[^\]]*\]/gi, "");
  clean = clean.replace(/\[\/?([cbisuBCISU]+)\]/gi, "");
  return clean.trim();
};

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
      if (t.includes('b')) res = `<strong class="font-black ${isOverlay ? 'text-[1.25em] inline-block' : ''}">${res}</strong>`;
      if (t.includes('u')) res = `<span class="underline">${res}</span>`;
      if (t.includes('s')) res = `<span class="line-through opacity-60">${res}</span>`;
      if (t.includes('c')) res = `<div style="text-align: center; width: 100%; display: block; margin: 2px 0;">${res}</div>`;
      return res;
    });
  } while (p !== oldP);
  return p;
};

const formatBioText = (text: string, customTextColor?: string, isViewMode = false) => {
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
      
      // Ajuste de largura para modo visualizar: aumentar largura e extremidades horizontais
      const baseWidth = finalWidth ? Number(finalWidth) : 100;
      const effectiveWidth = isViewMode && !width ? 112 : baseWidth;
      const customWidth = `${effectiveWidth}%`;
      const marginX = (effectiveWidth > 100) ? `calc(-${(effectiveWidth - 100) / 2}% + 20px)` : '0';

      const borderStyle = isTransparent ? 'border: none; background: transparent; box-shadow: none;' : 'border: 1px solid rgba(255, 255, 255, 0.2); background: transparent; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); box-sizing: border-box;';
      const renderStyleBase = `width: 100%; object-position: ${customPos}; image-rendering: auto; transform: translateZ(0); -webkit-backface-visibility: hidden; display: block;`;
      let imgHtml = "";
      if (overlay !== undefined && overlay.trim() !== "") {
        const formattedOverlay = formatTags(overlay, true);
        imgHtml = `<div class="relative rounded-2xl overflow-hidden flex items-center justify-center flex-1 min-w-0" style="height: ${customHeight}; max-width: ${customWidth} !important; ${borderStyle}">
                    <img src="${savedSrc}" class="absolute inset-0 w-full h-full object-cover" style="${renderStyleBase}" />
                    <div class="absolute inset-0 bg-black/15 flex items-center justify-center p-2">
                       <div class="text-white font-black uppercase tracking-[0.25em] text-center text-[8px] md:text-[10px] select-none leading-tight">${formattedOverlay}</div>
                    </div>
                  </div>`;
      } else {
        imgHtml = `<div class="flex-1 min-w-0" style="max-width: ${customWidth} !important;">
                  <img src="${savedSrc}" class="w-full rounded-2xl object-cover block" style="${renderStyleBase} ${borderStyle} min-height: 40px; height: ${customHeight};" />
                </div>`;
      }
      images.push({ html: imgHtml, align: align || 'c' });
      return `__IMG_PLACEHOLDER_${images.length - 1}__`;
    });
    p = formatTags(p);
    
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
    return `<div class="min-h-[1.2em] leading-tight mb-0 m-0 p-0" style="${customTextColor ? `color: ${customTextColor};` : ''}">${p}</div>`;
  }).join('');
};

const getWallpaperOpacity = (color: string) => {
  if (color === 'transparent') return 1;
  if (color === '#02040a') return 0.08; 
  return 0.65;
};

const getWallpaperFilter = (color: string) => {
  if (color === '#02040a') return 'saturate(0) brightness(0.2)'; 
  return 'none';
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
          className={`absolute inset-0 w-full h-full object-cover 4k-texture transition-opacity duration-1000 ease-in-out`}
          style={{ 
            opacity: i === index ? opacity : 0, 
            filter: filter, 
            imageRendering: 'high-quality' 
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

const CommunityProfileView: React.FC<CommunityProfileViewProps> = ({ member, community, currentUserId, currentUserAvatar, onBack, onUpdate, verifySafety, addNotification, onAddFeedPost }) => {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const hub01InputRef = useRef<HTMLInputElement>(null);
  const hub02InputRef = useRef<HTMLInputElement>(null);
  const bioImageInputRef = useRef<HTMLInputElement>(null);
  const editorImageInputRef = useRef<HTMLInputElement>(null);
  const bioTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const editorTextAreaRef = useRef<HTMLTextAreaElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isMuralHubActive, setIsMuralHubActive] = useState(false);
  const [activeTab, setActiveTab] = useState('POSTS');
  const [showGradients, setShowGradients] = useState(true);
  const [isMuralExpanded, setIsMuralExpanded] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  
  const [showEditor, setShowEditor] = useState<'BLOG' | 'WIKI' | 'POST' | null>(null);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');

  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);

  const [tempName, setTempName] = useState(member.personaName || member.userId);
  const [tempBio, setTempBio] = useState(member.personaBio || '');
  const [tempAvatar, setTempAvatar] = useState(member.personaAvatar || currentUserAvatar);
  const [tempPanelColor, setTempPanelColor] = useState(member.personaPanelColor || '#1a2036');
  const [tempContentColor, setTempContentColor] = useState(member.personaContentColor || '#02040a');
  const [tempFrameColor, setTempFrameColor] = useState(member.personaFrameColor || '#22d3ee');
  const [tempNameColor, setTempNameColor] = useState(member.personaNameColor || '#ffffff');
  const [tempMuralTopColor, setTempMuralTopColor] = useState(member.personaPanelColor || '#1a2036');
  const [tempMuralFeedColor, setTempMuralFeedColor] = useState(member.personaContentColor || '#02040a');
  const [tempPanelImage, setTempPanelImage] = useState(member.personaPanelImage || '');
  const [tempContentImage, setTempContentImage] = useState(member.personaContentImage || '');
  const [tempMuralImage, setTempMuralImage] = useState(member.personaPanelImage || '');
  const [tempMuralFeedImage, setTempMuralFeedImage] = useState(member.personaContentImage || '');
  const [tempFrameStyle, setTempFrameStyle] = useState(member.personaFrameStyle || 'NEON');

  const [wikiBgImage, setWikiBgImage] = useState<string | null>(null);
  const [wikiAvatar, setWikiAvatar] = useState<string | null>(null);
  const [wikiTopColor, setWikiTopColor] = useState('#1a2036');
  const [wikiBgColor, setWikiBgColor] = useState('#02040a');
  const [wikiKeywords, setWikiKeywords] = useState('');
  const [wikiInfoRows, setWikiInfoRows] = useState<{ label: string, value: string, type?: 'text' | 'rating_star' | 'rating_heart' }[]>([]);
  const [wikiGallery, setWikiGallery] = useState<string[]>([]);
  const [wikiTopImages, setWikiTopImages] = useState<{ id: string, src: string }[]>([]);
  const [wikiHideOverlay, setWikiHideOverlay] = useState(false);
  const [editorViewMode, setEditorViewMode] = useState<'editor' | 'preview'>('editor');

  const wikiBgRef = useRef<HTMLInputElement>(null);
  const wikiAvatarRef = useRef<HTMLInputElement>(null);
  const wikiGalleryRef = useRef<HTMLInputElement>(null);
  const wikiTopRef = useRef<HTMLInputElement>(null);
  const wikiNarrativeImageRef = useRef<HTMLInputElement>(null);

  const { firstBioImageSrc, isFirstBioImageTransparent } = useMemo(() => {
    if (!member.personaBio) return { firstBioImageSrc: null, isFirstBioImageTransparent: false };
    const match = /\[(img_[a-z0-9]+)/i.exec(member.personaBio);
    if (match) {
      const src = localStorage.getItem('vimg_' + match[1]);
      const isTransparent = src ? (src.includes('image/png') || src.includes('image/webp')) : false;
      return { firstBioImageSrc: src, isFirstBioImageTransparent: isTransparent };
    }
    return { firstBioImageSrc: null, isFirstBioImageTransparent: false };
  }, [member.personaBio]);

  const [activePicker, setActivePicker] = useState<{ field: string, label: string } | null>(null);
  const [pickerHsla, setPickerHsla] = useState({ h: 0, s: 100, l: 50, a: 1 });

  const [plusRotation, setPlusRotation] = useState(0);
  const [fabRotation, setFabRotation] = useState(0);
  const [spinCount, setSpinCount] = useState(0);
  const [isMorphing, setIsMorphing] = useState(false);

  const currentPanelImage = isEditing ? (isMuralHubActive ? tempMuralImage : tempPanelImage) : member.personaPanelImage;
  const currentContentImage = isEditing ? (isMuralHubActive ? tempMuralFeedImage : tempContentImage) : member.personaContentImage;
  const currentPanelColor = isEditing ? (isMuralHubActive ? tempMuralTopColor : tempPanelColor) : (member.personaPanelColor || '#1a2036');
  const currentContentColor = isEditing ? (isMuralHubActive ? tempMuralFeedColor : tempContentColor) : (member.personaContentColor || '#02040a');
  const topContrast = getContrastBase(currentPanelColor);
  const feedContrast = getContrastBase(currentContentColor);

  const isMe = currentUserId === member.userId;
  const isLeaderInCommunity = community.leaders.includes(member.userId);
  const isCoLeaderInCommunity = community.coLeaders.includes(member.userId);
  const autoMuralTextColor = getAutoContrastHex(currentPanelColor);

  const fabTheme = useMemo(() => {
    const hsla = hexToHsla(currentContentColor);
    const h = hsla.h;
    const s = hsla.s;
    const l = hsla.l;
    const iconCls = 'text-white';
    let dynamicGradient = '';
    if (s < 10) dynamicGradient = 'bg-[linear-gradient(135deg,#64748b_0%,#334155_60%,#0f172a_100%)]';
    else if (h >= 35 && h < 80) dynamicGradient = 'bg-[linear-gradient(135deg,#fbbf24_0%,#9a3412_70%,#451a03_100%)]';
    else if (h >= 240 && h < 280) dynamicGradient = 'bg-[linear-gradient(135deg,#a855f7_0%,#581c87_70%,#2e1065_100%)]';
    else if (h >= 280 && h <= 345) dynamicGradient = 'bg-[linear-gradient(135deg,#db2777_0%,#831843_70%,#500724_100%)]';
    else if (l < 15) dynamicGradient = 'bg-[linear-gradient(135deg,#475569_0%,#1e293b_60%,#020617_100%)]';
    else if (h >= 345 || h <= 20) dynamicGradient = 'bg-[linear-gradient(135deg,#ef4444_0%,#7f1d1d_70%,#450a0a_100%)]';
    else if (h >= 80 && h <= 160) dynamicGradient = 'bg-[linear-gradient(135deg,#22c55e_0%,#14532d_70%,#052e16_100%)]';
    else if (h > 160 && h < 240) dynamicGradient = 'bg-[linear-gradient(135deg,#3b82f6_0%,#1e3a8a_70%,#0a1931_100%)]';
    else dynamicGradient = 'bg-[linear-gradient(135deg,#06b6d4_0%,#155e75_70%,#020617_100%)]';
    if (l > 85) return { shape: 'circle', gradient: dynamicGradient, cls: 'rounded-full', clip: '', style: { borderRadius: '9999px' }, baseRot: 0, scale: 1, iconRot: '', iconCls };
    if (h >= 75 && h <= 165 && s > 20) return { shape: 'drop', gradient: dynamicGradient, cls: '', clip: '', style: { borderRadius: '0% 50% 50% 50%' }, baseRot: 0, scale: 0.85, iconRot: '', iconCls };
    if ((h > 340 || h <= 25) && s > 25) return { shape: 'rounded-square', gradient: dynamicGradient, cls: '', clip: '', style: { borderRadius: '1.4rem' }, baseRot: 0, scale: 1, iconRot: '', iconCls };
    if (h >= 35 && h < 80 && s > 20) return { shape: 'triangle', gradient: dynamicGradient, cls: '', clip: 'url(#rounded-triangle-clip-community)', style: { }, baseRot: 0, scale: 1, iconRot: 'mt-3', iconCls };
    if (h >= 280 && h <= 345 && s > 20) return { shape: 'diamond', gradient: dynamicGradient, cls: '', clip: '', style: { borderRadius: '0.6rem' }, baseRot: 45, scale: 0.85, iconRot: '', iconCls };
    return { shape: 'circle-colored', gradient: dynamicGradient, cls: 'rounded-full', clip: '', style: { borderRadius: '9999px' }, baseRot: 0, scale: 1, iconRot: '', iconCls };
  }, [currentContentColor]);

  const fabIconUrl = useMemo(() => {
    const hsla = hexToHsla(currentContentColor);
    const h = hsla.h;
    const s = hsla.s;
    const l = hsla.l;
    if (l > 92) return "https://storage.googleapis.com/voidyapp-storage/%C3%8Dcone%20circulo%20chocolate.png";
    if (s < 10 && l < 15) return "https://storage.googleapis.com/voidyapp-storage/%C3%8Dcone%20vermelho%20quadrado.png"; 
    if (h >= 80 && h < 165 && s > 20) return "https://storage.googleapis.com/voidyapp-storage/%C3%8Dcone%20quadrado%20verde.png";
    if (h >= 10 && h < 50 && s > 20) return "https://storage.googleapis.com/voidyapp-storage/Losango%20%C3%ADcone%20laranja.png";
    if (h >= 240 && h < 285 && s > 20) return "https://storage.googleapis.com/voidyapp-storage/Losango%20roxo%20%C3%ADcone.png";
    if (h >= 50 && h < 80 && s > 20) return "https://storage.googleapis.com/voidyapp-storage/Losango%20amarelo%20%C3%ADcone.png";
    if (h >= 285 && h < 345 && s > 20) return "https://storage.googleapis.com/voidyapp-storage/Losango%20rosa%20%C3%ADcone.png";
    if (h >= 170 && h < 205 && s > 20) return "https://storage.googleapis.com/voidyapp-storage/Quadrado%20azul%20claro%20%C3%ADcone.png";
    if (h >= 205 && h < 240 && s > 20) return "https://storage.googleapis.com/voidyapp-storage/Quadrado%20azul%20escuro%20icone.png";
    return "https://storage.googleapis.com/voidyapp-storage/%C3%8Dcone%20vermelho%20quadrado.png";
  }, [currentContentColor]);

  const isPurpleIcon = fabIconUrl.includes('roxo');

  const activeMainShadowColor = useMemo(() => {
    const hsla = hexToHsla(currentContentColor);
    return `hsla(${hsla.h}, ${hsla.s}%, 2%, 0.5)`;
  }, [currentContentColor]);

  const iconScale = useMemo(() => {
    if (fabIconUrl.includes('chocolate')) return 0.65; 
    if (fabIconUrl.includes('azul%20escuro') || fabIconUrl.includes('azul%20claro') || fabIconUrl.includes('verde')) return 0.85; 
    return 1;
  }, [fabIconUrl]);

  useEffect(() => {
    setIsMorphing(true);
    const timer = setTimeout(() => setIsMorphing(false), 600);
    return () => clearTimeout(timer);
  }, [fabIconUrl]);

  const compressAndInsertImage = (base64: string, isBio: boolean) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const mime = base64.split(';')[0].split(':')[1];
      const isTransparent = mime === 'image/png' || mime === 'image/webp';
      const MAX_SIZE = isTransparent ? 600 : 800;
      
      let width = img.width;
      let height = img.height;
      if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } } 
      else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      
      const outputMime = isTransparent ? mime : 'image/jpeg';
      const compressedBase64 = canvas.toDataURL(outputMime, isTransparent ? undefined : 0.8);
      const imgId = Math.random().toString(36).substring(2, 7);
      const fullId = `img_${imgId}`;
      try {
        localStorage.setItem('vimg_' + fullId, compressedBase64);
        if (isBio) {
          setTempBio(prev => {
            const textarea = bioTextAreaRef.current;
            const start = textarea?.selectionStart ?? prev.length;
            const end = textarea?.selectionEnd ?? start;
            const before = prev.substring(0, start);
            const after = prev.substring(end);
            return `${before}[${fullId} h=150 p=50 w=100 a=c] ""${after}`;
          });
        }
        if (verifySafety) verifySafety(compressedBase64).catch(console.error);
      } catch (err) { alert("Ativo visual pesado demais para o link local. Tente reduzir o tamanho da imagem."); }
    };
  };

  const handleInsertBioImage = (e: React.ChangeEvent<HTMLInputElement>, isBio: boolean) => {
    const target = e.target;
    const file = target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        compressAndInsertImage(base64, isBio);
        target.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageInput = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const target = e.target;
    const file = target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 1024;
            let width = img.width;
            let height = img.height;
            if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } } 
            else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const mime = base64.split(';')[0]?.split(':')[1]?.split(';')[0] || 'image/jpeg';
              const outputMime = (mime === 'image/png' || mime === 'image/webp') ? mime : 'image/jpeg';
              const compressedBase64 = canvas.toDataURL(outputMime, 0.82);
              setter(compressedBase64);
              if (verifySafety) verifySafety(compressedBase64).catch(console.error);
            } else {
              setter(base64);
            }
          } catch (err) {
            console.error("Scale error", err);
            setter(base64);
          }
          target.value = '';
        };
        img.onerror = () => {
          setter(base64);
          target.value = '';
        };
        img.src = base64;
      };
      reader.readAsDataURL(file);
    }
  };

  const openPicker = (field: string, label: string, currentHex: string) => {
    setActivePicker({ field, label });
    setPickerHsla(hexToHsla(currentHex === 'transparent' ? '#00000000' : currentHex));
  };

  const updatePickerColor = (h: number, s: number, l: number, a: number) => {
    const newHex = hslaToHex(h, s, l, a);
    setPickerHsla({ h, s, l, a });
    if (activePicker?.field === 'panel') setTempPanelColor(newHex);
    else if (activePicker?.field === 'content') setTempContentColor(newHex);
    else if (activePicker?.field === 'frame') setTempFrameColor(newHex);
    else if (activePicker?.field === 'name') setTempNameColor(newHex);
    else if (activePicker?.field === 'muralTop') setTempMuralTopColor(newHex);
    else if (activePicker?.field === 'wikiTop') setWikiTopColor(newHex);
    else if (activePicker?.field === 'wikiBg') setWikiBgColor(newHex);
  };

  const handleResetColor = (field: string) => {
    if (field === 'panel') setTempPanelColor('#1a2036');
    else if (field === 'content') setTempContentColor('#02040a');
    else if (field === 'frame') setTempFrameColor('#22d3ee');
    else if (field === 'name') setTempNameColor('#ffffff');
    else if (field === 'muralTop') setTempMuralTopColor('transparent');
    else if (field === 'wikiTop') setWikiTopColor('#1a2036');
    else if (field === 'wikiBg') setWikiBgColor('#02040a');
    setActivePicker(null);
  };

  const handleWikiTopUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    const file = target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 1200;
          let width = img.width;
          let height = img.height;
          if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } } 
          else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const mime = base64.split(';')[0]?.split(':')[1]?.split(';')[0] || 'image/jpeg';
            const outputMime = (mime === 'image/png' || mime === 'image/webp') ? mime : 'image/jpeg';
            const compressedBase64 = canvas.toDataURL(outputMime, 0.82);
            const imgId = Math.random().toString(36).substring(2, 7);
            const fullId = `img_${imgId}`;
            try {
              localStorage.setItem('vimg_' + fullId, compressedBase64);
              setWikiTopImages(prev => [...prev, { id: fullId, src: compressedBase64 }]);
              if (verifySafety) verifySafety(compressedBase64).catch(console.error);
            } catch (err) { alert("Ativo visual pesado demais."); }
          }
        };
        img.onerror = () => { console.error("Error loading wiki top image"); };
        img.src = base64;
      };
      reader.readAsDataURL(file);
    }
    target.value = '';
  };

  const handleSave = () => {
    try {
      onUpdate(prev => ({
        ...prev,
        membersData: {
          ...(prev.membersData || {}),
          [member.userId]: {
            ...(prev.membersData?.[member.userId] || { userId: member.userId, joinDate: Date.now(), cityLevel: 1, cityReputation: 0, cityRank: 'RECRUTA' }),
            personaName: tempName,
            personaAvatar: tempAvatar,
            personaBio: tempBio,
            personaPanelColor: tempPanelColor,
            personaContentColor: tempContentColor,
            personaFrameColor: tempFrameColor,
            personaNameColor: tempNameColor,
            personaPanelImage: tempPanelImage,
            personaContentImage: tempContentImage,
            personaFrameStyle: tempFrameStyle
          }
        }
      }));
    } catch (e) {
      console.warn("Save failed in community profile persistence.");
    } finally {
      setIsEditing(false);
      setIsMuralHubActive(false);
    }
  };

  const handleHexInput = (hex: string) => {
    if (hex.startsWith('#') && (hex.length === 7 || hex.length === 9)) {
      const hsla = hexToHsla(hex);
      updatePickerColor(hsla.h, hsla.s, hsla.l, hsla.a);
    }
  };

  const handleInsertWikiGallery = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    const files = target.files;
    if (files) {
      Array.from(files).forEach((file: any) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const base64 = ev.target?.result as string;
          const img = new Image();
          img.onload = () => {
             const canvas = document.createElement('canvas');
             const MAX_SIZE = 1024;
             let width = img.width;
             let height = img.height;
             if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } } 
             else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
             canvas.width = width;
             canvas.height = height;
             const ctx = canvas.getContext('2d');
             if (ctx) {
               ctx.drawImage(img, 0, 0, width, height);
               const mime = base64.split(';')[0]?.split(':')[1]?.split(';')[0] || 'image/jpeg';
               const outputMime = (mime === 'image/png' || mime === 'image/webp') ? mime : 'image/jpeg';
               const compressedBase64 = canvas.toDataURL(outputMime, 0.82);
               setWikiGallery(prev => [...prev, compressedBase64]);
               if (verifySafety) verifySafety(compressedBase64).catch(console.error);
             }
          };
          img.onerror = () => { console.error("Wiki gallery load error"); };
          img.src = base64;
        };
        reader.readAsDataURL(file as Blob);
      });
    }
    target.value = '';
  };

  const insertTag = (tag: string) => {
    const textarea = editorTextAreaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = editorContent;
    const before = text.substring(0, start);
    const after = text.substring(end);
    const selected = text.substring(start, end);
    const newText = `${before}[${tag}]${selected}[/${tag}]${after}`;
    setEditorContent(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length + 2, end + tag.length + 2);
    }, 0);
  };

  const handleSavePost = () => {
    if (!editorContent.trim() && !editorTitle.trim()) return;
    const newPost: FeedPost = {
      id: `${showEditor?.toLowerCase()}-${Date.now()}`,
      author: member.personaName || member.userId,
      avatar: tempAvatar,
      title: editorTitle || undefined,
      content: editorContent,
      likes: 0,
      time: 'Agora',
      tag: showEditor || 'POST',
      timestamp: Date.now(),
      comments: [],
      customAvatar: showEditor === 'WIKI' ? (wikiAvatar || undefined) : undefined,
      customBgImage: showEditor === 'WIKI' ? (wikiBgImage || undefined) : undefined,
      customTopColor: showEditor === 'WIKI' ? wikiTopColor : undefined,
      customBgColor: showEditor === 'WIKI' ? wikiBgColor : undefined,
      customKeywords: showEditor === 'WIKI' ? wikiKeywords : undefined,
      customInfoRows: showEditor === 'WIKI' ? wikiInfoRows : undefined,
      customGallery: showEditor === 'WIKI' ? wikiGallery : undefined,
      customTopImages: showEditor === 'WIKI' ? wikiTopImages.map(img => img.src) : undefined,
      customHideOverlay: showEditor === 'WIKI' ? wikiHideOverlay : undefined,
    };
    const updatedPosts = [newPost, ...(member.posts || [])];
    onUpdate(prev => ({
      ...prev,
      membersData: {
        ...(prev.membersData || {}),
        [member.userId]: {
          ...(prev.membersData?.[member.userId] || { userId: member.userId }),
          posts: updatedPosts
        }
      }
    }));
    if (onAddFeedPost) onAddFeedPost(newPost);
    setShowEditor(null);
    setEditorTitle('');
    setEditorContent('');
  };

  const handleCopyLink = () => {
    const link = `https://voidy.app/profile/${member.userId}`;
    navigator.clipboard.writeText(link);
    alert('Link do perfil copiado para o terminal Nexus.');
    setIsOptionsMenuOpen(false);
  };

  const handleReportUser = () => {
    const reason = window.prompt("Sinalize a inconsistência de conduta (Motivo da denúncia):");
    if (reason) {
      addNotification({ type: 'REPORT', title: 'Denúncia de Operativo', content: `Denúncia enviada contra ${member.personaName || member.userId}: ${reason}`, sender: 'SISTEMA' });
      alert('Relatório de dissonância enviado para a Drake.OS.');
    }
    setIsOptionsMenuOpen(false);
  };

  const handleBlockUser = () => {
    if (window.confirm(`Deseja cessar todas as comunicações com ${member.personaName || member.userId}?`)) {
      alert('Link neural bloqueado.');
    }
    setIsOptionsMenuOpen(false);
  };

  const renderGeometricButton = (content: React.ReactNode, onClick: (e: React.MouseEvent) => void, isSmall = false, label?: string, gradientOverride?: string, wrapperStyle?: React.CSSProperties) => {
    const isCircle = fabTheme.shape.includes('circle');
    const size = isSmall ? 'w-11 h-11' : (isCircle ? 'w-[54px] h-[54px]' : 'w-[58px] h-[58px]');
    const gradient = gradientOverride || fabTheme.gradient;
    const isParentTriangle = fabTheme.shape === 'triangle';
    const forceDiamond = isSmall && (isParentTriangle || fabTheme.shape === 'diamond');
    const shapeStyle = forceDiamond ? { borderRadius: '0.6rem' } : fabTheme.style;
    const baseRot = forceDiamond ? 45 : fabTheme.baseRot;
    const clipPath = forceDiamond ? '' : fabTheme.clip;
    const currentPlusRotation = (!isSmall && isFabOpen) ? 405 : 0;
    
    return (
      <div className={`relative ${size} flex items-center justify-center group pointer-events-auto transition-all duration-300`} style={{ ...wrapperStyle, perspective: '1000px', filter: isSmall ? 'none' : `drop-shadow(0 14px 20px ${activeMainShadowColor})` }}>
        <div className={`absolute inset-0 ${gradient} transition-all duration-700 pointer-events-none blur-[8px] opacity-[0.03]`} style={{ transform: `rotate(${baseRot + (isSmall ? 0 : plusRotation) + currentPlusRotation}deg) scale(${(fabTheme.scale || 1) * 1.15})`, clipPath, ...shapeStyle }} />
        <div className={`relative z-10 w-full h-full transition-all duration-700 ease-out active:scale-90 ring-1 ring-white/10 overflow-hidden flex items-center justify-center`} style={{ transform: `rotate(${baseRot + (isSmall ? 0 : currentPlusRotation) + (isSmall ? 0 : plusRotation)}deg) scale(${isSmall ? 1 : (fabTheme.scale || 1)})`, clipPath, ...shapeStyle }}>
           <div className={`absolute inset-0 ${gradient}`}></div>
           <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent pointer-events-none"></div>
           <div className={`absolute inset-0 border-[2.5px] border-white/20`} style={{ transform: 'scale(0.85)', clipPath, ...shapeStyle }} />
           <button onClick={onClick} className={`relative z-10 w-full h-full flex items-center justify-center outline-none cursor-pointer text-white`} style={{ transform: `rotate(${-baseRot + (isSmall ? 0 : -currentPlusRotation)}deg)` }}> <div> {content} </div> </button>
        </div>
        {label && ( <span className="absolute -left-12 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[7px] font-black text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"> {label} </span> )}
      </div>
    );
  };

  const isPinkDiamond = fabIconUrl.includes('rosa') && fabIconUrl.includes('Losango');

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center overflow-y-auto no-scrollbar font-inter text-white select-none hd-4k-rendering" style={{ backgroundColor: currentContentColor === 'transparent' ? '#02040a' : currentContentColor }}>
      <svg width="0" height="0" className="absolute pointer-events-none"> <defs> <clipPath id="rounded-triangle-clip-community" clipPathUnits="objectBoundingBox"> <path d="M 0.5 0.05 C 0.47 0.05 0.44 0.08 0.42 0.12 L 0.05 0.85 C 0.03 0.89 0.04 0.95 0.1 0.95 L 0.9 0.95 C 0.96 0.95 0.97 0.89 0.95 0.85 L 0.58 0.12 C 0.56 0.08 0.53 0.05 0.5 0.05 Z" /> </clipPath> </defs> </svg>

      <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageInput(e, setTempAvatar)} />
      <input type="file" ref={wikiAvatarRef} className="hidden" accept="image/*" onChange={(e) => handleImageInput(e, setWikiAvatar)} />
      <input type="file" ref={wikiTopRef} className="hidden" accept="image/*" multiple onChange={handleWikiTopUpload} />
      <input type="file" ref={wikiBgRef} className="hidden" accept="image/*" onChange={(e) => handleImageInput(e, setWikiBgImage)} />
      <input type="file" ref={wikiGalleryRef} className="hidden" accept="image/*" multiple onChange={handleInsertWikiGallery} />
      <input type="file" ref={wikiNarrativeImageRef} className="hidden" accept="image/*" onChange={(e) => handleInsertBioImage(e, true)} />
      <input type="file" ref={hub01InputRef} className="hidden" accept="image/*" onChange={(e) => handleImageInput(e, setTempPanelImage)} />
      <input type="file" ref={hub02InputRef} className="hidden" accept="image/*" onChange={(e) => handleImageInput(e, setTempContentImage)} />
      <input type="file" ref={bioImageInputRef} className="hidden" accept="image/*" onChange={(e) => handleInsertBioImage(e, true)} />

      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {currentContentImage && ( <div className="absolute inset-0 w-full h-full bg-cover bg-center transition-all duration-500" style={{ backgroundImage: `url(${currentContentImage})`, WebkitMaskImage: 'linear-gradient(to bottom, transparent 0px, black 320px)', maskImage: 'linear-gradient(to bottom, transparent 0px, black 320px)', opacity: getWallpaperOpacity(currentContentColor), filter: getWallpaperFilter(currentContentColor), imageRendering: 'high-quality' }} /> )}
      </div>

      <div className="w-full min-h-full flex flex-col relative pb-32 z-10">
        <div className="absolute top-0 inset-x-0 h-[460px] z-0 overflow-hidden transition-all duration-500" style={{ background: `linear-gradient(to bottom, ${currentPanelColor === 'transparent' ? '#00000000' : currentPanelColor} 0%, ${currentPanelColor === 'transparent' ? '#00000000' : currentPanelColor} 30%, ${currentContentColor === 'transparent' ? '#00000000' : (currentContentColor === '#02040a' ? '#000' : currentContentColor)} 92%, ${currentContentColor === 'transparent' ? '#00000000' : (currentContentColor === '#02040a' ? '#000' : currentContentColor)} 100%)`, WebkitMaskImage: 'linear-gradient(to bottom, black 240px, transparent 460px)', maskImage: 'linear-gradient(to bottom, black 240px, transparent 460px)' }} >
           {currentPanelImage && ( <img src={currentPanelImage} className={`w-full h-full object-cover transition-all duration-500`} style={{ opacity: getWallpaperOpacity(currentPanelColor), filter: getWallpaperFilter(currentPanelColor), imageRendering: 'high-quality' }} /> )}
           {showGradients && ( <div className="absolute bottom-0 left-0 w-full h-full z-[5] pointer-events-none" style={{ backgroundImage: `linear-gradient(to top, ${currentContentColor === 'transparent' ? '#02040a' : currentContentColor} 0%, transparent 60%)` }} /> )}
        </div>

        <header className="flex items-center justify-between px-4 pt-4 pb-8 shrink-0 sticky top-0 z-[1000] bg-transparent pointer-events-none">
          {isEditing ? (
            <div className="flex gap-2 w-full justify-between items-center animate-in fade-in pointer-events-auto">
               <button onClick={() => { setIsEditing(false); setIsMuralHubActive(false); }} className="px-5 py-2.5 bg-black/60 backdrop-blur-md border border-white/20 rounded-full text-[8px] font-black text-white uppercase tracking-widest transition-all active:scale-95 shadow-xl cursor-pointer">CANCELAR</button>
               <button onClick={handleSave} className="px-6 py-2.5 bg-cyan-500/90 backdrop-blur-md border border-cyan-400/50 rounded-full text-[8px] font-black text-white uppercase tracking-widest transition-all active:scale-95 shadow-2xl shadow-cyan-500/40 cursor-pointer">SALVAR</button>
            </div>
          ) : (
            <>
              <button onClick={onBack} className="p-2 bg-black/40 backdrop-blur-md rounded-xl active:scale-90 transition-all pointer-events-auto border border-white/10" style={{ color: `rgba(${topContrast}, 0.9)` }}> <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M15 19l-7-7 7-7"/></svg> </button>
              <div className="flex items-center gap-3">
                 <div className="bg-transparent rounded-full px-4 py-1.5 flex items-center gap-2 transition-all pointer-events-auto">
                    <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-[7px] text-black font-black shadow-[0_0_8px_rgba(34,211,238,0.5)]">V</div>
                    <span className="text-[12px] font-black tracking-tighter" style={{ color: `rgba(${topContrast}, 1)` }}>{(member.voidyCoins || 0).toLocaleString()}</span>
                  </div>
                  <div className="bg-black/20 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-2 transition-all border border-white/5 pointer-events-auto">
                     <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-[7px] text-black font-black shadow-[0_0_8px_rgba(245,158,11,0.5)]">G</div>
                     <span className="text-[12px] font-black tracking-tighter" style={{ color: `rgba(${topContrast}, 1)` }}>{(member.wallet || 0).toLocaleString()}</span>
                 </div>
                 <button onClick={() => setIsOptionsMenuOpen(true)} className="p-2 bg-black/40 backdrop-blur-md rounded-xl active:scale-90 transition-all pointer-events-auto border border-white/10" style={{ color: `rgba(${topContrast}, 0.9)` }}> <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2 s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2 s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg> </button>
              </div>
            </>
          )}
        </header>

        <section className="flex flex-col items-center px-4 relative mt-24 z-10 w-full transition-all duration-500">
          <div className="relative mb-6 flex justify-center">
             <div className="absolute top-1 left-1 z-30 w-4 h-4 rounded-full bg-[#02040a] border border-white/10 flex items-center justify-center shadow-md"><div className="w-2 h-2 rounded-full bg-[#22c55e] shadow-[0_0_8px_#22c55e] border border-white/10"></div></div>
             <div className="w-20 h-20 rounded-full border-[2.5px] shadow-[0_0_25px_rgba(255,255,255,0.15)] relative z-10 overflow-hidden bg-black flex-shrink-0" style={{ borderColor: isEditing ? tempFrameColor : (member.personaFrameColor || '#fff') }}>
                <img src={isEditing ? tempAvatar : (member.personaAvatar || currentUserAvatar)} className="absolute inset-0 w-full h-full object-cover" alt="Perfil" />
                {isEditing && <button onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity z-20"><svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812-1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg></button>}
             </div>
             <div className="absolute bottom-0 -right-2 z-20 flex flex-col gap-1 items-end">
                {isLeaderInCommunity && <div className="bg-cyan-500/20 border border-cyan-400 text-cyan-400 px-2 py-0.5 rounded-full text-[6px] font-black uppercase tracking-widest shadow-[0_0_10px_rgba(34,211,238,0.5)] backdrop-blur-md">LÍDER</div>}
                {isCoLeaderInCommunity && <div className="bg-purple-500/20 border border-purple-400 text-purple-400 px-2 py-0.5 rounded-full text-[6px] font-black uppercase tracking-widest shadow-[0_0_10px_rgba(168,85,247,0.5)] backdrop-blur-md">CURADOR</div>}
             </div>
          </div>
          <div className="flex flex-col items-center justify-center w-full min-h-[1.5rem] relative gap-2">
             {isEditing ? (
               <input value={tempName} onChange={(e) => setTempName(e.target.value)} style={{ color: tempNameColor }} className="bg-black/20 border-b border-cyan-500/50 outline-none text-center font-black uppercase text-sm w-48 pb-0.5 rounded-t-lg" />
             ) : (
               <h2 className="text-sm font-black uppercase tracking-tighter text-center" style={{ color: member.personaNameColor || (topContrast === '0, 0, 0' ? '#000' : '#fff') }}>{member.personaName || member.userId}</h2>
             )}
          </div>
        </section>

        <section className="px-4 mt-16 mb-8 flex items-center justify-between z-10 relative">
           <div className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 shadow-md active:scale-95 transition-transform"><span className="text-[10px]">🎖️</span><span className="text-[6px] font-black uppercase tracking-wider" style={{ color: `rgba(${feedContrast}, 1)` }}>{member.cityRank}</span></div>
           <div className="flex items-center gap-2.5 pr-1">
              <div className="flex flex-col items-center"><span className="text-sm font-black leading-none tracking-tighter" style={{ color: `rgba(${feedContrast}, 1)` }}>{member.cityReputation}</span><span className="text-[6px] font-black uppercase tracking-widest mt-0.5" style={{ color: `rgba(${feedContrast}, 0.3)` }}>REPUTAÇÃO</span></div>
              <div className="w-[1px] h-4 bg-white/5"></div>
              <div className="flex flex-col items-center"><span className="text-sm font-black leading-none tracking-tighter" style={{ color: `rgba(${feedContrast}, 1)` }}>{member.weeklyMinutes || 0}</span><span className="text-[6px] font-black uppercase tracking-widest mt-0.5" style={{ color: `rgba(${feedContrast}, 0.3)` }}>MINUTOS</span></div>
              <div className="w-[1px] h-4 bg-white/5"></div>
              <div className="flex flex-col items-center"><span className="text-sm font-black leading-none tracking-tighter" style={{ color: `rgba(${feedContrast}, 1)` }}>{member.wallet || 0}</span><span className="text-[6px] font-black uppercase tracking-widest mt-0.5" style={{ color: `rgba(${feedContrast}, 0.3)` }}>GOLDS</span></div>
           </div>
        </section>

        <section className="px-6 relative mb-0 z-10">
           <div className="flex justify-between items-start mb-2"><div><h3 className="text-xs font-black uppercase tracking-tight drop-shadow-lg" style={{ color: `rgba(${feedContrast}, 1)` }}>Biografia Local</h3><p className="text-[5px] font-black uppercase tracking-[0.15em]" style={{ color: `rgba(${feedContrast}, 0.2)` }}>MEMBRO DESTE CLUSTER</p></div></div>
           {isEditing ? (
             <div className="flex flex-col gap-4 w-full">
               <div className="relative w-full">
                 <textarea ref={bioTextAreaRef} value={tempBio} onChange={(e) => setTempBio(e.target.value)} placeholder="Sua história neste setor..." className="w-full bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-[10px] text-white outline-none focus:border-cyan-500 h-40 resize-none transition-all placeholder:text-white/10" />
                 <button type="button" onClick={() => bioImageInputRef.current?.click()} className="absolute bottom-4 right-4 p-2.5 bg-cyan-500 border border-cyan-400 rounded-xl text-white active:scale-90 transition-all z-[130] shadow-xl shadow-cyan-500/20">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/></svg>
                 </button>
                 <input type="file" ref={bioImageInputRef} className="hidden" accept="image/*" onChange={(e) => handleInsertBioImage(e, true)} />
               </div>

               <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-3">
                     <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Painel Superior</span>
                     <div className="flex gap-2">
                        <button onClick={() => hub01InputRef.current?.click()} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all overflow-hidden">
                           {tempPanelImage ? <img src={tempPanelImage} className="w-full h-full object-cover" /> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                        </button>
                        <button onClick={() => openPicker('panel', 'COR DO PAINEL', tempPanelColor)} className="w-10 h-10 rounded-xl border border-white/20 shadow-lg active:scale-90 transition-all" style={{ backgroundColor: tempPanelColor }} />
                     </div>
                  </div>
                  <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-3">
                     <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Painel de Conteúdo</span>
                     <div className="flex gap-2">
                        <button onClick={() => hub02InputRef.current?.click()} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all overflow-hidden">
                           {tempContentImage ? <img src={tempContentImage} className="w-full h-full object-cover" /> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                        </button>
                        <button onClick={() => openPicker('content', 'COR DO CONTEÚDO', tempContentColor)} className="w-10 h-10 rounded-xl border border-white/20 shadow-lg active:scale-90 transition-all" style={{ backgroundColor: tempContentColor }} />
                     </div>
                  </div>
               </div>

               <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                     <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Moldura & Identidade</span>
                     <div className="flex gap-2">
                        <button onClick={() => openPicker('frame', 'COR DA MOLDURA', tempFrameColor)} className="w-8 h-8 rounded-lg border border-white/20" style={{ backgroundColor: tempFrameColor }} />
                        <button onClick={() => openPicker('name', 'COR DO NOME', tempNameColor)} className="w-8 h-8 rounded-lg border border-white/20" style={{ backgroundColor: tempNameColor }} />
                     </div>
                  </div>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                     {['NEON', 'GLASS', 'VOID', 'GOLD'].map(style => (
                       <button key={style} onClick={() => setTempFrameStyle(style)} className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border ${tempFrameStyle === style ? 'bg-cyan-500 border-cyan-400 text-black' : 'bg-white/5 border-white/10 text-white/40'}`}>{style}</button>
                     ))}
                  </div>
               </div>
             </div>
           ) : (
             <div className="flex items-center gap-2 overflow-hidden max-w-full min-w-0">
               <div className={`text-[10px] font-light leading-normal transition-all duration-300 text-left truncate flex-1 flex items-center gap-1.5 ${!member.personaBio ? 'opacity-30' : 'opacity-100'}`} style={{ color: `rgba(${feedContrast}, 1)`, overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
                 {member.personaBio ? (
                    <>
                      {firstBioImageSrc && ( <div className={`w-18 h-16 rounded-2xl overflow-hidden shrink-0 ${isFirstBioImageTransparent ? '' : 'border border-white/10 bg-slate-900'}`}> <img src={firstBioImageSrc} className="w-full h-full object-cover" alt="Mini Header" /> </div> )}
                      <div className="truncate ml-1.5 inline-block align-middle flex-1"> <span className="line-clamp-1 break-words">{stripBioTags(member.personaBio)}</span> </div>
                    </>
                 ) : "..."}
               </div>
             </div>
           )}
        </section>

        <nav className="flex justify-around items-center px-1 z-10 relative">
           {['POSTS', 'MURAL', 'SALVOS'].map(t => (<button key={t} onClick={() => setActiveTab(t)} className="text-[7px] font-black uppercase tracking-0.2em transition-all relative py-2.5" style={{ color: activeTab === t ? `rgba(${feedContrast}, 1)` : `rgba(${feedContrast}, 0.2)` }}>{t}{activeTab === t && <div className="absolute bottom-0 left-0 w-full h-[1px] rounded-full shadow-[0_0_8px_rgba(255,255,255,0.4)]" style={{ backgroundColor: `rgba(${feedContrast}, 1)` }} />}</button>))}
        </nav>

        <main className="px-4 pt-2 space-y-4 z-10 relative">
           {((!isEditing && activeTab === 'POSTS')) && (
             <>
               <div className="flex items-center justify-between"><h4 className="text-[7px] font-black uppercase tracking-[0.15em]" style={{ color: `rgba(${feedContrast}, 0.15)` }}>ENTRADAS WIKI LOCAIS</h4></div>
               {(!member.posts || member.posts.length === 0) ? (
                 <div className="w-full aspect-[21/9] border rounded-[1.2rem] flex flex-col items-center justify-center text-center p-4 shadow-inner" style={{ backgroundColor: `rgba(${feedContrast}, 0.02)`, borderColor: `rgba(${feedContrast}, 0.05)` }}><div className="w-7 h-7 rounded-full border flex items-center justify-center mb-1.5 bg-white/[0.01]" style={{ borderColor: `rgba(${feedContrast}, 0.05)` }}><svg className="w-3.5 h-3.5" style={{ color: `rgba(${feedContrast}, 0.05)` }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg></div><p className="text-[6px] font-black uppercase tracking-[0.3em] heavyweight leading-tight max-w-[140px]" style={{ color: `rgba(${feedContrast}, 0.05)` }}>NENHUMA TRANSMISSÃO CAPTADA NESTE SETOR</p></div>
               ) : (
                 <div className="space-y-4">
                   {member.posts.map(post => (
                     <div key={post.id} className="p-5 rounded-[1.8rem] border border-white/5 bg-white/[0.02] shadow-xl animate-in slide-in-from-bottom duration-500 overflow-hidden relative group">
                       {post.tag === 'WIKI' ? (
                         <div className="flex flex-col">
                           {/* Banner */}
                           <div className="h-32 -mx-5 -mt-5 mb-4 relative overflow-hidden">
                             <SlideshowWallpaper 
                                images={(post.customTopImages && post.customTopImages.length > 0) ? post.customTopImages : (post.customGallery || [])} 
                                color={post.customTopColor || '#1a2036'} 
                                opacity={0.8} 
                                filter="none" 
                                bottomColor={post.customBgColor || '#02040a'}
                              />
                             <div className="absolute inset-0 bg-gradient-to-t from-[#02040a] to-transparent opacity-60" />
                           </div>
                           
                           <div className="flex gap-4 relative z-10 -mt-12 mb-2">
                             {/* Foto de Registro */}
                             <div className="w-16 h-16 rounded-2xl border-2 border-white/20 overflow-hidden shadow-2xl bg-[#02040a] shrink-0">
                               <img src={post.customAvatar || post.avatar} className="w-full h-full object-cover" alt="Registro" />
                             </div>
                             <div className="flex flex-col justify-end pb-1">
                               <h5 className="text-[11px] font-black text-white uppercase tracking-widest">{post.title}</h5>
                               <span className="text-[6px] font-black text-cyan-500 uppercase tracking-[0.2em]">REGISTRO WIKI</span>
                             </div>
                           </div>

                           {/* Semi-transparent content preview */}
                           <div className="text-[8px] font-medium leading-relaxed opacity-40 line-clamp-3 mb-3" style={{ color: `rgba(${feedContrast}, 0.8)` }} dangerouslySetInnerHTML={{ __html: formatBioText(post.content.split('\n\n')[0]) }} />
                           
                           <div className="flex justify-between items-center pt-3 border-t border-white/5">
                             <span className="text-[6px] font-black text-cyan-500/50 uppercase tracking-widest">WIKI MESTRE</span>
                             <span className="text-[6px] font-bold text-slate-600 uppercase">{new Date(post.timestamp).toLocaleDateString()}</span>
                           </div>
                         </div>
                       ) : (
                         <>
                           {post.title && <h5 className="text-[10px] font-black text-white uppercase tracking-widest mb-2">{post.title}</h5>}
                           <div className="text-[9px] font-medium heavyweight leading-relaxed" style={{ color: `rgba(${feedContrast}, 0.8)` }} dangerouslySetInnerHTML={{ __html: formatBioText(post.content, `rgba(${feedContrast}, 0.8)`) }} />
                           <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                             <span className="text-[6px] font-black text-cyan-400 uppercase tracking-widest">{post.tag}</span>
                             <span className="text-[6px] font-bold text-slate-600 uppercase">{new Date(post.timestamp).toLocaleDateString()}</span>
                           </div>
                         </>
                       )}
                     </div>
                   ))}
                 </div>
               )}
             </>
           )}
           {((!isEditing && activeTab === 'MURAL') || (isEditing && isMuralHubActive)) && (
             <div className="space-y-4 animate-in fade-in duration-500">{isEditing && isMuralHubActive && (<div className="mt-2 py-4 border-t border-white/5 animate-in fade-in duration-500"><div className={`text-[14px] md:text-[17px] font-light drop-shadow-md flex flex-col items-start ${!tempBio ? 'opacity-30' : ''}`} style={{ color: `rgba(${feedContrast}, 1)` }}>{tempBio ? (<div className="w-full break-words" dangerouslySetInnerHTML={{ __html: formatBioText(tempBio, autoMuralTextColor) }} />) : "..."}</div></div>)}{(!member.mural || member.mural.length === 0) ? (<div className="py-10 text-center opacity-10"><p className="text-[8px] font-black uppercase tracking-widest">Mural em branco...</p></div>) : (member.mural.map((m) => (<div key={m.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex gap-3"><img src={m.avatar} className="w-8 h-8 rounded-full border border-white/10" /><div className="flex-1"><div className="flex justify-between items-center mb-1"><span className="text-sm font-black text-cyan-400 uppercase">{m.author}</span><span className="text-[6px] text-slate-500">{new Date(m.timestamp).toLocaleDateString()}</span></div><p className="text-[14px] font-medium leading-relaxed" style={{ color: `rgba(${feedContrast}, 0.7)` }}>{m.text}</p></div></div>)))}</div>
           )}
        </main>
      </div>

      {!isEditing && isMe && (
        <div className="fixed bottom-24 right-[-15px] z-[200] pointer-events-none flex items-center justify-center w-[145px] h-[145px]">
           <button onClick={() => { setIsFabOpen(!isFabOpen); if (navigator.vibrate) navigator.vibrate(20); }} className="relative z-50 w-full h-full flex items-center justify-center pointer-events-auto active:scale-95 transition-all duration-300 outline-none">
             <div style={{ transform: `scale(${iconScale})` }} className="w-full h-full transition-transform duration-500 relative flex items-center justify-center">
                <img src={fabIconUrl} style={{ transform: `rotate(${isFabOpen ? 45 : 0}deg)` }} className={`w-full h-full object-contain transition-all duration-700 ease-in-out`} alt="Menu" />
             </div>
           </button>
           <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${isFabOpen ? 'opacity-100' : 'opacity-0'}`}>
              <div className={`absolute transition-all duration-500 ease-out ${isFabOpen ? '-translate-x-[110px] scale-100 visible' : 'translate-x-0 scale-0 invisible'}`}>{renderGeometricButton(<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>, () => { setIsFabOpen(false); setIsEditing(true); }, true, "EDITAR")}</div>
              <div className={`absolute transition-all duration-500 ease-out delay-[50ms] ${isFabOpen ? '-translate-x-[80px] -translate-y-[80px] scale-100 visible' : 'translate-x-0 translate-y-0 scale-0 invisible'}`}>{renderGeometricButton(<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>, () => { setIsFabOpen(false); setShowEditor('WIKI'); }, true, "WIKI")}</div>
           </div>
        </div>
      )}

      {isOptionsMenuOpen && (
        <div className="fixed inset-0 z-[3000] flex flex-col justify-end animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsOptionsMenuOpen(false)} />
           <div className="relative z-[3100] w-full bg-[#0a0c1a] border-t border-white/10 rounded-t-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-500">
              <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-8" />
              <div className="flex flex-col gap-3">
                 <button onClick={handleCopyLink} className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase text-white flex items-center justify-center gap-4 active:scale-95 transition-all"><span>🔗</span> Copiar Link do Perfil</button>
                 {!isMe && (
                   <>
                    <button onClick={handleReportUser} className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase text-white flex items-center justify-center gap-4 active:scale-95 transition-all"><span>⚠️</span> Denunciar Operativo</button>
                    <button onClick={handleBlockUser} className="w-full py-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-[10px] font-black uppercase text-amber-500 flex items-center justify-center gap-4 active:scale-95 transition-all"><span>🚫</span> Bloquear Link Neural</button>
                   </>
                 )}
                 <button onClick={() => setIsOptionsMenuOpen(false)} className="w-full py-5 bg-white/5 text-slate-500 text-[10px] font-black uppercase active:scale-95 transition-all mt-4">Fechar</button>
              </div>
           </div>
        </div>
      )}

      {activePicker && (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActivePicker(null)} />
           <div className="relative z-10 w-full max-w-xs bg-[#0a0c1a] border border-white/10 rounded-[2rem] p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-[10px] font-black text-white uppercase tracking-widest">{activePicker.label}</h3>
                 <button onClick={() => setActivePicker(null)} className="text-white/40 hover:text-white transition-colors">✕</button>
              </div>
              <div className="space-y-6">
                 <div className="space-y-2">
                    <div className="flex justify-between text-[8px] font-bold text-slate-500 uppercase"><span>Matiz</span><span>{pickerHsla.h}°</span></div>
                    <input type="range" min="0" max="360" value={pickerHsla.h} onChange={(e) => updatePickerColor(Number(e.target.value), pickerHsla.s, pickerHsla.l, pickerHsla.a)} className="w-full h-2 rounded-full appearance-none cursor-pointer" style={{ background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)' }} />
                 </div>
                 <div className="space-y-2">
                    <div className="flex justify-between text-[8px] font-bold text-slate-500 uppercase"><span>Saturação</span><span>{pickerHsla.s}%</span></div>
                    <input type="range" min="0" max="100" value={pickerHsla.s} onChange={(e) => updatePickerColor(pickerHsla.h, Number(e.target.value), pickerHsla.l, pickerHsla.a)} className="w-full h-2 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #888, hsl(${pickerHsla.h}, 100%, 50%))` }} />
                 </div>
                 <div className="space-y-2">
                    <div className="flex justify-between text-[8px] font-bold text-slate-500 uppercase"><span>Brilho</span><span>{pickerHsla.l}%</span></div>
                    <input type="range" min="0" max="100" value={pickerHsla.l} onChange={(e) => updatePickerColor(pickerHsla.h, pickerHsla.s, Number(e.target.value), pickerHsla.a)} className="w-full h-2 rounded-full appearance-none cursor-pointer" style={{ background: 'linear-gradient(to right, #000, #fff)' }} />
                 </div>
                 <div className="flex items-center gap-3 pt-2">
                    <input type="text" value={hslaToHex(pickerHsla.h, pickerHsla.s, pickerHsla.l, pickerHsla.a)} onChange={(e) => handleHexInput(e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-black text-white uppercase outline-none focus:border-cyan-500" placeholder="#000000" />
                    <button onClick={() => handleResetColor(activePicker.field)} className="px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[8px] font-black text-white uppercase transition-all">Reset</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {showEditor && (
        <div 
          className="fixed inset-0 z-[5000] flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden" 
          style={{ 
            background: showEditor === 'WIKI' && editorViewMode === 'editor' 
              ? '#000000' 
              : (showEditor === 'WIKI' && editorViewMode === 'preview' 
                  ? `linear-gradient(to bottom, ${wikiTopColor === 'transparent' ? '#000' : wikiTopColor} 0%, ${wikiBgColor === 'transparent' ? '#000' : wikiBgColor} 100%)` 
                  : '#02040a')
          }}
        >
          {showEditor === 'WIKI' && editorViewMode === 'preview' && (
            <div className="absolute inset-0 z-0 pointer-events-none">
               {wikiBgImage && (
                 <div className="absolute inset-0 w-full h-full">
                   <img src={wikiBgImage} className="w-full h-full object-cover" style={{ opacity: 0.4, filter: 'brightness(0.6) saturate(1.2)' }} alt="Wiki Background" />
                 </div>
               )}
               <div className="absolute inset-0 z-10" style={{ background: `linear-gradient(to bottom, ${wikiTopColor} 0%, transparent 20%, transparent 80%, ${wikiBgColor} 100%)` }}></div>
            </div>
          )}
          <header className={`relative z-[5100] p-6 flex items-center justify-between shrink-0 transition-all duration-500 ${showEditor === 'WIKI' && editorViewMode === 'preview' ? 'bg-transparent border-transparent shadow-none' : 'bg-black/40 backdrop-blur-xl border-b border-white/5 shadow-2xl'}`}>
            <button onClick={() => setShowEditor(null)} className="p-2.5 bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all active:scale-90 border border-white/5">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M15 19l-7-7 7-7"/></svg>
            </button>
            <div className="flex flex-col items-center flex-1 mx-4">
               <h2 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">
                  {showEditor === 'WIKI' ? 'Nova Entrada Wiki' : `Novo ${showEditor}`}
               </h2>
               <div className="flex gap-6 mt-3">
                  <button onClick={() => setEditorViewMode('editor')} className={`text-[8px] font-black uppercase tracking-widest transition-all ${editorViewMode === 'editor' ? 'text-cyan-400' : 'text-slate-600'}`}>Configurar</button>
                  <button onClick={() => setEditorViewMode('preview')} className={`text-[8px] font-black uppercase tracking-widest transition-all ${editorViewMode === 'preview' ? 'text-cyan-400' : 'text-slate-600'}`}>Visualizar</button>
               </div>
            </div>
            <div className="flex gap-3">
               <button onClick={handleSavePost} className="p-2.5 bg-white text-black rounded-2xl hover:bg-cyan-50 transition-all active:scale-95 border border-white/50 shadow-[0_0_25px_rgba(255,255,255,0.3)]">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>
               </button>
            </div>
          </header>
          
          <main className={`flex-1 overflow-y-auto no-scrollbar ${showEditor === 'WIKI' && editorViewMode === 'preview' ? 'bg-transparent' : 'bg-[#02040a]'}`}>
            {showEditor === 'WIKI' ? (
              editorViewMode === 'editor' ? (
                <div className="max-w-xl mx-auto flex flex-col pb-40 bg-[#02040a]">
                   <section className="p-8 flex items-center gap-8 border-b border-white/5 relative bg-gradient-to-r from-cyan-500/5 to-transparent">
                      <div 
                        onClick={() => wikiAvatarRef.current?.click()}
                        className="w-28 h-28 rounded-3xl bg-white/[0.03] border border-white/10 flex items-center justify-center shrink-0 cursor-pointer overflow-hidden relative group shadow-2xl transition-all"
                      >
                        {wikiAvatar ? (
                          <div className="relative w-full h-full group">
                            <img src={wikiAvatar} className="w-full h-full object-cover" />
                            <button 
                              onClick={(e) => { e.stopPropagation(); setWikiAvatar(null); }} 
                              className="absolute top-1 right-1 p-1 bg-black/60 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 opacity-60">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                            <span className="text-[6px] font-black uppercase tracking-widest text-white">Subir Avatar</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <label className="text-[7px] font-black text-slate-600 uppercase tracking-[0.4em] ml-1">Identificador Primário</label>
                        <input 
                          value={editorTitle} 
                          onChange={(e) => setEditorTitle(e.target.value)} 
                          placeholder="NOME DE REGISTRO..." 
                          maxLength={20}
                          className="w-full bg-transparent border-b border-white/10 py-3 text-base font-bold text-white outline-none focus:border-cyan-500 transition-all placeholder:text-slate-600 uppercase tracking-tight"
                        />
                      </div>
                   </section>

                   <div className="grid grid-cols-1 border-b border-white/5">
                      <section className="px-8 py-6 space-y-4 bg-white/[0.01]">
                        <div className="flex items-center justify-between">
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Atmosfera Visual (img_T)</span>
                           <div className="flex items-center gap-2">
                              <button 
                                onClick={() => setWikiHideOverlay(!wikiHideOverlay)} 
                                className={`px-3 py-1 rounded-full text-[7px] font-black uppercase transition-all ${wikiHideOverlay ? 'bg-cyan-500 text-black' : 'bg-white/5 border border-white/10 text-white'}`}
                              >
                                {wikiHideOverlay ? 'Overlay: OFF' : 'Overlay: ON'}
                              </button>
                              <div className="flex items-center gap-2 mr-2">
                                <button onClick={() => openPicker('wikiTop', 'COR_T', wikiTopColor)} className={`w-6 h-6 rounded-full border border-white/20 transition-all shadow-md shrink-0 ${activePicker?.field === 'wikiTop' ? 'ring-1 ring-cyan-500' : ''}`} style={{ backgroundColor: wikiTopColor === 'transparent' ? 'rgba(0,0,0,0.1)' : wikiTopColor }} />
                                <input 
                                  value={wikiTopColor} 
                                  onChange={(e) => setWikiTopColor(e.target.value)} 
                                  maxLength={7}
                                  className="w-16 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-[8px] font-mono text-white/60 outline-none focus:border-white/30 uppercase"
                                  placeholder="#000000"
                                />
                              </div>
                              <button onClick={() => wikiTopRef.current?.click()} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[7px] font-black uppercase">+ Adicionar</button>
                           </div>
                        </div>
                        {wikiTopImages.length > 0 && (
                          <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
                             {wikiTopImages.map((imgObj, i) => (
                               <div 
                                 key={i} 
                                 onClick={() => {
                                   const fullId = imgObj.id;
                                   setEditorContent(prev => {
                                     const textarea = editorTextAreaRef.current;
                                     const start = textarea?.selectionStart ?? prev.length;
                                     const end = textarea?.selectionEnd ?? start;
                                     const before = prev.substring(0, start);
                                     const after = prev.substring(end);
                                     return `${before}[${fullId} h=150 p=50 w=100 a=c] ""${after}`;
                                   });
                                 }}
                                 className="relative w-16 h-12 shrink-0 rounded-lg border border-white/10 overflow-hidden group cursor-pointer hover:border-cyan-500 transition-all"
                               >
                                  <img src={imgObj.src} className="w-full h-full object-cover" />
                                  <button onClick={(e) => { e.stopPropagation(); setWikiTopImages(prev => prev.filter((_, idx) => idx !== i)); }} className="absolute top-0 right-0 p-1 bg-black/60 rounded-bl-lg text-[8px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                               </div>
                             ))}
                          </div>
                        )}
                      </section>

                      <div className="grid grid-cols-2">
                         <section 
                          onClick={() => wikiBgRef.current?.click()}
                          className="px-8 py-10 flex flex-col items-center gap-4 bg-white/[0.01] cursor-pointer hover:bg-white/[0.03] transition-all border-r border-white/5 group relative"
                         >
                          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white group-hover:bg-white/10 transition-colors shadow-inner overflow-hidden relative">
                            {wikiBgImage ? (
                              <>
                                <img src={wikiBgImage} className="w-full h-full object-cover" />
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setWikiBgImage(null); }} 
                                  className="absolute top-0 right-0 p-1 bg-black/60 rounded-bl-lg text-[8px] opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                >
                                  ✕
                                </button>
                              </>
                            ) : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                          </div>
                          <div className="text-center">
                            <span className="text-[9px] font-black text-white uppercase tracking-widest block">Fundo do Perfil</span>
                            <span className="text-[6px] text-slate-600 font-bold uppercase">(img_F)</span>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); openPicker('wikiBg', 'COR_F', wikiBgColor); }} className={`absolute top-2 right-2 w-5 h-5 rounded-full border border-white/20 transition-all shadow-md ${activePicker?.field === 'wikiBg' ? 'ring-1 ring-cyan-500' : ''}`} style={{ backgroundColor: wikiBgColor === 'transparent' ? 'rgba(0,0,0,0.1)' : wikiBgColor }} />
                         </section>

                         <section 
                          onClick={() => wikiGalleryRef.current?.click()}
                          className="px-8 py-10 flex flex-col items-center gap-4 bg-white/[0.01] cursor-pointer hover:bg-white/[0.03] transition-all group"
                         >
                          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white group-hover:bg-white/10 transition-colors shadow-inner">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6.75a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6.75v11.25a1.5 1.5 0 001.5 1.5zM12 12.75h.007v.007H12v-.007z" /></svg>
                          </div>
                          <div className="text-center">
                            <span className="text-[9px] font-black text-white uppercase tracking-widest block">Acervo de Galeria</span>
                            <span className="text-[6px] text-slate-600 font-bold uppercase">({wikiGallery.length} Ativos)</span>
                          </div>
                          {wikiGallery.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto no-scrollbar py-2 w-full px-4">
                               {wikiGallery.map((img, i) => (
                                 <div key={i} className="relative w-16 h-12 shrink-0 rounded-lg border border-white/10 overflow-hidden group">
                                    <img src={img} className="w-full h-full object-cover" />
                                    <button onClick={(e) => { e.stopPropagation(); setWikiGallery(prev => prev.filter((_, idx) => idx !== i)); }} className="absolute top-0 right-0 p-1 bg-black/60 rounded-bl-lg text-[8px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                 </div>
                               ))}
                            </div>
                          )}
                         </section>
                      </div>
                   </div>

                   <section className="px-8 py-8 space-y-3 border-b border-white/5">
                      <label className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] ml-1">Sinais de Indexação (Tags)</label>
                      <input 
                        value={wikiKeywords} 
                        onChange={(e) => setWikiKeywords(e.target.value)} 
                        placeholder="EX: HUMANO, SETOR_FROST, REBELDE..." 
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-[10px] font-black text-cyan-400 outline-none focus:border-cyan-500/40 placeholder:text-slate-800 uppercase tracking-widest shadow-inner" 
                      />
                   </section>

                   <section className="px-8 py-10 space-y-4 border-b border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] ml-1">Iniciar relatório narrativo</label>
                        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
                          <button onClick={() => insertTag('B')} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 text-white font-black text-[10px] hover:bg-white/10 transition-all">B</button>
                          <button onClick={() => insertTag('I')} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 text-white italic text-[10px] hover:bg-white/10 transition-all">I</button>
                          <button onClick={() => insertTag('U')} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 text-white underline text-[10px] hover:bg-white/10 transition-all">U</button>
                          <button onClick={() => insertTag('C')} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 text-white text-[10px] hover:bg-white/10 transition-all">C</button>
                          <div className="w-[1px] h-4 bg-white/10 mx-0.5" />
                          <button onClick={() => wikiNarrativeImageRef.current?.click()} className="w-7 h-7 flex items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-all">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          </button>
                        </div>
                      </div>
                      <textarea 
                        ref={editorTextAreaRef}
                        value={editorContent} 
                        onChange={(e) => setEditorContent(e.target.value)} 
                        placeholder="Narre a trajetória, as sombras e os segredos deste registro no vácuo galáctico..." 
                        className="w-full bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-8 text-sm text-slate-300 outline-none focus:border-white/20 min-h-[350px] resize-none leading-relaxed shadow-inner" 
                      />
                   </section>

                   <section className="bg-black/40">
                      <div className="px-8 py-5 border-y border-white/5 flex items-center justify-between bg-white/[0.02]">
                        <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.5em]">Matriz de Dados Técnicos</h3>
                        <button 
                          onClick={() => setWikiInfoRows([...wikiInfoRows, { label: '', value: '' }])} 
                          className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all border border-white/20"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M12 4.5v15m7.5-7.5h-15" /></svg>
                        </button>
                      </div>
                      <div className="divide-y divide-white/5">
                        {wikiInfoRows.map((row, idx) => (
                          <div key={idx} className="flex items-center px-8 py-5 group hover:bg-white/[0.02] transition-colors gap-6">
                            <div className="flex-1 space-y-1.5">
                                <span className="text-[6px] font-black text-slate-700 uppercase tracking-widest ml-1">Rótulo</span>
                                <input 
                                  value={row.label} 
                                  onChange={(e) => {
                                    const newRows = [...wikiInfoRows];
                                    newRows[idx].label = e.target.value;
                                    if (e.target.value.toLowerCase().includes('avalia')) {
                                        newRows[idx].type = 'rating_star';
                                    }
                                    setWikiInfoRows(newRows);
                                  }} 
                                  className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-[10px] font-black text-white outline-none focus:border-white/30 uppercase" 
                                  placeholder="TITULO" 
                                />
                            </div>
                            <div className="flex-[1.5] space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[6px] font-black text-slate-700 uppercase tracking-widest ml-1">Valor</span>
                                  <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/10">
                                      {['text', 'rating_star', 'rating_heart'].map(t => (
                                          <button 
                                              key={t}
                                              onClick={() => {
                                                  const newRows = [...wikiInfoRows];
                                                  newRows[idx].type = t as any;
                                                  if (t !== 'text') newRows[idx].value = '0';
                                                  setWikiInfoRows(newRows);
                                              }}
                                              className={`p-1 rounded transition-all ${row.type === t ? 'bg-cyan-500 text-black' : 'text-white/40 hover:text-white/60'}`}
                                          >
                                              {t === 'text' ? <span className="text-[6px] font-black px-1">TXT</span> : t === 'rating_star' ? <StarIcon active={true} className="w-3 h-3" /> : <HeartIcon active={true} className="w-3 h-3" />}
                                          </button>
                                      ))}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {row.type === 'rating_star' || row.type === 'rating_heart' ? (
                                        <div className="flex-1 flex gap-2 py-1 bg-black/20 rounded-xl px-4 border border-white/5">
                                            {[1, 2, 3, 4, 5].map(v => (
                                                <button 
                                                    key={v}
                                                    onClick={() => {
                                                        const newRows = [...wikiInfoRows];
                                                        newRows[idx].value = String(v);
                                                        setWikiInfoRows(newRows);
                                                    }}
                                                    className={`transition-all ${Number(row.value) >= v ? 'text-cyan-400 scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'text-white/10 scale-90'}`}
                                                >
                                                    {row.type === 'rating_star' ? <StarIcon active={Number(row.value) >= v} className="w-6 h-6" /> : <HeartIcon active={Number(row.value) >= v} className="w-6 h-6" />}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <input 
                                          value={row.value} 
                                          onChange={(e) => {
                                            const newRows = [...wikiInfoRows];
                                            newRows[idx].value = e.target.value;
                                            setWikiInfoRows(newRows);
                                          }} 
                                          className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-[10px] font-bold text-white outline-none focus:border-white/30 uppercase" 
                                          placeholder="CONTEÚDO" 
                                        />
                                    )}
                                    <button 
                                      onClick={() => setWikiInfoRows(wikiInfoRows.filter((_, i) => i !== idx))} 
                                      className="w-8 h-8 flex items-center justify-center bg-purple-500/10 hover:bg-purple-500 text-purple-500 hover:text-white rounded-xl transition-all active:scale-90 shrink-0"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12"/></svg>
                                    </button>
                                </div>
                            </div>
                          </div>
                        ))}
                      </div>
                   </section>
                </div>
              ) : (
                <div className="max-w-xl mx-auto flex flex-col pb-40 animate-in fade-in duration-700">
                   <div className="relative w-full h-48 md:h-64 overflow-hidden">
                      <SlideshowWallpaper 
                        images={wikiTopImages.length > 0 ? wikiTopImages.map(i => i.src) : (wikiBgImage || wikiAvatar ? [wikiBgImage || wikiAvatar] : [])} 
                        color={wikiTopColor} 
                        opacity={wikiHideOverlay ? 1 : 0.8} 
                        filter="none" 
                        noGradient={wikiHideOverlay}
                        bottomColor={wikiBgColor}
                      />
                      {!wikiHideOverlay && <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-black/20" />}
                   </div>

                   <div className="px-8 -mt-12 relative z-10 flex flex-col items-center">
                      <div className="w-24 h-24 rounded-3xl bg-[#02040a] p-1 shadow-2xl">
                         <div className="w-full h-full rounded-[1.4rem] overflow-hidden border border-white/10">
                            <img src={wikiAvatar || currentUserAvatar} className="w-full h-full object-cover" />
                         </div>
                      </div>
                      <h1 className="mt-4 text-2xl font-black text-white uppercase tracking-tight text-center">{editorTitle || "REGISTRO SEM NOME"}</h1>
                      <div className="flex flex-wrap justify-center gap-2 mt-3">
                         {wikiKeywords.split(',').map((k, i) => k.trim() && (
                           <span key={i} className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[7px] font-black text-cyan-400 uppercase tracking-widest">{k.trim()}</span>
                         ))}
                      </div>
                   </div>

                   <div className="px-8 mt-10 space-y-8">
                      <div className="text-[14px] leading-relaxed text-slate-300 space-y-4" dangerouslySetInnerHTML={{ __html: formatBioText(editorContent, undefined, true) }} />
                      
                      {wikiGallery.length > 0 && (
                        <div className="grid grid-cols-2 gap-3">
                           {wikiGallery.map((img, i) => (
                             <div key={i} className="aspect-video rounded-2xl overflow-hidden border border-white/10 bg-white/5 shadow-xl">
                                <img src={img} className="w-full h-full object-cover" />
                             </div>
                           ))}
                        </div>
                      )}

                      {wikiInfoRows.length > 0 && (
                        <div className="rounded-[2rem] border border-white/10 bg-white/[0.02] overflow-hidden shadow-2xl">
                           <div className="px-6 py-4 bg-white/[0.03] border-b border-white/5">
                              <h3 className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em]">Especificações Técnicas</h3>
                           </div>
                           <div className="divide-y divide-white/5">
                              {wikiInfoRows.map((row, i) => (
                                <div key={i} className="px-6 py-4 flex justify-between items-center gap-4">
                                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{row.label || "N/A"}</span>
                                   <div className="text-right">
                                      {row.type === 'rating_star' || row.type === 'rating_heart' ? (
                                        <div className="flex gap-1">
                                           {[1, 2, 3, 4, 5].map(v => (
                                             <span key={v} className={Number(row.value) >= v ? 'text-cyan-400' : 'text-white/5'}>
                                                {row.type === 'rating_star' ? <StarIcon active={Number(row.value) >= v} className="w-3.5 h-3.5" /> : <HeartIcon active={Number(row.value) >= v} className="w-3.5 h-3.5" />}
                                             </span>
                                           ))}
                                        </div>
                                      ) : (
                                        <span className="text-[10px] font-bold text-white uppercase">{row.value || "---"}</span>
                                      )}
                                   </div>
                                </div>
                              ))}
                           </div>
                        </div>
                      )}
                   </div>
                </div>
              )
            ) : (
              editorViewMode === 'editor' ? (
                <div className="max-w-2xl mx-auto space-y-6">
                   <input value={editorTitle} onChange={(e) => setEditorTitle(e.target.value)} placeholder="TÍTULO DA ENTRADA" className="w-full bg-transparent border-none text-2xl font-black text-white outline-none placeholder:text-white/10 uppercase tracking-tighter" />
                   <div className="relative">
                      <textarea ref={editorTextAreaRef} value={editorContent} onChange={(e) => setEditorContent(e.target.value)} placeholder="Narre sua trajetória..." className="w-full bg-transparent border-none text-[14px] leading-relaxed text-white outline-none placeholder:text-white/5 min-h-[400px] resize-none" />
                      <button onClick={() => editorImageInputRef.current?.click()} className="absolute bottom-4 right-0 p-3 bg-cyan-500 text-black rounded-2xl shadow-xl active:scale-90 transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      </button>
                      <input type="file" ref={editorImageInputRef} className="hidden" accept="image/*" onChange={(e) => handleInsertBioImage(e, false)} />
                   </div>
                </div>
              ) : (
                <div className="relative z-10 w-full animate-in fade-in duration-700 pb-40">
                   {/* Banner / Header Section */}
                   <div className="relative w-full h-48 md:h-64 overflow-hidden">
                      <SlideshowWallpaper 
                        images={wikiTopImages.length > 0 ? wikiTopImages.map(img => img.src) : (wikiGallery.length > 0 ? wikiGallery : [])} 
                        color={wikiTopColor} 
                        opacity={wikiHideOverlay ? 1 : 0.8} 
                        filter="none" 
                        noGradient={wikiHideOverlay}
                        bottomColor={wikiBgColor}
                      />
                      {!wikiHideOverlay && <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-black/20" />}
                   </div>

                   <div className="max-w-2xl mx-auto px-6 -mt-12 relative z-20 space-y-4">
                      {/* Header: Avatar and Title left aligned */}
                      <div className="flex items-end gap-6">
                         {wikiAvatar && (
                           <div className="w-28 h-28 rounded-3xl border-4 overflow-hidden shadow-2xl shrink-0 bg-[#1a2036]" style={{ borderColor: wikiBgColor === 'transparent' ? '#02040a' : wikiBgColor }}>
                             <img src={wikiAvatar} className="w-full h-full object-cover" />
                           </div>
                         )}
                         <div className="flex flex-col pb-2">
                            <h1 className="text-xl font-black uppercase tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                              {editorTitle || "SEM TÍTULO"}
                            </h1>
                         </div>
                      </div>

                      {/* Tags centered below title section */}
                      {wikiKeywords && (
                        <div className="flex justify-start pl-1 -mt-2">
                           <div className="opacity-60 text-[8px] font-black uppercase tracking-[0.3em] text-left bg-white/5 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
                              {wikiKeywords.split(',').map(tag => `#${tag.trim()}`).join(' ')}
                           </div>
                        </div>
                      )}

                      {/* Creator info and Narrative content */}
                      <div className="space-y-4 pt-6 border-t border-white/5">
                         {/* Technical Data Matrix */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {wikiInfoRows.map((row, i) => row.label && row.value && (
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

                         <div className="text-[13px] leading-relaxed text-white px-1 font-inter" dangerouslySetInnerHTML={{ __html: formatBioText(editorContent, undefined, true) }} />

                {/* Wiki Top Images as Medium Cards (Imagens de +Adicionar) */}
                {wikiTopImages.length > 0 && (
                  <div className="flex gap-4 overflow-x-auto no-scrollbar w-full pt-4 pb-2">
                    {wikiTopImages.map((imgObj, i) => (
                      <div key={i} className="aspect-video w-48 shrink-0 rounded-2xl border border-white/10 overflow-hidden bg-black/20 shadow-xl">
                        <img src={imgObj.src} className="w-full h-full object-cover" alt={`Top Image ${i}`} />
                      </div>
                    ))}
                  </div>
                )}

                         <div className="flex flex-col items-start gap-3 pt-1">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full border border-white/20 overflow-hidden">
                                  <img src={member.avatar} className="w-full h-full object-cover" alt="Creator" />
                                </div>
                               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{member.personaName || member.userId}</span>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              )
            )}
          </main>
        </div>
      )}

      <input type="file" ref={wikiAvatarRef} className="hidden" accept="image/*" onChange={(e) => handleImageInput(e, setWikiAvatar)} />
      <input type="file" ref={wikiTopRef} className="hidden" accept="image/*" onChange={handleWikiTopUpload} />
      <input type="file" ref={wikiBgRef} className="hidden" accept="image/*" onChange={(e) => handleImageInput(e, setWikiBgImage)} />
      <input type="file" ref={wikiGalleryRef} className="hidden" accept="image/*" onChange={handleInsertWikiGallery} />
      <input type="file" ref={wikiNarrativeImageRef} className="hidden" accept="image/*" onChange={(e) => handleInsertBioImage(e, true)} />

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .hd-4k-rendering { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: optimizeLegibility; }
        .4k-texture { image-rendering: high-quality; transform: translateZ(0); }
        .not-italic-fix { font-style: italic !important; }
        @keyframes mural-slide-up { 0% { transform: translateY(100%); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        .animate-mural-slide-up { animation: mural-slide-up 0.6s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
      `}} />
    </div>
  );
};

export default CommunityProfileView;
