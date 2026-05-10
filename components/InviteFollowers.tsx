
import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile } from '../types';
import { supabase } from '../lib/supabase';

interface InviteFollowersProps {
  onBack: () => void;
  onInviteMember: (member: UserProfile) => void;
}

const InviteFollowers: React.FC<InviteFollowersProps> = ({ onBack, onInviteMember }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const [dbMembers, setDbMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('display_name', { ascending: true });
      
      if (data) {
        setDbMembers(data.map(p => ({
          name: p.display_name || 'OPERATIVO',
          avatarUrl: p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`,
          rank: 'OPERATIVO',
          level: 1,
          id: p.id,
          isMe: false
        })));
      }
      setLoading(false);
    };
    fetchMembers();
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return dbMembers;
    return dbMembers.filter(m => m.name.toLowerCase().includes(q));
  }, [searchQuery, dbMembers]);

  const handleInvite = (member: UserProfile) => {
    if (invitedIds.has(member.name)) return;
    setInvitedIds(prev => new Set([...prev, member.name]));
    onInviteMember(member);
    if (navigator.vibrate) navigator.vibrate(50);
  };

  return (
    <div className="flex-1 h-full w-full bg-[#02040a] relative overflow-hidden flex flex-col animate-in slide-in-from-right duration-500 font-inter">
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
           <h2 className="text-xs font-syncopate font-black text-white uppercase tracking-[0.4em]">Convidar Seguidores</h2>
           <div className="flex items-center gap-2 mt-1">
              <div className="w-1 h-1 rounded-full bg-amber-400 animate-pulse"></div>
              <span className="text-[7px] font-black text-amber-400 uppercase tracking-[0.2em]">Direct Neural Link</span>
           </div>
        </div>
        <div className="w-12"></div>
      </header>

      <div className="px-6 pt-6 relative z-50">
         <div className="relative group">
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Localizar rastro neural..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 pl-12 text-xs text-white outline-none focus:border-cyan-500/40 transition-all uppercase tracking-widest font-bold placeholder:text-slate-800 shadow-inner relative z-10 backdrop-blur-md"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-cyan-400 transition-colors z-20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 pb-40 relative z-10">
        <div className="flex flex-col gap-4">
          {filtered.map((member, idx) => {
            const isInvited = invitedIds.has(member.name);
            return (
              <div 
                key={`${member.name}-${idx}`}
                className={`group relative w-full p-5 rounded-3xl bg-white/[0.02] border transition-all duration-300 flex items-center gap-4 animate-in slide-in-from-bottom duration-500 ${isInvited ? 'border-green-500/20 bg-green-500/5' : 'border-white/5 hover:border-cyan-500/30'}`}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 shrink-0 bg-slate-900 shadow-xl">
                   <img src={member.avatarUrl} className="w-full h-full object-cover" alt={member.name} />
                </div>
                <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-[11px] font-black text-white uppercase truncate tracking-widest">{member.name}</h4>
                      <span className="text-[6px] font-black px-1 py-0.5 rounded bg-white/5 border border-white/5 text-slate-500">LVL {member.level}</span>
                   </div>
                   <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">{member.rank} • Rastro Estável</p>
                </div>
                <button 
                  onClick={() => handleInvite(member)}
                  disabled={isInvited}
                  className={`px-5 py-3 rounded-2xl text-[8px] font-black uppercase tracking-widest transition-all active:scale-95 ${isInvited ? 'bg-green-600 text-white border border-green-400/50' : 'bg-white text-black hover:bg-cyan-50 shadow-lg'}`}
                >
                  {isInvited ? '✓ Enviado' : 'Convidar'}
                </button>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
           <div className="py-32 flex flex-col items-center justify-center opacity-20 text-center space-y-4">
              <span className="text-4xl">📡</span>
              <p className="text-[10px] font-black uppercase tracking-[0.4em]">Frequência Isola</p>
           </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-[#02040a] via-[#02040a] to-transparent pointer-events-none">
          <button 
            onClick={onBack}
            className="w-full py-5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] pointer-events-auto active:scale-95 transition-all shadow-2xl"
          >
            Encerrar Protocolo
          </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
};

export default InviteFollowers;
