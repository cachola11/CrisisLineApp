import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase/config';
import { idNumberToEmail, isValidIdNumber } from '../utils/auth';
import { translations } from '../utils/translations';

interface CreateUserProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const CreateUser: React.FC<CreateUserProps> = ({ onSuccess, onCancel }) => {
  const [idNumber, setIdNumber] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Administrador' | 'Coordenador' | 'Voluntário' | 'Visitante'>('Visitante');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!isValidIdNumber(idNumber)) {
      setError(translations.auth.invalidIdNumber);
      setLoading(false);
      return;
    }

    try {
      const email = idNumberToEmail(idNumber);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        idNumber,
        name,
        role,
        status: 'active',
        createdAt: new Date().toISOString(),
      });

      setSuccess(true);
      onSuccess();
    } catch (err) {
      setError('Erro ao criar utilizador');
      console.error('Error creating user:', err);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 focus:bg-white outline-none transition-all';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md animate-scale-in overflow-hidden rounded-xl border border-gray-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-brand-500 to-brand-400">
          <div>
            <h2 className="text-sm font-bold text-white">Criar utilizador</h2>
            <p className="text-xs text-white/70 mt-0.5">Novo acesso à plataforma</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Fechar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-xs font-medium text-red-700">{error}</div>
          )}
          {success && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-xs font-medium text-emerald-700">
              Utilizador criado com sucesso!
            </div>
          )}

          <div>
            <label htmlFor="create-idNumber" className="mb-1.5 block text-sm font-semibold text-gray-700">
              {translations.auth.idNumber}
            </label>
            <input
              id="create-idNumber"
              type="text"
              value={idNumber}
              onChange={e => setIdNumber(e.target.value)}
              className={inputClass}
              placeholder="Ex: 12345"
              required
            />
          </div>

          <div>
            <label htmlFor="create-name" className="mb-1.5 block text-sm font-semibold text-gray-700">
              {translations.auth.name}
            </label>
            <input
              id="create-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label htmlFor="create-password" className="mb-1.5 block text-sm font-semibold text-gray-700">
              {translations.auth.password}
            </label>
            <input
              id="create-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={inputClass}
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label htmlFor="create-role" className="mb-1.5 block text-sm font-semibold text-gray-700">
              {translations.auth.role}
            </label>
            <select
              id="create-role"
              value={role}
              onChange={e => setRole(e.target.value as typeof role)}
              className={inputClass}
            >
              {(Object.keys(translations.auth.roles) as Array<keyof typeof translations.auth.roles>).map(key => (
                <option key={key} value={key}>
                  {translations.auth.roles[key]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-600 disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  A criar...
                </span>
              ) : (
                'Criar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUser;
