import React from 'react';
import { useAuth } from '../context/AuthContext';

const Linhaticos: React.FC = () => {
  const { user } = useAuth();

  // Check if user has permission to access this page
  const hasPermission = user && user.role === 'Administrador';

  if (!hasPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-softpink-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Apenas Administradores podem acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-softpink-100 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-glass p-6 mb-6">
          <h1 className="text-2xl lg:text-3xl font-extrabold text-brand-700 flex items-center gap-2">
            Linhaticos <span className="text-2xl lg:text-3xl">🎭</span>
          </h1>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl shadow-glass p-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-brand-700 mb-4">Página em Desenvolvimento</h2>
            <p className="text-gray-600 mb-6">
              A funcionalidade Linhaticos está em desenvolvimento e será disponibilizada em breve.
            </p>
            <div className="text-6xl mb-4">🚧</div>
            <p className="text-sm text-gray-500">
              Esta página será usada para gerenciar conteúdo relacionado aos Linhaticos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Linhaticos;
