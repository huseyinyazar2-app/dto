import React, { useEffect, useState } from 'react';
import { getAllUsers, deleteUser, adminCreateUser } from '../services/storageService';
import { Trash2, UserPlus, Shield, Users, Key } from 'lucide-react';

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUsername, setNewUsername] = useState('');
  const [newUserPass, setNewUserPass] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('Bu kullanıcıyı ve tüm sohbet verilerini silmek istediğine emin misin?')) {
      try {
        await deleteUser(id);
        fetchUsers();
      } catch (error) {
        alert('Silme işlemi başarısız. Yetkiniz olmayabilir.');
      }
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newUserPass) return;
    
    try {
        await adminCreateUser(newUsername.trim().toLowerCase(), newUserPass);
        alert("Kullanıcı başarıyla oluşturuldu.");
        setNewUsername('');
        setNewUserPass('');
        fetchUsers();
    } catch (err: any) {
        alert("Hata: " + err.message);
    }
  };

  return (
    <div className="p-6 md:p-10 h-full overflow-y-auto bg-dto-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-3xl font-bold text-dto-800 flex items-center gap-3">
                <Shield className="text-gold-500" /> Admin Paneli
                </h1>
                <p className="text-dto-500 mt-1">DTÖ Rehberi Kullanıcı Yönetimi (Tablo Modu)</p>
            </div>
        </div>

        {/* Create User Card */}
        <div className="bg-white rounded-xl shadow-sm border border-dto-200 p-6 mb-8">
            <h2 className="text-lg font-bold text-dto-800 mb-4 flex items-center gap-2">
                <UserPlus size={20} className="text-dto-400" /> Yeni Kullanıcı Ekle
            </h2>
            <form onSubmit={handleCreateUser} className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <input 
                        type="text" 
                        placeholder="Kullanıcı Adı" 
                        className="w-full p-3 border rounded-lg"
                        value={newUsername}
                        onChange={e => setNewUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                        required
                    />
                </div>
                <div className="flex-1">
                    <input 
                        type="text" 
                        placeholder="Şifre" 
                        className="w-full p-3 border rounded-lg"
                        value={newUserPass}
                        onChange={e => setNewUserPass(e.target.value)}
                        required
                    />
                </div>
                <button className="bg-dto-800 text-white px-6 py-3 rounded-lg hover:bg-dto-700 font-medium h-fit">
                    Kullanıcı Oluştur
                </button>
            </form>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-xs text-blue-500">
                    <strong>Bilgi:</strong> Bu işlem direkt olarak 'dto_users' tablosuna kayıt ekler. Oturumunuz kapanmaz.
                </p>
            </div>
        </div>

        {/* User List */}
        <div className="bg-white rounded-xl shadow-sm border border-dto-200 overflow-hidden">
            <div className="p-6 border-b border-dto-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-dto-800 flex items-center gap-2">
                    <Users size={20} className="text-dto-400" /> Kayıtlı Kullanıcılar
                </h2>
                <span className="bg-dto-100 text-dto-600 text-xs px-2 py-1 rounded-full">{users.length} Kişi</span>
            </div>
            
            {loading ? (
                <div className="p-8 text-center text-dto-400">Yükleniyor...</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-dto-600">
                        <thead className="bg-dto-50 text-dto-800 font-semibold border-b border-dto-100">
                            <tr>
                                <th className="p-4">Kullanıcı Adı</th>
                                <th className="p-4">Şifre</th>
                                <th className="p-4">Rol</th>
                                <th className="p-4">İsim</th>
                                <th className="p-4 text-right">İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className="border-b border-dto-50 hover:bg-dto-50">
                                    <td className="p-4 font-bold text-dto-700">
                                        {user.username}
                                    </td>
                                    <td className="p-4 flex items-center gap-1 font-mono text-xs">
                                        <Key size={12} className="text-dto-300" /> {user.password}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {user.role === 'admin' ? 'Yönetici' : 'Kullanıcı'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-dto-500">{user.name || '-'}</td>
                                    <td className="p-4 text-right">
                                        <button 
                                            onClick={() => handleDeleteUser(user.id)}
                                            className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded transition-colors"
                                            title="Kullanıcıyı Sil"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;