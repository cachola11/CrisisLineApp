import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getAllLinhaticos,
  addLinhatico,
  updateLinhaticoPaymentStatus,
  deleteLinhatico,
  bulkUpdatePaymentStatus
} from '../services/linhaticoService';

const Linhaticos: React.FC = () => {
  const { user } = useAuth();
  const [linhaticos, setLinhaticos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLinhaticoName, setNewLinhaticoName] = useState('');
  const [selectedLinhaticos, setSelectedLinhaticos] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Check if user has permission to access this page
  const hasPermission = user && user.role === 'Administrador';

  useEffect(() => {
    if (hasPermission) {
      fetchLinhaticos();
    }
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
      setLinhaticos(prev => prev.map(l => 
        l.id === linhaticoId ? { ...l, hasPaidAnnualFee: !currentStatus } : l
      ));
    } catch (error) {
      console.error('Error updating payment status:', error);
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteLinhatico = async (linhaticoId: string) => {
    if (!window.confirm('Tem a certeza de que deseja eliminar este Linhático?')) return;

    try {
      setDeleting(linhaticoId);
      await deleteLinhatico(linhaticoId);
      setLinhaticos(prev => prev.filter(l => l.id !== linhaticoId));
    } catch (error) {
      console.error('Error deleting linhatico:', error);
    } finally {
      setDeleting(null);
    }
  };

  const handleSelectAll = () => {
    if (selectedLinhaticos.length === linhaticos.length) {
      setSelectedLinhaticos([]);
    } else {
      setSelectedLinhaticos(linhaticos.map(l => l.id));
    }
  };

  const handleBulkUpdatePaymentStatus = async (hasPaid: boolean) => {
    if (selectedLinhaticos.length === 0) return;

    try {
      await bulkUpdatePaymentStatus(selectedLinhaticos, hasPaid);
      setLinhaticos(prev => prev.map(l => 
        selectedLinhaticos.includes(l.id) ? { ...l, hasPaidAnnualFee: hasPaid } : l
      ));
      setSelectedLinhaticos([]);
    } catch (error) {
      console.error('Error bulk updating payment status:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLinhaticos.length === 0) return;
    if (!window.confirm(`Tem a certeza de que deseja eliminar ${selectedLinhaticos.length} Linhático(s)?`)) return;

    try {
      const deletePromises = selectedLinhaticos.map(id => deleteLinhatico(id));
      await Promise.all(deletePromises);
      setLinhaticos(prev => prev.filter(l => !selectedLinhaticos.includes(l.id)));
      setSelectedLinhaticos([]);
    } catch (error) {
      console.error('Error bulk deleting linhaticos:', error);
    }
  };

  const handleSelectLinhatico = (linhaticoId: string) => {
    setSelectedLinhaticos(prev => 
      prev.includes(linhaticoId) 
        ? prev.filter(id => id !== linhaticoId)
        : [...prev, linhaticoId]
    );
  };

  if (!hasPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-softpink-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Apenas Administradores podem aceder a esta página.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-softpink-100">
        <div className="flex flex-col items-center gap-4">
          <span className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-500"></span>
          <span className="text-brand-700 text-xl font-bold">A carregar Linhaticos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-softpink-100 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-glass p-6 mb-6">
          <div className="text-center">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-brand-700 flex items-center justify-center gap-2 mb-2">
              Linhaticos <span className="text-2xl lg:text-3xl">🎭</span>
            </h1>
            <p className="text-brand-400 text-base font-medium">
              Gestão de pagamentos de quotas anuais dos Linhaticos
            </p>
          </div>
        </div>

        {/* Add New Linhatico Section */}
        <div className="bg-white rounded-3xl shadow-glass p-6 mb-6">
          <h2 className="text-lg font-bold text-brand-700 mb-4 flex items-center gap-2">
            <span className="text-xl">+</span> Adicionar Novo Linhatico
          </h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={newLinhaticoName}
              onChange={(e) => setNewLinhaticoName(e.target.value)}
              placeholder="Nome do Linhatico"
              className="flex-1 px-4 py-2 border border-brand-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              onKeyPress={(e) => e.key === 'Enter' && handleAddLinhatico()}
            />
            <button
              onClick={handleAddLinhatico}
              disabled={adding || !newLinhaticoName.trim()}
              className="px-6 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {adding ? 'A adicionar...' : 'Adicionar'}
            </button>
          </div>
        </div>

        {/* List of Linhaticos Section */}
        <div className="bg-white rounded-3xl shadow-glass p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-brand-700">
              Lista de Linhaticos ({linhaticos.length})
            </h2>
            <button
              onClick={handleSelectAll}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-semibold text-sm"
            >
              Selecionar Todos
            </button>
          </div>

          {/* Bulk Actions */}
          {selectedLinhaticos.length > 0 && (
            <div className="mb-4 p-4 bg-brand-50 rounded-lg border border-brand-200">
              <div className="flex items-center gap-4">
                <span className="text-brand-700 font-semibold">
                  {selectedLinhaticos.length} selecionado(s)
                </span>
                <button
                  onClick={() => handleBulkUpdatePaymentStatus(true)}
                  className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                >
                  Marcar como Pago
                </button>
                <button
                  onClick={() => handleBulkUpdatePaymentStatus(false)}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                >
                  Marcar como Não Pago
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-brand-100">
                  <th className="border border-brand-200 p-3 text-left font-semibold text-brand-700">
                    SELEÇÃO
                  </th>
                  <th className="border border-brand-200 p-3 text-left font-semibold text-brand-700">
                    NOME
                  </th>
                  <th className="border border-brand-200 p-3 text-left font-semibold text-brand-700">
                    QUOTA ANUAL PAGA
                  </th>
                  <th className="border border-brand-200 p-3 text-left font-semibold text-brand-700">
                    AÇÕES
                  </th>
                </tr>
              </thead>
              <tbody>
                {linhaticos.map((linhatico) => (
                  <tr key={linhatico.id} className="hover:bg-gray-50">
                    <td className="border border-brand-200 p-3">
                      <input
                        type="checkbox"
                        checked={selectedLinhaticos.includes(linhatico.id)}
                        onChange={() => handleSelectLinhatico(linhatico.id)}
                        className="w-4 h-4 text-brand-500 border-brand-300 rounded focus:ring-brand-500"
                      />
                    </td>
                    <td className="border border-brand-200 p-3 font-medium text-brand-800">
                      {linhatico.name}
                    </td>
                    <td className="border border-brand-200 p-3">
                      <button
                        onClick={() => handleTogglePaymentStatus(linhatico.id, linhatico.hasPaidAnnualFee)}
                        disabled={updating === linhatico.id}
                        className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${
                          linhatico.hasPaidAnnualFee
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-red-500 text-white hover:bg-red-600'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {updating === linhatico.id ? '...' : (
                          <>
                            {linhatico.hasPaidAnnualFee ? '✓ Pago' : '✗ Não Pago'}
                          </>
                        )}
                      </button>
                    </td>
                    <td className="border border-brand-200 p-3">
                      <button
                        onClick={() => handleDeleteLinhatico(linhatico.id)}
                        disabled={deleting === linhatico.id}
                        className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        🗑️ {deleting === linhatico.id ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {linhaticos.length === 0 && (
            <div className="text-center py-8 text-brand-400">
              Nenhum Linhatico encontrado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Linhaticos;
