
import React, { useState, useEffect } from 'react';
import { DragonO } from './Lobby';
import { supabase } from '../lib/supabase';

interface AuthScreenProps {
  onLogin: (user: any, profile?: any) => void;
  initialUser?: any;
  initialView?: 'main' | 'signup' | 'signin' | 'nick';
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, initialUser, initialView }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'main' | 'signup' | 'signin' | 'nick'>(initialView || 'main');
  const [nick, setNick] = useState('');
  const [pendingUser, setPendingUser] = useState<any>(initialUser || null);

  useEffect(() => {
    if (initialUser && !pendingUser) {
      setPendingUser(initialUser);
      setView('nick');
    } else if (initialView) {
      setView(initialView);
    }
  }, [initialUser, initialView]);

  const saveProfile = () => {
    if (!nick || !(pendingUser || initialUser)) return;
    const targetUser = pendingUser || initialUser;
    const finalNick = nick.trim().toUpperCase();

    // Fire and forget - Dispara em background
    supabase
      .from('profiles')
      .upsert({ id: targetUser.id, display_name: finalNick }, { onConflict: 'id' })
      .then(({ error }) => {
        if (error) console.error('Silent profile sync error:', error);
      });

    // Transição imediata para a Home com o valor local
    onLogin(targetUser, { display_name: finalNick });
  };

  const handleSignUp = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      if (data.user) {
        // PER USER REQUEST: Immediate transition, no waiting.
        setLoading(false); 
        setPendingUser(data.user);
        setView('nick');
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      if (data.user) {
        // PER USER REQUEST: Sign in goes straight to login handler (Home)
        setLoading(false);
        onLogin(data.user);
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };
  return (
    <div className="flex-1 h-full w-full relative overflow-hidden px-6 md:px-10 py-8 md:py-16 flex flex-col items-center justify-center gap-4 md:gap-8 z-20 bg-void">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-cyan-500/5 rounded-full blur-[80px] md:blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-blue-600/5 rounded-full blur-[70px] md:blur-[100px] animate-pulse-slow delay-700"></div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-black/80 pointer-events-none" />
      
      <div className="flex flex-col items-center animate-neural-sync mb-2 md:mb-4">
        <div className="relative group">
          <div className="absolute inset-0 bg-cyan-400/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
          <h1 className="text-4xl md:text-6xl font-syncopate font-black text-white tracking-[-0.12em] flex items-center gap-1.5 md:gap-3 relative z-10 drop-shadow-[0_0_20px_rgba(34,211,238,0.4)] animate-float">
            V<DragonO className="text-3xl md:text-5xl text-white" />IDY
          </h1>
        </div>
        <p className="text-[5px] md:text-[7px] font-black text-cyan-400 uppercase tracking-[0.4em] md:tracking-[0.6em] mt-1 md:mt-2 opacity-40 animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-300 text-center">
          Deep Frost Narrative
        </p>
      </div>

      <div className="flex flex-col gap-2 md:gap-3 w-full max-w-[240px] md:max-w-[320px] z-30">
        {view === 'main' ? (
          <>
            <button 
              onClick={() => {}} 
              disabled={loading}
              className={`w-full py-2 md:py-3 bg-white text-black rounded-xl md:rounded-2xl flex items-center justify-center gap-2.5 font-bold text-[9px] md:text-[11px] active:scale-95 transition-all shadow-xl hover:bg-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500 fill-mode-both ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <img src="https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png" className="w-3 h-3 md:w-4 md:h-4" alt="Google" />
              {loading ? 'Sincronizando...' : 'Acessar com Google'}
            </button>

            <button 
              onClick={() => {}} 
              disabled={loading}
              className={`w-full py-2 md:py-3 bg-[#1877F2] text-white rounded-xl md:rounded-2xl flex items-center justify-center gap-2.5 font-bold text-[9px] md:text-[11px] active:scale-95 transition-all shadow-xl hover:brightness-110 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700 fill-mode-both ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg className="w-3 h-3 md:w-4 md:h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              {loading ? 'Sincronizando...' : 'Acessar com Facebook'}
            </button>

            <div className="flex items-center gap-2.5 my-0.5 animate-in fade-in duration-1000 delay-[900ms] fill-mode-both">
              <div className="flex-1 h-[1px] bg-white/5" />
              <span className="text-[6px] md:text-[7px] font-black text-slate-800 uppercase tracking-widest">Ou</span>
              <div className="flex-1 h-[1px] bg-white/5" />
            </div>

            <button 
              onClick={() => setView('signup')}
              disabled={loading}
              className={`w-full py-2 md:py-3 bg-transparent border border-cyan-500/10 text-cyan-400/80 rounded-xl md:rounded-2xl font-bold text-[9px] md:text-[11px] active:scale-95 transition-all hover:bg-cyan-500/5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[1100ms] fill-mode-both ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Criar conta com email
            </button>

            <button 
              onClick={() => setView('signin')}
              disabled={loading}
              className={`mt-1 text-[7px] md:text-[8px] font-black text-slate-600 uppercase tracking-[0.1em] hover:text-white transition-colors text-center animate-in fade-in duration-1000 delay-[1300ms] fill-mode-both ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Já tenho uma conta. <span className="text-cyan-400/60">Acessar</span>
            </button>
          </>
        ) : view === 'nick' ? (
          <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="text-center mb-2">
              <h2 className="text-cyan-400 font-extrabold text-[10px] md:text-[13px] uppercase tracking-tighter">Escolha seu Nickname</h2>
              <p className="text-slate-500 text-[6px] md:text-[8px] font-medium uppercase tracking-widest">Identidade na Rede Voidy</p>
            </div>
            <input
              type="text"
              placeholder="Digite seu nickname..."
              autoFocus
              value={nick}
              onChange={(e) => setNick(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 md:py-3 bg-white/5 border border-cyan-500/30 rounded-xl md:rounded-2xl text-white text-[9px] md:text-[11px] placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/60 transition-all font-mono"
            />
            {error && <p className="text-red-400 text-[6px] md:text-[8px] font-bold text-center uppercase tracking-wider">{error}</p>}
            
            <button 
              onClick={saveProfile}
              className="w-full py-2 md:py-3 mt-1 bg-cyan-500 text-black rounded-xl md:rounded-2xl font-black text-[9px] md:text-[11px] active:scale-95 transition-all shadow-xl hover:bg-cyan-400 shadow-cyan-500/20"
            >
              Salvar Perfil
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <input
              type="email"
              placeholder="Email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 md:py-3 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl text-white text-[9px] md:text-[11px] placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all font-medium"
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 md:py-3 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl text-white text-[9px] md:text-[11px] placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all font-medium"
            />
            {error && <p className="text-red-400 text-[6px] md:text-[8px] font-bold text-center uppercase tracking-wider">{error}</p>}
            
            <button 
              onClick={view === 'signup' ? handleSignUp : handleSignIn}
              className="w-full py-2 md:py-3 mt-1 bg-cyan-500 text-black rounded-xl md:rounded-2xl font-black text-[9px] md:text-[11px] active:scale-95 transition-all shadow-xl hover:bg-cyan-400"
            >
              {view === 'signup' ? 'Confirmar Cadastro' : 'Entrar na Conta'}
            </button>

            <button 
              onClick={() => { 
                if (pendingUser || initialUser) return; // Prevent going back if mandatory nick registration
                setView('main'); 
                setError(null); 
              }}
              className={`mt-2 text-[6px] md:text-[7px] font-bold text-slate-500 uppercase tracking-widest hover:text-white transition-colors ${(pendingUser || initialUser) ? 'hidden' : ''}`}
            >
              Voltar
            </button>
          </div>
        )}
      </div>

      <div className="absolute bottom-4 md:bottom-6 opacity-10 animate-pulse">
        <span className="text-[5px] md:text-[6px] font-black uppercase tracking-[0.4em] text-slate-500">Secure Neural Link V1.0</span>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        .animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
        .fill-mode-both { animation-fill-mode: both; }
      `}} />
    </div>
  );
};

export default AuthScreen;
