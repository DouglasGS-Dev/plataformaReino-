import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot, addDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { UserAvatar } from './UIComponents';

interface Message {
  id: string;
  cellId: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  type: 'text' | 'image' | 'system';
  createdAt: Timestamp;
}

interface CellChatProps {
  cellId: string;
  cellName: string;
  onClose: () => void;
}

export default function CellChat({ cellId, cellName, onClose }: CellChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) setUserProfile(snap.data());
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!cellId) return;

    const q = query(
      collection(db, 'cells', cellId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message));
      setMessages(msgs);
      setLoading(false);
      
      // Scroll to bottom on new messages
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    }, (error) => {
      console.error("Error fetching messages:", error);
      try {
        handleFirestoreError(error, OperationType.LIST, `cells/${cellId}/messages`);
      } catch (e) {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [cellId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !auth.currentUser) return;

    setSending(true);
    try {
      const path = `cells/${cellId}/messages`;
      try {
        await addDoc(collection(db, 'cells', cellId, 'messages'), {
          cellId,
          authorId: auth.currentUser.uid,
          authorName: userProfile?.displayName || auth.currentUser.displayName || 'Membro',
          authorPhoto: userProfile?.photoURL || auth.currentUser.photoURL || '',
          content: newMessage.trim(),
          type: 'text',
          createdAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 bg-white flex flex-col md:relative md:inset-auto md:h-[600px] md:rounded-3xl md:shadow-2xl md:border md:border-slate-200 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-bottom border-slate-100 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <MessageCircle size={20} className="lucide lucide-message-circle" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 leading-tight">{cellName}</h3>
            <p className="text-xs text-slate-500">Chat da Célula</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
            <Loader2 className="animate-spin" size={24} />
            <p className="text-sm">Carregando mensagens...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center px-8">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Send size={24} />
            </div>
            <p className="font-medium text-slate-600">Nenhuma mensagem ainda</p>
            <p className="text-sm mt-1">Seja o primeiro a enviar uma mensagem para sua célula!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.authorId === auth.currentUser?.uid;
            const showAvatar = index === 0 || messages[index - 1].authorId !== msg.authorId;

            return (
              <div 
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {!isMe && showAvatar && (
                  <span className="text-[10px] font-bold text-slate-400 ml-10 mb-1 uppercase tracking-wider">
                    {msg.authorName}
                  </span>
                )}
                <div className={`flex items-end gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isMe && (
                    <UserAvatar 
                      src={msg.authorPhoto} 
                      name={msg.authorName} 
                      size="sm"
                    />
                  )}
                  <div className={`p-3 rounded-2xl text-sm shadow-sm ${
                    isMe 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                  }`}>
                    {msg.content}
                    <div className={`text-[9px] mt-1 opacity-60 text-right`}>
                      {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-top border-slate-100 shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <button 
            type="button"
            className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
          >
            <ImageIcon size={20} />
          </button>
          <input 
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim() || sending}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              newMessage.trim() && !sending
                ? 'btn-primary' 
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </form>
      </div>
    </motion.div>
  );
}

// Helper component for the icon
function MessageCircle({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}
