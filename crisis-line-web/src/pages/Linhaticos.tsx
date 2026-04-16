import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getAllLinhaticos,
  addLinhatico,
  updateLinhaticoPaymentStatus,
  deleteLinhatico,
  bulkUpdatePaymentStatus,
} from '../services/linhaticoService';
import { translations } from '../utils/translations';

const Linhaticos: React.FC = () => {
  const { user } = useAuth();
  const [linhaticos, setLinhaticos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLinhaticoName, setNewLinhaticoName] = useState('');
  const [selectedLinhaticos, setSelectedLinhaticos] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDeleteIds, setConfirmDeleteIds] = useState<string[] | null>(null);

  const hasPermission = user && user.role === 'Administrador';

  useEffect(() => {
    if (hasPermission) fetchLinhaticos();
  }, [hasPermission]);

  const fetchLinhaticos = async () => {
    try {
      setLoading(true);
      const data = await getAllLinhaticos();
      setLinhaticos(data);
    } catch (error) {
      console.error('Error fetching linhaticos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLinhatico = async () => {
    if (!newLinhaticoName.trim()) return;
    try {
      setAdding(true);
      const newLinhatico = await addLinhatico({ name: newLinhaticoName.trim() });
      setLinhaticos(prev => [...prev, newLinhatico]);
      setNewLinhaticoName('');
    } catch (error) {
      console.error('Error adding linhatico:', error);
    } finally {
      setAdding(false);
    }
  };

  const handleTogglePaymentStatus = async (linhaticoId: string, currentStatus: boolean) => {
    try {
      setUpdating(linhaticoId);
      await updateLinhaticoPaymentStatus(linhaticoId, !currentStatus);
      setLinhaticos(prev =>
        prev.map(l => (l.id === linhaticoId ? { ...l, hasPaidAnnualFee: !currentStatus } : l))
      );
    } catch (error) {
      console.error('Error updating payment status:', error);
    } finally {
      setUpdating(null);
    }
  };

  const requestDeleteSingle = (linhaticoId: string) => {
    setConfirmDeleteIds([linhaticoId]);
  };

  const requestDeleteBulk = () => {
    if (selectedLinhaticos.length === 0) return;
    setConfirmDeleteIds([...selectedLinhaticos]);
  };

  const executeConfirmedDelete = async () => {
    if (!confirmDeleteIds?.length) return;
    const ids = confirmDeleteIds;
    setDeleting(ids.length > 1 ? '__bulk__' : ids[0]);
    try {
      await Promise.all(ids.map(id => deleteLinhatico(id)));
      setLinhaticos(prev => prev.filter(l => !ids.includes(l.id)));
      setSelectedLinhaticos([]);
      setConfirmDeleteIds(null);
    } catch (error) {
      console.error('Error deleting linhaticos:', error);
    } finally {
      setDeleting(null);
    }
  };

  const handleSelectAll = () => {
    if (selectedLinhaticos.length === linhaticos.length) setSelectedLinhaticos([]);
    else setSelectedLinhaticos(linhaticos.map(l => l.id));
  };

  const handleBulkUpdatePaymentStatus = async (hasPaid: boolean) => {
    if (selectedLinhaticos.length === 0) return;
    try {
      await bulkUpdatePaymentStatus(selectedLinhaticos, hasPaid);
      setLinhaticos(prev =>
        prev.map(l => (selectedLinhaticos.includes(l.id) ? { ...l, hasPaidAnnualFee: hasPaid } : l))
      );
      setSelectedLinhaticos([]);
    } catch (error) {
      console.error('Error bulk updating payment status:', error);
    }
  };

  const handleSelectLinhatico = (linhaticoId: string) => {
    setSelectedLinhaticos(prev =>
      prev.includes(linhaticoId) ? prev.filter(id => id !== linhaticoId) : [...prev, linhaticoId]
    );
  };

  if (!hasPermission) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="rounded-xl border border-gray-100 shadow-card overflow-hidden max-w-md w-full text-center p-8 bg-white">
          <h1 className="text-lg font-bold text-gray-800 mb-2">Acesso negado</h1>
          <p className="text-sm text-gray-500">Apenas Administradores podem aceder a esta página.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-[3px] border-brand-200 border-t-brand-500 animate-spin" />
          <p className="text-sm text-gray-400 font-medium">A carregar Linháticos...</p>
        </div>
      </div>
    );
  }

  const deleteModalCount = confirmDeleteIds?.length ?? 0;
  const deleteModalNames =
    confirmDeleteIds?.map(id => linhaticos.find(l => l.id === id)?.name).filter(Boolean).join(', ') ?? '';

  return (
    <div className="animate-fade-in space-y-6">
      <div className="rounded-xl border border-gray-100 shadow-card overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-brand-500 to-brand-400">
          <h1 className="text-lg font-bold text-white">{translations.pages.linhaticos.title}</h1>
          <p className="text-xs text-white/70 mt-0.5">{translations.pages.linhaticos.description}</p>
        </div>

        <div className="bg-white px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Adicionar Linhático</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newLinhaticoName}
              onChange={e => setNewLinhaticoName(e.target.value)}
              placeholder="Nome do Linhático"
              className="flex-1 rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 focus:bg-white outline-none transition-all"
              onKeyDown={e => e.key === 'Enter' && handleAddLinhatico()}
            />
            <button
              type="button"
              onClick={handleAddLinhatico}
              disabled={adding || !newLinhaticoName.trim()}
              className="shrink-0 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {adding ? 'A adicionar...' : 'Adicionar'}
            </button>
          </div>
        </div>

        <div className="bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-700">Lista ({linhaticos.length})</span>
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-100 hover:bg-brand-100 transition-colors"
            >
              {selectedLinhaticos.length === linhaticos.length && linhaticos.length > 0
                ? 'Limpar seleção'
                : 'Selecionar todos'}
            </button>
          </div>

          {selectedLinhaticos.length > 0 && (
            <div className="mx-5 mb-3 mt-2 rounded-lg border border-blue-100 bg-blue-50/80 px-4 py-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-blue-800">
                {selectedLinhaticos.length} selecionado(s)
              </span>
              <button
                type="button"
                onClick={() => handleBulkUpdatePaymentStatus(true)}
                className="px-2.5 py-1 rounded-md bg-white text-emerald-700 text-xs font-semibold border border-emerald-200 hover:bg-emerald-50 transition"
              >
                Marcar pago
              </button>
              <button
                type="button"
                onClick={() => handleBulkUpdatePaymentStatus(false)}
                className="px-2.5 py-1 rounded-md bg-white text-red-700 text-xs font-semibold border border-red-200 hover:bg-red-50 transition"
              >
                Marcar não pago
              </button>
              <button
                type="button"
                onClick={requestDeleteBulk}
                className="px-2.5 py-1 rounded-md bg-white text-gray-700 text-xs font-semibold border border-gray-200 hover:bg-gray-50 transition"
              >
                Eliminar
              </button>
            </div>
          )}

          <div className="overflow-x-auto px-5 pb-5">
            <table className="w-full min-w-[520px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="w-10 px-3 py-3 text-left">
                    <span className="sr-only">Seleção</span>
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Quota anual
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {linhaticos.map(linhatico => (
                  <tr key={linhatico.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedLinhaticos.includes(linhatico.id)}
                        onChange={() => handleSelectLinhatico(linhatico.id)}
                        className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-400"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">{linhatico.name}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleTogglePaymentStatus(linhatico.id, linhatico.hasPaidAnnualFee)}
                        disabled={updating === linhatico.id}
                        className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-semibold transition-all disabled:opacity-50 ${
                          linhatico.hasPaidAnnualFee
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                        }`}
                      >
                        {updating === linhatico.id ? '…' : linhatico.hasPaidAnnualFee ? 'Pago' : 'Não pago'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => requestDeleteSingle(linhatico.id)}
                        disabled={deleting === linhatico.id || deleting === '__bulk__'}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
                        title="Eliminar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {linhaticos.length === 0 && (
            <div className="px-5 pb-8 text-center text-sm text-gray-400">Nenhum Linhático encontrado.</div>
          )}
        </div>
      </div>

      {confirmDeleteIds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={() => setConfirmDeleteIds(null)} />
          <div className="relative w-full max-w-sm animate-scale-in overflow-hidden rounded-xl border border-gray-100 bg-white shadow-2xl">
            <div className="p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h2 className="mb-2 text-base font-bold text-gray-800">Confirmar eliminação</h2>
              <p className="text-sm leading-relaxed text-gray-500">
                {deleteModalCount === 1
                  ? `Eliminar o Linhático «${deleteModalNames}»? Esta ação não pode ser desfeita.`
                  : `Eliminar ${deleteModalCount} Linhático(s)? Esta ação não pode ser desfeita.`}
              </p>
              {deleteModalCount > 1 && deleteModalNames && (
                <p className="mt-2 text-xs text-gray-400 line-clamp-3">{deleteModalNames}</p>
              )}
            </div>
            <div className="flex gap-2 px-6 pb-6">
              <button
                type="button"
                onClick={() => setConfirmDeleteIds(null)}
                disabled={!!deleting}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeConfirmedDelete}
                disabled={!!deleting}
                className="flex-1 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    A eliminar...
                  </span>
                ) : (
                  'Eliminar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Linhaticos;
