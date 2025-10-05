import React, { useState, useEffect } from 'react';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any | null;
  onUpdate: (eventId: string, updatedData: any) => Promise<void>;
}

const EVENT_TYPES = ['Turno', 'Teambuilding', 'Evento Aberto', 'Reunião Coordenação', 'Reunião Geral'];

const EditEventModal: React.FC<EditEventModalProps> = ({ isOpen, onClose, event, onUpdate }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: '',
    startTime: '',
    endTime: '',
    maxCapacity: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (event) {
      setForm({
        title: event.title || '',
        description: event.description || '',
        type: event.type || '',
        startTime: event.startTime ? new Date(event.startTime).toISOString().slice(0, 16) : '',
        endTime: event.endTime ? new Date(event.endTime).toISOString().slice(0, 16) : '',
        maxCapacity: event.maxCapacity ? String(event.maxCapacity) : '',
      });
      setError(null);
      setSuccess(false);
    }
  }, [event]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!form.title || !form.type || !form.startTime || !form.endTime || form.maxCapacity === '' || form.maxCapacity === null || form.maxCapacity === undefined) {
        setError('Preencha todos os campos obrigatórios.');
        setLoading(false);
        return;
      }
      await onUpdate(event.id, {
        title: form.title,
        description: form.description,
        type: form.type,
        eventType: form.type,
        startTime: new Date(form.startTime),
        endTime: new Date(form.endTime),
        maxCapacity: Number(form.maxCapacity),
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar evento.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl z-10">&times;</button>
        <h2 className="text-lg lg:text-2xl font-bold text-brand-700 mb-4 lg:mb-6 pr-8">Editar Evento</h2>
        {error && <div className="text-danger mb-2">{error}</div>}
        {success && <div className="text-success mb-2">Evento atualizado com sucesso!</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 text-sm lg:text-lg font-semibold text-brand-700">Título</label>
            <input
              type="text"
              name="title"
              className="mt-1 border rounded-xl px-4 py-3 w-full text-sm lg:text-base focus:border-[#D29674] focus:ring-2 focus:ring-[#D29674]/20 bg-white text-brand-700 placeholder:text-brand-200"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block mb-2 text-sm lg:text-lg font-semibold text-brand-700">Descrição</label>
            <div className="mt-1 border rounded-xl p-4 w-full bg-softpink-50/60 text-brand-700 max-h-32 overflow-y-auto text-sm lg:text-base">
              {form.description || <span className="text-brand-400">Sem descrição.</span>}
            </div>
          </div>
          <div>
            <label className="block mb-2 text-sm lg:text-lg font-semibold text-brand-700">Tipo</label>
            <select
              name="type"
              className="mt-1 border rounded-xl px-4 py-3 w-full text-sm lg:text-base focus:border-[#D29674] focus:ring-2 focus:ring-[#D29674]/20 bg-white text-brand-700"
              value={form.type}
              onChange={handleChange}
              required
            >
              <option value="">Selecione o tipo</option>
              {EVENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <label className="block mb-2 text-sm lg:text-lg font-semibold text-brand-700">Início</label>
              <input
                type="datetime-local"
                name="startTime"
                className="mt-1 border rounded-xl px-4 py-3 w-full text-sm lg:text-base focus:border-[#D29674] focus:ring-2 focus:ring-[#D29674]/20 bg-white text-brand-700"
                value={form.startTime}
                onChange={handleChange}
                required
              />
            </div>
            <div className="flex-1">
              <label className="block mb-2 text-sm lg:text-lg font-semibold text-brand-700">Fim</label>
              <input
                type="datetime-local"
                name="endTime"
                className="mt-1 border rounded-xl px-4 py-3 w-full text-sm lg:text-base focus:border-[#D29674] focus:ring-2 focus:ring-[#D29674]/20 bg-white text-brand-700"
                value={form.endTime}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div>
            <label className="block mb-2 text-sm lg:text-lg font-semibold text-brand-700">Capacidade Máxima</label>
            <input
              type="number"
              name="maxCapacity"
              className="mt-1 border rounded-xl px-4 py-3 w-full text-sm lg:text-base focus:border-[#D29674] focus:ring-2 focus:ring-[#D29674]/20 bg-white text-brand-700"
              value={form.maxCapacity}
              onChange={handleChange}
              min={0}
              placeholder="0 = Ilimitado"
            />
            {form.maxCapacity === '0' && (
              <div className="text-brand-500 text-sm mt-1">Ilimitado</div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-100 text-brand-700 font-semibold hover:bg-gray-200 transition text-sm lg:text-base"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-brand-500 text-white font-semibold hover:bg-brand-600 transition text-sm lg:text-base"
              disabled={loading}
            >
              {loading ? 'A guardar...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEventModal; 