import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Check, X, Search, AlertCircle } from 'lucide-react';

export function SurchargesPage() {
  const [search, setSearch] = useState('');
  const { addNotification } = useNotification();
  const queryClient = useQueryClient();

  const { data: surcharges = [], isLoading } = useQuery({
    queryKey: ['surcharges', search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      const { data } = await api.get(`/surcharges?${params}`);
      return data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/surcharges/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surcharges'] });
      addNotification('Aprobado', 'Recargo aprobado exitosamente', 'success');
    },
    onError: () => {
      addNotification('Error', 'No se pudo aprobar el recargo', 'error');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/surcharges/${id}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surcharges'] });
      addNotification('Rechazado', 'Recargo rechazado', 'success');
    },
    onError: () => {
      addNotification('Error', 'No se pudo rechazar el recargo', 'error');
    },
  });

  const pendingSurcharges = Array.isArray(surcharges) 
    ? surcharges.filter((s: any) => s.status === 'PENDING_APPROVAL')
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recargos Pendientes</h1>
          <p className="text-gray-600 mt-1">Revisa y aprueba los recargos solicitados</p>
        </div>
        <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg font-semibold">
          {pendingSurcharges.length} Pendientes
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar por expediente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : pendingSurcharges.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No hay recargos pendientes de aprobación</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expediente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Solicitado Por</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto Solicitado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recargo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Razón</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pendingSurcharges.map((surcharge: any) => (
                  <tr key={surcharge.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {surcharge.case?.externalId || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {surcharge.requestedBy?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(surcharge.requestedAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      +{formatCurrency(surcharge.surchargeAmount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {surcharge.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(surcharge.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => approveMutation.mutate(surcharge.id)}
                          className="flex items-center gap-1 px-3 py-1 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                          disabled={approveMutation.isPending}
                        >
                          <Check className="w-4 h-4" />
                          Aprobar
                        </button>
                        <button
                          onClick={() => rejectMutation.mutate(surcharge.id)}
                          className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          disabled={rejectMutation.isPending}
                        >
                          <X className="w-4 h-4" />
                          Rechazar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
