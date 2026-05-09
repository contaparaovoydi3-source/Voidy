
import React, { useMemo } from 'react';
import { Community } from '../types';

interface RecentCommunityChatsProps {
  communities: Community[];
  visitData: Record<string, { lastVisit: number; count: number }>;
  onSelect: (id: string) => void;
  onBack: () => void;
}

const RecentCommunityChats: React.FC<RecentCommunityChatsProps> = ({ communities, visitData, onSelect, onBack }) => {
  const fourHoursAgo = Date.now() - (4 * 60 * 60 * 1000);

  const recentClusters = useMemo(() => {
    return communities
      .filter(c => visitData[c.id] && visitData[c.id].lastVisit > fourHoursAgo)
      .sort((a, b) => visitData[b.id].count - visitData[a.id].count);
  }, [communities, visitData, fourHoursAgo]);

  return (
    <div className="flex-1 h-full w-full bg-[#02040a] relative overflow-hidden flex flex-col p-6 animate-in fade-in duration-700">
      {/* Visual de Scanner de Frequência */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
         <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-500/50 animate-scanline"></div>
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(34,211,238,0.05)_0%,_transparent_70%)]"></div>
      </div>

      <header className="mb-10 flex items-center gap-5 relative z-10">
        <button onClick={onBack} className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all active:scale-90 border border-white/5">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div className="flex flex-col">
          <h2 className="text-xl font-syncopate font-black text-white uppercase tracking-widest">Espaços <span className="text-cyan-400">Ativos</span></h2>
          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.4em]">Frequências Recentes (4h)</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 relative z-10 pb-32">
        {recentClusters.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center opacity-30 text-center space-y-4">
             <div className="w-16 h-16 rounded-full border border-dashed border-slate-700 flex items-center justify-center">
                <span className="text-2xl">📡</span>
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.4em]">Nenhum sinal captado</p>
             <p className="text-[8px] font-medium text-slate-500 max-w-[200px] leading-relaxed uppercase tracking-widest">Frequência estável nos últimos ciclos. Explore novos espaços para sintonizar.</p>
          </div>
        ) : (
          recentClusters.map((cluster, idx) => {
            const data = visitData[cluster.id];
            const signalStrength = Math.min(100, (data.count / 5) * 100); // Exemplo de cálculo

            return (
              <button 
                key={cluster.id}
                onClick={() => onSelect(cluster.id)}
                className="w-full group relative animate-in slide-in-from-right duration-500 flex items-center gap-5 p-5 rounded-[2.2rem] bg-white/[0.02] border border-white/5 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all active:scale-[0.98]"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white/10 group-hover:border-cyan-400 transition-colors bg-slate-900 shadow-xl">
                    <img src={cluster.avatar} className="w-full h-full object-cover" alt={cluster.name} />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#02040a] border border-white/10 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_5px_cyan]"></div>
                  </div>
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest truncate mb-1">{cluster.name}</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                       <div className="flex gap-0.5">
                          {[1, 2, 3, 4].map(b => (
                            <div key={b} className={`w-0.5 h-2 rounded-full ${signalStrength >= b * 25 ? 'bg-cyan-400 shadow-[0_0_4px_cyan]' : 'bg-slate-800'}`}></div>
                          ))}
                       </div>
                       <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Sinal</span>
                    </div>
                    <span className="text-[7px] font-black text-cyan-500/60 uppercase tracking-widest">{data.count} acessos</span>
                  </div>
                </div>

                <div className="pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M13 7l5 5-5 5M6 12h12"/></svg>
                </div>
              </button>
            );
          })
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scanline {
          0% { top: 0; opacity: 0; }
          5% { opacity: 0.5; }
          95% { opacity: 0.5; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scanline { animation: scanline 8s linear infinite; }
      `}} />
    </div>
  );
};

export default RecentCommunityChats;
