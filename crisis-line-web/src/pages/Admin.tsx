import React, { useState, useEffect, useMemo } from 'react';
import CreateUser from '../components/CreateUser';
import { translations } from '../utils/translations';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase/config';
import { deleteUser } from '../services/userService';

const roleBadgeClass: Record<string, string> = {
  Administrador: 'bg-rose-50 text-rose-700 border-rose-200',
  Coordenador: 'bg-violet-50 text-violet-700 border-violet-200',
  Voluntário: 'bg-blue-50 text-blue-700 border-blue-200',
  Visitante: 'bg-gray-50 text-gray-600 border-gray-200',
};

const Admin: React.FC = () => {
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [passwordModalUser, setPasswordModalUser] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteModalUser, setDeleteModalUser] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const idStr = String(u.idNumber ?? '').toLowerCase();
      const nameStr = String(u.name ?? '').toLowerCase();
      const roleKey = String(u.role ?? '').toLowerCase();
      const roleLabel = String(
        u.role && u.role in translations.auth.roles
          ? translations.auth.roles[u.role as keyof typeof translations.auth.roles]
          : ''
      ).toLowerCase();
      const onlineStr = u.online ? 'online' : 'offline';
      return (
        idStr.includes(q) ||
        nameStr.includes(q) ||
        roleKey.includes(q) ||
        roleLabel.includes(q) ||
        onlineStr.includes(q)
      );
    });
  }, [users, userSearch]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersList = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const sortedUsers = usersList.sort((a, b) =>
        (a.idNumber || '').localeCompare(b.idNumber || '', undefined, { numeric: true })
      );
      setUsers(sortedUsers);
    } catch {
      setError('Erro ao carregar utilizadores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!showCreateUser) fetchUsers();
  }, [showCreateUser]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUsers(prev => prev.map(u => (u.id === userId ? { ...u, role: newRole } : u)));
    } catch {
      setError('Erro ao atualizar função do utilizador');
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

  const handleOpenDeleteModal = (user: any) => setDeleteModalUser(user);
  const handleCloseDeleteModal = () => setDeleteModalUser(null);

  const handleDeleteUser = async () => {
    if (!deleteModalUser) return;
    setDeleteLoading(true);
    try {
      await deleteUser(deleteModalUser.id);
      setUsers(prev => prev.filter(u => u.id !== deleteModalUser.id));
      setDeleteModalUser(null);
      setToast('Utilizador eliminado.');
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
      const { getAuth } = await import('firebase/auth');
      const currentUser = getAuth().currentUser;
      if (!currentUser) throw new Error('Utilizador não autenticado.');
      const idToken = await currentUser.getIdToken();
      const response = await fetch('https://us-central1-crisislineapp.cloudfunctions.net/adminResetUserPassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ uid: passwordModalUser.id, newPassword }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Erro ao definir nova palavra-passe.');
      }
      setToast('Palavra-passe atualizada com sucesso.');
      handleClosePasswordModal();
    } catch (err: any) {
      setPasswordError(err.message || 'Erro ao definir nova palavra-passe.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {toast && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-sm">
          {toast}
        </div>
      )}

      {showCreateUser ? (
        <CreateUser onSuccess={() => setShowCreateUser(false)} onCancel={() => setShowCreateUser(false)} />
      ) : (
      <div className="rounded-xl border border-gray-100 shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-brand-500 to-brand-400 gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-bold text-white">{translations.pages.admin.title}</h1>
            <p className="text-xs text-white/70 mt-0.5">Gerir utilizadores e configurações da plataforma</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchUsers}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-white/15 text-white text-xs font-semibold border border-white/25 hover:bg-white/25 transition-colors disabled:opacity-50"
            >
              Atualizar
            </button>
            <button
              type="button"
              onClick={() => setShowCreateUser(true)}
              className="px-3 py-1.5 rounded-lg bg-white text-brand-600 text-xs font-semibold shadow-sm hover:bg-gray-50 transition-colors"
            >
              + {translations.userManagement.createUser}
            </button>
          </div>
        </div>

          <div className="bg-white">
            <div className="px-5 py-3 border-b border-gray-100 space-y-3">
              <p className="text-sm text-gray-500">{translations.pages.admin.description}</p>
              <div className="max-w-md">
                <label
                  htmlFor="admin-user-search"
                  className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5"
                >
                  {translations.common.search}
                </label>
                <input
                  id="admin-user-search"
                  type="search"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Id, nome, função, online…"
                  autoComplete="off"
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 focus:bg-white outline-none transition-all"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="h-8 w-8 rounded-full border-[3px] border-brand-200 border-t-brand-500 animate-spin" />
                <p className="text-sm text-gray-400">A carregar utilizadores...</p>
              </div>
            ) : error ? (
              <div className="px-5 py-8 text-center text-sm font-medium text-red-600">{error}</div>
            ) : (
              <div className="overflow-x-auto" style={{ maxHeight: '65vh' }}>
                <table className="w-full min-w-[640px]">
                  <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        {translations.auth.idNumber}
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        {translations.auth.role}
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-12 text-center text-sm text-gray-500">
                          {userSearch.trim()
                            ? 'Nenhum utilizador corresponde à pesquisa.'
                            : 'Sem utilizadores.'}
                        </td>
                      </tr>
                    ) : (
                    filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-sm font-semibold text-gray-800 font-mono">{u.idNumber}</span>
                          {u.name && <p className="text-xs text-gray-400 mt-0.5">{u.name}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={u.role}
                            onChange={e => handleRoleChange(u.id, e.target.value)}
                            className={`text-xs font-semibold rounded-lg border px-2 py-1.5 focus:ring-2 focus:ring-brand-100 focus:border-brand-400 outline-none cursor-pointer ${roleBadgeClass[u.role] || roleBadgeClass.Visitante}`}
                          >
                            {Object.keys(translations.auth.roles).map(role => (
                              <option key={role} value={role}>
                                {translations.auth.roles[role as keyof typeof translations.auth.roles]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                              u.online
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-gray-50 text-gray-500 border-gray-200'
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${u.online ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                            {u.online ? 'Online' : 'Offline'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              title="Definir palavra-passe"
                              onClick={() => handleOpenPasswordModal(u)}
                              className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              title="Eliminar utilizador"
                              onClick={() => handleOpenDeleteModal(u)}
                              className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && !error && (
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
                {userSearch.trim() ? (
                  <>
                    <span className="font-semibold text-gray-600">{filteredUsers.length}</span> de{' '}
                    <span className="font-semibold text-gray-600">{users.length}</span> utilizador
                    {users.length === 1 ? '' : 'es'}
                  </>
                ) : (
                  <>
                    {users.length} utilizador{users.length === 1 ? '' : 'es'}
                  </>
                )}
              </div>
            )}
          </div>
      </div>
      )}

      {/* Password modal */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={handleClosePasswordModal} />
          <div className="relative bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-sm animate-scale-in overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-brand-500 to-brand-400">
              <h2 className="text-sm font-bold text-white">Nova palavra-passe</h2>
              <p className="text-xs text-white/70 mt-0.5 font-mono">{passwordModalUser.idNumber}</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Nova palavra-passe
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  disabled={passwordLoading}
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 focus:bg-white outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label htmlFor="confirmPasswordAdmin" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Confirmar
                </label>
                <input
                  id="confirmPasswordAdmin"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  disabled={passwordLoading}
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 focus:bg-white outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
              {passwordError && <p className="text-xs text-red-600 font-medium text-center">{passwordError}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleClosePasswordModal}
                  disabled={passwordLoading}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSetPassword}
                  disabled={passwordLoading}
                  className="flex-1 px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-all disabled:opacity-50"
                >
                  {passwordLoading ? (
                    <span className="inline-flex items-center gap-2 justify-center">
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      A guardar...
                    </span>
                  ) : (
                    'Guardar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={handleCloseDeleteModal} />
          <div className="relative bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-sm animate-scale-in overflow-hidden">
            <div className="p-6">
              <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-base font-bold text-gray-800 mb-2">Eliminar utilizador</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Tem a certeza que pretende eliminar <strong className="text-gray-800 font-mono">{deleteModalUser.idNumber}</strong>? Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex gap-2 px-6 pb-6">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-all disabled:opacity-50"
              >
                {deleteLoading ? (
                  <span className="inline-flex items-center gap-2 justify-center">
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    A eliminar...
                  </span>
                ) : (
                  'Eliminar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
