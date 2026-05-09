
import React, { useState } from 'react';
import { Community, CityMemberData } from '../types';

interface CommunitySettingsProps {
  community: Community;
  onBack: () => void;
  onUpdate: (updater: (comm: Community) => Community) => void;
  verifySafety?: (base64: string) => Promise<boolean>;
  onLeave?: () => void;
  userName: string;
}

const CommunitySettings: React.FC<CommunitySettingsProps> = ({ community, onBack, onLeave, userName }) => {
  const [viewMode, setViewMode] = useState<'MAIN' | 'BLOCKED_USERS' | 'DATA_VIEW' | 'HELP'>('MAIN');
  const [showConfirmLeave, setShowConfirmLeave] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);

  const handleLeaveFinal = () => {
    onLeave?.();
    setShowConfirmLeave(false);
  };

  const getShareUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}?join=${community.id}`;
  };

  const getShareText = () => {
    return `Sincronize-se com ${community.name} no VOIDY: ${community.catchphrase || 'Uma nova realidade no vácuo.'}`;
  };

  const copyToClipboard = async () => {
    const url = getShareUrl();
    try {
      // Tenta o método moderno
      await navigator.clipboard.writeText(url);
      alert('Link neural copiado para o terminal.');
    } catch (err) {
      // Fallback para quando o documento perde o foco ou não há suporte
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        alert('Link neural copiado via protocolo de contingência.');
      } catch (copyErr) {
        console.error('Falha crítica na cópia:', copyErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleSystemShare = () => {
    if (navigator.share) {
      navigator.share({
        title: community.name,
        text: getShareText(),
        url: getShareUrl(),
      }).catch(() => {
        copyToClipboard();
      });
    } else {
      copyToClipboard();
    }
  };

  const memberData = community.membersData?.[userName] as CityMemberData;

  if (viewMode === 'BLOCKED_USERS') {
    return (
      <div className="absolute inset-0 z-[700] flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden font-inter bg-[#02040a]">
        <header className="px-6 py-8 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between z-10">
          <button onClick={() => setViewMode('MAIN')} className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl text-[9px] font-black text-slate-400 uppercase border border-white/10 active:scale-95 transition-all">Voltar</button>
          <span className="text-[10px] font-syncopate font-black text-white uppercase tracking-[0.3em]">Lista de Restrição</span>
          <div className="w-10"></div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center opacity-20 text-center p-10">
           <span className="text-4xl mb-4">🚫</span>
           <p className="text-[10px] font-black uppercase tracking-[0.4em]">Nenhum sinal restrito detectado em seu link neural local.</p>
        </div>
      </div>
    );
  }

  if (viewMode === 'DATA_VIEW') {
    return (
      <div className="absolute inset-0 z-[700] flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden font-inter bg-[#02040a]">
        <header className="px-6 py-8 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between z-10">
          <button onClick={() => setViewMode('MAIN')} className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl text-[9px] font-black text-slate-400 uppercase border border-white/10 active:scale-95 transition-all">Voltar</button>
          <span className="text-[10px] font-syncopate font-black text-white uppercase tracking-[0.3em]">Registros de Dados</span>
          <div className="w-10"></div>
        </header>
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
           <div className="bg-white/5 rounded-[2rem] border border-white/10 p-6 space-y-4 shadow-2xl">
              <div className="flex flex-col gap-1">
                 <span className="text-[7px] font-black text-cyan-400 uppercase tracking-widest">Identificador</span>
                 <span className="text-xs font-bold text-white uppercase">{userName}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="flex flex-col gap-1">
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Nível no Setor</span>
                    <span className="text-sm font-black text-white font-orbitron">{memberData?.cityLevel || 1}</span>
                 </div>
                 <div className="flex flex-col gap-1">
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Reputação</span>
                    <span className="text-sm font-black text-white font-orbitron">{memberData?.cityReputation || 0}</span>
                 </div>
              </div>
              <div className="flex flex-col gap-1">
                 <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Início da Sincronia</span>
                 <span className="text-[10px] font-bold text-white uppercase">{new Date(memberData?.joinDate || Date.now()).toLocaleDateString()}</span>
              </div>
           </div>
           <p className="text-[8px] text-slate-500 uppercase font-bold text-center px-4 leading-relaxed">
             Estes dados são armazenados de forma descentralizada no núcleo desta Central Galáctica.
           </p>
        </div>
      </div>
    );
  }

  if (viewMode === 'HELP') {
    return (
      <div className="absolute inset-0 z-[700] flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden font-inter bg-[#02040a]">
        <header className="px-6 py-8 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between z-10 sticky top-0 shadow-lg shrink-0">
          <button onClick={() => setViewMode('MAIN')} className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl text-[9px] font-black text-slate-400 uppercase border border-white/10 active:scale-95 transition-all">Voltar</button>
          <span className="text-[10px] font-syncopate font-black text-white uppercase tracking-[0.3em]">Central de Escuta</span>
          <div className="w-10"></div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-10 no-scrollbar pb-32">
          <section className="space-y-4">
             <div className="flex items-center gap-3 ml-2">
                <div className="w-1 h-3 bg-cyan-500 rounded-full shadow-[0_0_8px_cyan]"></div>
                <h3 className="text-[9px] font-black text-white uppercase tracking-[0.3em]">Este Setor</h3>
             </div>
             <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 space-y-4">
                <div className="flex items-center gap-4">
                   <img src={community.avatar} className="w-12 h-12 rounded-2xl object-cover border border-white/10" alt="Setor" />
                   <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-widest">{community.name}</h4>
                      <span className="text-[7px] font-bold text-cyan-400 uppercase tracking-[0.2em]">{community.theme}</span>
                   </div>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                  {community.description || 'Setor operando em sincronia básica.'}
                </p>
                <div className="pt-2 border-t border-white/5">
                   <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest block mb-1">Contato do Líder</span>
                   <span className="text-[10px] font-bold text-white uppercase select-all">{community.leaders[0]}</span>
                </div>
             </div>
          </section>

          <section className="space-y-4">
             <div className="flex items-center gap-3 ml-2">
                <div className="w-1 h-3 bg-purple-500 rounded-full shadow-[0_0_8px_#a855f7]"></div>
                <h3 className="text-[9px] font-black text-white uppercase tracking-[0.3em]">O Ecossistema VOIDY</h3>
             </div>
             <div className="bg-purple-900/10 border border-purple-500/20 rounded-[2.5rem] p-8 text-center space-y-4">
                <div className="text-3xl mb-2">🪐</div>
                <h4 className="text-xs font-syncopate font-black text-white uppercase tracking-widest leading-tight">Plataforma de Narrativa Profunda</h4>
                <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
                  O VOIDY é um terminal de RPG e interação social projetado para consciências que buscam imersão absoluta. Através de links vocais e texto processado, construímos realidades soberanas no limiar da estática.
                </p>
                <div className="pt-4 flex flex-col items-center gap-2">
                   <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Suporte Drake.OS</span>
                   <div className="px-5 py-2 bg-black/40 rounded-xl border border-purple-500/40 text-[10px] font-bold text-white tracking-wider select-all">
                      voidynexus@gmail.com
                   </div>
                </div>
             </div>
          </section>

          <section className="space-y-4">
             <div className="flex items-center gap-3 ml-2">
                <div className="w-1 h-3 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]"></div>
                <h3 className="text-[9px] font-black text-white uppercase tracking-[0.3em]">Integridade & Segurança</h3>
             </div>
             <div className="grid grid-cols-1 gap-3">
                <div className="bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] space-y-2">
                   <h5 className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Privacidade de Link</h5>
                   <p className="text-[9px] text-slate-500 leading-relaxed font-medium uppercase tracking-tight">
                     Seus logs de chat e dados de operativo são armazenados em sincronia local. A Voidy não intercepta comunicações privadas para fins externos ao sistema de moderação.
                   </p>
                </div>
                <div className="bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] space-y-2">
                   <h5 className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Protocolo de Conduta</h5>
                   <p className="text-[9px] text-slate-500 leading-relaxed font-medium uppercase tracking-tight">
                     Interferências hostis ou conteúdo proibido resultam na expurgação imediata do sinal. Cada Líder de Setor é soberano para banir operativos de sua própria central.
                   </p>
                </div>
             </div>
          </section>

          <div className="pt-10 border-t border-white/5 text-center opacity-30">
             <span className="text-[7px] font-black text-slate-600 uppercase tracking-[0.5em]">Voidy Intelligence Protocol v1.0.4</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-[600] flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden font-inter bg-[#02040a]">
      <header className="px-6 py-8 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between z-50 shrink-0">
        <button onClick={onBack} className="p-2 text-slate-400 hover:text-white transition-all active:scale-90">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-xs font-syncopate font-black text-white uppercase tracking-[0.3em]">Configuração</h2>
          <span className="text-[7px] text-cyan-500 font-bold uppercase tracking-widest mt-1">Painel do Operativo</span>
        </div>
        <button 
          onClick={handleSystemShare}
          className="p-2 text-slate-500 hover:text-emerald-400 transition-all active:scale-90"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-6 no-scrollbar z-30 pb-32">
        <div className="max-w-2xl mx-auto space-y-3">
          <button 
            onClick={() => setViewMode('BLOCKED_USERS')}
            className="w-full p-5 rounded-[1.8rem] bg-white/[0.03] border border-white/10 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all hover:bg-white/[0.05]"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg shadow-inner">🚫</div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Sinais Bloqueados</span>
                <span className="text-[7px] text-slate-500 uppercase tracking-tighter">Gerenciar restrições</span>
              </div>
            </div>
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
          </button>

          <button 
            onClick={() => setIsShareMenuOpen(true)}
            className="w-full p-5 rounded-[1.8rem] bg-white/[0.03] border border-white/10 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all hover:bg-white/[0.05]"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg shadow-inner">📡</div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Partilhar Central</span>
                <span className="text-[7px] text-slate-500 uppercase tracking-tighter">Expandir a rede neural</span>
              </div>
            </div>
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
          </button>

          <button 
            onClick={() => setViewMode('DATA_VIEW')}
            className="w-full p-5 rounded-[1.8rem] bg-white/[0.03] border border-white/10 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all hover:bg-white/[0.05]"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg shadow-inner">💾</div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Ver Registros</span>
                <span className="text-[7px] text-slate-500 uppercase tracking-tighter">Seus dados neste setor</span>
              </div>
            </div>
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
          </button>

          <button 
            onClick={() => setViewMode('HELP')}
            className="w-full p-5 rounded-[1.8rem] bg-white/[0.03] border border-white/10 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all hover:bg-white/[0.05]"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg shadow-inner">❓</div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Central de Escuta</span>
                <span className="text-[7px] text-slate-500 uppercase tracking-tighter">Ajuda e suporte técnico</span>
              </div>
            </div>
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
          </button>

          <div className="pt-4">
            <button 
              onClick={() => setShowConfirmLeave(true)}
              className="w-full p-6 rounded-[2rem] bg-red-500/10 border border-red-500/20 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all hover:bg-red-500/20 shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center text-2xl shadow-inner">🚪</div>
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-black text-red-500 uppercase tracking-widest">Encerrar Sincronia</span>
                  <span className="text-[8px] text-red-500/60 uppercase tracking-widest font-bold">Abandonar este Setor</span>
                </div>
              </div>
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7"/></svg>
            </button>
          </div>
        </div>
      </main>

      {/* SHARE MENU MODAL */}
      {isShareMenuOpen && (
        <div className="fixed inset-0 z-[2100] flex items-end justify-center p-0 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsShareMenuOpen(false)} />
           <div className="relative w-full bg-[#0a0c1a] border-t border-cyan-500/30 rounded-t-[3rem] p-8 shadow-[0_-10px_50px_rgba(0,0,0,0.5)] flex flex-col gap-6 animate-in slide-in-from-bottom duration-500 pointer-events-auto">
              <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-2" />
              
              <div className="flex flex-col items-center text-center gap-2 mb-2">
                 <h3 className="text-sm font-syncopate font-black text-white uppercase tracking-widest">Expandir Frequência</h3>
                 <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Convide outras consciências para este setor</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <button 
                   onClick={copyToClipboard}
                   className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] transition-all active:scale-95 group"
                 >
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-inner">🔗</div>
                    <span className="text-[8px] font-black text-white uppercase tracking-widest">Copiar Link</span>
                 </button>

                 <button 
                   onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(getShareText() + " " + getShareUrl())}`, '_blank')}
                   className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] transition-all active:scale-95 group"
                 >
                    <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-inner">💬</div>
                    <span className="text-[8px] font-black text-white uppercase tracking-widest">WhatsApp</span>
                 </button>

                 <button 
                   onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(getShareUrl())}&text=${encodeURIComponent(getShareText())}`, '_blank')}
                   className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] transition-all active:scale-95 group"
                 >
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-inner">✈️</div>
                    <span className="text-[8px] font-black text-white uppercase tracking-widest">Telegram</span>
                 </button>

                 <button 
                   onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText())}&url=${encodeURIComponent(getShareUrl())}`, '_blank')}
                   className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] transition-all active:scale-95 group"
                 >
                    <div className="w-12 h-12 rounded-2xl bg-slate-500/10 border border-slate-500/30 flex items-center justify-center text-xl group-hover:scale-110 transition-transform shadow-inner">𝕏</div>
                    <span className="text-[8px] font-black text-white uppercase tracking-widest">Twitter / X</span>
                 </button>
              </div>

              <button 
                onClick={handleSystemShare}
                className="w-full py-5 bg-cyan-600 text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] active:scale-95 shadow-xl shadow-cyan-500/20 transition-all flex items-center justify-center gap-3"
              >
                <span>📦</span> Outras Opções (Sistema)
              </button>

              <button 
                onClick={() => setIsShareMenuOpen(false)}
                className="w-full py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white"
              >
                Abortar Transmissão
              </button>
           </div>
        </div>
      )}

      {/* TELA DE CONFIRMAÇÃO ESTILIZADA */}
      {showConfirmLeave && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setShowConfirmLeave(false)} />
           <div className="relative w-full max-w-[320px] bg-[#050714] border border-red-500/40 rounded-[3rem] p-8 shadow-[0_0_50px_rgba(239,68,68,0.2)] flex flex-col items-center text-center gap-6 pointer-events-auto">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-3xl shadow-inner animate-pulse">💀</div>
              <div className="space-y-2">
                 <h3 className="text-xs font-syncopate font-black text-white uppercase tracking-widest text-red-500">Encerrar Sincronia?</h3>
                 <p className="text-[10px] text-slate-400 font-medium leading-relaxed px-2 uppercase tracking-wider">Atenção: Ao encerrar sua sincronia, você perderá acesso ao link deste cluster e seus registros locais serão purgados.</p>
              </div>
              <div className="flex flex-col gap-3 w-full">
                 <button onClick={handleLeaveFinal} className="w-full py-4 bg-red-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] active:scale-95 shadow-xl shadow-red-600/20 transition-all">Confirmar Saída</button>
                 <button onClick={() => setShowConfirmLeave(false)} className="w-full py-4 bg-white/5 border border-white/10 text-slate-500 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] active:scale-95 transition-all">Abortar Protocolo</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default CommunitySettings;
