import React, { useEffect, useState } from 'react';
import { ViewState, ChatSession } from '../types';
import { MessageSquare, LayoutGrid, UserCircle, Plus, History, Trash2, LogOut, Shield } from 'lucide-react';
import { getSessions, deleteSession, createNewSession } from '../services/storageService';

interface SidebarProps {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
  onSessionSelect: (sessionId: string) => void;
  activeSessionId: string | null;
  refreshTrigger: number;
  isAdmin: boolean;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, onSessionSelect, activeSessionId, refreshTrigger, isAdmin, onLogout }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  useEffect(() => {
    loadSessions();
  }, [refreshTrigger, currentView]);

  const loadSessions = async () => {
    const data = await getSessions();
    setSessions(data);
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (window.confirm('Bu sohbeti silmek istediğine emin misin?')) {
      await deleteSession(sessionId);
      loadSessions();
      if (activeSessionId === sessionId) {
        onViewChange(ViewState.HOME);
      }
    }
  };

  const handleNewChat = () => {
    const newSession = createNewSession();
    onSessionSelect(newSession.id);
  };

  const menuItems = [
    { id: ViewState.HOME, label: 'Ana Sayfa', icon: <LayoutGrid size={20} /> },
    { id: ViewState.MENTOR, label: 'Danışman', icon: <MessageSquare size={20} /> },
    { id: ViewState.PROFILE, label: 'Profilim', icon: <UserCircle size={20} /> },
  ];

  if (isAdmin) {
      menuItems.push({ id: ViewState.ADMIN, label: 'Admin Paneli', icon: <Shield size={20} /> });
  }

  return (
    <div className="w-72 bg-white border-r border-dto-200 flex flex-col h-full shadow-lg z-10 hidden md:flex shrink-0">
      <div className="p-6 border-b border-dto-100">
        <h1 className="text-2xl font-bold text-dto-800 tracking-tight">DTÖ <span className="text-gold-500">Rehberi</span></h1>
        <p className="text-xs text-dto-400 mt-1">Deneysel Tasarım Öğretisi</p>
      </div>

      <nav className="p-4 space-y-2">
         <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-gold-500 text-white hover:bg-gold-600 transition-all shadow-md mb-4 font-medium"
          >
            <Plus size={20} />
            <span>Yeni Sohbet</span>
          </button>

        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              currentView === item.id
                ? 'bg-dto-800 text-white shadow-md'
                : 'text-dto-600 hover:bg-dto-50 hover:text-dto-900'
            }`}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="flex items-center space-x-2 text-dto-400 mb-3 px-2">
          <History size={14} />
          <span className="text-xs font-bold uppercase tracking-wider">Geçmiş Sohbetler</span>
        </div>
        
        <div className="space-y-1">
          {sessions.length === 0 ? (
            <p className="text-xs text-dto-400 px-2 italic">Henüz kaydedilmiş sohbet yok.</p>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => onSessionSelect(session.id)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-all ${
                  activeSessionId === session.id && currentView === ViewState.MENTOR
                    ? 'bg-dto-100 text-dto-900 font-medium'
                    : 'text-dto-500 hover:bg-dto-50 hover:text-dto-700'
                }`}
              >
                <div className="flex items-center space-x-2 overflow-hidden">
                  <MessageSquare size={16} className={activeSessionId === session.id ? 'text-gold-500' : 'text-dto-300'} />
                  <span className="truncate max-w-[140px]">{session.title}</span>
                </div>
                <button 
                  onClick={(e) => handleDeleteSession(e, session.id)}
                  className="opacity-0 group-hover:opacity-100 text-dto-400 hover:text-red-500 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="p-4 border-t border-dto-100">
         <button 
            onClick={onLogout}
            className="w-full flex items-center space-x-2 px-4 py-2 text-dto-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm"
         >
            <LogOut size={16} />
            <span>Çıkış Yap</span>
         </button>
      </div>
    </div>
  );
};

export default Sidebar;