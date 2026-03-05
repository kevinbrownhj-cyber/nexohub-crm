import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Case } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils';

export function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: caseData, isLoading } = useQuery<Case>({
    queryKey: ['case', id],
    queryFn: async () => {
      const { data } = await api.get(`/cases/${id}`);
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!caseData) {
    return <div>Caso no encontrado</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Caso {caseData.externalId}
        </h1>
        <p className="text-gray-600 mt-1">{caseData.insurer.name}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Información General</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Cliente</dt>
                <dd className="mt-1 text-sm text-gray-900">{caseData.customer.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Estado</dt>
                <dd className="mt-1">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {caseData.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Técnico Asignado</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {caseData.assignedTo?.name || 'Sin asignar'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Fecha Apertura</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(caseData.openedAt)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Origen</dt>
                <dd className="mt-1 text-sm text-gray-900">{caseData.originProvince}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Destino</dt>
                <dd className="mt-1 text-sm text-gray-900">{caseData.destinationProvince}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Notas</h2>
            {caseData.notes && caseData.notes.length > 0 ? (
              <div className="space-y-4">
                {caseData.notes.map((note) => (
                  <div key={note.id} className="border-l-4 border-primary-500 pl-4">
                    <p className="text-sm text-gray-900">{note.content}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {note.createdBy.name} - {formatDate(note.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No hay notas</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Montos</h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Base</dt>
                <dd className="text-sm text-gray-900">{formatCurrency(caseData.baseAmount)}</dd>
              </div>
              <div className="flex justify-between pt-3 border-t border-gray-200">
                <dt className="text-sm font-bold text-gray-900">Total</dt>
                <dd className="text-sm font-bold text-gray-900">
                  {formatCurrency(caseData.totalAmount)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Acciones</h2>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Asignar Técnico
              </button>
              <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Cambiar Estado
              </button>
              <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                Agregar Nota
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
