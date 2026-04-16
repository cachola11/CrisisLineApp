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
  const [addDateError, setAddDateError] = useState<string | null>(null);
  const [deleteDateError, setDeleteDateError] = useState<string | null>(null);

  const hasPermission = user && (user.role === 'Coordenador' || user.role === 'Administrador');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [allUsers, savedDates, attendanceRecords] = await Promise.all([
        getAllUsers(),
        getAttendanceDates(),
        getAllAttendanceRecords(),
      ]);

      const sortedUsers = allUsers.sort((a, b) => a.idNumber.localeCompare(b.idNumber));
      setUsers(sortedUsers);
      setDates(savedDates);

      const initialMap: { [key: string]: AttendanceRecord } = {};
      sortedUsers.forEach(u => {
        savedDates.forEach(date => {
          const key = `${u.idNumber}-${date}`;
          initialMap[key] = { userId: u.idNumber, date, status: 'absent' };
        });
      });

      attendanceRecords.forEach(record => {
        const key = `${record.userId}-${record.date}`;
        if (initialMap[key]) initialMap[key].status = record.status;
      });

      setAttendanceMap(initialMap);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasPermission) fetchData();
  }, [hasPermission, fetchData]);

  const handleAttendanceToggle = (userId: string, date: string) => {
    const key = `${userId}-${date}`;
    const currentRecord = attendanceMap[key];
    const newStatus = currentRecord?.status === 'present' ? 'absent' : 'present';
    setAttendanceMap(prev => ({
      ...prev,
      [key]: { userId, date, status: newStatus },
    }));
  };

  const handleAddDate = async () => {
    if (!newDate) return;
    setAddDateError(null);
    if (dates.includes(newDate)) {
      setAddDateError('Esta data já existe na lista.');
      return;
    }
    try {
      await addAttendanceDate(newDate);
      const updatedDates = [...dates, newDate].sort((a, b) => compareAsc(parseISO(a), parseISO(b)));
      setDates(updatedDates);
      const newAttendanceMap = { ...attendanceMap };
      users.forEach(u => {
        const key = `${u.idNumber}-${newDate}`;
        newAttendanceMap[key] = { userId: u.idNumber, date: newDate, status: 'absent' };
      });
      setAttendanceMap(newAttendanceMap);
      setNewDate('');
      setShowAddDateModal(false);
    } catch (error: any) {
      console.error('Error adding date:', error);
      setAddDateError(`Erro ao adicionar data: ${error?.message || 'desconhecido'}`);
    }
  };

  const handleDeleteDate = async () => {
    if (!dateToDelete) return;
    setDeleteDateError(null);
    try {
      await deleteAttendanceDate(dateToDelete);
      setDates(prev => prev.filter(d => d !== dateToDelete));
      const newAttendanceMap = { ...attendanceMap };
      Object.keys(newAttendanceMap).forEach(key => {
        if (key.endsWith(`-${dateToDelete}`)) delete newAttendanceMap[key];
      });
      setAttendanceMap(newAttendanceMap);
      setDateToDelete('');
      setShowDeleteDateModal(false);
    } catch (error) {
      console.error('Error deleting date:', error);
      setDeleteDateError('Erro ao eliminar data. Tente novamente.');
    }
  };

  const getAttendanceStatus = (userId: string, date: string): 'present' | 'absent' => {
    const key = `${userId}-${date}`;
    return attendanceMap[key]?.status || 'absent';
  };

  const filteredUsers = users.filter(u => u.idNumber.toLowerCase().includes(searchTerm.toLowerCase()));

  const openAddModal = () => {
    setAddDateError(null);
    setNewDate('');
    setShowAddDateModal(true);
  };

  const openDeleteModalForDate = (date: string) => {
    setDeleteDateError(null);
    setDateToDelete(date);
    setShowDeleteDateModal(true);
  };

  if (!hasPermission) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="rounded-xl border border-gray-100 shadow-card overflow-hidden max-w-md w-full text-center p-8 bg-white">
          <h1 className="text-lg font-bold text-gray-800 mb-2">Acesso negado</h1>
          <p className="text-sm text-gray-500">Apenas Coordenadores e Administradores podem aceder a esta página.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-[3px] border-brand-200 border-t-brand-500 animate-spin" />
          <p className="text-sm text-gray-400 font-medium">A carregar presenças...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="rounded-xl border border-gray-100 shadow-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-brand-500 to-brand-400">
          <div>
            <h1 className="text-lg font-bold text-white">Presenças</h1>
            <p className="text-xs text-white/70 mt-0.5">Gestão de presenças dos utilizadores</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => openDeleteModalForDate('')}
              className="px-3 py-1.5 rounded-lg bg-white/15 text-white text-xs font-semibold border border-white/25 hover:bg-white/25 transition-colors"
            >
              Eliminar data
            </button>
            <button
              type="button"
              onClick={openAddModal}
              className="px-3 py-1.5 rounded-lg bg-white text-brand-600 text-xs font-semibold shadow-sm hover:bg-gray-50 transition-colors"
            >
              + Adicionar data
            </button>
          </div>
        </div>

        <div className="bg-white px-5 py-4 border-b border-gray-100">
          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Pesquisar por ID</label>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Número de identificação..."
            className="block w-full max-w-md rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 focus:bg-white outline-none transition-all"
          />
        </div>

        <div className="bg-white">
          {filteredUsers.length > 0 ? (
            <div className="overflow-x-auto" style={{ maxHeight: '65vh' }}>
              <table className="w-full min-w-[400px]">
                <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider sticky left-0 z-20 bg-gray-50 min-w-[140px]">
                      ID
                    </th>
                    {dates.map(date => (
                      <th key={date} className="px-3 py-3 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider min-w-[100px] relative group">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-gray-700 font-mono text-xs">{format(parseISO(date), 'dd/MM/yy', { locale: pt })}</span>
                          <button
                            type="button"
                            onClick={() => openDeleteModalForDate(date)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-semibold text-red-600 hover:underline"
                          >
                            Remover
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-800 font-mono sticky left-0 z-[5] bg-white">
                        {user.idNumber}
                      </td>
                      {dates.map(date => {
                        const status = getAttendanceStatus(user.idNumber, date);
                        return (
                          <td key={date} className="px-2 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleAttendanceToggle(user.idNumber, date)}
                              className={`h-9 w-9 rounded-lg border-2 text-xs font-bold transition-all shadow-sm ${
                                status === 'present'
                                  ? 'bg-emerald-500 border-emerald-600 text-white hover:bg-emerald-600'
                                  : 'bg-red-500 border-red-600 text-white hover:bg-red-600'
                              }`}
                              title={status === 'present' ? 'Presente — clique para ausente' : 'Ausente — clique para presente'}
                            >
                              {status === 'present' ? '✓' : '✗'}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 px-4">
              <p className="text-sm text-gray-500">
                {searchTerm
                  ? 'Nenhum utilizador encontrado com o ID pesquisado.'
                  : users.length === 0
                    ? 'Nenhum utilizador encontrado.'
                    : 'Nenhuma data de presença adicionada ainda.'}
              </p>
            </div>
          )}
        </div>

        {!loading && filteredUsers.length > 0 && (
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
            {filteredUsers.length} utilizador{filteredUsers.length === 1 ? '' : 'es'}
            {dates.length > 0 ? ` · ${dates.length} data${dates.length === 1 ? '' : 's'}` : ''}
          </div>
        )}
      </div>

      {showAddDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={() => setShowAddDateModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-sm animate-scale-in overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-brand-500 to-brand-400">
              <h2 className="text-sm font-bold text-white">Adicionar nova data</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Data</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-800 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 focus:bg-white outline-none transition-all"
                />
              </div>
              {addDateError && <p className="text-xs text-red-600 font-medium text-center">{addDateError}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDateModal(false)}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddDate}
                  className="flex-1 px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-all"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={() => setShowDeleteDateModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-sm animate-scale-in overflow-hidden">
            <div className="p-6">
              <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-base font-bold text-gray-800 mb-2">Eliminar data</h2>
              {!dateToDelete ? (
                <p className="text-sm text-gray-500 mb-4">Selecione uma coluna de data e use &quot;Remover&quot; no cabeçalho, ou escolha abixo.</p>
              ) : (
                <p className="text-sm text-gray-500 leading-relaxed mb-2">
                  Eliminar a data <strong className="text-gray-800 font-mono">{format(parseISO(dateToDelete), 'dd/MM/yyyy', { locale: pt })}</strong>? Todos os registos de presença para esta data serão removidos.
                </p>
              )}
              {!dateToDelete && dates.length > 0 && (
                <select
                  value={dateToDelete}
                  onChange={e => setDateToDelete(e.target.value)}
                  className="mt-2 block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-800 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none"
                >
                  <option value="">Escolher data…</option>
                  {dates.map(d => (
                    <option key={d} value={d}>
                      {format(parseISO(d), 'dd/MM/yyyy', { locale: pt })}
                    </option>
                  ))}
                </select>
              )}
              {deleteDateError && <p className="text-xs text-red-600 font-medium mt-2">{deleteDateError}</p>}
            </div>
            <div className="flex gap-2 px-6 pb-6">
              <button
                type="button"
                onClick={() => setShowDeleteDateModal(false)}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteDate}
                disabled={!dateToDelete}
                className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Presencas;
