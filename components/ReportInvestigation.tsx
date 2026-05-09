
import React, { useState } from 'react';
import { Notification, UserProfile } from '../types';

interface ReportInvestigationProps {
  report: Notification;
  moderator: UserProfile;
  onClose: () => void;
  onConfirmAction: (actionType: 'DELETE_MSG' | 'BAN_CHAT' | 'BAN_APP', metadata: any) => void;
}

const ReportInvestigation: React.FC<ReportInvestigationProps> = ({ report, moderator, onClose, onConfirmAction }) => {
  const metadata = report.metadata || {};
  const isGlobalModerator = moderator.rank === 'MODERADOR';

  return (
    <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-3xl flex flex-col animate-in fade-in duration-500 overflow-y-auto no-scrollbar">
      <header className="p-8 border-b border-white/5 flex items-center justify-between sticky top-0 bg-black/40 backdrop-blur-md z-10">
        <div className="flex flex-col">
          <h2 className="text-xl font-syncopate font-black text-red-500 uppercase tracking-widest">Painel de Avaliação</h2>
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.4em] mt-1">Sinal Interceptado no Setor: {metadata.communityName || 'Desconhecido'}</span>
        </div>
        <button onClick={onClose} className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white active:scale-90 transition-all">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full p-6 space-y-10 pb-32">
        <section className="animate-in slide-in-from-bottom-4 duration-700">
           <div className="flex items-center gap-4 mb-4 ml-2">
              <div className="w-1 h-3 bg-red-500 rounded-full shadow-[0_0_8px_#ef4444]"></div>
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Alvo da Denúncia</h3>
           </div>
           <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-[2.5rem] flex items-center gap-4">
              <div className="w-14 h-14 rounded-full border-2 border-red-500/40 p-1 overflow-hidden bg-slate-900">
                 <img src={metadata.reportedUserAvatar} className="w-full h-full object-cover rounded-full" />
              </div>
              <div className="flex flex-col">
                 <span className="text-sm font-black text-red-400 uppercase tracking-tight">{metadata.reportedUser}</span>
                 <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">MOTIVO REPORTADO: {metadata.reason}</span>
              </div>
           </div>
        </section>

        <section className="animate-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '100ms' }}>
           <div className="flex items-center gap-4 mb-4 ml-2">
              <div className="w-1 h-3 bg-white rounded-full"></div>
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Evidência do Sinal</h3>
           </div>
           <div className="bg-white/5 border border-white/10 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                 <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.895 13.122 16 12.017 16H10.017V14H12.017C14.226 14 16.017 12.209 16.017 10V5C16.017 3.895 15.122 3 14.017 3H5.017C3.912 3 3.017 3.895 3.017 5V15C3.017 16.105 3.912 17 5.017 17H7.017V21L14.017 21ZM5.017 5H14.017V10H12.017C9.808 10 8.017 11.791 8.017 14V15H5.017V5Z"/></svg>
              </div>
              <p className="text-lg text-slate-100 leading-relaxed font-medium italic">
                 "{metadata.reportedMessage || "Denúncia de perfil ou canal. Sem mensagem específica."}"
              </p>
              <div className="mt-6 flex justify-between items-center opacity-30">
                 <span className="text-[8px] font-black uppercase tracking-widest">HORA: {new Date(metadata.timestamp || Date.now()).toLocaleTimeString()}</span>
                 <span className="text-[8px] font-black uppercase tracking-widest">ID: {report.id.slice(-6)}</span>
              </div>
           </div>
        </section>

        <section className="pt-10 space-y-4 animate-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '200ms' }}>
           <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => onConfirmAction('DELETE_MSG', metadata)}
                className="py-5 bg-white/5 border border-white/10 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                🗑️ Apagar Mensagem
              </button>
              <button 
                onClick={() => onConfirmAction('BAN_CHAT', metadata)}
                className="py-5 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-[2rem] text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                🚫 Banir do Chat
              </button>
           </div>
           
           {isGlobalModerator && (
             <button 
               onClick={() => onConfirmAction('BAN_APP', metadata)}
               className="w-full py-5 bg-red-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-red-600/20 flex items-center justify-center gap-3"
             >
               💀 Banir do App (Moderador)
             </button>
           )}

           <button 
             onClick={onClose}
             className="w-full py-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] hover:text-white transition-colors"
           >
             Cancelar Avaliação
           </button>
        </section>
      </main>
    </div>
  );
};

export default ReportInvestigation;
