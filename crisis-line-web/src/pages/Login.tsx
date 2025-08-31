import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase/config';
import { idNumberToEmail, isValidIdNumber } from '../utils/auth';
import { translations } from '../utils/translations';

const Login: React.FC = () => {
  const [idNumber, setIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for success message in location state
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message from location state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    if (!isValidIdNumber(idNumber)) {
      setError(translations.auth.invalidIdNumber);
      setLoading(false);
      return;
    }

    try {
      const email = idNumberToEmail(idNumber);
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError(translations.auth.invalidCredentials);
      } else {
        setError(translations.auth.error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-softpink-100">
      <div className="bg-white rounded-2xl shadow-lg border-2 border-[#D29674] max-w-md w-full p-8 flex flex-col items-center">
        <span className="text-4xl mb-2 text-[#D29674]">🔑</span>
        <h1 className="text-3xl font-extrabold text-brand-700 text-center mb-6">{translations.auth.signIn}</h1>
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
              placeholder={translations.auth.idNumber}
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
              placeholder={translations.auth.password}
              required
            />
          </div>
          {error && (
            <div className="text-danger text-sm mb-3 text-center">{error}</div>
          )}
          {successMessage && (
            <div className="text-success text-sm mb-3 text-center">{successMessage}</div>
          )}
          <div className="flex flex-col gap-2 w-full mt-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full px-4 py-2 rounded-lg bg-[#D29674] text-white font-bold shadow hover:bg-[#b97b54] transition text-base ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? translations.common.loading : translations.auth.signIn}
            </button>
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="w-full px-4 py-2 rounded-lg text-[#D29674] font-bold bg-transparent hover:bg-[#f7ede7] transition text-base"
            >
              {translations.navigation.signup}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login; 