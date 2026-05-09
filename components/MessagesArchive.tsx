
import React, { useState, useRef, useEffect } from 'react';
import { ChatSession, Notification } from '../types';

interface MessagesArchiveProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onTogglePin: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onBlockUser: (name: string) => void;
  onSelectSession: (id: string) => void;
  onBack: () => void;
  onFindOperatives?: () => void;
  title?: string;
  addNotification: (notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
}

const MessagesArchive: React.FC<MessagesArchiveProps> = ({ 
  sessions, activeSessionId, onTogglePin, onDeleteSession, onBlockUser, onSelectSession, onBack, onFindOperatives, title = "PRIVADO" 
}) => {
  const [showOptionsId, setShowOptionsId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'PRIVADO' | 'CHATS'>(title === 'CHATS' ? 'CHATS' : 'PRIVADO');
  const holdTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (title === 'CHATS') setActiveSubTab('CHATS');
    else setActiveSubTab('PRIVADO');
  }, [title]);

  const handleStartHold = (session: ChatSession) => {
    holdTimerRef.current = window.setTimeout(() => {
      setShowOptionsId(session.id);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 1000);
  };

  const handleEndHold = () => {
    if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
  };

  const sortedSessions = [...sessions.filter(s => {
    if (activeSubTab === 'PRIVADO') return s.type === 'PRIVADO' || s.type === 'IA';
    if (activeSubTab === 'CHATS') return s.type === 'CLUSTER' || s.type === 'PUBLICO';
    return true;
  })].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.lastUpdate - a.lastUpdate;
  });

  const selectedSession = sessions.find(s => s.id === showOptionsId);

  return (
    <div className="flex-1 h-full w-full bg-[#050714] relative overflow-hidden flex flex-col p-6 animate-in fade-in duration-700">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-600/5 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="mb-6 flex flex-col items-center relative z-10">
        <header className="w-full flex items-center justify-between mb-8">
           <button onClick={onBack} className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-white transition-all active:scale-90">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M15 19l-7-7 7-7"/></svg>
           </button>
           <h2 className="text-xl font-syncopate font-black text-white uppercase tracking-[0.3em] glow-cyan">Conversas</h2>
           <div className="w-10"></div>
        </header>

        <div className="flex items-center justify-center gap-12 mb-4">
           <button 
             onClick={() => setActiveSubTab('PRIVADO')} 
             className={`relative py-1 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${activeSubTab === 'PRIVADO' ? 'text-cyan-400' : 'text-slate-600 hover:text-slate-400'}`}
           >
             privado
             {activeSubTab === 'PRIVADO' && <div className="absolute -bottom-1 left-0 w-full h-[1px] bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-in zoom-in duration-300"></div>}
           </button>
           <button 
             onClick={() => setActiveSubTab('CHATS')} 
             className={`relative py-1 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${activeSubTab === 'CHATS' ? 'text-cyan-400' : 'text-slate-600 hover:text-slate-400'}`}
           >
             chats
             {activeSubTab === 'CHATS' && <div className="absolute -bottom-1 left-0 w-full h-[1px] bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-in zoom-in duration-300"></div>}
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-32 relative z-10">
        {sortedSessions.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center opacity-20 text-center space-y-4">
             <div className="w-16 h-16 rounded-full border border-dashed border-slate-700 flex items-center justify-center">
                <span className="text-2xl">📡</span>
             </div>
             <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Sinal Nulo</p>
                <p className="text-[8px] font-medium text-slate-500 uppercase tracking-widest leading-relaxed">
                  Nenhuma transmissão interceptada nesta frequência.
                </p>
             </div>
          </div>
        ) : (
          sortedSessions.map((session) => (
            <button 
              key={session.id}
              onMouseDown={() => handleStartHold(session)} onMouseUp={handleEndHold} onMouseLeave={handleEndHold} onTouchStart={() => handleStartHold(session)} onTouchEnd={handleEndHold}
              onClick={() => onSelectSession(session.id)}
              className={`w-full p-5 rounded-[2.5rem] border transition-all duration-300 flex items-center gap-4 group text-left relative overflow-hidden ${activeSessionId === session.id ? 'border-cyan-500/40 bg-cyan-500/5' : 'border-white/5 bg-white/[0.02] hover:bg-white/5'}`}
            >
              <div className={`absolute top-0 left-0 w-1 h-full bg-cyan-500 transition-opacity ${session.isPinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}></div>
              <div className={`w-12 h-12 rounded-2xl bg-slate-900 border ${session.type === 'CLUSTER' || session.type === 'PUBLICO' ? 'border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'border-white/10'} p-0.5 overflow-hidden shrink-0`}>
                 <img src={session.avatar} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                 <div className="flex justify-between items-center mb-0.5">
                    <span className="text-[11px] font-black text-white uppercase truncate pr-2">{session.name}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                       <span className="text-[6px] font-black text-slate-600 uppercase">
                         {new Date(session.lastUpdate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                       </span>
                       {session.isPinned && <svg className="w-3 h-3 text-cyan-400" fill="currentColor" viewBox="0 0 24 24"><path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z" /></svg>}
                    </div>
                 </div>
                 <p className="text-[9px] text-slate-500 truncate font-medium heavyweight">
                   {session.messages.length > 0 ? session.messages[session.messages.length-1].text.replace(/\[.*?\]/g, '') : "Frequência aberta..."}
                 </p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* FIXED MEMBERS HUB CIRCULAR IN BOTTOM RIGHT */}
      <div className="fixed bottom-28 right-6 z-[120] flex flex-col items-center gap-2">
         <button 
           onClick={onFindOperatives}
           className="w-16 h-16 rounded-full bg-cyan-500 flex items-center justify-center shadow-[0_0_40px_rgba(34,211,238,0.4)] active:scale-95 transition-all border-4 border-[#050714] group relative overflow-hidden"
         >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
            <svg className="w-7 h-7 text-black group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3.5">
               <path d="M12 4v16m8-8H4"/>
            </svg>
         </button>
         <span className="text-[8px] font-black text-cyan-400 uppercase tracking-[0.4em] drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]">membros</span>
      </div>

      {showOptionsId && selectedSession && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowOptionsId(null)} />
          <div className="relative w-full max-w-[280px] bg-[#0a0c1a]/95 border border-cyan-500/30 rounded-[2.5rem] p-6 shadow-2xl flex flex-col gap-2">
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-3 border border-cyan-500/20 overflow-hidden shadow-lg"><img src={selectedSession.avatar} className="w-full h-full object-cover" /></div>
              <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">{selectedSession.name}</h4>
            </div>
            
            <button 
              onClick={() => { onTogglePin(selectedSession.id); setShowOptionsId(null); }} 
              className="w-full text-left px-6 py-4 hover:bg-white/5 rounded-2xl text-[10px] font-black uppercase text-white transition-colors flex items-center gap-3"
            >
              <span>📌</span> {selectedSession.isPinned ? 'Desafixar' : 'Fixar'}
            </button>
            
            <button 
              onClick={() => { if(window.confirm(`Deseja bloquear ${selectedSession.name}?`)) { onBlockUser?.(selectedSession.name); setShowOptionsId(null); } }} 
              className="w-full text-left px-6 py-4 hover:bg-amber-500/10 rounded-2xl text-[10px] font-black uppercase text-amber-500 transition-colors flex items-center gap-3"
            >
              <span>🚫</span> Bloquear Usuário
            </button>

            <button 
              onClick={() => { alert('Denúncia de frequência enviada para a moderação.'); setShowOptionsId(null); }} 
              className="w-full text-left px-6 py-4 hover:bg-white/5 rounded-2xl text-[10px] font-black uppercase text-white transition-colors flex items-center gap-3"
            >
              <span>⚠️</span> Denunciar
            </button>

            <button 
              onClick={() => { if(window.confirm('Deseja apagar todo o histórico deste chat permanentemente?')) { onDeleteSession(selectedSession.id); setShowOptionsId(null); } }} 
              className="w-full text-left px-6 py-4 hover:bg-red-500/10 rounded-2xl text-[10px] font-black uppercase text-red-500 transition-colors flex items-center gap-3"
            >
              <span>🗑️</span> Apagar Chat
            </button>

            <button onClick={() => setShowOptionsId(null)} className="mt-2 py-3 text-[8px] font-black uppercase text-slate-500 hover:text-white">Voltar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesArchive;
