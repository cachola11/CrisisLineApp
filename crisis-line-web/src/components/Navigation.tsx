import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { translations } from '../utils/translations';

interface NavLink {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
  </svg>
);

const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
  </svg>
);

const EventIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
  </svg>
);

const ClipboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
  </svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
  </svg>
);

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
  </svg>
);

const LoginIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const SignUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
  </svg>
);

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
  </svg>
);

const Navigation: React.FC = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [mobileOpen]);

  const isActive = (path: string) => location.pathname === path;

  const navLinks: NavLink[] = [
    { to: '/', label: translations.navigation.home, icon: <HomeIcon /> },
  ];

  if (user) {
    if (['Voluntário', 'Coordenador', 'Administrador'].includes(user.role)) {
      navLinks.push(
        { to: '/calendar', label: translations.navigation.calendar, icon: <CalendarIcon /> },
        { to: '/data-collection', label: translations.navigation.dataCollection, icon: <PhoneIcon /> },
      );
    }
    if (['Coordenador', 'Administrador'].includes(user.role)) {
      navLinks.push(
        { to: '/event-management', label: 'Gestão de Eventos', icon: <EventIcon /> },
        { to: '/presencas', label: 'Presenças', icon: <ClipboardIcon /> },
      );
    }
    if (user.role === 'Administrador') {
      navLinks.push(
        { to: '/linhaticos', label: translations.navigation.linhaticos, icon: <UsersIcon /> },
        { to: '/admin', label: translations.navigation.admin, icon: <ShieldIcon /> },
      );
    }
  }

  return (
    <>
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 font-sans ${
          scrolled
            ? 'bg-white/80 backdrop-blur-xl shadow-nav'
            : 'bg-white shadow-soft'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 shrink-0 group">
              <img
                src={process.env.PUBLIC_URL + '/sos-logo.png'}
                alt="SOS Estudante"
                className="h-14 w-auto transition-transform duration-200 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </Link>

            {/* Desktop links */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(link.to)
                      ? 'text-brand-700 bg-brand-50'
                      : 'text-gray-600 hover:text-brand-700 hover:bg-gray-50'
                  }`}
                >
                  <span className={`transition-colors duration-200 ${isActive(link.to) ? 'text-brand-500' : 'text-gray-400'}`}>
                    {link.icon}
                  </span>
                  {link.label}
                  {isActive(link.to) && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-brand-500 rounded-full" />
                  )}
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {user ? (
                <div className="hidden lg:flex items-center">
                  <button
                    onClick={signOut}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-danger-700 hover:bg-danger-50 transition-all duration-200"
                  >
                    <LogoutIcon />
                    <span>{translations.auth.signOut}</span>
                  </button>
                </div>
              ) : (
                <div className="hidden lg:flex items-center gap-2">
                  <Link
                    to="/login"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive('/login')
                        ? 'text-brand-700 bg-brand-50'
                        : 'text-gray-600 hover:text-brand-700 hover:bg-gray-50'
                    }`}
                  >
                    <LoginIcon />
                    {translations.navigation.login}
                  </Link>
                  <Link
                    to="/signup"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <SignUpIcon />
                    {translations.navigation.signup}
                  </Link>
                </div>
              )}

              {/* Mobile hamburger */}
              <button
                className="lg:hidden relative w-10 h-10 rounded-lg flex items-center justify-center text-gray-600 hover:text-brand-600 hover:bg-gray-50 transition-colors duration-200"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Abrir menu"
              >
                <div className="flex flex-col justify-center items-center w-5 h-5 relative">
                  <span
                    className={`block h-0.5 w-5 bg-current rounded-full transition-all duration-300 ${
                      mobileOpen ? 'rotate-45 translate-y-[3px]' : ''
                    }`}
                  />
                  <span
                    className={`block h-0.5 w-5 bg-current rounded-full transition-all duration-300 mt-1.5 ${
                      mobileOpen ? '-rotate-45 -translate-y-[3px]' : ''
                    }`}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Mobile drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 z-50 h-full w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-out lg:hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Drawer header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <span className="text-lg font-bold text-brand-700">Menu</span>
            <button
              onClick={() => setMobileOpen(false)}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
              aria-label="Fechar menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Drawer links */}
          <nav className="flex-1 overflow-y-auto py-2 px-3">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-all duration-200 ${
                  isActive(link.to)
                    ? 'text-brand-700 bg-brand-50'
                    : 'text-gray-600 hover:text-brand-700 hover:bg-gray-50'
                }`}
              >
                <span className={isActive(link.to) ? 'text-brand-500' : 'text-gray-400'}>{link.icon}</span>
                {link.label}
              </Link>
            ))}

            {!user && (
              <>
                <div className="my-2 border-t border-gray-100" />
                <Link
                  to="/login"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-all duration-200 ${
                    isActive('/login')
                      ? 'text-brand-700 bg-brand-50'
                      : 'text-gray-600 hover:text-brand-700 hover:bg-gray-50'
                  }`}
                >
                  <span className={isActive('/login') ? 'text-brand-500' : 'text-gray-400'}><LoginIcon /></span>
                  {translations.navigation.login}
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 transition-all duration-200"
                >
                  <SignUpIcon />
                  {translations.navigation.signup}
                </Link>
              </>
            )}
          </nav>

          {/* Drawer footer */}
          {user && (
            <div className="p-3 border-t border-gray-100">
              <button
                onClick={signOut}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-danger-700 hover:bg-danger-50 transition-all duration-200"
              >
                <LogoutIcon />
                {translations.auth.signOut}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Navigation;
