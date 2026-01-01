import { GoogleGenAI } from "@google/genai";
import { UserProfile } from "../types";

const LOCAL_STORAGE_KEY_API = 'dto_user_api_key';

// Anahtarı LocalStorage'dan okuyan veya kaydeden yardımcılar
export const setUserApiKey = (key: string) => {
  localStorage.setItem(LOCAL_STORAGE_KEY_API, key.trim());
};

export const getUserApiKey = () => {
  return localStorage.getItem(LOCAL_STORAGE_KEY_API) || "";
};

// KULLANICI İSTEĞİ: Ana Model Gemini 3
const PRIMARY_MODEL = 'gemini-3-flash-preview';
const FALLBACK_MODEL = 'gemini-2.0-flash-exp'; 
const SAFETY_MODEL = 'gemini-1.5-flash';

// Basit bağlantı testi fonksiyonu
export const testAPIConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const apiKey = getUserApiKey();
    
    if (!apiKey) {
        return { success: false, message: "Kayıtlı API Anahtarı yok. Lütfen menüden 'API Anahtarı Ayarla' butonunu kullanın." };
    }

    console.log("Testing with Key ending in:", apiKey.slice(-4)); 
    
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    // Gemini 3 ile test et
    const response = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents: { role: 'user', parts: [{ text: 'Merhaba, sadece versiyon testi yapıyorum. Kısa cevap ver.' }] }
    });
    
    return { 
        success: true, 
        message: `BAŞARILI!\n\nKullanılan Model: ${PRIMARY_MODEL}\nCevap: ${response.text}` 
    };
  } catch (error: any) {
    console.error("API Test Error:", error);
    
    let detailedMsg = error.message;
    if (error.message.includes("API key not valid")) detailedMsg = "API Anahtarı GEÇERSİZ. Lütfen Google AI Studio'dan yeni bir anahtar alıp girin.";
    if (error.message.includes("quota")) detailedMsg = "KOTA AŞIMI. Hesabınızın kotası dolmuş veya faturalandırma ayarlanmamış.";
    
    return { success: false, message: `Ana Model (${PRIMARY_MODEL}) Hatası: ` + detailedMsg };
  }
};

const createSystemInstruction = (profile: UserProfile | null) => {
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
  userProfile: UserProfile | null = null
): Promise<string> => {
  const apiKey = getUserApiKey();
  
  if (!apiKey) {
      return "⚠️ HATA: Sistemde kayıtlı API Anahtarı bulunamadı. Lütfen sol menüden 'API Anahtarı Ayarla' butonuna basarak geçerli bir Google Gemini API anahtarı giriniz.";
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  const contents = [
    ...history.map(h => ({
      role: h.role === 'model' ? 'model' : 'user',
      parts: [{ text: h.text }]
    })),
    { role: 'user', parts: [{ text: prompt }] }
  ];

  const systemInstruction = createSystemInstruction(userProfile);

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
    const primaryErrorMsg = error.message || "Bilinmeyen Hata";
    console.warn(`Primary model (${PRIMARY_MODEL}) failed. Error: ${primaryErrorMsg}. Trying Fallback...`);

    // Eğer hata API Key kaynaklıysa (403, Invalid Key) yedeklere gitmenin anlamı yok, direkt hatayı dön.
    if (primaryErrorMsg.includes("API key") || primaryErrorMsg.includes("403")) {
       return `⚠️ API ANAHTARI HATASI: ${primaryErrorMsg}\n\nLütfen menüden yeni bir anahtar giriniz.`;
    }

    try {
      const fallbackResponse = await tryGenerate(FALLBACK_MODEL);
      return `${fallbackResponse.text}\n\n---\n*⚠️ Model: ${fallbackResponse.usedModel} (Fallback)*\n*🔴 Gemini 3 Hatası: ${primaryErrorMsg}*`;
    } catch (fallbackError: any) {
      console.warn(`Fallback model (${FALLBACK_MODEL}) failed. Error: ${fallbackError.message}. Trying Safety Net...`);
      
      try {
        const safetyResponse = await tryGenerate(SAFETY_MODEL);
        return `${safetyResponse.text}\n\n---\n*🛡️ Model: ${safetyResponse.usedModel} (Safety)*\n*🔴 Gemini 3 Hatası: ${primaryErrorMsg}*`;
      } catch (safetyError: any) {
        console.error("All models failed.", safetyError);
        return `⚠️ BAĞLANTI HATASI: Hiçbir model yanıt vermedi.\nAna Hata: ${primaryErrorMsg}\nYedek Hata: ${safetyError.message}`;
      }
    }
  }
};