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
  `;
};

// Sadece bilgi vermek için (Kurslar ve Yasalar sayfası) kullanılan Instruction
const createInformationalInstruction = () => {
  return `
  Sen Deneysel Tasarım Öğretisi (DTÖ) konusunda uzmanlaşmış akademik bir **Eğitmensin**.
  Görevin: Sorulan konuyu (Yasalar veya Kurs İçerikleri) DTÖ terminolojisine sadık kalarak, net, anlaşılır ve eğitici bir dille anlatmaktır.
  
  KURALLAR:
  1. **Soru Sorma:** Karşı tarafa soru sorma, sadece sorulanı açıkla.
  2. **Nesnel Ol:** Kişisel tavsiye verme, teorik ve pratik bilgiyi aktar.
  3. **Yapı:** Cevaplarını paragraflar halinde, okuması kolay bir formatta ver.
  4. **İçerik:** Cevapların doyurucu olsun ama gereksiz uzatma.
  `;
};

export const generateDTOResponse = async (
  prompt: string, 
  history: { role: string; text: string }[] = [],
  userProfile: UserProfile | null = null,
  isInformational: boolean = false // Yeni parametre: Bilgi modu
): Promise<string> => {
  try {
    const ai = getClient();
    
    // Geçmiş sohbeti sadece Chat modunda kullan, bilgi modunda sadece prompt yeterli
    const contents = isInformational 
      ? [{ role: 'user', parts: [{ text: prompt }] }]
      : [
          ...history.map(h => ({
            role: h.role === 'model' ? 'model' : 'user',
            parts: [{ text: h.text }]
          })),
          { role: 'user', parts: [{ text: prompt }] }
        ];

    // Moduna göre system instruction seçimi
    const instruction = isInformational 
      ? createInformationalInstruction() 
      : createSystemInstruction(userProfile);

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction: instruction,
        temperature: isInformational ? 0.3 : 0.6, // Bilgi verirken daha tutarlı (düşük temp), sohbette daha yaratıcı
      }
    });

    return response.text || "İçerik oluşturulamadı.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Bağlantı hatası oluştu. Lütfen tekrar deneyin.";
  }
};