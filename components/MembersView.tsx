
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Member {
  id: string;
  display_name: string;
}

interface MembersViewProps {
  onBack: () => void;
  onSelectMember: (member: any) => void;
}

const MembersView: React.FC<MembersViewProps> = ({ onBack, onSelectMember }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchMembers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('display_name', { ascending: true });
      
      if (error) {
        console.error('Error fetching members:', error);
      } else if (data) {
        setMembers(data);
      }
      setLoading(false);
    };

    fetchMembers();
  }, []);

  const filteredMembers = members.filter(m => 
    m.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 h-full w-full bg-[#02040a] relative overflow-y-auto no-scrollbar animate-in slide-in-from-right duration-500">
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-30">
         <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-600/5 blur-[120px] rounded-full"></div>
         <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/5 blur-[100px] rounded-full"></div>
      </div>

      <header className="px-8 py-10 flex flex-col gap-6 sticky top-0 z-50 bg-[#02040a]/40 backdrop-blur-2xl border-b border-white/5">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all active:scale-90 border border-white/5">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div className="text-center">
             <h2 className="text-2xl font-syncopate font-black text-white uppercase tracking-[0.3em] drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">Membros</h2>
             <span className="text-[7px] font-bold text-cyan-500 uppercase tracking-[0.6em] mt-1 block">Operativos Registrados</span>
          </div>
          <div className="w-12"></div>
        </div>

        <div className="relative group">
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="PROCURAR REGISTRO..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-12 text-[10px] font-black text-white uppercase tracking-[0.2em] focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.05] transition-all placeholder:text-slate-600"
          />
          <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 pb-40 pt-10 relative z-10">
        <div className="space-y-4">
          {loading ? (
             <div className="py-20 flex flex-col items-center opacity-20">
                <div className="w-8 h-8 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-white">Sincronizando registros...</p>
             </div>
          ) : filteredMembers.length === 0 ? (
            <div className="py-20 flex flex-col items-center opacity-20">
               <span className="text-4xl mb-4">👤</span>
               <p className="text-[10px] font-black uppercase tracking-widest text-white">
                  {searchQuery ? 'Interferência: Registro não encontrado' : 'Nenhum operativo encontrado'}
               </p>
            </div>
          ) : (
            filteredMembers.map((member, idx) => (
              <div 
                key={member.id}
                onClick={() => onSelectMember({
                  ...member,
                  name: member.display_name,
                  avatarUrl: member.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id}`,
                  rank: 'OPERATIVO',
                  isMe: false
                })}
                className="w-full flex items-center gap-5 p-5 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-cyan-500/40 hover:bg-cyan-500/[0.03] transition-all group relative overflow-hidden animate-in slide-in-from-right duration-500 cursor-pointer"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="w-10 font-syncopate font-black text-sm text-center text-slate-700">
                   {idx + 1}
                </div>

                <div className="relative shrink-0">
                   <div className="w-14 h-14 rounded-2xl border-2 border-white/5 overflow-hidden bg-slate-900 shadow-xl transition-transform duration-500 group-hover:scale-105">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id}`} className="w-full h-full object-cover" alt={member.display_name} />
                   </div>
                </div>

                <div className="flex-1 min-w-0 text-left">
                   <h4 className="text-sm font-black text-white uppercase tracking-widest truncate">{member.display_name}</h4>
                   <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold line-clamp-1">
                      OPERATIVO REGISTRADO • ID {member.id.substring(0, 8)}
                   </p>
                </div>

                <div className="text-right shrink-0 pr-2">
                   <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_10px_cyan] animate-pulse mx-auto mb-1" />
                   <div className="text-[6px] font-bold text-slate-600 uppercase tracking-widest">
                      CONEXÃO ATIVA
                   </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-20 py-10 border-t border-white/5 text-center opacity-30">
           <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.8em]">Fim dos Registros de Operativos</span>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
};

export default MembersView;
