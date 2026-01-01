import React, { useState } from 'react';
import { Course } from '../types';
import { generateDTOResponse } from '../services/geminiService';
import { Sparkles, Users, Shield, Target, ArrowRight, Loader2, BookOpen } from 'lucide-react';

const courses: Course[] = [
  {
    id: 'relations',
    title: 'İlişkilerde Ustalık',
    description: 'İnsan tasarımlarını tanıyarak çatışmasız, uyumlu ve derin bağlar kurma sanatı.',
    icon: 'users',
    promptContext: 'Bana Deneysel Tasarım Öğretisi kapsamında "İlişkilerde Ustalık" kursunu anlat. Bu kursun amacı nedir? Katılımcıya ne kazandırır? İletişim dilleri ve arketipler konusuna kısaca değinerek özetle.'
  },
  {
    id: 'success',
    title: 'Başarı ve Hedef',
    description: 'Potansiyelinizi gerçekleştirmek ve maddesel dünyada sonuç almak için gerekli stratejiler.',
    icon: 'target',
    promptContext: 'DTÖ perspektifiyle "Başarı" kursunu detaylandır. Başarı yasaları nelerdir? Başarısızlık korkusu, atalet ve hedef belirleme konularında bu öğreti ne söyler?'
  },
  {
    id: 'avoidance',
    title: 'Sakınma ve Korunma',
    description: 'Gereksiz enerji kayıplarından, yanlış kişilerden ve negatif döngülerden korunma yöntemleri.',
    icon: 'shield',
    promptContext: 'DTÖ\'de "Sakınma Sanatı" veya "Korunma" nedir? İnsan negatif olaylardan, yanlış kişilerden veya kendi tasarımına uymayan durumlardan nasıl sakınır? Bu eğitimin temel felsefesini açıkla.'
  }
];

const CourseView: React.FC = () => {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleCourseSelect = async (course: Course) => {
    setSelectedCourse(course);
    setLoading(true);
    setContent('');
    
    try {
      // isInformational = true parametresi ile gönderiyoruz
      const response = await generateDTOResponse(course.promptContext, [], null, true);
      setContent(response);
    } catch (error) {
      setContent('İçerik yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'users': return <Users className="w-8 h-8 text-blue-500" />;
      case 'target': return <Target className="w-8 h-8 text-green-500" />;
      case 'shield': return <Shield className="w-8 h-8 text-purple-500" />;
      default: return <Sparkles className="w-8 h-8 text-gold-500" />;
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden">
      {/* Course List */}
      <div className={`w-full md:w-1/3 bg-white border-r border-dto-200 overflow-y-auto ${selectedCourse ? 'hidden md:block' : 'block'}`}>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-dto-800">Kurs Programları</h2>
          <div className="space-y-4">
            {courses.map((course) => (
              <button
                key={course.id}
                onClick={() => handleCourseSelect(course)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-300 hover:shadow-md group ${
                  selectedCourse?.id === course.id
                    ? 'border-gold-400 bg-gold-50 ring-1 ring-gold-400'
                    : 'border-dto-200 bg-white hover:border-gold-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="p-3 rounded-lg bg-white shadow-sm border border-dto-100 group-hover:scale-105 transition-transform">
                    {getIcon(course.icon)}
                  </div>
                  <ArrowRight className={`w-5 h-5 text-dto-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity ${selectedCourse?.id === course.id ? 'opacity-100 text-gold-600' : ''}`} />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-dto-800">{course.title}</h3>
                <p className="mt-1 text-sm text-dto-500 line-clamp-2">{course.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className={`w-full md:w-2/3 bg-dto-50 h-full flex flex-col ${!selectedCourse ? 'hidden md:flex' : 'flex'}`}>
        {selectedCourse ? (
          <div className="flex flex-col h-full">
            <div className="bg-white border-b border-dto-200 p-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
              <div className="flex items-center space-x-3">
                 <button onClick={() => setSelectedCourse(null)} className="md:hidden p-2 -ml-2 text-dto-500 hover:bg-dto-50 rounded-full">
                    <ArrowRight className="w-5 h-5 rotate-180" />
                 </button>
                 <div>
                    <h2 className="text-xl font-bold text-dto-800">{selectedCourse.title}</h2>
                    <p className="text-xs text-gold-600 font-medium uppercase tracking-wider">DTÖ İçerik Özeti</p>
                 </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                  <Loader2 className="w-10 h-10 text-gold-500 animate-spin" />
                  <p className="text-dto-500 animate-pulse">Evrensel bilgi taranıyor...</p>
                </div>
              ) : (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-dto-100 prose prose-slate max-w-none">
                  {content.split('\n').map((paragraph, idx) => (
                    <p key={idx} className="mb-4 text-dto-700 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                  <div className="mt-8 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                    <p className="text-sm text-blue-800 italic">
                      Not: Bu içerik yapay zeka tarafından Deneysel Tasarım Öğretisi prensiplerine dayanarak oluşturulmuştur.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 text-dto-400">
            <BookOpen className="w-16 h-16 mb-4 opacity-50" />
            <h3 className="text-xl font-medium">Bir Kurs Seçin</h3>
            <p className="max-w-md mt-2">Detaylarını öğrenmek istediğiniz kursu soldaki menüden seçebilirsiniz.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseView;