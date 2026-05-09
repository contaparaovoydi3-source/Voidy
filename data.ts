
import { FeedPost, Community, UserProfile } from './types';

export const MOCK_FOLLOWERS: UserProfile[] = [];

export const TEST_COMMUNITIES: Community[] = [
  {
    id: 'test-1',
    name: 'Neo-Verona',
    description: 'Um refúgio para as almas românticas perdidas no vácuo. Aqui, a poesia é nossa única lei.',
    catchphrase: 'Onde o amor desafia a gravidade.',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=NeoVerona',
    theme: 'Romance',
    banner: 'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?q=100&w=3840&auto=format&fit=crop',
    creator: 'Drake.OS',
    leaders: ['Drake.OS'],
    coLeaders: [],
    membersCount: 980,
    level: 5,
    posts: [],
    messages: [],
    tags: ['romance', 'poesia'],
    isPublic: true,
    membersData: {
      'Drake.OS': {
        userId: 'Drake.OS',
        cityLevel: 10,
        cityReputation: 5000,
        cityRank: 'FUNDADOR',
        joinDate: Date.now() - 10000000,
        personaName: 'Drake.OS',
        personaAvatar: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=DrakeMaster'
      }
    }
  },
  {
    id: 'test-2',
    name: 'Setor de Combate 9',
    description: 'Arena de elite para gladiadores neurais.',
    catchphrase: 'Sangue e Neon no Vácuo.',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=Sector9',
    theme: 'Luta',
    banner: 'https://images.unsplash.com/photo-1555617766-c94804975da3?q=100&w=3840&auto=format&fit=crop',
    creator: 'Drake.OS',
    leaders: ['Drake.OS'],
    coLeaders: [],
    membersCount: 1000,
    level: 12,
    posts: [],
    messages: [],
    tags: ['luta', 'arena'],
    isPublic: true,
    membersData: {
      'Drake.OS': {
        userId: 'Drake.OS',
        cityLevel: 15,
        cityReputation: 8000,
        cityRank: 'MESTRE',
        joinDate: Date.now() - 20000000,
        personaName: 'Drake.OS',
        personaAvatar: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=DrakeMaster'
      }
    }
  }
];

export const INITIAL_POSTS: FeedPost[] = [
  {
    id: '1',
    author: 'Drake.OS',
    avatar: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=DrakeMaster&backgroundColor=0a0c1a',
    content: '[c]AVISO CRÍTICO[/c]\nDetectamos flutuações anômalas no Setor 7. Operativos devem manter cautela absoluta ao cruzar a fenda quântica.',
    images: ['https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=100&w=3840&auto=format&fit=crop'],
    likes: 1240,
    time: '2h ago',
    tag: 'SISTEMA',
    timestamp: Date.now() - 7200000,
    comments: [],
    isFeatured: true
  }
];

export const DEFAULT_THEMES = [
  { id: 'geral', label: 'Geral', icon: '🌐', img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=100&w=3840&auto=format&fit=crop' },
  { id: 'romance', label: 'Romance', icon: '💕', img: 'https://images.unsplash.com/photo-1534103362078-d07e750bd0c4?q=100&w=3840&auto=format&fit=crop' },
  { id: 'acao', label: 'Ação', icon: '⚡', img: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=100&w=3840&auto=format&fit=crop' },
  { id: 'luta', label: 'Luta', icon: '⚔️', img: 'https://images.unsplash.com/photo-1555617766-c94804975da3?q=100&w=3840&auto=format&fit=crop' },
  { id: 'suspense', label: 'Suspense', icon: '👁️', img: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=100&w=3840&auto=format&fit=crop' },
  { id: 'terror', label: 'Terror', icon: '💀', img: 'https://images.unsplash.com/photo-1505635330303-dfb307d4722c?q=100&w=3840&auto=format&fit=crop' },
  { id: 'escolar', label: 'Escolar', icon: '🏫', img: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=100&w=3840&auto=format&fit=crop' },
  { id: 'anime', label: 'Anime', icon: '🌸', img: 'https://images.unsplash.com/photo-1578632738980-4334635c894d?q=100&w=3840&auto=format&fit=crop' },
  { id: 'medieval', label: 'Medieval', icon: '🏰', img: 'https://images.unsplash.com/photo-1599408162165-8bca2943d0d1?q=100&w=3840&auto=format&fit=crop' },
  { id: 'futuro', label: 'Futuro', icon: '🛸', img: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=100&w=3840&auto=format&fit=crop' },
];
