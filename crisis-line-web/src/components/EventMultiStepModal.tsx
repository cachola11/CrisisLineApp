import React, { useState } from 'react';
import WeekIntervalInput from './WeekIntervalInput';
import { EVENT_TYPES, EVENT_TYPE_EMOJIS, eventTypeAllowsSignUps } from '../constants/eventTypes';

interface EventMultiStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (eventData: any) => Promise<void>;
}

const RECURRENCE_OPTIONS = [
  { value: 'weekdays', label: 'Dias de semana' },
  { value: 'weekends', label: 'Fins de semana' },
  { value: 'all', label: 'Todos os dias' },
];

const steps = [
  'Tipo de Evento',
  'Informação Básica',
  'Data e Hora',
  'Capacidade',
  'Restrições',
  'Resumo',
];

const EventMultiStepModal: React.FC<EventMultiStepModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [step, setStep] = useState(0);
  const [isRecurring, setIsRecurring] = useState(false);
  const [formData, setFormData] = useState<any>({ maxCapacity: 1 });
  const [recurrence, setRecurrence] = useState('weekdays');
  const [recurrenceInterval, setRecurrenceInterval] = useState({ start: '', end: '' });
  const [restrictions, setRestrictions] = useState<any[]>([]);
  const [restrictionType, setRestrictionType] = useState<'day' | 'interval'>('day');
  const [restrictionDay, setRestrictionDay] = useState('');
  const [restrictionIntervalStart, setRestrictionIntervalStart] = useState('');
  const [restrictionIntervalEnd, setRestrictionIntervalEnd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const skipsCapacityStep = !eventTypeAllowsSignUps(formData.type);

  // Step validation
  const validateStep = () => {
    if (step === 0) return true;
    if (step === 1) {
      if (!formData.title || !formData.description || !formData.type) {
        setError('Preencha todos os campos obrigatórios.');
        return false;
      }
    }
    if (step === 2) {
      if (isRecurring) {
        if (!recurrenceInterval.start || !recurrenceInterval.end || !formData.startTime || !formData.endTime) {
          setError('Preencha todas as datas e horas.');
          return false;
        }
      } else {
        if (!formData.startTime || !formData.endTime) {
          setError('Preencha a data e hora de início e fim.');
          return false;
        }
      }
    }
    if (step === 3) {
      if (skipsCapacityStep) {
        setError(null);
        return true;
      }
      if (formData.maxCapacity === undefined || formData.maxCapacity === null || isNaN(formData.maxCapacity) || formData.maxCapacity < 0) {
        setError('Capacidade máxima deve ser um número maior ou igual a 0 (0 = ilimitado).');
        return false;
      }
    }
    setError(null);
    return true;
  };

  // Restriction handlers
  const handleAddRestriction = () => {
    if (restrictionType === 'day' && restrictionDay) {
      setRestrictions([...restrictions, { type: 'day', date: restrictionDay }]);
      setRestrictionDay('');
    } else if (restrictionType === 'interval' && restrictionIntervalStart && restrictionIntervalEnd) {
      setRestrictions([...restrictions, { type: 'interval', start: restrictionIntervalStart, end: restrictionIntervalEnd }]);
      setRestrictionIntervalStart('');
      setRestrictionIntervalEnd('');
    }
  };
  const handleRemoveRestriction = (idx: number) => {
    setRestrictions(restrictions.filter((_, i) => i !== idx));
  };

  // Stepper
  const renderStepper = () => (
    <div className="flex items-center justify-center mb-4 lg:mb-6 overflow-x-auto">
      <div className="flex items-center min-w-max">
        {steps.map((label, idx) => (
          <div key={label} className="flex items-center">
            <div className={`rounded-full w-6 h-6 lg:w-8 lg:h-8 flex items-center justify-center font-bold text-white transition-colors duration-200 text-xs lg:text-sm ${step === idx ? 'bg-brand-500' : 'bg-softpink-200 text-brand-400'}`}>{idx + 1}</div>
            {idx < steps.length - 1 && <div className="w-4 lg:w-8 h-1 bg-softpink-200 mx-1 lg:mx-2" />}
          </div>
        ))}
      </div>
    </div>
  );

  // Step content
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <label className="block font-semibold mb-2">Tipo de evento</label>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <button type="button" className={`px-4 py-2 rounded-full font-bold transition-all duration-200 text-sm lg:text-base ${!isRecurring ? 'bg-brand-500 text-white' : 'bg-softpink-100 text-brand-700 border border-brand-200'}`} onClick={() => setIsRecurring(false)}>Único</button>
              <button type="button" className={`px-4 py-2 rounded-full font-bold transition-all duration-200 text-sm lg:text-base ${isRecurring ? 'bg-brand-500 text-white' : 'bg-softpink-100 text-brand-700 border border-brand-200'}`} onClick={() => setIsRecurring(true)}>Recorrente</button>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="block mb-1 font-semibold text-brand-700 text-sm lg:text-base">Título</label>
              <input type="text" className="border rounded-full px-4 py-2 w-full bg-white/80 border-brand-200 focus:border-brand-500 focus:ring-brand-500 text-brand-700 placeholder:text-brand-200 text-sm lg:text-base" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-brand-700 text-sm lg:text-base">Descrição</label>
              <textarea className="border rounded-2xl px-4 py-2 w-full bg-white/80 border-brand-200 focus:border-brand-500 focus:ring-brand-500 text-brand-700 placeholder:text-brand-200 text-sm lg:text-base min-h-[80px]" value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} required />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-brand-700 text-sm lg:text-base">Tipo</label>
              <select className="border rounded-full px-4 py-2 w-full bg-white/80 border-brand-200 focus:border-brand-500 focus:ring-brand-500 text-brand-700 text-sm lg:text-base" value={formData.type || ''} onChange={e => {
                const type = e.target.value;
                setFormData((prev) => {
                  const next = { ...prev, type };
                  if (!eventTypeAllowsSignUps(type)) next.maxCapacity = 0;
                  else if (!eventTypeAllowsSignUps(prev.type)) next.maxCapacity = prev.maxCapacity === 0 ? 1 : prev.maxCapacity;
                  return next;
                });
              }} required>
                <option value="">Selecione o tipo</option>
                {EVENT_TYPES.map(type => <option key={type} value={type}>{EVENT_TYPE_EMOJIS[type]} {type}</option>)}
              </select>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            {isRecurring ? (
              <>
                <div>
                  <label className="block mb-1 font-semibold text-brand-700">Tipo de Recorrência</label>
                  <select value={recurrence} onChange={e => setRecurrence(e.target.value)} className="border rounded-full px-4 py-2 w-full bg-white/80 border-brand-200 focus:border-brand-500 focus:ring-brand-500 text-brand-700">
                    {RECURRENCE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <WeekIntervalInput
                  value={recurrenceInterval}
                  onChange={setRecurrenceInterval}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 font-semibold text-brand-700">Hora de Início</label>
                    <input type="time" className="border rounded-full px-4 py-2 w-full bg-white/80 border-brand-200 focus:border-brand-500 focus:ring-brand-500 text-brand-700" value={formData.startTime || ''} onChange={e => setFormData({ ...formData, startTime: e.target.value })} />
                  </div>
                  <div>
                    <label className="block mb-1 font-semibold text-brand-700">Hora de Fim</label>
                    <input type="time" className="border rounded-full px-4 py-2 w-full bg-white/80 border-brand-200 focus:border-brand-500 focus:ring-brand-500 text-brand-700" value={formData.endTime || ''} onChange={e => setFormData({ ...formData, endTime: e.target.value })} />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block mb-1 font-semibold text-brand-700">Início</label>
                  <input type="datetime-local" className="border rounded-full px-4 py-2 w-full bg-white/80 border-brand-200 focus:border-brand-500 focus:ring-brand-500 text-brand-700" value={formData.startTime || ''} onChange={e => setFormData({ ...formData, startTime: e.target.value })} />
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-brand-700">Fim</label>
                  <input type="datetime-local" className="border rounded-full px-4 py-2 w-full bg-white/80 border-brand-200 focus:border-brand-500 focus:ring-brand-500 text-brand-700" value={formData.endTime || ''} onChange={e => setFormData({ ...formData, endTime: e.target.value })} />
                </div>
              </>
            )}
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div>
              <label className="block mb-1 font-semibold text-brand-700">Capacidade Máxima</label>
              <input type="number" className="border rounded-full px-4 py-2 w-full bg-white/80 border-brand-200 focus:border-brand-500 focus:ring-brand-500 text-brand-700 placeholder:text-brand-200" value={formData.maxCapacity ?? ''} onChange={e => setFormData({ ...formData, maxCapacity: Number(e.target.value) })} min={0} />
              <p className="text-xs text-brand-400 mt-1 ml-2">Insira 0 para capacidade ilimitada.</p>
            </div>
          </div>
        );
      case 4:
        if (!isRecurring) return null;
        return (
          <div className="space-y-4">
            <label className="block font-semibold mb-2 text-brand-700">Restrições</label>
            <div className="bg-softpink-50/60 p-4 rounded-xl space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <select value={restrictionType} onChange={e => setRestrictionType(e.target.value as any)} className="border rounded-full px-4 py-2 bg-white/80 border-brand-200 focus:border-brand-500 focus:ring-brand-500 text-brand-700 flex-grow">
                  <option value="day">Dia específico</option>
                  <option value="interval">Intervalo de dias</option>
                </select>
                <button type="button" onClick={handleAddRestriction} className="px-4 py-2 rounded-full font-bold text-white bg-brand-500 hover:bg-brand-600 transition">Adicionar</button>
              </div>
              {restrictionType === 'day' ? (
                <input type="date" value={restrictionDay} onChange={e => setRestrictionDay(e.target.value)} className="border rounded-full px-4 py-2 w-full bg-white/80 border-brand-200 focus:border-brand-500 focus:ring-brand-500 text-brand-700" />
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <input type="date" value={restrictionIntervalStart} onChange={e => setRestrictionIntervalStart(e.target.value)} className="border rounded-full px-4 py-2 w-full bg-white/80 border-brand-200 focus:border-brand-500 focus:ring-brand-500 text-brand-700 flex-grow" />
                  <span className="text-brand-500 font-semibold">até</span>
                  <input type="date" value={restrictionIntervalEnd} onChange={e => setRestrictionIntervalEnd(e.target.value)} className="border rounded-full px-4 py-2 w-full bg-white/80 border-brand-200 focus:border-brand-500 focus:ring-brand-500 text-brand-700 flex-grow" />
                </div>
              )}
            </div>
            {restrictions.length > 0 && (
              <ul className="space-y-2 pt-2">
                {restrictions.map((r, idx) => (
                  <li key={idx} className="flex items-center justify-between bg-white/90 p-2 rounded-lg shadow-sm">
                    <span className="text-brand-700">
                      {r.type === 'day' ? (
                        <span>Dia: {r.date}</span>
                      ) : (
                        <span>Intervalo: {r.start} até {r.end}</span>
                      )}
                    </span>
                    <button type="button" onClick={() => handleRemoveRestriction(idx)} className="text-danger hover:text-danger/80 font-bold p-1">🗑️</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      case 5:
        return (
          <div className="space-y-3">
            <h3 className="font-bold text-xl mb-2 text-brand-800">Resumo do Evento</h3>
            <div className="bg-softpink-50/60 rounded-xl p-4 space-y-2 shadow-inner">
              <div className="flex justify-between py-1 border-b border-brand-100"><span className="font-semibold text-brand-700">Tipo:</span><span className="text-right text-brand-900">{isRecurring ? 'Recorrente' : 'Único'}</span></div>
              <div className="flex justify-between py-1 border-b border-brand-100"><span className="font-semibold text-brand-700">Título:</span><span className="text-right text-brand-900">{formData.title}</span></div>
              <div className="flex justify-between py-1 border-b border-brand-100"><span className="font-semibold text-brand-700">Descrição:</span><span className="text-right text-brand-900">{formData.description}</span></div>
              <div className="flex justify-between py-1 border-b border-brand-100"><span className="font-semibold text-brand-700">Tipo de Evento:</span><span className="text-right text-brand-900">{formData.type}</span></div>
              {isRecurring ? (
                <>
                  <div className="flex justify-between py-1 border-b border-brand-100"><span className="font-semibold text-brand-700">Recorrência:</span><span className="text-right text-brand-900">{RECURRENCE_OPTIONS.find(opt => opt.value === recurrence)?.label}</span></div>
                  <div className="flex justify-between py-1 border-b border-brand-100"><span className="font-semibold text-brand-700">De:</span><span className="text-right text-brand-900">{recurrenceInterval.start}</span></div>
                  <div className="flex justify-between py-1 border-b border-brand-100"><span className="font-semibold text-brand-700">Até:</span><span className="text-right text-brand-900">{recurrenceInterval.end}</span></div>
                  <div className="flex justify-between py-1 border-b border-brand-100"><span className="font-semibold text-brand-700">Hora:</span><span className="text-right text-brand-900">{formData.startTime} - {formData.endTime}</span></div>
                </>
              ) : (
                <>
                  <div className="flex justify-between py-1 border-b border-brand-100"><span className="font-semibold text-brand-700">Início:</span><span className="text-right text-brand-900">{new Date(formData.startTime).toLocaleString('pt-PT')}</span></div>
                  <div className="flex justify-between py-1 border-b border-brand-100"><span className="font-semibold text-brand-700">Fim:</span><span className="text-right text-brand-900">{new Date(formData.endTime).toLocaleString('pt-PT')}</span></div>
                </>
              )}
              <div className="flex justify-between py-1 border-b border-brand-100"><span className="font-semibold text-brand-700">Capacidade Máxima:</span><span className="text-right text-brand-900">{skipsCapacityStep ? 'Sem inscrições' : formData.maxCapacity === 0 ? 'Ilimitada' : formData.maxCapacity}</span></div>
              {isRecurring && (
                <div>
                  <div className="font-semibold text-brand-700 pt-1">Restrições:</div>
                  {restrictions.length === 0 ? <span className="text-brand-900">Nenhuma</span> : (
                    <ul className="list-disc ml-6 text-brand-900">
                      {restrictions.map((r, idx) => (
                        <li key={idx}>
                          {r.type === 'day' ? `Dia: ${r.date}` : `Intervalo: ${r.start} até ${r.end}`}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const handleNext = () => {
    if (!validateStep()) return;
    let nextStep = step + 1;
    if (step === 2 && skipsCapacityStep) {
      nextStep = isRecurring ? 4 : 5;
    } else if (step === 3 && !isRecurring) {
      nextStep = step + 2;
    }
    if (nextStep < steps.length) {
      setStep(nextStep);
    }
  };

  const handlePrev = () => {
    let prevStep = step - 1;
    if (step === 5 && !isRecurring) {
      prevStep = skipsCapacityStep ? 2 : 3;
    } else if (step === 4 && isRecurring && skipsCapacityStep) {
      prevStep = 2;
    }
    if (prevStep >= 0) {
      setStep(prevStep);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    setError(null);
    try {
      await onCreate({
        ...formData,
        maxCapacity: !eventTypeAllowsSignUps(formData.type) ? 0 : formData.maxCapacity,
        isRecurring,
        recurrence,
        recurrenceStart: recurrenceInterval.start,
        recurrenceEnd: recurrenceInterval.end,
        restrictions,
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        // Reset state for next time
        setStep(0);
        setFormData({ maxCapacity: 1 });
        setIsRecurring(false);
        setRecurrence('weekdays');
        setRecurrenceInterval({ start: '', end: '' });
        setRestrictions([]);
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar evento.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-4 lg:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-gray-700 z-10">&times;</button>
        {success ? (
          <div className="text-center py-8 lg:py-12">
            <h2 className="text-xl lg:text-2xl font-bold text-success mb-4">Evento Criado com Sucesso!</h2>
            <p className="text-brand-700">O modal fechará em breve...</p>
          </div>
        ) : (
          <form onSubmit={e => { e.preventDefault(); step === steps.length - 1 ? handleSubmit() : handleNext(); }}>
            {renderStepper()}
            <h2 className="text-lg lg:text-2xl font-bold text-brand-700 mb-4 lg:mb-6 text-center pr-8">{steps[step]}</h2>
            {error && <div className="bg-danger/20 text-danger font-bold p-3 rounded-lg mb-4 text-center text-sm lg:text-base">{error}</div>}
            <div className="min-h-[200px] lg:min-h-[250px]">
              {renderStep()}
            </div>
            <div className="flex flex-col sm:flex-row justify-between gap-4 mt-6 lg:mt-8">
              <button
                type="button"
                onClick={handlePrev}
                disabled={step === 0}
                className="px-4 lg:px-6 py-2 rounded-full font-bold text-brand-700 bg-softpink-100 border border-brand-200 hover:bg-brand-100 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base"
              >
                Anterior
              </button>
              {step < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-4 lg:px-6 py-2 rounded-full font-bold text-white bg-brand-500 hover:bg-brand-600 transition text-sm lg:text-base"
                >
                  Próximo
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-4 lg:px-6 py-2 rounded-full font-bold text-white bg-success hover:bg-success/90 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base"
                >
                  {loading ? 'A criar...' : 'Criar Evento'}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EventMultiStepModal; 