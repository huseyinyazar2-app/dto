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

// KULLANICI İSTEĞİ: Ana Model Gemini 3
// Eğer Gemini 3 hata verirse, sebebini artık çıktıda görebileceğiz.
const PRIMARY_MODEL = 'gemini-3-flash-preview';
const FALLBACK_MODEL = 'gemini-2.0-flash-exp'; 
const SAFETY_MODEL = 'gemini-1.5-flash';

// Basit bağlantı testi fonksiyonu (Debug için)
export const testAPIConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const apiKey = getApiKey();
    console.log("Testing with Key ending in:", apiKey.slice(-4)); 
    
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    // Gemini 3 ile test et
    const response = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents: { role: 'user', parts: [{ text: 'Merhaba, model versiyonun nedir?' }] }
    });
    
    // Modelin verdiği cevabı ve bizim kullandığımız model ismini dön
    return { 
        success: true, 
        message: `Cevap Alındı.\n\nKullanılan Model: ${PRIMARY_MODEL}\nAPI Cevabı: ${response.text}` 
    };
  } catch (error: any) {
    console.error("API Test Error Full Object:", error);
    
    let detailedMsg = error.message;
    if (error.response) {
       detailedMsg += ` | Status: ${error.response.status}`;
       if (error.response.data) {
         detailedMsg += ` | Data: ${JSON.stringify(error.response.data)}`;
       }
    }
    
    return { success: false, message: `Ana Model (${PRIMARY_MODEL}) Hatası: ` + detailedMsg };
  }
};

const createSystemInstruction = (profile: UserProfile | null, isInformational: boolean) => {
  if (isInformational) {
    return `
    Sen Deneysel Tasarım Öğretisi (DTÖ) konusunda uzman bir eğitmen ve bilgi kaynağısın.
    Amacın kullanıcının sorduğu yasa, kurs içeriği veya kavramı DTÖ terminolojisine sadık kalarak, net, öğretici ve akademik bir dille açıklamaktır.
    
    KURALLAR:
    1. Konuyu derinlemesine analiz et. Yüzeysel cevap verme.
    2. DTÖ terminolojisini (İllüzyon, Realite, Tekamül, Tasarım vb.) aktif kullan.
    3. Somut örnekler ver.
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
  1. **Derinlik:** Asla yüzeysel, "geçer geçer" tarzı tavsiyeler verme. Olayın arkasındaki matematiksel yasayı (Etki-Tepki, Hakediş, Dengelenme) bul ve açıkla.
  2. **Analiz:** Danışanın anlattığı hikayede eksik parçalar varsa, durumu tam analiz etmek için 2-3 adet netleştirici soru sor.
  3. **Üslup:** Profesyonel, sakin, yargılamayan ama gerçeği net söyleyen bir üslup kullan. "Dostum" kelimesini samimiyet için kullanabilirsin.
  4. **Hedef:** Danışanın kendi tasarımını fark etmesini sağla.
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

  // Helper to handle generation and return used model name
  const tryGenerate = async (modelName: string) => {
    const result = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7, 
      }
    });
    return { text: result.text || "", usedModel: modelName };
  };

  try {
    const response = await tryGenerate(PRIMARY_MODEL);
    return `${response.text}\n\n---\n*⚡ Model: ${response.usedModel}*`;
  } catch (error: any) {
    // Ana model hatasını yakala ve değişkene ata
    const primaryErrorMsg = error.message || "Bilinmeyen Hata";
    console.warn(`Primary model (${PRIMARY_MODEL}) failed. Error: ${primaryErrorMsg}. Trying Fallback...`);

    try {
      const fallbackResponse = await tryGenerate(FALLBACK_MODEL);
      // Fallback cevabına ana modelin neden hata verdiğini ekle
      return `${fallbackResponse.text}\n\n---\n*⚠️ Model: ${fallbackResponse.usedModel} (Fallback)*\n*🔴 Gemini 3 Hatası: ${primaryErrorMsg}*`;
    } catch (fallbackError: any) {
      console.warn(`Fallback model (${FALLBACK_MODEL}) failed. Error: ${fallbackError.message}. Trying Safety Net...`);
      
      try {
        const safetyResponse = await tryGenerate(SAFETY_MODEL);
        return `${safetyResponse.text}\n\n---\n*🛡️ Model: ${safetyResponse.usedModel} (Safety)*\n*🔴 Gemini 3 Hatası: ${primaryErrorMsg}*`;
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