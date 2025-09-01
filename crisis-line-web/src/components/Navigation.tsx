import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { translations } from '../utils/translations';
// import sosLogo from '../assets/sos-logo.png';

const Navigation: React.FC = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Debug: Check if logo is loading
  console.log('SOS Logo path:', '/sos-logo.png');

  return (
         <nav className="sticky top-0 z-50 bg-brand-500 shadow-glass rounded-b-2xl font-sans">
       <div className="container mx-auto px-4">
         <div className="flex justify-between items-center h-24">
           <div className="flex items-center">
             <Link to="/" className="flex items-center">
               <img 
                 src="/sos-logo.png" 
                 alt="SOS Estudante" 
                 className="h-20 w-auto drop-shadow-lg relative z-10"
                 style={{ maxHeight: '80px', width: 'auto' }}
                 onError={(e) => {
                   console.error('Logo failed to load:', e);
                   // Show fallback text if image fails
                   const target = e.target as HTMLImageElement;
                   target.style.display = 'none';
                   const fallback = document.createElement('span');
                   fallback.textContent = 'SOS Estudante';
                   fallback.className = 'text-white text-xl font-bold';
                   target.parentNode?.appendChild(fallback);
                 }}
                 onLoad={() => console.log('Logo loaded successfully')}
               />
             </Link>
           </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className={`px-4 py-2 rounded-full text-base font-semibold transition-all duration-200 shadow hover:scale-105 hover:bg-white/20 ${
                isActive('/') ? 'bg-white/30 text-brand-900' : 'text-white'
              }`}
            >
              {translations.navigation.home}
            </Link>

            {user && (
              <>
                {/* Voluntário e acima: Calendário e Recolha de Dados */}
                {(user.role === 'Voluntário' || user.role === 'Coordenador' || user.role === 'Administrador') && (
                  <>
                    <Link
                      to="/calendar"
                      className={`px-4 py-2 rounded-full text-base font-semibold transition-all duration-200 shadow hover:scale-105 hover:bg-white/20 ${
                        isActive('/calendar') ? 'bg-white/30 text-brand-900' : 'text-white'
                      }`}
                    >
                      {translations.navigation.calendar}
                    </Link>
                    <Link
                      to="/data-collection"
                      className={`px-4 py-2 rounded-full text-base font-semibold transition-all duration-200 shadow hover:scale-105 hover:bg-white/20 ${
                        isActive('/data-collection') ? 'bg-white/30 text-brand-900' : 'text-white'
                      }`}
                    >
                      {translations.navigation.dataCollection}
                    </Link>
                  </>
                )}

                {/* Coordenador e acima: Gestão de Eventos */}
                {['Coordenador', 'Administrador'].includes(user.role) && (
                  <Link
                    to="/event-management"
                    className={`px-4 py-2 rounded-full text-base font-semibold transition-all duration-200 shadow hover:scale-105 hover:bg-white/20 ${
                      isActive('/event-management') ? 'bg-white/30 text-brand-900' : 'text-white'
                    }`}
                  >
                    Gestão de Eventos
                  </Link>
                )}

                {/* Apenas Admin: Admin tab */}
                {user.role === 'Administrador' && (
                  <>
                    <Link
                      to="/admin"
                      className={`px-4 py-2 rounded-full text-base font-semibold transition-all duration-200 shadow hover:scale-105 hover:bg-white/20 ${
                        isActive('/admin') ? 'bg-white/30 text-brand-900' : 'text-white'
                      }`}
                    >
                      {translations.navigation.admin}
                    </Link>
                    <Link
                      to="/data-collection-history"
                      className={`px-4 py-2 rounded-full text-base font-semibold transition-all duration-200 shadow hover:scale-105 hover:bg-white/20 ${
                        isActive('/data-collection-history') ? 'bg-white/30 text-brand-900' : 'text-white'
                      }`}
                    >
                      {translations.navigation.dataCollectionHistory}
                    </Link>
                  </>
                )}

                <button
                  onClick={signOut}
                  className="px-4 py-2 rounded-full text-base font-semibold transition-all duration-200 shadow hover:scale-105 hover:bg-danger-500/80 bg-danger-500 text-white"
                >
                  {translations.auth.signOut}
                </button>
              </>
            )}

            {!user && (
              <>
                <Link
                  to="/login"
                  className={`px-4 py-2 rounded-full text-base font-semibold transition-all duration-200 shadow hover:scale-105 hover:bg-white/20 ${
                    isActive('/login') ? 'bg-white/30 text-brand-900' : 'text-white'
                  }`}
                >
                  {translations.navigation.login}
                </Link>
                <Link
                  to="/signup"
                  className={`px-4 py-2 rounded-full text-base font-semibold transition-all duration-200 shadow hover:scale-105 hover:bg-white/20 ${
                    isActive('/signup') ? 'bg-white/30 text-brand-900' : 'text-white'
                  }`}
                >
                  {translations.navigation.signup}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 