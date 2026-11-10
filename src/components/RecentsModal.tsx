import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Plus,
  Clock,
  Trash2,
  Edit2,
  Check,
  Pin,
  MessageSquare,
  Search,
  Sparkles,
  ChevronRight,
  LogIn,
  Calendar,
  Library,
  Image as ImageIcon,
} from 'lucide-react';
import { Conversation, UserProfile } from '../types';
import { toSafeDate, formatSafeTime } from '../lib/dateUtils';
import { LibraryPicturesView } from './LibraryPicturesView';
import { getUnifiedLibraryItems, getUnifiedUserPictures } from '../lib/libraryStorage';

interface RecentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (conversationId: string) => void;
  onRenameConversation?: (conversationId: string, newTitle: string) => void;
  onTogglePinConversation?: (conversationId: string) => void;
  user?: UserProfile;
  onGoogleSignIn?: () => void;
}

export const RecentsModal: React.FC<RecentsModalProps> = ({
  isOpen,
  onClose,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onTogglePinConversation,
  user,
  onGoogleSignIn,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [activeSubSection, setActiveSubSection] = useState<'chats' | 'library' | 'pictures'>('chats');
  const [syncTick, setSyncTick] = useState(0);

  useEffect(() => {
    const handleSync = () => setSyncTick((t) => t + 1);
    window.addEventListener('sigma-library-updated', handleSync);
    window.addEventListener('sigma-pictures-updated', handleSync);
    return () => {
      window.removeEventListener('sigma-library-updated', handleSync);
      window.removeEventListener('sigma-pictures-updated', handleSync);
    };
  }, []);

  const libraryCount = useMemo(
    () => getUnifiedLibraryItems(user, conversations).length,
    [user, conversations, syncTick]
  );
  const picturesCount = useMemo(
    () => getUnifiedUserPictures(user, conversations).length,
    [user, conversations, syncTick]
  );

  // Group conversations: Pinned, Today, Yesterday, Previous 7 Days, Earlier
  const groupedConversations = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const yesterday = today - oneDayMs;
    const sevenDaysAgo = today - 7 * oneDayMs;

    const filtered = conversations.filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const titleMatch = c.title.toLowerCase().includes(q);
      const msgMatch = c.messages?.some((m) => m.content.toLowerCase().includes(q));
      return titleMatch || msgMatch;
    });

    const groups: {
      pinned: Conversation[];
      today: Conversation[];
      yesterday: Conversation[];
      last7Days: Conversation[];
      earlier: Conversation[];
    } = {
      pinned: [],
      today: [],
      yesterday: [],
      last7Days: [],
      earlier: [],
    };

    filtered.forEach((conv) => {
      if (conv.isPinned) {
        groups.pinned.push(conv);
        return;
      }
      const convDate = toSafeDate(conv.updatedAt || conv.createdAt).getTime();
      if (convDate >= today) {
        groups.today.push(conv);
      } else if (convDate >= yesterday) {
        groups.yesterday.push(conv);
      } else if (convDate >= sevenDaysAgo) {
        groups.last7Days.push(conv);
      } else {
        groups.earlier.push(conv);
      }
    });

    return groups;
  }, [conversations, searchQuery]);

  if (!isOpen) return null;

  const totalCount = conversations.length;

  const handleStartRename = (conv: Conversation) => {
    setEditingChatId(conv.id);
    setEditTitleValue(conv.title || '');
  };

  const handleSaveRename = (convId: string) => {
    if (editTitleValue.trim() && onRenameConversation) {
      onRenameConversation(convId, editTitleValue.trim());
    }
    setEditingChatId(null);
  };

  return (
    <div
      id="recents-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        id="recents-modal-content"
        className="w-full max-w-xl bg-[#0b0f17] border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-[#0e131d]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Recent Chats
                {totalCount > 0 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-normal">
                    {totalCount}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Your conversations saved day by day
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="recents-new-chat-btn"
              onClick={() => {
                onNewChat();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-semibold shadow-xs transition-all cursor-pointer"
              title="Start a new chat session"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Chat</span>
            </button>
            <button
              id="recents-close-btn"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Not logged in banner */}
        {!user?.isLoggedIn && (
          <div className="px-5 py-3 bg-[#131924] border-b border-slate-800 flex items-center justify-between gap-3 text-xs">
            <div className="text-slate-300">
              <span className="font-semibold text-emerald-400">Save your history:</span> Sign in to keep all your daily conversations safely synced across devices.
            </div>
            {onGoogleSignIn && (
              <button
                id="recents-login-prompt-btn"
                onClick={onGoogleSignIn}
                className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-medium flex-shrink-0 transition-colors cursor-pointer"
              >
                <LogIn className="w-3 h-3" />
                <span>Sign in</span>
              </button>
            )}
          </div>
        )}

        {/* Search Bar & Recent Chats -> Library / Pictures Options */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-[#0c1017] space-y-2.5">
          {totalCount > 0 && activeSubSection === 'chats' && (
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="recents-search-input"
                type="text"
                placeholder="Search previous conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#131924] border border-slate-800 text-xs text-white placeholder:text-slate-500 rounded-xl pl-9 pr-4 py-2 focus:outline-hidden focus:border-emerald-500/60 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {/* Recent Chats -> Library -> Pictures options */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setActiveSubSection('chats')}
              className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                activeSubSection === 'chats'
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-white'
                  : 'bg-[#131924] border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Recent Chats</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                {totalCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubSection('library')}
              className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                activeSubSection === 'library'
                  ? 'bg-indigo-500/15 border-indigo-500/50 text-white'
                  : 'bg-[#131924] border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Library className="w-3.5 h-3.5 text-indigo-400" />
                <span>Library</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                {libraryCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubSection('pictures')}
              className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                activeSubSection === 'pictures'
                  ? 'bg-cyan-500/15 border-cyan-500/50 text-white'
                  : 'bg-[#131924] border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                <span>Pictures</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                {picturesCount}
              </span>
            </button>
          </div>
        </div>

        {/* Conversation List Groups or Library / Pictures */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeSubSection !== 'chats' ? (
            <LibraryPicturesView
              key={`recents-modal-${activeSubSection}-${syncTick}`}
              user={user || { id: 'guest', name: 'Guest', email: '', isLoggedIn: false }}
              conversations={conversations}
              mode={activeSubSection === 'library' ? 'library-only' : 'pictures-only'}
              onSelectConversation={(convId) => {
                onSelectConversation(convId);
                onClose();
              }}
            />
          ) : totalCount === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-[#131924] border border-slate-800 flex items-center justify-center text-slate-500 mb-3">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-200 mb-1">
                No conversations yet
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mb-4">
                Ask a question or send a message to Sigma AI, and your chat sessions will be organized here day by day.
              </p>
              <button
                id="recents-start-first-chat-btn"
                onClick={() => {
                  onNewChat();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Start a Chat</span>
              </button>
            </div>
          ) : (
            <>
              {/* Group: Pinned */}
              {groupedConversations.pinned.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider px-2 flex items-center gap-1.5">
                    <Pin className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>Pinned</span>
                  </div>
                  <div className="space-y-1">
                    {groupedConversations.pinned.map((conv) => (
                      <ConversationItem
                        key={conv.id}
                        conversation={conv}
                        isActive={conv.id === activeConversationId}
                        isEditing={editingChatId === conv.id}
                        editTitleValue={editTitleValue}
                        onEditChange={setEditTitleValue}
                        onSaveRename={() => handleSaveRename(conv.id)}
                        onCancelRename={() => setEditingChatId(null)}
                        onStartRename={() => handleStartRename(conv)}
                        onTogglePin={() => onTogglePinConversation?.(conv.id)}
                        onSelect={() => {
                          onSelectConversation(conv.id);
                          onClose();
                        }}
                        onDelete={() => onDeleteConversation(conv.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Group: Today */}
              {groupedConversations.today.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>Today</span>
                  </div>
                  <div className="space-y-1">
                    {groupedConversations.today.map((conv) => (
                      <ConversationItem
                        key={conv.id}
                        conversation={conv}
                        isActive={conv.id === activeConversationId}
                        isEditing={editingChatId === conv.id}
                        editTitleValue={editTitleValue}
                        onEditChange={setEditTitleValue}
                        onSaveRename={() => handleSaveRename(conv.id)}
                        onCancelRename={() => setEditingChatId(null)}
                        onStartRename={() => handleStartRename(conv)}
                        onTogglePin={() => onTogglePinConversation?.(conv.id)}
                        onSelect={() => {
                          onSelectConversation(conv.id);
                          onClose();
                        }}
                        onDelete={() => onDeleteConversation(conv.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Group: Yesterday */}
              {groupedConversations.yesterday.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                    <span>Yesterday</span>
                  </div>
                  <div className="space-y-1">
                    {groupedConversations.yesterday.map((conv) => (
                      <ConversationItem
                        key={conv.id}
                        conversation={conv}
                        isActive={conv.id === activeConversationId}
                        isEditing={editingChatId === conv.id}
                        editTitleValue={editTitleValue}
                        onEditChange={setEditTitleValue}
                        onSaveRename={() => handleSaveRename(conv.id)}
                        onCancelRename={() => setEditingChatId(null)}
                        onStartRename={() => handleStartRename(conv)}
                        onTogglePin={() => onTogglePinConversation?.(conv.id)}
                        onSelect={() => {
                          onSelectConversation(conv.id);
                          onClose();
                        }}
                        onDelete={() => onDeleteConversation(conv.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Group: Previous 7 Days */}
              {groupedConversations.last7Days.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>Previous 7 Days</span>
                  </div>
                  <div className="space-y-1">
                    {groupedConversations.last7Days.map((conv) => (
                      <ConversationItem
                        key={conv.id}
                        conversation={conv}
                        isActive={conv.id === activeConversationId}
                        isEditing={editingChatId === conv.id}
                        editTitleValue={editTitleValue}
                        onEditChange={setEditTitleValue}
                        onSaveRename={() => handleSaveRename(conv.id)}
                        onCancelRename={() => setEditingChatId(null)}
                        onStartRename={() => handleStartRename(conv)}
                        onTogglePin={() => onTogglePinConversation?.(conv.id)}
                        onSelect={() => {
                          onSelectConversation(conv.id);
                          onClose();
                        }}
                        onDelete={() => onDeleteConversation(conv.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Group: Earlier */}
              {groupedConversations.earlier.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>Earlier</span>
                  </div>
                  <div className="space-y-1">
                    {groupedConversations.earlier.map((conv) => (
                      <ConversationItem
                        key={conv.id}
                        conversation={conv}
                        isActive={conv.id === activeConversationId}
                        isEditing={editingChatId === conv.id}
                        editTitleValue={editTitleValue}
                        onEditChange={setEditTitleValue}
                        onSaveRename={() => handleSaveRename(conv.id)}
                        onCancelRename={() => setEditingChatId(null)}
                        onStartRename={() => handleStartRename(conv)}
                        onTogglePin={() => onTogglePinConversation?.(conv.id)}
                        onSelect={() => {
                          onSelectConversation(conv.id);
                          onClose();
                        }}
                        onDelete={() => onDeleteConversation(conv.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-[#0c1017] flex items-center justify-between text-xs text-slate-500">
          <span>Sigma AI Conversation History</span>
          <span className="font-mono">Copyright © 2025-2026 The Sigma Ai</span>
        </div>
      </div>
    </div>
  );
};

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  isEditing?: boolean;
  editTitleValue?: string;
  onEditChange?: (val: string) => void;
  onSaveRename?: () => void;
  onCancelRename?: () => void;
  onStartRename?: () => void;
  onTogglePin?: () => void;
  onSelect: () => void;
  onDelete: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  isEditing,
  editTitleValue = '',
  onEditChange,
  onSaveRename,
  onCancelRename,
  onStartRename,
  onTogglePin,
  onSelect,
  onDelete,
}) => {
  const formattedTime = useMemo(
    () => formatSafeTime(conversation.updatedAt || conversation.createdAt),
    [conversation.updatedAt, conversation.createdAt]
  );

  const previewSnippet =
    conversation.lastMessagePreview ||
    conversation.messages?.find((m) => m.role === 'user')?.content ||
    conversation.title ||
    'Conversation';

  if (isEditing) {
    return (
      <div className="p-2.5 rounded-xl bg-[#131924] border border-emerald-500/80 flex items-center gap-2">
        <input
          type="text"
          value={editTitleValue}
          onChange={(e) => onEditChange?.(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSaveRename?.();
            if (e.key === 'Escape') onCancelRename?.();
          }}
          autoFocus
          className="flex-1 bg-transparent text-xs text-white outline-none px-1 font-medium"
          placeholder="Chat title..."
        />
        <button
          type="button"
          onClick={onSaveRename}
          className="p-1 text-emerald-400 hover:text-emerald-300 rounded cursor-pointer"
          title="Save title"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onCancelRename}
          className="p-1 text-slate-400 hover:text-slate-200 rounded cursor-pointer"
          title="Cancel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      id={`conversation-item-${conversation.id}`}
      className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
        isActive
          ? 'bg-emerald-950/30 border-emerald-800/80 text-white'
          : 'bg-[#131924]/60 hover:bg-[#131924] border-slate-800/80 hover:border-slate-700 text-slate-300 hover:text-white'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isActive
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold truncate leading-tight flex items-center gap-1.5">
              {conversation.isPinned && (
                <Pin className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
              )}
              <span className="truncate">{conversation.title || 'Chat Session'}</span>
            </span>
            <span className="text-[10px] text-slate-500 flex-shrink-0 font-mono">
              {formattedTime}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 truncate mt-0.5 opacity-80">
            {previewSnippet}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Pin button */}
        {onTogglePin && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin();
            }}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              conversation.isPinned
                ? 'text-amber-400 hover:bg-amber-400/10'
                : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800 opacity-0 group-hover:opacity-100'
            }`}
            title={conversation.isPinned ? 'Unpin chat' : 'Pin chat to top'}
          >
            <Pin className={`w-3.5 h-3.5 ${conversation.isPinned ? 'fill-amber-400' : ''}`} />
          </button>
        )}

        {/* Rename Pencil button */}
        {onStartRename && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStartRename();
            }}
            className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-md hover:bg-slate-800 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
            title="Rename conversation"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Delete button */}
        <button
          id={`delete-conv-${conversation.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-md hover:bg-rose-950/40 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
          title="Delete this chat history"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
