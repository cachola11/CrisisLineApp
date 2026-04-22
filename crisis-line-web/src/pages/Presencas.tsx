import React, { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllUsers } from '../services/userService';
import {
  getAttendanceDates,
  addAttendanceDate,
  deleteAttendanceDate,
  getAllAttendanceRecords,
  markAttendance,
} from '../services/attendanceService';
import { format, parseISO, compareAsc } from 'date-fns';
import { pt } from 'date-fns/locale';
import ConfirmationModal from '../components/ConfirmationModal';

type AttendanceStatus = 'present' | 'absent' | 'neutral';

const STATUS_CYCLE: Record<AttendanceStatus, AttendanceStatus> = {
  present: 'absent',
  absent: 'neutral',
  neutral: 'present',
};

interface AttendanceCell {
  userId: string;
  date: string;
  status: AttendanceStatus;
}

interface UserRow {
  id: string;
  idNumber: string;
  name?: string;
  role?: string;
}

const MONTH_OPTIONS_PT = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

const ROLE_OPTIONS = [
  { value: 'Voluntário', label: 'Voluntários' },
  { value: 'Coordenador', label: 'Coordenadores' },
  { value: 'Administrador', label: 'Administradores' },
  { value: 'all', label: 'Todos os perfis' },
] as const;

const Presencas: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceCell>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('Voluntário');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddDateModal, setShowAddDateModal] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [addDateError, setAddDateError] = useState<string | null>(null);
  const [addDateLoading, setAddDateLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; date: string }>({ open: false, date: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const now = new Date();
  /** Any combination of these years × months defines which attendance dates appear (e.g. Dez 2024 + Jan 2025). */
  const [selectedYears, setSelectedYears] = useState<number[]>([now.getFullYear()]);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([now.getMonth() + 1]);
  /** Subset of `selectionDates` to show as columns; reset when ano/mês selection changes. */
  const [datesShownInGrid, setDatesShownInGrid] = useState<Set<string>>(() => new Set());
  const didSyncCalendarToData = useRef(false);

  const hasPermission = Boolean(user && (user.role === 'Coordenador' || user.role === 'Administrador'));

  /**
   * Sparse map: only absent and neutral are stored.
   * Missing key = present (default for a scheduled date).
   */
  const buildMapFromRecords = useCallback(
    (dateList: string[], records: { userId: string; date: string; status: string }[]) => {
      const dateSet = new Set(dateList);
      const map: Record<string, AttendanceCell> = {};
      records.forEach((record) => {
        if (!dateSet.has(record.date)) return;
        if (record.status !== 'absent' && record.status !== 'neutral') return;
        const key = `${record.userId}-${record.date}`;
        map[key] = { userId: record.userId, date: record.date, status: record.status as AttendanceStatus };
      });
      return map;
    },
    []
  );

  const fetchData = useCallback(async (opts?: { silent?: boolean }) => {
    if (!hasPermission) return;
    try {
      if (opts?.silent) setRefreshing(true);
      else setLoading(true);
      setBannerError(null);
      const [allUsers, rawDates, attendanceRecords] = await Promise.all([
        getAllUsers(),
        getAttendanceDates(),
        getAllAttendanceRecords(),
      ]);

      const withId = (allUsers as UserRow[])
        .filter(
          (u) =>
            u.idNumber != null &&
            String(u.idNumber).trim() !== '' &&
            u.role !== 'Visitante'
        )
        .sort((a, b) => String(a.idNumber).localeCompare(String(b.idNumber), 'pt'));

      const uniqueDates = [...new Set(rawDates as string[])].sort((a, b) => compareAsc(parseISO(a), parseISO(b)));

      setUsers(withId);
      setDates(uniqueDates);
      setAttendanceMap(buildMapFromRecords(uniqueDates, attendanceRecords));
    } catch (e) {
      console.error('Presencas fetch error:', e);
      setBannerError('Não foi possível carregar os dados. Tente atualizar a página.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hasPermission, buildMapFromRecords]);

  useEffect(() => {
    if (hasPermission) fetchData();
  }, [hasPermission, fetchData]);

  /** After first data load, align selection with the most recent attendance date. */
  useEffect(() => {
    if (dates.length === 0 || didSyncCalendarToData.current) return;
    didSyncCalendarToData.current = true;
    const last = dates[dates.length - 1];
    const dt = parseISO(last);
    setSelectedYears([dt.getFullYear()]);
    setSelectedMonths([dt.getMonth() + 1]);
  }, [dates]);

  const yearOptions = useMemo(() => {
    const ys = new Set<number>();
    dates.forEach((d) => ys.add(parseISO(d).getFullYear()));
    if (ys.size === 0) ys.add(new Date().getFullYear());
    return Array.from(ys).sort((a, b) => b - a);
  }, [dates]);

  const selectedYearSet = useMemo(() => new Set(selectedYears), [selectedYears]);
  const selectedMonthSet = useMemo(() => new Set(selectedMonths), [selectedMonths]);
  const selectionReady = selectedYears.length > 0 && selectedMonths.length > 0;

  const selectionDates = useMemo(() => {
    if (!selectionReady) return [];
    return dates.filter((d) => {
      const dt = parseISO(d);
      return selectedYearSet.has(dt.getFullYear()) && selectedMonthSet.has(dt.getMonth() + 1);
    });
  }, [dates, selectedYearSet, selectedMonthSet, selectionReady]);

  const selectionDateCount = selectionDates.length;

  const selectionDatesKey = useMemo(() => selectionDates.join('|'), [selectionDates]);

  useLayoutEffect(() => {
    setDatesShownInGrid(new Set(selectionDates));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when the set of ISO dates changes (key)
  }, [selectionDatesKey]);

  const countsByYear = useMemo(() => {
    if (!selectionReady) return [];
    return [...selectedYears]
      .sort((a, b) => b - a)
      .map((year) => ({
        year,
        count: dates.filter((d) => {
          const dt = parseISO(d);
          return dt.getFullYear() === year && selectedMonthSet.has(dt.getMonth() + 1);
        }).length,
      }));
  }, [dates, selectedYears, selectedMonthSet, selectionReady]);

  /** Dates per calendar month (1–12) among currently selected years — shown on month buttons before toggling months. */
  const monthCountsInSelectedYears = useMemo(() => {
    const byMonth = Array.from({ length: 12 }, () => 0);
    if (selectedYears.length === 0) return byMonth;
    dates.forEach((d) => {
      const dt = parseISO(d);
      if (!selectedYearSet.has(dt.getFullYear())) return;
      byMonth[dt.getMonth()] += 1;
    });
    return byMonth;
  }, [dates, selectedYearSet, selectedYears]);

  const totalDatesPerSelectedYear = useMemo(() => {
    const map = new Map<number, number>();
    selectedYears.forEach((y) => map.set(y, 0));
    if (map.size === 0) return map;
    dates.forEach((d) => {
      const y = parseISO(d).getFullYear();
      if (map.has(y)) map.set(y, (map.get(y) ?? 0) + 1);
    });
    return map;
  }, [dates, selectedYears]);

  const totalDatesInSelectedYears = useMemo(
    () => dates.filter((d) => selectedYearSet.has(parseISO(d).getFullYear())).length,
    [dates, selectedYearSet]
  );

  const visibleDates = useMemo(
    () => selectionDates.filter((d) => datesShownInGrid.has(d)),
    [selectionDates, datesShownInGrid]
  );

  const selectionSummaryLabel = useMemo(() => {
    const ys = [...selectedYears].sort((a, b) => a - b);
    const ms = [...selectedMonths].sort((a, b) => a - b);
    if (ys.length === 0) return 'nenhum ano selecionado';
    if (ms.length === 0) return 'nenhum mês selecionado';
    const monthBits = ms.map((m) => format(new Date(2000, m - 1, 1), 'MMM', { locale: pt }));
    return `${monthBits.join(', ')} · ${ys.join(', ')}`;
  }, [selectedYears, selectedMonths]);

  const toggleYear = (y: number) => {
    setSelectedYears((prev) => {
      if (prev.includes(y)) return prev.filter((x) => x !== y);
      return [...prev, y].sort((a, b) => b - a);
    });
  };

  const toggleMonth = (m: number) => {
    setSelectedMonths((prev) => {
      if (prev.includes(m)) return prev.filter((x) => x !== m);
      return [...prev, m].sort((a, b) => a - b);
    });
  };

  const selectAllDatesInSelection = () => {
    setDatesShownInGrid(new Set(selectionDates));
  };

  const toggleDateInGrid = (iso: string) => {
    setDatesShownInGrid((prev) => {
      const next = new Set(prev);
      if (next.has(iso)) next.delete(iso);
      else next.add(iso);
      return next;
    });
  };

  const allSelectionDatesShown =
    selectionDateCount > 0 &&
    datesShownInGrid.size === selectionDateCount &&
    selectionDates.every((d) => datesShownInGrid.has(d));

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return users.filter((u) => {
      if (q && !String(u.idNumber).toLowerCase().includes(q)) return false;
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      return true;
    });
  }, [users, searchTerm, roleFilter]);

  /** When the search narrows to exactly one user, show stats and attendance analysis instead of the full grid. */
  const focusUser = useMemo(() => {
    const q = searchTerm.trim();
    if (!q || filteredUsers.length !== 1) return null;
    return filteredUsers[0];
  }, [searchTerm, filteredUsers]);

  const getStatus = (idNumber: string, date: string): AttendanceStatus => {
    const key = `${idNumber}-${date}`;
    return attendanceMap[key]?.status ?? 'present';
  };

  const focusUserAnalysis = useMemo(() => {
    if (!focusUser) return null;
    const id = focusUser.idNumber;
    let present = 0;
    let absent = 0;
    let neutral = 0;
    let absentStreak = 0;
    let maxAbsentStreak = 0;
    const rows: { date: string; status: AttendanceStatus }[] = [];
    for (const d of selectionDates) {
      const key = `${id}-${d}`;
      const st: AttendanceStatus = attendanceMap[key]?.status ?? 'present';
      rows.push({ date: d, status: st });
      if (st === 'present') present += 1;
      else if (st === 'absent') absent += 1;
      else neutral += 1;
      if (st === 'absent') {
        absentStreak += 1;
        maxAbsentStreak = Math.max(maxAbsentStreak, absentStreak);
      } else {
        absentStreak = 0;
      }
    }
    const total = selectionDates.length;
    const attendanceRatePct = total > 0 ? Math.round((present / total) * 1000) / 10 : 0;
    const absentRatePct = total > 0 ? Math.round((absent / total) * 1000) / 10 : 0;
    return {
      present,
      absent,
      neutral,
      total,
      attendanceRatePct,
      absentRatePct,
      maxAbsentStreak,
      rows,
    };
  }, [focusUser, selectionDates, attendanceMap]);

  const countStatusForDate = (date: string, status: AttendanceStatus) =>
    filteredUsers.filter((u) => getStatus(u.idNumber, date) === status).length;

  const handleToggle = async (idNumber: string, date: string) => {
    if (!user?.uid) return;
    const key = `${idNumber}-${date}`;
    const prev = getStatus(idNumber, date);
    const next = STATUS_CYCLE[prev];
    setSavingKey(key);
    setBannerError(null);
    setAttendanceMap((p) => {
      const copy = { ...p };
      if (next === 'present') delete copy[key];
      else copy[key] = { userId: idNumber, date, status: next };
      return copy;
    });
    try {
      await markAttendance(idNumber, date, next, user.uid);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao guardar.';
      setBannerError(msg);
      setAttendanceMap((p) => {
        const copy = { ...p };
        if (prev === 'present') delete copy[key];
        else copy[key] = { userId: idNumber, date, status: prev };
        return copy;
      });
    } finally {
      setSavingKey(null);
    }
  };

  const cellButtonClass = (status: AttendanceStatus) => {
    if (status === 'present') {
      return 'border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600';
    }
    if (status === 'neutral') {
      return 'border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-500';
    }
    return 'border-red-300 bg-white text-red-600 hover:bg-red-50 hover:border-red-400';
  };

  const cellTitle = (status: AttendanceStatus) => {
    const next = STATUS_CYCLE[status];
    const nextLabel = next === 'present' ? 'presente' : next === 'absent' ? 'ausente' : 'neutro';
    if (status === 'present') return `Presente — clique para ${nextLabel}`;
    if (status === 'absent') return `Ausente — clique para ${nextLabel}`;
    return `Neutro — clique para ${nextLabel}`;
  };

  const cellGlyph = (status: AttendanceStatus) => {
    if (status === 'present') return '✓';
    if (status === 'neutral') return '○';
    return '—';
  };

  const spinnerClass = (status: AttendanceStatus) => {
    if (status === 'present') return 'border-white/50 border-t-white';
    if (status === 'neutral') return 'border-amber-200 border-t-amber-600';
    return 'border-gray-200 border-t-brand-500';
  };

  const handleAddDate = async () => {
    if (!newDate) {
      setAddDateError('Escolha uma data.');
      return;
    }
    setAddDateError(null);
    if (dates.includes(newDate)) {
      setAddDateError('Esta data já existe.');
      return;
    }
    setAddDateLoading(true);
    try {
      await addAttendanceDate(newDate);
      const nextDates = [...dates, newDate].sort((a, b) => compareAsc(parseISO(a), parseISO(b)));
      setDates(nextDates);
      const dt = parseISO(newDate);
      const y = dt.getFullYear();
      const mon = dt.getMonth() + 1;
      setSelectedYears((prev) => (prev.includes(y) ? prev : [...prev, y].sort((a, b) => b - a)));
      setSelectedMonths((prev) => (prev.includes(mon) ? prev : [...prev, mon].sort((a, b) => a - b)));
      setNewDate('');
      setShowAddDateModal(false);
    } catch (e: unknown) {
      setAddDateError(e instanceof Error ? e.message : 'Erro ao adicionar.');
    } finally {
      setAddDateLoading(false);
    }
  };

  const openDeleteConfirm = (date: string) => {
    setDeleteConfirm({ open: true, date });
  };

  const handleDeleteDate = async () => {
    const d = deleteConfirm.date;
    if (!d) return;
    setDeleteLoading(true);
    setBannerError(null);
    try {
      await deleteAttendanceDate(d);
      setDates((prev) => prev.filter((x) => x !== d));
      setAttendanceMap((prev) => {
        const copy = { ...prev };
        Object.keys(copy).forEach((k) => {
          if (k.endsWith(`-${d}`)) delete copy[k];
        });
        return copy;
      });
      setDeleteConfirm({ open: false, date: '' });
    } catch (e) {
      console.error(e);
      setBannerError('Não foi possível eliminar a data.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const roleBadge = (role?: string) => {
    const base = 'text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md border';
    const map: Record<string, string> = {
      Voluntário: 'bg-blue-50 text-blue-700 border-blue-200',
      Coordenador: 'bg-violet-50 text-violet-700 border-violet-200',
      Administrador: 'bg-rose-50 text-rose-700 border-rose-200',
    };
    return `${base} ${map[role || ''] || 'bg-gray-50 text-gray-600 border-gray-200'}`;
  };

  if (!hasPermission) {
    return (
      <div className="animate-fade-in flex items-center justify-center min-h-[50vh] px-4">
        <div className="rounded-xl border border-gray-100 shadow-card max-w-md w-full text-center p-8 bg-white">
          <h1 className="text-lg font-bold text-gray-800 mb-2">Acesso negado</h1>
          <p className="text-sm text-gray-500">Apenas Coordenadores e Administradores podem gerir presenças.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-[3px] border-brand-200 border-t-brand-500 animate-spin" />
          <p className="text-sm text-gray-400 font-medium">A carregar presenças…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="rounded-xl border border-gray-100 shadow-card overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4 bg-gradient-to-r from-brand-500 to-brand-400">
          <div>
            <h1 className="text-lg font-bold text-white">Presenças</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => fetchData({ silent: true })}
              disabled={refreshing}
              className="px-3 py-1.5 rounded-lg bg-white/15 text-white text-xs font-semibold border border-white/25 hover:bg-white/25 transition-colors disabled:opacity-50"
            >
              {refreshing ? 'A atualizar…' : 'Atualizar'}
            </button>
            <button
              type="button"
              onClick={() => {
                setAddDateError(null);
                setNewDate('');
                setShowAddDateModal(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-white text-brand-600 text-xs font-semibold shadow-sm hover:bg-gray-50 transition-colors"
            >
              + Nova data
            </button>
          </div>
        </div>

        {bannerError && (
          <div className="px-5 py-3 bg-red-50 border-b border-red-100 text-sm text-red-700 font-medium">{bannerError}</div>
        )}

        <div className="bg-white px-5 py-4 border-b border-gray-100 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            <div className="flex-1 min-w-0">
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Pesquisar por IdNumber
              </label>
              <div className="flex flex-wrap items-center gap-2 max-w-md">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ex: 12345 — um único resultado abre estatísticas"
                  className="block flex-1 min-w-[12rem] rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 focus:bg-white outline-none transition-all"
                />
                {searchTerm.trim() !== '' && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="shrink-0 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 border border-gray-200 bg-white hover:bg-gray-50"
                  >
                    Limpar
                  </button>
                )}
              </div>
              {focusUser && (
                <p className="text-[11px] text-brand-600 font-medium mt-1.5">
                  Modo análise: estatísticas e histórico para este Id no período selecionado (anos e meses acima).
                </p>
              )}
            </div>
            <div className="w-full lg:w-56">
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Perfil</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-800 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {dates.length > 0 && (
            <div className="rounded-xl border border-gray-100 bg-gray-50/40 px-4 py-4 space-y-4">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Anos
                  </label>
                  <span className="text-[10px] text-gray-400">Clique para incluir ou retirar</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {yearOptions.map((y) => {
                    const on = selectedYears.includes(y);
                    return (
                      <button
                        key={y}
                        type="button"
                        onClick={() => toggleYear(y)}
                        className={`min-w-[4.5rem] px-3 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                          on
                            ? 'border-brand-500 bg-brand-500 text-white shadow-sm'
                            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {y}
                        {on && (
                          <span className="ml-1.5 text-[10px] font-normal opacity-90" aria-hidden>
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {selectedYears.length > 0 && (
                  <p className="text-[11px] text-gray-500 mt-2">
                    Selecionados:{' '}
                    {[...selectedYears]
                      .sort((a, b) => b - a)
                      .map((y) => {
                        const c = totalDatesPerSelectedYear.get(y) ?? 0;
                        return `${y} (${c})`;
                      })
                      .join(' · ')}
                  </p>
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Meses
                  </label>
                  <span className="text-[10px] text-gray-400">
                    Número = datas nos anos selecionados (soma se vários anos)
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {MONTH_OPTIONS_PT.map(({ value: m, label }) => {
                    const on = selectedMonths.includes(m);
                    const monthCount = monthCountsInSelectedYears[m - 1] ?? 0;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggleMonth(m)}
                        className={`px-2 py-2 rounded-xl text-xs font-semibold border transition-colors text-center leading-tight ${
                          on
                            ? 'border-brand-500 bg-brand-500 text-white shadow-sm'
                            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className="block">{label}</span>
                        <span
                          className={`block text-[11px] font-bold tabular-nums mt-0.5 ${
                            on ? 'text-white/90' : 'text-brand-600'
                          }`}
                        >
                          ({monthCount})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {!focusUser && (
                <div className="rounded-xl border border-dashed border-gray-200 bg-white/60 px-4 py-3 space-y-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                      Datas na grelha
                    </span>
                    <p className="text-xs text-gray-500">
                      <span className="font-semibold text-gray-700 capitalize">{selectionSummaryLabel}</span>
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">
                    Escolha quais colunas mostrar. Por defeito todas as datas da seleção estão ativas.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={selectAllDatesInSelection}
                      disabled={selectionDateCount === 0}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                        allSelectionDatesShown
                          ? 'border-brand-500 bg-brand-500 text-white shadow-sm'
                          : 'border-brand-200 bg-brand-50 text-brand-800 hover:bg-brand-100'
                      } disabled:opacity-40 disabled:pointer-events-none`}
                    >
                      Todas
                    </button>
                    {selectionDates.map((iso) => {
                      const on = datesShownInGrid.has(iso);
                      return (
                        <button
                          key={iso}
                          type="button"
                          onClick={() => toggleDateInGrid(iso)}
                          aria-pressed={on}
                          className={`min-w-[5.5rem] px-2.5 py-2 rounded-xl text-xs font-mono font-semibold border transition-colors ${
                            on
                              ? 'border-brand-500 bg-brand-500 text-white shadow-sm'
                              : 'border-gray-200 bg-white text-gray-400 hover:bg-gray-50'
                          }`}
                        >
                          {format(parseISO(iso), 'dd/MM/yy', { locale: pt })}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Na grelha: <span className="font-semibold text-gray-700">{visibleDates.length}</span> de{' '}
                    <span className="font-semibold text-gray-700">{selectionDateCount}</span> data
                    {selectionDateCount === 1 ? '' : 's'}.
                  </p>
                </div>
              )}
            </div>
          )}

          {dates.length > 0 && filteredUsers.length > 0 && visibleDates.length > 0 && !focusUser && (
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide self-center mr-1">
                Resumo (datas visíveis)
              </span>
              {visibleDates.map((date) => {
                const p = countStatusForDate(date, 'present');
                const n = countStatusForDate(date, 'neutral');
                const a = countStatusForDate(date, 'absent');
                return (
                  <span
                    key={date}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-100 bg-gray-50/80 px-2.5 py-1 text-xs text-gray-700"
                  >
                    <span className="font-mono font-semibold">{format(parseISO(date), 'dd/MM/yy', { locale: pt })}</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-emerald-700 font-semibold" title="Presentes">
                      {p}✓
                    </span>
                    <span className="text-amber-700 font-semibold" title="Neutro">
                      {n}○
                    </span>
                    <span className="text-red-600 font-semibold" title="Ausentes">
                      {a}—
                    </span>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white">
          {dates.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-brand-50 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-sm font-bold text-gray-800 mb-1">Comece por uma data de presença</h2>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                Por defeito todos começam como presentes. Clique na célula para alternar: presente → ausente → neutro →
                presente.
              </p>
              <button
                type="button"
                onClick={() => {
                  setAddDateError(null);
                  setNewDate('');
                  setShowAddDateModal(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 shadow-sm transition-colors"
              >
                + Adicionar primeira data
              </button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-14 px-4">
              <p className="text-sm text-gray-500">
                {searchTerm
                  ? 'Nenhum utilizador corresponde à pesquisa com o perfil selecionado.'
                  : 'Nenhum utilizador com este perfil na base de dados.'}
              </p>
            </div>
          ) : !selectionReady ? (
            <div className="text-center py-14 px-4">
              <p className="text-sm text-gray-600 font-medium mb-1">Escolha anos e meses</p>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Selecione pelo menos um ano e um mês em cima. Pode combinar vários (por exemplo dezembro de um ano e
                janeiro do seguinte) para ver todas as colunas nessa união.
              </p>
            </div>
          ) : selectionDateCount === 0 ? (
            <div className="text-center py-14 px-4">
              <p className="text-sm text-gray-600 font-medium mb-1">Sem datas nesta seleção</p>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Não existem colunas de presença para{' '}
                <span className="font-semibold text-gray-700 capitalize">{selectionSummaryLabel}</span>.
                {totalDatesInSelectedYears > 0
                  ? ' Há datas noutros meses nos anos que escolheu — ative mais meses ou altere os anos.'
                  : ' Ative outros meses ou anos, ou adicione uma nova data.'}
              </p>
            </div>
          ) : focusUser && focusUserAnalysis ? (
            <div className="px-5 py-6 space-y-6">
              <div className="rounded-xl border border-brand-100 bg-gradient-to-br from-brand-50/90 to-white px-5 py-4 shadow-sm">
                <p className="text-[11px] font-semibold text-brand-700 uppercase tracking-wide mb-2">
                  Estatísticas do utilizador
                </p>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-2xl font-mono font-bold text-gray-900 tracking-tight">{focusUser.idNumber}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {focusUser.role && <span className={roleBadge(focusUser.role)}>{focusUser.role}</span>}
                      {focusUser.name && (
                        <span className="text-sm text-gray-600 truncate max-w-[280px]">{focusUser.name}</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="shrink-0 px-4 py-2 rounded-xl text-xs font-semibold text-brand-700 bg-white border border-brand-200 hover:bg-brand-50 shadow-sm"
                  >
                    Ver grelha completa
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Período: <span className="font-semibold text-gray-700 capitalize">{selectionSummaryLabel}</span>
                  <span className="text-gray-400"> · </span>
                  <span className="font-semibold text-gray-700">{focusUserAnalysis.total}</span>{' '}
                  {focusUserAnalysis.total === 1 ? 'sessão' : 'sessões'} no calendário de presenças
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Presentes</p>
                  <p className="text-xl font-bold text-emerald-700 tabular-nums mt-0.5">{focusUserAnalysis.present}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Ausentes</p>
                  <p className="text-xl font-bold text-red-600 tabular-nums mt-0.5">{focusUserAnalysis.absent}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Neutro</p>
                  <p className="text-xl font-bold text-amber-700 tabular-nums mt-0.5">{focusUserAnalysis.neutral}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Taxa presença</p>
                  <p className="text-xl font-bold text-gray-900 tabular-nums mt-0.5">
                    {focusUserAnalysis.total > 0 ? `${focusUserAnalysis.attendanceRatePct}%` : '—'}
                  </p>
                  {focusUserAnalysis.total > 0 && (
                    <p className="text-[10px] text-gray-500 mt-0.5">{focusUserAnalysis.absentRatePct}% ausências</p>
                  )}
                </div>
              </div>

              {focusUserAnalysis.total > 0 && (
                <div>
                  <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden border border-gray-100">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-[width] duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, focusUserAnalysis.attendanceRatePct))}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1.5">
                    Proporção de sessões marcadas como presente no período (por defeito, sessão sem registo conta como
                    presente).
                  </p>
                </div>
              )}

              {focusUserAnalysis.maxAbsentStreak >= 2 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
                  <span className="font-semibold">Análise:</span> maior sequência de{' '}
                  <span className="font-mono font-bold">{focusUserAnalysis.maxAbsentStreak}</span> ausências
                  consecutivas neste período.
                </div>
              )}

              <div>
                <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Histórico no período (cronológico)
                </h3>
                <div className="rounded-xl border border-gray-100 overflow-hidden max-h-[min(55vh,480px)] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider w-[100px]">
                          Alterar
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {focusUserAnalysis.rows.map(({ date, status }) => {
                        const toggleKey = `${focusUser.idNumber}-${date}`;
                        const busy = savingKey === toggleKey;
                        const stateLabel =
                          status === 'present' ? 'Presente' : status === 'absent' ? 'Ausente' : 'Neutro';
                        const stateClass =
                          status === 'present'
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                            : status === 'absent'
                              ? 'text-red-700 bg-red-50 border-red-100'
                              : 'text-amber-800 bg-amber-50 border-amber-100';
                        return (
                          <tr key={date} className="hover:bg-gray-50/50">
                            <td className="px-4 py-2.5 font-mono font-semibold text-gray-800 whitespace-nowrap">
                              {format(parseISO(date), 'dd/MM/yyyy (EEE)', { locale: pt })}
                            </td>
                            <td className="px-4 py-2.5">
                              <span
                                className={`inline-flex items-center text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border ${stateClass}`}
                              >
                                {stateLabel}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleToggle(focusUser.idNumber, date)}
                                className={`relative mx-auto flex h-9 w-9 items-center justify-center rounded-lg border-2 text-xs font-bold transition-all disabled:opacity-60 ${cellButtonClass(status)}`}
                                title={cellTitle(status)}
                              >
                                {busy ? (
                                  <span
                                    className={`h-3.5 w-3.5 rounded-full border-2 animate-spin ${spinnerClass(status)}`}
                                  />
                                ) : (
                                  cellGlyph(status)
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : visibleDates.length === 0 ? (
            <div className="text-center py-14 px-4">
              <p className="text-sm text-gray-600 font-medium mb-1">Nenhuma data visível na grelha</p>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                {selectionDateCount > 0
                  ? `Há ${selectionDateCount} data${selectionDateCount === 1 ? '' : 's'} na seleção de ano/mês, mas nenhuma está ativa em &quot;Datas na grelha&quot;. Clique em &quot;Todas&quot; ou ative datas individuais.`
                  : 'Não há datas para mostrar.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto" style={{ maxHeight: 'min(70vh, 640px)' }}>
              <table className="w-full min-w-[520px]">
                <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider sticky left-0 z-20 bg-gray-50 min-w-[160px] shadow-[4px_0_12px_-4px_rgba(0,0,0,0.08)]">
                      Utilizador
                    </th>
                    {visibleDates.map((date) => {
                      const p = countStatusForDate(date, 'present');
                      const n = countStatusForDate(date, 'neutral');
                      const a = countStatusForDate(date, 'absent');
                      return (
                      <th key={date} className="px-2 py-3 text-center min-w-[104px] align-bottom">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="text-xs font-mono font-semibold text-gray-700">
                            {format(parseISO(date), 'dd/MM/yy', { locale: pt })}
                          </span>
                          <span className="text-[10px] font-semibold leading-tight">
                            <span className="text-emerald-600">{p}</span>
                            <span className="text-gray-300 mx-0.5">·</span>
                            <span className="text-amber-600">{n}</span>
                            <span className="text-gray-300 mx-0.5">·</span>
                            <span className="text-red-600">{a}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => openDeleteConfirm(date)}
                            className="text-[10px] font-semibold text-red-600 hover:text-red-700 hover:underline"
                          >
                            Eliminar coluna
                          </button>
                        </div>
                      </th>
                    );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50/40 transition-colors">
                      <td className="px-4 py-2.5 sticky left-0 z-[5] bg-white shadow-[4px_0_12px_-4px_rgba(0,0,0,0.06)]">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-mono font-semibold text-gray-900">{row.idNumber}</span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {row.role && <span className={roleBadge(row.role)}>{row.role}</span>}
                            {row.name && <span className="text-[11px] text-gray-500 truncate max-w-[140px]">{row.name}</span>}
                          </div>
                        </div>
                      </td>
                      {visibleDates.map((date) => {
                        const status = getStatus(row.idNumber, date);
                        const key = `${row.idNumber}-${date}`;
                        const busy = savingKey === key;
                        return (
                          <td key={date} className="px-1.5 py-2 text-center align-middle">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleToggle(row.idNumber, date)}
                              className={`relative mx-auto flex h-10 w-10 items-center justify-center rounded-xl border-2 text-sm font-bold transition-all shadow-sm disabled:opacity-60 ${cellButtonClass(status)}`}
                              title={cellTitle(status)}
                            >
                              {busy ? (
                                <span className={`h-4 w-4 rounded-full border-2 animate-spin ${spinnerClass(status)}`} />
                              ) : (
                                cellGlyph(status)
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!loading && dates.length > 0 && filteredUsers.length > 0 && (
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
            {focusUser ? (
              <>
                <span>
                  Modo análise para <span className="font-mono font-semibold text-gray-700">{focusUser.idNumber}</span>
                  {selectionReady && selectedYears.length > 0 && (
                    <span className="text-gray-400">
                      {' '}
                      ·{' '}
                      {countsByYear.map(({ year, count }, i) => (
                        <span key={year}>
                          {i > 0 ? ' · ' : ''}
                          <span className="font-semibold text-gray-600">{count}</span> datas em {year}
                        </span>
                      ))}
                    </span>
                  )}
                </span>
                <span className="text-gray-400">
                  Ciclo nas células: ✓ presente · — ausente · ○ neutro. Alterações gravadas no servidor.
                </span>
              </>
            ) : (
              <>
                <span>
                  <span className="font-semibold text-gray-700">{filteredUsers.length}</span> linha
                  {filteredUsers.length === 1 ? '' : 's'}
                </span>
                <span>
                  <span className="font-semibold text-gray-700">{visibleDates.length}</span> coluna
                  {visibleDates.length === 1 ? '' : 's'} visíve{visibleDates.length === 1 ? 'l' : 'is'}
                  {selectionReady && visibleDates.length !== selectionDateCount && selectionDateCount > 0 && (
                    <span className="text-gray-400">
                      {' '}
                      (<span className="font-semibold text-gray-600">{selectionDateCount}</span> na seleção ano×mês)
                    </span>
                  )}
                  {selectionReady && selectedYears.length > 0 && (
                    <span className="text-gray-400">
                      {' '}
                      ·{' '}
                      {countsByYear.map(({ year, count }, i) => (
                        <span key={year}>
                          {i > 0 ? ' · ' : ''}
                          <span className="font-semibold text-gray-600">{count}</span> em {year}
                        </span>
                      ))}
                    </span>
                  )}
                </span>
                <span className="text-gray-400">
                  Ciclo: ✓ presente · — ausente · ○ neutro. Os toques são gravados no servidor.
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {showAddDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={() => !addDateLoading && setShowAddDateModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-sm overflow-hidden animate-scale-in">
            <div className="px-5 py-4 bg-gradient-to-r from-brand-500 to-brand-400">
              <h2 className="text-sm font-bold text-white">Nova data de presenças</h2>
              <p className="text-[11px] text-white/75 mt-1">
                Nova coluna: todos começam como presentes. Células alternam presente → ausente → neutro.
              </p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Data</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-800 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none"
                />
              </div>
              {addDateError && <p className="text-xs text-red-600 font-medium">{addDateError}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={addDateLoading}
                  onClick={() => setShowAddDateModal(false)}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={addDateLoading}
                  onClick={handleAddDate}
                  className="flex-1 px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-50"
                >
                  {addDateLoading ? 'A guardar…' : 'Adicionar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteConfirm.open}
        onClose={() => !deleteLoading && setDeleteConfirm({ open: false, date: '' })}
        onConfirm={handleDeleteDate}
        title="Eliminar data de presenças"
        message={
          deleteConfirm.date
            ? `Esta ação remove a coluna ${format(parseISO(deleteConfirm.date), 'dd/MM/yyyy', { locale: pt })} e todos os registos de presença associados. Não pode ser desfeita.`
            : ''
        }
        confirmText="Eliminar"
        isLoading={deleteLoading}
      />
    </div>
  );
};

export default Presencas;
