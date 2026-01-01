import React, { useEffect, useState } from 'react';
import { ViewState } from '../types';
import { MessageSquare, UserCircle, Sparkles, ArrowRight } from 'lucide-react';
import { getProfile } from '../services/storageService';

interface HomeProps {
  onNavigate: (view: ViewState) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    // Profil ismini çek
    const fetchProfile = async () => {
        const profile = await getProfile();
        if (profile && profile.name) {
            setUserName(profile.name);
        }
    };
    fetchProfile();
  }, []);

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-y-auto">
      {/* Top Section - Welcome Area */}
      <div className="bg-dto-800 text-white rounded-b-[2.5rem] shadow-xl relative shrink-0 overflow-hidden min-h-[280px] flex flex-col justify-center">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500 rounded-full mix-blend-overlay opacity-10 -mr-16 -mt-16 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500 rounded-full mix-blend-overlay opacity-10 -ml-12 -mb-12 blur-3xl"></div>

        <div className="p-8 relative z-10 max-w-4xl mx-auto w-full">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-dto-200 text-sm font-medium uppercase tracking-wider mb-2">Deneysel Tasarım Öğretisi</p>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Merhaba, <br />
                <span className="text-gold-400">{userName || 'Dostum'}</span>
              </h1>
            </div>
            <div 
              onClick={() => onNavigate(ViewState.PROFILE)}
              className="bg-white/10 backdrop-blur-md p-3 rounded-full border border-white/20 hover:bg-white/20 transition cursor-pointer"
            >
              <UserCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 flex items-center space-x-4 max-w-lg">
            <div className="bg-gold-500 p-3 rounded-full text-white shadow-lg shrink-0">
              <Sparkles size={24} />
            </div>
            <div>
              <p className="text-xs text-dto-200 mb-1">Günün Prensibi</p>
              <p className="text-lg font-medium italic leading-snug">"Olaylar değil, olaylara verdiğimiz tepkiler kaderimizi belirler."</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Action Area */}
      <div className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full flex flex-col items-center gap-6">
        
        {/* Chat Mentor Card (Large) */}
        <button 
            onClick={() => onNavigate(ViewState.MENTOR)}
            className="w-full bg-white p-8 rounded-3xl shadow-lg border border-dto-100 transition-all group text-left relative overflow-hidden hover:shadow-xl hover:border-gold-300"
        >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <MessageSquare size={150} className="text-gold-500 transform rotate-12" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6">
                <div className="w-20 h-20 bg-gold-100 text-gold-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                    <MessageSquare size={40} />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-dto-800 mb-2">Danışmanla Konuş</h3>
                    <p className="text-dto-500 text-base mb-6 leading-relaxed">
                        İlişkiler, iş hayatı veya kişisel döngülerin hakkında DTÖ perspektifiyle analiz yap.
                    </p>
                    <div className="inline-flex items-center text-white bg-dto-800 px-6 py-3 rounded-xl font-semibold shadow-md group-hover:bg-gold-500 transition-colors">
                        Sohbete Başla <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>
            </div>
        </button>
      </div>
    </div>
  );
};

export default Home;