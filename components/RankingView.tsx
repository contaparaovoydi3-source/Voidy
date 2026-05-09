
import React, { useState, useMemo } from 'react';
import { Community } from '../types';

interface RankingViewProps {
  onBack: () => void;
  onPreviewCommunity: (comm: Community) => void;
  communities: Community[];
}

const CATEGORIES = [
  { id: 'atividade', label: 'Atividade', desc: 'Sinais mais pulsantes no vácuo' },
  { id: 'crescimento', label: 'Crescimento', desc: 'Espaços em expansão acelerada' },
  { id: 'populacao', label: 'População', desc: 'Os maiores centros de consciência' },
  { id: 'eventos', label: 'Eventos', desc: 'Onde a história está sendo escrita' }
];

const RankingView: React.FC<RankingViewProps> = ({ onBack, onPreviewCommunity, communities }) => {
  const [activeTab, setActiveTab] = useState('atividade');

  const rankedCommunities = useMemo(() => {
    let sorted = [...communities];
    
    switch (activeTab) {
      case 'populacao':
        sorted.sort((a, b) => (b.membersCount || 0) - (a.membersCount || 0));
        break;
      case 'atividade':
        // Simulação de atividade baseada em nível e número de mensagens se existissem, 
        // caso contrário usa nível como proxy
        sorted.sort((a, b) => (b.level || 0) - (a.level || 0));
        break;
      case 'crescimento':
        // Simulação de crescimento: ordena comunidades mais recentes (id maior) que já tem membros
        sorted.sort((a, b) => b.id.localeCompare(a.id));
        break;
      case 'eventos':
        // Simulação: Comunidades com tags específicas ou apenas um subconjunto
        sorted = sorted.filter(c => c.tags?.length > 1).concat(sorted.filter(c => c.tags?.length <= 1));
        break;
    }

    return sorted.slice(0, 10);
  }, [communities, activeTab]);

  return (
    <div className="flex-1 h-full w-full bg-[#02040a] relative overflow-y-auto no-scrollbar animate-in slide-in-from-right duration-500">
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-30">
         <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-600/5 blur-[120px] rounded-full"></div>
         <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/5 blur-[100px] rounded-full"></div>
      </div>

      <header className="px-8 py-12 flex items-center justify-between sticky top-0 z-50 bg-[#02040a]/40 backdrop-blur-2xl border-b border-white/5">
        <button onClick={onBack} className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all active:scale-90 border border-white/5">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div className="text-center">
           <h2 className="text-2xl font-syncopate font-black text-white uppercase tracking-[0.3em] drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">Destaque</h2>
           <span className="text-[7px] font-bold text-cyan-500 uppercase tracking-[0.6em] mt-1 block">Elite dos Espaços</span>
        </div>
        <div className="w-12"></div>
      </header>

      <div className="max-w-4xl mx-auto px-6 pb-40 pt-10 relative z-10">
        
        <div className="flex gap-2 mb-12 overflow-x-auto no-scrollbar py-2 justify-center">
           {CATEGORIES.map((opt) => (
             <button 
               key={opt.id}
               onClick={() => setActiveTab(opt.id)}
               className={`flex-shrink-0 px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all duration-300 ${activeTab === opt.id ? 'bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.2)] scale-105' : 'bg-white/5 text-slate-500 border-white/10 hover:text-slate-300'}`}
             >
               {opt.label}
             </button>
           ))}
        </div>

        <div className="mb-10 text-center animate-in fade-in duration-700">
           <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.4em]">
             {CATEGORIES.find(c => c.id === activeTab)?.desc}
           </p>
        </div>

        <div className="space-y-4">
           {rankedCommunities.length === 0 ? (
             <div className="py-20 flex flex-col items-center opacity-20">
                <span className="text-4xl mb-4">📡</span>
                <p className="text-[10px] font-black uppercase tracking-widest">Sinal em busca de novos espaços...</p>
             </div>
           ) : (
             rankedCommunities.map((comm, idx) => {
               const isTop3 = idx < 3;
               const colors = ['text-yellow-400', 'text-slate-300', 'text-amber-600'];
               
               return (
                 <button 
                   key={comm.id}
                   onClick={() => onPreviewCommunity(comm)}
                   className="w-full flex items-center gap-5 p-5 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-cyan-500/40 hover:bg-cyan-500/[0.03] transition-all cursor-pointer active:scale-[0.98] group relative overflow-hidden animate-in slide-in-from-right duration-500"
                   style={{ animationDelay: `${idx * 100}ms` }}
                 >
                    {isTop3 && <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 shadow-[0_0_15px_cyan]"></div>}
                    
                    <div className={`w-10 font-syncopate font-black text-sm text-center ${isTop3 ? colors[idx] : 'text-slate-700'}`}>
                       {idx + 1}
                    </div>

                    <div className="relative shrink-0">
                       <div className={`w-14 h-14 rounded-2xl border-2 overflow-hidden bg-slate-900 shadow-xl transition-transform duration-500 group-hover:scale-105 ${isTop3 ? 'border-white/20' : 'border-white/5'}`}>
                          <img src={comm.avatar} className="w-full h-full object-cover" alt={comm.name} />
                       </div>
                       {activeTab === 'eventos' && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                       )}
                    </div>

                    <div className="flex-1 min-w-0 text-left">
                       <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-black text-white uppercase tracking-widest truncate">{comm.name}</h4>
                          <span className="text-[6px] font-black px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-500 uppercase">{comm.theme}</span>
                       </div>
                       <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold line-clamp-1">
                          {activeTab === 'eventos' ? 'Evento em progresso no setor' : comm.catchphrase || 'Sincronia estável'}
                       </p>
                    </div>

                    <div className="text-right shrink-0 pr-2">
                       <div className="text-[11px] font-black text-cyan-400 font-orbitron tracking-tighter">
                          {comm.membersCount?.toLocaleString()} N
                       </div>
                       <div className="text-[6px] font-bold text-slate-600 uppercase tracking-widest">
                          CONSCIÊNCIAS
                       </div>
                    </div>
                 </button>
               );
             })
           )}
        </div>

        <div className="mt-20 py-10 border-t border-white/5 text-center opacity-30">
           <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.8em]">Fim dos Registros de Elite</span>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
};

export default RankingView;
