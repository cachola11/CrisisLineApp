import React from 'react';

const CallSheet: React.FC = () => {
  return (
    <div className="min-h-screen bg-softpink-100 p-4 sm:p-8 flex items-center justify-center">
      <div className="w-full max-w-4xl bg-white/80 backdrop-blur-md rounded-3xl shadow-glass p-4 sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-extrabold text-brand-700 mb-2 flex items-center gap-2">
            📞 Ficha de Chamada
          </h1>
          <p className="text-brand-400 text-sm lg:text-base">
            Preenche o formulário abaixo para registar os dados da chamada
          </p>
        </div>
        
        <div className="w-full">
          <iframe 
            src="https://docs.google.com/forms/d/e/1FAIpQLSf4gRmaLlzj0B-HHD_5BTjYzTvxPSh1lIIKv91nV52seMozOA/viewform?embedded=true" 
            width="100%" 
            height="1352" 
            frameBorder="0" 
            marginHeight="0" 
            marginWidth="0"
            className="rounded-xl border border-brand-200 shadow-sm"
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