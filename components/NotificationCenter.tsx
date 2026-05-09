
import React from 'react';
import { Notification } from '../types';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onAction: (notif: Notification) => void;
}

export default function NotificationCenter({ isOpen, onClose, notifications, onMarkAsRead, onAction }: NotificationCenterProps) {
  if (!isOpen) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'REPORT': return '⚠️';
      case 'INVITE': return '📩';
      case 'PROMOTION': return '🎖️';
      case 'LIKE': return '❤️';
      case 'COMMENT': return '💬';
      case 'MURAL': return '📝';
      case 'FOLLOW': return '👤';
      case 'FEATURE': return '⭐';
      case 'PURCHASE': return '🛍️';
      case 'MENTION': return '🏷️';
      default: return '📡';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'REPORT': return 'text-red-500';
      case 'INVITE': return 'text-amber-400';
      case 'PROMOTION': return 'text-cyan-400';
      case 'FOLLOW': return 'text-blue-400';
      case 'FEATURE': return 'text-yellow-400';
      case 'PURCHASE': return 'text-emerald-400';
      case 'LIKE': return 'text-pink-500';
      case 'COMMENT': return 'text-indigo-400';
      case 'MENTION': return 'text-violet-400';
      default: return 'text-slate-400';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'LIKE': return 'Sinal Curtido';
      case 'COMMENT': return 'Nova Resposta';
      case 'FOLLOW': return 'Link Estabelecido';
      case 'FEATURE': return 'Destaque Drake.OS';
      case 'INVITE': return 'Convite de Acesso';
      case 'MENTION': return 'Menção Neural';
      default: return 'Sinal de Sistema';
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative ml-auto h-full w-[85%] max-w-[380px] bg-[#050714] border-l border-white/5 flex flex-col shadow-2xl animate-in slide-in-from-right duration-500">
        <header className="p-8 pt-16 md:pt-24 border-b border-white/5 flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-sm font-syncopate font-black text-white uppercase tracking-[0.2em]">Fluxo de Sinais</h2>
            <span className="text-[8px] font-bold text-cyan-500 uppercase tracking-widest">Logs de Sincronia</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 text-slate-500 hover:text-white transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar pb-32">
          {notifications.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center opacity-20 text-center px-10">
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center mb-4">
                <span className="text-xl">📡</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Silêncio Absoluto no Setor</span>
            </div>
          ) : (
            notifications.map((notif) => (
              <div 
                key={notif.id}
                onClick={() => { onMarkAsRead(notif.id); onAction(notif); }}
                className={`group relative p-5 rounded-[1.8rem] border transition-all duration-300 cursor-pointer overflow-hidden ${notif.read ? 'bg-white/[0.02] border-white/5 opacity-60' : 'bg-cyan-500/5 border-cyan-500/20 shadow-lg'}`}
              >
                {!notif.read && <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />}
                
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center text-lg ${getTypeColor(notif.type)} shadow-inner`}>
                    {getTypeIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-white/5 ${getTypeColor(notif.type)}`}>
                        {getTypeName(notif.type)}
                      </span>
                    </div>
                    <h4 className="text-[11px] font-black text-white uppercase tracking-wider mb-1 truncate">{notif.title}</h4>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed mb-3 line-clamp-2">{notif.content}</p>
                    <div className="flex items-center justify-between">
                       <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">{new Date(notif.timestamp).toLocaleTimeString()}</span>
                       <span className="text-[8px] font-black text-cyan-600 uppercase tracking-[0.2em] group-hover:text-cyan-400 transition-colors">Acessar Link →</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-black/40 border-t border-white/5 backdrop-blur-xl">
           <button 
             onClick={() => notifications.forEach(n => onMarkAsRead(n.id))}
             className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] hover:text-white transition-all active:scale-95"
           >
             Purificar Logs Lidos
           </button>
        </div>
      </div>
    </div>
  );
}
