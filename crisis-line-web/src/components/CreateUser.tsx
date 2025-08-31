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

const ROLE_EMOJIS: Record<string, string> = {
  'Administrador': '👑',
  'Coordenador': '🧑‍💼',
  'Voluntário': '🙋‍♂️',
  'Visitante': '👀',
};

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
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        idNumber,
        name,
        role,
        status: 'active',
        createdAt: new Date().toISOString()
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-lg border-2 border-[#D29674] w-full max-w-lg p-8 flex flex-col items-center">
        <span className="text-4xl mb-2 text-[#D29674]">➕</span>
        <h2 className="text-2xl font-bold text-brand-700 text-center mb-6">Criar Utilizador</h2>
        {error && <div className="text-danger text-sm mb-3 text-center">{error}</div>}
        {success && <div className="text-success text-sm mb-3 text-center">Utilizador criado com sucesso!</div>}
        <form onSubmit={handleSubmit} className="space-y-4 w-full">
          <div>
            <label htmlFor="idNumber" className="block text-lg font-semibold text-brand-700">
              {translations.auth.idNumber}
            </label>
            <input
              id="idNumber"
              type="text"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              className="mt-2 block w-full rounded-xl border border-brand-200 shadow-sm focus:border-[#D29674] focus:ring-2 focus:ring-[#D29674]/20 bg-white text-brand-700 placeholder:text-brand-200 text-base py-3 px-4"
              required
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-lg font-semibold text-brand-700">
              {translations.auth.name}
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 block w-full rounded-xl border border-brand-200 shadow-sm focus:border-[#D29674] focus:ring-2 focus:ring-[#D29674]/20 bg-white text-brand-700 placeholder:text-brand-200 text-base py-3 px-4"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-lg font-semibold text-brand-700">
              {translations.auth.password}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 block w-full rounded-xl border border-brand-200 shadow-sm focus:border-[#D29674] focus:ring-2 focus:ring-[#D29674]/20 bg-white text-brand-700 placeholder:text-brand-200 text-base py-3 px-4"
              required
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-lg font-semibold text-brand-700">
              {translations.auth.role}
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="mt-2 block w-full rounded-xl border border-brand-200 shadow-sm focus:border-[#D29674] focus:ring-2 focus:ring-[#D29674]/20 bg-white text-brand-700 placeholder:text-brand-200 text-base py-3 px-4"
            >
              {Object.entries(translations.auth.roles).map(([key, value]) => (
                <option key={key} value={key}>{ROLE_EMOJIS[value]} {value}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2 w-full mt-6">
            <button
              type="submit"
              className="w-full px-4 py-2 rounded-lg bg-[#D29674] text-white font-bold shadow hover:bg-[#b97b54] transition text-base"
              disabled={loading}
            >
              {loading ? 'A criar...' : 'Criar'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="w-full px-4 py-2 rounded-lg text-[#D29674] font-bold bg-transparent hover:bg-[#f7ede7] transition text-base"
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUser; 