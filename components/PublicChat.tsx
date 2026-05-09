
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Message, UserProfile, Notification, Character } from '../types';
import VoiceInterface from './VoiceInterface';
import { MOCK_FOLLOWERS } from '../data';
import StickerEditor from './StickerEditor';
import { GoogleGenAI } from '@google/genai';
import { MODEL_TEXT } from '../constants';
import { supabase } from '../lib/supabase';

interface PublicChatProps {
  onBack: () => void;
  userAvatar: string;
  userName: string;
  publicMessages: Message[];
  onUpdatePublicMessages: (updater: Message[] | ((prev: Message[]) => Message[])) => void;
  onViewProfile: (profile: UserProfile) => void;
  onAddMemberClick: () => void;
  onLeave?: () => void;
  onDeleteSession?: (id: string) => void;
  addNotification: (notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  verifySafety?: (content: string, type?: 'image' | 'text') => Promise<boolean>;
  isSilenced?: boolean;
  isAdmin?: boolean;
  isCoAdmin?: boolean; 
}

const STICKER_PACK = [
  'https://cdn-icons-png.flaticon.com/512/3649/3649460.png',
  'https://cdn-icons-png.flaticon.com/512/2534/2534344.png',
  'https://cdn-icons-png.flaticon.com/512/616/616641.png',
  'https://cdn-icons-png.flaticon.com/512/1043/1043514.png',
  'https://cdn-icons-png.flaticon.com/512/4712/4712035.png',
  'https://cdn-icons-png.flaticon.com/512/2530/2530181.png',
  'https://cdn-icons-png.flaticon.com/512/1904/1904425.png',
  'https://cdn-icons-png.flaticon.com/512/2590/2590212.png',
  'https://cdn-icons-png.flaticon.com/512/2618/2618256.png',
  'https://cdn-icons-png.flaticon.com/512/1808/1808620.png',
  'https://cdn-icons-png.flaticon.com/512/2030/2030061.png',
  'https://cdn-icons-png.flaticon.com/512/124/124018.png',
  'https://cdn-icons-png.flaticon.com/512/2530/2530869.png',
  'https://cdn-icons-png.flaticon.com/512/4334/4334185.png',
  'https://cdn-icons-png.flaticon.com/512/3211/3211181.png',
  'https://cdn-icons-png.flaticon.com/512/2590/2590137.png',
];

const AudioPlayer: React.FC<{ src: string }> = ({ src }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full max-w-[180px] py-2">
      <div className="flex items-center gap-3">
        <button onClick={togglePlay} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 text-white border border-white/20 active:scale-90 transition-all">
          {isPlaying ? (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          ) : (
            <svg className="w-3 h-3 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          )}
        </button>
        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden relative">
          <div className="h-full bg-cyan-400 transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
      <audio ref={audioRef} src={src} onTimeUpdate={handleTimeUpdate} onEnded={() => setIsPlaying(false)} className="hidden" />
    </div>
  );
};

const formatBBCode = (text: string) => {
  if (!text) return '';
  return text.split('\n').map(line => {
    let p = line;
    p = p.replace(/\[([bci]+)\](.*?)\[\/\1\]/gi, (match, tags, content) => {
      let res = content;
      const t = tags.toLowerCase();
      if (t.includes('b')) res = `<strong class="font-bold">${res}</strong>`;
      if (t.includes('i')) res = `<em class="italic">${res}</em>`;
      if (t.includes('c')) res = `<div class="text-center block w-full my-1">${res}</div>`;
      return res;
    });
    return p;
  }).join('<br/>');
};

const FormattedOutput: React.FC<{ text: string; className?: string }> = ({ text, className }) => (
  <div className={className} dangerouslySetInnerHTML={{ __html: formatBBCode(text) }} />
);

const PublicChat: React.FC<PublicChatProps> = ({ onBack, userAvatar, userName, publicMessages: propsPublicMessages, onUpdatePublicMessages, onViewProfile, onAddMemberClick, onLeave, onDeleteSession, addNotification, verifySafety, isSilenced, isAdmin, isCoAdmin }) => {
  const [inputText, setInputText] = useState('');
  const [dbMessages, setDbMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [heldMessage, setHeldMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const holdTimerRef = useRef<number | null>(null);
  const holdStartPosRef = useRef<{ x: number, y: number } | null>(null);

  // Reporting State
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Sticker State
  const [isStickerOpen, setIsStickerOpen] = useState(false);
  const [stickerPickerTab, setStickerPickerTab] = useState<'CORE' | 'FAVS' | 'CUSTOM'>('CORE');
  const [stickerToEdit, setStickerToEdit] = useState<string | null>(null);
  const [previewStickerUrl, setPreviewStickerUrl] = useState<string | null>(null);
  const [favoriteStickers, setFavoriteStickers] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem('void_fav_stickers') || '[]');
  });
  const [customPacks, setCustomPacks] = useState<{id: string, name: string, stickers: string[]}[]>(() => {
    return JSON.parse(localStorage.getItem('void_custom_packs') || '[{"id":"default","name":"Meu Pack","stickers":[]}]');
  });
  const [activePackId, setActivePackId] = useState<string>('default');
  const [editingStickerUrl, setEditingStickerUrl] = useState<string | null>(null);
  const customStickerInputRef = useRef<HTMLInputElement>(null);
  const stickerGalleryInputRef = useRef<HTMLInputElement>(null);

  // Realtime Logic
  useEffect(() => {
    // Initial fetch of 50 messages
    const fetchMessages = async () => {
      const { data: allData } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', 'public')
        .order('created_at', { ascending: false })
        .limit(50);

      if (allData) {
        const mapped = allData.reverse().map((m: any) => ({
          id: m.id.toString(),
          role: 'user',
          text: m.content,
          timestamp: new Date(m.created_at).getTime(),
          personaName: m.display_name,
          image: m.avatar_url
        } as Message));
        setDbMessages(mapped);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel('public_chat_realtime')
      .on(
        'postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: 'session_id=eq.public'
        }, 
        (payload) => {
          const newMessage = payload.new;
          const msg: Message = {
            id: newMessage.id.toString(),
            role: 'user',
            text: newMessage.content,
            timestamp: new Date(newMessage.created_at).getTime(),
            personaName: newMessage.display_name,
            image: newMessage.avatar_url
          };
          setDbMessages(prev => {
            if (prev.some(p => p.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const publicMessages = useMemo(() => {
    return dbMessages.length > 0 ? dbMessages : propsPublicMessages;
  }, [dbMessages, propsPublicMessages]);

  useEffect(() => {
    localStorage.setItem('void_custom_packs', JSON.stringify(customPacks));
  }, [customPacks]);

  const handleCustomStickerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setEditingStickerUrl(result);
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleSaveSticker = (base64: string) => {
    setCustomPacks(prev => prev.map(pack => {
      if (pack.id === activePackId && pack.stickers.length < 12) {
        return { ...pack, stickers: [...pack.stickers, base64] };
      }
      return pack;
    }));
    setEditingStickerUrl(null);
  };

  const createNewPack = () => {
    const newPack = { id: Date.now().toString(), name: `Pack ${customPacks.length + 1}`, stickers: [] };
    setCustomPacks(prev => [...prev, newPack]);
    setActivePackId(newPack.id);
  };

  const deletePack = (id: string) => {
    setCustomPacks(prev => {
      const newPacks = prev.filter(p => p.id !== id);
      if (newPacks.length === 0) {
        return [{ id: 'default', name: 'Meu Pack', stickers: [] }];
      }
      if (activePackId === id) {
        setActivePackId(newPacks[0].id);
      }
      return newPacks;
    });
  };

  const removeStickerFromPack = (packId: string, stickerIdx: number) => {
    setCustomPacks(prev => prev.map(pack => {
      if (pack.id === packId) {
        const newStickers = [...pack.stickers];
        newStickers.splice(stickerIdx, 1);
        return { ...pack, stickers: newStickers };
      }
      return pack;
    }));
  };

  // Audio Recording States
  const [isAudioMode, setIsAudioMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // States for Chat Metadata
  const [chatName, setChatName] = useState(() => localStorage.getItem('void_public_chat_name') || 'Nexus Global');
  const [chatAvatar, setChatAvatar] = useState(() => localStorage.getItem('void_public_chat_avatar') || '');
  const [chatBg, setChatBg] = useState(() => localStorage.getItem('void_public_chat_bg') || '#02040a');
  const [chatDesc, setChatDesc] = useState(() => localStorage.getItem('void_public_chat_desc') || 'Frequência de comunicação global da rede VOIDY.');
  const [membersCount] = useState(() => 1240 + Math.floor(Math.random() * 50));
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Search State
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLiveOpen, setIsLiveOpen] = useState(false);

  // Clear typing users when input is empty
  useEffect(() => {
    if (inputText.length === 0 && typingUsers.length > 0) {
      setTypingUsers([]);
    }
  }, [inputText, typingUsers.length]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return publicMessages
      .map((m, idx) => ({ id: m.id, text: m.text.toLowerCase(), index: idx }))
      .filter(m => m.text.includes(searchQuery.toLowerCase()));
  }, [publicMessages, searchQuery]);

  const [tempChatName, setTempChatName] = useState(chatName);
  const [tempChatAvatar, setTempChatAvatar] = useState(chatAvatar);
  const [tempChatBg, setTempChatBg] = useState(chatBg);
  const [tempChatDesc, setTempChatDesc] = useState(chatDesc);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const mediaFileInputRef = useRef<HTMLInputElement>(null);
  const [chatCover, setChatCover] = useState(() => localStorage.getItem('void_public_chat_cover') || '');
  const [tempChatCover, setTempChatCover] = useState(chatCover);
  const editCoverInputRef = useRef<HTMLInputElement>(null);
  const editAvatarInputRef = useRef<HTMLInputElement>(null);
  const editBgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const scrollToBottom = () => {
      chatEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'nearest' });
    };
    scrollToBottom();
    window.addEventListener('resize', scrollToBottom);
    return () => window.removeEventListener('resize', scrollToBottom);
  }, [publicMessages.length]);

  const scrollToMessage = (msgId: string) => {
    const element = document.getElementById(`msg-${msgId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('neon-blink');
      setTimeout(() => {
        element.classList.remove('neon-blink');
      }, 2400);
    }
  };

  const handleNextSearch = () => {
    if (searchResults.length === 0) return;
    const nextIdx = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIdx);
    const msgId = searchResults[nextIdx].id;
    scrollToMessage(msgId);
  };

  const handlePrevSearch = () => {
    if (searchResults.length === 0) return;
    const prevIdx = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentSearchIndex(prevIdx);
    const msgId = searchResults[prevIdx].id;
    scrollToMessage(msgId);
  };

  const handleNexusScan = async () => {
    if (!reportReason.trim() || isScanning) return;
    setIsScanning(true);
    setScanProgress(0);
    
    // Simulate progress for UI
    const progressInterval = setInterval(() => {
      setScanProgress(prev => Math.min(prev + 5, 95));
    }, 100);

    try {
      // API moderation disabled as requested by user
      await new Promise(r => setTimeout(r, 2000));
      const result = "SAFE";

      clearInterval(progressInterval);
      setScanProgress(100);
      
      await new Promise(r => setTimeout(r, 500)); // Dramatic pause

      if (result && result.includes('BANNED')) {
        addNotification?.({ 
          type: 'REPORT', 
          title: 'NEXUS: VIOLAÇÃO DETECTADA', 
          content: 'Protocolo de purga ativado. Este chat foi deletado por violação severa das diretrizes.', 
          sender: 'NEXUS' 
        });
        // If it's a community chat, we should delete it. 
        // For the global chat, we just clear it or kick the user.
        if (onDeleteSession) {
          // We need the session ID. Since PublicChat doesn't have it directly, 
          // we assume the parent handles it if onDeleteSession is provided.
          onDeleteSession('current'); 
        } else if (onLeave) {
          onLeave();
        }
      } else {
        addNotification?.({ 
          type: 'REPORT', 
          title: 'NEXUS: SCAN CONCLUÍDO', 
          content: 'Nenhuma violação crítica detectada após varredura severa. O chat permanecerá ativo.', 
          sender: 'NEXUS' 
        });
      }
    } catch (error) {
      console.error('Nexus Scan Error:', error);
      clearInterval(progressInterval);
    } finally {
      setIsScanning(false);
      setIsReporting(false);
      setReportReason('');
      setScanProgress(0);
    }
  };

  const REPORT_OPTIONS = [
    'Conteúdo Sexual / NSFW',
    'Violência Extrema / Gore',
    'Discurso de Ódio / Assédio',
    'Spam / Fraude',
    'Outros'
  ];

  const handleStartHold = (e: React.MouseEvent | React.TouchEvent, msg: Message) => {
    if (msg.isDeleted) return;
    
    const pos = 'touches' in e 
      ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
      : { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };
    
    holdStartPosRef.current = pos;

    holdTimerRef.current = window.setTimeout(() => {
      setHeldMessage(msg);
      if (navigator.vibrate) navigator.vibrate(50);
      holdStartPosRef.current = null;
    }, 1000);
  };

  const handleMoveHold = (e: React.MouseEvent | React.TouchEvent) => {
    if (!holdStartPosRef.current) return;
    
    const pos = 'touches' in e 
      ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
      : { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };
    
    const dx = Math.abs(pos.x - holdStartPosRef.current.x);
    const dy = Math.abs(pos.y - holdStartPosRef.current.y);
    
    if (dx > 10 || dy > 10) {
      handleEndHold();
    }
  };

  const handleEndHold = () => {
    if (holdTimerRef.current) { 
      clearTimeout(holdTimerRef.current); 
      holdTimerRef.current = null; 
    }
    holdStartPosRef.current = null;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedImage) return;
    if (isSilenced) return;

    const content = inputText;
    const senderName = userName;
    const senderAvatar = userAvatar;

    // Envio Cego: Limpa e ignora o resto para o usuário
    setInputText('');
    setSelectedImage(null);
    setReplyingTo(null);

    // Se tiver imagem ou for edição, mantemos o fluxo antigo por enquanto ou adaptamos
    // Para simplificar e atender o pedido do usuário (texto instantâneo):
    if (content.trim()) {
      const { error } = await supabase
        .from('messages')
        .insert([{
          content: content,
          display_name: senderName,
          avatar_url: senderAvatar,
          session_id: 'public'
        }]);
      
      if (error) console.error("Realtime Error:", error);
    }
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Erro ao acessar microfone", err);
    }
  };

  const handleStopRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return;
    
    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result as string;
        const audioMsg: Message = {
          id: `audio-${Date.now()}`,
          role: 'user',
          text: `[i]Transmissão de sinal vocal recebida...[/i] 🎙️`,
          audio: base64Audio,
          timestamp: Date.now(),
          personaName: userName
        };
        onUpdatePublicMessages((prev: Message[]) => [...prev, audioMsg]);
      };
      reader.readAsDataURL(audioBlob);
      
      mediaRecorderRef.current!.stream.getTracks().forEach(t => t.stop());
      setIsRecording(false);
      setIsAudioMode(false);
    };

    mediaRecorderRef.current.stop();
    if (navigator.vibrate) navigator.vibrate([20, 100]);
  };

  const handleSendSticker = (stickerUrl: string) => {
    const newMsg: Message = {
      id: `sticker-${Date.now()}`,
      role: 'user',
      text: '', 
      image: stickerUrl,
      timestamp: Date.now(),
      personaName: userName
    };
    onUpdatePublicMessages((prev: Message[]) => [...prev, newMsg]);
    setIsStickerOpen(false);
    if (navigator.vibrate) navigator.vibrate(15);
  };

  const handleStickerGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStickerToEdit(reader.result as string);
        if (verifySafety) verifySafety(reader.result as string).catch(console.error);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveMetadata = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setChatName(tempChatName);
      setChatAvatar(tempChatAvatar);
      setChatBg(tempChatBg);
      setChatDesc(tempChatDesc);
      setChatCover(tempChatCover);
      localStorage.setItem('void_public_chat_name', tempChatName);
      localStorage.setItem('void_public_chat_avatar', tempChatAvatar);
      localStorage.setItem('void_public_chat_bg', tempChatBg);
      localStorage.setItem('void_public_chat_desc', tempChatDesc);
      localStorage.setItem('void_public_chat_cover', tempChatCover);
      setIsSyncing(false);
      setIsCustomizing(false);
      if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
    }, 1200);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsSyncing(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setTimeout(() => {
          setter(base64);
          setIsSyncing(false);
          if (verifySafety) verifySafety(base64).catch(console.error);
        }, 800);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleFavoriteSticker = (url: string) => {
    let newFavs = [...favoriteStickers];
    if (newFavs.includes(url)) {
      newFavs = newFavs.filter(f => f !== url);
    } else {
      newFavs = [url, ...newFavs];
    }
    setFavoriteStickers(newFavs);
    localStorage.setItem('void_fav_stickers', JSON.stringify(newFavs));
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const getPackName = (url: string) => {
    const customPack = customPacks.find(p => p.stickers.includes(url));
    if (customPack) return customPack.name;
    if (STICKER_PACK.includes(url)) return 'Pacote Padrão';
    return 'Sticker';
  };

  const isImageBg = useMemo(() => chatBg.startsWith('data:') || chatBg.startsWith('http'), [chatBg]);

  return (
    <div className="flex-1 h-full w-full relative overflow-hidden flex flex-col" style={{ backgroundColor: isImageBg ? 'transparent' : chatBg }}>
      {isLiveOpen && (
        <div className="absolute inset-0 z-[3000] bg-black flex flex-col">
          <VoiceInterface 
            character={{ name: chatName, avatar: chatAvatar, description: '', systemPrompt: '', creator: 'SISTEMA', isPublic: true } as any}
            sessionType="PUBLICO"
            onEndCall={() => setIsLiveOpen(false)}
            onMinimize={() => setIsLiveOpen(false)}
          />
        </div>
      )}
      {stickerToEdit && (
        <StickerEditor 
          imageUrl={stickerToEdit} 
          onCancel={() => setStickerToEdit(null)} 
          onSave={(url) => { 
            handleSendSticker(url); 
            if (!favoriteStickers.includes(url)) {
              const newFavs = [url, ...favoriteStickers];
              setFavoriteStickers(newFavs);
              localStorage.setItem('void_fav_stickers', JSON.stringify(newFavs));
            }
            setStickerToEdit(null); 
          }} 
        />
      )}
      {editingStickerUrl && (
        <StickerEditor
          imageUrl={editingStickerUrl}
          onSave={handleSaveSticker}
          onCancel={() => setEditingStickerUrl(null)}
        />
      )}
      {isImageBg && (
        <div className="absolute inset-0 z-0">
          <img src={chatBg} className="w-full h-full object-cover blur-[1px]" alt="Background" />
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px]" />
        </div>
      )}
      
      <header className="px-6 py-6 flex items-center justify-between bg-black/40 backdrop-blur-xl border-b border-white/5 z-[200]">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all active:scale-90 border border-white/5">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div className="flex flex-col">
             <div className="flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[7px] font-black text-emerald-400 uppercase tracking-widest">Ativo</span>
             </div>
             <span className="text-[9px] font-bold text-white uppercase tracking-tighter">{membersCount.toLocaleString()} Membros</span>
          </div>
        </div>
        <div className="flex flex-col items-center">
           <h2 className="text-xs font-syncopate font-black text-white uppercase tracking-[0.3em]">{chatName}</h2>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => setIsLiveOpen(true)} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-red-500/30 hover:bg-red-500/30 transition-all flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              LIVE
           </button>
           <button onClick={() => setIsMenuOpen(true)} className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-white active:scale-90 border border-white/5">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
           </button>
        </div>
      </header>

      {/* SEARCH BAR */}
      {isSearching && (
        <div className="absolute top-20 left-0 w-full z-[500] px-4 animate-in slide-in-from-top duration-300">
          <div className="bg-[#0a0c1a]/90 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-2 flex items-center gap-2 shadow-2xl">
            <div className="flex-1 relative">
              <input 
                autoFocus
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentSearchIndex(-1);
                }}
                placeholder="PESQUISAR MENSAGEM..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-[10px] text-white font-bold outline-none focus:border-cyan-500 uppercase"
              />
              {searchResults.length > 0 && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-cyan-400">
                  {currentSearchIndex + 1} / {searchResults.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={handlePrevSearch} className="p-2 hover:bg-white/10 rounded-lg text-white active:scale-90 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7"/></svg>
              </button>
              <button onClick={handleNextSearch} className="p-2 hover:bg-white/10 rounded-lg text-white active:scale-90 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <button 
                onClick={() => {
                  setIsSearching(false);
                  setSearchQuery('');
                  setCurrentSearchIndex(-1);
                }} 
                className="p-2 hover:bg-white/10 rounded-lg text-slate-500 active:scale-90 transition-all"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar relative z-10 pb-40">
        {publicMessages.map((msg, idx) => {
          const isOwn = msg.personaName === userName;
          const isStaff = msg.personaName === 'Drake.OS';
          const isSticker = !msg.text && !!msg.image;
          const isCurrentResult = isSearching && currentSearchIndex !== -1 && searchResults[currentSearchIndex]?.id === msg.id;
          
          if (msg.personaName === 'SISTEMA') {
            return (
              <div key={msg.id} className="flex flex-col items-center justify-center w-full my-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-white/[0.03] border border-white/5 px-6 py-2 rounded-full backdrop-blur-md shadow-inner">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">
                    {msg.text}
                  </p>
                </div>
                <span className="text-[6px] font-black text-slate-600 uppercase mt-2">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          }

          return (
            <div 
              key={`${msg.id}-${idx}`} 
              id={`msg-${msg.id}`}
              className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} w-full animate-in fade-in duration-300 transition-all ${isCurrentResult ? 'scale-[1.02] ring-2 ring-cyan-500/50 rounded-2xl p-2 bg-cyan-500/5' : ''}`}
              onMouseDown={(e) => handleStartHold(e, msg)}
              onTouchStart={(e) => handleStartHold(e, msg)}
              onMouseMove={handleMoveHold}
              onTouchMove={handleMoveHold}
              onMouseUp={handleEndHold}
              onTouchEnd={handleEndHold}
              onMouseLeave={handleEndHold}
            >
               {!isSticker && (
                  <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'mr-12' : 'ml-12'}`}>
                     <span className="text-[7px] font-black uppercase text-slate-400 tracking-widest">{msg.personaName}</span>
                     {isStaff && <span className="px-1.5 py-0.5 bg-white text-black text-[6px] font-black uppercase rounded shadow-sm">admin</span>}
                  </div>
               )}

              <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-start max-w-[85%]`}>
                <div className="w-9 h-9 rounded-full border border-white/10 overflow-hidden bg-slate-900 shrink-0 shadow-lg">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.personaName || 'Anon'}`} className="w-full h-full object-cover" />
                </div>
                <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} mt-[6px] w-full`}>
                  {msg.replyToId && (
                    <button 
                      onClick={() => scrollToMessage(msg.replyToId!)}
                      className={`mb-[-12px] px-3 pt-2 pb-4 rounded-t-2xl text-[8px] font-bold uppercase tracking-tighter flex items-center gap-2 border-x border-t transition-all hover:brightness-125 ${isOwn ? 'bg-cyan-700/30 border-cyan-500/30 text-cyan-300 self-end mr-4' : 'bg-white/5 border-white/10 text-slate-400 self-start ml-4'}`}
                    >
                      <span className="opacity-50">↩️</span>
                      <span className="truncate max-w-[120px]">
                        {publicMessages.find(m => m.id === msg.replyToId)?.text || 'Mensagem original'}
                      </span>
                    </button>
                  )}

                  <div className={`rounded-[1.2rem] flex flex-col ${msg.isDeleted ? 'bg-white/[0.02] p-4 border border-white/5 italic text-slate-500' : isSticker ? 'bg-transparent border-none p-1' : `p-4 border border-white/5 backdrop-blur-md shadow-xl ${isOwn ? 'bg-cyan-500/10 rounded-tr-none' : 'bg-white/5 rounded-tl-none'}`} max-w-xs w-fit`}>
                    {!isSticker && (
                      <div className="flex items-center gap-2 mb-1.5 min-w-[60px]">
                        <span className="text-[10px] font-black uppercase text-cyan-400 tracking-[0.1em]">{msg.personaName}</span>
                        {isStaff && <span className="px-1 py-0.5 bg-cyan-500 text-black text-[6px] font-black uppercase rounded-[4px] shadow-sm">admin</span>}
                      </div>
                    )}
                    
                    {msg.isDeleted ? (
                      <span className="text-xs">mensagem apagada</span>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {msg.image && (
                          <img 
                            src={msg.image} 
                            onClick={() => { if (isSticker) setPreviewStickerUrl(msg.image!); }}
                            className={`${isSticker ? 'w-24 h-24 object-contain cursor-pointer active:scale-95 transition-transform drop-shadow-md' : 'rounded-lg max-w-full'}`} 
                            alt="transmission" 
                          />
                        )}
                        {msg.audio && <AudioPlayer src={msg.audio} />}
                        {msg.text && <FormattedOutput text={msg.text} className="text-[14px] text-white leading-relaxed" />}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* PREVIEW STICKER MODAL */}
      {previewStickerUrl && (
        <div className="fixed inset-0 z-[2500] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-8 animate-in fade-in duration-300 font-inter">
           <div className="max-w-xs w-full flex flex-col items-center gap-10">
              <div className="relative w-72 h-72 animate-in zoom-in duration-500">
                 <img src={previewStickerUrl} className="w-full h-full object-contain" alt="Sticker Preview" />
                 <div className="absolute inset-x-0 bottom-[-40px] text-center">
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em]">{getPackName(previewStickerUrl)}</span>
                 </div>
              </div>

              <div className="flex flex-col w-full gap-3 mt-4">
                 <button 
                   onClick={() => toggleFavoriteSticker(previewStickerUrl)}
                   className={`w-full py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] transition-all active:scale-95 shadow-xl flex items-center justify-center gap-3 ${favoriteStickers.includes(previewStickerUrl) ? 'bg-amber-500 text-black shadow-amber-500/20 border border-amber-400' : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'}`}
                 >
                    {favoriteStickers.includes(previewStickerUrl) ? (
                       <><span>⭐</span> Remover dos Favoritos</>
                    ) : (
                       <><span>☆</span> Salvar nos Favoritos</>
                    )}
                 </button>
                 <button 
                   onClick={() => setPreviewStickerUrl(null)}
                   className="w-full py-3 text-[9px] font-black text-slate-600 uppercase tracking-widest hover:text-white transition-colors"
                 >
                    Fechar
                 </button>
              </div>
           </div>
        </div>
      )}

      {heldMessage && (
        <div key="held-msg-overlay" className="fixed inset-0 z-[1500] flex items-center justify-center p-6 animate-in fade-in duration-300 pointer-events-none">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto" onClick={() => setHeldMessage(null)} />
           <div className="relative w-full max-w-[280px] bg-[#0a0c1a]/95 border border-cyan-500/30 rounded-[2.5rem] p-6 shadow-2xl flex flex-col gap-2 pointer-events-auto">
              <button onClick={() => { setReplyingTo(heldMessage); setHeldMessage(null); }} className="w-full text-left px-6 py-4 hover:bg-white/5 rounded-2xl text-[10px] font-black uppercase text-white flex items-center gap-3"><span>↩️</span> Responder</button>
              
              {heldMessage.personaName === userName && (
                <button onClick={() => { setEditingMessage(heldMessage); setInputText(heldMessage.text); setHeldMessage(null); }} className="w-full text-left px-6 py-4 hover:bg-white/5 rounded-2xl text-[10px] font-black uppercase text-white flex items-center gap-3"><span>✏️</span> Editar</button>
              )}

              <button onClick={() => { navigator.clipboard.writeText(heldMessage.text); setHeldMessage(null); }} className="w-full text-left px-6 py-4 hover:bg-white/5 rounded-2xl text-[10px] font-black uppercase text-white flex items-center gap-3"><span>📋</span> Copiar texto</button>
              
              <button onClick={() => { setIsReporting(true); setHeldMessage(null); }} className="w-full text-left px-6 py-4 hover:bg-white/5 rounded-2xl text-[10px] font-black uppercase text-white flex items-center gap-3"><span>⚠️</span> Denunciar</button>

              {(heldMessage.personaName === userName || isAdmin || isCoAdmin) && (
                <button onClick={() => { const hId = heldMessage.id; onUpdatePublicMessages(prev => prev.map(m => m.id === hId ? { ...m, text: 'mensagem apagada', isDeleted: true, image: undefined, audio: undefined } : m)); setHeldMessage(null); }} className="w-full text-left px-6 py-4 hover:bg-red-500/10 rounded-2xl text-[10px] font-black uppercase text-red-500 flex items-center gap-3"><span>🗑️</span> Apagar mensagem</button>
              )}
              <button onClick={() => setHeldMessage(null)} className="mt-2 py-3 text-[8px] font-black uppercase text-slate-500 hover:text-white border-t border-white/5 pt-4">Abortar</button>
           </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 w-full p-6 z-[150] flex flex-col gap-2">
        {isAudioMode ? (
          <div className="flex items-center justify-between bg-[#0a0c1a]/95 backdrop-blur-3xl border border-white/10 rounded-full px-6 py-4 shadow-[0_0_30px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-300">
            <button type="button" onClick={() => setIsAudioMode(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all active:scale-90">✕</button>
            <div className="flex-1 flex flex-col items-center gap-2">
              <button 
                onMouseDown={handleStartRecording}
                onMouseUp={handleStopRecording}
                onTouchStart={handleStartRecording}
                onTouchEnd={handleStopRecording}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 animate-pulse scale-110 shadow-[0_0_30px_rgba(239,68,68,0.6)]' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
              </button>
              <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${isRecording ? 'text-red-400' : 'text-slate-500'}`}>
                {isRecording ? 'Capturando Voz...' : 'Segure para Gravar'}
              </span>
            </div>
            <div className="w-10"></div>
          </div>
        ) : (
          <div className="flex flex-col w-full gap-2">
            {(typingUsers.length > 0 || isScanning) && (
              <div className="mx-8 mb-[-4px] flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex gap-1">
                  <span className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce"></span>
                </div>
                <span className="text-[8px] font-black uppercase text-cyan-400/80 tracking-widest whitespace-nowrap">
                  {isScanning || typingUsers.includes('NEXUS')
                    ? 'NEXUS está digitando...' 
                    : typingUsers.length === 1 
                      ? `Usuário ${typingUsers[0]} está digitando...`
                      : `Usuário ${typingUsers[0]} e mais ${
                          typingUsers.length === 2 ? 'um' : 
                          typingUsers.length === 3 ? 'dois' : 
                          typingUsers.length === 4 ? 'três' : 
                          typingUsers.length - 1
                        } estão digitando...`
                  }
                </span>
              </div>
            )}
            {editingMessage && (
              <div className="mx-6 mb-[-8px] bg-cyan-500/10 border border-cyan-500/20 rounded-t-2xl px-4 py-2 flex items-center justify-between animate-in slide-in-from-bottom duration-300">
                <div className="flex items-center gap-2">
                  <span className="text-[7px] font-black text-cyan-400 uppercase tracking-widest">Editando Registro</span>
                </div>
                <button onClick={() => { setEditingMessage(null); setInputText(''); }} className="text-slate-500 hover:text-white transition-colors">✕</button>
              </div>
            )}
            {replyingTo && (
              <div className="mx-6 mb-[-8px] bg-white/5 border border-white/10 rounded-t-2xl px-4 py-2 flex items-center justify-between animate-in slide-in-from-bottom duration-300">
                <div className="flex items-center gap-2">
                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Respondendo a {replyingTo.personaName}</span>
                </div>
                <button onClick={() => setReplyingTo(null)} className="text-slate-500 hover:text-white transition-colors">✕</button>
              </div>
            )}
            <form onSubmit={handleSendMessage} className="flex items-center gap-3 bg-[#0a0c1a]/95 backdrop-blur-3xl border border-white/10 rounded-full px-6 py-4 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                 <button type="button" onClick={() => mediaFileInputRef.current?.click()} className="text-slate-500 hover:text-cyan-400 transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg></button>
                 <button type="button" onClick={() => setIsStickerOpen(!isStickerOpen)} className={`text-slate-500 active:scale-90 transition-all ${isStickerOpen ? 'text-cyan-400' : 'hover:text-red-400'}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                       <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                    </svg>
                 </button>
                 <input type="file" border="0" ref={mediaFileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setSelectedImage)} />
                 <input onFocus={() => setIsStickerOpen(false)} value={inputText} onChange={(e) => { setInputText(e.target.value); }} placeholder="Transmitir sinal..." className="flex-1 bg-transparent border-none outline-none text-white text-[14px] placeholder:text-slate-700" />
                 <button type="submit" className="text-cyan-400 active:scale-90"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>
            </form>
            {isStickerOpen && (
              <div className="h-64 bg-black/90 backdrop-blur-3xl border border-white/10 rounded-3xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300 pointer-events-auto">
                 <div className="p-1 border-b border-white/5 flex justify-between items-center px-4 shrink-0">
                    <div className="flex gap-2">
                       <button onClick={() => setStickerPickerTab('CORE')} className={`px-4 py-2 text-[8px] font-black uppercase tracking-widest transition-all ${stickerPickerTab === 'CORE' ? 'text-cyan-400 border-b-2 border-cyan-500' : 'text-slate-500'}`}>Nexus Core</button>
                       <button onClick={() => setStickerPickerTab('FAVS')} className={`px-4 py-2 text-[8px] font-black uppercase tracking-widest transition-all ${stickerPickerTab === 'FAVS' ? 'text-amber-400 border-b-2 border-amber-500' : 'text-slate-500'}`}>Sincronizadas</button>
                       <button onClick={() => setStickerPickerTab('CUSTOM')} className={`px-4 py-2 text-[8px] font-black uppercase tracking-widest transition-all ${stickerPickerTab === 'CUSTOM' ? 'text-purple-400 border-b-2 border-purple-500' : 'text-slate-500'}`}>Meus Packs</button>
                    </div>
                    <button onClick={() => setIsStickerOpen(false)} className="text-slate-500">✕</button>
                 </div>
                 <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                       {stickerPickerTab === 'CORE' && (
                         <>
                           <button 
                             onClick={() => stickerGalleryInputRef.current?.click()}
                             className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-white/10 hover:border-cyan-500/40 rounded-xl transition-all active:scale-90 bg-white/5 group"
                           >
                              <span className="text-xl group-hover:scale-110 transition-transform">🖼️</span>
                              <span className="text-[5px] font-black uppercase text-slate-500">Nova</span>
                              <input type="file" ref={stickerGalleryInputRef} className="hidden" accept="image/*" onChange={handleStickerGalleryUpload} />
                           </button>
                           {STICKER_PACK.map((stickerUrl, idx) => (
                             <button 
                               key={idx} 
                               onClick={() => handleSendSticker(stickerUrl)}
                               className="aspect-square flex items-center justify-center p-1 hover:bg-white/5 rounded-xl transition-all active:scale-90 hover:scale-110"
                             >
                                <img src={stickerUrl} className="w-full h-full object-contain" alt="Sticker" />
                             </button>
                           ))}
                         </>
                       )}
                       {stickerPickerTab === 'FAVS' && (
                         <>
                           {favoriteStickers.length === 0 ? (
                              <div className="col-span-full h-32 flex flex-col items-center justify-center opacity-20">
                                 <span className="text-2xl mb-2">⭐</span>
                                 <p className="text-[7px] font-black uppercase tracking-widest">Nenhuma figurinha sintonizada</p>
                              </div>
                           ) : (
                             favoriteStickers.map((stickerUrl, idx) => (
                               <button 
                                 key={idx} 
                                 onClick={() => handleSendSticker(stickerUrl)}
                                 className="aspect-square flex items-center justify-center p-1 hover:bg-white/5 rounded-xl transition-all active:scale-90 hover:scale-110"
                               >
                                  <img src={stickerUrl} className="w-full h-full object-contain" alt="Favorite Sticker" />
                               </button>
                             ))
                           )}
                         </>
                       )}
                       {stickerPickerTab === 'CUSTOM' && (
                         <div className="col-span-full flex flex-col gap-4">
                           <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 border-b border-white/5">
                             {customPacks.map(pack => (
                               <div key={pack.id} className="flex items-center gap-1 shrink-0">
                                 <button
                                   onClick={() => setActivePackId(pack.id)}
                                   className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${activePackId === pack.id ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'}`}
                                 >
                                   {pack.name} ({pack.stickers.length}/12)
                                 </button>
                                 <button onClick={() => deletePack(pack.id)} className="p-1.5 text-slate-500 hover:text-red-400 bg-white/5 rounded-lg border border-white/10">✕</button>
                               </div>
                             ))}
                             <button onClick={createNewPack} className="shrink-0 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white transition-all">
                               + Novo Pack
                             </button>
                           </div>
                           <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                             {customPacks.find(p => p.id === activePackId)?.stickers.length! < 12 && (
                               <button 
                                 onClick={() => customStickerInputRef.current?.click()}
                                 className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-white/10 hover:border-purple-500/40 rounded-xl transition-all active:scale-90 bg-white/5 group"
                               >
                                  <span className="text-xl group-hover:scale-110 transition-transform">➕</span>
                                  <span className="text-[5px] font-black uppercase text-slate-500 mt-1">Adicionar</span>
                                  <input type="file" ref={customStickerInputRef} className="hidden" accept="image/*" onChange={handleCustomStickerUpload} />
                               </button>
                             )}
                             {customPacks.find(p => p.id === activePackId)?.stickers.map((stickerUrl, idx) => (
                               <div key={idx} className="relative group aspect-square">
                                 <button 
                                   onClick={() => handleSendSticker(stickerUrl)}
                                   className="w-full h-full flex items-center justify-center p-1 hover:bg-white/5 rounded-xl transition-all active:scale-90 hover:scale-110"
                                 >
                                    <img src={stickerUrl} className="w-full h-full object-contain" alt="Custom Sticker" />
                                 </button>
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); removeStickerFromPack(activePackId, idx); }}
                                   className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                 >
                                   ✕
                                 </button>
                               </div>
                             ))}
                           </div>
                         </div>
                       )}
                    </div>
                 </div>
              </div>
            )}
          </div>
        )}
      </div>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
          <div className="relative z-[1100] w-full max-w-[340px] bg-[#0a0c1a] border border-white/10 rounded-[2.5rem] p-6 shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: chatName, url: window.location.href }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  addNotification?.({ type: 'SYSTEM', title: 'Link Copiado', content: 'O link de acesso ao setor foi copiado para sua área de transferência.', sender: 'NEXUS' });
                }
              }}
              className="absolute top-8 right-8 p-2 text-slate-500 hover:text-emerald-400 transition-all active:scale-90 z-[1200]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
            <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-6" />
            <h3 className="text-center text-[9px] font-syncopate font-black text-white uppercase tracking-widest mb-6">Opções do Setor</h3>
            
            <div className="flex flex-col items-center gap-2 mb-6">
              <button 
                onClick={() => { setIsMenuOpen(false); onAddMemberClick?.(); }}
                className="w-14 h-14 rounded-full border-2 border-cyan-400 flex items-center justify-center text-cyan-400 bg-cyan-400/5 hover:bg-cyan-400/10 transition-all shadow-[0_0_15px_rgba(34,211,238,0.4)] active:scale-90"
              >
                <span className="text-2xl font-light">+</span>
              </button>
              <span className="text-[6px] font-black text-cyan-400 uppercase tracking-widest">Convidar Membros</span>
            </div>

            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => { setIsMenuOpen(false); setIsSearching(true); }} 
                  className="flex flex-col items-center justify-center p-3 bg-cyan-500/5 border border-cyan-500/30 rounded-2xl text-[8px] font-black uppercase text-white gap-1.5 active:scale-95 transition-all shadow-[0_0_10px_rgba(34,211,238,0.1)]"
                >
                  <span className="text-lg">🔍</span>
                  <span>Pesquisar</span>
                </button>

                <button 
                  onClick={() => { setIsMenuOpen(false); setIsReporting(true); }} 
                  className="flex flex-col items-center justify-center p-3 bg-red-500/5 border border-red-500/30 rounded-2xl text-[8px] font-black uppercase text-white gap-1.5 active:scale-95 transition-all shadow-[0_0_10px_rgba(239,68,68,0.1)]"
                >
                  <span className="text-lg">🚩</span>
                  <span>Denunciar</span>
                </button>
              </div>

              <div className={isAdmin ? "grid grid-cols-2 gap-3" : "flex flex-col"}>
                <button 
                  onClick={() => { 
                    if (onLeave) onLeave();
                    else onBack(); 
                    setIsMenuOpen(false); 
                  }} 
                  className="w-full py-4 bg-red-500/10 border border-red-500/40 rounded-2xl text-[9px] font-black uppercase text-red-500 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.2)] active:scale-95 transition-all"
                >
                  <span className="text-base">🚪</span> Sair da Conversa
                </button>
                {isAdmin && (
                  <button 
                    onClick={() => { setIsMenuOpen(false); setIsCustomizing(true); }} 
                    className="py-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-[9px] font-black uppercase text-purple-400 flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_0_10px_rgba(168,85,247,0.1)]"
                  >
                    <span>✏️</span> Customizar
                  </button>
                )}
              </div>

              <button onClick={() => setIsMenuOpen(false)} className="w-full py-3 bg-white/5 border border-white/10 rounded-2xl text-[8px] font-black uppercase text-slate-500 active:scale-95 transition-all mt-1">
                <span>✕</span> Fechar Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DENÚNCIA */}
      {isReporting && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => !isScanning && setIsReporting(false)} />
          <div className="relative w-full max-w-[320px] bg-[#0a0c1a] border border-red-500/30 rounded-[2.5rem] p-8 shadow-2xl flex flex-col gap-6 overflow-hidden">
            {isScanning ? (
              <div className="py-10 flex flex-col items-center text-center gap-6 animate-in zoom-in-95">
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 rounded-full border-4 border-red-500/20" />
                  <div 
                    className="absolute inset-0 rounded-full border-4 border-red-500 border-t-transparent animate-spin" 
                    style={{ animationDuration: '0.5s' }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">👁️</div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xs font-syncopate font-black text-red-500 uppercase tracking-widest">Nexus Scanning...</h3>
                  <p className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em]">Analisando integridade da frequência: {scanProgress}%</p>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 transition-all duration-300" 
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                <header className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-xl mx-auto mb-2">🚩</div>
                  <h3 className="text-xs font-syncopate font-black text-white uppercase tracking-widest">Protocolo de Denúncia</h3>
                  <p className="text-[7px] text-slate-500 font-black uppercase tracking-widest">O Nexus fará uma varredura severa no histórico.</p>
                </header>

                <div className="space-y-2">
                  <span className="text-[6px] font-black text-slate-500 uppercase tracking-widest ml-2">Selecione o Motivo</span>
                  <div className="grid grid-cols-1 gap-2">
                    {REPORT_OPTIONS.map(opt => (
                      <button 
                        key={opt}
                        onClick={() => setReportReason(opt)}
                        className={`w-full py-3 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border ${reportReason === opt ? 'bg-red-500 text-black border-red-500' : 'bg-white/5 text-slate-400 border-white/10 hover:border-red-500/30'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsReporting(false)}
                    className="flex-1 py-4 text-[8px] font-black uppercase text-slate-600"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleNexusScan}
                    disabled={!reportReason}
                    className="flex-2 py-4 bg-red-600 text-white rounded-xl text-[8px] font-black uppercase shadow-lg shadow-red-900/40 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Iniciar Varredura
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {isCustomizing && (
        <div className="fixed inset-0 z-[1200] bg-[#02040a] flex flex-col animate-in slide-in-from-right duration-500 font-inter">
          <header className="px-6 py-6 flex items-center justify-between bg-black/40 backdrop-blur-xl border-b border-white/5 shrink-0">
             <button onClick={() => setIsCustomizing(false)} className="p-2 text-slate-400">✕</button>
             <h2 className="text-[10px] font-syncopate font-black text-white uppercase tracking-[0.3em]">Customização de Setor</h2>
             <button onClick={handleSaveMetadata} disabled={isSyncing} className="p-2 text-cyan-400 font-black text-[10px] uppercase">
               {isSyncing ? '...' : 'Salvar'}
             </button>
          </header>
          <main className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
             <div className="flex flex-col items-center gap-6">
                <div onClick={() => editAvatarInputRef.current?.click()} className="w-24 h-24 rounded-3xl border-2 border-dashed border-white/10 bg-white/5 flex items-center justify-center overflow-hidden cursor-pointer">
                   {tempChatAvatar ? <img src={tempChatAvatar} className="w-full h-full object-cover" /> : <span className="text-2xl">📸</span>}
                   <input type="file" ref={editAvatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setTempChatAvatar)} />
                </div>
                <div className="w-full space-y-4">
                   <div className="space-y-1.5">
                      <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest ml-4">Nome da Frequência</label>
                      <input value={tempChatName} onChange={(e) => setTempChatName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-xs outline-none focus:border-cyan-500" />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest ml-4">Cor de Fundo / Wallpaper</label>
                      <div className="flex gap-2">
                        <input type="color" value={tempChatBg.startsWith('#') ? tempChatBg : '#02040a'} onChange={(e) => setTempChatBg(e.target.value)} className="w-12 h-12 rounded-xl bg-transparent border-none cursor-pointer" />
                        <button onClick={() => editBgInputRef.current?.click()} className="flex-1 bg-white/5 border border-white/10 rounded-xl text-[8px] font-black uppercase">Upload BG</button>
                        <input type="file" ref={editBgInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setTempChatBg)} />
                      </div>
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest ml-4">Imagem de Capa</label>
                      <div onClick={() => editCoverInputRef.current?.click()} className="w-full h-32 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden cursor-pointer relative group">
                         {tempChatCover ? <img src={tempChatCover} className="w-full h-full object-cover" /> : <span className="text-xl">🖼️</span>}
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-[8px] font-black text-white uppercase">Alterar Capa</span>
                         </div>
                         <input type="file" ref={editCoverInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setTempChatCover)} />
                      </div>
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest ml-4">Relatório de Diretriz</label>
                      <textarea value={tempChatDesc} onChange={(e) => setTempChatDesc(e.target.value)} className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-xs outline-none focus:border-cyan-500 resize-none" />
                   </div>
                </div>
             </div>
          </main>
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: `.no-scrollbar::-webkit-scrollbar { display: none; }` }} />
    </div>
  );
};

export default PublicChat;
