import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllUsers } from '../services/userService';
import { format, parseISO, compareAsc } from 'date-fns';
import { pt } from 'date-fns/locale';

interface AttendanceRecord {
  userId: string;
  date: string;
  status: 'present' | 'absent';
}

interface User {
  id: string;
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
  const [newDate, setNewDate] = useState('');

  // Check if user has permission to access this page
  const hasPermission = user && (user.role === 'Coordenador' || user.role === 'Administrador');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const allUsers = await getAllUsers();
      
      // Sort users by ID in descending order
      const sortedUsers = allUsers.sort((a, b) => b.id.localeCompare(a.id));
      setUsers(sortedUsers);
      
      // Initialize attendance map with all users marked as absent for all dates
      const initialMap: { [key: string]: AttendanceRecord } = {};
      sortedUsers.forEach(user => {
        dates.forEach(date => {
          const key = `${user.id}-${date}`;
          if (!initialMap[key]) {
            initialMap[key] = {
              userId: user.id,
              date: date,
              status: 'absent'
            };
          }
        });
      });
      setAttendanceMap(initialMap);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [dates]);

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

  const handleAddDate = () => {
    if (!newDate) return;
    
    // Add new date and sort from older to newer (left to right)
    const updatedDates = [...dates, newDate].sort((a, b) => compareAsc(parseISO(a), parseISO(b)));
    setDates(updatedDates);
    
    // Initialize attendance for all users for the new date
    const newAttendanceMap = { ...attendanceMap };
    users.forEach(user => {
      const key = `${user.id}-${newDate}`;
      newAttendanceMap[key] = {
        userId: user.id,
        date: newDate,
        status: 'absent'
      };
    });
    setAttendanceMap(newAttendanceMap);
    
    setNewDate('');
    setShowAddDateModal(false);
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
    user.id.toLowerCase().includes(searchTerm.toLowerCase())
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
    <div className="min-h-screen bg-softpink-100 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-glass p-6 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-brand-700 flex items-center gap-2">
              Presenças <span className="text-2xl lg:text-3xl">📋</span>
            </h1>
            <button
              onClick={() => setShowAddDateModal(true)}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-semibold"
            >
              + Adicionar Data
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-3xl shadow-glass p-6 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-brand-700 font-semibold">Pesquisar por ID:</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite o ID do utilizador..."
              className="flex-1 px-4 py-2 border border-brand-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
        </div>

        {/* Attendance Grid */}
        <div className="bg-white rounded-3xl shadow-glass p-6 overflow-x-auto">
          <div className="min-w-full">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-gray-300 bg-gray-100 p-3 text-left font-semibold text-gray-700 sticky left-0 z-10 min-w-[150px]">
                    ID do Utilizador
                  </th>
                  {dates.map(date => (
                    <th key={date} className="border border-gray-300 bg-gray-100 p-3 text-center font-semibold text-gray-700 min-w-[120px]">
                      {format(parseISO(date), 'dd/MM/yyyy', { locale: pt })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-3 font-mono text-sm bg-white sticky left-0 z-10">
                      {user.id}
                    </td>
                    {dates.map((date, dateIndex) => {
                      const status = getAttendanceStatus(user.id, date);
                      const isInConsecutive = isInConsecutiveAbsence(user.id, dateIndex);
                      const consecutiveRanges = getConsecutiveAbsences(user.id);
                      const isFirstOfConsecutive = consecutiveRanges.some(range => range.start === dateIndex);
                      
                      return (
                        <td key={date} className="border border-gray-300 p-1 relative">
                          <div className={`w-full h-12 flex items-center justify-center relative ${
                            isInConsecutive ? 'ring-4 ring-yellow-400 ring-opacity-75' : ''
                          }`}>
                            <button
                              onClick={() => handleAttendanceToggle(user.id, date)}
                              className={`w-10 h-10 rounded-lg border-2 transition-all duration-200 ${
                                status === 'present' 
                                  ? 'bg-green-500 border-green-600 hover:bg-green-600' 
                                  : 'bg-red-500 border-red-600 hover:bg-red-600'
                              }`}
                              title={`${status === 'present' ? 'Presente' : 'Ausente'} - Clique para alterar`}
                            >
                              {status === 'present' ? '✓' : '✗'}
                            </button>
                            
                            {/* Red flag for consecutive absences */}
                            {isFirstOfConsecutive && (
                              <div className="absolute -top-1 -right-1">
                                <div className="w-6 h-6 rounded-full border-2 bg-red-500 border-red-600 text-white flex items-center justify-center text-xs font-bold">
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

        {/* Add Date Modal */}
        {showAddDateModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50 p-4">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-brand-200 w-full max-w-md">
              <div className="p-6">
                <h2 className="text-xl font-bold text-brand-700 mb-4">Adicionar Nova Data</h2>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-brand-700 mb-2">
                    Data:
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 border border-brand-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowAddDateModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddDate}
                    className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-semibold"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Presencas;