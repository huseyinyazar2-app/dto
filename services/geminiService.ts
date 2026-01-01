import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { UserProfile } from "../types";

let aiClient: GoogleGenAI | null = null;

// Kullanıcının sağladığı API anahtarı
const API_KEY = 'AIzaSyD2cVT4OSKrU6-NZsmNy0JJLWfFsZtrk-k';

const getClient = () => {
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: API_KEY });
  }
  return aiClient;
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
    
    Analizlerini bu profil verilerine dayandır. Örneğin evli birine ilişkiler konusunda tavsiye verirken eş faktörünü, bekarsa potansiyel faktörünü göz önünde bulundur.
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

  Örnek Akış:
  - Danışan: "İşimde sürekli başarısız oluyorum."
  - Sen (Yanlış): "Hakediş yasasına göre daha çok çalışmalısın."
  - Sen (Doğru): "Bunu duyduğuma üzüldüm dostum. DTÖ perspektifiyle bakacağız. Ancak önce şunu anlamalıyım: Başarısızlık dediğin şey maddi bir kayıp mı yoksa tatminsizlik mi? Ve işindeki süreçlerde genellikle nasıl bir duygu durumuyla hareket ediyorsun?"
  `;
};

export const generateDTOResponse = async (
  prompt: string, 
  history: { role: string; text: string }[] = [],
  userProfile: UserProfile | null = null
): Promise<string> => {
  try {
    const ai = getClient();
    
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
        systemInstruction: createSystemInstruction(userProfile),
        temperature: 0.6, // Slightly lower temperature for more consistent consultancy
      }
    });

    return response.text || "Üzgünüm, şu an bağlantıda bir sorun var. Lütfen tekrar eder misin?";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Bir hata oluştu. Lütfen bağlantını kontrol et.";
  }
};