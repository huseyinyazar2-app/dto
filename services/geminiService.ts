import { GoogleGenAI } from "@google/genai";
import { UserProfile } from "../types";
import { getSystemConfig } from "./storageService";

// LocalStorage sadece admin override için kullanılabilir, normalde DB'den gelecek.
const LOCAL_STORAGE_KEY_API = 'dto_user_api_key';

export const setUserApiKey = (key: string) => {
  localStorage.setItem(LOCAL_STORAGE_KEY_API, key.trim());
};

// Fix: Added getUserApiKey to be used in App.tsx
export const getUserApiKey = (): string => {
  return localStorage.getItem(LOCAL_STORAGE_KEY_API) || "";
};

// ÖNCE LOCAL STORAGE (Admin override), YOKSA SUPABASE'DEN ÇEK
export const getActiveApiKey = async (): Promise<string> => {
    // 1. Admin/Developer local override var mı?
    const localKey = localStorage.getItem(LOCAL_STORAGE_KEY_API);
    if (localKey && localKey.length > 10) return localKey;

    // 2. Yoksa Veritabanından (Global Config) çek
    const dbKey = await getSystemConfig('gemini_api_key');
    if (dbKey) return dbKey;

    return "";
};

const PRIMARY_MODEL = 'gemini-3-flash-preview';
const FALLBACK_MODEL = 'gemini-2.0-flash-exp'; 
const SAFETY_MODEL = 'gemini-3-flash-preview'; // Updated from prohibited 1.5-flash

// Test fonksiyonu
export const testAPIConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const apiKey = await getActiveApiKey();
    
    if (!apiKey) {
        return { success: false, message: "API Anahtarı bulunamadı. Lütfen Admin panelinden sistem anahtarını ayarlayın veya veritabanını kontrol edin." };
    }
    
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    const response = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents: { role: 'user', parts: [{ text: 'Test' }] }
    });
    
    return { 
        success: true, 
        message: `BAŞARILI! Veritabanındaki anahtar çalışıyor.` 
    };
  } catch (error: any) {
    return { success: false, message: `Hata: ${error.message}` };
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
  
  // Anahtarı dinamik olarak çek (Async)
  const apiKey = await getActiveApiKey();
  
  if (!apiKey) {
      return "⚠️ SİSTEM HATASI: Yapay zeka anahtarı yapılandırılmamış. Lütfen sistem yöneticisi ile iletişime geçin.";
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
    console.warn(`Primary model failed: ${primaryErrorMsg}`);

    if (primaryErrorMsg.includes("API key") || primaryErrorMsg.includes("403")) {
       return `⚠️ API ANAHTARI HATASI: Sistemdeki anahtar geçersiz. Lütfen admin paneli üzerinden güncelleyin.`;
    }

    try {
      const fallbackResponse = await tryGenerate(FALLBACK_MODEL);
      return `${fallbackResponse.text}\n\n---\n*⚠️ Model: ${fallbackResponse.usedModel} (Fallback)*`;
    } catch (fallbackError: any) {
      return `⚠️ BAĞLANTI HATASI: Servis şu an yanıt veremiyor.`;
    }
  }
};