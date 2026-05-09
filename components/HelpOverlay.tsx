import React, { useState } from 'react';

interface HelpOverlayProps {
  onClose: () => void;
  onReset: () => void;
}

const HelpOverlay: React.FC<HelpOverlayProps> = ({ onClose, onReset }) => {
  const [showConfirmPurge, setShowConfirmPurge] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleDeleteAccount = () => {
    onReset();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-3xl flex flex-col animate-in fade-in duration-500 overflow-y-auto custom-scrollbar">
      <div className="max-w-2xl mx-auto w-full p-8 pt-16 pb-32">
        <header className="flex items-center justify-between mb-16">
          <div className="flex flex-col">
            <h2 className="text-2xl font-syncopate font-black text-white uppercase tracking-widest glow-cyan">CENTRO DE AJUDA</h2>
            <span className="text-[8px] font-bold text-cyan-500 uppercase tracking-[0.4em] mt-1 text-shadow-glow">Manual do Operativo Nexus</span>
          </div>
          <button onClick={onClose} className="p-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all active:scale-90 shadow-lg">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </header>

        <div className="space-y-12">
          {/* Mensagem de Boas Vindas */}
          <section className="animate-in slide-in-from-bottom-4 duration-700">
            <div className="relative p-10 rounded-[3rem] overflow-hidden border border-cyan-500/20 bg-gradient-to-br from-cyan-900/20 to-transparent backdrop-blur-sm">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <svg className="w-32 h-32 text-cyan-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
              </div>
              <h3 className="text-[12px] font-syncopate font-black text-cyan-400 uppercase tracking-[0.4em] mb-6">Saudações, Explorador</h3>
              <p className="text-base text-slate-100 leading-relaxed font-medium">
                Seu link neural com o <span className="text-cyan-400 font-bold">Vácuo</span> foi estabelecido com sucesso. <br/><br/>
                No VOIDY, você não é apenas um usuário, mas uma consciência navegando entre estrelas moribundas e clusters de dados perdidos.
              </p>
            </div>
          </section>

          {/* Diretrizes */}
          <section className="animate-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-3 mb-4 ml-4">
              <div className="w-1 h-4 bg-cyan-500 rounded-full shadow-[0_0_10px_cyan]"></div>
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Protocolos de Conduta</h3>
            </div>
            <div className="bg-white/[0.02] p-8 rounded-[2.5rem] border border-white/5 text-sm text-slate-400 leading-relaxed">
              Sua sincronia é protegida por criptografia. Operativos que transmitirem conteúdo proibido terão seus links permanentemente <span className="text-pink-500 font-bold uppercase">cancelados</span> sem aviso prévio.
            </div>
          </section>

          {/* Integridade de Dados */}
          <section className="animate-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-3 mb-4 ml-4">
              <div className="w-1 h-4 bg-cyan-500 rounded-full shadow-[0_0_10px_cyan]"></div>
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Armazenamento Local</h3>
            </div>
            <div className="bg-white/[0.02] p-8 rounded-[2.5rem] border border-white/5 text-sm text-slate-400 leading-relaxed">
              Sua privacidade é prioridade. A maioria dos registros de missão e perfis são armazenados <span className="text-cyan-400 underline">localmente</span> no cache do seu terminal.
            </div>
          </section>

          {/* Suporte Técnico */}
          <section className="animate-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center gap-3 mb-4 ml-4">
              <div className="w-1 h-4 bg-purple-500 rounded-full shadow-[0_0_10px_#a855f7]"></div>
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Canal de Suporte</h3>
            </div>
            <div className="bg-purple-900/10 p-10 rounded-[3rem] border border-purple-500/30 flex flex-col items-center text-center">
              <p className="text-xs text-purple-300 font-bold uppercase tracking-widest mb-6">
                Problemas na transmissão ou bugs no sistema?
              </p>
              <div className="py-4 px-8 bg-black/40 rounded-2xl border border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                <span className="text-lg md:text-xl font-orbitron font-bold text-white tracking-wider select-all">voidynexus@gmail.com</span>
              </div>
            </div>
          </section>

          {/* Manutenção */}
          <section className="animate-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center gap-3 mb-4 ml-4">
              <div className="w-1 h-4 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]"></div>
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Limpeza de Frequência</h3>
            </div>
            <div className="bg-blue-500/5 p-10 rounded-[3rem] border border-blue-500/20 text-center">
              <button 
                onClick={() => setShowConfirmPurge(true)}
                className="w-full max-w-xs py-4 bg-blue-600/10 hover:bg-blue-600 text-blue-100 border border-blue-600/40 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all active:scale-95 shadow-lg mx-auto"
              >
                Recarregar Interface
              </button>
            </div>
          </section>

          {/* SEÇÃO PERIGOSA: DELETAR CONTA */}
          <section className="animate-in slide-in-from-bottom-4 duration-700 border-t border-white/5 pt-12 text-center" style={{ animationDelay: '500ms' }}>
             <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </div>
                <button 
                  onClick={() => setShowConfirmDelete(true)}
                  className="px-10 py-4 bg-red-600/10 border border-red-500/30 text-red-500 rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] transition-all hover:bg-red-600 hover:text-white active:scale-95 shadow-lg"
                >
                  Deletar conta
                </button>
                <p className="max-w-[240px] text-[7px] text-slate-700 font-bold uppercase tracking-widest leading-relaxed">
                  Aviso: Este protocolo removerá permanentemente todos os seus registros da rede VOIDY.
                </p>
             </div>
          </section>
        </div>

        <div className="mt-20 pt-10 border-t border-white/5 text-center opacity-40">
           <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.8em]">Voidy Intel Core V2.5.5</span>
        </div>
      </div>

      {/* Confirmação de Purga (Interface) */}
      {showConfirmPurge && (
        <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-8 animate-in zoom-in duration-300">
           <div className="max-w-xs w-full text-center">
              <h3 className="text-lg font-syncopate font-black text-white uppercase tracking-widest mb-4">REINICIAR?</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase mb-8 leading-relaxed">Sua conta e mensagens não serão afetadas.</p>
              <div className="flex flex-col gap-3">
                 <button onClick={() => onReset()} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Confirmar</button>
                 <button onClick={() => setShowConfirmPurge(false)} className="w-full py-5 bg-white/5 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest">Abortar</button>
              </div>
           </div>
        </div>
      )}

      {/* TELA DE CONFIRMAÇÃO: DELETAR CONTA */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-[500] bg-black/98 backdrop-blur-2xl flex items-center justify-center p-8 animate-in fade-in duration-300 pointer-events-auto">
           <div className="max-w-md w-full bg-[#0a0c1a] border-2 border-red-500/40 rounded-[2.5rem] p-10 md:p-12 shadow-[0_0_100px_rgba(239,68,68,0.2)] flex flex-col items-center text-center gap-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse"></div>
              
              <div className="w-24 h-24 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center text-5xl animate-pulse shadow-inner">
                💀
              </div>
              
              <div className="space-y-4">
                 <h3 className="text-2xl font-syncopate font-black text-red-500 uppercase tracking-widest drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                   EXPURGAR CONTA?
                 </h3>
                 <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed uppercase tracking-widest">
                   Esta ação é <span className="text-red-500 font-black underline underline-offset-4">IRREVERSÍVEL</span>. <br/><br/>
                   Todos os seus personagens, mundos criados e históricos de transmissão serão deletados do terminal local. Seu sinal será silenciado para sempre.
                 </p>
                 <div className="pt-4 flex flex-col items-center">
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em]">Confirmar extinção de rastro neural?</p>
                 </div>
              </div>

              <div className="flex flex-col w-full gap-4">
                 <button 
                   onClick={handleDeleteAccount}
                   className="w-full py-6 bg-red-600 text-white rounded-3xl font-black text-[12px] uppercase tracking-[0.4em] active:scale-95 shadow-2xl shadow-red-900/40 border border-red-400/50 transition-all hover:brightness-110"
                 >
                   Sim, Deletar Tudo
                 </button>
                 <button 
                   onClick={() => setShowConfirmDelete(false)}
                   className="w-full py-5 bg-white/5 border border-white/10 text-slate-400 rounded-3xl font-black text-[11px] uppercase tracking-[0.4em] active:scale-95 transition-all hover:text-white hover:bg-white/10"
                 >
                   Não, Manter Link
                 </button>
              </div>
           </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `.text-shadow-glow { text-shadow: 0 0 8px rgba(34, 211, 238, 0.4); }` }} />
    </div>
  );
};

export default HelpOverlay;