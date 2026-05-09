import React, { useState, useMemo } from 'react';
import { Community, CityMemberData } from '../types';

interface CommunityRankingProps {
  community: Community;
  onBack: () => void;
}

type RankingCriteria = 'LEVEL' | 'TIME' | 'REPUTATION';

const CommunityRanking: React.FC<CommunityRankingProps> = ({ community, onBack }) => {
  const [criteria, setCriteria] = useState<RankingCriteria>('LEVEL');

  const rankingData = useMemo(() => {
    // 1. Obter todos os membros
    // Fix: Explicitly cast the result of Object.values to CityMemberData[] to fix property access errors for cityLevel, weeklyMinutes, and cityReputation.
    const membersList: CityMemberData[] = community.membersData ? (Object.values(community.membersData) as CityMemberData[]) : [];
    
    // 2. Filtrar staff (Líderes e Co-Líderes)
    const filteredMembers = membersList.filter(m => 
      !community.leaders.includes(m.userId) && 
      !community.coLeaders.includes(m.userId)
    );

    // 3. Ordenar com base no critério
    const sorted = [...filteredMembers].sort((a, b) => {
      if (criteria === 'LEVEL') return (b.cityLevel || 0) - (a.cityLevel || 0);
      if (criteria === 'TIME') return (b.weeklyMinutes || 0) - (a.weeklyMinutes || 0);
      if (criteria === 'REPUTATION') return (b.cityReputation || 0) - (a.cityReputation || 0);
      return 0;
    });

    // 4. Se não houver dados reais suficientes para o demo, mockar o restante para chegar a 100
    const finalData = sorted.slice(0, 100);
    while (finalData.length < Math.min(100, (membersList.length > 5 ? membersList.length : 15))) {
        const mockId = `Operativo_${finalData.length + 1}`;
        finalData.push({
            userId: mockId,
            cityLevel: Math.max(1, 20 - finalData.length),
            cityReputation: Math.max(0, 500 - finalData.length * 5),
            weeklyMinutes: Math.max(0, 1200 - finalData.length * 10),
            cityRank: 'RECRUTA',
            joinDate: Date.now()
        });
    }

    return finalData;
  }, [community, criteria]);

  const top3 = rankingData.slice(0, 3);
  const remaining = rankingData.slice(3);

  const getScoreDisplay = (member: CityMemberData) => {
    if (criteria === 'LEVEL') return `LVL ${member.cityLevel}`;
    if (criteria === 'TIME') return `${member.weeklyMinutes || 0} min`;
    if (criteria === 'REPUTATION') return `${member.cityReputation} REP`;
    return '';
  };

  const criteriaOptions = [
    { id: 'LEVEL', label: 'Nível' },
    { id: 'TIME', label: 'Tempo' },
    { id: 'REPUTATION', label: 'Reputação' }
  ];

  return (
    <div className="absolute inset-0 z-[200] bg-[#02040a] flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden font-inter text-white">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none"></div>
      
      <header className="px-6 py-10 flex flex-col gap-8 shrink-0 z-10">
        <div className="flex items-center justify-between">
           <button onClick={onBack} className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all active:scale-90 border border-white/5">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M15 19l-7-7 7-7"/></svg>
           </button>
           <div className="text-center">
              <h2 className="text-xl font-syncopate font-black text-white uppercase tracking-[0.3em]">Ranking</h2>
              <span className="text-[7px] font-bold text-blue-400 uppercase tracking-[0.5em] block mt-1">Sincronia de Elite</span>
           </div>
           <div className="w-12"></div>
        </div>

        <div className="flex bg-white/[0.03] p-1 rounded-full border border-white/5 mx-auto w-fit">
           {criteriaOptions.map(opt => (
             <button 
               key={opt.id} 
               onClick={() => setCriteria(opt.id as any)}
               className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${criteria === opt.id ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'text-slate-500 hover:text-slate-300'}`}
             >
               {opt.label}
             </button>
           ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar px-6 pb-40 relative z-10">
        
        {/* PODIO CIRCULAR */}
        <div className="flex items-end justify-center gap-4 md:gap-8 mb-12 mt-8 animate-in slide-in-from-bottom duration-700">
           {/* 2º Lugar */}
           {top3[1] && (
             <div className="flex flex-col items-center gap-3">
                <div className="relative">
                   <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-slate-400 p-1 bg-black shadow-lg overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${top3[1].userId}`} className="w-full h-full object-cover rounded-full" />
                   </div>
                   <div className="absolute -top-2 -right-1 w-6 h-6 bg-slate-400 rounded-full flex items-center justify-center text-black font-black text-[10px]">2</div>
                </div>
                <div className="text-center">
                   <h4 className="text-[10px] font-black text-white uppercase truncate w-24">{top3[1].userId}</h4>
                   <span className="text-[8px] font-bold text-blue-400 uppercase tracking-tighter">{getScoreDisplay(top3[1])}</span>
                </div>
             </div>
           )}

           {/* 1º Lugar */}
           {top3[0] && (
             <div className="flex flex-col items-center gap-3 -mb-4">
                <div className="relative">
                   <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-yellow-500 p-1 bg-black shadow-[0_0_30px_rgba(234,179,8,0.2)] overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${top3[0].userId}`} className="w-full h-full object-cover rounded-full" />
                   </div>
                   <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-black font-black text-xs shadow-lg animate-bounce">1</div>
                </div>
                <div className="text-center">
                   <h4 className="text-xs font-black text-white uppercase truncate w-32 drop-shadow-md">{top3[0].userId}</h4>
                   <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{getScoreDisplay(top3[0])}</span>
                </div>
             </div>
           )}

           {/* 3º Lugar */}
           {top3[2] && (
             <div className="flex flex-col items-center gap-3">
                <div className="relative">
                   <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-amber-600 p-1 bg-black shadow-lg overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${top3[2].userId}`} className="w-full h-full object-cover rounded-full" />
                   </div>
                   <div className="absolute -top-2 -left-1 w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center text-black font-black text-[10px]">3</div>
                </div>
                <div className="text-center">
                   <h4 className="text-[10px] font-black text-white uppercase truncate w-24">{top3[2].userId}</h4>
                   <span className="text-[8px] font-bold text-blue-400 uppercase tracking-tighter">{getScoreDisplay(top3[2])}</span>
                </div>
             </div>
           )}
        </div>

        {/* LISTA RETANGULAR */}
        <div className="space-y-3 animate-in fade-in duration-1000 delay-300">
           {remaining.map((member, idx) => (
             <div 
               key={member.userId}
               className="w-full p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-4 group hover:bg-blue-500/[0.03] hover:border-blue-500/20 transition-all"
             >
                <div className="w-8 text-[10px] font-syncopate font-black text-slate-600 text-center">{idx + 4}</div>
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 overflow-hidden shrink-0">
                   <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${member.userId}`} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                   <h4 className="text-[11px] font-black text-white uppercase truncate tracking-widest">{member.userId}</h4>
                   <span className="text-[7px] font-bold text-slate-600 uppercase tracking-tighter">{member.cityRank}</span>
                </div>
                <div className="text-right">
                   <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{getScoreDisplay(member)}</span>
                </div>
             </div>
           ))}
        </div>

        <div className="mt-20 py-10 border-t border-white/5 text-center opacity-30">
           <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.8em]">Sincronia de Ranking Completa</span>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
};

export default CommunityRanking;