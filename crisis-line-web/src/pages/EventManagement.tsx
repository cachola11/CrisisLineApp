import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllEvents, createEvent, updateEvent, deleteEvent, publishEvent, unpublishEvent, getSignUpsForEvent, signUpUserToEvent, getAllEventSignUps, batchDeleteEvents, batchPublishEvents, batchUnpublishEvents, batchResetSignUps, batchAssignSupervisor } from '../services/eventService';
import { format, addDays } from 'date-fns';
import { Navigate } from 'react-router-dom';
import EventMultiStepModal from '../components/EventMultiStepModal';
import { format as formatDate } from 'date-fns';
import EditEventModal from '../components/EditEventModal';
import { getAllUsers, getUserByRoleIdNumber } from '../services/userService';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import ConfirmationModal from '../components/ConfirmationModal';
import AssignSupervisorModal from '../components/AssignSupervisorModal';
import ManageEventSignUpsModal from '../components/ManageEventSignUpsModal';
import { eventTypeAllowsSignUps } from '../constants/eventTypes';

const EVENT_STYLES: Record<string, { icon: string; dot: string; bg: string; text: string }> = {
  'Turno':              { icon: '☎️', dot: 'bg-blue-500',    bg: 'bg-blue-50',    text: 'text-blue-700' },
  'Teambuilding':       { icon: '🎉', dot: 'bg-amber-500',   bg: 'bg-amber-50',   text: 'text-amber-700' },
  'Evento Aberto':      { icon: '📢', dot: 'bg-pink-500',    bg: 'bg-pink-50',    text: 'text-pink-700' },
  'Reunião Coordenação':{ icon: '💻', dot: 'bg-violet-500',  bg: 'bg-violet-50',  text: 'text-violet-700' },
  'Reunião Geral':      { icon: '👥', dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  'Interrupção Letiva': { icon: '📅', dot: 'bg-slate-500',   bg: 'bg-slate-50',   text: 'text-slate-700' },
  'Pausa Lectiva':      { icon: '📅', dot: 'bg-slate-500',   bg: 'bg-slate-50',   text: 'text-slate-700' },
};

const getStyle = (type: string) => EVENT_STYLES[type] || { icon: '📌', dot: 'bg-gray-500', bg: 'bg-gray-50', text: 'text-gray-700' };

const EventManagement: React.FC = () => {
  const { user, loading } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDay, setFilterDay] = useState('');
  const [filterDateMode, setFilterDateMode] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [showEventModal, setShowEventModal] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [editEvent, setEditEvent] = useState<any | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [signUpCounts, setSignUpCounts] = useState<{ [eventId: string]: number }>({});
  const [signUpLoading, setSignUpLoading] = useState<string | null>(null);
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [forceSignUpModalOpen, setForceSignUpModalOpen] = useState(false);
  const [forceSignUpIdNumber, setForceSignUpIdNumber] = useState('');
  const [forceSignUpEvent, setForceSignUpEvent] = useState<any | null>(null);
  const [forceSignUpSuccess, setForceSignUpSuccess] = useState<string | null>(null);
  const [manageInscritosOpen, setManageInscritosOpen] = useState(false);
  const [manageInscritosEvent, setManageInscritosEvent] = useState<any | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [assignSupervisorModalOpen, setAssignSupervisorModalOpen] = useState(false);
  const [showOnlyUpcoming, setShowOnlyUpcoming] = useState(true);

  const refreshEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const [all, users] = await Promise.all([getAllEvents(), getAllUsers()]);
      setEvents(all);
      setAllUsers(users);
    } catch (err) {
      console.error("Failed to fetch events:", err);
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => { refreshEvents(); }, [refreshEvents]);

  useEffect(() => {
    const fetchSignUps = async () => {
      if (!user) return;
      setSignUpCounts({});
      const allSignUps = await getAllEventSignUps();
      const counts: { [eventId: string]: number } = {};
      for (const ev of events) {
        counts[ev.id] = allSignUps.filter((su: any) => su.eventId === ev.id).length;
      }
      setSignUpCounts(counts);
    };
    if (events.length > 0) fetchSignUps();
  }, [events, user]);

  const handleSignUpCountSync = useCallback((eventId: string, count: number) => {
    setSignUpCounts((prev) => ({ ...prev, [eventId]: count }));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-[3px] border-brand-200 border-t-brand-500 animate-spin" />
          <p className="text-sm text-gray-400 font-medium">A carregar...</p>
        </div>
      </div>
    );
  }
  if (!user || (user.role !== 'Coordenador' && user.role !== 'Administrador')) {
    return <Navigate to="/" />;
  }

  const handleEdit = (event: any) => { setEditEvent(event); setShowEditModal(true); };
  const handleDelete = async (id: string) => {
    setConfirmation({
      isOpen: true, title: 'Eliminar Evento',
      message: 'Tem a certeza que deseja eliminar este evento? Esta ação não pode ser desfeita.',
      onConfirm: async () => {
        setActionLoading(true); await deleteEvent(id); await refreshEvents();
        setConfirmation({ isOpen: false, title: '', message: '', onConfirm: () => {} }); setActionLoading(false);
      },
    });
  };
  const handlePublish = async (id: string) => {
    setConfirmation({
      isOpen: true, title: 'Publicar Evento',
      message: 'Tem a certeza que deseja publicar este evento? Os voluntários poderão vê-lo e inscrever-se.',
      onConfirm: async () => {
        setActionLoading(true); await publishEvent(id); await refreshEvents();
        setConfirmation({ isOpen: false, title: '', message: '', onConfirm: () => {} }); setActionLoading(false);
      },
    });
  };
  const handleUnpublish = async (id: string) => {
    setConfirmation({
      isOpen: true, title: 'Despublicar Evento',
      message: 'Tem a certeza que deseja despublicar este evento? Os voluntários deixarão de o ver.',
      onConfirm: async () => {
        setActionLoading(true); await unpublishEvent(id); await refreshEvents();
        setConfirmation({ isOpen: false, title: '', message: '', onConfirm: () => {} }); setActionLoading(false);
      },
    });
  };
  const handleUpdateEvent = async (eventId: string, updatedData: any) => {
    await updateEvent(eventId, updatedData); await refreshEvents(); setShowEditModal(false); setEditEvent(null);
  };
  const handleToggleSelect = (eventId: string) => {
    setSelectedEvents(prev => prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId]);
  };

  const handleCreateEvent = async (data: any) => {
    const maxCapacity = !eventTypeAllowsSignUps(data.type) ? 0 : data.maxCapacity;
    if (data.isRecurring) {
      const getRecurrenceDates = (start: Date, end: Date) => {
        const dates: Date[] = [];
        let current = new Date(start); current.setHours(0,0,0,0);
        end = new Date(end); end.setHours(0,0,0,0);
        while (current <= end) {
          const day = current.getDay();
          let restricted = false;
          for (const r of data.restrictions) {
            if (r.type === 'day' && r.date === format(current, 'yyyy-MM-dd')) restricted = true;
            if (r.type === 'interval' && r.start <= format(current, 'yyyy-MM-dd') && r.end >= format(current, 'yyyy-MM-dd')) restricted = true;
          }
          if (!restricted && (
            (data.recurrence === 'weekdays' && day >= 1 && day <= 5) ||
            (data.recurrence === 'weekends' && (day === 0 || day === 6)) ||
            (data.recurrence === 'all')
          )) dates.push(new Date(current));
          current = addDays(current, 1);
        }
        return dates;
      };
      const dates = getRecurrenceDates(new Date(data.recurrenceStart), new Date(data.recurrenceEnd));
      for (const date of dates) {
        const start = new Date(date); const [sh, sm] = data.startTime.split(':'); start.setHours(Number(sh), Number(sm));
        const end = new Date(date); const [eh, em] = data.endTime.split(':'); end.setHours(Number(eh), Number(em));
        await createEvent({ title: data.title, description: data.description, type: data.type, eventType: data.type, coordinatorUid: user.uid, startTime: start, endTime: end, maxCapacity, status: 'draft' });
      }
    } else {
      await createEvent({ title: data.title, description: data.description, type: data.type, eventType: data.type, coordinatorUid: user.uid, startTime: new Date(data.startTime), endTime: new Date(data.endTime), maxCapacity, status: 'draft' });
    }
    await refreshEvents(); setShowEventModal(false);
  };

  const handleForceSignUp = async () => {
    if (!forceSignUpIdNumber || !forceSignUpEvent) { setSignUpError('Por favor, insira o IdNumber do utilizador.'); return; }
    setSignUpLoading(forceSignUpEvent.id); setSignUpError(null); setForceSignUpSuccess(null);
    try {
      const foundUser = await getUserByRoleIdNumber(forceSignUpIdNumber);
      if (!foundUser) { setSignUpError('Utilizador com este IdNumber não existe.'); setSignUpLoading(null); return; }
      await signUpUserToEvent(forceSignUpEvent.id, (foundUser as any).uid, true);
      const updated = await getSignUpsForEvent(forceSignUpEvent.id);
      setSignUpCounts(prev => ({ ...prev, [forceSignUpEvent.id]: updated.length }));
      setSignUpLoading(null); setForceSignUpSuccess('Inscrição realizada com sucesso!');
      setTimeout(() => { setForceSignUpModalOpen(false); setForceSignUpIdNumber(''); setForceSignUpEvent(null); setForceSignUpSuccess(null); }, 1500);
    } catch (err: any) { setSignUpError(err.message || 'Erro ao inscrever-se.'); setSignUpLoading(null); }
  };

  const handleBatchAction = (actionType: 'publish' | 'unpublish' | 'delete' | 'reset' | 'assignSupervisor') => {
    if (actionType === 'assignSupervisor') { setAssignSupervisorModalOpen(true); return; }
    const actionMap = {
      publish: { title: 'Publicar Eventos', message: `Publicar os ${selectedEvents.length} eventos selecionados?`,
        onConfirm: async () => { setActionLoading(true); await batchPublishEvents(selectedEvents); await refreshEvents(); setSelectedEvents([]); setConfirmation({ isOpen: false, title: '', message: '', onConfirm: () => {} }); setActionLoading(false); }},
      unpublish: { title: 'Despublicar Eventos', message: `Despublicar os ${selectedEvents.length} eventos selecionados?`,
        onConfirm: async () => { setActionLoading(true); await batchUnpublishEvents(selectedEvents); await refreshEvents(); setSelectedEvents([]); setConfirmation({ isOpen: false, title: '', message: '', onConfirm: () => {} }); setActionLoading(false); }},
      delete: { title: 'Eliminar Eventos', message: `Eliminar os ${selectedEvents.length} eventos selecionados? Esta ação é irreversível.`,
        onConfirm: async () => { setActionLoading(true); await batchDeleteEvents(selectedEvents); await refreshEvents(); setSelectedEvents([]); setConfirmation({ isOpen: false, title: '', message: '', onConfirm: () => {} }); setActionLoading(false); }},
      reset: { title: 'Resetar Inscrições', message: `Remover todas as inscrições dos ${selectedEvents.length} eventos selecionados?`,
        onConfirm: async () => { setActionLoading(true); await batchResetSignUps(selectedEvents); await refreshEvents(); setSelectedEvents([]); setConfirmation({ isOpen: false, title: '', message: '', onConfirm: () => {} }); setActionLoading(false); }},
    };
    const action = actionMap[actionType as keyof typeof actionMap];
    setConfirmation({ isOpen: true, title: action.title, message: action.message, onConfirm: action.onConfirm });
  };

  const filteredEvents = events.filter(ev => {
    const matchesType = !filterType || ev.type === filterType;
    const matchesStatus = !filterStatus || ev.status === filterStatus;
    let matchesDate = true;
    if (filterDay) {
      const eventDate = ev.startTime ? new Date(ev.startTime) : null;
      if (eventDate) {
        if (filterDateMode === 'day') matchesDate = eventDate.toISOString().slice(0, 10) === filterDay;
        else if (filterDateMode === 'week') {
          const selected = new Date(filterDay); const dayOfWeek = selected.getDay();
          const weekStart = new Date(selected); weekStart.setDate(selected.getDate() - dayOfWeek); weekStart.setHours(0,0,0,0);
          const weekEnd = new Date(selected); weekEnd.setDate(selected.getDate() + (6 - dayOfWeek)); weekEnd.setHours(23,59,59,999);
          matchesDate = eventDate >= weekStart && eventDate <= weekEnd;
        } else if (filterDateMode === 'month') {
          const [year, month] = filterDay.split('-');
          matchesDate = eventDate.getFullYear().toString() === year && (eventDate.getMonth() + 1).toString().padStart(2, '0') === month;
        } else if (filterDateMode === 'year') matchesDate = eventDate.getFullYear().toString() === filterDay;
      } else matchesDate = false;
    }
    const today = new Date(); today.setHours(0,0,0,0);
    const matchesUpcoming = !showOnlyUpcoming || (ev.startTime && new Date(ev.startTime) >= today);
    return matchesType && matchesStatus && matchesDate && matchesUpcoming;
  });

  const handleToggleSelectAll = () => {
    setSelectedEvents(selectedEvents.length === filteredEvents.length ? [] : filteredEvents.map(ev => ev.id));
  };

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const aStart = a.startTime ? new Date(a.startTime).getTime() : 0;
    const bStart = b.startTime ? new Date(b.startTime).getTime() : 0;
    return aStart - bStart;
  });

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header card */}
      <div className="rounded-xl border border-gray-100 shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-brand-500 to-brand-400">
          <h1 className="text-lg font-bold text-white">Gestão de Eventos</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setSelectMode(!selectMode); if (selectMode) setSelectedEvents([]); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectMode ? 'bg-white text-brand-600' : 'bg-white/15 text-white border border-white/25 hover:bg-white/25'}`}
            >
              {selectMode ? 'Cancelar seleção' : 'Selecionar'}
            </button>
            <button
              onClick={() => setShowEventModal(true)}
              className="px-3 py-1.5 rounded-lg bg-white text-brand-600 text-xs font-semibold shadow-sm hover:bg-gray-50 transition-all"
            >
              + Criar Evento
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-5 py-4 bg-white border-b border-gray-100">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Tipo</label>
              <select value={filterType} onChange={e => setFilterType(e.target.value)}
                className="rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-700 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-all">
                <option value="">Todos</option>
                <option value="Turno">☎️ Turno</option>
                <option value="Teambuilding">🎉 Teambuilding</option>
                <option value="Evento Aberto">📢 Evento Aberto</option>
                <option value="Reunião Coordenação">💻 Reunião</option>
                <option value="Reunião Geral">👥 Reunião Geral</option>
                <option value="Interrupção Letiva">📅 Interrupção Letiva</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Estado</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-700 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-all">
                <option value="">Todos</option>
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Período</label>
              <div className="flex items-center gap-2">
                <select value={filterDateMode} onChange={e => setFilterDateMode(e.target.value as any)}
                  className="rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-700 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-all">
                  <option value="day">Dia</option>
                  <option value="week">Semana</option>
                  <option value="month">Mês</option>
                  <option value="year">Ano</option>
                </select>
                {filterDateMode === 'day' && (
                  <DatePicker
                    selected={filterDay ? new Date(filterDay) : null}
                    onChange={(date: Date | null) => {
                      if (date) { const d = new Date(date); d.setHours(0,0,0,0); setFilterDay(d.toISOString().slice(0,10)); }
                      else setFilterDay('');
                    }}
                    dateFormat="dd/MM/yyyy" isClearable
                    className="rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-700 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none w-36"
                    placeholderText="dd/mm/aaaa"
                  />
                )}
                {filterDateMode === 'week' && (
                  <DatePicker
                    selected={filterDay ? new Date(filterDay) : null}
                    onChange={(date: any) => {
                      if (date) { setFilterDay(`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`); }
                      else setFilterDay('');
                    }}
                    dateFormat="dd/MM/yyyy" showWeekNumbers
                    customInput={<input className="rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-700 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none w-40" value={formatWeekDisplay(filterDay)} readOnly />}
                  />
                )}
                {(filterDateMode === 'month' || filterDateMode === 'year') && (
                  <input
                    type={filterDateMode === 'month' ? 'month' : 'number'}
                    value={filterDay} onChange={e => setFilterDay(e.target.value)}
                    className="rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-700 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none w-36"
                    placeholder={filterDateMode === 'year' ? 'Ex: 2025' : ''}
                    min={filterDateMode === 'year' ? '2000' : undefined}
                    max={filterDateMode === 'year' ? '2100' : undefined}
                  />
                )}
              </div>
            </div>
            <button onClick={() => { setFilterType(''); setFilterStatus(''); setFilterDay(''); }}
              className="px-3 py-2 rounded-lg text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">
              Limpar filtros
            </button>
            <div className="ml-auto flex items-center gap-2">
              <label className="text-xs font-medium text-gray-500 whitespace-nowrap cursor-pointer select-none" htmlFor="upcoming-toggle">
                Apenas futuros
              </label>
              <button
                id="upcoming-toggle"
                onClick={() => setShowOnlyUpcoming(!showOnlyUpcoming)}
                className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${showOnlyUpcoming ? 'bg-brand-500' : 'bg-gray-200'}`}
                role="switch" aria-checked={showOnlyUpcoming}
              >
                <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${showOnlyUpcoming ? 'translate-x-4' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Batch action bar */}
        {selectMode && selectedEvents.length > 0 && (
          <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-3 flex-wrap">
            <span className="text-sm font-semibold text-blue-700">
              {selectedEvents.length} {selectedEvents.length === 1 ? 'selecionado' : 'selecionados'}
            </span>
            <div className="flex gap-1.5 flex-wrap">
              <button onClick={() => handleBatchAction('publish')} className="px-2.5 py-1 rounded-md bg-white text-emerald-700 text-xs font-semibold border border-emerald-200 hover:bg-emerald-50 transition">Publicar</button>
              <button onClick={() => handleBatchAction('unpublish')} className="px-2.5 py-1 rounded-md bg-white text-amber-700 text-xs font-semibold border border-amber-200 hover:bg-amber-50 transition">Despublicar</button>
              <button onClick={() => handleBatchAction('assignSupervisor')} className="px-2.5 py-1 rounded-md bg-white text-violet-700 text-xs font-semibold border border-violet-200 hover:bg-violet-50 transition">Supervisor</button>
              <button onClick={() => handleBatchAction('reset')} className="px-2.5 py-1 rounded-md bg-white text-orange-700 text-xs font-semibold border border-orange-200 hover:bg-orange-50 transition">Reset inscrições</button>
              <button onClick={() => handleBatchAction('delete')} className="px-2.5 py-1 rounded-md bg-white text-red-700 text-xs font-semibold border border-red-200 hover:bg-red-50 transition">Eliminar</button>
            </div>
          </div>
        )}

        {/* Table */}
        {loadingEvents ? (
          <div className="flex items-center justify-center py-16 bg-white">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 rounded-full border-[3px] border-brand-200 border-t-brand-500 animate-spin" />
              <p className="text-sm text-gray-400">A carregar eventos...</p>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center py-16 bg-white text-center">
            <div className="h-12 w-12 rounded-full bg-brand-50 flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Ainda não existem eventos</p>
            <p className="text-xs text-gray-400">Clique em "Criar Evento" para adicionar o primeiro.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white" style={{ maxHeight: '65vh' }}>
            <table className="w-full min-w-[1000px]">
              <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                <tr>
                  {selectMode && (
                    <th className="w-10 px-3 py-3 sticky left-0 bg-gray-50">
                      <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-400"
                        checked={selectedEvents.length > 0 && selectedEvents.length === filteredEvents.length}
                        onChange={handleToggleSelectAll} />
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Título</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Início</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Fim</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Inscritos</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Supervisor</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedEvents.map((ev) => {
                  const style = getStyle(ev.type);
                  const isSelected = selectedEvents.includes(ev.id);
                  return (
                    <tr key={ev.id} className={`transition-colors ${isSelected ? 'bg-blue-50/60' : 'hover:bg-gray-50/50'}`}>
                      {selectMode && (
                        <td className={`px-3 py-3 sticky left-0 ${isSelected ? 'bg-blue-50/60' : 'bg-white'}`}>
                          <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-400"
                            checked={isSelected} onChange={() => handleToggleSelect(ev.id)} />
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-gray-800">{ev.title}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold ${style.bg} ${style.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                          {ev.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                          ev.status === 'published' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${ev.status === 'published' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                          {ev.status === 'published' ? 'Publicado' : 'Rascunho'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                        {ev.startTime ? formatDate(new Date(ev.startTime), 'dd/MM/yy HH:mm') : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                        {ev.endTime ? formatDate(new Date(ev.endTime), 'dd/MM/yy HH:mm') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {!eventTypeAllowsSignUps(ev.type) ? (
                          <span className="text-xs text-gray-400">—</span>
                        ) : typeof signUpCounts[ev.id] === 'undefined' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                            <span className="h-3 w-3 rounded-full border-2 border-gray-200 border-t-gray-400 animate-spin" />
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-gray-700">
                            {ev.maxCapacity === 0 ? `${signUpCounts[ev.id]}` : `${signUpCounts[ev.id]}/${ev.maxCapacity}`}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {ev.supervisor ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-1.5 py-0.5">
                            {ev.supervisor.emoji && <span>{ev.supervisor.emoji}</span>}
                            {ev.supervisor.name || allUsers.find(u => u.id === ev.supervisor.id)?.idNumber || '...'}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleEdit(ev)} title="Editar"
                            className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          {ev.status === 'draft' ? (
                            <button onClick={() => handlePublish(ev.id)} title="Publicar"
                              className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </button>
                          ) : (
                            <button onClick={() => handleUnpublish(ev.id)} title="Despublicar"
                              className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}
                          {eventTypeAllowsSignUps(ev.type) && (
                            <>
                              <button
                                onClick={() => {
                                  setManageInscritosEvent(ev);
                                  setManageInscritosOpen(true);
                                }}
                                title="Gerir inscrições"
                                className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-cyan-700 hover:bg-cyan-50 transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                                </svg>
                              </button>
                              <button onClick={() => { setForceSignUpModalOpen(true); setForceSignUpEvent(ev); }} title="Forçar inscrição"
                                className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                                </svg>
                              </button>
                            </>
                          )}
                          <button onClick={() => handleDelete(ev.id)} title="Eliminar"
                            className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Results count */}
        {!loadingEvents && events.length > 0 && (
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
            {sortedEvents.length} de {events.length} eventos
          </div>
        )}
      </div>

      {/* Modals */}
      <EventMultiStepModal isOpen={showEventModal} onClose={() => setShowEventModal(false)} onCreate={handleCreateEvent} />
      <EditEventModal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditEvent(null); }} event={editEvent} onUpdate={handleUpdateEvent} />
      <ConfirmationModal isOpen={confirmation.isOpen} onClose={() => setConfirmation({ isOpen: false, title: '', message: '', onConfirm: () => {} })} onConfirm={confirmation.onConfirm} title={confirmation.title} message={confirmation.message} isLoading={actionLoading} />
      <AssignSupervisorModal isOpen={assignSupervisorModalOpen} onClose={() => setAssignSupervisorModalOpen(false)} isLoading={actionLoading}
        onAssign={async (supervisorId: string | null, supervisorName: string | null, supervisorEmoji: string | null) => {
          setActionLoading(true); await batchAssignSupervisor(selectedEvents, supervisorId, supervisorName, supervisorEmoji);
          await refreshEvents(); setSelectedEvents([]); setAssignSupervisorModalOpen(false); setActionLoading(false);
        }}
      />

      <ManageEventSignUpsModal
        isOpen={manageInscritosOpen}
        onClose={() => {
          setManageInscritosOpen(false);
          setManageInscritosEvent(null);
        }}
        event={manageInscritosEvent}
        allUsers={allUsers}
        onCountsChange={handleSignUpCountSync}
      />

      {/* Force sign-up modal */}
      {forceSignUpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={() => { setForceSignUpModalOpen(false); setSignUpError(null); setForceSignUpSuccess(null); }} />
          <div className="relative bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-sm animate-scale-in overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-brand-500 to-brand-400">
              <h2 className="text-sm font-bold text-white">Forçar Inscrição</h2>
              {forceSignUpEvent && <p className="text-xs text-white/70 mt-0.5">{forceSignUpEvent.title}</p>}
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">IdNumber do utilizador</label>
                <input
                  type="text" placeholder="Ex: 12345" value={forceSignUpIdNumber}
                  onChange={e => setForceSignUpIdNumber(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 focus:bg-white transition-all outline-none"
                />
              </div>
              {signUpError && <p className="text-xs text-red-600 font-medium text-center">{signUpError}</p>}
              {forceSignUpSuccess && <p className="text-xs text-emerald-600 font-medium text-center">{forceSignUpSuccess}</p>}
              <div className="flex gap-2">
                <button onClick={() => { setForceSignUpModalOpen(false); setSignUpError(null); setForceSignUpSuccess(null); }}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button onClick={handleForceSignUp} disabled={signUpLoading === forceSignUpEvent?.id}
                  className="flex-1 px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-all disabled:opacity-50">
                  {signUpLoading === forceSignUpEvent?.id ? 'A inscrever...' : 'Inscrever'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function formatWeekDisplay(dateString: string): string {
  if (!dateString) return 'Selecionar semana';
  try {
    const selected = new Date(dateString); const dayOfWeek = selected.getDay();
    const weekStart = new Date(selected); weekStart.setDate(selected.getDate() - dayOfWeek);
    const weekEnd = new Date(selected); weekEnd.setDate(selected.getDate() + (6 - dayOfWeek));
    const fmt = (d: Date) => d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
    return `${fmt(weekStart)} - ${fmt(weekEnd)}`;
  } catch { return 'Selecionar semana'; }
}

export default EventManagement;
