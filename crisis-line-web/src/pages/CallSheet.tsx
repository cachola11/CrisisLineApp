import React from 'react';
import { translations } from '../utils/translations';

const CallSheet: React.FC = () => {
  return (
    <div className="animate-fade-in">
      <div className="rounded-xl border border-gray-100 shadow-card">
        <div className="rounded-t-xl px-5 py-4 bg-gradient-to-r from-brand-500 to-brand-400">
          <h1 className="text-lg font-bold text-white">{translations.pages.dataCollection.title}</h1>
          <p className="text-xs text-white/70 mt-0.5">
            Preenche o formulário abaixo para registar os dados da chamada
          </p>
        </div>
        <div className="rounded-b-xl bg-white p-4 sm:p-6">
          {/* Do not use overflow-hidden on ancestors — it clips the embedded Google Form. */}
          <iframe
            src="https://docs.google.com/forms/d/e/1FAIpQLSf4gRmaLlzj0B-HHD_5BTjYzTvxPSh1lIIKv91nV52seMozOA/viewform?embedded=true"
            width="100%"
            height="1352"
            frameBorder={0}
            marginHeight={0}
            marginWidth={0}
            className="block w-full max-w-full rounded-xl border border-gray-200 shadow-sm"
            title="Formulário de Recolha de Dados"
          >
            A carregar…
          </iframe>
        </div>
      </div>
    </div>
  );
};

export default CallSheet;
