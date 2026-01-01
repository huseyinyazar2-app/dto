import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { Save, UserCircle } from 'lucide-react';
import { saveProfile, getProfile } from '../services/storageService';

interface ProfileFormProps {
  onSave: () => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ onSave }) => {
  const [formData, setFormData] = useState<UserProfile>({
    name: '',
    age: '',
    gender: 'Belirtilmemiş',
    maritalStatus: 'Belirtilmemiş',
    job: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
        const saved = await getProfile();
        if (saved) {
            setFormData(saved);
        }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await saveProfile(formData);
    setLoading(false);
    onSave();
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 flex items-center justify-center bg-dto-50">
      <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl border border-dto-200 p-8">
        <div className="flex items-center space-x-4 mb-8 border-b border-dto-100 pb-6">
          <div className="w-16 h-16 bg-dto-800 rounded-full flex items-center justify-center text-gold-500">
             <UserCircle size={40} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-dto-800">Danışan Profili</h2>
            <p className="text-dto-500 text-sm">
              Doğru analiz ve DTÖ tavsiyeleri için sizi tanımamız önemli. Bilgileriniz veritabanında güvenle saklanır.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-dto-700 mb-2">Adınız / Hitap Şekli</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full p-3 border border-dto-300 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-transparent outline-none transition-all"
                placeholder="Örn: Ahmet"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dto-700 mb-2">Yaşınız</label>
              <input
                type="number"
                name="age"
                required
                value={formData.age}
                onChange={handleChange}
                className="w-full p-3 border border-dto-300 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-transparent outline-none transition-all"
                placeholder="Örn: 35"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-dto-700 mb-2">Cinsiyet</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full p-3 border border-dto-300 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-transparent outline-none transition-all bg-white"
              >
                <option value="Belirtilmemiş">Seçiniz</option>
                <option value="Erkek">Erkek</option>
                <option value="Kadın">Kadın</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dto-700 mb-2">Medeni Durum</label>
              <select
                name="maritalStatus"
                value={formData.maritalStatus}
                onChange={handleChange}
                className="w-full p-3 border border-dto-300 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-transparent outline-none transition-all bg-white"
              >
                <option value="Belirtilmemiş">Seçiniz</option>
                <option value="Bekar">Bekar</option>
                <option value="Evli">Evli</option>
                <option value="İlişkisi Var">İlişkisi Var</option>
                <option value="Boşanmış">Boşanmış</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dto-700 mb-2">Meslek / Uğraş</label>
            <input
              type="text"
              name="job"
              value={formData.job}
              onChange={handleChange}
              className="w-full p-3 border border-dto-300 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-transparent outline-none transition-all"
              placeholder="Örn: Mühendis, Öğrenci, Emekli..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dto-700 mb-2">
              Kısaca Mevcut Durumunuz / Hedefleriniz (Opsiyonel)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full p-3 border border-dto-300 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-transparent outline-none transition-all resize-none"
              placeholder="Örn: İlişkilerimde sürekli aynı döngüyü yaşıyorum, iş hayatımda atılım yapmak istiyorum..."
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-gold-500 hover:bg-gold-600 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={20} />
              {loading ? 'Kaydediliyor...' : 'Profili Kaydet ve Başla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileForm;