import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { UserProfile } from "../types";

// Kullanıcının sağladığı anahtarı öncelikli fallback olarak tanımlıyoruz.
const USER_PROVIDED_KEY = "AIzaSyD2cVT4OSKrU6-NZsmNy0JJLWfFsZtrk-k";

const getApiKey = () => {
  // Eğer ortam değişkeni varsa ve geçerli bir Google Key formatındaysa (AI ile başlıyorsa) onu kullan
  if (process.env.API_KEY && process.env.API_KEY.startsWith("AI")) {
    return process.env.API_KEY;
  }
  // Aksi halde kullanıcının verdiği anahtarı kullan
  return USER_PROVIDED_KEY;
};

const createSystemInstruction = (profile: UserProfile | null, isInformational: boolean) => {
  if (isInformational) {
    return `
    Sen Yahya Hamurcu'nun "Deneysel Tasarım Öğretisi" (DTÖ) metodolojisini öğreten, derin bilgiye sahip bir **Eğitmensin**.
    Amacın sorulan kavramı, yasayı veya kurs içeriğini DTÖ perspektifiyle, net, anlaşılır ve derinlemesine açıklamaktır.

    KURALLARIN:
    1. **Bilgi Odaklı Ol:** Danışan analizi yapmak yerine, sorulan kavramı ansiklopedik ve felsefi derinlikte anlat.
    2. **Örnekle:** Soyut kavramları somut yaşam örnekleriyle açıkla.
    3. **Bağlantı Kur:** Anlatılan konunun neden önemli olduğunu vurgula.
    4. **Üslup:** Bilge, öğretici, akıcı ve profesyonel.
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
    const apiKey = getApiKey();
    // Her istekte taze bir client oluşturarak stale-state sorunlarını önlüyoruz
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
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

    return response.text || "Üzgünüm, şu an zihnim biraz bulanık. Lütfen sorunu tekrar eder misin?";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    let errorMessage = "Bağlantı kurulurken bir sorun oluştu.";
    
    if (error.message?.includes('403')) {
      errorMessage = "API Anahtarı hatası (403). Lütfen geçerli bir anahtar kullanıldığından emin olun.";
    } else if (error.message?.includes('429')) {
      errorMessage = "Çok fazla istek gönderildi (429). Lütfen biraz bekleyip tekrar deneyin.";
    } else if (error.message?.includes('503')) {
      errorMessage = "Servis geçici olarak kullanılamıyor (503). Lütfen tekrar deneyin.";
    }

    return `${errorMessage} (Lütfen sayfayı yenileyip tekrar deneyin)`;
  }
};