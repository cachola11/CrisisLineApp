import React, { useState, useEffect } from 'react';
import { addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameDay, isSameMonth, format, startOfDay } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import { getEventsForUser, getSignUpsForEvent, signUpUserToEvent, cancelSignUpForEvent, getAllEventSignUps } from '../services/eventService';
import { getAllUsers } from '../services/userService';

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const EVENT_STYLES: Record<string, { dot: string; bg: string; text: string; border: string; icon: string }> = {
  'Turno':              { dot: 'bg-blue-500',   bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-l-blue-400',   icon: '☎️' },
  'Teambuilding':       { dot: 'bg-amber-500',  bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-l-amber-400',  icon: '🎉' },
  'Evento Aberto':      { dot: 'bg-pink-500',   bg: 'bg-pink-50',   text: 'text-pink-700',   border: 'border-l-pink-400',   icon: '📢' },
  'Reunião Geral':      { dot: 'bg-emerald-500',bg: 'bg-emerald-50',text: 'text-emerald-700', border: 'border-l-emerald-400',icon: '👥' },
  'Reunião Coordenação':{ dot: 'bg-violet-500', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-l-violet-400', icon: '💻' },
};

const getEventStyle = (type: string) => EVENT_STYLES[type] || { dot: 'bg-gray-500', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-l-gray-400', icon: '📌' };

const SupervisorInfo: React.FC<{ supervisor: any; users: any[] }> = ({ supervisor, users }) => {
  if (!supervisor || (!supervisor.id && !supervisor.name)) return null;

  let displayName = supervisor.name;
  if (!displayName && supervisor.id) {
    const user = users.find(u => u.id === supervisor.id);
    displayName = user?.idNumber || 'ID: ...';
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-1.5 py-0.5">
      {supervisor.emoji && <span>{supervisor.emoji}</span>}
      {displayName}
    </span>
  );
};

const ChevronLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const ChevronRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
  </svg>
);

const Calendar: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDayEvents, setModalDayEvents] = useState<any[]>([]);
  const [signUpsMap, setSignUpsMap] = useState<{ [eventId: string]: any[] }>({});
  const [signUpLoading, setSignUpLoading] = useState<string | null>(null);
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        console.log('Fetching calendar data for user role:', user.role);
        const [userEvents, allSignUps, users] = await Promise.all([
          getEventsForUser(user.role),
          getAllEventSignUps(),
          getAllUsers()
        ]);
        console.log('Calendar data fetched successfully:', {
          events: userEvents.length,
          signUps: allSignUps.length,
          users: users.length
        });
        setEvents(userEvents);
        setAllUsers(users);
        const signUpsObj: { [eventId: string]: any[] } = {};
        for (const su of allSignUps) {
          if (!signUpsObj[su.eventId]) signUpsObj[su.eventId] = [];
          signUpsObj[su.eventId].push(su);
        }
        setSignUpsMap(signUpsObj);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching calendar data:', error);
        setLoading(false);
        setEvents([]);
        setAllUsers([]);
        setSignUpsMap({});
      }
    };
    fetchData();
  }, [user]);

  const today = new Date();
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days: Date[] = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const todayStart = startOfDay(new Date());
  const userUpcomingEvents = user
    ? events.filter(ev => {
        const evDate = new Date(ev.startTime);
        const signUps = signUpsMap[ev.id] || [];
        return evDate >= todayStart && signUps.some(su => su.userId === user.uid);
      }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    : [];

  const getEventsForDay = (date: Date) => {
    return events
      .filter(ev => isSameDay(new Date(ev.startTime), date))
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    const sortedDayEvents = getEventsForDay(date);
    setModalDayEvents(sortedDayEvents);
    setModalOpen(true);
    setSignUpError(null);
  };

  const handleSignUp = async (event: any) => {
    if (!user) return;
    setSignUpLoading(event.id);
    setSignUpError(null);
    try {
      await signUpUserToEvent(event.id, user.uid);
      const updated = await getSignUpsForEvent(event.id);
      setSignUpsMap(prev => ({ ...prev, [event.id]: updated }));
    } catch (err: any) {
      setSignUpError(err.message || 'Erro ao inscrever-se.');
    } finally {
      setSignUpLoading(null);
    }
  };

  const handleCancelSignUp = async (event: any) => {
    if (!user) return;
    setSignUpLoading(event.id);
    setSignUpError(null);
    try {
      await cancelSignUpForEvent(event.id, user.uid);
      const updated = await getSignUpsForEvent(event.id);
      setSignUpsMap(prev => ({ ...prev, [event.id]: updated }));
    } catch (err: any) {
      setSignUpError(err.message || 'Erro ao cancelar inscrição.');
    } finally {
      setSignUpLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-[3px] border-brand-200 border-t-brand-500 animate-spin" />
          <p className="text-sm text-gray-400 font-medium">A carregar calendário...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500 font-medium">Por favor, faça login para ver o calendário.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col xl:flex-row gap-6">
      {/* Calendar grid */}
      <div className="flex-1 min-w-0">
        <div className="rounded-xl border border-gray-100 shadow-card overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-brand-500 to-brand-400">
            <h1 className="text-lg font-bold text-white">Calendário</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedDate(addDays(selectedDate, -30))}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ChevronLeft />
              </button>
              <span className="text-sm font-semibold text-white min-w-[140px] text-center capitalize">
                {format(monthStart, 'MMMM yyyy', { locale: pt })}
              </span>
              <button
                onClick={() => setSelectedDate(addDays(selectedDate, 30))}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ChevronRight />
              </button>
            </div>
          </div>

          {/* Week day headers */}
          <div className="grid grid-cols-7 bg-brand-50 border-b border-brand-100">
            {WEEK_DAYS.map((d, i) => (
              <div key={i} className="py-2.5 text-center text-xs font-semibold text-brand-600 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {days.map((date, idx) => {
              const dayEvents = getEventsForDay(date);
              const isCurrentMonth = isSameMonth(date, monthStart);
              const isToday = isSameDay(date, today);

              return (
                <div
                  key={idx}
                  className={`relative min-h-[80px] lg:min-h-[130px] p-1.5 lg:p-2 border-b border-r cursor-pointer transition-colors duration-150 ${
                    isCurrentMonth
                      ? isToday
                        ? 'bg-brand-50/60 border-brand-100 hover:bg-brand-50'
                        : 'bg-white border-gray-100 hover:bg-softpink-50'
                      : 'bg-gray-50/50 border-gray-50'
                  }`}
                  onClick={() => handleDayClick(date)}
                >
                  {/* Day number */}
                  <div className={`text-xs font-bold mb-1 ${
                    isToday
                      ? 'h-6 w-6 rounded-full bg-brand-500 text-white flex items-center justify-center'
                      : isCurrentMonth
                        ? 'text-brand-800 pl-0.5'
                        : 'text-gray-300 pl-0.5'
                  }`}>
                    {format(date, 'd')}
                  </div>

                  {/* Event cards */}
                  <div className="flex flex-col gap-0.5 lg:gap-1">
                    {dayEvents.slice(0, 3).map(ev => {
                      const style = getEventStyle(ev.type);
                      const signUps = signUpsMap[ev.id] || [];
                      const isFull = ev.maxCapacity > 0 && signUps.length >= ev.maxCapacity;
                      const userIdNumbers = signUps.map(su => {
                        const u = allUsers.find((usr: any) => usr.id === su.userId);
                        return u ? u.idNumber : su.userId;
                      });

                      return (
                        <div
                          key={ev.id}
                          className={`rounded-md px-1.5 py-0.5 lg:py-1 ${style.bg} ${style.text} transition-opacity ${isFull ? 'opacity-40' : ''}`}
                        >
                          <div className="flex items-center gap-1">
                            <span className={`shrink-0 h-1.5 w-1.5 rounded-full ${style.dot}`} />
                            <span className="truncate font-semibold text-[11px] hidden sm:inline">{ev.title}</span>
                            <span className="sm:hidden text-[11px]">{style.icon}</span>
                            <span className={`ml-auto shrink-0 h-1.5 w-1.5 rounded-full hidden sm:inline-block ${ev.status === 'published' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                          </div>
                          {/* User ID previews */}
                          {signUps.length > 0 && (
                            <div className="flex gap-0.5 flex-wrap mt-0.5">
                              {signUps.length <= 2
                                ? userIdNumbers.map((idNum, i) => (
                                    <span key={i} className="bg-white/70 text-[10px] font-mono rounded px-1 border border-black/5">{idNum}</span>
                                  ))
                                : <span className="bg-white/70 text-[10px] font-mono rounded px-1 border border-black/5">{signUps.length} inscritos</span>
                              }
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <span className="text-[10px] text-brand-400 font-semibold pl-0.5">+{dayEvents.length - 3} mais</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right panel: This week */}
      <div className="w-full xl:w-80 shrink-0 order-first xl:order-last">
        <div className="rounded-xl border border-gray-100 shadow-card overflow-hidden">
          <div className="px-5 py-4 bg-gradient-to-r from-brand-500 to-brand-400">
            <h2 className="text-sm font-bold text-white">Os Meus eventos</h2>
          </div>

          <div className="p-4 bg-white">
            {userUpcomingEvents.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <div className="h-10 w-10 rounded-full bg-brand-50 flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm text-gray-400">Não tem eventos futuros.</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {userUpcomingEvents.map(ev => {
                  const style = getEventStyle(ev.type);
                  const signUps = signUpsMap[ev.id] || [];
                  const userIdNumbers = signUps.slice(0, 2).map(su => {
                    const u = allUsers.find((usr: any) => usr.id === su.userId);
                    return u ? u.idNumber : su.userId;
                  });

                  return (
                    <li key={ev.id} className={`rounded-lg border border-gray-100 border-l-[3px] ${style.border} ${style.bg} p-3 hover:shadow-soft transition-shadow`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm">{style.icon}</span>
                        <span className={`font-semibold text-sm truncate ${style.text}`}>{ev.title}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">
                        {format(new Date(ev.startTime), 'EEEE, d MMM', { locale: pt })} · {format(new Date(ev.startTime), 'HH:mm')}–{format(new Date(ev.endTime), 'HH:mm')}
                      </p>
                      <SupervisorInfo supervisor={ev.supervisor} users={allUsers} />
                      {userIdNumbers.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-1.5">
                          {userIdNumbers.map((idNum, idx) => (
                            <span key={idx} className="bg-white/80 text-gray-600 rounded px-1.5 py-0.5 text-[11px] font-mono border border-gray-200">{idNum}</span>
                          ))}
                          {signUps.length > 2 && (
                            <span className="bg-white/80 text-gray-400 rounded px-1.5 py-0.5 text-[11px] font-mono border border-gray-200">+{signUps.length - 2}</span>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Modal for day events */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={() => setModalOpen(false)} />

          {/* Panel */}
          <div className="relative bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-lg max-h-[85vh] flex flex-col animate-scale-in">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <h2 className="text-sm font-bold text-gray-800">
                {format(selectedDate, "d 'de' MMMM yyyy", { locale: pt })}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto p-5">
              {modalDayEvents.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <p className="text-sm text-gray-400">Nenhum evento neste dia.</p>
                </div>
              ) : (
                <ul className="flex flex-col gap-3">
                  {modalDayEvents.map(ev => {
                    const style = getEventStyle(ev.type);
                    const signUps = signUpsMap[ev.id] || [];
                    const userIdNumbers = signUps.map(su => {
                      const u = allUsers.find((usr: any) => usr.id === su.userId);
                      return u ? u.idNumber : su.userId;
                    });
                    const isUserSignedUp = userIdNumbers.includes(user?.idNumber);
                    const isFull = ev.maxCapacity > 0 && signUps.length >= ev.maxCapacity;

                    return (
                      <li
                        key={ev.id}
                        className={`rounded-xl border border-l-[3px] p-4 transition-opacity duration-300 ${style.border} ${
                          ev.status === 'published' ? `${style.bg} border-gray-100` : 'bg-gray-50/50 border-gray-200'
                        } ${isFull && !isUserSignedUp ? 'opacity-50' : ''}`}
                      >
                        {/* Event header */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <span className={`shrink-0 h-2.5 w-2.5 rounded-full ${style.dot}`} />
                            <span className="font-semibold text-sm text-gray-800">{ev.title}</span>
                            <span className="text-sm">{style.icon}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              ev.status === 'published'
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                : 'bg-amber-50 text-amber-600 border border-amber-200'
                            }`}>
                              {ev.status === 'published' ? 'Publicado' : 'Rascunho'}
                            </span>
                          </div>
                          <span className="shrink-0 text-xs font-semibold text-gray-500">
                            {ev.maxCapacity === 0 ? '∞' : `${signUps.length}/${ev.maxCapacity}`}
                          </span>
                        </div>

                        {/* Time */}
                        <p className="text-xs text-gray-400 font-mono mb-2">
                          {format(new Date(ev.startTime), 'HH:mm')} – {format(new Date(ev.endTime), 'HH:mm')}
                        </p>

                        {/* Description */}
                        {ev.description && (
                          <p className="text-xs text-gray-500 leading-relaxed mb-3 max-h-20 overflow-y-auto">{ev.description}</p>
                        )}

                        {/* Supervisor */}
                        {ev.supervisor && (ev.supervisor.id || ev.supervisor.name) && (
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-medium text-gray-400">Supervisor:</span>
                            <SupervisorInfo supervisor={ev.supervisor} users={allUsers} />
                          </div>
                        )}

                        {/* Sign-ups */}
                        <div className="border-t border-gray-100 pt-3">
                          <span className="text-xs font-medium text-gray-400 mb-1.5 block">Inscritos</span>
                          <div className="flex flex-wrap gap-1.5">
                            {userIdNumbers.length > 0 ? userIdNumbers.map((idNum, idx) => (
                              <span key={idx} className="bg-gray-50 text-gray-600 rounded-md px-2 py-0.5 text-[11px] font-mono border border-gray-100">{idNum}</span>
                            )) : (
                              <span className="text-xs text-gray-300">Ninguém inscrito.</span>
                            )}
                          </div>
                        </div>

                        {/* Sign up / cancel button */}
                        {user && ev.status === 'published' && (
                          isUserSignedUp ? (
                            <button
                              className="w-full mt-3 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                              onClick={() => handleCancelSignUp(ev)}
                              disabled={signUpLoading === ev.id}
                            >
                              {signUpLoading === ev.id ? 'A processar...' : 'Cancelar inscrição'}
                            </button>
                          ) : (
                            <button
                              className="w-full mt-3 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => handleSignUp(ev)}
                              disabled={signUpLoading === ev.id || isFull}
                            >
                              {signUpLoading === ev.id ? 'A inscrever...' : isFull ? 'Evento cheio' : 'Inscrever-se'}
                            </button>
                          )
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              {signUpError && <p className="text-danger-600 text-xs mt-3 text-center font-medium">{signUpError}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
