import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase/config';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface CallRecord {
  id: string;
  listenerId: string;
  callDate: string;
  dayOfWeek: string;
  timeOfCall: string;
  phoneType: string;
  callerSex: string;
  callerSexOther?: string;
  callerLocation?: string;
  callerAge: string;
  callerAgeOther?: string;
  isNewCaller: string;
  isHabitue?: string;
  habitueName?: string;
  suicidalIdeation?: string;
  suicideRisk?: string[];
  isReferral?: string;
  referralRequest?: string;
  referralRequestOther?: string;
  callSummary: string;
  personalReflection: string;
  callDuration: string;
  callThemes: string[];
  callThemesOther?: string;
  isPassive: string;
  passiveListenerId?: string;
  passivePersonalReflection?: string;
  submittedBy: string;
  submittedAt: string;
}

const DataCollectionHistory: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<CallRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [listenerFilter, setListenerFilter] = useState('');
  const [callerSexFilter, setCallerSexFilter] = useState('');
  const [callerAgeFilter, setCallerAgeFilter] = useState('');
  const [suicidalIdeationFilter, setSuicidalIdeationFilter] = useState('');
  const [isPassiveFilter, setIsPassiveFilter] = useState('');
  const [themeFilter, setThemeFilter] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(20);
  
  // Expanded record for details
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

  // Analytics
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Only allow admins
  const [isAdmin, setIsAdmin] = useState(false);

  // Define all functions before useEffect hooks
  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const recordsRef = collection(db, 'callRecords');
      const q = query(recordsRef, orderBy('submittedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const recordsData: CallRecord[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CallRecord));
      
      setRecords(recordsData);
    } catch (err) {
      console.error('Error fetching records:', err);
      setError('Erro ao carregar os registos');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = [...records];

    if (dateFilter) {
      const filterDate = dateFilter.toISOString().split('T')[0];
      filtered = filtered.filter(record => record.callDate === filterDate);
    }

    if (listenerFilter) {
      filtered = filtered.filter(record => 
        record.listenerId.toLowerCase().includes(listenerFilter.toLowerCase())
      );
    }

    if (callerSexFilter) {
      filtered = filtered.filter(record => record.callerSex === callerSexFilter);
    }

    if (callerAgeFilter) {
      filtered = filtered.filter(record => record.callerAge === callerAgeFilter);
    }

    if (suicidalIdeationFilter) {
      filtered = filtered.filter(record => record.suicidalIdeation === suicidalIdeationFilter);
    }

    if (isPassiveFilter) {
      filtered = filtered.filter(record => record.isPassive === isPassiveFilter);
    }

    if (themeFilter) {
      filtered = filtered.filter(record => 
        record.callThemes?.some(theme => 
          theme.toLowerCase().includes(themeFilter.toLowerCase())
        )
      );
    }

    setFilteredRecords(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [records, dateFilter, listenerFilter, callerSexFilter, callerAgeFilter, suicidalIdeationFilter, isPassiveFilter, themeFilter]);

  const clearFilters = () => {
    setDateFilter(null);
    setListenerFilter('');
    setCallerSexFilter('');
    setCallerAgeFilter('');
    setSuicidalIdeationFilter('');
    setIsPassiveFilter('');
    setThemeFilter('');
  };

  const getCurrentRecords = () => {
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    return filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);
  };

  const renderRecordDetails = (record: CallRecord) => {
    if (expandedRecord !== record.id) return null;

    return (
      <tr>
        <td colSpan={9} className="px-4 py-0">
          <div className="bg-gray-50 p-4 rounded-lg my-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-brand-700 mb-2">Informações Básicas</h4>
                <p><strong>Data:</strong> {record.callDate}</p>
                <p><strong>Dia da semana:</strong> {record.dayOfWeek}</p>
                <p><strong>Hora:</strong> {record.timeOfCall}</p>
                <p><strong>Tipo de telefone:</strong> {record.phoneType}</p>
                <p><strong>Duração:</strong> {record.callDuration} minutos</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-brand-700 mb-2">Sobre o Apelante</h4>
                <p><strong>Sexo:</strong> {record.callerSex} {record.callerSexOther && `(${record.callerSexOther})`}</p>
                <p><strong>Idade:</strong> {record.callerAge} {record.callerAgeOther && `(${record.callerAgeOther})`}</p>
                <p><strong>Localidade:</strong> {record.callerLocation || 'Não especificado'}</p>
                <p><strong>Novo apelante:</strong> {record.isNewCaller}</p>
              </div>
              
              {record.isNewCaller === 'Não' && (
                <div>
                  <h4 className="font-semibold text-brand-700 mb-2">Habitué</h4>
                  <p><strong>É habitué:</strong> {record.isHabitue}</p>
                  {record.isHabitue === 'Sim' && <p><strong>Nome:</strong> {record.habitueName}</p>}
                </div>
              )}
              
              {(record.isNewCaller === 'Sim' || record.isHabitue === 'Não') && (
                <div>
                  <h4 className="font-semibold text-brand-700 mb-2">Avaliação</h4>
                  <p><strong>Ideiação suicida:</strong> {record.suicidalIdeation}</p>
                  {record.suicidalIdeation === 'Sim' && (
                    <p><strong>Riscos:</strong> {record.suicideRisk?.join(', ')}</p>
                  )}
                  {record.suicidalIdeation === 'Não' && (
                    <>
                      <p><strong>Reencaminhamento:</strong> {record.isReferral}</p>
                      {record.isReferral === 'Sim' && (
                        <p><strong>Para onde:</strong> {record.referralRequest} {record.referralRequestOther && `(${record.referralRequestOther})`}</p>
                      )}
                    </>
                  )}
                </div>
              )}
              
              <div className="md:col-span-2">
                <h4 className="font-semibold text-brand-700 mb-2">Resumo da Chamada</h4>
                <p className="mb-2"><strong>Resumo:</strong></p>
                <p className="bg-white p-2 rounded border text-gray-700 mb-3">{record.callSummary}</p>
                
                <p className="mb-2"><strong>Reflexão pessoal:</strong></p>
                <p className="bg-white p-2 rounded border text-gray-700 mb-3">{record.personalReflection}</p>
                
                <p><strong>Temas:</strong> {record.callThemes?.join(', ')} {record.callThemesOther && `(${record.callThemesOther})`}</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-brand-700 mb-2">Passiva</h4>
                <p><strong>Era passiva:</strong> {record.isPassive}</p>
                {record.isPassive === 'Sim' && (
                  <>
                    <p><strong>Número do escutante:</strong> {record.passiveListenerId}</p>
                    <p><strong>Reflexão pessoal:</strong></p>
                    <p className="bg-white p-2 rounded border text-gray-700 text-sm">{record.passivePersonalReflection}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </td>
      </tr>
    );
  };

  // All useEffect hooks must be called before any conditional returns
  useEffect(() => {
    if (user?.role === 'Administrador') setIsAdmin(true);
    else setIsAdmin(false);
  }, [user]);

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Early return after all hooks
  if (!isAdmin) {
    return <div className="p-8 text-center text-xl text-red-600 font-bold">Acesso restrito a administradores.</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-softpink-100 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-brand-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-softpink-100 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-16">
            <p className="text-red-500 text-lg font-semibold">{error}</p>
            <button 
              onClick={fetchRecords}
              className="mt-4 px-6 py-2 bg-brand-500 text-white rounded-full hover:bg-brand-600 transition"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

  return (
    <div className="min-h-screen bg-softpink-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-3xl">📊</span>
              <h1 className="text-3xl font-extrabold text-brand-700">Histórico de Recolha de Dados</h1>
            </div>
            <p className="text-brand-400 text-base font-medium ml-1">Visualizar e analisar todos os registos submetidos</p>
          </div>
          <button
            onClick={fetchRecords}
            className="flex items-center gap-2 px-5 py-2 bg-brand-500 text-white rounded-full font-bold shadow hover:bg-brand-600 transition text-base"
          >
            <span className="text-xl">🔄</span> Atualizar
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-glass p-6 mb-6">
          <h3 className="text-lg font-bold text-brand-700 mb-4">Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-brand-700 mb-1">Data</label>
              <DatePicker
                selected={dateFilter}
                onChange={(date) => setDateFilter(date)}
                dateFormat="dd/MM/yyyy"
                placeholderText="Selecionar data"
                className="w-full px-3 py-2 rounded-lg border border-brand-200 focus:ring-2 focus:ring-brand-400"
                isClearable
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-brand-700 mb-1">Escutante</label>
              <input
                type="text"
                value={listenerFilter}
                onChange={(e) => setListenerFilter(e.target.value)}
                placeholder="Filtrar por escutante"
                className="w-full px-3 py-2 rounded-lg border border-brand-200 focus:ring-2 focus:ring-brand-400"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-brand-700 mb-1">Sexo</label>
              <select
                value={callerSexFilter}
                onChange={(e) => setCallerSexFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-brand-200 focus:ring-2 focus:ring-brand-400"
              >
                <option value="">Todos</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-brand-700 mb-1">Idade</label>
              <select
                value={callerAgeFilter}
                onChange={(e) => setCallerAgeFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-brand-200 focus:ring-2 focus:ring-brand-400"
              >
                <option value="">Todas</option>
                <option value="18-25">18-25</option>
                <option value="26-35">26-35</option>
                <option value="36-45">36-45</option>
                <option value="46-55">46-55</option>
                <option value="56-65">56-65</option>
                <option value="+ 65">+ 65</option>
                <option value="+ 18 2.0">+ 18 2.0</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-brand-700 mb-1">Ideação Suicida</label>
              <select
                value={suicidalIdeationFilter}
                onChange={(e) => setSuicidalIdeationFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-brand-200 focus:ring-2 focus:ring-brand-400"
              >
                <option value="">Todos</option>
                <option value="Sim">Sim</option>
                <option value="Não">Não</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-brand-700 mb-1">Passiva</label>
              <select
                value={isPassiveFilter}
                onChange={(e) => setIsPassiveFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-brand-200 focus:ring-2 focus:ring-brand-400"
              >
                <option value="">Todas</option>
                <option value="Sim">Sim</option>
                <option value="Não">Não</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-brand-700 mb-1">Tema</label>
              <input
                type="text"
                value={themeFilter}
                onChange={(e) => setThemeFilter(e.target.value)}
                placeholder="Filtrar por tema"
                className="w-full px-3 py-2 rounded-lg border border-brand-200 focus:ring-2 focus:ring-brand-400"
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Toggle between table and analytics */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAnalytics(false)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                !showAnalytics
                  ? 'bg-brand-500 text-white'
                  : 'bg-white text-brand-700 hover:bg-brand-50'
              }`}
            >
              📋 Tabela
            </button>
            <button
              onClick={() => setShowAnalytics(true)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                showAnalytics
                  ? 'bg-brand-500 text-white'
                  : 'bg-white text-brand-700 hover:bg-brand-50'
              }`}
            >
              📊 Análises
            </button>
          </div>
          
          <div className="text-sm text-brand-600">
            {filteredRecords.length} registos encontrados
          </div>
        </div>

        {showAnalytics ? (
          <AnalyticsDashboard records={filteredRecords} />
        ) : (
          <>
            {/* Records Table */}
            <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-glass overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-full divide-y divide-brand-100">
                  <thead className="bg-brand-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-brand-900 uppercase tracking-wider">Data</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-brand-900 uppercase tracking-wider">Escutante</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-brand-900 uppercase tracking-wider">Hora</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-brand-900 uppercase tracking-wider">Sexo</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-brand-900 uppercase tracking-wider">Idade</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-brand-900 uppercase tracking-wider">Novo</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-brand-900 uppercase tracking-wider">Ideação</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-brand-900 uppercase tracking-wider">Passiva</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-brand-900 uppercase tracking-wider">Duração</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-brand-900 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-100">
                    {getCurrentRecords().map((record, idx) => (
                      <React.Fragment key={record.id}>
                        <tr className={`${idx % 2 === 0 ? 'bg-softpink-50/60' : 'bg-white/80'} hover:bg-brand-50 transition-colors`}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-brand-800">
                            {new Date(record.callDate).toLocaleDateString('pt-PT')}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-brand-700">
                            {record.listenerId}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-brand-700">
                            {record.timeOfCall}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-brand-700">
                            {record.callerSex}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-brand-700">
                            {record.callerAge}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              record.isNewCaller === 'Sim' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {record.isNewCaller}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              record.suicidalIdeation === 'Sim' 
                                ? 'bg-red-100 text-red-800' 
                                : record.suicidalIdeation === 'Não'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {record.suicidalIdeation || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              record.isPassive === 'Sim' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {record.isPassive}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-brand-700">
                            {record.callDuration} min
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <button
                              onClick={() => setExpandedRecord(expandedRecord === record.id ? null : record.id)}
                              className="text-brand-600 hover:text-brand-800 font-semibold"
                            >
                              {expandedRecord === record.id ? 'Ocultar' : 'Ver Detalhes'}
                            </button>
                          </td>
                        </tr>
                        {renderRecordDetails(record)}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-lg transition ${
                        currentPage === page
                          ? 'bg-brand-500 text-white'
                          : 'bg-white text-brand-700 hover:bg-brand-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// AnalyticsDashboard component
function AnalyticsDashboard({ records }: { records: CallRecord[] }) {
  // --- SUMMARY STATS ---
  const total = records.length;
  const byDate: Record<string, number> = {};
  const byListener: Record<string, number> = {};
  let mostActiveDay = '';
  let maxDayCount = 0;
  records.forEach(r => {
    byDate[r.callDate] = (byDate[r.callDate] || 0) + 1;
    byListener[r.listenerId] = (byListener[r.listenerId] || 0) + 1;
    if (byDate[r.callDate] > maxDayCount) {
      maxDayCount = byDate[r.callDate];
      mostActiveDay = r.callDate;
    }
  });
  const avgPerDay = total && Object.keys(byDate).length ? (total / Object.keys(byDate).length).toFixed(2) : '0';
  const topListener = Object.entries(byListener).sort((a,b)=>b[1]-a[1])[0]?.[0] || '-';

  // --- LINE CHART DATA ---
  const lineData = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date, value }));

  // --- CALENDAR HEATMAP DATA ---
  const byMonthDay: Record<string, Record<string, number>> = {};
  records.forEach(r => {
    const [y,m,d] = r.callDate.split('-');
    if (!byMonthDay[`${y}-${m}`]) byMonthDay[`${y}-${m}`] = {};
    byMonthDay[`${y}-${m}`][d] = (byMonthDay[`${y}-${m}`][d]||0)+1;
  });
  const months = Object.keys(byMonthDay).sort();

  // --- EXISTING CHART DATA ---
  const toChartData = (obj: Record<string, number>): { name: string; value: number }[] => Object.entries(obj).map(([name, value]) => ({ name, value }));
  const countBy = (arr: CallRecord[], key: keyof CallRecord) => arr.reduce((acc: Record<string, number>, r: CallRecord) => { const v = (r[key] as string) || 'Não especificado'; acc[v] = (acc[v]||0)+1; return acc; }, {});
  const countMulti = (arr: CallRecord[], key: keyof CallRecord) => arr.reduce((acc: Record<string, number>, r: CallRecord) => { ((r[key] as string[])||[]).forEach((v: string) => { acc[v] = (acc[v]||0)+1; }); return acc; }, {});
  const topN = (arr: { name: string; value: number }[], n=10) => arr.sort((a,b)=>b.value-a.value).slice(0,n);
  const userCounts = toChartData(countBy(records, 'listenerId'));
  const dayOfWeek = toChartData(countBy(records, 'dayOfWeek'));
  const timeOfCall = toChartData(countBy(records, 'timeOfCall'));
  const phoneType = toChartData(countBy(records, 'phoneType'));
  const localidades = toChartData(countBy(records, 'callerLocation'));
  const sex = toChartData(countBy(records, 'callerSex'));
  const age = toChartData(countBy(records, 'callerAge'));
  const newCaller = toChartData(countBy(records, 'isNewCaller'));
  const habitue = toChartData(countBy(records, 'isHabitue'));
  const habemos = toChartData(countBy(records, 'habitueName'));
  const ideacao = toChartData(countBy(records, 'suicidalIdeation'));
  const risco = toChartData(countMulti(records, 'suicideRisk'));
  const reenc = toChartData(countBy(records, 'isReferral'));
  const paraOnde = toChartData(countBy(records, 'referralRequest'));
  const temas = toChartData(countMulti(records, 'callThemes'));
  const passiva = toChartData(countBy(records, 'isPassive'));
  const emPassiva = toChartData(countBy(records, 'passiveListenerId'));

  // --- COMPONENTS ---
  const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#BDBDBD', '#FF6384', '#36A2EB', '#FFCE56'];

  const PieChartBlock = ({ title, data }: { title: string; data: { name: string; value: number }[] }) => (
    <div className="w-full md:w-1/2 lg:w-1/3 p-4">
      <h3 className="font-bold mb-2 text-brand-700">{title}</h3>
      <div style={{ width: '100%', height: 220 }}>
        {/* @ts-ignore */}
        {(
          <PieChart width={400} height={220}>
            {/* @ts-ignore */}
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
              {/* @ts-ignore */}
              {data.map((_, i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
            </Pie>
            {/* @ts-ignore */}
            <Tooltip />
          </PieChart>
        ) as any}
      </div>
    </div>
  );

  const BarChartBlock = ({ title, data, horizontal }: { title: string; data: { name: string; value: number }[]; horizontal?: boolean }) => (
    <div className="w-full md:w-1/2 lg:w-1/2 p-4">
      <h3 className="font-bold mb-2 text-brand-700">{title}</h3>
      <div style={{ width: '100%', height: 250 }}>
        {/* @ts-ignore */}
        {(
          <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} width={400} height={250}>
            {/* @ts-ignore */}
            <CartesianGrid strokeDasharray="3 3" />
            {/* @ts-ignore */}
            {horizontal ? <YAxis type="category" dataKey="name" /> : <XAxis dataKey="name" />}
            {/* @ts-ignore */}
            {horizontal ? <XAxis type="number" /> : <YAxis />}
            {/* @ts-ignore */}
            <Tooltip />
            {/* @ts-ignore */}
            <Legend />
            {/* @ts-ignore */}
            <Bar dataKey="value" fill="#36A2EB" />
          </BarChart>
        ) as any}
      </div>
    </div>
  );

  const LineChartBlock = ({ title, data }: { title: string; data: { date: string; value: number }[] }) => (
    <div className="w-full p-4">
      <h3 className="font-bold mb-2 text-brand-700">{title}</h3>
      <div style={{ width: '100%', height: 250 }}>
        {/* @ts-ignore */}
        {(
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              {/* @ts-ignore */}
              <CartesianGrid strokeDasharray="3 3" />
              {/* @ts-ignore */}
              <XAxis dataKey="date" />
              {/* @ts-ignore */}
              <YAxis />
              {/* @ts-ignore */}
              <Tooltip />
              {/* @ts-ignore */}
              <Legend />
              {/* @ts-ignore */}
              <Line type="monotone" dataKey="value" stroke="#36A2EB" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) as any}
      </div>
    </div>
  );

  const CalendarHeatmap = () => (
    <div className="overflow-x-auto my-8">
      <h3 className="font-bold mb-2 text-brand-700">Heatmap de Submissões por Dia</h3>
      <table className="min-w-max border text-center">
        <thead>
          <tr>
            <th className="sticky left-0 bg-white">Mês/Ano</th>
            {[...Array(31)].map((_,i)=><th key={i}>{i+1}</th>)}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {months.map(month => (
            <tr key={month}>
              <td className="font-bold sticky left-0 bg-white">{month.split('-').reverse().join('/')}</td>
              {[...Array(31)].map((_,i)=>{
                const val = byMonthDay[month][String(i+1)]||0;
                let bg = '';
                if (val > 10) bg = 'bg-red-400 text-white';
                else if (val > 5) bg = 'bg-orange-300';
                else if (val > 0) bg = 'bg-green-200';
                return (
                  <td key={i} className={`rounded-full cursor-pointer transition ${bg}`} title={val ? `${val} submissões` : ''}>
                    {val || ''}
                  </td>
                );
              })}
              <td className="font-bold">{Object.values(byMonthDay[month]).reduce((a, b) => a + b, 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // --- RENDER ---
  return (
    <div className="bg-white/90 rounded-3xl shadow-glass p-6 my-6">
      {/* SUMMARY STATS */}
      <div className="flex flex-wrap gap-6 mb-8">
        <div className="bg-brand-50 rounded-xl p-4 flex-1 min-w-[180px] text-center">
          <div className="text-3xl font-bold text-brand-700">{total}</div>
          <div className="text-brand-600">Total de Submissões</div>
        </div>
        <div className="bg-brand-50 rounded-xl p-4 flex-1 min-w-[180px] text-center">
          <div className="text-3xl font-bold text-brand-700">{avgPerDay}</div>
          <div className="text-brand-600">Média por Dia</div>
        </div>
        <div className="bg-brand-50 rounded-xl p-4 flex-1 min-w-[180px] text-center">
          <div className="text-lg font-bold text-brand-700">{mostActiveDay || '-'}</div>
          <div className="text-brand-600">Dia Mais Ativo</div>
        </div>
        <div className="bg-brand-50 rounded-xl p-4 flex-1 min-w-[180px] text-center">
          <div className="text-lg font-bold text-brand-700">{topListener}</div>
          <div className="text-brand-600">Top Escutante</div>
        </div>
      </div>

      {/* LINE CHART */}
      <LineChartBlock title="Submissões ao Longo do Tempo" data={lineData} />

      {/* CALENDAR HEATMAP */}
      <CalendarHeatmap />

      {/* BAR CHARTS SECTION */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-brand-700 mb-4">Distribuições e Rankings</h2>
        <div className="flex flex-wrap">
          <BarChartBlock title="Submissões por Utilizador" data={userCounts} />
          <BarChartBlock title="Localidades" data={topN(localidades, 15)} />
          <BarChartBlock title="Em Passiva (Repetição de respostas)" data={topN(emPassiva, 15)} />
        </div>
        <div className="flex flex-wrap">
          <BarChartBlock title="Qual é o risco" data={topN(risco, 15)} horizontal />
          <BarChartBlock title="Tema/as" data={topN(temas, 15)} horizontal />
        </div>
      </div>

      {/* PIE CHARTS SECTION */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-brand-700 mb-4">Quebra por Categoria</h2>
        <div className="flex flex-wrap">
          <PieChartBlock title="Dia da Semana" data={dayOfWeek} />
          <PieChartBlock title="Hora da Chamada" data={timeOfCall} />
          <PieChartBlock title="Tipo de Telefone" data={phoneType} />
          <PieChartBlock title="Sexo do Apelante" data={sex} />
          <PieChartBlock title="Idade" data={age} />
          <PieChartBlock title="Novo Apelante?" data={newCaller} />
          <PieChartBlock title="Habitué" data={habitue} />
          <PieChartBlock title="Habemos Habitué" data={habemos} />
          <PieChartBlock title="Ideação Suicida" data={ideacao} />
          <PieChartBlock title="Reencaminhamento" data={reenc} />
          <PieChartBlock title="Para onde?" data={paraOnde} />
          <PieChartBlock title="Passiva" data={passiva} />
        </div>
      </div>
    </div>
  );
}

export default DataCollectionHistory; 