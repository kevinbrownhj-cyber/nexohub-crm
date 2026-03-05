import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';
import { formatDate, formatCurrency } from '@/lib/utils';
import { FileText, Search } from 'lucide-react';

export function BillingReadyPage() {
  const [search, setSearch] = useState('');
  const [selectedCases, setSelectedCases] = useState<string[]>([]);
  const { addNotification } = useNotification();
  const queryClient = useQueryClient();

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['ready-cases', search],
    queryFn: async () => {
      const params = new URLSearchParams({ status: 'READY_TO_INVOICE' });
      if (search) params.append('search', search);
      const { data } = await api.get(`/cases?${params}`);
      return data.data || [];
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (caseIds: string[]) => {
      const { data } = await api.post('/billing/invoices', { caseIds });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ready-cases'] });
      setSelectedCases([]);
      addNotification('Factura Creada', 'La factura ha sido creada exitosamente', 'success');
    },
    onError: () => {
      addNotification('Error', 'No se pudo crear la factura', 'error');
    },
  });

  const toggleCase = (caseId: string) => {
    setSelectedCases(prev =>
      prev.includes(caseId)
        ? prev.filter(id => id !== caseId)
        : [...prev, caseId]
    );
  };

  const toggleAll = () => {
    if (selectedCases.length === cases.length) {
      setSelectedCases([]);
    } else {
      setSelectedCases(Array.isArray(cases) ? cases.map((c: any) => c.id) : []);
    }
  };

  const totalAmount = Array.isArray(cases)
    ? cases
        .filter((c: any) => selectedCases.includes(c.id))
        .reduce((sum: number, c: any) => sum + (c.totalAmount || 0), 0)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Casos Listos para Facturar</h1>
          <p className="text-gray-600 mt-1">Selecciona los casos para generar una factura</p>
        </div>
        <Link
          to="/billing/invoices"
          className="flex items-center gap-2 px-4 py-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
        >
          <FileText className="w-5 h-5" />
          Ver Facturas
        </Link>
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

      {/* Actions */}
      {selectedCases.length > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-primary-900">
              {selectedCases.length} caso(s) seleccionado(s)
            </p>
            <p className="text-sm text-primary-700">
              Total: {formatCurrency(totalAmount)}
            </p>
          </div>
          <button
            onClick={() => createInvoiceMutation.mutate(selectedCases)}
            disabled={createInvoiceMutation.isPending}
            className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-all shadow-sm"
          >
            {createInvoiceMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creando...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Crear Factura
              </>
            )}
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : cases.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No hay casos listos para facturar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={Array.isArray(cases) && cases.length > 0 && selectedCases.length === cases.length}
                      onChange={toggleAll}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expediente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aseguradora</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cases.map((caseItem: any) => (
                  <tr key={caseItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedCases.includes(caseItem.id)}
                        onChange={() => toggleCase(caseItem.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {caseItem.externalId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {caseItem.insurer?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {caseItem.customer?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(caseItem.openedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(caseItem.totalAmount)}
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
