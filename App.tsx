
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GameState, Message, Character, UserProfile, ChatSession, FeedPost, Community, Notification, MuralPost, CityMemberData } from './types';
import MainConsole from './components/MainConsole';
import CharacterCreation from './components/CharacterCreation';
import Lobby, { DragonO } from './components/Lobby';
import SocialSidebar from './components/SocialSidebar';
import ProfileView from './components/ProfileView';
import FeedView from './components/FeedView';
import WikiCreation from './components/WikiCreation';
import PublicChat from './components/PublicChat';
import CommunityCreation from './components/CommunityCreation';
import CommunityView from './components/CommunityView';
import CommunitySearch from './components/CommunitySearch';
import AuthScreen from './components/AuthScreen';
import HelpOverlay from './components/HelpOverlay';
import NotificationCenter from './components/NotificationCenter';
import VoiceInterface from './components/VoiceInterface';
import MessagesArchive from './components/MessagesArchive';
import RecentCommunityChats from './components/RecentCommunityChats';
import RankingView from './components/RankingView';
import SocialDiscovery from './components/SocialDiscovery';
import InviteFollowers from './components/InviteFollowers';
import DraftsView from './components/DraftsView';
import CommunityPreview from './components/CommunityPreview';
import MembersView from './components/MembersView';
import { GoogleGenAI } from '@google/genai';
import { AIService } from './aiService';
import { SYSTEM_INSTRUCTION, MODEL_TEXT, MODEL_IMAGE } from './constants';
import { TEST_COMMUNITIES, INITIAL_POSTS, DEFAULT_THEMES } from './data';
import { supabase } from './lib/supabase';

interface LocalUser {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  email: string | null;
}

const AVAILABLE_GLOBAL_FRAMES = [
  { id: 'frame-event-void', name: 'Pulso do Evento', price: 1, color: '#10b981', style: 'frame-event-art', category: 'EVENTO' },
  { id: 'frame-neon-cyan', name: 'Borda Neon Ciano', price: 45, color: '#22d3ee', style: 'frame-neon-cyan-art', category: 'SIMPLES' },
  { id: 'frame-neon-pink', name: 'Borda Neon Rosa', price: 80, color: '#ec4899', style: 'frame-neon-pink-art', category: 'SIMPLES' },
  { id: 'frame-abyssal-beast', name: 'Besta do Abismo', price: 450, color: '#ef4444', style: 'frame-abyssal-beast-art', category: 'LENDÁRIA' },
  { id: 'frame-ouroboros-gold', name: 'Ouroboros Áureo', price: 850, color: '#fbbf24', style: 'frame-ouroboros-art', category: 'LENDÁRIA' },
  { id: 'frame-void-god', name: 'Lorde do Vácuo', price: 1400, color: '#a855f7', style: 'frame-void-god-art', category: 'LIMITADA' },
  { id: 'frame-celestial-angel', name: 'Anjo da Singularidade', price: 1950, color: '#93c5fd', style: 'frame-angel-art', category: 'LIMITADA' }
];

const AVAILABLE_GLOBAL_BUBBLES = [
  { id: 'bubble-event-glitch', name: 'Glitch de Evento', price: 1, color: '#10b981', style: 'bubble-event-art', category: 'EVENTO', icon: '📡' },
  { id: 'bubble-neon-cyan', name: 'Sinal Neon Ciano', price: 30, color: '#22d3ee', style: 'bg-cyan-500/10 border-cyan-500', category: 'SIMPLES', icon: '☁️' },
  { id: 'bubble-neon-pink', name: 'Sinal Neon Rosa', price: 75, color: '#ec4899', style: 'bg-pink-500/10 border-pink-500', category: 'SIMPLES', icon: '🌸' },
  { id: 'bubble-matrix', name: 'Código de Matriz', price: 420, color: '#10b981', style: 'bg-emerald-950/40 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] font-mono', category: 'LENDÁRIA', icon: '📟' },
  { id: 'bubble-abyssal', name: 'Fogo do Abismo', price: 780, color: '#ef4444', style: 'bg-red-950/40 border-red-600 shadow-[0_0_20px_rgba(239,68,68,0.4)]', category: 'LENDÁRIA', icon: '🔥' },
  { id: 'bubble-void-god', name: 'Vácuo Silencioso', price: 1350, color: '#a855f7', style: 'bg-purple-950/60 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.3)]', category: 'LIMITADA', icon: '🌌' },
  { id: 'bubble-pure-gold', name: 'Sincronia Áurea', price: 1800, color: '#f59e0b', style: 'bg-amber-500/10 border-amber-500 shadow-[0_0_35px_rgba(245,158,11,0.5)]', category: 'LIMITADA', icon: '✨' }
];

const resolveImageRef = (ref: string | undefined | null): string => {
  if (!ref) return "";
  if (typeof ref !== 'string') return "";
  if (ref.startsWith('ref:')) {
    const key = ref.replace('ref:', '');
    try {
      return localStorage.getItem(key) || localStorage.getItem('vimg_' + key) || "";
    } catch (e) { return ""; }
  }
  if (ref.startsWith('vimg_')) {
    try {
      return localStorage.getItem(ref) || "";
    } catch (e) { return ""; }
  }
  return ref;
};

const App: React.FC = () => {
  const [user, setUser] = useState<LocalUser | null>(() => {
    const saved = localStorage.getItem('void_local_user');
    return saved ? JSON.parse(saved) : null;
  });
  const userRef = useRef<LocalUser | null>(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authPendingProfile, setAuthPendingProfile] = useState<any>(null);

  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => localStorage.getItem('void_active_session_id'));
  const [communities, setCommunities] = useState<Community[]>(() => {
    const saved = localStorage.getItem('void_communities');
    const parsed: Community[] = saved ? JSON.parse(saved) : [];
    // Migration: ensure membersData exists for all communities
    return parsed.map(c => {
      if (!c.membersData || Object.keys(c.membersData).length === 0) {
        return {
          ...c,
          membersData: {
            [c.creator]: {
              userId: c.creator,
              cityLevel: 1,
              cityRank: 'FUNDADOR',
              cityReputation: 100,
              joinDate: Date.now()
            }
          }
        };
      }
      return c;
    });
  });
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('void_sessions');
    const parsed: ChatSession[] = saved ? JSON.parse(saved) : [];
    const hasNexus = parsed.some(s => s && s.name === 'NEXUS' && s.type === 'IA');
    if (!hasNexus) {
      const nexusSession: ChatSession = {
        id: 'nexus-default',
        name: 'NEXUS',
        avatar: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Nexus&backgroundColor=0a0c1a',
        messages: [{ id: 'nx-init', role: 'model', text: '*Ajusto meu visor e dou um sorriso de canto.* Olha só quem resolveu aparecer. O Vácuo estava meio parado sem uma frequência nova para monitorar. O que manda hoje, viajante?', timestamp: Date.now(), personaName: 'NEXUS' }],
        isPinned: true, lastUpdate: Date.now(), type: 'IA', status: 'accepted', creator: 'SISTEMA'
      };
      parsed.unshift(nexusSession);
    }
    return parsed;
  });

  useEffect(() => {
    // Initial ready state
    setIsAuthReady(true);

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuthPendingProfile(session.user);
        // Background check, don't block
        supabase
          .from('profiles')
          .select('display_name')
          .eq('id', session.user.id)
          .maybeSingle()
          .then(({ data: profile }) => {
            if (profile?.display_name) {
              const formattedUser: LocalUser = {
                uid: session.user.id,
                displayName: profile.display_name,
                photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`,
                email: session.user.email || null
              };
              
              setUser(formattedUser);
              setMyProfile(prev => ({ 
                ...prev, 
                name: profile.display_name,
                avatarUrl: formattedUser.photoURL || prev.avatarUrl
              }));
              setAuthPendingProfile(null);
            }
          });
      }
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Only set pending if we are not already logged in with this user
        setAuthPendingProfile(prev => (userRef.current?.uid === session.user.id) ? null : (prev || session.user));

        // Fetch profile in background only if needed/possible
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile?.display_name) {
          const formattedUser: LocalUser = {
            uid: session.user.id,
            displayName: profile.display_name,
            photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`,
            email: session.user.email || null
          };
          
          setUser(formattedUser);
          setMyProfile(prev => ({ 
            ...prev, 
            name: profile.display_name,
            avatarUrl: formattedUser.photoURL || prev.avatarUrl
          }));
          setAuthPendingProfile(null);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setAuthPendingProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('void_user_name', user.displayName || 'MEMBRO');
      localStorage.setItem('void_user_avatar', user.photoURL || '');
      localStorage.setItem('void_local_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('void_local_user');
    }
  }, [user]);

  const isLoggingIn = useRef(false);

  const handleLogin = (supabaseUser: any, profile?: any) => {
    const displayName = profile?.display_name || 'MEMBRO';
    const formattedUser: LocalUser = {
      uid: supabaseUser.id,
      displayName: displayName,
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${supabaseUser.id}`,
      email: supabaseUser.email || null
    };
    
    // PER USER REQUEST: Update local state immediately
    setMyProfile(prev => ({
      ...prev,
      name: displayName,
      avatarUrl: formattedUser.photoURL || prev.avatarUrl
    }));

    setAuthPendingProfile(null);
    setUser(formattedUser);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      localStorage.clear();
      window.location.reload();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const [gameState, setGameState] = useState<GameState>(GameState.AUTH);

  useEffect(() => {
    if (isAuthReady) {
      if (user) {
        if (gameState === GameState.AUTH) setGameState(GameState.LOBBY);
      } else {
        setGameState(GameState.AUTH);
      }
    }
  }, [user, isAuthReady, gameState]);

  const isAppModerator = useMemo(() => (window as any).isGlobalMod || false, []);

  const [minimizedMedia, setMinimizedMedia] = useState<{ 
    id: string, 
    type: 'video' | 'voice', 
    source?: string, 
    videoType?: 'local' | 'youtube',
    name: string, 
    currentTime?: number, 
    isPlaying?: boolean,
    characterData?: Character 
  } | null>(null);

  const activeCommunity = useMemo(() => {
    if (!activeSessionId) return null;
    const direct = communities.find(c => c.id === activeSessionId) || TEST_COMMUNITIES.find(c => c.id === activeSessionId);
    if (direct) return direct;
    return communities.find(c => c.channels?.some(ch => ch.id === activeSessionId)) || 
           TEST_COMMUNITIES.find(c => c.channels?.some(ch => ch.id === activeSessionId)) || null;
  }, [activeSessionId, communities, sessions]);

  const isCommunityHome = useMemo(() => {
    if (!activeSessionId) return false;
    return communities.some(c => c.id === activeSessionId) || TEST_COMMUNITIES.some(c => c.id === activeSessionId);
  }, [activeSessionId, communities]);

  const activeSession = useMemo(() => sessions.find(s => s && s.id === activeSessionId), [sessions, activeSessionId]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isLocalSearchOpen, setIsLocalSearchOpen] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [storeTab, setStoreTab] = useState<'FRAMES' | 'BUBBLES'>('FRAMES');
  const [returnToState, setReturnToState] = useState<{ id: string | null, state: GameState } | null>(null);
  const [viewedProfile, setViewedProfile] = useState<UserProfile | null>(null);
  const [editingWikiPost, setEditingWikiPost] = useState<FeedPost | null>(null);
  const [previewCommunity, setPreviewCommunity] = useState<Community | null>(null);
  const [lobbyAtTop, setLobbyAtTop] = useState(true);
  const [archiveViewMode, setArchiveViewMode] = useState<'PRIVADO' | 'CHATS'>('PRIVADO');

  const saveTimeoutRef = useRef<number | null>(null);
  const isAiProcessing = useRef<Set<string>>(new Set());

  const shouldShowBottomNav = useMemo(() => {
    if (gameState === GameState.AUTH || gameState === GameState.BANNED || gameState === GameState.CHARACTER_CREATION || gameState === GameState.COMMUNITY_CREATION) return false;
    if (viewedProfile || previewCommunity || isStoreOpen) return false;
    if (gameState === GameState.PLAYING) return false;
    return [GameState.LOBBY, GameState.RECENT_CHATS, GameState.SOCIAL_DISCOVERY, GameState.RANKING, GameState.COMMUNITY_SEARCH, GameState.FEED, GameState.MESSAGES, GameState.DRAFTS, GameState.MEMBERS].includes(gameState);
  }, [gameState, viewedProfile, previewCommunity, isStoreOpen]);

  const handleCreateCommunity = (commData: any) => {
    if (!user) return;
    const newCommId = Date.now().toString();
    const newComm = {
      ...commData,
      id: newCommId,
      creator: user.uid,
      members: [user.uid],
      membersCount: 1,
      createdAt: Date.now(),
      level: 1
    };
    setCommunities(prev => [...prev, newComm]);
    setActiveSessionId(newCommId);
    setGameState(GameState.PLAYING);
  };

  const handleSessionUpdate = useCallback((sessionId: string, updates: any) => {
    setSessions(prev => prev.map(s => s && s.id === sessionId ? { ...s, ...updates } : s));
    setCommunities(prev => prev.map(c => {
      if (c.channels && c.channels.some(ch => ch.id === sessionId)) {
         return { ...c, channels: c.channels.map(ch => ch.id === sessionId ? { ...ch, ...updates } : ch) };
      }
      return c;
    }));
  }, []);

  const [myProfile, setMyProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('void_user_profile');
    const parsed = saved ? JSON.parse(saved) : {};
    return {
      name: parsed.name || localStorage.getItem('void_user_name') || 'OPERATIVO',
      avatarUrl: parsed.avatarUrl || localStorage.getItem('void_user_avatar') || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Voidy',
      rank: parsed.rank || 'RECRUTA',
      level: parsed.level || 1,
      isMe: true,
      reputation: parsed.reputation || 0,
      following: parsed.following || 0,
      followers: parsed.followers || 0,
      bio: parsed.bio || '',
      statusIcon: parsed.statusIcon || '🔮',
      statusColor: parsed.statusColor || '#22c55e',
      mural: parsed.mural || [],
      voidyCoins: parsed.voidyCoins || 0,
      dailyAdCount: parsed.dailyAdCount || 0,
      lastAdReset: parsed.lastAdReset || 0,
      ...parsed
    };
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('void_notifications');
    return saved ? JSON.parse(saved) : [{ id: 'welcome', type: 'PROMOTION', title: 'Comando Nexus', content: 'Sincronia estabelecida.', sender: 'Drake.OS', timestamp: Date.now(), read: false }];
  });

  const addNotification = useCallback((n: any) => {
    setNotifications(prev => [{...n, id: Date.now().toString(), timestamp: Date.now(), read: false} as any, ...prev]);
  }, []);

  const handlePermanentBan = useCallback((reason: string) => {
    console.warn(`BANIMENTO PERMANENTE: ${reason}`);
    const blacklist = JSON.parse(localStorage.getItem('void_blacklist') || '[]');
    if (!blacklist.includes(myProfile.name)) {
      blacklist.push(myProfile.name);
      localStorage.setItem('void_blacklist', JSON.stringify(blacklist));
    }
    localStorage.setItem('void_is_banned', 'true');
    setGameState(GameState.BANNED);
    addNotification({
      type: 'SYSTEM',
      title: 'VIOLAÇÃO CRÍTICA',
      content: `O sistema detectou conteúdo proibido. Protocolo de purga ativado: ${reason}`,
      sender: 'NEXUS'
    });
  }, [myProfile.name, addNotification]);

  const verifySafety = useCallback(async (content: string, type: 'image' | 'text' = 'image'): Promise<boolean> => {
    try {
      const aiService = new AIService(process.env.GEMINI_API_KEY || process.env.API_KEY || '');
      const { isSafe } = await aiService.checkSafety(content, type);
      
      if (!isSafe) {
        handlePermanentBan(type === 'image' ? 'Uso de imagens NSFW/Gore detectado.' : 'Discurso de ódio ou conteúdo violento detectado.');
        return false;
      }
      return true;
    } catch (error) {
      console.error("Safety check fail", error);
      return true; // Contingência: em caso de erro na API, não banir injustamente
    }
  }, [handlePermanentBan]);

  const [character, setCharacter] = useState<Character | null>(() => {
    const saved = localStorage.getItem('void_character');
    return saved ? JSON.parse(saved) : null;
  });

  const handleUpdateCharacter = useCallback((updates: Partial<Character>) => {
    setCharacter(prev => {
      const base = prev || { 
        name: myProfile.name, 
        class: 'Membro', 
        stats: { strength: 5, agility: 5, intelligence: 5, willpower: 5, hp: 100 }, 
        inventory: Array(10).fill(null), 
        background: '',
        wallet: 0
      };
      
      let finalInventory = base.inventory;
      if (updates.inventory) {
          finalInventory = [...updates.inventory];
          while (finalInventory.length < 10) finalInventory.push(null);
          finalInventory = finalInventory.slice(0, 10);
      }

      const next = { ...base, ...updates, inventory: finalInventory };
      localStorage.setItem('void_character', JSON.stringify(next));
      return next;
    });
  }, [myProfile.name]);

  const handleEditWikiPost = useCallback((post: FeedPost) => {
    setEditingWikiPost(post);
  }, []);

  const handleDeletePost = useCallback((id: string) => {
    setFeedPosts(prev => prev.filter(p => p.id !== id));
    setMyProfile(prev => ({
      ...prev,
      posts: prev.posts?.filter(p => p.id !== id)
    }));
    setViewedProfile(prev => prev ? { ...prev, posts: prev.posts?.filter(p => p.id !== id) } : null);
  }, []);

  const handleUpdateWikiPost = useCallback((updatedPost: FeedPost) => {
    setFeedPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
    setMyProfile(prev => ({
      ...prev,
      posts: prev.posts?.map(p => p.id === updatedPost.id ? updatedPost : p)
    }));
    setViewedProfile(prev => prev ? { ...prev, posts: prev.posts?.map(p => p.id === updatedPost.id ? updatedPost : p) } : null);
    setEditingWikiPost(null);
  }, [viewedProfile]);

  const handleAddPost = useCallback((p: FeedPost) => {
    setFeedPosts(prev => {
      if (prev.some(existing => existing.id === p.id)) return prev;
      return [p, ...prev];
    });
    setMyProfile(prev => {
      if (prev.posts?.some(existing => existing.id === p.id)) return prev;
      return {
        ...prev,
        posts: [p, ...(prev.posts || [])]
      };
    });
    setViewedProfile(prev => {
      if (prev && prev.isMe) {
        if (prev.posts?.some(existing => existing.id === p.id)) return prev;
        return {
          ...prev,
          posts: [p, ...(prev.posts || [])]
        };
      }
      return prev;
    });
  }, []);

  const [communityVisits, setCommunityVisits] = useState<Record<string, { lastVisit: number; count: number }>>(() => {
    const saved = localStorage.getItem('void_community_visits_v2');
    return saved ? JSON.parse(saved) : {};
  });

  const recordVisit = useCallback((id: string) => {
    setCommunityVisits(prev => {
      const current = prev[id] || { lastVisit: 0, count: 0 };
      const fourHoursAgo = Date.now() - (4 * 60 * 60 * 1000);
      return { ...prev, [id]: { lastVisit: Date.now(), count: current.lastVisit > fourHoursAgo ? current.count + 1 : 1 } };
    });
  }, []);

  const handleLeaveCommunity = useCallback((id: string) => {
    const targetComm = communities.find(c => String(c.id) === String(id));
    const linkedChannelIds = targetComm?.channels?.map(ch => ch.id) || [];
    setCommunities(prev => prev.filter(c => String(c.id) !== String(id)));
    setCommunityVisits(prev => {
      const next = { ...prev }; 
      delete next[id]; 
      return next;
    });
    setSessions(prev => prev.filter(s => s && s.id !== id && !linkedChannelIds.includes(s.id)));
    if (String(activeSessionId) === String(id) || linkedChannelIds.includes(activeSessionId || '')) {
      setActiveSessionId(null); 
      setReturnToState(null); 
      setGameState(GameState.LOBBY);
    }
  }, [activeSessionId, communities]);

  const [feedPosts, setFeedPosts] = useState<FeedPost[]>(() => {
    const saved = localStorage.getItem('void_feed_posts');
    return saved ? JSON.parse(saved) : INITIAL_POSTS;
  });

  const [publicMessages, setPublicMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('void_public_messages');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (gameState === GameState.BANNED) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = window.setTimeout(() => {
      try {
        localStorage.setItem('void_game_state', gameState);
        localStorage.setItem('void_user_profile', JSON.stringify(myProfile));
        if (character) localStorage.setItem('void_character', JSON.stringify(character));
        localStorage.setItem('void_notifications', JSON.stringify(notifications));
        localStorage.setItem('void_sessions', JSON.stringify(sessions));
        localStorage.setItem('void_communities', JSON.stringify(communities));
        localStorage.setItem('void_community_visits_v2', JSON.stringify(communityVisits));
        localStorage.setItem('void_feed_posts', JSON.stringify(feedPosts));
        localStorage.setItem('void_public_messages', JSON.stringify(publicMessages));
        if (activeSessionId) {
          localStorage.setItem('void_active_session_id', activeSessionId);
        } else {
          localStorage.removeItem('void_active_session_id');
        }
      } catch (e) {
        console.warn("Auto-save partially failed due to storage limits.");
      }
    }, 500);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [gameState, myProfile, character, notifications, sessions, communities, communityVisits, feedPosts, publicMessages, activeSessionId]);

  const handleAiResponse = useCallback(async (sessionId: string) => {
    if (isAiProcessing.current.has(sessionId)) return;
    
    const session = sessions.find(s => s && s.id === sessionId);
    if (!session || session.type !== 'IA') return;
    
    const sessionMessages = session.messages || [];
    const lastMsg = sessionMessages[sessionMessages.length - 1];
    if (!lastMsg || lastMsg.role !== 'user') return;

    isAiProcessing.current.add(sessionId);
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, isTyping: true } : s));

    const now = Date.now();
    let profileCopy = { ...myProfile };
    const lastReset = new Date(profileCopy.lastDailyReset || 0);
    
    if (lastReset.getDate() !== new Date(now).getDate()) { 
      profileCopy.dailyMessageCount = 0; 
      profileCopy.lastDailyReset = now; 
      setMyProfile(profileCopy); 
    }
    
    if ((profileCopy.dailyMessageCount || 0) >= 1000) {
      isAiProcessing.current.delete(sessionId);
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, isTyping: false } : s));
      return;
    }

    setMyProfile(prev => ({ ...prev, dailyMessageCount: (prev.dailyMessageCount || 0) + 1 }));
    
    try {
      const aiService = new AIService(process.env.GEMINI_API_KEY || process.env.API_KEY || '');
      const aiText = await aiService.generateResponse(sessionMessages);
      
      const aiMsgId = `ai-${Date.now()}`;
      const aiMsgTimestamp = Date.now();
      const aiMsg: Message = { id: aiMsgId, role: 'model', text: aiText, timestamp: aiMsgTimestamp, personaName: session.name };
      
      setSessions(prev => prev.map(s => s.id === sessionId ? {
        ...s,
        messages: [...(s.messages || []), aiMsg],
        lastUpdate: aiMsgTimestamp,
        isTyping: false
      } : s));
    } catch (error) { 
      console.error("AI Error:", error);
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, isTyping: false } : s));
    } finally {
      isAiProcessing.current.delete(sessionId);
    }
  }, [sessions, myProfile]);

  useEffect(() => {
    if (activeSession?.type === 'IA') {
      const msgs = activeSession.messages || [];
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg && lastMsg.role !== 'model') handleAiResponse(activeSession.id);
    }
  }, [activeSession, handleAiResponse]);

  const handleStartChatSession = async (type: string, name: string, avatar: string = '', background?: string, id?: string, rpgData?: any, initialMessages: Message[] = []) => {
    if (!user) return;
    if (type === 'PRIVADO') {
      const existing = sessions.find(s => s && s.name === name && s.type === 'PRIVADO');
      if (existing) { setActiveSessionId(existing.id); setGameState(GameState.PLAYING); return; }
    }
    const sessionId = id || `session-${Date.now()}`;
    
    const existingSession = sessions.find(s => s.id === sessionId);
    if (existingSession) {
      if (rpgData) {
         setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, rpgData } : s));
      }
      setActiveSessionId(sessionId); 
      setGameState(GameState.PLAYING); 
      return;
    }

    let msgs = [...initialMessages];
    if ((type === 'CLUSTER' || type === 'RPG') && msgs.length === 0) {
      msgs.push({
        id: `sys-join-${Date.now()}`,
        role: 'user',
        text: `${myProfile.name} entrou na conversa`,
        timestamp: Date.now(),
        personaName: 'SISTEMA'
      });
    }
    if (type === 'PRIVADO' && msgs.length === 0) {
      msgs.push({
        id: `sys-${Date.now()}`,
        role: 'user',
        text: `${myProfile.name} iniciou uma conversa`,
        timestamp: Date.now(),
        personaName: 'SISTEMA'
      });
    }

    const newSession: ChatSession = { 
      id: sessionId, 
      name, 
      avatar: avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${name}`, 
      messages: msgs, 
      isPinned: false, 
      lastUpdate: Date.now(), 
      type: type as any, 
      status: 'accepted', 
      creator: user.uid,
      rpgData: rpgData,
      isTyping: false,
      participants: [user.uid]
    };
    
    setSessions(prev => [...prev, newSession]);
    if (background) localStorage.setItem(`void_chat_img_${sessionId}`, background);
    setActiveSessionId(sessionId); 
    setGameState(GameState.PLAYING);
  };

  // Effect to handle special profile previews from Lobby
  useEffect(() => {
    if (previewCommunity && (previewCommunity as any).id === 'PROFILE') {
      const p = previewCommunity as any;
      setViewedProfile({
        id: p.id_to_view,
        name: p.name,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id_to_view}`,
        rank: 'OPERATIVO',
        isMe: p.id_to_view === user?.uid
      });
      setPreviewCommunity(null);
    }
  }, [previewCommunity, user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('mensagens-vivas')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages' 
      }, (payload) => {
        console.log('Nova mensagem recebida!');
        const m = payload.new;
        
        // 1. Session Discovery Logic (Private chats)
        if (m.session_id && m.session_id.startsWith('priv_')) {
          const parts = m.session_id.replace('priv_', '').split('_');
          if (parts.includes(user.id)) {
            setSessions(prev => {
              if (prev.some(s => s.id === m.session_id)) return prev;
              const newSession: ChatSession = {
                id: m.session_id,
                name: m.display_name,
                avatar: m.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.display_name}`,
                type: 'PRIVADO',
                messages: [],
                lastUpdate: Date.now(),
                isPinned: false,
                status: 'accepted',
                creator: m.display_name
              };
              return [...prev, newSession];
            });
          }
        }

        // 2. Message Sync Logic
        if (m.session_id) {
          setSessions(prev => {
            return prev.map(s => {
              if (s.id === m.session_id) {
                const newMessage: Message = {
                  id: m.id.toString(),
                  role: 'user',
                  text: m.content,
                  timestamp: new Date(m.created_at).getTime(),
                  personaName: m.display_name,
                  image: m.avatar_url
                };
                // Prevent duplicates
                if (s.messages.some(msg => msg.id === newMessage.id)) return s;
                return {
                  ...s,
                  messages: [...s.messages, newMessage],
                  lastUpdate: Date.now()
                };
              }
              return s;
            });
          });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleSmartBack = (fallback: GameState = GameState.LOBBY) => {
    setGameState(fallback);
  };

  const handleJoinCommunity = (communityId: string) => {
    if (!user) return;
    const community = communities.find(c => c.id === communityId) || TEST_COMMUNITIES.find(c => c.id === communityId);
    if (community) {
      setCommunities(prev => {
        const exists = prev.find(c => c.id === communityId);
        if (exists) {
          const membersData = { ...(exists.membersData || {}) };
          if (!membersData[user.uid]) {
            membersData[user.uid] = {
              userId: user.uid,
              cityLevel: 1,
              cityReputation: 0,
              cityRank: 'CIDADÃO',
              joinDate: Date.now(),
              personaName: myProfile.name,
              personaAvatar: myProfile.avatarUrl
            };
            return prev.map(c => c.id === communityId ? { ...c, membersData, membersCount: (c.membersCount || 0) + 1 } : c);
          }
          return prev;
        } else {
          const membersData = { ...(community.membersData || {}) };
          membersData[user.uid] = {
            userId: user.uid,
            cityLevel: 1,
            cityReputation: 0,
            cityRank: 'CIDADÃO',
            joinDate: Date.now(),
            personaName: myProfile.name,
            personaAvatar: myProfile.avatarUrl
          };
          const newComm: Community = { 
            ...community, 
            members: [...(community.members || []), user.uid], 
            membersCount: (community.membersCount || 0) + 1,
            membersData: membersData
          };
          return [...prev, newComm];
        }
      });
      
      // Transição imediata
      setActiveSessionId(communityId);
      setPreviewCommunity(null);
      setGameState(GameState.PLAYING);
    }
  };

  const handleReset = () => { localStorage.clear(); window.location.reload(); };

  const navigateToLobbySection = (section: 'RADAR' | 'EXPLORAR') => {
    setGameState(GameState.LOBBY); setActiveSessionId(null); setPreviewCommunity(null);
    setTimeout(() => {
        const container = document.querySelector('.snap-y');
        if (container) container.scrollTo({ top: section === 'RADAR' ? 0 : container.scrollHeight, behavior: 'smooth' });
    }, 50);
  };

  const handleProfileUpdate = useCallback(async (name: string, avatar: string, pCol?: string, cCol?: string, pImg?: string, cImg?: string, fCol?: string, fStyle?: string, bio?: string, sIcon?: string, hStats?: boolean, nCol?: string, mTop?: string, mFeed?: string, mImg?: string, mFeedImg?: string, mural?: MuralPost[], posts?: FeedPost[], voidyCoins?: number, dailyAdCount?: number, lastAdReset?: number, bStyle?: string, bCol?: string, sCol?: string) => {
    if (!user) return;
    setMyProfile(prev => {
      const updated: UserProfile = { 
        ...prev,
        name, 
        avatarUrl: avatar, 
        panelColor: pCol !== undefined ? pCol : prev.panelColor, 
        contentColor: cCol !== undefined ? cCol : prev.contentColor, 
        panelImage: pImg !== undefined ? pImg : prev.panelImage, 
        contentImage: cImg !== undefined ? cImg : prev.contentImage, 
        frameColor: fCol !== undefined ? fCol : prev.frameColor, 
        frameStyle: fStyle !== undefined ? fStyle : prev.frameStyle, 
        bio: bio !== undefined ? bio : prev.bio, 
        statusIcon: sIcon !== undefined ? sIcon : prev.statusIcon, 
        hideStats: hStats !== undefined ? hStats : prev.hideStats, 
        nameColor: nCol !== undefined ? nCol : prev.nameColor,
        statusColor: sCol !== undefined ? sCol : prev.statusColor,
        muralTopColor: mTop !== undefined ? mTop : prev.muralTopColor, 
        muralFeedColor: mFeed !== undefined ? mFeed : prev.muralFeedColor, 
        muralImage: mImg !== undefined ? mImg : prev.muralImage, 
        muralFeedImage: mFeedImg !== undefined ? mFeedImg : prev.muralFeedImage, 
        mural: mural || prev.mural, 
        posts: posts || prev.posts,
        voidyCoins: voidyCoins !== undefined ? voidyCoins : prev.voidyCoins,
        dailyAdCount: dailyAdCount !== undefined ? dailyAdCount : prev.dailyAdCount,
        lastAdReset: lastAdReset !== undefined ? lastAdReset : prev.lastAdReset,
        bubbleStyle: bStyle !== undefined ? bStyle : prev.bubbleStyle,
        bubbleColor: bCol !== undefined ? bCol : prev.bubbleColor
      };
      
      // Sync posts to the global feed if they were modified via ProfileView
      if (posts) {
        setFeedPosts(currentFeed => {
          let nextFeed = [...currentFeed];
          let feedChanged = false;
          
          posts.forEach(newPost => {
            const feedIdx = nextFeed.findIndex(f => f.id === newPost.id);
            if (feedIdx !== -1) {
              if (JSON.stringify(nextFeed[feedIdx]) !== JSON.stringify(newPost)) {
                nextFeed[feedIdx] = newPost;
                feedChanged = true;
              }
            } else {
              const isActuallyNew = !prev.posts?.some(old => old.id === newPost.id);
              if (isActuallyNew) {
                nextFeed = [newPost, ...nextFeed];
                feedChanged = true;
              }
            }
          });
          
          return feedChanged ? nextFeed : currentFeed;
        });
      }
      
      // Update viewedProfile if it's the user's own profile to reflect changes immediately
      if (viewedProfile && viewedProfile.isMe) {
        setViewedProfile(updated);
      }
      
      return updated;
    });
  }, [user, viewedProfile]);

  const renderContent = () => {
    if (gameState === GameState.BANNED) return (
      <div className="flex-1 h-full w-full bg-black flex flex-col items-center justify-center p-10 text-center z-[1000] fixed inset-0">
         <div className="w-20 h-20 rounded-full border-2 border-red-500 flex items-center justify-center mb-8 animate-pulse shadow-[0_0_50px_rgba(239,68,68,0.4)]"><span className="text-3xl text-red-500">💀</span></div>
         <h2 className="text-xl font-syncopate font-black text-red-500 uppercase tracking-[0.3em] mb-4">LINK CANCELADO</h2>
      </div>
    );

    if (editingWikiPost) {
      return (
        <WikiCreation 
          onBack={() => setEditingWikiPost(null)} 
          onCreate={handleUpdateWikiPost} 
          userName={myProfile.name} 
          userAvatar={myProfile.avatarUrl} 
          verifySafety={verifySafety} 
          initialData={editingWikiPost}
          isCharacterSheet={editingWikiPost.tag === 'WIKI_ENTRADA'}
        />
      );
    }

    if (viewedProfile) return (
      <div className="state-transition-container">
        <ProfileView 
          profile={viewedProfile} 
          onBack={() => setViewedProfile(null)} 
          userAvatar={myProfile.avatarUrl} 
          userName={myProfile.name} 
          verifySafety={verifySafety} 
          addNotification={addNotification} 
          onProfileUpdate={handleProfileUpdate} 
          onEditPost={handleEditWikiPost} 
          onDeletePost={handleDeletePost}
          onFollow={(p) => {
            setMyProfile(prev => ({
              ...prev,
              following: (prev.following || 0) + 1
            }));
            addNotification({ 
              type: 'SISTEMA', 
              title: 'Protocolo de Conexão', 
              content: `Você agora está seguindo ${p.name}.`, 
              sender: 'DRAKE.OS' 
            });
          }}
          onStartChat={(recipientId, name, avatar) => {
            setViewedProfile(null);
            const consistentId = user?.id && recipientId ? `priv_${[user.id, recipientId].sort().join('_')}` : undefined;
            handleStartChatSession('PRIVADO', name, avatar, undefined, consistentId);
          }}
        />
      </div>
    );

    if (previewCommunity) return (
      <div className="state-transition-container"><CommunityPreview community={previewCommunity} onBack={() => setPreviewCommunity(null)} onJoin={handleJoinCommunity} /></div>
    );

    return (
      <>
        {renderMainContent()}
      </>
    );
  };

  const renderMainContent = () => {
    if (gameState === GameState.PLAYING && isCommunityHome && activeCommunity) return (
      <div className="state-transition-container">
        <CommunityView 
          community={activeCommunity} 
          userProfile={myProfile} 
          onProfileUpdate={handleProfileUpdate} 
          userName={myProfile.name} 
          userAvatar={myProfile.avatarUrl} 
          onBack={() => { setActiveSessionId(null); setGameState(GameState.LOBBY); }} 
          onUpdate={(upd) => setCommunities(prev => prev.map(c => c.id === activeCommunity.id ? upd(c) : c))} 
          onDelete={handleLeaveCommunity} 
          onAddFeedPost={handleAddPost}
          onAddMemberClick={() => {
            setReturnToState({ id: activeSessionId, state: GameState.PLAYING });
            setGameState(GameState.INVITE_FOLLOWERS);
          }} 
          onViewProfile={(p) => setViewedProfile(p)} 
          onNavigateToPrivate={() => { setReturnToState({ id: activeCommunity.id, state: GameState.PLAYING }); setArchiveViewMode('PRIVADO'); setGameState(GameState.MESSAGES); }} 
          onNavigateToPublicSearch={() => { setReturnToState({ id: activeCommunity.id, state: GameState.PLAYING }); setGameState(GameState.COMMUNITY_SEARCH); }} 
          onNavigateToDrafts={() => { setReturnToState({ id: activeCommunity.id, state: GameState.PLAYING }); setGameState(GameState.DRAFTS); }} 
          onNavigateToMembers={() => { setReturnToState({ id: activeCommunity.id, state: GameState.PLAYING }); setGameState(GameState.SOCIAL_DISCOVERY); }} 
          onOpenNotifications={() => setIsNotifOpen(true)} 
          onShowBio={setPreviewCommunity} 
          addNotification={addNotification} 
          verifySafety={verifySafety} 
          onOpenStore={() => setIsStoreOpen(true)}
          onStartChat={(type, name, avatar, background, id, rpgData, initialMessages) => { 
            setReturnToState({ id: activeCommunity.id, state: GameState.PLAYING }); 
            handleStartChatSession(type, name, avatar, background, id, rpgData, initialMessages); 
          }} 
          character={character}
          onUpdateCharacter={handleUpdateCharacter}
        />
      </div>
    );

    switch (gameState) {
      case GameState.AUTH: return <AuthScreen onLogin={handleLogin} initialUser={authPendingProfile} initialView={authPendingProfile ? 'nick' : 'main'} />;
      case GameState.CHARACTER_CREATION: return <CharacterCreation onBack={() => setGameState(GameState.LOBBY)} onComplete={(char) => { handleUpdateCharacter(char); setGameState(GameState.LOBBY); }} verifySafety={verifySafety} />;
      case GameState.FEED: return <FeedView onBack={() => handleSmartBack(GameState.LOBBY)} userAvatar={resolveImageRef(myProfile.avatarUrl)} userName={myProfile.name} posts={feedPosts} verifySafety={verifySafety} onAddPost={(p) => handleAddPost({...p, id: Date.now().toString(), likes: 0, time: 'Just now', timestamp: Date.now()})} onDeletePost={handleDeletePost} onEditPost={handleEditWikiPost} isAppModerator={isAppModerator} />;
      case GameState.DRAFTS: return <DraftsView onBack={() => handleSmartBack(GameState.LOBBY)} userName={myProfile.name} userAvatar={resolveImageRef(myProfile.avatarUrl)} onPublish={(p) => { handleAddPost(p); setGameState(GameState.FEED); }} verifySafety={verifySafety} />;
      case GameState.INVITE_FOLLOWERS:
        return <InviteFollowers onBack={() => handleSmartBack(GameState.PLAYING)} onInviteMember={(m) => {
          addNotification({ type: 'INVITE', title: 'Sincronia Solicitada', content: `Você convidou ${m.name} para o cluster ativo.`, sender: 'SISTEMA' });
        }} />;
      case GameState.LOBBY:
      case GameState.COMMUNITY_CREATION:
        return (
          <div className="fade-scene">
            <div className="fade-layer lobby-layer">
              <div className="state-transition-container">
                <Lobby 
              onStart={handleStartChatSession} 
              communities={communities} 
              customThemes={DEFAULT_THEMES} 
              onAtTopChange={setLobbyAtTop} 
              onSelectCommunity={(id) => { recordVisit(id); setActiveSessionId(id); setGameState(GameState.PLAYING); }} 
              onPreviewCommunity={setPreviewCommunity} 
              onNavigateToChats={() => setGameState(GameState.RECENT_CHATS)} 
              onNavigateToLocation={() => setGameState(GameState.SOCIAL_DISCOVERY)} 
              onNavigateToHelp={() => setIsHelpOpen(true)} 
              onViewProfile={(p) => setViewedProfile(p)} 
              onCreateCommunity={() => setGameState(GameState.COMMUNITY_CREATION)} 
              isSearchOpen={isLocalSearchOpen} 
              onOpenSearch={() => setIsLocalSearchOpen(true)}
              onCloseSearch={() => setIsLocalSearchOpen(false)} 
              onLeaveCommunity={handleLeaveCommunity} 
            />
              </div>
            </div>
            <div className={`fade-layer builder-layer ${gameState === GameState.COMMUNITY_CREATION ? 'active' : ''}`}>
              <CommunityCreation onCancel={() => setGameState(GameState.LOBBY)} userName={myProfile.name} userAvatar={resolveImageRef(myProfile.avatarUrl)} onCreate={handleCreateCommunity} verifySafety={verifySafety} />
            </div>
          </div>
        );
      case GameState.SOCIAL_DISCOVERY:
          return <SocialDiscovery 
            isInviting={false} 
            onBack={() => handleSmartBack(GameState.LOBBY)} 
            onSelectMember={(m) => {
              const consistentId = user?.id && m.id ? `priv_${[user.id, m.id].sort().join('_')}` : undefined;
              handleStartChatSession('PRIVADO', m.name, m.avatarUrl, undefined, consistentId);
            }} 
            onViewProfile={setViewedProfile} 
          />;
      case GameState.RECENT_CHATS: return <RecentCommunityChats communities={[...TEST_COMMUNITIES, ...communities]} visitData={communityVisits} onSelect={(id) => { recordVisit(id); setActiveSessionId(id); setGameState(GameState.PLAYING); }} onBack={() => setGameState(GameState.LOBBY)} />;
      case GameState.PUBLIC_CHAT: return <PublicChat 
        onBack={() => handleSmartBack(GameState.LOBBY)} 
        onLeave={() => {
          setPublicMessages(prev => [...prev, {
            id: `sys-leave-${Date.now()}`,
            role: 'user',
            text: `${myProfile.name} saiu da conversa`,
            timestamp: Date.now(),
            personaName: 'SISTEMA'
          }]);
          setActiveSessionId(null);
          setArchiveViewMode('CHATS');
          setGameState(GameState.MESSAGES);
        }}
        userAvatar={myProfile.avatarUrl} 
        userName={myProfile.name} 
        publicMessages={publicMessages} 
        onUpdatePublicMessages={setPublicMessages} 
        onViewProfile={(p) => setViewedProfile(p)} 
        onAddMemberClick={() => {
          setReturnToState({ id: null, state: GameState.PUBLIC_CHAT });
          setGameState(GameState.INVITE_FOLLOWERS);
        }} 
        isAdmin={true}
        addNotification={addNotification} 
        verifySafety={verifySafety} 
      />;
      case GameState.MESSAGES: return <MessagesArchive sessions={sessions} activeSessionId={activeSessionId || ''} onTogglePin={(id) => setSessions(prev => prev.map(s => s && s.id === id ? {...s, isPinned: !s.isPinned} : s))} onDeleteSession={(id) => setSessions(prev => prev.filter(s => s && s.id !== id))} onBlockUser={() => {}} onSelectSession={(id) => { setActiveSessionId(id); setGameState(GameState.PLAYING); }} onBack={() => handleSmartBack(GameState.LOBBY)} onFindOperatives={() => setGameState(GameState.SOCIAL_DISCOVERY)} title={archiveViewMode} addNotification={addNotification} />;
      case GameState.COMMUNITY_SEARCH: return <CommunitySearch onBack={() => handleSmartBack(GameState.LOBBY)} communities={[...TEST_COMMUNITIES, ...communities]} onSelect={(id) => { recordVisit(id); setActiveSessionId(id); setGameState(GameState.PLAYING); }} onPreview={(c) => { setPreviewCommunity(c); setGameState(GameState.LOBBY); }} />;
      case GameState.RANKING: return <RankingView onBack={() => handleSmartBack(GameState.LOBBY)} onPreviewCommunity={(c) => { setPreviewCommunity(c); setGameState(GameState.LOBBY); }} communities={[...TEST_COMMUNITIES, ...communities]} />;
      case GameState.MEMBERS: return <MembersView onBack={() => handleSmartBack(GameState.LOBBY)} onSelectMember={setViewedProfile} />;
      case GameState.PLAYING:
        if (activeSession) {
          const charData = character || { name: myProfile.name, class: 'Membro', stats: { strength: 5, agility: 5, intelligence: 5, willpower: 5, hp: 100 }, inventory: Array(10).fill(null), background: '', wallet: 0 };
          const isAdmin = activeSession.id === 'nexus-default' || activeSession.creator === myProfile.name || activeSession.admins?.includes(myProfile.name) || activeSession.type === 'PRIVADO' || activeSession.type === 'IA' || activeSession.nature === 'RPG' || activeSession.type === 'PUBLICO' || activeSession.type === 'CLUSTER';
          const isCoAdmin = activeSession.coAdmins?.includes(myProfile.name);
          return (
            <div className="state-transition-container">
              <MainConsole 
                key={activeSession.id}
                character={charData} 
                session={activeSession} 
                isAdmin={isAdmin || isCoAdmin}
                isFullAdmin={isAdmin}
                onUpdateCharacter={handleUpdateCharacter} 
                setMessages={async (updater) => {
                    if (!activeSessionId) return;
                    const updateTimestamp = Date.now();
                    const session = sessions.find(s => s.id === activeSessionId);
                    if (!session) return;
                    
                    const newMessages = typeof updater === 'function' ? updater(session.messages) : updater;
                    
                    if (session.type !== 'IA') {
                      // Push newly added messages to Supabase
                      const addedCount = newMessages.length - session.messages.length;
                      if (addedCount > 0) {
                        const newlyAdded = newMessages.slice(session.messages.length);
                        let pushedAny = false;
                        newlyAdded.forEach(async (m) => {
                          // Only push if it's a local ID. Messages from Supabase have numeric IDs.
                          const isLocal = typeof m.id === 'string' && (m.id.startsWith('msg-') || m.id.startsWith('dice-') || m.id.startsWith('sticker-') || m.id.startsWith('sys-') || m.id.startsWith('session-') || m.id.startsWith('model-'));
                          if (isLocal) {
                            pushedAny = true;
                            await supabase.from('messages').insert([{
                              content: m.text,
                              display_name: m.personaName,
                              avatar_url: m.image,
                              session_id: activeSessionId
                            }]);
                          }
                        });
                        
                        if (pushedAny) {
                          // For real-time sessions, we let the Supabase listener handle the local state update
                          // only if we actually pushed something.
                          setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, lastUpdate: updateTimestamp } : s));
                          return;
                        }
                      }
                    }

                    setSessions(prev => prev.map(s => s.id === activeSessionId ? {
                      ...s,
                      messages: newMessages,
                      lastUpdate: updateTimestamp
                    } : s));
                }} 
                sceneImage={null} 
                setSceneImage={(url) => {}} 
                userAvatar={resolveImageRef(myProfile.avatarUrl)} 
                onOpenProfile={(p) => setViewedProfile(p)} 
                onNavigateBack={() => {
                  if (returnToState && returnToState.state === GameState.PLAYING) {
                    setActiveSessionId(returnToState.id);
                  } else {
                    setActiveSessionId(null);
                    setGameState(GameState.MESSAGES);
                  }
                }} 
                onDeleteSession={(id) => {
                  const sessionToDelete = sessions.find(s => s && s.id === id);
                  if (sessionToDelete && (sessionToDelete.type === 'CLUSTER' || sessionToDelete.type === 'RPG')) {
                    // Since we are deleting the session, we add the leave message to a global or persistent store if it existed.
                    // For now, we'll just ensure the leave message is added if we were to keep the session.
                    // But since the user is leaving, we just proceed with deletion.
                  }
                  setSessions(prev => prev.filter(s => s && s.id !== id));
                  setActiveSessionId(null);
                  if (sessionToDelete?.type === 'PUBLICO' || sessionToDelete?.type === 'CLUSTER' || sessionToDelete?.type === 'RPG') {
                    setArchiveViewMode('CHATS');
                  }
                  setGameState(GameState.MESSAGES);
                }} 
                onBlockUser={(name) => {}} 
                onAddMemberClick={() => {
                  setReturnToState({ id: activeSessionId, state: GameState.PLAYING });
                  setGameState(GameState.INVITE_FOLLOWERS);
                }} 
                addNotification={addNotification} 
                verifySafety={verifySafety} 
                onAcceptInvite={(id) => {}} 
                onUpdateSession={(updates) => activeSessionId && handleSessionUpdate(activeSessionId, updates)}
                onMinimizeMedia={(media) => setMinimizedMedia({ ...media, characterData: charData })}
                community={activeCommunity}
              />
            </div>
          );
        }
        return null;
      default: return <AuthScreen onLogin={() => setGameState(GameState.LOBBY)} />;
    }
  };

  return (
    <div className="flex-1 h-full w-full bg-[#02040a] text-white overflow-hidden font-inter relative flex">
      {gameState === GameState.LOBBY && !viewedProfile && !previewCommunity && (
        <header className="absolute top-4 md:top-8 left-0 w-full h-12 md:h-16 flex items-center justify-between px-4 md:px-6 z-[150] pointer-events-none">
          <div className="pointer-events-auto"><button onClick={() => setIsSidebarOpen(true)} className="p-1.5 md:p-2 hover:bg-white/5 rounded-xl transition-all"><svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7"/></svg></button></div>
          <div className="flex items-center gap-2 pointer-events-auto">
            <button onClick={() => setIsLocalSearchOpen(true)} className="p-1.5 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all"><svg className="w-4 h-4 md:w-5 md:h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></button>
            <button onClick={() => setIsNotifOpen(true)} className="relative p-1.5 bg-white/5 rounded-xl border border-white/10 transition-all"><svg className="w-4 h-4 md:w-5 md:h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg></button>
          </div>
        </header>
      )}
      <main className="flex-1 relative overflow-hidden flex flex-col">{renderContent()}</main>
      
      {isStoreOpen && (
        <div className="fixed inset-0 z-[1000] bg-[#02040a] flex flex-col animate-in slide-in-from-bottom duration-500">
          <header className="h-16 md:h-20 bg-white/5 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6 shrink-0">
            <button onClick={() => setIsStoreOpen(false)} className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all active:scale-90 border border-white/5">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M15 19l-7-7 7-7"/></svg>
            </button>
            <div className="flex items-center gap-4">
              <button onClick={() => setStoreTab('FRAMES')} className={`text-[10px] font-black uppercase tracking-widest transition-all ${storeTab === 'FRAMES' ? 'text-cyan-400' : 'text-white/40'}`}>Molduras</button>
              <button onClick={() => setStoreTab('BUBBLES')} className={`text-[10px] font-black uppercase tracking-widest transition-all ${storeTab === 'BUBBLES' ? 'text-cyan-400' : 'text-white/40'}`}>Balões</button>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <span className="text-amber-400 text-xs">✨</span>
              <span className="text-[10px] font-black text-white">{myProfile.voidyCoins || 0}</span>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto p-6 pb-32">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {(storeTab === 'FRAMES' ? AVAILABLE_GLOBAL_FRAMES : AVAILABLE_GLOBAL_BUBBLES).map((item: any) => (
                <div key={item.id} className="bg-white/5 rounded-2xl border border-white/10 p-4 flex flex-col items-center gap-4 group">
                  <div className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
                    {storeTab === 'FRAMES' ? (
                      <div className="w-full h-full rounded-full border-4" style={{ borderColor: item.color }}>
                        <img src={resolveImageRef(myProfile.avatarUrl)} loading="lazy" decoding="async" className="w-full h-full object-cover rounded-full p-1" alt="preview" />
                      </div>
                    ) : (
                      <div className={`px-4 py-2 rounded-2xl border-2 flex items-center gap-2 ${item.style}`}>
                        <span className="text-lg">{item.icon}</span>
                        <span className="text-[10px] font-bold">Olá!</span>
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-white truncate w-full">{item.name}</h3>
                    <p className="text-[8px] font-bold text-white/40 uppercase mt-1">{item.category}</p>
                  </div>
                  <button className="w-full py-2 bg-cyan-500 rounded-xl text-black font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                    <span>✨</span>
                    <span>{item.price}</span>
                  </button>
                </div>
              ))}
            </div>
          </main>
        </div>
      )}
      
      {shouldShowBottomNav && (
        <div className="fixed bottom-0 left-0 w-full z-[140] shrink-0">
          <nav className="h-14 md:h-20 bg-[#0a1a3a]/10 backdrop-blur-3xl border-t border-white/5 flex items-center justify-around px-4">
            <button onClick={() => navigateToLobbySection('RADAR')} className={`flex flex-col items-center gap-1 transition-all ${gameState === GameState.LOBBY && lobbyAtTop ? 'text-white' : 'text-purple-200/60'}`}><svg className="w-5 h-5 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg><span className="text-[7px] md:text-[9px] font-black uppercase">Radar</span></button>
            <button onClick={() => navigateToLobbySection('EXPLORAR')} className={`flex flex-col items-center gap-0.5 transition-all ${gameState === GameState.LOBBY && !lobbyAtTop ? 'text-white' : 'text-purple-200/60'}`}><svg className="w-4 h-4 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M12 8l-1 4 4 1-3-5z"/><path d="M12 21a9 9 0 100-18 9 9 0 000 18z"/></svg><span className="text-[7px] md:text-[9px] font-black uppercase">Explorar</span></button>
            <div className="relative"><button onClick={() => setGameState(GameState.COMMUNITY_CREATION)} className="relative -top-3 w-12 h-12 md:w-14 md:h-14 rounded-full bg-cyan-500 flex items-center justify-center text-white shadow-lg active:scale-90 border-[4px] border-[#02040a]"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M12 4v16m8-8H4"/></svg></button></div>
            <button onClick={() => setGameState(GameState.RECENT_CHATS)} className={`flex flex-col items-center gap-0.5 transition-all ${gameState === GameState.RECENT_CHATS ? 'text-white' : 'text-purple-200/60'}`}><svg className="w-4 h-4 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg><span className="text-[7px] font-black uppercase">Sinal</span></button>
            <button onClick={() => setIsSidebarOpen(true)} className="flex flex-col items-center gap-0.5 text-purple-200/60"><svg className="w-5 h-5 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg><span className="text-[7px] md:text-[9px] font-black uppercase">Nexus</span></button>
          </nav>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .fade-scene { position: relative; width: 100%; height: 100%; overflow: hidden; }
        .fade-layer { position: absolute; inset: 0; width: 100%; height: 100%; transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1); will-change: opacity, transform; }
        .lobby-layer { z-index: 10; }
        .builder-layer { opacity: 0; pointer-events: none; z-index: 500; transform: translateY(-20px) scale(0.98); background: #02040a; }
        .builder-layer.active { opacity: 1; pointer-events: auto; transform: translateY(0) scale(1); }
        
        @keyframes neon-blink {
          0%, 100% { 
            box-shadow: 0 0 0px rgba(34, 211, 238, 0);
            background-color: transparent;
          }
          50% { 
            box-shadow: 0 0 25px rgba(34, 211, 238, 0.3);
            background-color: rgba(34, 211, 238, 0.05);
          }
        }
        .neon-blink {
          animation: neon-blink 0.8s ease-in-out 3;
          position: relative;
          z-index: 50;
          border-radius: 2rem;
        }
      `}} />
      <SocialSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        userAvatar={resolveImageRef(myProfile.avatarUrl)} 
        userName={myProfile.name} 
        onOpenProfile={() => { 
          setViewedProfile({ ...myProfile }); 
          setIsSidebarOpen(false); 
        }} 
        onNavigateToFeed={() => { setGameState(GameState.FEED); setActiveSessionId(null); setIsSidebarOpen(false); }} 
        onNavigateToPrivate={() => { setArchiveViewMode('PRIVADO'); setGameState(GameState.MESSAGES); setActiveSessionId(null); setIsSidebarOpen(false); }} 
        onNavigateToChats={() => { setArchiveViewMode('CHATS'); setGameState(GameState.MESSAGES); setActiveSessionId(null); setIsSidebarOpen(false); }} 
        onNavigateToMembers={() => { setGameState(GameState.MEMBERS); setActiveSessionId(null); setIsSidebarOpen(false); }}
        onNavigateToPublicChat={() => {
          setPublicMessages(prev => [...prev, {
            id: `sys-join-${Date.now()}`,
            role: 'user',
            text: `${myProfile.name} entrou na conversa`,
            timestamp: Date.now(),
            personaName: 'SISTEMA'
          }]);
          setGameState(GameState.PUBLIC_CHAT);
          setIsSidebarOpen(false);
        }}
        onNavigateToRanking={() => { setGameState(GameState.RANKING); setActiveSessionId(null); setIsSidebarOpen(false); }} 
        onNavigateToDrafts={() => { setGameState(GameState.DRAFTS); setActiveSessionId(null); setIsSidebarOpen(false); }} 
        onReset={handleReset} 
        onGoHome={() => { setGameState(GameState.LOBBY); setActiveSessionId(null); setIsSidebarOpen(false); }} 
        communities={communities} 
        onSelectCommunity={(id) => { recordVisit(id); setActiveSessionId(id); setGameState(GameState.PLAYING); setIsSidebarOpen(false); }} 
      />
      {isNotifOpen && (
        <NotificationCenter 
          isOpen={isNotifOpen} 
          onClose={() => setIsNotifOpen(false)} 
          notifications={notifications} 
          onMarkAsRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? {...n, read: true} : n))} 
          onAction={(n) => {
            if (n.targetSessionId) {
              setSessions(prev => prev.map(s => s.id === n.targetSessionId ? { ...s, targetMessageId: n.targetMessageId } : s));
              setActiveSessionId(n.targetSessionId);
              setGameState(GameState.PLAYING);
              setIsNotifOpen(false);
            }
          }} 
        />
      )}
      {isHelpOpen && <HelpOverlay onClose={() => setIsHelpOpen(false)} onReset={handleReset} />}
    </div>
  );
};

export default App;
