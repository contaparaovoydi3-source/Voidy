
export enum GameState {
  AUTH = 'AUTH',
  LOBBY = 'LOBBY',
  PLAYING = 'PLAYING',
  CHARACTER_CREATION = 'CHARACTER_CREATION',
  SOCIAL_DISCOVERY = 'SOCIAL_DISCOVERY',
  PUBLIC_CHAT = 'PUBLIC_CHAT',
  MESSAGES = 'MESSAGES',
  RECENT_CHATS = 'RECENT_CHATS',
  COMMUNITY_CREATION = 'COMMUNITY_CREATION',
  FEED = 'FEED',
  RANKING = 'RANKING',
  BANNED = 'BANNED',
  COMMUNITY_SEARCH = 'COMMUNITY_SEARCH',
  DRAFTS = 'DRAFTS',
  INVITE_FOLLOWERS = 'INVITE_FOLLOWERS',
  MEMBERS = 'MEMBERS'
}

export type MissionPhase = 'INÍCIO' | 'EXPLORAÇÃO' | 'MEIO' | 'FIM (BOSS)';

export interface RpgEnemy {
  nome: string;
  tipo: 'comum' | 'boss';
  local: string;
  hp: number;
  ataque: number;
  defesa: number;
  comportamento: string;
  descricao: string;
}

export interface RpgPhase {
  fase: number;
  nome: string;
  descricao: string;
  inimigos: RpgEnemy[];
}

export interface RpgTest {
  id: string;
  type: string;
  difficulty: number;
  status: 'PENDING' | 'COMPLETED';
  description: string;
}

export interface PlayerState {
  userId: string;
  currentLocation: string;
  visitedLocations?: string[];
  progressStatus: 'LIVRE' | 'BLOQUEADO';
  pendingTests: RpgTest[];
  attributes?: Record<string, number>;
  boss_hp?: number;
  boss_derrotado?: boolean;
  groupId?: string;
}

export interface LocationConnection {
  [locationId: string]: string[];
}

export interface RpgWorldEvent {
  id: string;
  location: string;
  description: string;
  difficulty: number;
  isActive: boolean;
  triggerKeyword?: string;
}

export interface Notification {
  id: string;
  type: 'INVITE' | 'PROMOTION' | 'COMMENT' | 'LIKE' | 'REPORT' | 'MURAL' | 'FOLLOW' | 'FEATURE' | 'PURCHASE' | 'SYSTEM' | 'MENTION';
  title: string;
  content: string;
  read: boolean;
  timestamp: number;
  sender: string;
  targetMessageId?: string;
  targetSessionId?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  personaName?: string;
  personaAvatar?: string;
  image?: string;
  audio?: string;
  replyToId?: string;
  isDeleted?: boolean;
  isSystem?: boolean;
}

export interface CommunityChannel {
  id: string;
  name: string;
  type: 'TEXT' | 'VOICE' | 'RPG';
  messages: Message[];
  description?: string;
  cover?: string;
  background?: string;
  isPrivate?: boolean;
  creatorAvatar?: string;
  membersCount?: number;
  rpgData?: any;
  admins?: string[];
  coAdmins?: string[];
}

export interface PersonaStats {
  strength: number;
  agility: number;
  intelligence: number;
  willpower: number;
  hp: number;
}

export interface MuralPost {
  id: string;
  author: string;
  avatar: string;
  text: string;
  timestamp: number;
}

export interface MarketItem {
  id: string;
  name: string;
  price: number;
  seller: string;
  icon: string;
  image?: string;
  rarity?: 'COMUM' | 'RARO' | 'EPICO' | 'LENDARIO';
  type: 'MATERIAL' | 'CONSUMIVEL' | 'CHAVE' | 'ARMA' | 'CUSTOM';
  desc: string;
  attack?: number;
  defense?: number;
  hp?: number;
  buff?: string;
  vulnerability?: string;
}

export interface Npc {
  id: string;
  name: string;
  avatar: string;
  role: string;
  introMessage?: string;
}

export interface RpgMission {
  id: string;
  title: string;
  reward: number;
  location: string;
  type: string;
  description: string;
  imageUrl?: string;
  isMain?: boolean;
  creator: string;
  deadline?: number;
  createdAt?: number;
  theme?: string;
  status?: 'DRAFT' | 'PUBLISHED';
  duration?: number;
  chatId?: string;
  npcs?: Npc[];
  finalBoss?: string;
}

export interface CityMemberData {
  userId: string;
  cityLevel: number;
  cityReputation: number;
  cityRank: string;
  joinDate: number;
  weeklyMinutes?: number;
  personaName?: string;
  personaAvatar?: string;
  personaBio?: string;
  personaStats?: PersonaStats;
  personaClass?: string;
  wallet?: number;
  inventory?: MarketItem[];
  rpgJob?: string;
  lastWorkTime?: number;
  personaPanelColor?: string;
  personaContentColor?: string;
  personaFrameColor?: string;
  personaNameColor?: string;
  personaPanelImage?: string;
  personaContentImage?: string;
  personaFrameStyle?: string;
  personaBubbleStyle?: string;
  personaBubbleColor?: string;
  mural?: MuralPost[];
  posts?: FeedPost[];
  customTags?: string[];
  customTagColor?: string;
  voidyCoins?: number;
  dailyAdCount?: number;
  lastAdReset?: number;
}

export interface CommunityStyle {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  patternType: 'STARS' | 'GRID' | 'NEBULA' | 'NONE';
  glassOpacity: number;
  borderRoundness: string;
  sidebarBg?: string;
  headerBg?: string;
  bottomBarBg?: string;
}

// Added CommunityTabType fix
export type CommunityTabType = 'FEED' | 'CHAT' | 'STATIC' | 'WIKI' | 'DEFAULT';

export interface CommunityTab {
  id: string;
  label: string;
  icon: string;
  isVisible: boolean;
  isPrivate?: boolean;
  // Updated to use CommunityTabType
  type?: CommunityTabType;
  data?: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  catchphrase?: string;
  avatar: string;
  theme?: string;
  banner?: string;
  homeCover?: string;
  primaryColor?: string;
  creator: string;
  leaders: string[];
  coLeaders: string[];
  membersCount: number;
  level: number;
  posts: FeedPost[];
  messages: Message[];
  channels?: CommunityChannel[];
  membersData?: Record<string, CityMemberData>;
  rpgMarket?: MarketItem[];
  rpgMissions?: RpgMission[];
  tags: string[];
  isPublic: boolean;
  style?: CommunityStyle;
  sidebarTabs?: CommunityTab[];
  headerTabs?: CommunityTab[];
}

export interface UserProfile {
  id?: string;
  name: string;
  avatarUrl: string;
  rank: string;
  level: number;
  isMe: boolean;
  reputation: number;
  following: number;
  followers: number;
  bio?: string;
  statusIcon?: string;
  statusColor?: string;
  nameColor?: string;
  panelColor?: string;
  contentColor?: string;
  panelImage?: string;
  contentImage?: string;
  frameColor?: string;
  frameStyle?: string;
  bubbleStyle?: string;
  bubbleColor?: string;
  hideStats?: boolean;
  isVip?: boolean;
  voidyCoins?: number;
  dailyAdCount?: number;
  lastAdReset?: number;
  muralTopColor?: string;
  muralFeedColor?: string;
  muralImage?: string;
  muralFeedImage?: string;
  mural?: MuralPost[];
  posts?: FeedPost[];
  dailyMessageCount?: number;
  lastDailyReset?: number;
}

export interface PostComment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  timestamp: number;
  likes: number;
  replyToId?: string;
  likedBy?: string[];
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  votedBy?: string[];
  image?: string | null;
}

export interface FeedPost {
  id: string;
  author: string;
  avatar: string;
  title?: string;
  content: string;
  images?: string[];
  likes: number;
  time: string;
  tag: string;
  timestamp: number;
  comments?: PostComment[];
  isFeatured?: boolean;
  pollOptions?: PollOption[];
  customBgType?: 'color' | 'image';
  customBgColor?: string;
  customBgImage?: string;
  customTopColor?: string;
  customTopImage?: string;
  likedBy?: string[];
  galleryImages?: (string | {src: string, position?: number})[];
  customTopImages?: (string | {src: string, position?: number})[];
  customBgImages?: (string | {src: string, position?: number})[];
  hideTopOverlay?: boolean;
  customAvatar?: string;
  customKeywords?: string;
  customInfoRows?: { label: string, value: string, type?: 'text' | 'rating_star' | 'rating_heart' }[];
  customGallery?: (string | {src: string, position?: number})[];
  customHideOverlay?: boolean;
  mural?: MuralPost[];
}

export interface CharacterStats {
  strength: number;
  agility: number;
  intelligence: number;
  willpower: number;
  hp: number;
}

export interface Character {
  name: string;
  class: string;
  stats: CharacterStats;
  inventory: any[];
  background: string;
  wallet?: number;
}

export interface RpgMissionState {
  id: string;
  boss_hp: number;
  boss_derrotado: boolean;
  concluida: boolean;
  recompensa_entregue: boolean;
  participantes: string[];
  group_boss_hps?: Record<string, number>;
  group_boss_vencidos?: Record<string, boolean>;
}

export interface RpgData {
  map?: Record<string, string[]>;
  playerStates?: Record<string, PlayerState>;
  tema?: string;
  objetivo?: string;
  phases?: RpgPhase[];
  finalLocation?: string;
  initialLocation?: string;
  missionState?: RpgMissionState;
  npcs?: Npc[];
  missionId?: string;
  currentPhase?: MissionPhase;
  shops?: any[];
  events?: any[];
  scenery?: string;
  progressStatus?: string;
}

export interface ChatSession {
  id: string;
  name: string;
  title?: string;
  avatar: string;
  description?: string;
  rules?: string;
  messages: Message[];
  isPinned: boolean;
  lastUpdate: number;
  type: 'IA' | 'PRIVADO' | 'CLUSTER' | 'PUBLICO' | 'RPG';
  status: 'pending' | 'accepted';
  creator: string;
  nature?: 'RPG' | 'LIVRE';
  rpgData?: RpgData;
  isTyping?: boolean;
  background?: string;
  cover?: string;
  userBubbleColor?: string;
  partnerBubbleColor?: string;
  admins?: string[];
  coAdmins?: string[];
  participants?: string[];
  targetMessageId?: string;
}
