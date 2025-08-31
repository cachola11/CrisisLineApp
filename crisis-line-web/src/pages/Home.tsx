import React from 'react';
import { useAuth } from '../context/AuthContext';
import { translations } from '../utils/translations';

const Home: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-softpink-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-softpink-100 flex items-center justify-center">
      <div className="bg-white/90 rounded-3xl shadow-glass p-8 max-w-xl w-full">
        <h1 className="text-3xl font-extrabold text-brand-700 mb-4">{translations.pages.home.title}</h1>
        <p className="text-brand-500 mb-6">{translations.pages.home.description}</p>
        
        {user && (
          <div className="bg-softpink-100 p-4 rounded-xl">
            <p className="text-brand-700">
              Bem-vindo, {user.role || 'Visitante'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home; 