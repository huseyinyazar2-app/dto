import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { UserProfile } from "../types";

// Kullanıcının sağladığı anahtar.
const USER_PROVIDED_KEY = "AIzaSyD2cVT4OSKrU6-NZsmNy0JJLWfFsZtrk-k";

const getApiKey = () => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY && process.env.API_KEY.startsWith("AI")) {
      return process.env.API_KEY.trim();
    }
  } catch (e) { }
  return USER_PROVIDED_KEY.trim();
};

// En kararlı modeller
const PRIMARY_MODEL = 'gemini-3-flash-preview';
const FALLBACK_MODEL = 'gemini-2.0-flash-exp'; 
const SAFETY_MODEL = 'gemini-flash-latest';

// Basit bağlantı testi fonksiyonu (Debug için)
export const testAPIConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const apiKey = getApiKey();
    console.log("Testing with Key ending in:", apiKey.slice(-4)); // Güvenlik için sadece son 4 haneyi logla
    
    const ai = new GoogleGenAI({ apiKey: apiKey });
    // En kararlı model ile test et
    const response = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents: { role: 'user', parts: [{ text: 'Merhaba, bu bir bağlantı testidir.' }] }
    });
    return { success: true, message: response.text || "Cevap alındı." };
  } catch (error: any) {
    console.error("API Test Error Full Object:", error);
    
    // Hatanın detayını yakalamaya çalış
    let detailedMsg = error.message;
    if (error.response) {
       detailedMsg += ` | Status: ${error.response.status}`;
       if (error.response.data) {
         detailedMsg += ` | Data: ${JSON.stringify(error.response.data)}`;
       }
    }
    
    return { success: false, message: detailedMsg };
  }
};

const createSystemInstruction = (profile: UserProfile | null, isInformational: boolean) => {
  if (isInformational) {
    return `
    Sen Deneysel Tasarım Öğretisi (DTÖ) konusunda uzman bir eğitmen ve bilgi kaynağısın.
    Amacın kullanıcının sorduğu yasa, kurs içeriği veya kavramı DTÖ terminolojisine sadık kalarak, net, öğretici ve akademik bir dille açıklamaktır.
    Bu bir danışmanlık seansı değil, bilgi aktarımıdır. Kişisel analiz yerine genel prensipleri ve tanımları anlat.
    Konuyu somut örneklerle destekle.
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
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  const contents = [
    ...history.map(h => ({
      role: h.role === 'model' ? 'model' : 'user',
      parts: [{ text: h.text }]
    })),
    { role: 'user', parts: [{ text: prompt }] }
  ];

  const systemInstruction = createSystemInstruction(userProfile, isInformational);

  const tryGenerate = async (modelName: string) => {
    return await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.6, 
      }
    });
  };

  try {
    const response = await tryGenerate(PRIMARY_MODEL);
    return response.text || "Bir sorun oluştu.";
  } catch (error: any) {
    console.warn(`Primary model (${PRIMARY_MODEL}) failed. Error: ${error.message}. Trying Fallback...`);

    try {
      const fallbackResponse = await tryGenerate(FALLBACK_MODEL);
      return fallbackResponse.text || "Fallback model yanıt veremedi.";
    } catch (fallbackError: any) {
      console.warn(`Fallback model (${FALLBACK_MODEL}) failed. Error: ${fallbackError.message}. Trying Safety Net...`);
      
      try {
        const safetyResponse = await tryGenerate(SAFETY_MODEL);
        return safetyResponse.text || "Safety model yanıt veremedi.";
      } catch (safetyError: any) {
        console.error("All models failed.", safetyError);
        
        let errorMessage = "Bağlantı kurulamadı.";
        const errStr = safetyError.message || fallbackError.message || error.message || "Bilinmeyen Hata";
        
        if (errStr.includes('403')) {
          errorMessage = `YETKİ HATASI (403): Anahtar kısıtlamalarını kontrol edin.`;
        } else if (errStr.includes('429')) {
          errorMessage = "KOTA AŞILDI (429): Lütfen bekleyin.";
        } else if (errStr.includes('503')) {
           errorMessage = "SERVİS YOK (503): Google sunucuları meşgul.";
        } else {
            errorMessage = `API HATASI: ${errStr}`;
        }

        return errorMessage;
      }
    }
  }
};