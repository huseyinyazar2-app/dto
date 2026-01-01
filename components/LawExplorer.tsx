import React, { useState } from 'react';
import { generateDTOResponse } from '../services/geminiService';
import { Scale, ChevronRight, Loader2, Sparkles } from 'lucide-react';

const commonLaws = [
  "Etki-Tepki Yasası",
  "Dengelenme Yasası",
  "Hakediş Yasası",
  "Benzerlik Yasası",
  "Zıtlıklar Yasası",
  "Değişim Yasası"
];

const LawExplorer: React.FC = () => {
  const [selectedLaw, setSelectedLaw] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleLawClick = async (law: string) => {
    setSelectedLaw(law);
    setLoading(true);
    setExplanation('');
    
    try {
      const prompt = `Deneysel Tasarım Öğretisi bağlamında "${law}" nedir? Bu yasa hayatımızı nasıl etkiler? İnsan ilişkilerinde ve başarıda nasıl çalışır? Somut bir örnek ver.`;
      const response = await generateDTOResponse(prompt);
      setExplanation(response);
    } catch (error) {
      setExplanation('Yasa açıklaması alınırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-8 overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-dto-800 flex items-center gap-3">
          <Scale className="text-gold-500" />
          Evrensel Yasalar
        </h2>
        <p className="mt-2 text-dto-500 max-w-2xl">
          Hayatın gizli matematiğini anlamak için yasaları bilmek gerekir. DTÖ'nün temel taşlarından olan yasaları keşfedin.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Laws List */}
        <div className="lg:col-span-1 space-y-3">
          {commonLaws.map((law) => (
            <button
              key={law}
              onClick={() => handleLawClick(law)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                selectedLaw === law
                  ? 'bg-dto-800 text-white border-dto-800 shadow-lg transform scale-102'
                  : 'bg-white text-dto-600 border-dto-200 hover:border-gold-400 hover:bg-gold-50'
              }`}
            >
              <span className="font-semibold">{law}</span>
              <ChevronRight className={`w-5 h-5 ${selectedLaw === law ? 'text-gold-400' : 'text-dto-300'}`} />
            </button>
          ))}
          
          <div className="mt-6 p-4 bg-dto-100 rounded-xl border border-dto-200">
            <h4 className="text-sm font-bold text-dto-700 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold-600" />
              Bilgi Notu
            </h4>
            <p className="text-xs text-dto-500 leading-relaxed">
              Yasalar kişiye göre değişmez, herkes için aynı çalışır. Farkındalık, yasaları kendi lehimize kullanmamızı sağlar.
            </p>
          </div>
        </div>

        {/* Explanation Area */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-dto-200 shadow-sm min-h-[400px] flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold-400 to-dto-500"></div>
            
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-12 h-12 text-gold-500 animate-spin" />
                <p className="text-dto-400 font-medium">Yasa analiz ediliyor...</p>
              </div>
            ) : selectedLaw && explanation ? (
              <div className="p-8 overflow-y-auto">
                <h3 className="text-2xl font-bold text-dto-800 mb-6 pb-4 border-b border-dto-100">
                  {selectedLaw}
                </h3>
                <div className="prose prose-lg prose-slate text-dto-600">
                   {explanation.split('\n').map((para, i) => (
                     <p key={i} className="mb-4">{para}</p>
                   ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-dto-300 p-8 text-center">
                <Scale className="w-24 h-24 mb-6 opacity-20" />
                <h4 className="text-xl font-medium text-dto-400">Bir Yasa Seçin</h4>
                <p className="max-w-sm mt-2">Sol taraftaki listeden detaylarını öğrenmek istediğiniz bir yasayı seçin.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LawExplorer;