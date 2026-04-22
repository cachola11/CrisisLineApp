import React, { useState, useEffect } from 'react';
import { getSignUpsForEvent, signUpUserToEvent, cancelSignUpForEvent } from '../services/eventService';
import { getUserByRoleIdNumber } from '../services/userService';

interface ManageEventSignUpsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any | null;
  allUsers: any[];
  onCountsChange: (eventId: string, count: number) => void;
}

const ManageEventSignUpsModal: React.FC<ManageEventSignUpsModalProps> = ({
  isOpen,
  onClose,
  event,
  allUsers,
  onCountsChange,
}) => {
  const [signUps, setSignUps] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [addIdNumber, setAddIdNumber] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !event?.id) return;
    setAddIdNumber('');
    setAddSuccess(null);
    let cancelled = false;
    (async () => {
      setListLoading(true);
      setError(null);
      try {
        const list = await getSignUpsForEvent(event.id);
        if (!cancelled) setSignUps(list);
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || 'Erro ao carregar inscrições.');
          setSignUps([]);
        }
      } finally {
        if (!cancelled) setListLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, event?.id]);

  const displayForUserId = (userId: string) => {
    const u = allUsers.find((x: any) => x.id === userId);
    if (u?.idNumber != null && u.idNumber !== '') return String(u.idNumber);
    return userId.length > 12 ? `${userId.slice(0, 10)}…` : userId;
  };

  const handleRemove = async (userId: string) => {
    if (!event?.id) return;
    setRemovingUserId(userId);
    setError(null);
    setAddSuccess(null);
    try {
      await cancelSignUpForEvent(event.id, userId);
      const list = await getSignUpsForEvent(event.id);
      setSignUps(list);
      onCountsChange(event.id, list.length);
    } catch (e: any) {
      setError(e.message || 'Erro ao remover inscrição.');
    } finally {
      setRemovingUserId(null);
    }
  };

  const handleAdd = async () => {
    if (!event?.id || !addIdNumber.trim()) {
      setError('Indique o IdNumber do utilizador.');
      return;
    }
    setAddLoading(true);
    setError(null);
    setAddSuccess(null);
    try {
      const found = await getUserByRoleIdNumber(addIdNumber.trim());
      if (!found) {
        setError('Utilizador com este IdNumber não existe.');
        setAddLoading(false);
        return;
      }
      const uid = (found as any).uid;
      await signUpUserToEvent(event.id, uid, true);
      const list = await getSignUpsForEvent(event.id);
      setSignUps(list);
      onCountsChange(event.id, list.length);
      setAddIdNumber('');
      setAddSuccess('Inscrição adicionada.');
    } catch (e: any) {
      setError(e.message || 'Erro ao inscrever.');
    } finally {
      setAddLoading(false);
    }
  };

  if (!isOpen || !event) return null;

  const cap = event.maxCapacity;
  const capLabel = cap === 0 ? `${signUps.length} inscritos (sem limite)` : `${signUps.length} / ${cap} inscritos`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/25 backdrop-blur-sm"
        onClick={() => {
          onClose();
          setError(null);
          setAddSuccess(null);
        }}
      />
      <div className="relative bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-md max-h-[min(90vh,520px)] flex flex-col animate-scale-in overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-brand-500 to-brand-400 shrink-0">
          <h2 className="text-sm font-bold text-white">Gerir inscrições</h2>
          <p className="text-xs text-white/80 mt-0.5 font-medium truncate">{event.title}</p>
          <p className="text-[11px] text-white/60 mt-1">{capLabel}</p>
        </div>

        <div className="p-5 flex-1 flex flex-col min-h-0 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Adicionar por IdNumber</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: 12345"
                value={addIdNumber}
                onChange={(e) => setAddIdNumber(e.target.value)}
                className="flex-1 min-w-0 rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 focus:bg-white outline-none"
              />
              <button
                type="button"
                onClick={handleAdd}
                disabled={addLoading}
                className="shrink-0 px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-50"
              >
                {addLoading ? '…' : 'Adicionar'}
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
          {addSuccess && <p className="text-xs text-emerald-600 font-medium">{addSuccess}</p>}

          <div className="flex-1 min-h-0 flex flex-col border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
              Inscritos ({listLoading ? '…' : signUps.length})
            </div>
            <div className="flex-1 overflow-y-auto min-h-[120px] max-h-[240px]">
              {listLoading ? (
                <div className="flex items-center justify-center py-10">
                  <span className="h-6 w-6 rounded-full border-2 border-gray-200 border-t-brand-500 animate-spin" />
                </div>
              ) : signUps.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8 px-4">Nenhuma inscrição neste evento.</p>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {signUps.map((su) => (
                    <li
                      key={su.id || `${su.eventId}-${su.userId}`}
                      className="flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-gray-50/80"
                    >
                      <span className="text-sm font-mono text-gray-800 truncate">{displayForUserId(su.userId)}</span>
                      <button
                        type="button"
                        title="Remover inscrição"
                        onClick={() => handleRemove(su.userId)}
                        disabled={removingUserId === su.userId}
                        className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold text-red-600 border border-red-100 hover:bg-red-50 disabled:opacity-50"
                      >
                        {removingUserId === su.userId ? '…' : 'Remover'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              setError(null);
              setAddSuccess(null);
            }}
            className="w-full px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageEventSignUpsModal;
