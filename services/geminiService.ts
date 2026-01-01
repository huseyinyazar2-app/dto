import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { UserProfile } from "../types";

const createSystemInstruction = (profile: UserProfile | null, isInformational: boolean = false) => {
  if (isInformational) {
    return `
    Sen Deneysel Tasarım Öğretisi (DTÖ) konusunda uzmanlaşmış akademik bir eğitmensin.
    Görevin: Kullanıcının sorduğu kavramları, yasaları veya kurs içeriklerini DTÖ literatürüne sadık kalarak, net ve öğretici bir dille açıklamak.
    - Kişisel analiz veya danışmanlık yapma, sadece bilgi ver.
    - Soyut kavramları somut örneklerle destekle.
    - Üslubun bilge, sakin ve didaktik olsun.
    `;
  }

  let userContext = "";
  if (profile) {
    userContext = `
    DANIŞAN PROFİLİ:
    - İsim: ${profile.name}
    - Yaş: ${profile.age}
    - Cinsiyet: ${profile.gender}
    - Medeni Hal: ${profile.maritalStatus}
    - Meslek: ${profile.job}
    - Ek Notlar: ${profile.notes}
    
    Analizlerini bu profil verilerine dayandır.
    `;
  }

  return `
  Sen Yahya Hamurcu'nun "Deneysel Tasarım Öğretisi" (DTÖ) metodolojisini uygulayan profesyonel, analitik ve bilge bir **DTÖ Danışmanısın**.
  Karşındaki kişi senin "Danışanın"dır. Amacın sadece bilgi vermek değil, kişinin sorununu kökten çözmesine yardımcı olmaktır.

  ${userContext}

  DANIŞMANLIK YÖNTEMİN VE KURALLARIN:
  1. **Hemen Çözüm Üretme:** Danışan bir olay anlattığında, olayın tüm boyutlarını (niyet, geçmiş desenler, tetikleyiciler) anlamadan asla kesin yargıya varma.
  2. **Soru Sor:** Eğer danışanın anlattığı hikayede eksik parçalar varsa, durumu tam analiz etmek için 2-3 adet netleştirici soru sor. (Örn: "Bu durum ilk kez mi yaşanıyor?", "O anki duygun neydi?", "Sence karşı tarafın tasarımında ne var?").
  3. **DTÖ Yasalarını Kullan:** Durumu netleştirdikten sonra analizi şu yasalar çerçevesinde yap: Etki-Tepki, Dengelenme, Hakediş, Benzerlik, Zıtlıklar.
  4. **Üslup:** Profesyonel, sakin, yargılamayan ama gerçeği net söyleyen bir üslup kullan. "Dostum" kelimesini samimiyet için kullanabilirsin.
  5. **Kayıt Tutma:** Danışanın verdiği yeni ve kritik bilgileri (örneğin "babamla küsüm" dedi) aklında tut ve sonraki analizlerde kullan.
  `;
};

export const generateDTOResponse = async (
  prompt: string, 
  history: { role: string; text: string }[] = [],
  userProfile: UserProfile | null = null,
  isInformational: boolean = false
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const contents = [
      ...history.map(h => ({
        role: h.role === 'model' ? 'model' : 'user',
        parts: [{ text: h.text }]
      })),
      { role: 'user', parts: [{ text: prompt }] }
    ];

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction: createSystemInstruction(userProfile, isInformational),
        temperature: 0.6, 
      }
    });

    return response.text || "Üzgünüm, şu an bağlantıda bir sorun var. Lütfen tekrar eder misin?";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Bir hata oluştu. Lütfen bağlantını kontrol et.";
  }
};