import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllUsers } from '../services/userService';
import {
  getAllAttendanceRecords,
  getAllAttendanceDates,
  getAllAttendanceUsers,
  markAttendance,
  checkConsecutiveAbsences,
  updateFlagStatus,
  getFlagStatus
} from '../services/attendanceService';
import { format, addDays, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';

const Presencas: React.FC = () => {
  const { user } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [userIds, setUserIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [attendanceMap, setAttendanceMap] = useState<{ [key: string]: any }>({});
  const [flagStatuses, setFlagStatuses] = useState<{ [key: string]: any }>({});
  const [showAddDateModal, setShowAddDateModal] = useState(false);
  const [newDate, setNewDate] = useState('');

  // Check if user has permission to access this page
  const hasPermission = user && (user.role === 'Coordenador' || user.role === 'Administrador');

  useEffect(() => {
    if (hasPermission) {
      fetchData();
    }
  }, [hasPermission]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [records, users, attendanceDates, attendanceUsers] = await Promise.all([
        getAllAttendanceRecords(),
        getAllUsers(),
        getAllAttendanceDates(),
        getAllAttendanceUsers()
      ]);

      setAttendanceRecords(records);
      setAllUsers(users);
      setDates(attendanceDates);
      setUserIds(attendanceUsers);

      // Create attendance map for quick lookup
      const map: { [key: string]: any } = {};
      records.forEach(record => {
        map[`${record.userId}-${record.date}`] = record;
      });
      setAttendanceMap(map);

      // Fetch flag statuses for all users
      const flagPromises = attendanceUsers.map(userId => getFlagStatus(userId));
      const flagResults = await Promise.all(flagPromises);
      const flagMap: { [key: string]: any } = {};
      flagResults.forEach((flag, index) => {
        if (flag) {
          flagMap[attendanceUsers[index]] = flag;
        }
      });
      setFlagStatuses(flagMap);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceClick = async (userId: string, date: string) => {
    if (!user) return;

    try {
      const currentRecord = attendanceMap[`${userId}-${date}`];
      const newStatus = (!currentRecord || currentRecord.status === 'absent') ? 'present' : 'absent';
      
      await markAttendance(userId, date, newStatus, user.uid);
      
      // Update local state
      const updatedMap = { ...attendanceMap };
      if (currentRecord) {
        updatedMap[`${userId}-${date}`] = { ...currentRecord, status: newStatus };
      } else {
        updatedMap[`${userId}-${date}`] = {
          userId,
          date,
          status: newStatus,
          markedBy: user.uid,
          markedAt: new Date()
        };
      }
      setAttendanceMap(updatedMap);

      // Refresh data to update consecutive absences
      await fetchData();
    } catch (error) {
      console.error('Error updating attendance:', error);
    }
  };

  const handleAddDate = async () => {
    if (!newDate) return;

    try {
      // Add the new date to the dates array and sort
      const updatedDates = [...dates, newDate].sort();
      setDates(updatedDates);
      setNewDate('');
      setShowAddDateModal(false);
    } catch (error) {
      console.error('Error adding date:', error);
    }
  };

  const handleFlagClick = async (userId: string) => {
    if (!user) return;

    try {
      const currentFlag = flagStatuses[userId];
      const newFlagStatus = !currentFlag?.isFlagged;
      
      await updateFlagStatus(userId, newFlagStatus, user.uid);
      
      // Update local state
      setFlagStatuses(prev => ({
        ...prev,
        [userId]: {
          ...currentFlag,
          isFlagged: newFlagStatus,
          flaggedBy: user.uid,
          flaggedAt: new Date()
        }
      }));
    } catch (error) {
      console.error('Error updating flag status:', error);
    }
  };

  const getAttendanceStatus = (userId: string, date: string) => {
    const record = attendanceMap[`${userId}-${date}`];
    return record ? record.status : 'absent';
  };

  const getConsecutiveAbsenceInfo = (userId: string) => {
    return checkConsecutiveAbsences(userId, dates, attendanceMap);
  };

  const filteredUserIds = userIds.filter(userId => 
    userId.toLowerCase().includes(searchTerm.toLowerCase())
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

        {/* Attendance Table */}
        <div className="bg-white rounded-3xl shadow-glass p-6 overflow-x-auto">
          <div className="min-w-full">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-gray-300 bg-gray-100 p-3 text-left font-semibold text-gray-700 sticky left-0 z-10">
                    ID do Utilizador
                  </th>
                  {dates.map(date => (
                    <th key={date} className="border border-gray-300 bg-gray-100 p-3 text-center font-semibold text-gray-700 min-w-[120px]">
                      {format(parseISO(date), 'dd/MM/yyyy', { locale: pt })}
                    </th>
                  ))}
                  <th className="border border-gray-300 bg-gray-100 p-3 text-center font-semibold text-gray-700 min-w-[80px]">
                    Flag
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUserIds.map(userId => {
                  const consecutiveInfo = getConsecutiveAbsenceInfo(userId);
                  const isFlagged = flagStatuses[userId]?.isFlagged;
                  
                  return (
                    <tr key={userId} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-3 font-mono text-sm bg-white sticky left-0 z-10">
                        {userId}
                      </td>
                      {dates.map((date, dateIndex) => {
                        const status = getAttendanceStatus(userId, date);
                        const isInConsecutiveAbsence = consecutiveInfo.flaggedDates.includes(date);
                        const isFirstOfConsecutive = isInConsecutiveAbsence && 
                          (dateIndex === 0 || !consecutiveInfo.flaggedDates.includes(dates[dateIndex - 1]));
                        
                        return (
                          <td key={date} className="border border-gray-300 p-1 relative">
                            <div className={`w-full h-12 flex items-center justify-center cursor-pointer transition-all duration-200 ${
                              isInConsecutiveAbsence ? 'ring-4 ring-yellow-400 ring-opacity-75' : ''
                            }`}>
                              <button
                                onClick={() => handleAttendanceClick(userId, date)}
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
                              {isFirstOfConsecutive && consecutiveInfo.isFlagged && (
                                <div className="absolute -top-1 -right-1">
                                  <button
                                    onClick={() => handleFlagClick(userId)}
                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                                      isFlagged 
                                        ? 'bg-green-500 border-green-600 text-white' 
                                        : 'bg-red-500 border-red-600 text-white hover:bg-red-600'
                                    }`}
                                    title={isFlagged ? 'Flag resolvido - Clique para marcar como não resolvido' : 'Flag ativo - Clique para resolver'}
                                  >
                                    🚩
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                      <td className="border border-gray-300 p-3 text-center">
                        {consecutiveInfo.isFlagged && (
                          <button
                            onClick={() => handleFlagClick(userId)}
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                              isFlagged 
                                ? 'bg-green-500 border-green-600 text-white' 
                                : 'bg-red-500 border-red-600 text-white hover:bg-red-600'
                            }`}
                            title={isFlagged ? 'Flag resolvido' : 'Flag ativo - Clique para resolver'}
                          >
                            🚩
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
