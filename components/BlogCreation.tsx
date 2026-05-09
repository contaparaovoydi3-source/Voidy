
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FeedPost, PostComment } from '../types';

interface BlogCreationProps {
  onBack: () => void;
  onCreate: (post: FeedPost) => void;
  userName: string;
  userAvatar: string;
  verifySafety?: (content: string, type?: 'image' | 'text') => Promise<boolean>;
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

const getWallpaperOpacity = (color: string) => {
  if (!color || color === 'transparent' || color === '#00000000') return 1;
  const hsla = hexToHsla(color);
  if (hsla.l < 10) return 0.25;
  return 0.75;
};

const getWallpaperFilter = (color: string) => {
  if (!color || color === 'transparent' || color === '#00000000') return 'none';
  const hsla = hexToHsla(color);
  if (hsla.l < 10) return 'saturate(0.5) brightness(0.4)';
  return 'none';
};

const BlogCreation: React.FC<BlogCreationProps> = ({ onBack, onCreate, userName, userAvatar, verifySafety }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');
  const [showStyleHub, setShowStyleHub] = useState(false);
  
  // Style states
  const [topColor, setTopColor] = useState('#1a2036');
  const [feedColor, setFeedColor] = useState('#02040a');
  const [topImage, setTopImage] = useState<string | null>(null);
  const [feedImage, setFeedImage] = useState<string | null>(null);
  const [hideTopOverlay, setHideTopOverlay] = useState(false);

  const [activePicker, setActivePicker] = useState<{ field: string, label: string } | null>(null);
  const [pickerHsla, setPickerHsla] = useState({ h: 0, s: 100, l: 50, a: 1 });

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const topImageInputRef = useRef<HTMLInputElement>(null);
  const feedImageInputRef = useRef<HTMLInputElement>(null);
  const editorTextAreaRef = useRef<HTMLTextAreaElement>(null);

  const textColor = useMemo(() => getAutoContrastHex(feedColor), [feedColor]);
  const topTextColor = useMemo(() => getAutoContrastHex(topColor), [topColor]);

  useEffect(() => {
    const key = `void_draft_blog_${userName}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.title) setTitle(data.title);
        if (data.content) setContent(data.content);
        if (data.topColor) setTopColor(data.topColor);
        if (data.feedColor) setFeedColor(data.feedColor);
        if (data.topImage) setTopImage(data.topImage);
        if (data.feedImage) setFeedImage(data.feedImage);
        if (data.hideTopOverlay !== undefined) setHideTopOverlay(data.hideTopOverlay);
      }
    } catch (e) {
      console.error("Failed to recover blog draft", e);
    }
  }, [userName]);

  useEffect(() => {
    const key = `void_draft_blog_${userName}`;
    const timeout = setTimeout(() => {
      try {
        const data = { title, content, topColor, feedColor, topImage, feedImage, hideTopOverlay };
        localStorage.setItem(key, JSON.stringify(data));
      } catch (e) {
        console.error("Failed to save blog draft", e);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [title, content, topColor, feedColor, topImage, feedImage, userName]);

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

  const handleInsertBioImage = (e: React.ChangeEvent<HTMLInputElement>, isBio: boolean) => {
    const target = e.target;
    const file = target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const imgId = Math.random().toString(36).substring(2, 7);
        const fullId = `img_${imgId}`;
        try {
          localStorage.setItem('vimg_' + fullId, base64);
          setContent(prev => {
              const start = editorTextAreaRef.current?.selectionStart ?? prev.length;
              const end = editorTextAreaRef.current?.selectionEnd ?? start;
              const before = prev.substring(0, start);
              const after = prev.substring(end);
              return `${before}[${fullId} h=150 p=50 w=100 a=c] ""${after}`;
          });
          if (verifySafety) verifySafety(base64).catch(console.error);
        } catch (err) { alert("Erro ao gravar dados: Limite de armazenamento local excedido."); }
        target.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const openPicker = (field: string, label: string, currentHex: string) => {
    setActivePicker({ field, label });
    const hsla = hexToHsla(currentHex === 'transparent' ? '#1a2036' : currentHex);
    setPickerHsla(hsla);
  };

  const updatePickerColor = (h: number, s: number, l: number, a: number) => {
    const newHex = hslaToHex(h, s, l, a);
    setPickerHsla({ h, s, l, a });
    if (activePicker?.field === 'top') setTopColor(newHex);
    else if (activePicker?.field === 'feed') setFeedColor(newHex);
  };

  const handleResetColor = (field: string) => {
    if (field === 'top') setTopColor('#1a2036');
    else if (field === 'feed') setFeedColor('#02040a');
    setActivePicker(null);
  };

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) return;
    
    if (verifySafety) {
      const isTitleSafe = await verifySafety(title, 'text');
      if (!isTitleSafe) return;
      const isContentSafe = await verifySafety(content, 'text');
      if (!isContentSafe) return;
    }

    const newPost: FeedPost = {
      id: `blog-${Date.now()}`,
      author: userName,
      avatar: userAvatar,
      title: title.toUpperCase(),
      content: content,
      likes: 0,
      time: 'Agora',
      tag: 'BLOG',
      timestamp: Date.now(),
      comments: [],
      customTopColor: topColor,
      customBgColor: feedColor,
      customTopImage: topImage || undefined,
      customBgImage: feedImage || undefined,
      customBgType: feedImage ? 'image' : 'color',
      hideTopOverlay: hideTopOverlay
    };
    onCreate(newPost);
    localStorage.removeItem(`void_draft_blog_${userName}`);
  };

  return (
    <div className="fixed inset-0 z-[500] flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden font-inter transition-colors duration-500" style={{ backgroundColor: feedColor === 'transparent' ? '#02040a' : feedColor }}>
      
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {feedImage && (
          <div className="absolute inset-0 w-full h-full bg-cover bg-center transition-all duration-500" style={{ backgroundImage: `url(${feedImage})`, WebkitMaskImage: 'linear-gradient(to bottom, transparent 0px, black 320px)', maskImage: 'linear-gradient(to bottom, transparent 0px, black 320px)', opacity: getWallpaperOpacity(feedColor), filter: getWallpaperFilter(feedColor), imageRendering: 'high-quality' }} />
        )}
      </div>

      <div className="w-full min-h-full flex flex-col relative z-10">
        <div className="absolute top-0 inset-x-0 h-[460px] z-0 overflow-hidden transition-all duration-500" style={{ background: hideTopOverlay ? 'transparent' : `linear-gradient(to bottom, ${topColor === 'transparent' ? '#00000000' : topColor} 0%, ${topColor === 'transparent' ? '#00000000' : topColor} 30%, ${feedColor === 'transparent' ? '#00000000' : (feedColor === '#02040a' ? '#000' : feedColor)} 92%, ${feedColor === 'transparent' ? '#00000000' : (feedColor === '#02040a' ? '#000' : feedColor)} 100%)`, WebkitMaskImage: 'linear-gradient(to bottom, black 240px, transparent 460px)', maskImage: 'linear-gradient(to bottom, black 240px, transparent 460px)' }} >
           {topImage && ( <img src={topImage} className={`w-full h-full object-cover transition-all duration-500`} style={{ opacity: getWallpaperOpacity(topColor), filter: getWallpaperFilter(topColor), imageRendering: 'high-quality' }} /> )}
           <div className="absolute bottom-0 left-0 w-full h-full z-[5] pointer-events-none" style={{ backgroundImage: `linear-gradient(to top, ${feedColor === 'transparent' ? '#02040a' : feedColor} 0%, transparent 60%)` }} />
        </div>

        <header className="relative z-[1000] px-6 py-6 flex items-center justify-between shrink-0">
          <button onClick={onBack} className="p-2 bg-black/40 backdrop-blur-md rounded-xl text-white border border-white/10 active:scale-90 transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M15 19l-7-7 7-7"/></svg>
          </button>
          
          <div className="flex gap-4 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
             <button onClick={() => setViewMode('editor')} className={`text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'editor' ? 'text-cyan-400' : 'text-slate-400'}`}>Editor</button>
             <button onClick={() => setViewMode('preview')} className={`text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'preview' ? 'text-cyan-400' : 'text-slate-400'}`}>Prévia</button>
          </div>

          <div className="flex gap-2">
             <button onClick={() => setShowStyleHub(!showStyleHub)} className={`p-2 rounded-xl transition-all border backdrop-blur-md ${showStyleHub ? 'bg-cyan-500 border-cyan-400 text-black' : 'bg-black/40 border-white/10 text-white'}`}>🎨</button>
             <button 
               onClick={handlePublish}
               disabled={!title.trim() || !content.trim()}
               className="px-6 py-2.5 bg-white text-black rounded-full text-[9px] font-black uppercase tracking-widest active:scale-95 disabled:opacity-10 transition-all shadow-lg"
             >
               Publicar
             </button>
          </div>
        </header>

        <main className="relative z-10 flex-1 overflow-y-auto no-scrollbar p-6 pt-12 pb-48">
          {showStyleHub && (
             <section className="max-w-2xl mx-auto mb-8 animate-in slide-in-from-top-4 duration-500 pointer-events-auto relative z-[100]">
                <div className="bg-[#e0f2f1]/95 backdrop-blur-2xl rounded-[1.8rem] p-4 border border-white/10 shadow-2xl">
                   <div className="flex justify-between items-start mb-4">
                     <div className="flex flex-col"> 
                       <h3 className="text-[#1a2036] font-black text-[9px] tracking-widest uppercase">SISTEMA_V_2.4</h3> 
                       <span className="text-[#1a2036]/40 text-[5px] font-bold uppercase">MATRIZ DE ESTILO TRANSMISSÃO...</span> 
                     </div>
                     <button onClick={() => { setShowStyleHub(false); setActivePicker(null); }} className="text-[#1a2036] font-black text-[8px] uppercase px-3 py-1 bg-black/10 rounded-full">FECHAR</button>
                   </div>
                   
                   <div className="space-y-4">
                      <div className="space-y-3">
                         <span className="text-[5px] font-black text-[#1a2036]/60 uppercase ml-1 tracking-[0.2em]">MATRIZ CROMÁTICA</span>
                         <div className="flex justify-center gap-8">
                           <div className="flex flex-col items-center gap-1.5 relative group/color">
                             <button onClick={() => openPicker('top', 'COR_TOPO', topColor)} className={`w-12 h-12 rounded-full border-2 p-0.5 transition-all hover:scale-105 shadow-md ${activePicker?.field === 'top' ? 'ring-2 ring-cyan-500 ring-offset-2' : ''}`} style={{ borderColor: topColor }}>
                               <div className="w-full h-full rounded-full" style={{ backgroundColor: topColor }} />
                             </button>
                             {topColor !== '#1a2036' && (
                               <button onClick={() => handleResetColor('top')} className="absolute -top-2 -right-2 w-4 h-4 bg-black/40 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-[10px] text-white hover:text-white transition-all shadow-md z-[120]">✕</button>
                             )}
                             <span className="text-[4px] font-black text-[#1a2036] uppercase">TOPO_HUB</span>
                           </div>
                           <div className="flex flex-col items-center gap-1.5 relative group/color">
                             <button onClick={() => openPicker('feed', 'COR_FEED', feedColor)} className={`w-12 h-12 rounded-full border-2 p-0.5 transition-all hover:scale-105 shadow-md ${activePicker?.field === 'feed' ? 'ring-2 ring-cyan-500 ring-offset-2' : ''}`} style={{ borderColor: feedColor }}>
                               <div className="w-full h-full rounded-full" style={{ backgroundColor: feedColor }} />
                             </button>
                             {feedColor !== '#02040a' && (
                               <button onClick={() => handleResetColor('feed')} className="absolute -top-2 -right-2 w-4 h-4 bg-black/40 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-[10px] text-white hover:text-white transition-all shadow-md z-[120]">✕</button>
                             )}
                             <span className="text-[4px] font-black text-[#1a2036] uppercase">FUNDO_HUB</span>
                           </div>
                         </div>

                         {activePicker && (
                           <div className="mt-4 p-4 bg-white/40 rounded-2xl border border-white/40 animate-in zoom-in">
                             <div className="flex justify-between items-center mb-3 px-1"> 
                               <span className="text-[7px] font-black text-[#1a2036] uppercase tracking-widest">{activePicker.label}</span> 
                               <button onClick={() => setActivePicker(null)} className="text-[#1a2036] font-bold text-[12px]">✕</button> 
                             </div>
                             <div className="space-y-4">
                               <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                 <div className="space-y-1">
                                   <div className="flex justify-between items-center px-1"><span className="text-[5px] font-bold text-[#1a2036]/60 uppercase">Matiz</span><span className="text-[5px] font-black text-[#1a2036]">{pickerHsla.h}°</span></div>
                                   <input type="range" min="0" max="360" value={pickerHsla.h} onChange={(e) => updatePickerColor(Number(e.target.value), pickerHsla.s, pickerHsla.l, 1)} className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-cyan-500 via-blue-500 to-purple-500" />
                                 </div>
                                 <div className="space-y-1">
                                   <div className="flex justify-between items-center px-1"><span className="text-[5px] font-bold text-[#1a2036]/60 uppercase">Saturação</span><span className="text-[5px] font-black text-[#1a2036]">{pickerHsla.s}%</span></div>
                                   <input type="range" min="0" max="100" value={pickerHsla.s} onChange={(e) => updatePickerColor(pickerHsla.h, Number(e.target.value), pickerHsla.l, 1)} className="w-full h-1.5 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, hsl(${pickerHsla.h}, 0%, ${pickerHsla.l}%), hsl(${pickerHsla.h}, 100%, ${pickerHsla.l}%))` }} />
                                 </div>
                               </div>
                               <div className="space-y-1">
                                 <div className="flex justify-between items-center px-1"><span className="text-[5px] font-bold text-[#1a2036]/60 uppercase">Brilho</span><span className="text-[5px] font-black text-[#1a2036]">{pickerHsla.l}%</span></div>
                                 <input type="range" min="0" max="100" value={pickerHsla.l} onChange={(e) => updatePickerColor(pickerHsla.h, pickerHsla.s, Number(e.target.value), 1)} className="w-full h-1.5 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #000, hsl(${pickerHsla.h}, ${pickerHsla.s}%, 50%), #fff)` }} />
                               </div>
                             </div>
                           </div>
                         )}
                      </div>

                      <div className="space-y-1.5">
                         <span className="text-[5px] font-black text-[#1a2036]/60 uppercase ml-1 tracking-[0.2em]">ATIVOS VISUAIS</span>
                         <div className="flex gap-4 px-1">
                            <div className="relative"> 
                               <div onClick={() => topImageInputRef.current?.click()} className={`w-14 h-14 rounded-2xl bg-slate-900 border-2 overflow-hidden flex flex-col items-center justify-center cursor-pointer shadow-sm transition-all shrink-0 border-white/20 hover:border-[#1a2036]`}>
                                  {topImage ? <img src={topImage} className="w-full h-full object-cover" /> : <span className="text-xl opacity-20">🖼️</span>}
                                  <div className="absolute inset-x-0 bottom-0 bg-black/40 text-[4px] font-bold text-white text-center uppercase py-0.5">Topo</div>
                               </div> 
                               {topImage && <button onClick={() => setTopImage(null)} className="absolute -top-2 -right-2 w-5 h-5 bg-black/60 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-[12px] text-white hover:text-white transition-all shadow-md z-[120]">✕</button>}
                            </div>
                            <div className="relative"> 
                               <div onClick={() => feedImageInputRef.current?.click()} className={`w-14 h-14 rounded-2xl bg-slate-900 border-2 overflow-hidden flex flex-col items-center justify-center cursor-pointer shadow-sm transition-all shrink-0 border-white/20 hover:border-[#1a2036]`}>
                                  {feedImage ? <img src={feedImage} className="w-full h-full object-cover" /> : <span className="text-xl opacity-20">🎨</span>}
                                  <div className="absolute inset-x-0 bottom-0 bg-black/40 text-[4px] font-bold text-white text-center uppercase py-0.5">Fundo</div>
                               </div> 
                               {feedImage && <button onClick={() => setFeedImage(null)} className="absolute -top-2 -right-2 w-5 h-5 bg-black/60 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-[10px] text-white hover:text-white transition-all shadow-md z-[120]">✕</button>}
                            </div>
                            <div className="flex flex-col items-center gap-1.5 relative">
                               <button 
                                 onClick={() => setHideTopOverlay(!hideTopOverlay)}
                                 className={`w-14 h-14 rounded-2xl border-2 flex flex-col items-center justify-center transition-all shadow-sm relative overflow-hidden ${hideTopOverlay ? 'bg-cyan-500 border-cyan-400 text-black' : 'bg-slate-900 border-white/20 text-white/40'}`}
                               >
                                 <span className="text-lg">{hideTopOverlay ? '👁️' : '🕶️'}</span>
                                 <div className="absolute inset-x-0 bottom-0 bg-black/40 text-[4px] font-bold text-white text-center uppercase py-0.5">Overlay</div>
                               </button>
                               <span className="text-[4px] font-black text-[#1a2036] uppercase">{hideTopOverlay ? 'OCULTO' : 'VISÍVEL'}</span>
                            </div>
                         </div>
                         <input type="file" ref={topImageInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageInput(e, setTopImage)} />
                         <input type="file" ref={feedImageInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageInput(e, setFeedImage)} />
                      </div>
                   </div>
                </div>
             </section>
          )}

          <div className="max-w-2xl mx-auto space-y-6">
            <div className="space-y-2 mb-10">
               {viewMode === 'editor' ? (
                 <input 
                   value={title} 
                   onChange={(e) => setTitle(e.target.value)} 
                   placeholder="TÍTULO DA TRANSMISSÃO" 
                   className="w-full bg-transparent border-none text-xl font-bold outline-none p-0 uppercase drop-shadow-2xl text-center" 
                   style={{ color: topTextColor }}
                 />
               ) : (
                 <h1 className="text-3xl font-black uppercase tracking-tight leading-none text-center drop-shadow-2xl animate-in fade-in" style={{ color: topTextColor }}>
                   {title || "SEM TÍTULO"}
                 </h1>
               )}
            </div>

            <div className="relative pt-6">
               {viewMode === 'editor' ? (
                 <>
                   <textarea 
                     ref={editorTextAreaRef}
                     value={content} 
                     onChange={(e) => setContent(e.target.value)} 
                     placeholder="Sua história começa aqui..." 
                     className="w-full bg-transparent border-none text-base leading-relaxed outline-none placeholder:text-white/10 resize-none min-h-[300px] p-0" 
                     style={{ color: textColor }}
                   />
                   <button 
                     onClick={() => galleryInputRef.current?.click()} 
                     className="fixed bottom-10 right-10 w-16 h-16 bg-cyan-600 text-white rounded-2xl shadow-2xl flex items-center justify-center active:scale-90 transition-all z-[100] border border-cyan-400/50"
                   >
                     <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                     <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" onChange={(e) => handleInsertBioImage(e, false)} />
                   </button>
                 </>
               ) : (
                 <div className="text-lg leading-relaxed font-medium animate-in fade-in" style={{ color: textColor }} dangerouslySetInnerHTML={{ __html: formatBioText(content) }} />
               )}
            </div>
          </div>
        </main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .hd-4k-rendering { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: optimizeLegibility; }
        .not-italic-fix { font-style: italic !important; }
      `}} />
    </div>
  );
};

export default BlogCreation;
