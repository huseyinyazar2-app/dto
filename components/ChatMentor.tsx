import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, UserProfile, ChatSession } from '../types';
import { generateDTOResponse } from '../services/geminiService';
import { getProfile, saveSession, getSession, createNewSession } from '../services/storageService';
import { Send, User, Bot, Sparkles, Trash2, Edit, Download, Mic, MicOff } from 'lucide-react';

interface ChatMentorProps {
  onEditProfile: () => void;
  sessionId: string | null;
  onSessionUpdate: () => void;
}

const ChatMentor: React.FC<ChatMentorProps> = ({ onEditProfile, sessionId, onSessionUpdate }) => {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load Profile Async
  useEffect(() => {
    const fetchProfile = async () => {
      const profile = await getProfile();
      setUserProfile(profile);
    };
    fetchProfile();
  }, []);

  // Load Session Logic Async
  useEffect(() => {
    const loadSessionData = async () => {
      if (sessionId) {
        const savedSession = await getSession(sessionId);
        if (savedSession) {
          setCurrentSession(savedSession);
          setMessages(savedSession.messages);
        } else {
          const newSession = createNewSession();
          setCurrentSession(newSession);
          setMessages([]);
        }
      } else {
         const newSession = createNewSession();
         setCurrentSession(newSession);
         setMessages([]);
      }
    };
    loadSessionData();
  }, [sessionId]);

  // Welcome message if session is empty and profile exists
  useEffect(() => {
    const checkWelcome = async () => {
        if (currentSession && messages.length === 0 && userProfile) {
            const welcomeText = `Merhaba ${userProfile.name}. Ben DTÖ Danışmanın. Seninle ${userProfile.maritalStatus !== 'Belirtilmemiş' ? userProfile.maritalStatus.toLowerCase() : ''} hayatın, ${userProfile.job} kariyerin veya genel tasarımların hakkında konuşabiliriz. Bugün zihnini meşgul eden konu nedir?`;
            
            const welcomeMsg: ChatMessage = {
                id: 'welcome',
                role: 'model',
                text: welcomeText,
                timestamp: new Date()
            };
            
            const updatedMessages = [welcomeMsg];
            setMessages(updatedMessages);
            
            // Update session
            const updatedSession = {
                ...currentSession,
                messages: updatedMessages,
                lastUpdated: new Date()
            };
            setCurrentSession(updatedSession);
            await saveSession(updatedSession); // Async save
            // Don't trigger session update here to avoid loop, just save silently
        }
    };
    checkWelcome();
  }, [userProfile, currentSession, messages.length]); 

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Tarayıcınız sesli yazdırmayı desteklemiyor.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? prev + ' ' + transcript : transcript));
    };
    recognition.onerror = (e: any) => { console.error(e); setIsListening(false); };
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleDownloadChat = () => {
    const chatData = JSON.stringify({
      title: currentSession?.title,
      user: userProfile,
      date: new Date().toLocaleDateString(),
      messages: messages
    }, null, 2);
    
    const blob = new Blob([chatData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dto-sohbet-${currentSession?.title || 'yedek'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSend = async () => {
    if (!input.trim() || !currentSession) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    let newTitle = currentSession.title;
    if (currentSession.title === 'Yeni Sohbet' && messages.length <= 1) {
      newTitle = userMsg.text.length > 30 ? userMsg.text.substring(0, 30) + '...' : userMsg.text;
    }

    // Save user message immediately state
    const intermediateSession = {
      ...currentSession,
      title: newTitle,
      messages: newMessages,
      lastUpdated: new Date()
    };
    
    // We need the real ID from DB if it was temp
    const savedId = await saveSession(intermediateSession);
    
    // Update local session with real ID
    if(savedId) intermediateSession.id = savedId;
    setCurrentSession(intermediateSession);
    onSessionUpdate(); 

    try {
      const history = newMessages.map(m => ({ role: m.role, text: m.text }));
      const responseText = await generateDTOResponse(userMsg.text, history, userProfile);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      
      const finalMessages = [...newMessages, botMsg];
      setMessages(finalMessages);

      const finalSession = {
        ...intermediateSession,
        messages: finalMessages,
        lastUpdated: new Date()
      };
      await saveSession(finalSession);
      setCurrentSession(finalSession);
      onSessionUpdate(); 

    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!userProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
        <User size={64} className="text-dto-300" />
        <h3 className="text-xl font-bold text-dto-700">Profil Bulunamadı</h3>
        <p className="text-dto-500 max-w-md">
          Sana doğru danışmanlık verebilmem için önce profilini oluşturmalısın.
        </p>
        <button 
          onClick={onEditProfile}
          className="bg-gold-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-gold-600 transition-colors"
        >
          Profil Oluştur
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="p-4 border-b border-dto-200 bg-white shadow-sm flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-10 h-10 rounded-full bg-dto-800 flex items-center justify-center text-gold-400 shadow-md flex-shrink-0">
            <Sparkles size={20} />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-dto-800 text-sm md:text-base truncate">DTÖ Danışmanı</h2>
            <p className="text-xs text-dto-500 font-medium truncate">
              {currentSession?.title || userProfile.name}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
           <button 
            onClick={handleDownloadChat} 
            className="p-2 text-dto-400 hover:text-dto-700 hover:bg-dto-100 rounded-lg transition-colors"
            title="Sohbeti İndir (Yedekle)"
          >
            <Download size={18} />
          </button>
           <button 
            onClick={onEditProfile} 
            className="p-2 text-dto-400 hover:text-dto-700 hover:bg-dto-100 rounded-lg transition-colors"
            title="Profili Düzenle"
          >
            <Edit size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-dto-50">
        <div className="max-w-3xl mx-auto space-y-6 pb-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                msg.role === 'user' ? 'bg-gold-500 text-white' : 'bg-dto-700 text-white'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-gold-500 text-white rounded-tr-none' 
                  : 'bg-white text-dto-800 border border-dto-200 rounded-tl-none'
              }`}>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
                <p className={`text-[10px] mt-2 opacity-70 ${msg.role === 'user' ? 'text-gold-100' : 'text-dto-400'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex items-center space-x-3">
               <div className="w-8 h-8 rounded-full bg-dto-700 flex items-center justify-center text-white shadow-sm">
                 <Bot size={16} />
               </div>
               <div className="bg-white border border-dto-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
                 <div className="flex space-x-1">
                   <div className="w-2 h-2 bg-dto-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                   <div className="w-2 h-2 bg-dto-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                   <div className="w-2 h-2 bg-dto-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                 </div>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-3 md:p-4 bg-white border-t border-dto-200 shrink-0 safe-area-bottom">
        {isListening && (
           <div className="flex items-center justify-center p-2 mb-2 text-sm text-red-500 animate-pulse bg-red-50 rounded-lg">
             <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
             Dinleniyor... Konuşabilirsiniz.
           </div>
        )}

        <div className="max-w-3xl mx-auto flex items-end space-x-2 bg-dto-50 p-2 rounded-xl border border-dto-200 focus-within:border-gold-400 focus-within:ring-1 focus-within:ring-gold-400 transition-all shadow-inner">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={isListening ? "Dinliyorum..." : "Mesajını yaz..."}
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] p-2 text-dto-800 placeholder-dto-400 text-sm md:text-base"
            rows={1}
          />
          
          <button
            onClick={toggleListening}
            className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'text-dto-500 hover:bg-dto-200'
            }`}
            title="Sesli Yazma"
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
              input.trim() && !isTyping
                ? 'bg-dto-800 text-white hover:bg-dto-700 shadow-md'
                : 'bg-dto-200 text-dto-400 cursor-not-allowed'
            }`}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatMentor;