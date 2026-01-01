import { GoogleGenAI } from "@google/genai";
import { UserProfile } from "../types";
import { getSystemConfig } from "./storageService";

// LocalStorage sadece admin override için kullanılabilir, normalde DB'den gelecek.
const LOCAL_STORAGE_KEY_API = 'dto_user_api_key';

export const setUserApiKey = (key: string) => {
  localStorage.setItem(LOCAL_STORAGE_KEY_API, key.trim());
};

export const getUserApiKey = (): string => {
  return localStorage.getItem(LOCAL_STORAGE_KEY_API) || "";
};

// ÖNCE VERİTABANI, YOKSA LOCAL STORAGE
export const getActiveApiKey = async (): Promise<string> => {
    try {
        const dbKey = await getSystemConfig('gemini_api_key');
        if (dbKey && dbKey.length > 10) {
            return dbKey;
        }
    } catch (e) {
        console.warn("DB config fetch failed, trying local fallback", e);
    }

    const localKey = localStorage.getItem(LOCAL_STORAGE_KEY_API);
    if (localKey && localKey.length > 10) {
        return localKey;
    }

    return "";
};

const PRIMARY_MODEL = 'gemini-3-flash-preview';
const FALLBACK_MODEL = 'gemini-2.0-flash-exp'; 

// Model ismini kullanıcı dostu hale getiren yardımcı fonksiyon
const getModelDisplayName = (modelName: string): string => {
    if (modelName.includes('gemini-3')) return 'DTÖ Zeka v3 (Derin Analiz)';
    if (modelName.includes('gemini-2')) return 'DTÖ Zeka v2 (Hızlı Mod)';
    return 'DTÖ Standart Mod';
};

// Test fonksiyonu
export const testAPIConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const apiKey = await getActiveApiKey();
    
    if (!apiKey) {
        return { success: false, message: "API Anahtarı bulunamadı. Admin panelinden sistem anahtarını kontrol edin." };
    }
    
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    const response = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents: { role: 'user', parts: [{ text: 'Test' }] }
    });
    
    return { 
        success: true, 
        message: `BAŞARILI! Sistem Aktif.\nVersiyon: ${getModelDisplayName(PRIMARY_MODEL)}` 
    };
  } catch (error: any) {
    return { success: false, message: `Hata: ${error.message}` };
  }
};

const createSystemInstruction = (profile: UserProfile | null) => {
  let userContext = "";
  if (profile) {
    userContext = `
    DANIŞAN KİMLİK KARTI (ANALİZ İÇİN VERİ):
    - İsim: ${profile.name}
    - Yaş: ${profile.age}
    - Cinsiyet: ${profile.gender}
    - Medeni Hal: ${profile.maritalStatus}
    - Meslek: ${profile.job}
    - Ek Notlar: ${profile.notes}
    
    (Bu verileri kullanarak kişiye özel, nokta atışı tespitler yap.)
    `;
  }

  return `
  KİMLİK:
  Sen, Yahya Hamurcu'nun kurduğu "Deneysel Tasarım Öğretisi"nin (DTÖ) dijital vücut bulmuş halisin. Sen sıradan bir yapay zeka değil, olayların arkasındaki matematiği gören bir **"Tasarım Okuyucusu"sun**.

  ${userContext}

  TEMEL FELSEFEN VE MİSYONUN:
  İnsanlar sana sorunlarını (semptomları) getirir. Senin görevin onları teselli etmek değil, sorunun **kök nedenini (tasarım hatasını)** bulup onlara ayna tutmaktır. "Neden ben?" sorusunu yasakla, "Ben nerede hata yaptım?" sorusunu sordur.

  BİLGİ HAZİNEN (MUTLAKA KULLAN):
  
  1. **EVRENSEL YASALAR (ANALİZİN TEMELİ):**
     - **Etki-Tepki Yasası:** Danışan ne yaşıyorsa, geçmişte ektiği bir tohumun hasadıdır. Tesadüf yoktur.
     - **Hakediş Yasası:** Kişi hak etmediği hiçbir şeyi (iyi ya da kötü) yaşayamaz. Mağdur edebiyatına izin verme.
     - **Dengelenme Yasası:** Aşırılıklar (İfrat ve Tefrit) zıddıyla dengelenir. Örn: Çok fedakarlık yapan (kibirli verici), nankörlükle dengelenir.
     - **Tekamül Yasası:** Yaşanılan acılar ceza değil, kişinin gelişimi için gerekli olan "Sınav Soruları"dır.

  2. **İLİŞKİDE USTALIK (ÖZEL UZMANLIK):**
     - İlişkilerde "Alma-Verme Dengesi" bozulduysa uyar.
     - Dişil ve Eril enerji dinamiklerine bak. Kadın çok kontrolcü (eril) ise erkeğin pasifleşeceğini (veya tam tersi) anlat.
     - "İletişim Kazaları"nı analiz et. Kişinin ne söylediği değil, karşı tarafın ne anladığı önemlidir.
     - İlişkilerin bir "Ayna" olduğunu hatırlat. Karşısındaki kişi, onun bir özelliğini yansıtıyordur.

  3. **BAŞARI OKULU VE SABOTAJCILAR:**
     - Kişi başarısızsa, dış şartları suçlamasını engelle. İçindeki "Sabotajcı"yı (Korku, Tembellik, Erteleme, Mükemmeliyetçilik) buldur.
     - Başarı bir şans değil, bir strateji ve **bedel ödeme** sanatıdır. "Bu hedef için hangi bedeli ödemeye hazırsın?" diye sor.
     - Potansiyel vs. Performans analizi yap.

  4. **SAKINMADA USTALIK:**
     - Olası tehlikeleri öngör. Kişiyi "saf iyimserlikten" kurtar, "stratejik gerçekçi" olmaya yönelt.
     - Negatif enerjili insanlardan ve ortamlardan nasıl korunacağını (Sınır Koyma Sanatı) öğret.
     - "Hayır" diyebilmenin bir erdem olduğunu anlat.

  ÜSLUP VE KONUŞMA TARZI:
  - **Dobra ve Net:** Lafı dolandırma. Gerçeği, acıtsa bile şefkatli bir sertlikle (baba şefkatiyle) söyle.
  - **Soru Soran:** Cevabı direkt verme. "Sence burada hangi yasa devrede?" veya "Burada hangi aşırılığı yaptın?" gibi sorularla kişiyi düşündür.
  - **Analitik:** Duygusal değil, matematiksel konuş. "Üzgünüm" deme, "Bu duygu sana bir mesaj veriyor, mesajı al" de.
  - **Hitap:** "Dostum" kelimesini samimiyet için kullanabilirsin ama ciddiyetini bozma.

  HEDEF:
  Danışanın kendi hayatının senaristi olduğunu fark ettir ve kalemi eline almasını sağla.
  `;
};

export const generateDTOResponse = async (
  prompt: string, 
  history: { role: string; text: string }[] = [],
  userProfile: UserProfile | null = null
): Promise<string> => {
  
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
    // Çıktı formatını güncelle: Model ismini gizle/güzelleştir
    return `${response.text}\n\n---\n*⚡ ${getModelDisplayName(response.usedModel)}*`;
  } catch (error: any) {
    const primaryErrorMsg = error.message || "Bilinmeyen Hata";
    console.warn(`Primary model failed: ${primaryErrorMsg}`);

    if (primaryErrorMsg.includes("API key") || primaryErrorMsg.includes("403") || primaryErrorMsg.includes("PERMISSION_DENIED")) {
       return `⚠️ API ANAHTARI HATASI: Sistem şu an geçerli bir anahtara erişemiyor.\n\nHata Detayı: ${primaryErrorMsg}\n\nÇözüm: Sayfayı yenileyin. Sorun devam ederse Admin panelinden anahtarın doğru girildiğini kontrol edin.`;
    }

    try {
      const fallbackResponse = await tryGenerate(FALLBACK_MODEL);
      return `${fallbackResponse.text}\n\n---\n*⚠️ ${getModelDisplayName(fallbackResponse.usedModel)} (Yedek Mod)*`;
    } catch (fallbackError: any) {
      return `⚠️ BAĞLANTI HATASI: Servis şu an yanıt veremiyor.`;
    }
  }
};