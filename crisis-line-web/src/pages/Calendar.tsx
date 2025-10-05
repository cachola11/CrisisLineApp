import React, { useState, useEffect } from 'react';
import { addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameDay, isSameMonth, format, isThisWeek } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import { getEventsForUser, getSignUpsForEvent, signUpUserToEvent, cancelSignUpForEvent, getAllEventSignUps } from '../services/eventService';
import { getAllUsers } from '../services/userService';

const WEEK_DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

// Helper component for supervisor display
const SupervisorInfo: React.FC<{ supervisor: any, users: any[] }> = ({ supervisor, users }) => {
  if (!supervisor || (!supervisor.id && !supervisor.name)) return null;

  let displayName = supervisor.name;
  if (!displayName && supervisor.id) {
    const user = users.find(u => u.id === supervisor.id);
    displayName = user?.idNumber || 'ID: ...';
  }

  return (
    <div className="mt-1">
      <span className="bg-success/20 text-success-700 rounded px-1.5 py-0.5 text-xs font-semibold border border-success-300 flex items-center gap-1">
        {supervisor.emoji} {displayName}
      </span>
    </div>
  );
};

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

  // Fetch all events and sign-ups
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
        
        // Build signUpsMap: { [eventId]: signUp[] }
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
        // Set empty arrays to prevent infinite loading
        setEvents([]);
        setAllUsers([]);
        setSignUpsMap({});
      }
    };
    fetchData();
  }, [user]);

  // Calendar grid logic
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

  // Events for the current week that the user is signed up for
  const userWeekEvents = user
    ? events.filter(ev => {
        const evDate = new Date(ev.startTime);
        const signUps = signUpsMap[ev.id] || [];
        return isThisWeek(evDate, { weekStartsOn: 0 }) && signUps.some(su => su.userId === user.uid);
      }).sort((a, b) => {
        // Sort events by startTime in ascending order (earliest first)
        const timeA = new Date(a.startTime).getTime();
        const timeB = new Date(b.startTime).getTime();
        return timeA - timeB;
      })
    : [];

  // Events for a given day
  const getEventsForDay = (date: Date) => {
    const dayEvents = events.filter(ev => isSameDay(new Date(ev.startTime), date));
    // Sort events by startTime in ascending order (earliest first)
    return dayEvents.sort((a, b) => {
      const timeA = new Date(a.startTime).getTime();
      const timeB = new Date(b.startTime).getTime();
      return timeA - timeB;
    });
  };

  // Handle day click
  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    const dayEvents = getEventsForDay(date);
    // Sort events by startTime in ascending order (earliest first)
    const sortedDayEvents = dayEvents.sort((a, b) => {
      const timeA = new Date(a.startTime).getTime();
      const timeB = new Date(b.startTime).getTime();
      return timeA - timeB;
    });
    setModalDayEvents(sortedDayEvents);
    setModalOpen(true);
    setSignUpError(null);
  };

  // Sign up/cancel logic for modal
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
      <div className="min-h-screen flex items-center justify-center bg-softpink-100">
        <div className="flex flex-col items-center gap-4">
          <span className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-500"></span>
          <span className="text-brand-700 text-xl font-bold">A carregar calendário...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-softpink-100">
        <div className="flex flex-col items-center gap-4">
          <span className="text-brand-700 text-xl font-bold">Por favor, faça login para ver o calendário.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-softpink-100 flex flex-col lg:flex-row items-start justify-center gap-4 lg:gap-8 p-4 lg:p-8">
      {/* Calendar grid */}
      <div className="bg-white rounded-3xl shadow-glass p-4 lg:p-6 w-full max-w-7xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
          <h1 className="text-2xl lg:text-3xl font-extrabold text-brand-700">Calendário</h1>
          <div className="flex gap-2 items-center">
            <button onClick={() => setSelectedDate(addDays(selectedDate, -30))} className="px-3 py-1 rounded bg-brand-100 text-brand-700 hover:bg-brand-200 transition">&lt;</button>
            <span className="font-bold text-sm lg:text-lg whitespace-nowrap">{format(monthStart, 'MMMM yyyy', { locale: pt })}</span>
            <button onClick={() => setSelectedDate(addDays(selectedDate, 30))} className="px-3 py-1 rounded bg-brand-100 text-brand-700 hover:bg-brand-200 transition">&gt;</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 lg:gap-4 mb-2">
          {WEEK_DAYS.map((d, i) => (
            <div key={i} className="text-center font-bold text-brand-700 text-xs lg:text-sm">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 lg:gap-4">
          {days.map((date, idx) => {
            const dayEvents = getEventsForDay(date);
            return (
              <div
                key={idx}
                className={`rounded-xl min-h-[80px] lg:min-h-[160px] p-1 lg:p-3 cursor-pointer border transition-all flex flex-col gap-1 lg:gap-2 ${isSameMonth(date, monthStart) ? 'bg-softpink-50 hover:bg-softpink-100 border-brand-100' : 'bg-gray-50 text-gray-400 border-gray-100'} ${isSameDay(date, today) ? 'ring-2 ring-brand-500' : ''}`}
                onClick={() => handleDayClick(date)}
              >
                <div className="text-sm lg:text-base font-bold text-brand-700 mb-1 lg:mb-2 text-right">{format(date, 'd')}</div>
                {dayEvents.map(ev => {
                  const signUps = signUpsMap[ev.id] || [];
                  const userIdNumbers = signUps.map(su => {
                    const user = allUsers.find((u: any) => u.id === su.userId);
                    return user ? user.idNumber : su.userId;
                  });
                  
                  // Check if event is full
                  const isFull = ev.maxCapacity > 0 && signUps.length >= ev.maxCapacity;
                  
                  // Color scheme for event type
                  const eventColor =
                    ev.type === 'Turno' ? 'bg-blue-100 text-blue-700' :
                    ev.type === 'Teambuilding' ? 'bg-yellow-100 text-yellow-700' :
                    ev.type === 'Evento Aberto' ? 'bg-pink-100 text-pink-700' :
                    ev.type === 'Reunião Geral' ? 'bg-green-100 text-green-700' :
                    'bg-purple-100 text-purple-700';
                  
                  // Status ball color
                  const statusBall = ev.status === 'published' ? 'bg-green-500' : 'bg-yellow-400';
                  
                  // Apply faded effect for full events
                  const fullEventClasses = isFull ? 'opacity-50 grayscale-[0.3]' : '';
                  
                  return (
                    <div key={ev.id} className={`rounded-lg px-1 lg:px-2 py-0.5 lg:py-1 flex flex-col gap-0.5 lg:gap-1 ${eventColor} shadow-sm ${fullEventClasses} transition-all duration-300`}>
                      <div className="flex items-center gap-1 lg:gap-2">
                        <span className="text-sm lg:text-lg">
                          {ev.type === 'Turno' ? '☎️' : ev.type === 'Teambuilding' ? '🎉' : ev.type === 'Evento Aberto' ? '📢' : ev.type === 'Reunião Geral' ? '👥' : '💻'}
                        </span>
                        <span className="font-semibold text-xs truncate max-w-[60px] lg:max-w-[90px]" title={ev.title}>{ev.title}</span>
                        <span className={`ml-1 w-2 h-2 lg:w-3 lg:h-3 rounded-full inline-block border border-white shadow ${statusBall}`}></span>
                      </div>
                      
                      {/* Supervisor and Sign-ups - Hidden on mobile to save space */}
                      <div className="hidden lg:flex flex-col">
                        {/* Supervisor Information */}
                        <SupervisorInfo supervisor={ev.supervisor} users={allUsers} />

                        {/* Sign-ups Information */}
                        <div className="flex gap-1 flex-wrap mt-1">
                          {signUps.length === 0 ? null :
                            signUps.length <= 2
                              ? userIdNumbers.map((idNum, idx) => (
                                  <span key={idx} className="bg-white/80 text-brand-700 rounded px-1 text-xs font-mono border border-brand-100">{idNum}</span>
                                ))
                              : <span className="bg-white/80 text-brand-700 rounded px-1 text-xs font-mono border border-brand-100">{signUps.length} inscritos</span>
                          }
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      {/* Right panel: User's week events */}
      <div className="bg-white rounded-3xl shadow-glass p-4 lg:p-6 w-full lg:max-w-xs lg:min-w-[320px] order-first lg:order-last">
        <h2 className="text-lg lg:text-xl font-extrabold text-brand-700 mb-4 flex items-center gap-2">Esta semana <span className="text-xl lg:text-2xl">📅</span></h2>
        {userWeekEvents.length === 0 ? (
          <div className="text-brand-400 text-base">Não tem eventos esta semana.</div>
        ) : (
          <ul className="flex flex-col gap-3">
            {userWeekEvents.map(ev => {
              const signUps = signUpsMap[ev.id] || [];
              const userIdNumbers = signUps.slice(0, 2).map(su => {
                const user = allUsers.find((u: any) => u.id === su.userId);
                return user ? user.idNumber : su.userId;
              });
              
              // Color scheme for event type
              const eventColor =
                ev.type === 'Turno' ? 'bg-blue-100 text-blue-700' :
                ev.type === 'Teambuilding' ? 'bg-yellow-100 text-yellow-700' :
                ev.type === 'Evento Aberto' ? 'bg-pink-100 text-pink-700' :
                ev.type === 'Reunião Geral' ? 'bg-green-100 text-green-700' :
                'bg-purple-100 text-purple-700';
              
              return (
                <li key={ev.id} className={`rounded-xl border border-brand-100 px-4 py-3 flex flex-col gap-1 ${eventColor}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {ev.type === 'Turno' ? '☎️' : ev.type === 'Teambuilding' ? '🎉' : ev.type === 'Evento Aberto' ? '📢' : ev.type === 'Reunião Geral' ? '👥' : '💻'}
                    </span>
                    <span className="font-bold text-base truncate max-w-[120px]">{ev.title}</span>
                  </div>
                  <div className="text-xs text-brand-400">{format(new Date(ev.startTime), 'EEEE, d MMMM', { locale: pt })} {format(new Date(ev.startTime), 'HH:mm')} - {format(new Date(ev.endTime), 'HH:mm')}</div>
                  
                  {/* Supervisor and Sign-ups */}
                  <div className="flex flex-col mt-1">
                    <SupervisorInfo supervisor={ev.supervisor} users={allUsers} />
                    <div className="flex gap-1 flex-wrap mt-1">
                      {userIdNumbers.map((idNum, idx) => (
                        <span key={idx} className="bg-white/80 text-brand-700 rounded px-1 text-xs font-mono border border-brand-100">{idNum}</span>
                      ))}
                      {signUps.length > 2 && (
                        <span className="bg-white/80 text-brand-700 rounded px-1 text-xs font-mono border border-brand-100">+{signUps.length - 2}</span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {/* Modal for day events */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50 p-4">
          <div className="bg-white rounded-2xl shadow-lg border-2 border-[#D29674] w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col items-center relative">
            <button className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-gray-700 z-10" onClick={() => setModalOpen(false)}>&times;</button>
            <div className="p-6 lg:p-8 w-full">
              <h2 className="text-lg lg:text-xl font-bold text-brand-700 mb-4 pr-8">Eventos em {format(selectedDate, 'd MMMM yyyy', { locale: pt })}</h2>
              {modalDayEvents.length === 0 ? (
                <div className="text-brand-400">Nenhum evento neste dia.</div>
              ) : (
                <ul className="w-full flex flex-col gap-4 max-h-[50vh] overflow-y-auto">
                  {modalDayEvents.map(ev => {
                    const signUps = signUpsMap[ev.id] || [];
                    const userIdNumbers = signUps.map(su => {
                      const user = allUsers.find((u: any) => u.id === su.userId);
                      return user ? user.idNumber : su.userId;
                    });
                    const isUserSignedUp = userIdNumbers.includes(user?.idNumber);
                    const isFull = ev.maxCapacity > 0 && signUps.length >= ev.maxCapacity;
                    
                    // Apply faded effect for full events
                    const fullEventClasses = isFull ? 'opacity-50 grayscale-[0.3]' : '';
                    
                    return (
                      <li key={ev.id} className={`rounded-xl border p-3 lg:p-4 flex flex-col gap-2 ${ev.status === 'published' ? 'border-brand-200' : 'border-gray-200 bg-gray-50'} ${fullEventClasses} transition-all duration-300`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-lg lg:text-xl">
                              {ev.type === 'Turno' ? '☎️' : ev.type === 'Teambuilding' ? '🎉' : ev.type === 'Evento Aberto' ? '📢' : ev.type === 'Reunião Geral' ? '👥' : '💻'}
                            </span>
                            <span className="font-bold text-base lg:text-lg text-brand-700">{ev.title}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${ev.status === 'published' ? 'bg-success text-white' : 'bg-warning text-brand-900'}`}>{ev.status}</span>
                          </div>
                          <span className="text-sm lg:text-base font-semibold text-brand-800">
                            {ev.maxCapacity === 0 ? 'Ilimitado' : `${signUps.length} / ${ev.maxCapacity}`}
                          </span>
                        </div>
                        <div className="text-sm text-brand-500 font-mono">{format(new Date(ev.startTime), 'HH:mm')} - {format(new Date(ev.endTime), 'HH:mm')}</div>
                        
                        {/* Event Description */}
                        {ev.description && (
                          <div className="mt-2 border-t border-brand-100 pt-2">
                            <p className="text-sm text-brand-800 max-h-20 lg:max-h-24 overflow-y-auto">{ev.description}</p>
                          </div>
                        )}
                        
                        {/* Supervisor Information */}
                        {ev.supervisor && (
                          <div className="mt-2 border-t border-brand-100 pt-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-brand-700">Supervisor:</span>
                              <SupervisorInfo supervisor={ev.supervisor} users={allUsers} />
                            </div>
                          </div>
                        )}
                        
                        <div className="flex flex-col gap-2 mt-2">
                          <div className="border-t border-brand-100 pt-2">
                            <span className="text-sm font-semibold text-brand-700 mb-1 block">Inscritos:</span>
                            <div className="flex flex-wrap gap-2">
                              {userIdNumbers.length > 0 ? userIdNumbers.map((idNum, idx) => (
                                <span key={idx} className="bg-brand-100 text-brand-700 rounded px-1.5 py-0.5 text-xs font-mono">{idNum}</span>
                              )) : (
                                <span className="text-sm text-brand-400">Ninguém inscrito.</span>
                              )}
                            </div>
                          </div>
                          {user && ev.status === 'published' && (
                            isUserSignedUp ? (
                              <button
                                className="w-full px-4 py-2 rounded-lg bg-gray-200 text-brand-700 font-bold shadow hover:bg-gray-300 transition text-sm lg:text-base mt-2"
                                onClick={() => handleCancelSignUp(ev)}
                                disabled={signUpLoading === ev.id}
                              >
                                Cancelar inscrição
                              </button>
                            ) : (
                              <button
                                className="w-full px-4 py-2 rounded-lg bg-[#D29674] text-white font-bold shadow hover:bg-[#b97b54] transition text-sm lg:text-base mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => handleSignUp(ev)}
                                disabled={signUpLoading === ev.id || isFull}
                              >
                                {signUpLoading === ev.id ? 'A inscrever...' : isFull ? 'Evento cheio' : 'Inscrever-se'}
                              </button>
                            )
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              {signUpError && <div className="text-danger text-sm mt-2 text-center">{signUpError}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar; 