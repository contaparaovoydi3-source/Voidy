
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob as GenAIBlob } from '@google/genai';
import { Character } from '../types';
import { SYSTEM_INSTRUCTION, MODEL_LIVE } from '../constants';

interface VoiceInterfaceProps { 
  character: Character; 
  isMuted?: boolean;
  sessionType?: 'IA' | 'PRIVADO' | 'CLUSTER' | 'PUBLICO';
  onToggleMute?: () => void;
  onEndCall?: () => void;
  onMinimize?: () => void;
  onVideoSelect?: (video: { id: string, type: 'local' | 'youtube', source: string, name: string }) => void;
}

const FormattedVoiceText: React.FC<{ text: string }> = ({ text }) => {
  const processTags = (raw: string) => {
    const processed = raw.split('\n').map(line => {
      let p = line;
      p = p.replace(/\[([cbisu]+)\](.*?)\[\/\1\]/gi, (match, tags, content) => {
        let res = content;
        const t = tags.toLowerCase();
        if (t.includes('b')) res = `<strong>${res}</strong>`;
        if (t.includes('i')) res = `<em class="italic">${res}</em>`;
        if (t.includes('s')) res = `<span class="line-through">${res}</span>`;
        if (t.includes('u')) res = `<span class="underline">${res}</span>`;
        if (t.includes('c')) res = `<div class="text-center w-full my-1">${res}</div>`;
        return res;
      });
      p = p.replace(/\[B\](.*?)(\[\/B\]|$)/gi, '<strong>$1</strong>');
      p = p.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
      return p;
    }).join('<br />');
    return { __html: processed };
  };
  return <div className="formatted-voice-message w-full" dangerouslySetInnerHTML={processTags(text)} />;
};

export default function VoiceInterface({ character, isMuted = false, sessionType = 'IA', onToggleMute, onEndCall, onMinimize, onVideoSelect }: VoiceInterfaceProps) {
  const [protocol, setProtocol] = useState<'NONE' | 'TRANSMISSION' | 'MULTIMEDIA'>(() => {
    return (localStorage.getItem(`void_active_proto_${character.name}`) as any) || 'NONE';
  });
  const [isConnecting, setIsConnecting] = useState(true);
  const [transcriptions, setTranscriptions] = useState<{ role: string, text: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  
  const [showYtInput, setShowYtInput] = useState(false);
  const [ytUrl, setYtUrl] = useState('');
  
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);

  const sessionRef = useRef<any>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const currentInputTransRef = useRef<string>('');
  const currentOutputTransRef = useRef<string>('');
  
  const videoInputRef = useRef<HTMLInputElement>(null);
  const userSilenceTimerRef = useRef<any>(null);
  const isMutedRef = useRef(isMuted);

  const isGroupCall = sessionType === 'CLUSTER' || sessionType === 'PUBLICO';

  // Mock participants for group call visual
  const [mockParticipants] = useState(() => {
    if (!isGroupCall) return [];
    return [
      { id: '1', name: 'Kael.Null', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kael' },
      { id: '2', name: 'Echo-01', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Echo' },
      { id: '3', name: 'Nova_Prime', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nova' }
    ];
  });

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
    return buffer;
  };

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const createBlob = (data: Float32Array): GenAIBlob => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) int16[i] = data[i] * 32768;
    return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
  };

  const handleYTSync = () => {
    const match = ytUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    if (match && match[1]) {
      if (onVideoSelect) {
        onVideoSelect({ id: Date.now().toString(), type: 'youtube', source: match[1], name: 'YouTube Sinal' });
      }
      setYtUrl('');
      setShowYtInput(false);
    }
  };

  const handleLocalVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (onVideoSelect) {
        onVideoSelect({ id: Date.now().toString(), type: 'local', source: url, name: file.name.toUpperCase() });
      }
    }
  };

  const handleEndCallFinal = () => {
    localStorage.removeItem(`void_active_proto_${character.name}`);
    
    // Desligar o microfone fisicamente
    if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;
    }

    if (sessionRef.current) {
        try { sessionRef.current.close(); } catch(e) {}
    }
    if (onEndCall) onEndCall();
  };

  const handleSetProtocol = (p: 'NONE' | 'TRANSMISSION' | 'MULTIMEDIA') => {
    setProtocol(p);
    if (p !== 'NONE') {
      localStorage.setItem(`void_active_proto_${character.name}`, p);
    } else {
      localStorage.removeItem(`void_active_proto_${character.name}`);
    }
  };

  useEffect(() => {
    if (protocol !== 'TRANSMISSION') return;

    const initLiveSession = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = audioStream;

        const sessionPromise = ai.live.connect({
          model: MODEL_LIVE,
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } },
            systemInstruction: SYSTEM_INSTRUCTION,
            outputAudioTranscription: {},
            inputAudioTranscription: {},
          },
          callbacks: {
            onopen: () => {
              setIsConnecting(false);
              const source = inputAudioContextRef.current!.createMediaStreamSource(audioStream);
              const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                let maxVal = 0;
                for(let i=0; i<inputData.length; i++) {
                    const abs = Math.abs(inputData[i]);
                    if(abs > maxVal) maxVal = abs;
                }
                if(maxVal > 0.05) {
                    setIsUserSpeaking(true);
                    if(userSilenceTimerRef.current) clearTimeout(userSilenceTimerRef.current);
                    userSilenceTimerRef.current = setTimeout(() => setIsUserSpeaking(false), 300);
                }
                // Fix: Solely rely on sessionPromise to send input as per Live API guidelines
                sessionPromise.then((session: any) => {
                  if (session && !isMutedRef.current) {
                    session.sendRealtimeInput({ media: createBlob(inputData) });
                  }
                });
              };
              source.connect(scriptProcessor);
              scriptProcessor.connect(inputAudioContextRef.current!.destination);
            },
            onmessage: async (m: LiveServerMessage) => {
              if (m.serverContent?.outputTranscription) currentOutputTransRef.current += m.serverContent.outputTranscription.text;
              else if (m.serverContent?.inputTranscription) currentInputTransRef.current += m.serverContent.inputTranscription.text;
              if (m.serverContent?.turnComplete) {
                if (currentInputTransRef.current) setTranscriptions(prev => [{ role: character.name, text: currentInputTransRef.current }, ...prev.slice(0, 3)]);
                if (currentOutputTransRef.current) setTranscriptions(prev => [{ role: 'NEXUS', text: currentOutputTransRef.current }, ...prev.slice(0, 3)]);
                currentInputTransRef.current = ''; currentOutputTransRef.current = '';
              }
              const audio = m.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              if (audio && audioContextRef.current) {
                setIsAiSpeaking(true);
                const ctx = audioContextRef.current;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                const buffer = await decodeAudioData(decode(audio), ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = buffer; 
                source.connect(ctx.destination);
                source.onended = () => {
                    sourcesRef.current.delete(source);
                    if(sourcesRef.current.size === 0) setIsAiSpeaking(false);
                };
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                sourcesRef.current.add(source);
              }
            },
            // Fix: Added mandatory onerror and onclose callbacks for live connection
            onerror: (e: ErrorEvent) => {
              console.debug('got error', e);
            },
            onclose: (e: CloseEvent) => {
              console.debug('closed', e);
            },
          }
        });
        sessionRef.current = await sessionPromise;
      } catch (err) { setError("Falha no link."); console.error(err); }
    };
    initLiveSession();
    return () => {
      sourcesRef.current.forEach(s => s.stop());
      if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) audioContextRef.current.close();
      if (inputAudioContextRef.current) inputAudioContextRef.current.close();
      if (sessionRef.current) try { sessionRef.current.close(); } catch(e) {}
    };
  }, [protocol, character.name]);

  if (protocol === 'NONE') {
    return (
      <div className="bg-[#0a0c1a] border-2 border-cyan-500 rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(34,211,238,0.4)] animate-in zoom-in duration-300 pointer-events-auto w-[300px] mx-auto relative">
        {onMinimize && (
          <button onClick={onMinimize} className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 active:scale-90 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
          </button>
        )}
        <div className="flex flex-col gap-5">
          <div className="text-center mb-2">
            <h3 className="text-[10px] font-syncopate font-black text-cyan-400 uppercase tracking-[0.3em]">Link Neural</h3>
            <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest mt-1">Selecionar Protocolo</p>
          </div>

          <button 
            onClick={() => handleSetProtocol('TRANSMISSION')}
            className="w-full py-6 bg-black border border-cyan-500/50 rounded-2xl flex flex-col items-center justify-center gap-3 active:scale-95 transition-all group"
          >
            <span className="text-3xl">📞</span>
            <span className="text-[10px] font-syncopate font-black text-white uppercase tracking-[0.2em]">Chamada</span>
          </button>

          <button 
            onClick={() => handleSetProtocol('MULTIMEDIA')}
            className="w-full py-6 bg-black border border-cyan-500/50 rounded-2xl flex flex-col items-center justify-center gap-3 active:scale-95 transition-all group"
          >
            <span className="text-3xl">🎞️</span>
            <span className="text-[10px] font-syncopate font-black text-white uppercase tracking-[0.2em]">Mídia</span>
          </button>

          <button 
            onClick={onEndCall}
            className="w-full mt-2 py-3 text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] hover:text-white transition-colors border-t border-white/5 pt-6"
          >
            Abortar
          </button>
        </div>
      </div>
    );
  }

  if (protocol === 'MULTIMEDIA') {
    return (
      <div className="bg-[#0a0c1a] border-2 border-cyan-500 rounded-[2.5rem] p-8 shadow-[0_0_30px_rgba(34,211,238,0.3)] animate-in fade-in duration-500 w-[320px] mx-auto relative">
        {onMinimize && (
          <button onClick={onMinimize} className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 active:scale-90 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
          </button>
        )}
        <div className="text-center mb-8">
           <h2 className="text-[9px] font-syncopate font-black text-cyan-400 uppercase tracking-[0.3em] mb-1">Multimídia</h2>
           <p className="text-[6px] text-slate-500 uppercase font-black">Selecionar Fonte</p>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full">
          <button 
            onClick={() => videoInputRef.current?.click()}
            className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/50 transition-all active:scale-95 flex flex-col items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xl">📂</div>
            <h3 className="text-[7px] font-black text-white uppercase tracking-widest">Galeria</h3>
            <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={handleLocalVideo} />
          </button>

          <button 
            onClick={() => setShowYtInput(true)}
            className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-red-500/50 transition-all active:scale-95 flex flex-col items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-xl">📺</div>
            <h3 className="text-[7px] font-black text-white uppercase tracking-widest">YouTube</h3>
          </button>
        </div>

        <button onClick={() => setProtocol('NONE')} className="w-full mt-8 text-[7px] font-black text-slate-600 uppercase tracking-[0.3em] hover:text-white">Voltar</button>

        {showYtInput && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-in fade-in">
             <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowYtInput(false)} />
             <div className="relative w-full max-sm bg-[#0a0c1a] border border-red-500/30 rounded-[2.5rem] p-8 shadow-2xl">
                <h4 className="text-[10px] font-syncopate font-black text-white uppercase mb-6 tracking-widest text-center">Vincular YouTube</h4>
                <div className="space-y-4">
                   <input value={ytUrl} onChange={(e) => setYtUrl(e.target.value)} placeholder="Cole o link aqui..." className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-white outline-none focus:border-red-500" />
                   <div className="flex gap-2">
                      <button onClick={() => setShowYtInput(false)} className="flex-1 py-3 bg-white/5 rounded-xl text-[9px] font-black uppercase text-slate-500">Cancelar</button>
                      <button onClick={handleYTSync} className="flex-1 py-3 bg-red-600 text-white rounded-xl text-[9px] font-black uppercase">Sincronizar</button>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 w-full min-h-[500px] flex flex-col relative bg-black overflow-hidden font-inter border-2 border-cyan-500 rounded-[3rem] shadow-[0_0_40px_rgba(34,211,238,0.2)]">
      {showEndConfirmation && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowEndConfirmation(false)} />
          <div className="relative w-full max-w-xs bg-[#050714] border border-red-500/30 rounded-[2.5rem] p-6 shadow-2xl flex flex-col items-center text-center gap-6">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-3xl">⚠️</div>
            <div className="space-y-2">
               <h3 className="text-xs font-syncopate font-black text-white uppercase tracking-widest">Desconectar Sinal?</h3>
               <p className="text-[10px] text-slate-400 font-medium leading-relaxed uppercase tracking-wider">A chamada vocal será encerrada permanentemente. O chat de texto permanecerá ativo.</p>
            </div>
            <div className="flex flex-col gap-3 w-full">
               <button onClick={handleEndCallFinal} className="w-full py-4 bg-red-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] active:scale-95 shadow-xl">Encerrar Chamada</button>
               <button onClick={() => setShowEndConfirmation(false)} className="w-full py-4 bg-white/5 border border-white/10 text-slate-400 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em]">Continuar</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 relative bg-slate-950 flex flex-col items-center justify-center overflow-hidden p-6">
          {/* USER HUBS GRID - Só aparece em canais de texto comuns */}
          {isGroupCall ? (
            <div className="w-full max-w-md grid grid-cols-2 gap-6 md:gap-10 animate-in zoom-in duration-700">
               {/* Current User Hub */}
               <div className="flex flex-col items-center gap-3">
                  <div className={`w-28 h-28 md:w-32 md:h-32 rounded-full border-[3px] transition-all duration-300 flex items-center justify-center bg-black/40 backdrop-blur-md ${isUserSpeaking ? 'border-cyan-500 shadow-[0_0_30px_rgba(34,211,238,0.4)] scale-105' : 'border-white/10'}`}>
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-900 overflow-hidden">
                       <img src={localStorage.getItem('void_user_avatar') || ''} className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-widest ${isUserSpeaking ? 'text-cyan-400' : 'text-slate-500'}`}>{character.name} (Você)</span>
               </div>

               {/* Nexus AI Hub */}
               <div className="flex flex-col items-center gap-3">
                  <div className={`w-28 h-28 md:w-32 md:h-32 rounded-full border-[3px] transition-all duration-300 flex items-center justify-center bg-black/40 backdrop-blur-md ${isAiSpeaking ? 'border-pink-500 shadow-[0_0_30px_rgba(236,72,153,0.4)] scale-105' : 'border-white/10'}`}>
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-900 overflow-hidden">
                       <img src="https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Nexus" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-widest ${isAiSpeaking ? 'text-pink-400' : 'text-slate-500'}`}>NEXUS</span>
               </div>

               {/* Mock Participants */}
               {mockParticipants.map(p => (
                 <div key={p.id} className="flex flex-col items-center gap-3 opacity-60">
                    <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-[3px] border-white/5 flex items-center justify-center bg-black/20">
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-900 overflow-hidden grayscale">
                         <img src={p.avatar} className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-700">{p.name}</span>
                 </div>
               ))}
            </div>
          ) : (
            /* Single Hub for Private/AI Calls */
            <div className="flex flex-col items-center gap-10 z-10 animate-in zoom-in duration-700">
              <div className={`w-36 h-36 rounded-full border-[3px] transition-all duration-700 flex items-center justify-center bg-black/60 backdrop-blur-md ${isAiSpeaking ? 'border-pink-500 shadow-[0_0_50px_rgba(236,72,153,0.3)] scale-110' : 'border-white/10'}`}>
                <div className={`w-24 h-24 rounded-full bg-slate-900 overflow-hidden transition-all ${isAiSpeaking ? 'scale-90' : 'scale-100'}`}><img src="https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Nexus" className="w-full h-full object-cover" /></div>
              </div>
              <div className="text-center space-y-2">
                <h3 className={`text-xs font-syncopate font-black uppercase tracking-[0.4em] ${isMuted ? 'text-red-500' : 'text-white'}`}>{isConnecting ? 'Sincronizando...' : isMuted ? 'Microfone Mutado' : 'Link Ativo'}</h3>
              </div>
            </div>
          )}
      </div>

      <div className="absolute inset-x-0 bottom-40 px-6 flex flex-col gap-3 pointer-events-none z-40">
        {transcriptions.map((t, i) => (
          <div key={i} className={`flex ${t.role === 'NEXUS' ? 'justify-start' : 'justify-end'} animate-in slide-in-from-bottom-2 duration-500`}>
            <div className={`max-w-[75%] p-4 rounded-[1.8rem] backdrop-blur-2xl border shadow-2xl ${t.role === 'NEXUS' ? 'bg-black/40 border-pink-500/40 text-pink-100' : 'bg-white/5 border-white/20 text-white'}`}>
              <span className="text-[7px] font-black uppercase opacity-30 block mb-1.5">{t.role}</span>
              <div className="text-[10px] md:text-xs font-semibold leading-relaxed"><FormattedVoiceText text={t.text} /></div>
            </div>
          </div>
        ))}
      </div>

      <div className="h-36 bg-[#02040a] border-t border-white/5 flex items-center justify-around px-8 shrink-0 relative z-50">
        {onMinimize ? (
          <button 
              onClick={onMinimize}
              className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all"
              title="Minimizar"
          >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
          </button>
        ) : (
          <div className="w-14" />
        )}
        
        <button 
            onClick={onToggleMute}
            className={`w-20 h-20 rounded-full border-[4px] flex items-center justify-center transition-all active:scale-95 ${isUserSpeaking ? 'border-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.3)] bg-cyan-500/10' : isMuted ? 'border-red-500/40 bg-red-950/20' : 'border-white/10 bg-black'}`}
            title={isMuted ? "Desmutar" : "Mutar"}
        >
            <svg className={`w-9 h-9 ${isUserSpeaking ? 'text-cyan-400' : isMuted ? 'text-red-500' : 'text-slate-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              {isMuted ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z M3 3l18 18" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"/>
              )}
            </svg>
        </button>
        
        <button 
            onClick={() => setShowEndConfirmation(true)}
            className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 active:scale-90 transition-all"
            title="Encerrar Ligação"
        >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
}
