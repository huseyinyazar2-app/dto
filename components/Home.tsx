import React, { useEffect, useState } from 'react';
import { ViewState } from '../types';
import { ArrowRight, MessageSquare, UserCircle, Sparkles, BookOpen, Scale } from 'lucide-react';
import { getProfile } from '../services/storageService';

interface HomeProps {
  onNavigate: (view: ViewState) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const fetchProfile = async () => {
        const profile = await getProfile();
        if (profile && profile.name) {
            setUserName(profile.name);
        }
    };
    fetchProfile();
  }, []);

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Top Section - Welcome Area */}
      <div className="bg-dto-800 text-white rounded-b-[2.5rem] shadow-xl relative shrink-0 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500 rounded-full mix-blend-overlay opacity-10 -mr-16 -mt-16 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500 rounded-full mix-blend-overlay opacity-10 -ml-12 -mb-12 blur-3xl"></div>

        <div className="p-8 pt-12 pb-12 relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-dto-200 text-sm font-medium uppercase tracking-wider mb-1">Deneysel Tasarım Öğretisi</p>
              <h1 className="text-3xl font-bold leading-tight">
                Merhaba, <br />
                <span className="text-gold-400">{userName || 'Dostum'}</span>
              </h1>
            </div>
            <div 
              onClick={() => onNavigate(ViewState.PROFILE)}
              className="bg-white/10 backdrop-blur-md p-2 rounded-full border border-white/20 hover:bg-white/20 transition cursor-pointer"
            >
              <UserCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 flex items-center space-x-3">
            <div className="bg-gold-500 p-2 rounded-full text-white shadow-lg">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-xs text-dto-200">Günün Sözü</p>
              <p className="text-sm font-medium italic">"Tasarımını bilen, kaderini yönetir."</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Action Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        
        {/* Primary Action Card - Mentor */}
        <button 
          onClick={() => onNavigate(ViewState.MENTOR)}
          className="w-full bg-white rounded-3xl p-6 shadow-md border border-gray-100 flex flex-col items-center text-center space-y-4 group active:scale-95 transition-transform duration-200 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-gold-400 to-gold-600"></div>
          <div className="w-16 h-16 bg-gold-50 rounded-full flex items-center justify-center text-gold-600 group-hover:bg-gold-100 transition-colors mb-2">
            <MessageSquare size={32} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-dto-800">Danışmanla Konuş</h2>
            <p className="text-sm text-dto-500 mt-1 px-4">
              DTÖ perspektifiyle sorunlarına çözüm bul.
            </p>
          </div>
        </button>

        {/* Secondary Cards Grid */}
        <div className="grid grid-cols-2 gap-4">
            <button 
            onClick={() => onNavigate(ViewState.COURSES)}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col items-center text-center gap-3 hover:shadow-md transition-all active:scale-95"
            >
                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
                    <BookOpen size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-dto-800 text-sm">Kurslar</h3>
                    <p className="text-xs text-dto-400 mt-1">İlişkiler, Başarı, Sakınma</p>
                </div>
            </button>

            <button 
            onClick={() => onNavigate(ViewState.LAWS)}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col items-center text-center gap-3 hover:shadow-md transition-all active:scale-95"
            >
                <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center">
                    <Scale size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-dto-800 text-sm">Yasalar</h3>
                    <p className="text-xs text-dto-400 mt-1">Evrensel kuralları keşfet</p>
                </div>
            </button>
        </div>

        {/* Info Text */}
        <div className="text-center pt-2">
           <p className="text-xs text-dto-400">
             Bilgi, deneyime dönüşmediği sürece yüktür.
           </p>
        </div>
      </div>
    </div>
  );
};

export default Home;