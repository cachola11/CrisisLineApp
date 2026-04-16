import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-brand-50 via-softpink-100 to-brand-100">
      <div className="w-full max-w-md animate-fade-in">
        <div className="rounded-2xl shadow-card-hover overflow-hidden border border-gray-100">
          {/* Colored header */}
          <div className="relative bg-gradient-to-r from-brand-500 to-brand-400 px-8 pt-10 pb-8 text-center">
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="350" cy="30" r="100" fill="white" fillOpacity="0.3" />
                <circle cx="50" cy="170" r="80" fill="white" fillOpacity="0.2" />
              </svg>
            </div>
            <div className="relative">
              <img
                src={process.env.PUBLIC_URL + '/sos-logo.png'}
                alt="SOS Estudante"
                className="h-14 w-auto mx-auto mb-5 brightness-0 invert opacity-90"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {translations.auth.signIn}
              </h1>
              <p className="text-sm text-white/70 mt-1">
                Introduza as suas credenciais para continuar
              </p>
            </div>
          </div>

          {/* Form area */}
          <div className="bg-white px-8 py-7">
            {successMessage && (
              <div className="mb-4 px-3 py-2.5 rounded-lg bg-success-50 border border-success-400/30 text-success-600 text-sm text-center font-medium">
                {successMessage}
              </div>
            )}

            {error && (
              <div className="mb-4 px-3 py-2.5 rounded-lg bg-danger-50 border border-danger-300/40 text-danger-700 text-sm text-center font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="idNumber" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {translations.auth.idNumber}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    id="idNumber"
                    type="text"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 focus:bg-white transition-all outline-none"
                    placeholder="Ex: 12345"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {translations.auth.password}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-10 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 focus:bg-white transition-all outline-none"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-300 hover:text-gray-500 transition-colors"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold shadow-sm hover:bg-brand-600 hover:shadow-md active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    {translations.common.loading}
                  </span>
                ) : (
                  translations.auth.signIn
                )}
              </button>
            </form>
          </div>

          {/* Footer inside card */}
          <div className="bg-brand-50/50 border-t border-brand-100/50 px-8 py-4 text-center">
            <p className="text-sm text-gray-500">
              Não tem conta?{' '}
              <Link to="/signup" className="font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                {translations.auth.createAccount}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
