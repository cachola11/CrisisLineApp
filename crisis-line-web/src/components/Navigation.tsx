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
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 xl:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20 lg:h-24">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img 
                src={process.env.PUBLIC_URL + '/sos-logo.png'} 
                alt="SOS Estudante" 
                className="h-12 sm:h-16 lg:h-20 w-auto drop-shadow-lg relative z-10"
                style={{ maxHeight: 'clamp(48px, 5vw, 80px)', width: 'auto' }}
                onError={(e) => {
                  console.error('Logo failed to load:', e);
                  // Show fallback text if image fails
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = document.createElement('span');
                  fallback.textContent = 'SOS Estudante';
                  fallback.className = 'text-white text-sm sm:text-lg lg:text-xl font-bold';
                  target.parentNode?.appendChild(fallback);
                }}
                onLoad={() => console.log('Logo loaded successfully')}
              />
            </Link>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
            <Link
              to="/"
              className={`px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm lg:text-base font-semibold transition-all duration-200 shadow hover:scale-105 hover:bg-white/20 ${
                isActive('/') ? 'bg-white/30 text-brand-900' : 'text-white'
              }`}
            >
              <span className="hidden sm:inline">{translations.navigation.home}</span>
              <span className="sm:hidden">🏠</span>
            </Link>

            {user && (
              <>
                {/* Voluntário e acima: Calendário e Recolha de Dados */}
                {(user.role === 'Voluntário' || user.role === 'Coordenador' || user.role === 'Administrador') && (
                  <>
                    <Link
                      to="/calendar"
                      className={`px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm lg:text-base font-semibold transition-all duration-200 shadow hover:scale-105 hover:bg-white/20 ${
                        isActive('/calendar') ? 'bg-white/30 text-brand-900' : 'text-white'
                      }`}
                    >
                      <span className="hidden sm:inline">{translations.navigation.calendar}</span>
                      <span className="sm:hidden">📅</span>
                    </Link>
                    <Link
                      to="/data-collection"
                      className={`px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm lg:text-base font-semibold transition-all duration-200 shadow hover:scale-105 hover:bg-white/20 ${
                        isActive('/data-collection') ? 'bg-white/30 text-brand-900' : 'text-white'
                      }`}
                    >
                      <span className="hidden sm:inline">{translations.navigation.dataCollection}</span>
                      <span className="sm:hidden">📞</span>
                    </Link>
                  </>
                )}

                {/* Coordenador e acima: Gestão de Eventos e Presenças */}
                {['Coordenador', 'Administrador'].includes(user.role) && (
                  <>
                    <Link
                      to="/event-management"
                      className={`px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm lg:text-base font-semibold transition-all duration-200 shadow hover:scale-105 hover:bg-white/20 ${
                        isActive('/event-management') ? 'bg-white/30 text-brand-900' : 'text-white'
                      }`}
                    >
                      <span className="hidden sm:inline">Gestão de Eventos</span>
                      <span className="sm:hidden">⚙️</span>
                    </Link>
                    <Link
                      to="/presencas"
                      className={`px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm lg:text-base font-semibold transition-all duration-200 shadow hover:scale-105 hover:bg-white/20 ${
                        isActive('/presencas') ? 'bg-white/30 text-brand-900' : 'text-white'
                      }`}
                    >
                      <span className="hidden sm:inline">Presenças</span>
                      <span className="sm:hidden">📋</span>
                    </Link>
                  </>
                )}

                {/* Apenas Admin: Admin tab e Linhaticos */}
                {user.role === 'Administrador' && (
                  <>
                    <Link
                      to="/linhaticos"
                      className={`px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm lg:text-base font-semibold transition-all duration-200 shadow hover:scale-105 hover:bg-white/20 ${
                        isActive('/linhaticos') ? 'bg-white/30 text-brand-900' : 'text-white'
                      }`}
                    >
                      <span className="hidden sm:inline">{translations.navigation.linhaticos}</span>
                      <span className="sm:hidden">🎭</span>
                    </Link>
                    <Link
                      to="/admin"
                      className={`px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm lg:text-base font-semibold transition-all duration-200 shadow hover:scale-105 hover:bg-white/20 ${
                        isActive('/admin') ? 'bg-white/30 text-brand-900' : 'text-white'
                      }`}
                    >
                      <span className="hidden sm:inline">{translations.navigation.admin}</span>
                      <span className="sm:hidden">👑</span>
                    </Link>
                  </>
                )}

                <button
                  onClick={signOut}
                  className="px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm lg:text-base font-semibold transition-all duration-200 shadow hover:scale-105 hover:bg-danger-500/80 bg-danger-500 text-white"
                >
                  <span className="hidden sm:inline">{translations.auth.signOut}</span>
                  <span className="sm:hidden">🚪</span>
                </button>
              </>
            )}

            {!user && (
              <>
                <Link
                  to="/login"
                  className={`px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm lg:text-base font-semibold transition-all duration-200 shadow hover:scale-105 hover:bg-white/20 ${
                    isActive('/login') ? 'bg-white/30 text-brand-900' : 'text-white'
                  }`}
                >
                  <span className="hidden sm:inline">{translations.navigation.login}</span>
                  <span className="sm:hidden">🔑</span>
                </Link>
                <Link
                  to="/signup"
                  className={`px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm lg:text-base font-semibold transition-all duration-200 shadow hover:scale-105 hover:bg-white/20 ${
                    isActive('/signup') ? 'bg-white/30 text-brand-900' : 'text-white'
                  }`}
                >
                  <span className="hidden sm:inline">{translations.navigation.signup}</span>
                  <span className="sm:hidden">📝</span>
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