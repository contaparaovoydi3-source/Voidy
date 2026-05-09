
import React, { useState, useEffect } from 'react';
import { FeedPost, CommunityChannel } from '../types';
import BlogCreation from './BlogCreation';
import PollCreation from './PollCreation';
import ChatCreation from './ChatCreation';

interface CommunityDraftsProps {
  onBack: () => void;
  userName: string;
  userAvatar: string;
  onPublish: (post: FeedPost) => void;
  onPublishChat?: (channel: CommunityChannel) => void;
  verifySafety?: (base64: string) => Promise<boolean>;
}

type DraftType = 'BLOG' | 'POLL' | 'CHAT';

interface DraftItem {
  type: DraftType;
  key: string;
  data: any;
  lastModified: string;
}

const CommunityDrafts: React.FC<CommunityDraftsProps> = ({ onBack, userName, userAvatar, onPublish, onPublishChat, verifySafety }) => {
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [activeEditor, setActiveEditor] = useState<DraftType | null>(null);

  useEffect(() => {
    loadDrafts();
  }, [userName, activeEditor]);

  const loadDrafts = () => {
    const loadedDrafts: DraftItem[] = [];
    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')} às ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Blogs
    const blogKey = `void_draft_blog_${userName}`;
    const blogData = localStorage.getItem(blogKey);
    if (blogData) {
      const parsed = JSON.parse(blogData);
      if (parsed.title || parsed.content) {
        loadedDrafts.push({ type: 'BLOG', key: blogKey, data: parsed, lastModified: formattedDate });
      }
    }

    // Polls
    const pollKey = `void_draft_poll_${userName}`;
    const pollData = localStorage.getItem(pollKey);
    if (pollData) {
      const parsed = JSON.parse(pollData);
      if (parsed.title || (parsed.options && parsed.options.some((o: any) => o.text))) {
        loadedDrafts.push({ type: 'POLL', key: pollKey, data: parsed, lastModified: formattedDate });
      }
    }

    // Chats
    const chatKey = `void_draft_chat_${userName}`;
    const chatData = localStorage.getItem(chatKey);
    if (chatData) {
      const parsed = JSON.parse(chatData);
      if (parsed.name || parsed.description) {
        loadedDrafts.push({ type: 'CHAT', key: chatKey, data: parsed, lastModified: formattedDate });
      }
    }

    setDrafts(loadedDrafts);
  };

  const handleDelete = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Deseja purgar este arquivo de memória?")) {
      localStorage.removeItem(key);
      loadDrafts();
    }
  };

  const handlePublishChatInternal = (channel: CommunityChannel) => {
    if (onPublishChat) onPublishChat(channel);
    else if (onPublish) {
        // Fallback for generic channel creation from community view
        onPublish({ ...channel, author: userName, avatar: userAvatar, likes: 0, time: 'Agora', tag: 'CHAT', timestamp: Date.now(), comments: [] } as any);
    }
    setActiveEditor(null);
  };

  if (activeEditor === 'BLOG') return <BlogCreation onBack={() => setActiveEditor(null)} onCreate={onPublish} userName={userName} userAvatar={userAvatar} verifySafety={verifySafety} />;
  if (activeEditor === 'POLL') return <PollCreation onBack={() => setActiveEditor(null)} onCreate={onPublish} userName={userName} userAvatar={userAvatar} verifySafety={verifySafety} />;
  if (activeEditor === 'CHAT') return <ChatCreation onBack={() => setActiveEditor(null)} onCreate={handlePublishChatInternal} userName={userName} verifySafety={verifySafety} />;

  return (
    <div className="fixed inset-0 z-[800] bg-[#02040a] flex flex-col animate-in slide-in-from-right duration-500 font-inter text-white overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-900/10 blur-[120px] rounded-full pointer-events-none"></div>

      <header className="px-6 py-8 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between z-10 shrink-0">
        <button onClick={onBack} className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-white transition-all active:scale-90">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-xl font-syncopate font-black text-white uppercase tracking-[0.3em] glow-cyan">Arquivos</h2>
          <span className="text-[7px] font-bold text-cyan-500 uppercase tracking-[0.4em] mt-1">Rascunhos Locais</span>
        </div>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar p-6 relative z-10 pb-32">
        {drafts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20 text-center space-y-4">
             <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-700 flex items-center justify-center">
                <span className="text-3xl">💾</span>
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.4em]">Nenhum rascunho detectado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {drafts.map((draft) => (
              <div 
                key={draft.key}
                onClick={() => setActiveEditor(draft.type)}
                className="group relative w-full p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 hover:bg-white/[0.04] transition-all cursor-pointer active:scale-[0.98] overflow-hidden"
              >
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg border border-white/10 ${draft.type === 'BLOG' ? 'bg-blue-900/20 text-blue-400' : draft.type === 'POLL' ? 'bg-purple-900/20 text-purple-400' : 'bg-amber-900/20 text-amber-400'}`}>
                      {draft.type === 'BLOG' && '📝'}
                      {draft.type === 'POLL' && '📊'}
                      {draft.type === 'CHAT' && '💬'}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{draft.type}</span>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider truncate max-w-[180px]">
                        {draft.data.title || draft.data.name || "Sem Título"}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[7px] font-bold text-cyan-500/60 uppercase tracking-widest">Edição: {draft.lastModified}</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={(e) => handleDelete(draft.key, e)}
                    className="p-3 rounded-xl hover:bg-red-500/10 text-slate-600 hover:text-red-500 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CommunityDrafts;
