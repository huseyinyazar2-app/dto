import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Home from './components/Home';
import ChatMentor from './components/ChatMentor';
import ProfileForm from './components/ProfileForm';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import CourseView from './components/CourseView';
import LawExplorer from './components/LawExplorer';
import { ViewState } from './types';
import { Menu, X, Plus } from 'lucide-react';
import { createNewSession, getCurrentUser, logoutUser } from './services/storageService';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [userRole, setUserRole] = useState<'user' | 'admin'>('user');

  useEffect(() => {
    checkSession();
  }, []);
  
  const checkSession = () => {
    const user = getCurrentUser();
    if (user) {
        setIsAuthenticated(true);
        setUserRole(user.role);
    } else {
        setIsAuthenticated(false);
    }
    setLoading(false);
  };

  const handleLoginSuccess = () => {
    checkSession();
  };
  
  const handleLogout = () => {
      logoutUser();
      setIsAuthenticated(false);
      setCurrentView(ViewState.HOME);
  };

  // If not logged in, show Login screen
  if (loading) return <div className="h-screen flex items-center justify-center bg-dto-800 text-gold-500">Yükleniyor...</div>;
  if (!isAuthenticated) return <Login onLoginSuccess={handleLoginSuccess} />;

  const handleProfileSave = () => {
    handleNewChat();
  };

  const handleSessionSelect = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setCurrentView(ViewState.MENTOR);
    setMobileMenuOpen(false);
  };

  const handleNewChat = () => {
    const newSession = createNewSession();
    setActiveSessionId(newSession.id);
    setCurrentView(ViewState.MENTOR);
    setMobileMenuOpen(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleNavigate = (view: ViewState) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  const renderView = () => {
    switch (currentView) {
      case ViewState.HOME:
        return <Home onNavigate={handleNavigate} />;
      case ViewState.MENTOR:
        return (
          <ChatMentor 
            sessionId={activeSessionId} 
            onEditProfile={() => setCurrentView(ViewState.PROFILE)} 
            onSessionUpdate={() => setRefreshTrigger(prev => prev + 1)}
          />
        );
      case ViewState.PROFILE:
        return <ProfileForm onSave={handleProfileSave} />;
      case ViewState.ADMIN:
        return <AdminPanel />;
      case ViewState.COURSES:
        return <CourseView />;
      case ViewState.LAWS:
        return <LawExplorer />;
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-dto-50 overflow-hidden font-sans">
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        onSessionSelect={handleSessionSelect}
        activeSessionId={activeSessionId}
        refreshTrigger={refreshTrigger}
        isAdmin={userRole === 'admin'}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="md:hidden bg-white border-b border-dto-200 p-4 flex items-center justify-between shadow-sm z-20 shrink-0">
          <h1 className="font-bold text-dto-800">DTÖ Rehberi</h1>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-dto-600">
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="absolute top-[60px] left-0 w-full h-[calc(100%-60px)] bg-white z-30 flex flex-col p-4 space-y-2 md:hidden animate-fade-in-down shadow-2xl overflow-y-auto">
             <button onClick={handleNewChat} className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-gold-500 text-white font-medium mb-4">
               <Plus size={20} /> <span>Yeni Sohbet</span>
             </button>
             <button onClick={() => handleNavigate(ViewState.HOME)} className={`p-4 rounded-lg text-left font-medium ${currentView === ViewState.HOME ? 'bg-dto-100 text-dto-900' : 'text-dto-600'}`}>Ana Sayfa</button>
             <button onClick={() => handleNavigate(ViewState.MENTOR)} className={`p-4 rounded-lg text-left font-medium ${currentView === ViewState.MENTOR ? 'bg-dto-100 text-dto-900' : 'text-dto-600'}`}>Danışman</button>
             <button onClick={() => handleNavigate(ViewState.COURSES)} className={`p-4 rounded-lg text-left font-medium ${currentView === ViewState.COURSES ? 'bg-dto-100 text-dto-900' : 'text-dto-600'}`}>Kurslar</button>
             <button onClick={() => handleNavigate(ViewState.LAWS)} className={`p-4 rounded-lg text-left font-medium ${currentView === ViewState.LAWS ? 'bg-dto-100 text-dto-900' : 'text-dto-600'}`}>Yasalar</button>
             <button onClick={() => handleNavigate(ViewState.PROFILE)} className={`p-4 rounded-lg text-left font-medium ${currentView === ViewState.PROFILE ? 'bg-dto-100 text-dto-900' : 'text-dto-600'}`}>Profilim</button>
             {userRole === 'admin' && (
                 <button onClick={() => handleNavigate(ViewState.ADMIN)} className={`p-4 rounded-lg text-left font-medium ${currentView === ViewState.ADMIN ? 'bg-dto-100 text-dto-900' : 'text-dto-600'}`}>Admin Paneli</button>
             )}
             <button onClick={handleLogout} className="p-4 rounded-lg text-left font-medium text-red-500">Çıkış Yap</button>
          </div>
        )}

        <div className="flex-1 overflow-hidden relative h-full">
          {renderView()}
        </div>
      </div>
    </div>
  );
};

export default App;