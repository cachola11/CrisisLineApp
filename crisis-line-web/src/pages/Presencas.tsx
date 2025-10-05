import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllUsers } from '../services/userService';
import { getAttendanceDates, addAttendanceDate, deleteAttendanceDate, getAllAttendanceRecords } from '../services/attendanceService';
import { format, parseISO, compareAsc } from 'date-fns';
import { pt } from 'date-fns/locale';

interface AttendanceRecord {
  userId: string;
  date: string;
  status: 'present' | 'absent';
}

interface User {
  id: string;
  idNumber: string;
  name?: string;
  email?: string;
}

const Presencas: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<{ [key: string]: AttendanceRecord }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddDateModal, setShowAddDateModal] = useState(false);
  const [showDeleteDateModal, setShowDeleteDateModal] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [dateToDelete, setDateToDelete] = useState('');

  // Check if user has permission to access this page
  const hasPermission = user && (user.role === 'Coordenador' || user.role === 'Administrador');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch users and dates in parallel
      const [allUsers, savedDates, attendanceRecords] = await Promise.all([
        getAllUsers(),
        getAttendanceDates(),
        getAllAttendanceRecords()
      ]);
      
      // Sort users by ID number in ascending order (same as Admin screen)
      const sortedUsers = allUsers.sort((a, b) => a.idNumber.localeCompare(b.idNumber));
      setUsers(sortedUsers);
      
      // Set dates from database
      setDates(savedDates);
      
      // Create attendance map from existing records
      const initialMap: { [key: string]: AttendanceRecord } = {};
      
      // Initialize all users as absent for all dates
      sortedUsers.forEach(user => {
        savedDates.forEach(date => {
          const key = `${user.idNumber}-${date}`;
          initialMap[key] = {
            userId: user.idNumber,
            date: date,
            status: 'absent'
          };
        });
      });
      
      // Override with actual attendance records
      attendanceRecords.forEach(record => {
        const key = `${record.userId}-${record.date}`;
        if (initialMap[key]) {
          initialMap[key].status = record.status;
        }
      });
      
      setAttendanceMap(initialMap);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasPermission) {
      fetchData();
    }
  }, [hasPermission, fetchData]);

  const handleAttendanceToggle = (userId: string, date: string) => {
    const key = `${userId}-${date}`;
    const currentRecord = attendanceMap[key];
    const newStatus = currentRecord?.status === 'present' ? 'absent' : 'present';
    
    setAttendanceMap(prev => ({
      ...prev,
      [key]: {
        userId,
        date,
        status: newStatus
      }
    }));
  };

  const handleAddDate = async () => {
    if (!newDate) return;
    
    // Check if date already exists
    if (dates.includes(newDate)) {
      alert('Esta data já existe na lista.');
      return;
    }
    
    try {
      console.log('Adding date:', newDate);
      
      // Save the date to the database
      await addAttendanceDate(newDate);
      
      // Add new date and sort from older to newer (left to right)
      const updatedDates = [...dates, newDate].sort((a, b) => compareAsc(parseISO(a), parseISO(b)));
      setDates(updatedDates);
      
      // Initialize attendance for all users for the new date
      const newAttendanceMap = { ...attendanceMap };
      users.forEach(user => {
        const key = `${user.idNumber}-${newDate}`;
        newAttendanceMap[key] = {
          userId: user.idNumber,
          date: newDate,
          status: 'absent'
        };
      });
      setAttendanceMap(newAttendanceMap);
      
      setNewDate('');
      setShowAddDateModal(false);
      
      console.log('Date added successfully:', newDate);
    } catch (error) {
      console.error('Error adding date:', error);
      alert(`Erro ao adicionar data: ${error.message}`);
    }
  };

  const handleDeleteDate = async () => {
    if (!dateToDelete) return;
    
    try {
      // Delete the date from the database
      await deleteAttendanceDate(dateToDelete);
      
      // Remove the date from dates array
      const updatedDates = dates.filter(date => date !== dateToDelete);
      setDates(updatedDates);
      
      // Remove all attendance records for this date
      const newAttendanceMap = { ...attendanceMap };
      Object.keys(newAttendanceMap).forEach(key => {
        if (key.endsWith(`-${dateToDelete}`)) {
          delete newAttendanceMap[key];
        }
      });
      setAttendanceMap(newAttendanceMap);
      
      setDateToDelete('');
      setShowDeleteDateModal(false);
    } catch (error) {
      console.error('Error deleting date:', error);
      alert('Erro ao eliminar data. Tente novamente.');
    }
  };

  const getAttendanceStatus = (userId: string, date: string): 'present' | 'absent' => {
    const key = `${userId}-${date}`;
    return attendanceMap[key]?.status || 'absent';
  };

  const getConsecutiveAbsences = (userId: string) => {
    const consecutiveAbsenceRanges: { start: number; end: number }[] = [];
    
    // Find all pairs of 2 consecutive absences
    for (let i = 0; i < dates.length - 1; i++) {
      const currentStatus = getAttendanceStatus(userId, dates[i]);
      const nextStatus = getAttendanceStatus(userId, dates[i + 1]);
      
      if (currentStatus === 'absent' && nextStatus === 'absent') {
        consecutiveAbsenceRanges.push({ start: i, end: i + 1 });
      }
    }
    
    return consecutiveAbsenceRanges;
  };

  const isInConsecutiveAbsence = (userId: string, dateIndex: number) => {
    const consecutiveRanges = getConsecutiveAbsences(userId);
    return consecutiveRanges.some(range => dateIndex >= range.start && dateIndex <= range.end);
  };

  const filteredUsers = users.filter(user => 
    user.idNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!hasPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-softpink-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Apenas Coordenadores e Administradores podem acessar esta página.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-softpink-100">
        <div className="flex flex-col items-center gap-4">
          <span className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-500"></span>
          <span className="text-brand-700 text-xl font-bold">A carregar presenças...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-softpink-100 pb-12">
      <div className="max-w-7xl mx-auto px-4 pt-4 lg:pt-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl lg:text-3xl">📋</span>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-brand-700">Presenças</h1>
            </div>
            <p className="text-brand-400 text-sm lg:text-base font-medium ml-1">Gestão de presenças dos utilizadores</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDeleteDateModal(true)}
              className="flex items-center gap-2 px-4 lg:px-5 py-2 bg-red-500 text-white rounded-full font-bold shadow hover:bg-red-600 transition text-sm lg:text-base"
            >
              <span className="text-lg lg:text-xl">🗑️</span> Eliminar Data
            </button>
            <button
              onClick={() => setShowAddDateModal(true)}
              className="flex items-center gap-2 px-4 lg:px-5 py-2 bg-brand-500 text-white rounded-full font-bold shadow hover:bg-brand-600 transition text-sm lg:text-base"
            >
              <span className="text-lg lg:text-xl">➕</span> Adicionar Data
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-glass p-4 lg:p-6 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-brand-700 font-semibold flex items-center gap-2">
              <span className="text-lg">🔍</span> Pesquisar por ID:
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite o ID do utilizador..."
              className="flex-1 px-4 py-2 border border-brand-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white/80"
            />
          </div>
        </div>

        {/* Attendance Grid */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-glass p-4 lg:p-6">
          <div className="overflow-x-auto">
            <div className="min-w-full">
              <table className="w-full border-collapse">
                <thead className="bg-gradient-to-r from-brand-100 to-softpink-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-bold text-brand-900 uppercase tracking-wider sticky left-0 z-20 bg-gradient-to-r from-brand-100 to-softpink-100 min-w-[150px]">
                      <span className="mr-1">🆔</span> ID do Utilizador
                    </th>
                    {dates.map(date => (
                      <th key={date} className="px-3 lg:px-6 py-3 text-center text-xs font-bold text-brand-900 uppercase tracking-wider min-w-[120px] relative group">
                        <div className="flex flex-col items-center">
                          <span>{format(parseISO(date), 'dd/MM/yyyy', { locale: pt })}</span>
                          <button
                            onClick={() => {
                              setDateToDelete(date);
                              setShowDeleteDateModal(true);
                            }}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                            title="Eliminar esta data"
                          >
                            ×
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-100">
                  {filteredUsers.map((user, idx) => (
                    <tr key={user.id} className={`transition hover:bg-softpink-200/60 ${idx % 2 === 0 ? 'bg-softpink-50/60' : 'bg-white/80'}`}>
                      <td className="px-3 lg:px-6 py-3 whitespace-nowrap text-sm lg:text-lg font-semibold text-brand-800 align-middle sticky left-0 z-10 bg-white/90 backdrop-blur-sm">
                        {user.idNumber}
                      </td>
                      {dates.map((date, dateIndex) => {
                        const status = getAttendanceStatus(user.idNumber, date);
                        const isInConsecutive = isInConsecutiveAbsence(user.idNumber, dateIndex);
                        const consecutiveRanges = getConsecutiveAbsences(user.idNumber);
                        const isFirstOfConsecutive = consecutiveRanges.some(range => range.start === dateIndex);
                        
                        return (
                          <td key={date} className="px-2 py-2 text-center relative">
                            <div className={`w-full h-12 flex items-center justify-center relative ${
                              isInConsecutive ? 'ring-4 ring-yellow-400 ring-opacity-75 rounded-lg' : ''
                            }`}>
                              <button
                                onClick={() => handleAttendanceToggle(user.idNumber, date)}
                                className={`w-10 h-10 rounded-lg border-2 transition-all duration-200 shadow-sm hover:shadow-md ${
                                  status === 'present' 
                                    ? 'bg-green-500 border-green-600 hover:bg-green-600 text-white' 
                                    : 'bg-red-500 border-red-600 hover:bg-red-600 text-white'
                                }`}
                                title={`${status === 'present' ? 'Presente' : 'Ausente'} - Clique para alterar`}
                              >
                                {status === 'present' ? '✓' : '✗'}
                              </button>
                              
                              {/* Red flag for consecutive absences */}
                              {isFirstOfConsecutive && (
                                <div className="absolute -top-1 -right-1">
                                  <div className="w-6 h-6 rounded-full border-2 bg-red-500 border-red-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                                    🚩
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {filteredUsers.length === 0 && searchTerm && (
            <div className="text-center py-8 text-brand-400">
              <span className="text-4xl mb-2 block">🔍</span>
              Nenhum utilizador encontrado com o ID pesquisado.
            </div>
          )}
          {filteredUsers.length === 0 && !searchTerm && users.length === 0 && (
            <div className="text-center py-8 text-brand-400">
              <span className="text-4xl mb-2 block">👥</span>
              Nenhum utilizador encontrado.
            </div>
          )}
        </div>

        {/* Add Date Modal */}
        {showAddDateModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50 animate-fadeIn p-4">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-brand-200 w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col items-center">
              <span className="text-3xl lg:text-4xl mb-2 text-brand-500 mt-6 lg:mt-8">📅</span>
              <h2 className="text-lg lg:text-xl font-bold text-brand-700 text-center mb-4 px-6">Adicionar Nova Data</h2>
              <div className="px-6 py-6 flex flex-col items-center w-full">
                <label className="block text-sm lg:text-lg font-semibold text-brand-700 w-full text-center mb-1">
                  Data:
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 border border-brand-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
              <div className="flex flex-col gap-2 w-full px-6 pb-6">
                <button
                  onClick={handleAddDate}
                  className="w-full px-4 py-2 rounded-lg bg-brand-500 text-white font-bold shadow hover:bg-brand-600 transition text-sm lg:text-base"
                >
                  Adicionar
                </button>
                <button
                  onClick={() => setShowAddDateModal(false)}
                  className="w-full px-4 py-2 rounded-lg text-brand-500 font-bold bg-transparent hover:bg-brand-50 transition text-sm lg:text-base"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Date Modal */}
        {showDeleteDateModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50 animate-fadeIn p-4">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-red-500 w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col items-center">
              <span className="text-3xl lg:text-4xl mb-2 text-red-500 mt-6 lg:mt-8">⚠️</span>
              <h2 className="text-lg lg:text-xl font-bold text-brand-700 text-center mb-4 px-6">Confirmar Eliminação de Data</h2>
              <div className="px-6 py-6 flex flex-col items-center w-full">
                <p className="text-sm lg:text-base text-brand-700 text-center mb-4">
                  Tem a certeza que pretende eliminar a data <strong>{dateToDelete ? format(parseISO(dateToDelete), 'dd/MM/yyyy', { locale: pt }) : ''}</strong>?
                </p>
                <p className="text-xs lg:text-sm text-red-600 text-center mb-4">
                  Esta ação irá eliminar todos os registos de presença para esta data e não pode ser desfeita.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full px-6 pb-6">
                <button
                  onClick={handleDeleteDate}
                  className="w-full px-4 py-2 rounded-lg bg-red-500 text-white font-bold shadow hover:bg-red-600 transition text-sm lg:text-base"
                >
                  Eliminar Data
                </button>
                <button
                  onClick={() => setShowDeleteDateModal(false)}
                  className="w-full px-4 py-2 rounded-lg text-red-500 font-bold bg-transparent hover:bg-red-50 transition text-sm lg:text-base"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Presencas;