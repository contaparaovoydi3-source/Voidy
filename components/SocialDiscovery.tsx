
import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile } from '../types';
import { MOCK_FOLLOWERS as SYSTEM_MOCK_FOLLOWERS } from '../data';
import { supabase } from '../lib/supabase';

interface SocialDiscoveryProps {
  onSelectMember: (member: UserProfile) => void;
  onViewProfile: (member: UserProfile) => void;
  onBack: () => void;
  isSearchMode?: boolean;
  isInviting?: boolean;
  onInviteMember?: (member: UserProfile) => void;
  members?: UserProfile[];
}

const SocialDiscovery: React.FC<SocialDiscoveryProps> = ({ 
  onSelectMember, 
  onViewProfile, 
  onBack, 
  members 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dbMembers, setDbMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!members) {
      const fetchMembers = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('display_name', { ascending: true });
          
          if (data) {
            const mapped: UserProfile[] = data.map(p => ({
              name: p.display_name || 'OPERATIVO',
              avatarUrl: p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`,
              rank: 'MEMBRO',
              level: 1,
              isMe: false,
              reputation: 0,
              following: 0,
              followers: 0,
              bio: p.bio || '',
              ...p
            }));
            setDbMembers(mapped);
          }
        } catch (err) {
          console.error('Error fetching members:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchMembers();
    }
  }, [members]);

  const displayPool = useMemo(() => {
    return members || dbMembers;
  }, [members, dbMembers]);

  const filteredMembers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return displayPool;
    return displayPool.filter(m => m.name.toLowerCase().includes(q));
  }, [searchQuery, displayPool]);

  return (
    <div className="flex-1 h-full w-full bg-[#02040a] relative overflow-hidden flex flex-col animate-in fade-in duration-500 font-inter">
      {/* Camada Estelar */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,_rgba(34,211,238,0.15)_0%,_transparent_50%)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_70%,_rgba(168,85,247,0.1)_0%,_transparent_50%)]"></div>
      </div>

      <header className="px-6 py-8 flex items-center justify-between relative z-50 shrink-0 bg-black/40 backdrop-blur-xl border-b border-white/5 shadow-2xl">
        <button onClick={onBack} className="p-2.5 bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all active:scale-90 border border-white/5">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div className="flex flex-col items-center">
           <h2 className="text-xs font-syncopate font-black text-white uppercase tracking-[0.4em]">Diretório Operativo</h2>
           <div className="flex items-center gap-2 mt-1">
              <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse"></div>
              <span className="text-[7px] font-black text-cyan-400 uppercase tracking-[0.2em]">Scanner de Frequência</span>
           </div>
        </div>
        <div className="w-12"></div>
      </header>

      <div className="px-6 pt-6 relative z-50">
         <div className="relative group">
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sintonizar identidade..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 pl-12 text-[14px] text-white outline-none focus:border-cyan-500/40 transition-all uppercase tracking-widest font-bold placeholder:text-slate-800 shadow-inner relative z-10 backdrop-blur-md"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-cyan-400 transition-colors z-20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 pb-40 relative z-10">
          <div className="grid grid-cols-3 gap-x-2 gap-y-10">
             {filteredMembers.map((member, idx) => (
               <button 
                 key={`${member.name}-${idx}`}
                 onClick={() => onViewProfile(member)}
                 className="flex flex-col items-center gap-3 transition-all group active:scale-95 animate-in slide-in-from-bottom duration-500"
                 style={{ animationDelay: `${idx * 30}ms` }}
               >
                  <div className="relative">
                     <div className="w-20 h-20 rounded-full border-2 border-white/10 p-0.5 bg-black overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)] group-hover:border-cyan-500/50 transition-all duration-500">
                        <img src={member.avatarUrl} className="w-full h-full object-cover rounded-full grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover:opacity-10 transition-opacity"></div>
                     </div>
                     <div className="absolute -bottom-1 -right-1 flex items-center gap-1 bg-[#02040a] backdrop-blur-md px-1.5 py-0.5 rounded-full border border-white/10 shadow-md">
                        <span className="text-[6px] font-black text-cyan-400 font-orbitron">LVL {member.level}</span>
                     </div>
                  </div>
                  
                  <div className="text-center w-full px-1 flex flex-col items-center">
                     <h4 className="text-[9px] font-black text-white uppercase truncate w-full group-hover:text-cyan-400 transition-colors tracking-tighter leading-tight">{member.name}</h4>
                     <div className="flex items-center justify-center gap-1.5 opacity-50">
                        <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest">{member.rank}</p>
                     </div>
                  </div>
               </button>
             ))}
          </div>

        {filteredMembers.length === 0 && (
           <div className="py-32 flex flex-col items-center justify-center opacity-20 text-center space-y-4">
              <span className="text-4xl">📡</span>
              <p className="text-[10px] font-black uppercase tracking-[0.4em]">Frequência Nula</p>
           </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
};

export default SocialDiscovery;
