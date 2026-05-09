
import React, { useState, useMemo } from 'react';
import { Community } from '../types';

interface CommunitySearchProps {
  onBack: () => void;
  communities: Community[];
  onSelect: (id: string) => void;
  onPreview: (comm: Community) => void;
}

const CommunitySearch: React.FC<CommunitySearchProps> = ({ onBack, communities, onSelect, onPreview }) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return communities.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.id.toLowerCase().includes(q) ||
      (c.theme && c.theme.toLowerCase().includes(q))
    );
  }, [query, communities]);

  return (
    <div className="flex-1 h-full w-full bg-[#050714] relative overflow-hidden flex flex-col p-6 animate-in fade-in duration-75">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none"></div>
      
      <header className="w-full flex items-center justify-between mb-10 relative z-10">
         <button onClick={onBack} className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-white transition-all active:scale-90">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M15 19l-7-7 7-7"/></svg>
         </button>
         <h2 className="text-xl font-syncopate font-black text-white uppercase tracking-[0.3em] glow-blue">Chats Públicos</h2>
         <div className="w-10"></div>
      </header>

      <div className="relative z-10 mb-8 px-2">
        <div className={`w-full h-14 md:h-16 relative rounded-full overflow-hidden transition-all duration-300 border bg-white/[0.03] flex items-center px-6 backdrop-blur-md group ${query.trim() ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)]' : 'border-white/10'}`}>
           <svg className={`w-5 h-5 mr-4 transition-colors duration-300 ${query.trim() ? 'text-blue-400' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
           <input 
             value={query} 
             onChange={(e) => setQuery(e.target.value)} 
             placeholder="Pesquisar nome ou link..." 
             className="bg-transparent border-none outline-none text-white font-bold text-[14px] md:text-sm w-full placeholder:text-slate-700 uppercase tracking-widest" 
           />
           {query && <button onClick={() => setQuery('')} className="p-1 text-slate-500 hover:text-white">✕</button>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 relative z-10 pb-32">
        {query.trim() && filtered.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center opacity-20 text-center space-y-4">
             <div className="w-16 h-16 rounded-full border border-dashed border-slate-700 flex items-center justify-center">
                <span className="text-2xl">📡</span>
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.4em]">Sinal não encontrado</p>
          </div>
        ) : filtered.map((comm, idx) => (
          <button 
            key={comm.id}
            onClick={() => onPreview(comm)}
            className="w-full p-4 rounded-[2rem] border border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-blue-500/30 transition-all duration-300 flex items-center gap-4 animate-in slide-in-from-right duration-500"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10 bg-slate-900 shrink-0 shadow-lg">
               <img src={comm.avatar} className="w-full h-full object-cover" alt={comm.name} />
            </div>
            <div className="flex-1 text-left min-w-0">
               <h4 className="text-[11px] font-black text-white uppercase truncate tracking-widest">{comm.name}</h4>
               <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[6px] font-bold text-blue-400 uppercase">{comm.theme}</span>
                  <span className="text-[6px] font-bold text-slate-600 uppercase tracking-tighter">{comm.membersCount} Consciências</span>
               </div>
            </div>
            <div className="p-2 opacity-30"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M9 5l7 7-7 7"/></svg></div>
          </button>
        ))}
        {!query.trim() && (
          <div className="h-64 flex flex-col items-center justify-center opacity-10 text-center px-10">
             <p className="text-[9px] font-black uppercase tracking-[0.5em] leading-relaxed">Inicie a varredura neural para localizar novos setores...</p>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .glow-blue { text-shadow: 0 0 15px rgba(59, 130, 246, 0.4); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}} />
    </div>
  );
};

export default CommunitySearch;
