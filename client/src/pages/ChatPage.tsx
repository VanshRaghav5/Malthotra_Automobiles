import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getConversations, createConversation, getMessages, sendMessage } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { Send, MessageCircle, Plus } from 'lucide-react';
import type { Conversation, Message } from '../types';

export default function ChatPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations, refetch } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => getConversations().then((r) => r.data as Conversation[]),
    enabled: isAuthenticated,
  });

  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ['messages', selectedId],
    queryFn: () => getMessages(selectedId!).then((r) => r.data as Message[]),
    enabled: isAuthenticated && !!selectedId,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (conversations?.length && !selectedId) {
      setSelectedId(conversations[0].id);
    }
  }, [conversations, selectedId]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <MessageCircle size={48} className="mx-auto text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-primary-900 mb-4">Sign in to chat</h1>
        <p className="text-gray-500 mb-6">You need an account to access conversations.</p>
        <button
          onClick={() => navigate('/login')}
          className="bg-accent text-white px-6 py-3 rounded-lg font-medium hover:bg-accent-hover"
        >
          Sign In
        </button>
      </div>
    );
  }

  const handleCreateConversation = async () => {
    const res = await createConversation();
    setSelectedId(res.data.id);
    refetch();
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedId || sending) return;
    setSending(true);
    try {
      await sendMessage(selectedId, message);
      setMessage('');
      refetchMessages();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 h-[calc(100vh-8rem)]">
      <h1 className="text-2xl font-bold text-primary-900 mb-6">Chat Support</h1>

      <div className="flex gap-4 h-full">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <span className="font-semibold text-primary-900">Chats</span>
            <button
              onClick={handleCreateConversation}
              className="p-1.5 bg-accent text-white rounded-lg hover:bg-accent-hover"
              aria-label="New conversation"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="overflow-y-auto" style={{ height: 'calc(100% - 56px)' }}>
            {conversations?.length === 0 && (
              <p className="p-4 text-sm text-gray-500 text-center">No conversations yet</p>
            )}
            {conversations?.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  selectedId === conv.id ? 'bg-accent/10 border-l-4 border-accent' : ''
                }`}
              >
                <p className="text-sm font-medium text-primary-900 truncate">
                  {conv.status === 'open' ? 'Support Chat' : conv.status === 'closed' ? 'Closed Chat' : 'Archived'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(conv.updated_at).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden">
          {selectedId ? (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages?.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2.5 rounded-xl text-sm ${
                        msg.sender_type === 'customer'
                          ? 'bg-accent text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p className="text-xs opacity-60 mt-1">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} className="border-t border-gray-200 p-4 flex gap-3">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                />
                <button
                  type="submit"
                  disabled={sending || !message.trim()}
                  className="p-2.5 bg-accent text-white rounded-lg hover:bg-accent-hover disabled:bg-gray-400"
                >
                  <Send size={18} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <p>Select or start a conversation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
