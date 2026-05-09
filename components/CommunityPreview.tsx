
import React from 'react';
import { Community } from '../types';

interface CommunityPreviewProps {
  community: Community;
  onBack: () => void;
  onJoin: (id: string) => void;
}

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
                    <img src="${savedSrc}" loading="lazy" decoding="async" class="absolute inset-0 w-full h-full object-cover" style="${renderStyleBase}" />
                    <div class="absolute inset-0 bg-black/15 flex items-center justify-center p-2">
                       <div class="text-white font-black uppercase tracking-[0.25em] text-center text-[8px] md:text-[10px] select-none leading-tight">${formattedOverlay}</div>
                    </div>
                  </div>`;
      } else {
        imgHtml = `<div class="flex-1 min-w-0" style="${finalWidth ? `max-width: ${customWidth};` : ''}">
                  <img src="${savedSrc}" loading="lazy" decoding="async" class="w-full rounded-2xl object-cover block" style="${renderStyleBase} ${borderStyle} height: ${customHeight};" />
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

const CommunityPreview: React.FC<CommunityPreviewProps> = ({ community, onBack, onJoin }) => {
  const isFull = false;

  return (
    <div className="flex-1 h-full w-full bg-[#02040a] flex flex-col overflow-y-auto no-scrollbar font-inter text-white pb-32">
      <div className="relative w-full h-[220px] md:h-[420px] shrink-0 overflow-hidden">
        <img 
          src={community.homeCover || community.banner || 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=3840&auto=format&fit=crop'} 
          loading="lazy"
          decoding="async"
          fetchPriority="high"
          className="w-full h-full object-cover opacity-60" 
          alt="Banner" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-[#02040a]" />
        
        <button 
          onClick={onBack} 
          className="absolute top-6 left-6 p-2 bg-black/60 backdrop-blur-md rounded-xl text-white border border-white/10 active:scale-95 transition-all shadow-xl z-20"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
      </div>
      
      <div className="px-6 md:px-10 -mt-16 md:-mt-24 relative z-10 flex flex-col items-center text-center">
        <div className="w-28 h-28 md:w-40 md:h-40 rounded-[2rem] md:rounded-[3rem] border-[4px] border-[#02040a] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden bg-slate-900 mb-6">
          <img 
            src={community.avatar} 
            loading="lazy"
            decoding="async"
            fetchPriority="high"
            className="w-full h-full object-cover" 
            alt="Avatar" 
          />
        </div>
        
        <div className="mb-4">
          <h2 className="text-xl md:text-3xl font-black uppercase tracking-tighter leading-none mb-2">{community.name}</h2>
          <div className="flex items-center gap-2 justify-center">
            <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[8px] font-black text-cyan-400 uppercase tracking-widest">{community.theme || 'GERAL'}</span>
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Nível {community.level || 1}</span>
          </div>
        </div>
        
        <div className="w-full max-w-lg space-y-6 mb-8">
           <div className="flex flex-col gap-2">
              <h3 className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em]">Diretriz Operacional</h3>
              <p className="text-sm md:text-lg leading-relaxed font-semibold italic text-cyan-100/90 drop-shadow-md">
                "{community.catchphrase || 'Sincronia estável no vácuo.'}"
              </p>
           </div>
        </div>
        
        <div className="flex items-center gap-6 mt-2 mb-10">
           <div className="flex flex-col items-center">
              <span className="text-lg font-black text-white">{community.membersCount || 0}</span>
              <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">Consciências</span>
           </div>
           <div className="w-[1px] h-8 bg-white/10" />
           <div className="flex flex-col items-center">
              <span className="text-lg font-black text-white">{community.posts?.length || 0}</span>
              <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">Registros</span>
           </div>
        </div>

        <button 
          onClick={() => onJoin(community.id)} 
          className="w-full max-w-sm py-4 md:py-5 rounded-2xl md:rounded-[2.5rem] font-black text-[10px] md:text-xs uppercase tracking-[0.4em] shadow-[0_20px_50px_rgba(255,255,255,0.15)] active:scale-95 transition-all mb-10 bg-white text-black hover:bg-cyan-50"
        >
          Entrar na Comunidade
        </button>

        {/* Bibliografia formatada abaixo do botão */}
        <div className="w-full max-w-lg text-left px-4 animate-in fade-in duration-1000">
           <div className="text-xs md:text-sm leading-relaxed font-medium text-slate-400">
              <div dangerouslySetInnerHTML={{ __html: community.description ? formatBioText(community.description) : 'Nenhum registro de lore disponível para este setor.' }} />
           </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .not-italic-fix { font-style: italic !important; }
      `}} />
    </div>
  );
};

export default CommunityPreview;
