import React, { useState, useEffect } from 'react';
import CreateUser from '../components/CreateUser';
import { translations } from '../utils/translations';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase/config';
import { deleteUser } from '../services/userService';

const Admin: React.FC = () => {
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordModalUser, setPasswordModalUser] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteModalUser, setDeleteModalUser] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersList);
    } catch (err) {
      setError('Erro ao carregar utilizadores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!showCreateUser) fetchUsers();
  }, [showCreateUser]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUsers(users => users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      alert('Erro ao atualizar função do utilizador');
    }
  };

  const handleOpenPasswordModal = (user: any) => {
    setPasswordModalUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
  };

  const handleClosePasswordModal = () => {
    setPasswordModalUser(null);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
  };

  const handleOpenDeleteModal = (user: any) => {
    setDeleteModalUser(user);
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalUser(null);
  };

  const handleDeleteUser = async () => {
    if (!deleteModalUser) return;
    
    setDeleteLoading(true);
    try {
      await deleteUser(deleteModalUser.id);
      setUsers(users => users.filter(u => u.id !== deleteModalUser.id));
      setDeleteModalUser(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao eliminar utilizador');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSetPassword = async () => {
    if (newPassword.length < 6) {
      setPasswordError('A palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('As palavras-passe não coincidem.');
      return;
    }
    setPasswordLoading(true);
    setPasswordError(null);
    try {
      // Get Firebase ID token for the current user
      const currentUser = (await import('firebase/auth')).getAuth().currentUser;
      if (!currentUser) throw new Error('Utilizador não autenticado.');
      const idToken = await currentUser.getIdToken();
      // Call backend Cloud Function
      const response = await fetch('https://us-central1-crisislineapp.cloudfunctions.net/adminResetUserPassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          uid: passwordModalUser.id, // Firestore doc id is the UID
          newPassword,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Erro ao definir nova palavra-passe.');
      }
      alert('Palavra-passe definida com sucesso!');
      handleClosePasswordModal();
    } catch (err: any) {
      setPasswordError(err.message || 'Erro ao definir nova palavra-passe.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-softpink-100 pb-12">
      <div className="max-w-6xl mx-auto px-4 pt-4 lg:pt-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl lg:text-3xl">🛠️</span>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-brand-700">{translations.pages.admin.title}</h1>
            </div>
            <p className="text-brand-400 text-sm lg:text-base font-medium ml-1">Gerir utilizadores e configurações da plataforma</p>
          </div>
          <button
            onClick={() => setShowCreateUser(true)}
            className="flex items-center gap-2 px-4 lg:px-5 py-2 bg-brand-500 text-white rounded-full font-bold shadow hover:bg-brand-600 transition text-sm lg:text-base mt-2 sm:mt-0"
          >
            <span className="text-lg lg:text-xl">➕</span> {translations.userManagement.createUser}
          </button>
        </div>
        {showCreateUser ? (
          <CreateUser
            onSuccess={() => setShowCreateUser(false)}
            onCancel={() => setShowCreateUser(false)}
          />
        ) : (
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-glass p-4 lg:p-8 max-w-5xl mx-auto mt-6">
            <p className="text-brand-500 text-sm lg:text-lg mb-6 font-medium">
              {translations.pages.admin.description}
            </p>
            <div className="flex justify-end mb-4">
              <button
                onClick={fetchUsers}
                className="px-4 lg:px-5 py-2 bg-brand-500 text-white rounded-full shadow hover:bg-brand-600 transition text-sm lg:text-base font-semibold"
              >
                {'Atualizar'}
              </button>
            </div>
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-brand-500"></div>
              </div>
            ) : error ? (
              <div className="text-danger text-sm lg:text-base font-semibold text-center py-4">{error}</div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-brand-100 shadow-lg">
                <table className="min-w-full divide-y divide-brand-100 rounded-2xl bg-white/90">
                  <thead className="bg-gradient-to-r from-brand-100 to-softpink-100 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 lg:px-6 py-3 text-left text-xs font-bold text-brand-900 uppercase tracking-wider"><span className="mr-1">🆔</span>{translations.auth.idNumber}</th>
                      <th className="px-3 lg:px-6 py-3 text-left text-xs font-bold text-brand-900 uppercase tracking-wider"><span className="mr-1">🧑‍💼</span>{translations.auth.role}</th>
                      <th className="px-3 lg:px-6 py-3 text-left text-xs font-bold text-brand-900 uppercase tracking-wider"><span className="mr-1">🟢</span>Estado</th>
                      <th className="px-3 lg:px-6 py-3 text-left text-xs font-bold text-brand-900 uppercase tracking-wider"><span className="mr-1">🔒</span>Palavra-passe</th>
                      <th className="px-3 lg:px-6 py-3 text-left text-xs font-bold text-brand-900 uppercase tracking-wider"><span className="mr-1">🗑️</span>Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-100">
                    {users.map((u, idx) => (
                      <tr key={u.id} className={`transition hover:bg-softpink-200/60 ${idx % 2 === 0 ? 'bg-softpink-50/60' : 'bg-white/80'}`}>
                        <td className="px-3 lg:px-6 py-3 whitespace-nowrap text-sm lg:text-lg font-semibold text-brand-800 align-middle">{u.idNumber}</td>
                        <td className="px-3 lg:px-6 py-3 whitespace-nowrap align-middle">
                          <span className={`inline-block px-0 py-0 rounded-full text-xs font-bold shadow-sm ${
                            u.role === 'Administrador' ? 'bg-[#D29674]/20 text-[#D29674]' :
                            u.role === 'Coordenador' ? 'bg-[#EBC7A1]/80 text-[#b97b54]' :
                            u.role === 'Voluntário' ? 'bg-[#BFD8E6]/80 text-[#3b5c6b]' :
                            'bg-[#E5E7EB] text-gray-700'
                          }`}>
                            <select
                              value={u.role}
                              onChange={e => handleRoleChange(u.id, e.target.value)}
                              className="border-none bg-transparent font-bold px-2 lg:px-3 py-1 rounded-full focus:ring-2 focus:ring-brand-400 focus:outline-none text-xs lg:text-sm"
                            >
                              {Object.keys(translations.auth.roles).map(role => (
                                <option key={role} value={role}>{translations.auth.roles[role as keyof typeof translations.auth.roles]}</option>
                              ))}
                            </select>
                          </span>
                        </td>
                        <td className="px-3 lg:px-6 py-3 whitespace-nowrap align-middle">
                          <span className={`inline-block px-2 lg:px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                            u.online ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'
                          }`}>
                            {u.online ? 'Online' : 'Offline'}
                          </span>
                        </td>
                        <td className="px-3 lg:px-6 py-3 whitespace-nowrap align-middle">
                          <button
                            className="flex items-center gap-1 px-2 lg:px-3 py-1 bg-brand-100 text-brand-700 rounded-full shadow hover:bg-brand-200 transition-all duration-200 text-xs font-semibold border border-brand-200"
                            onClick={() => handleOpenPasswordModal(u)}
                          >
                            <span className="text-sm lg:text-base">🔑</span> <span className="hidden sm:inline">Definir Nova Palavra-passe</span><span className="sm:hidden">Nova Passe</span>
                          </button>
                        </td>
                        <td className="px-3 lg:px-6 py-3 whitespace-nowrap align-middle">
                          <button
                            className="flex items-center gap-1 px-2 lg:px-3 py-1 bg-red-100 text-red-700 rounded-full shadow hover:bg-red-200 transition-all duration-200 text-xs font-semibold border border-red-200"
                            onClick={() => handleOpenDeleteModal(u)}
                          >
                            <span className="text-sm lg:text-base">🗑️</span> <span className="hidden sm:inline">Eliminar</span><span className="sm:hidden">Del</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {/* Password Modal */}
        {passwordModalUser && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50 animate-fadeIn p-4">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-[#D29674] w-full max-w-sm max-h-[90vh] overflow-y-auto flex flex-col items-center">
              <span className="text-3xl lg:text-4xl mb-2 text-[#D29674] mt-6 lg:mt-8">🔒</span>
              <h2 className="text-lg lg:text-xl font-bold text-brand-700 text-center mb-4 px-6">Definir nova palavra-passe para utilizador {passwordModalUser.idNumber}</h2>
              <div className="px-6 py-6 flex flex-col items-center w-full">
                <label htmlFor="newPassword" className="block text-sm lg:text-lg font-semibold text-brand-700 w-full text-center mb-1">Nova palavra-passe</label>
                <input
                  id="newPassword"
                  type="password"
                  className="mt-2 block w-full rounded-xl border border-brand-200 shadow-sm focus:border-[#D29674] focus:ring-2 focus:ring-[#D29674]/20 bg-white text-brand-700 placeholder:text-brand-200 text-sm lg:text-base py-3 px-4 mb-3"
                  placeholder="Nova palavra-passe"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  disabled={passwordLoading}
                />
                <label htmlFor="confirmPassword" className="block text-sm lg:text-lg font-semibold text-brand-700 w-full text-center mb-1">Confirmar palavra-passe</label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="mt-2 block w-full rounded-xl border border-brand-200 shadow-sm focus:border-[#D29674] focus:ring-2 focus:ring-[#D29674]/20 bg-white text-brand-700 placeholder:text-brand-200 text-sm lg:text-base py-3 px-4 mb-3"
                  placeholder="Confirmar palavra-passe"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  disabled={passwordLoading}
                />
              </div>
              {passwordError && <div className="text-danger text-sm mb-3 text-center px-6">{passwordError}</div>}
              <div className="flex flex-col gap-2 w-full px-6 pb-6">
                <button
                  className="w-full px-4 py-2 rounded-lg bg-[#D29674] text-white font-bold shadow hover:bg-[#b97b54] transition text-sm lg:text-base"
                  onClick={handleSetPassword}
                  disabled={passwordLoading}
                >
                  {passwordLoading ? 'A definir...' : 'Definir'}
                </button>
                <button
                  className="w-full px-4 py-2 rounded-lg text-[#D29674] font-bold bg-transparent hover:bg-[#f7ede7] transition text-sm lg:text-base"
                  onClick={handleClosePasswordModal}
                  disabled={passwordLoading}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Delete Confirmation Modal */}
        {deleteModalUser && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50 animate-fadeIn p-4">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-red-500 w-full max-w-sm max-h-[90vh] overflow-y-auto flex flex-col items-center">
              <span className="text-3xl lg:text-4xl mb-2 text-red-500 mt-6 lg:mt-8">⚠️</span>
              <h2 className="text-lg lg:text-xl font-bold text-brand-700 text-center mb-4 px-6">Confirmar Eliminação</h2>
              <div className="px-6 py-6 flex flex-col items-center w-full">
                <p className="text-sm lg:text-base text-brand-700 text-center mb-4">
                  Tem a certeza que pretende eliminar o utilizador <strong>{deleteModalUser.idNumber}</strong>?
                </p>
                <p className="text-xs lg:text-sm text-red-600 text-center mb-4">
                  Esta ação não pode ser desfeita. Apenas o utilizador será eliminado - não serão afetados outros dados.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full px-6 pb-6">
                <button
                  className="w-full px-4 py-2 rounded-lg bg-red-500 text-white font-bold shadow hover:bg-red-600 transition text-sm lg:text-base"
                  onClick={handleDeleteUser}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? 'A eliminar...' : 'Eliminar Utilizador'}
                </button>
                <button
                  className="w-full px-4 py-2 rounded-lg text-red-500 font-bold bg-transparent hover:bg-red-50 transition text-sm lg:text-base"
                  onClick={handleCloseDeleteModal}
                  disabled={deleteLoading}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin; 