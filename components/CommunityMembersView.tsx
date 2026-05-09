import React, { useState, useMemo } from 'react';
import { Community, CityMemberData, UserProfile } from '../types';

interface CommunityMembersViewProps {
  community: Community;
  onBack: () => void;
  onViewProfile: (profile: UserProfile) => void;
}

const CommunityMembersView: React.FC<CommunityMembersViewProps> = ({ community, onBack, onViewProfile }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const allMembers = useMemo(() => {
    return community.membersData ? (Object.values(community.membersData) as CityMemberData[]) : [];
  }, [community.membersData]);

  const filteredMembers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allMembers;
    return allMembers.filter(m => 
      (m.personaName || m.userId).toLowerCase().includes(q)
    );
  }, [allMembers, searchQuery]);

  const leaders = useMemo(() => 
    allMembers.filter(m => community.leaders.includes(m.userId)),
    [allMembers, community.leaders]
  );

  const coLeaders = useMemo(() => 
    allMembers.filter(m => community.coLeaders.includes(m.userId)),
    [allMembers, community.coLeaders]
  );

  const commonMembers = useMemo(() => 
    filteredMembers.filter(m => !community.leaders.includes(m.userId) && !community.coLeaders.includes(m.userId)),
    [filteredMembers, community.leaders, community.coLeaders]
  );

  return (
    <div className="absolute inset-0 z-[800] bg-[#02040a] flex flex-col animate-in slide-in-from-right duration-500 font-inter text-white overflow-hidden">
      {/* Camada Estelar de Fundo */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,_rgba(34,211,238,0.15)_0%,_transparent_50%)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_70%,_rgba(168,85,247,0.1)_0%,_transparent_50%)]"></div>
      </div>

      <header className="px-6 py-8 flex items-center justify-between bg-black/40 backdrop-blur-xl border-b border-white/5 shrink-0 z-10 shadow-2xl">
        <button onClick={onBack} className="p-2.5 bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all active:scale-90 border border-white/5">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div className="flex flex-col items-center">
           <h2 className="text-xs font-syncopate font-black text-white uppercase tracking-[0.4em]">Diretório Neural</h2>
           <div className="flex items-center gap-2 mt-1">
              <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse"></div>
              <span className="text-[7px] font-black text-cyan-400 uppercase tracking-[0.2em]">{community.name}</span>
           </div>
        </div>
        <div className="flex flex-col items-end">
           <div className="flex items-center gap-1.5">
              <span className="text-sm font-orbitron font-black text-white leading-none">{allMembers.length}</span>
              <span className="text-[10px] font-black text-cyan-500">N</span>
           </div>
           <span className="text-[5px] font-black text-slate-500 uppercase tracking-widest leading-none">Consciências</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-12 pb-48 relative z-10">
        
        {/* SEÇÃO DE LIDERANÇA */}
        {leaders.length > 0 && (
          <section className="animate-in slide-in-from-bottom duration-700">
             <div className="flex items-center gap-4 mb-8 justify-center">
                <div className="h-px w-8 bg-gradient-to-r from-transparent to-cyan-500/40"></div>
                <h3 className="text-[10px] font-syncopate font-black text-cyan-400 uppercase tracking-[0.4em]">Liderança Central</h3>
                <div className="h-px w-8 bg-gradient-to-l from-transparent to-cyan-500/40"></div>
             </div>
             
             <div className="flex flex-wrap justify-center gap-8">
                {leaders.map(l => (
                  <button 
                    key={l.userId} 
                    onClick={() => onViewProfile({ name: l.personaName || l.userId, avatarUrl: l.personaAvatar || '', rank: l.cityRank, level: l.cityLevel, isMe: false, reputation: l.cityReputation, following: 0, followers: 0 } as any)} 
                    className="flex flex-col items-center gap-3 group active:scale-95 transition-all"
                  >
                     <div className="relative">
                        <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl group-hover:bg-cyan-500/40 transition-all"></div>
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-[3px] border-cyan-500 p-1 bg-black shadow-[0_0_30px_rgba(34,211,238,0.3)] overflow-hidden relative z-10 group-hover:scale-105 transition-transform duration-500">
                           <img src={l.personaAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${l.userId}`} className="w-full h-full object-cover rounded-full" />
                        </div>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-20 bg-cyan-500 text-black px-3 py-0.5 rounded-full text-[6px] font-black uppercase tracking-widest shadow-lg border border-cyan-400">Líder</div>
                     </div>
                     <div className="text-center">
                        <span className="text-[11px] font-black text-white uppercase tracking-widest group-hover:text-cyan-400 transition-colors">{l.personaName || l.userId}</span>
                        <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Nível {l.cityLevel}</p>
                     </div>
                  </button>
                ))}
             </div>
          </section>
        )}

        {/* SEÇÃO DE CO-LIDERANÇA */}
        {coLeaders.length > 0 && (
          <section className="animate-in slide-in-from-bottom duration-700 delay-200">
             <div className="flex items-center gap-4 mb-8 justify-center opacity-80">
                <div className="h-px w-6 bg-gradient-to-r from-transparent to-purple-500/40"></div>
                <h3 className="text-[9px] font-syncopate font-black text-purple-400 uppercase tracking-[0.4em]">Curadoria de Sinais</h3>
                <div className="h-px w-6 bg-gradient-to-l from-transparent to-purple-500/40"></div>
             </div>
             
             <div className="flex flex-wrap justify-center gap-6">
                {coLeaders.map(cl => (
                  <button 
                    key={cl.userId} 
                    onClick={() => onViewProfile({ name: cl.personaName || cl.userId, avatarUrl: cl.personaAvatar || '', rank: cl.cityRank, level: cl.cityLevel, isMe: false, reputation: cl.cityReputation, following: 0, followers: 0 } as any)} 
                    className="flex flex-col items-center gap-2 group active:scale-95 transition-all"
                  >
                     <div className="relative">
                        <div className="w-16 h-16 rounded-full border-2 border-purple-500 p-0.5 bg-black shadow-lg overflow-hidden group-hover:border-purple-400 transition-all">
                           <img src={cl.personaAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${cl.userId}`} className="w-full h-full object-cover rounded-full" />
                        </div>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-20 bg-purple-600 text-white px-2 py-0.5 rounded-full text-[5px] font-black uppercase tracking-widest shadow-md">Curador</div>
                     </div>
                     <div className="text-center">
                        <span className="text-[9px] font-black text-slate-200 uppercase tracking-widest group-hover:text-purple-400 transition-colors">{cl.personaName || cl.userId}</span>
                     </div>
                  </button>
                ))}
             </div>
          </section>
        )}

        {/* PESQUISA E GRID DE MEMBROS EM HUBS CIRCULARES DE 3 COLUNAS */}
        <section className="space-y-8 pt-8 border-t border-white/5 animate-in fade-in duration-1000 delay-500">
           <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                 <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Unidades em Sincronia</h3>
                 <span className="text-[7px] font-bold text-slate-600 uppercase tracking-widest">{commonMembers.length} Operativos</span>
              </div>
              
              <div className="relative group">
                 <div className="absolute inset-0 bg-cyan-500/5 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                 <input 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   placeholder="Sintonizar identidade..."
                   className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 pl-12 text-xs text-white outline-none focus:border-cyan-500/40 transition-all uppercase tracking-widest font-bold placeholder:text-slate-800 shadow-inner relative z-10 backdrop-blur-md"
                 />
                 <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-cyan-400 transition-colors z-20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </div>
           </div>

           <div className="grid grid-cols-3 gap-x-2 gap-y-10 md:gap-x-6">
              {commonMembers.map((m, idx) => (
                <button 
                  key={m.userId}
                  onClick={() => onViewProfile({ name: m.personaName || m.userId, avatarUrl: m.personaAvatar || '', rank: m.cityRank, level: m.cityLevel, isMe: false, reputation: m.cityReputation, following: 0, followers: 0 } as any)}
                  className="flex flex-col items-center gap-3 transition-all group active:scale-95 animate-in slide-in-from-bottom duration-500"
                  style={{ animationDelay: `${idx * 20}ms` }}
                >
                   <div className="relative">
                      <div className="w-20 h-20 md:w-28 md:h-28 rounded-full border-2 border-white/10 p-0.5 bg-black overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)] group-hover:border-cyan-500/50 transition-all duration-500">
                         <img src={m.personaAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${m.userId}`} className="w-full h-full object-cover rounded-full grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover:opacity-10 transition-opacity"></div>
                      </div>
                      <div className="absolute -bottom-1 -right-1 flex items-center gap-1 bg-[#02040a] backdrop-blur-md px-1.5 py-0.5 rounded-full border border-white/10 shadow-md">
                         <span className="text-[6px] md:text-[7px] font-black text-cyan-400 font-orbitron">LVL {m.cityLevel}</span>
                      </div>
                   </div>
                   
                   <div className="text-center w-full px-1 flex flex-col items-center">
                      <h4 className="text-[9px] md:text-[11px] font-black text-white uppercase truncate w-full group-hover:text-cyan-400 transition-colors tracking-tighter leading-tight">{m.personaName || m.userId}</h4>
                      <div className="flex items-center justify-center gap-1.5 opacity-50">
                         <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest">{m.cityRank}</p>
                      </div>
                   </div>
                </button>
              ))}
           </div>
        </section>

        <div className="mt-12 pt-10 border-t border-white/5 text-center opacity-20">
           <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.6em]">Sincronia de Diretório Completa</span>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
};

export default CommunityMembersView;