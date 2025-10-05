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
import Switch from '../components/Switch';

const eventTypeMeta: Record<string, { icon: string; className: string }> = {
  'Turno': { icon: '☎️', className: 'bg-blue-100/80 text-blue-700' },
  'Teambuilding': { icon: '🎉', className: 'bg-yellow-100/80 text-yellow-700' },
  'Evento Aberto': { icon: '📢', className: 'bg-pink-100/80 text-pink-700' },
  'Reunião Coordenação': { icon: '💻', className: 'bg-purple-100/80 text-purple-700' },
  'Reunião Geral': { icon: '👥', className: 'bg-green-100/80 text-green-700' },
};

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
      // Normalize event type from `eventType` to `type` for backwards compatibility
      const normalized = all.map((ev: any) => ({ ...ev, type: ev.type || ev.eventType }));
      setEvents(normalized);
      setAllUsers(users);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      // TODO: handle error properly in UI
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  // Fetch events
  useEffect(() => {
    refreshEvents();
  }, [refreshEvents]);

  // Fetch sign-up counts and user sign-up status for all events
  useEffect(() => {
    const fetchSignUps = async () => {
      if (!user) return;
      setSignUpCounts({}); // show loading
      const allSignUps = await getAllEventSignUps();
      const counts: { [eventId: string]: number } = {};
      for (const ev of events) {
        const signUps = allSignUps.filter((su: any) => su.eventId === ev.id);
        counts[ev.id] = signUps.length;
      }
      setSignUpCounts(counts);
    };
    if (events.length > 0) fetchSignUps();
  }, [events, user]);

  // Role-based access check after hooks
  if (loading) return <div>A carregar...</div>;
  if (!user || (user.role !== 'Coordenador' && user.role !== 'Administrador')) {
    return <Navigate to="/" />;
  }

  // Add handlers for create, edit, delete, publish, unpublish
  const handleEdit = (event: any) => {
    setEditEvent(event);
    setShowEditModal(true);
  };
  const handleDelete = async (id: string) => {
    setConfirmation({
      isOpen: true,
      title: 'Eliminar Evento',
      message: 'Tem a certeza que deseja eliminar este evento? Esta ação não pode ser desfeita.',
      onConfirm: async () => {
        setActionLoading(true);
        await deleteEvent(id);
        await refreshEvents();
        setConfirmation({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        setActionLoading(false);
      },
    });
  };
  const handlePublish = async (id: string) => {
    setConfirmation({
      isOpen: true,
      title: 'Publicar Evento',
      message: 'Tem a certeza que deseja publicar este evento? Os voluntários poderão vê-lo e inscrever-se.',
      onConfirm: async () => {
        setActionLoading(true);
        await publishEvent(id);
        await refreshEvents();
        setConfirmation({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        setActionLoading(false);
      },
    });
  };
  const handleUnpublish = async (id: string) => {
    setConfirmation({
      isOpen: true,
      title: 'Despublicar Evento',
      message: 'Tem a certeza que deseja despublicar este evento? Os voluntários deixarão de o ver.',
      onConfirm: async () => {
        setActionLoading(true);
        await unpublishEvent(id);
        await refreshEvents();
        setConfirmation({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        setActionLoading(false);
      },
    });
  };
  const handleUpdateEvent = async (eventId: string, updatedData: any) => {
    await updateEvent(eventId, updatedData);
    await refreshEvents();
    setShowEditModal(false);
    setEditEvent(null);
  };

  const handleToggleSelect = (eventId: string) => {
    setSelectedEvents(prev =>
      prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId]
    );
  };

  // New onCreate handler for EventMultiStepModal
  const handleCreateEvent = async (data: any) => {
    if (data.isRecurring) {
      // Recurring event creation logic
      const getRecurrenceDates = (start: Date, end: Date, pattern: string, restrictions: any[]) => {
        const dates: Date[] = [];
        let current = new Date(start);
        current.setHours(0,0,0,0);
        end = new Date(end);
        end.setHours(0,0,0,0);
        while (current <= end) {
          const day = current.getDay();
          let restricted = false;
          for (const r of data.restrictions) {
            if (r.type === 'day' && r.date === format(current, 'yyyy-MM-dd')) {
              restricted = true;
            }
            if (r.type === 'interval' && r.start <= format(current, 'yyyy-MM-dd') && r.end >= format(current, 'yyyy-MM-dd')) {
              restricted = true;
            }
          }
          if (!restricted && (
            (data.recurrence === 'weekdays' && day >= 1 && day <= 5) ||
            (data.recurrence === 'weekends' && (day === 0 || day === 6)) ||
            (data.recurrence === 'all')
          )) {
            dates.push(new Date(current));
          }
          current = addDays(current, 1);
        }
        return dates;
      };
      const dates = getRecurrenceDates(new Date(data.recurrenceStart), new Date(data.recurrenceEnd), data.recurrence, data.restrictions);
      for (const date of dates) {
        const start = new Date(date);
        const [startHour, startMinute] = data.startTime.split(':');
        start.setHours(Number(startHour), Number(startMinute));
        const end = new Date(date);
        const [endHour, endMinute] = data.endTime.split(':');
        end.setHours(Number(endHour), Number(endMinute));
        await createEvent({
          title: data.title,
          description: data.description,
          type: data.type,
          eventType: data.type,
          coordinatorUid: user.uid,
          startTime: start,
          endTime: end,
          maxCapacity: data.maxCapacity,
          status: 'draft',
        });
      }
    } else {
      // Single event creation logic
      await createEvent({
        title: data.title,
        description: data.description,
        type: data.type,
        eventType: data.type,
        coordinatorUid: user.uid,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        maxCapacity: data.maxCapacity,
        status: 'draft',
      });
    }
    // Refresh events
    await refreshEvents();
    setShowEventModal(false);
  };

  const handleForceSignUp = async () => {
    if (!forceSignUpIdNumber || !forceSignUpEvent) {
      setSignUpError('Por favor, insira o IdNumber do utilizador.');
      return;
    }
    setSignUpLoading(forceSignUpEvent.id);
    setSignUpError(null);
    setForceSignUpSuccess(null);
    try {
      // Look up user by IdNumber
      const user = await getUserByRoleIdNumber(forceSignUpIdNumber);
      if (!user) {
        setSignUpError('Utilizador com este IdNumber não existe.');
        setSignUpLoading(null);
        return;
      }
      await signUpUserToEvent(forceSignUpEvent.id, (user as any).uid, true); // force = true
      const updated = await getSignUpsForEvent(forceSignUpEvent.id);
      setSignUpCounts(prev => ({ ...prev, [forceSignUpEvent.id]: updated.length }));
      setSignUpLoading(null);
      setForceSignUpSuccess('Inscrição realizada com sucesso!');
      // Wait 1.5s before closing modal and resetting state
      setTimeout(() => {
        setForceSignUpModalOpen(false);
        setForceSignUpIdNumber('');
        setForceSignUpEvent(null);
        setForceSignUpSuccess(null);
      }, 1500);
    } catch (err: any) {
      setSignUpError(err.message || 'Erro ao inscrever-se.');
      setSignUpLoading(null);
    }
  };

  const handleBatchAction = (actionType: 'publish' | 'unpublish' | 'delete' | 'reset' | 'assignSupervisor') => {
    if (actionType === 'assignSupervisor') {
      setAssignSupervisorModalOpen(true);
      return;
    }

    const actionMap = {
      publish: {
        title: 'Publicar Eventos',
        message: `Tem a certeza que deseja publicar os ${selectedEvents.length} eventos selecionados?`,
        onConfirm: async () => {
          setActionLoading(true);
          await batchPublishEvents(selectedEvents);
          await refreshEvents();
          setSelectedEvents([]);
          setConfirmation({ isOpen: false, title: '', message: '', onConfirm: () => {} });
          setActionLoading(false);
        },
      },
      unpublish: {
        title: 'Despublicar Eventos',
        message: `Tem a certeza que deseja despublicar os ${selectedEvents.length} eventos selecionados?`,
        onConfirm: async () => {
          setActionLoading(true);
          await batchUnpublishEvents(selectedEvents);
          await refreshEvents();
          setSelectedEvents([]);
          setConfirmation({ isOpen: false, title: '', message: '', onConfirm: () => {} });
          setActionLoading(false);
        },
      },
      delete: {
        title: 'Eliminar Eventos',
        message: `Tem a certeza que deseja eliminar os ${selectedEvents.length} eventos selecionados? Esta ação é irreversível.`,
        onConfirm: async () => {
          setActionLoading(true);
          await batchDeleteEvents(selectedEvents);
          await refreshEvents();
          setSelectedEvents([]);
          setConfirmation({ isOpen: false, title: '', message: '', onConfirm: () => {} });
          setActionLoading(false);
        },
      },
      reset: {
        title: 'Resetar Inscrições',
        message: `Tem a certeza que deseja remover todas as inscrições dos ${selectedEvents.length} eventos selecionados?`,
        onConfirm: async () => {
          setActionLoading(true);
          await batchResetSignUps(selectedEvents);
          await refreshEvents();
          setSelectedEvents([]);
          setConfirmation({ isOpen: false, title: '', message: '', onConfirm: () => {} });
          setActionLoading(false);
        },
      },
    };
    
    // The type assertion is safe because we've already handled 'assignSupervisor'
    const action = actionMap[actionType as keyof typeof actionMap];
    setConfirmation({
      isOpen: true,
      title: action.title,
      message: action.message,
      onConfirm: action.onConfirm,
    });
  };

  const filteredEvents = events.filter(ev => {
    const matchesType = !filterType || ev.type === filterType;
    const matchesStatus = !filterStatus || ev.status === filterStatus;
    let matchesDate = true;
    if (filterDay) {
      const eventDate = ev.startTime ? new Date(ev.startTime) : null;
      if (eventDate) {
        if (filterDateMode === 'day') {
          matchesDate = eventDate.toISOString().slice(0, 10) === filterDay;
        } else if (filterDateMode === 'week') {
          // filterDay is a date string (YYYY-MM-DD)
          const selected = new Date(filterDay);
          const dayOfWeek = selected.getDay();
          // Start of week (Sunday)
          const weekStart = new Date(selected);
          weekStart.setDate(selected.getDate() - dayOfWeek);
          weekStart.setHours(0, 0, 0, 0);
          // End of week (Saturday)
          const weekEnd = new Date(selected);
          weekEnd.setDate(selected.getDate() + (6 - dayOfWeek));
          weekEnd.setHours(23, 59, 59, 999);
          matchesDate = eventDate >= weekStart && eventDate <= weekEnd;
        } else if (filterDateMode === 'month') {
          const [year, month] = filterDay.split('-');
          matchesDate = eventDate.getFullYear().toString() === year && (eventDate.getMonth() + 1).toString().padStart(2, '0') === month;
        } else if (filterDateMode === 'year') {
          matchesDate = eventDate.getFullYear().toString() === filterDay;
        }
      } else {
        matchesDate = false;
      }
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const matchesUpcoming = !showOnlyUpcoming || (ev.startTime && new Date(ev.startTime) >= today);
    
    return matchesType && matchesStatus && matchesDate && matchesUpcoming;
  });

  const handleToggleSelectAll = () => {
    if (selectedEvents.length === filteredEvents.length) {
      setSelectedEvents([]);
    } else {
      setSelectedEvents(filteredEvents.map(ev => ev.id));
    }
  };

  return (
    <div className="min-h-screen bg-softpink-100 pb-12">
      <div className="max-w-6xl mx-auto px-4 pt-4 lg:pt-8">
        <div className="flex items-center mb-6 lg:mb-8">
          <span className="text-2xl lg:text-3xl mr-3">📅</span>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-brand-700 drop-shadow-sm">Gestão de Eventos</h1>
        </div>
        
        {/* Filters and Actions */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Filter Group */}
          <div className="flex flex-wrap items-center gap-2 lg:gap-3">
            <div className="relative">
              <label className="block text-xs font-bold text-brand-700 mb-1 ml-2">Tipo</label>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} className="rounded-full px-3 lg:px-4 py-2 bg-white shadow text-brand-700 border-2 border-brand-200 focus:ring-2 focus:ring-brand-300 appearance-none pr-6 lg:pr-8 text-sm lg:text-base">
                <option value="">Todos</option>
                <option value="Turno">☎️ Turno</option>
                <option value="Teambuilding">🎉 Teambuilding</option>
                <option value="Evento Aberto">📢 Evento Aberto</option>
                <option value="Reunião Coordenação">💻 Reunião</option>
                <option value="Reunião Geral">👥 Reunião Geral</option>
              </select>
              <span className="pointer-events-none absolute right-2 lg:right-3 top-8 text-brand-400 text-xs">▼</span>
            </div>
            <div className="relative">
              <label className="block text-xs font-bold text-brand-700 mb-1 ml-2">Estado</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="rounded-full px-3 lg:px-4 py-2 bg-white shadow text-brand-700 border-2 border-brand-200 focus:ring-2 focus:ring-brand-300 appearance-none pr-6 lg:pr-8 text-sm lg:text-base">
                <option value="">Todos</option>
                <option value="draft">🟡 Rascunho</option>
                <option value="published">🟢 Publicado</option>
              </select>
              <span className="pointer-events-none absolute right-2 lg:right-3 top-8 text-brand-400 text-xs">▼</span>
            </div>
            <div className="relative">
              <label className="block text-xs font-bold text-brand-700 mb-1 ml-2">Data</label>
              <div className="flex gap-2 items-center">
                <div className="relative flex items-center gap-2">
                  <select
                    value={filterDateMode}
                    onChange={e => setFilterDateMode(e.target.value as 'day' | 'week' | 'month' | 'year')}
                    className="rounded-full px-3 py-2 bg-white shadow text-brand-700 border-2 border-brand-200 focus:ring-2 focus:ring-brand-300 appearance-none pr-8"
                  >
                    <option value="day">Dia</option>
                    <option value="week">Semana</option>
                    <option value="month">Mês</option>
                    <option value="year">Ano</option>
                  </select>
                  <span className="pointer-events-none absolute right-3 top-3 text-brand-400">▼</span>
                  <div className="flex items-center gap-1">
                    {/* Date picker logic */}
                    {filterDateMode === 'day' && (
                       <DatePicker
                        selected={filterDay ? new Date(filterDay) : null}
                        onChange={(date: Date | null) => {
                          if (date) {
                            // Ensure time is not carried over from selection
                            const newDate = new Date(date);
                            newDate.setHours(0, 0, 0, 0);
                            setFilterDay(newDate.toISOString().slice(0, 10));
                          } else {
                            setFilterDay('');
                          }
                        }}
                        dateFormat="dd/MM/yyyy"
                        className="w-full rounded-full px-4 py-2 bg-white shadow text-brand-700 border-2 border-brand-200 focus:ring-2 focus:ring-brand-300"
                        placeholderText="dd/mm/aaaa"
                        isClearable
                      />
                    )}
                    {filterDateMode === 'week' && (
                      <DatePicker
                        selected={filterDay ? new Date(filterDay) : null}
                        onChange={(date: any) => {
                          if (date) {
                            const yyyy = date.getFullYear();
                            const mm = String(date.getMonth() + 1).padStart(2, '0');
                            const dd = String(date.getDate()).padStart(2, '0');
                            setFilterDay(`${yyyy}-${mm}-${dd}`);
                          } else {
                            setFilterDay('');
                          }
                        }}
                        dateFormat="dd/MM/yyyy"
                        showWeekNumbers
                        customInput={
                          <input
                            className="w-full rounded-full px-4 py-2 bg-white shadow text-brand-700 border-2 border-brand-200 focus:ring-2 focus:ring-brand-300"
                            value={formatWeekDisplay(filterDay)}
                            readOnly
                          />
                        }
                      />
                    )}
                    {(filterDateMode === 'month' || filterDateMode === 'year') && (
                      <input
                        type={filterDateMode === 'month' ? 'month' : 'number'}
                        value={filterDay}
                        onChange={e => setFilterDay(e.target.value)}
                        className="rounded-full px-4 py-2 bg-white shadow text-brand-700 border-2 border-brand-200 focus:ring-2 focus:ring-brand-300"
                        placeholder={filterDateMode === 'year' ? 'Ano (ex: 2024)' : ''}
                        min={filterDateMode === 'year' ? '2000' : undefined}
                        max={filterDateMode === 'year' ? '2100' : undefined}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
            <button onClick={() => { setFilterType(''); setFilterStatus(''); setFilterDay(''); }} className="self-end rounded-full px-3 lg:px-5 py-2 bg-brand-100 text-brand-700 border border-brand-200 shadow hover:bg-brand-200 transition text-sm lg:text-base">Limpar</button>
          </div>
          
          {/* Action Group */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-3 lg:gap-4">
            <Switch
              label="Mostrar apenas eventos futuros"
              checked={showOnlyUpcoming}
              onChange={setShowOnlyUpcoming}
            />
            <div className="flex flex-col sm:flex-row gap-2 lg:gap-4 w-full sm:w-auto">
              <button onClick={() => setSelectMode(!selectMode)} className={`rounded-full px-4 lg:px-6 py-2 font-bold shadow-lg transition whitespace-nowrap text-sm lg:text-base ${selectMode ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-brand-100 text-brand-700 hover:bg-brand-200'}`}>
                {selectMode ? 'Cancelar Seleção' : 'Modo de Seleção'}
              </button>
              <button onClick={() => setShowEventModal(true)} className="rounded-full px-4 lg:px-6 py-2 bg-brand-500 text-white font-bold shadow-lg hover:bg-brand-600 transition whitespace-nowrap text-sm lg:text-base">➕ Criar Evento</button>
            </div>
          </div>
        </div>
        
        {/* Batch Action Bar */}
        {selectMode && (
          <div className="bg-blue-100 border-2 border-blue-300 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-lg">
            <h3 className="text-base lg:text-lg font-bold text-blue-800">
              {selectedEvents.length} {selectedEvents.length === 1 ? 'evento selecionado' : 'eventos selecionados'}
            </h3>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => handleBatchAction('publish')} disabled={selectedEvents.length === 0} className="px-3 py-1 bg-white text-blue-700 rounded-full shadow font-semibold border border-blue-200 hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed text-xs lg:text-sm">Publicar</button>
              <button onClick={() => handleBatchAction('unpublish')} disabled={selectedEvents.length === 0} className="px-3 py-1 bg-white text-blue-700 rounded-full shadow font-semibold border border-blue-200 hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed text-xs lg:text-sm">Despublicar</button>
              <button onClick={() => handleBatchAction('assignSupervisor')} disabled={selectedEvents.length === 0} className="px-3 py-1 bg-white text-blue-700 rounded-full shadow font-semibold border-blue-200 hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed text-xs lg:text-sm">Atribuir Supervisor</button>
              <button onClick={() => handleBatchAction('reset')} disabled={selectedEvents.length === 0} className="px-3 py-1 bg-white text-orange-700 rounded-full shadow font-semibold border border-orange-200 hover:bg-orange-50 transition disabled:opacity-50 disabled:cursor-not-allowed text-xs lg:text-sm">Reset Inscrições</button>
              <button onClick={() => handleBatchAction('delete')} disabled={selectedEvents.length === 0} className="px-3 py-1 bg-white text-danger rounded-full shadow font-semibold border-2 border-red-300 hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed text-xs lg:text-sm">Eliminar</button>
            </div>
          </div>
        )}

        {/* Event List */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-glass p-2 sm:p-4 md:p-6">
          {loadingEvents ? (
            <div className="text-brand-700 text-base lg:text-lg font-semibold flex items-center justify-center py-16">A carregar eventos...</div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center py-16">
              <span className="text-4xl lg:text-6xl mb-4">🗓️</span>
              <div className="text-lg lg:text-xl text-brand-700 font-semibold mb-2 text-center">Ainda não existem eventos.</div>
              <div className="text-brand-400 text-center">Clique em "Criar Evento" para adicionar o primeiro!</div>
            </div>
          ) : (
            <div className="w-full overflow-x-auto relative" style={{ maxHeight: '60vh' }}>
              <table className="w-full min-w-[1000px] lg:min-w-[1200px] divide-y divide-brand-100">
                <thead className="bg-gradient-to-r from-brand-100 to-softpink-100 sticky top-0 z-10">
                  <tr>
                    {selectMode && (
                      <th className="px-2 py-2 sticky left-0 bg-gradient-to-r from-brand-100 to-softpink-100">
                        <input
                          type="checkbox"
                          className="h-5 w-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                          checked={selectedEvents.length > 0 && selectedEvents.length === filteredEvents.length}
                          onChange={handleToggleSelectAll}
                        />
                      </th>
                    )}
                    <th className="px-2 lg:px-4 py-3 text-left text-xs font-bold text-brand-900 uppercase tracking-wider">Título</th>
                    <th className="px-2 lg:px-4 py-3 text-left text-xs font-bold text-brand-900 uppercase tracking-wider">Tipo</th>
                    <th className="px-2 lg:px-4 py-3 text-left text-xs font-bold text-brand-900 uppercase tracking-wider">Estado</th>
                    <th className="px-2 lg:px-4 py-3 text-left text-xs font-bold text-brand-900 uppercase tracking-wider">Início</th>
                    <th className="px-2 lg:px-4 py-3 text-left text-xs font-bold text-brand-900 uppercase tracking-wider">Fim</th>
                    <th className="px-2 lg:px-4 py-3 text-left text-xs font-bold text-brand-900 uppercase tracking-wider">Inscritos</th>
                    <th className="px-2 lg:px-4 py-3 text-left text-xs font-bold text-brand-900 uppercase tracking-wider">Supervisor</th>
                    <th className="px-2 lg:px-4 py-3 text-left text-xs font-bold text-brand-900 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-50">
                  {filteredEvents
                    .sort((a, b) => {
                      // Sort by start time (earliest first)
                      const aStart = a.startTime ? new Date(a.startTime).getTime() : 0;
                      const bStart = b.startTime ? new Date(b.startTime).getTime() : 0;
                      return aStart - bStart;
                    })
                    .map((ev, idx) => (
                    <tr key={ev.id} className={`${idx % 2 === 0 ? 'bg-softpink-50/60' : 'bg-white/80'} ${selectedEvents.includes(ev.id) ? 'bg-blue-100' : ''}`}>
                      {selectMode && (
                        <td className="px-2 py-4 sticky left-0" style={{ backgroundColor: selectedEvents.includes(ev.id) ? '#DBEAFE' : (idx % 2 === 0 ? '#FEF6F3' : '#FFFFFF') }}>
                          <input
                            type="checkbox"
                            className="h-5 w-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                            checked={selectedEvents.includes(ev.id)}
                            onChange={() => handleToggleSelect(ev.id)}
                          />
                        </td>
                      )}
                      <td className="px-2 lg:px-4 py-3 whitespace-nowrap text-sm lg:text-base font-semibold text-brand-800">{ev.title}</td>
                      <td className="px-2 lg:px-4 py-3 whitespace-nowrap text-sm lg:text-lg">
                        {eventTypeMeta[ev.type] ? (
                          <span className={`inline-block px-2 lg:px-3 py-1 rounded-full text-xs lg:text-base font-bold shadow-sm ${eventTypeMeta[ev.type].className}`}>
                            {eventTypeMeta[ev.type].icon} {ev.type}
                          </span>
                        ) : (
                          <span className="inline-block px-2 lg:px-3 py-1 rounded-full text-xs lg:text-base font-bold shadow-sm bg-gray-100 text-gray-700">
                            {ev.type}
                          </span>
                        )}
                      </td>
                      <td className="px-2 lg:px-4 py-4 whitespace-nowrap">
                        <span className={`inline-block px-2 lg:px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                          ev.status === 'published' ? 'bg-success text-white' : 'bg-warning text-brand-900'
                        }`}>
                          {ev.status === 'published' ? '🟢 Publicado' : '🟡 Rascunho'}
                        </span>
                      </td>
                      <td className="px-2 lg:px-4 py-4 whitespace-nowrap text-brand-700 font-mono text-xs lg:text-sm">{
                        ev.startTime ? formatDate(new Date(ev.startTime), 'dd/MM/yyyy, HH:mm') : ''
                      }</td>
                      <td className="px-2 lg:px-4 py-4 whitespace-nowrap text-brand-700 font-mono text-xs lg:text-sm">{
                        ev.endTime ? formatDate(new Date(ev.endTime), 'dd/MM/yyyy, HH:mm') : ''
                      }</td>
                      <td className="px-2 lg:px-4 py-4 whitespace-nowrap text-sm lg:text-base font-semibold text-brand-800">
                        {typeof signUpCounts[ev.id] === 'undefined' ? (
                          <span className="inline-flex items-center gap-2"><span className="animate-spin rounded-full h-3 w-3 lg:h-4 lg:w-4 border-t-2 border-b-2 border-brand-500"></span>...</span>
                        ) : (
                          ev.maxCapacity === 0 ? 'Ilimitado' : `${signUpCounts[ev.id]} / ${ev.maxCapacity}`
                        )}
                      </td>
                      <td className="px-2 lg:px-4 py-4 whitespace-nowrap">
                        {ev.supervisor ? (
                          <span className="inline-block px-2 lg:px-3 py-1 rounded-full text-xs font-bold shadow-sm bg-green-200/80 text-green-800">
                            {ev.supervisor.emoji}{' '}
                            {ev.supervisor.name || (allUsers.find(u => u.id === ev.supervisor.id)?.idNumber) || '...'}
                          </span>
                        ) : (
                          <span className="inline-block px-2 lg:px-3 py-1 rounded-full text-xs font-bold shadow-sm bg-gray-200/80 text-gray-800">
                            N/A
                          </span>
                        )}
                      </td>
                      <td className="px-2 lg:px-4 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1 lg:gap-2">
                          <button
                            onClick={() => handleEdit(ev)}
                            className="bg-brand-100 text-brand-700 px-2 lg:px-3 py-1 rounded-full font-semibold text-xs lg:text-sm flex items-center gap-1 hover:bg-brand-200 transition shadow"
                            title="Editar"
                          >
                            ✏️ <span className="hidden sm:inline">Editar</span>
                          </button>
                          <button
                            onClick={() => handleDelete(ev.id)}
                            className="bg-danger text-white px-2 lg:px-3 py-1 rounded-full font-semibold text-xs lg:text-sm flex items-center gap-1 hover:bg-danger/80 transition shadow"
                            title="Eliminar"
                          >
                            🗑️ <span className="hidden sm:inline">Eliminar</span>
                          </button>
                          {ev.status === 'draft' ? (
                            <button
                              onClick={() => handlePublish(ev.id)}
                              className="bg-success text-white px-2 lg:px-3 py-1 rounded-full font-semibold text-xs lg:text-sm flex items-center gap-1 hover:bg-success/80 transition shadow"
                              title="Publicar"
                            >
                              🟢 <span className="hidden sm:inline">Publicar</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUnpublish(ev.id)}
                              className="bg-warning text-brand-900 px-2 lg:px-3 py-1 rounded-full font-semibold text-xs lg:text-sm flex items-center gap-1 hover:bg-warning/80 transition shadow"
                              title="Despublicar"
                            >
                              🟡 <span className="hidden sm:inline">Despublicar</span>
                            </button>
                          )}
                          <button
                            className="px-2 lg:px-3 py-1 bg-brand-100 text-brand-700 rounded-full shadow hover:bg-brand-200 transition-all duration-200 text-xs font-semibold border border-brand-200"
                            onClick={() => { setForceSignUpModalOpen(true); setForceSignUpEvent(ev); }}
                          >
                            <span className="hidden sm:inline">Forçar Inscrição</span>
                            <span className="sm:hidden">Forçar</span>
                          </button>
                          {signUpError && signUpLoading === null && (
                            <div className="text-danger text-xs mt-1">{signUpError}</div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {/* New Multi-Step Event Modal */}
        <EventMultiStepModal
          isOpen={showEventModal}
          onClose={() => setShowEventModal(false)}
          onCreate={handleCreateEvent}
        />
        <EditEventModal
          isOpen={showEditModal}
          onClose={() => { setShowEditModal(false); setEditEvent(null); }}
          event={editEvent}
          onUpdate={handleUpdateEvent}
        />
        <ConfirmationModal
          isOpen={confirmation.isOpen}
          onClose={() => setConfirmation({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
          onConfirm={confirmation.onConfirm}
          title={confirmation.title}
          message={confirmation.message}
          isLoading={actionLoading}
        />
        <AssignSupervisorModal
          isOpen={assignSupervisorModalOpen}
          onClose={() => setAssignSupervisorModalOpen(false)}
          isLoading={actionLoading}
          onAssign={async (supervisorId: string | null, supervisorName: string | null, supervisorEmoji: string | null) => {
            setActionLoading(true);
            await batchAssignSupervisor(selectedEvents, supervisorId, supervisorName, supervisorEmoji);
            await refreshEvents();
            setSelectedEvents([]);
            setAssignSupervisorModalOpen(false);
            setActionLoading(false);
          }}
        />
        {forceSignUpModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-[#D29674] w-full max-w-md p-8 flex flex-col items-center">
              <button className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-gray-700" onClick={() => setForceSignUpModalOpen(false)}>&times;</button>
              <h2 className="text-xl font-bold text-brand-700 mb-4">Forçar Inscrição</h2>
              <input
                type="text"
                placeholder="IdNumber do utilizador"
                value={forceSignUpIdNumber}
                onChange={e => setForceSignUpIdNumber(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-brand-200 focus:ring-2 focus:ring-brand-400 focus:outline-none"
              />
              <button
                className="w-full mt-4 px-4 py-2 rounded-lg bg-[#D29674] text-white font-bold shadow hover:bg-[#b97b54] transition text-base"
                onClick={handleForceSignUp}
                disabled={signUpLoading === forceSignUpEvent?.id}
              >
                {signUpLoading === forceSignUpEvent?.id ? 'A inscrever...' : 'Inscrever'}
              </button>
              {signUpError && <div className="text-danger text-sm mt-2 text-center">{signUpError}</div>}
              {forceSignUpSuccess && <div className="text-success text-sm mt-2 text-center">{forceSignUpSuccess}</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function formatWeekDisplay(dateString: string): string {
  if (!dateString) return 'Selecionar semana';
  try {
    const selected = new Date(dateString);
    const dayOfWeek = selected.getDay();
    const weekStart = new Date(selected);
    weekStart.setDate(selected.getDate() - dayOfWeek);
    const weekEnd = new Date(selected);
    weekEnd.setDate(selected.getDate() + (6 - dayOfWeek));
    const formatDate = (d: Date) => d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
    return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
  } catch(e) {
    return 'Selecionar semana';
  }
}

export default EventManagement; 