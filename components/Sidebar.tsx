
import React from 'react';
import { Character, GameState } from '../types';

interface SidebarProps {
  character: Character | null;
  gameState: GameState;
  onReset: () => void;
  isMobileFull?: boolean;
  userAvatar: string;
}

const Sidebar: React.FC<SidebarProps> = ({ character, gameState, onReset, isMobileFull, userAvatar }) => {
  if (!character) return null;

  // Filtragem e normalização do inventário para exibição
  const validItems = (character.inventory || []).filter(item => item !== null);

  return (
    <div className={`${isMobileFull ? 'w-full h-full' : 'w-80 h-full border-r border-slate-800/50'} glass flex flex-col p-6 z-10 relative rounded-3xl overflow-hidden`}>
      <div className="absolute right-0 top-0 h-full w-[1px] bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent"></div>

      <div className="mb-10 text-center">
        <h1 className="text-2xl font-syncopate font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-1">
          OPERATIVO
        </h1>
        <div className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-medium">
          Status de Consciência: Estável
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
        <section className="bg-slate-900/40 p-5 rounded-2xl border border-white/5 text-center">
          <div className="w-20 h-20 bg-slate-800 rounded-full mx-auto mb-4 border-2 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)] overflow-hidden">
             <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <h3 className="text-xl font-bold text-slate-100">{character.name}</h3>
          <div className="text-[11px] text-cyan-400 font-orbitron uppercase tracking-widest mt-1">
            {character.class}
          </div>
        </section>

        <section>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(character.stats).map(([stat, value]) => (
              <div key={stat} className="bg-slate-900/40 p-4 rounded-2xl border border-white/5 text-center">
                <div className="text-[9px] text-slate-500 uppercase mb-1 tracking-widest">{stat}</div>
                <div className="text-xl font-orbitron text-cyan-400">{value}</div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 ml-2">Módulos de Inventário</h3>
          <div className="space-y-2">
            {validItems.length > 0 ? (
              validItems.map((item, i) => {
                const itemName = typeof item === 'string' ? item : item.name;
                const itemIcon = typeof item === 'object' && item.icon ? item.icon : '📦';
                
                return (
                  <div key={i} className="bg-slate-900/20 p-3 rounded-xl border border-white/5 flex items-center justify-between animate-in fade-in slide-in-from-left-2 duration-300">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{itemIcon}</span>
                      <span className="text-[10px] text-slate-300 uppercase font-black tracking-tight">{itemName}</span>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_5px_cyan]"></div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 opacity-20 text-[8px] uppercase tracking-[0.4em] border-2 border-dashed border-white/5 rounded-2xl">
                Setor de Carga Vazio
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="pt-6 mt-auto">
        <button 
          onClick={onReset}
          className="w-full py-4 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-orbitron font-bold rounded-2xl tracking-[0.3em] uppercase hover:bg-red-500/20 transition-all"
        >
          Finalizar Sessão
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
