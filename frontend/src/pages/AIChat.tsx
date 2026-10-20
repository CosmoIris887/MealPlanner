import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User as UserIcon, MessageSquare, Plus, Trash2, Loader2, Sparkles } from 'lucide-react';
import API, { ChatMessage, Conversation } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FormattedMessage } from '../components/FormattedMessage';

export const AIChat: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const samplePrompts = [
    'Berapa kalori nasi putih 100 gram?',
    'Rekomendasi makanan tinggi protein untuk sarapan.',
    'Saran makanan sehat dengan anggaran Rp25.000.',
    'Apa saja sumber protein nabati pengganti daging?',
    'Berapa target kalori harian ideal saya?'
  ];

  const fetchConversations = async () => {
    try {
      const res = await API.get('/chat/conversations');
      if (res.data?.success) {
        setConversations(res.data.conversations || []);
        if (res.data.conversations.length > 0 && !activeConvId) {
          loadConversationMessages(res.data.conversations[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const loadConversationMessages = async (id: number) => {
    try {
      setActiveConvId(id);
      const res = await API.get(`/chat/conversations/${id}`);
      if (res.data?.success) {
        setMessages(res.data.messages || []);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || sending) return;

    setInputMessage('');
    setSending(true);

    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await API.post('/chat', {
        conversation_id: activeConvId,
        message: text
      });

      if (res.data?.success) {
        if (!activeConvId) {
          setActiveConvId(res.data.conversation_id);
          fetchConversations();
        }
        setMessages(res.data.messages || []);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Maaf, terjadi kendala saat memproses konsultasi. Silakan periksa koneksi atau API key.';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: errorMsg }
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
  };

  const handleDeleteConv = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await API.delete(`/chat/conversations/${id}`);
      if (activeConvId === id) {
        handleNewChat();
      }
      fetchConversations();
    } catch (err) {
      console.error('Failed to delete conversation');
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto h-[calc(100vh-5rem)] flex flex-col md:flex-row gap-5 pb-24 md:pb-6">
      {/* Conversations History Sidebar */}
      <div className="w-full md:w-72 bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex flex-col shrink-0 h-44 md:h-full">
        <button
          onClick={handleNewChat}
          className="w-full bg-[#2E8B57] hover:bg-[#267347] text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 cursor-pointer mb-3 shrink-0 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Percakapan Baru</span>
        </button>

        <h3 className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider px-1 mb-2">Riwayat Konsultasi</h3>

        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => loadConversationMessages(conv.id)}
              className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                activeConvId === conv.id
                  ? 'bg-[#E8F5E9] text-[#2E8B57] font-semibold'
                  : 'text-[#243447] hover:bg-[#F8FAFC]'
              }`}
            >
              <div className="flex items-center space-x-2 truncate">
                <MessageSquare className="w-3.5 h-3.5 shrink-0 text-[#64748B]" />
                <span className="truncate">{conv.title}</span>
              </div>
              <button
                onClick={(e) => handleDeleteConv(conv.id, e)}
                className="text-[#94A3B8] hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                title="Hapus percakapan"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {conversations.length === 0 && (
            <p className="text-xs text-[#64748B] text-center py-6">Belum ada riwayat percakapan.</p>
          )}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col h-full overflow-hidden">
        {/* Chat Header */}
        <div className="p-3.5 sm:p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#E8F5E9] flex items-center justify-center text-[#2E8B57]">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-[#243447] text-sm">Asisten Nutrisi & Pola Makan</h2>
              <p className="text-[11px] text-[#2E8B57] flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2E8B57]"></span>
                <span>Terhubung dengan database makanan & profil fisik</span>
              </p>
            </div>
          </div>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 bg-[#FAFAFA]">
          {messages.length === 0 && (
            <div className="text-center py-8 space-y-4 max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-[#E8F5E9] text-[#2E8B57] mx-auto flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#243447]">Konsultasi Nutrisi & Pola Makan</h3>
                <p className="text-xs text-[#64748B] mt-1">
                  Ajukan pertanyaan seputar nilai kalori, menu diet seimbang, atau opsi makanan sehat berdasarkan profil Anda ({user?.profile?.goal?.replace('_', ' ') || 'Maintain'}).
                </p>
              </div>

              {/* Sample Prompts */}
              <div className="space-y-1.5 pt-2 text-left">
                <p className="text-xs font-semibold text-[#64748B]">Contoh Pertanyaan:</p>
                <div className="flex flex-wrap gap-2">
                  {samplePrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt)}
                      className="bg-white hover:bg-[#F8FAFC] text-xs text-[#243447] py-2 px-3 rounded-xl border border-[#E2E8F0] transition-colors text-left cursor-pointer shadow-xs"
                    >
                      "{prompt}"
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start space-x-2.5 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-[#E8F5E9] text-[#2E8B57] flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#EAF4FF] text-[#243447] border border-[#BFDBFE] font-medium rounded-tr-none'
                    : 'bg-white text-[#243447] border border-[#E2E8F0] rounded-tl-none shadow-xs'
                }`}
              >
                <FormattedMessage content={msg.content} role={msg.role} />
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-[#E8F5E9] text-[#2E8B57] flex items-center justify-center shrink-0 mt-0.5">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {sending && (
            <div className="flex items-center space-x-2.5 text-[#64748B] text-xs">
              <div className="w-7 h-7 rounded-lg bg-[#E8F5E9] text-[#2E8B57] flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#E2E8F0] flex items-center space-x-2 shadow-xs">
                <Loader2 className="w-4 h-4 animate-spin text-[#2E8B57]" />
                <span>Menyiapkan jawaban berdasarkan data nutrisi...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-[#E2E8F0] bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Tulis pertanyaan seputar makanan, kalori, atau diet..."
              className="flex-1 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#243447] placeholder-[#94A3B8] focus:outline-none focus:border-[#2E8B57]"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || sending}
              className="bg-[#2E8B57] hover:bg-[#267347] text-white p-2.5 sm:p-3 rounded-xl shadow-xs disabled:opacity-50 cursor-pointer transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
