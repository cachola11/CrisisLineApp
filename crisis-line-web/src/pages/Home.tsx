import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { translations } from '../utils/translations';

interface FeatureCard {
  to: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  roles: string[];
}

const Home: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-[3px] border-brand-200 border-t-brand-500 animate-spin" />
          <p className="text-sm text-gray-400 font-medium">{translations.common.loading}</p>
        </div>
      </div>
    );
  }

  const features: FeatureCard[] = [
    {
      to: '/calendar',
      title: translations.pages.calendar.title,
      description: translations.pages.calendar.description,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <rect x="8" y="14" width="3" height="3" rx="0.5" />
        </svg>
      ),
      color: 'from-blue-400 to-blue-600',
      roles: ['Voluntário', 'Coordenador', 'Administrador'],
    },
    {
      to: '/data-collection',
      title: translations.pages.dataCollection.title,
      description: translations.pages.dataCollection.description,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
        </svg>
      ),
      color: 'from-emerald-400 to-emerald-600',
      roles: ['Voluntário', 'Coordenador', 'Administrador'],
    },
    {
      to: '/event-management',
      title: 'Gestão de Eventos',
      description: 'Criar e gerir eventos e atividades',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      ),
      color: 'from-amber-400 to-amber-600',
      roles: ['Coordenador', 'Administrador'],
    },
    {
      to: '/presencas',
      title: 'Presenças',
      description: 'Controlo e gestão de presenças',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M9 14l2 2 4-4" />
        </svg>
      ),
      color: 'from-violet-400 to-violet-600',
      roles: ['Coordenador', 'Administrador'],
    },
    {
      to: '/linhaticos',
      title: translations.pages.linhaticos.title,
      description: translations.pages.linhaticos.description,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87" />
          <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
      ),
      color: 'from-pink-400 to-pink-600',
      roles: ['Administrador'],
    },
    {
      to: '/admin',
      title: translations.pages.admin.title,
      description: translations.pages.admin.description,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      ),
      color: 'from-rose-400 to-rose-600',
      roles: ['Administrador'],
    },
  ];

  const visibleFeatures = user
    ? features.filter((f) => f.roles.includes(user.role))
    : [];

  return (
    <div className="animate-fade-in">
      {/* Hero section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 via-brand-400 to-brand-300 mb-8">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 800 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="700" cy="50" r="200" fill="white" fillOpacity="0.3" />
            <circle cx="100" cy="350" r="150" fill="white" fillOpacity="0.2" />
            <circle cx="400" cy="200" r="100" fill="white" fillOpacity="0.15" />
          </svg>
        </div>

        <div className="relative px-6 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={process.env.PUBLIC_URL + '/sos-estudante-logo.png'}
                alt="SOS estudante"
                className="h-12 sm:h-14 w-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
              {user ? 'Bem-vindo de volta!' : translations.pages.home.title}
            </h1>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      {user && visibleFeatures.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-800">Acesso rápido</h2>
            <span className="text-xs text-gray-400 font-medium">
              {visibleFeatures.length} {visibleFeatures.length === 1 ? 'secção disponível' : 'secções disponíveis'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleFeatures.map((feature, idx) => (
              <Link
                key={feature.to}
                to={feature.to}
                className="group relative bg-white rounded-xl border border-gray-100 p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className={`shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-gray-800 mb-1 group-hover:text-brand-700 transition-colors duration-200">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
                <div className="absolute top-5 right-4 text-gray-300 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

    </div>
  );
};

export default Home;
