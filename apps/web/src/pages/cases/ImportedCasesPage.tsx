import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Plus, FileSpreadsheet, Check, X as XIcon, Edit2 } from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContext';

export function ImportedCasesPage() {
  const [editingCell, setEditingCell] = useState<{ caseId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const { addNotification } = useNotification();
  const queryClient = useQueryClient();

  // Obtener solo casos con estado IMPORTED
  const { data: cases, isLoading } = useQuery({
    queryKey: ['imported-cases'],
    queryFn: async () => {
      const { data } = await api.get('/cases?status=IMPORTED&limit=100');
      return data.data || [];
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
  });

  // Mutation para actualizar campos
  const updateCaseMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: any }) => {
      const { data } = await api.patch(`/cases/${id}`, { [field]: value });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imported-cases'] });
      addNotification('Actualizado', 'Campo actualizado exitosamente', 'success');
      setEditingCell(null);
    },
    onError: () => {
      addNotification('Error', 'No se pudo actualizar', 'error');
    },
  });


  // Mutation para eliminar caso
  const deleteCaseMutation = useMutation({
    mutationFn: async (caseId: string) => {
      await api.delete(`/cases/${caseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imported-cases'] });
      addNotification('Eliminado', 'Caso eliminado exitosamente', 'success');
    },
    onError: () => {
      addNotification('Error', 'No se pudo eliminar el caso', 'error');
    },
  });

  const startEditing = (caseId: string, field: string, currentValue: any) => {
    setEditingCell({ caseId, field });
    setEditValue(currentValue?.toString() || '');
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const saveEdit = () => {
    if (!editingCell) return;
    
    let value: any = editValue;
    
    // Convertir monto a centavos
    if (editingCell.field === 'priceFinalCents') {
      value = Math.round(parseFloat(editValue) * 100);
    }
    
    updateCaseMutation.mutate({
      id: editingCell.caseId,
      field: editingCell.field,
      value: value,
    });
  };

  const isEditing = (caseId: string, field: string) => {
    return editingCell?.caseId === caseId && editingCell?.field === field;
  };

  const handleDelete = (caseId: string) => {
    if (window.confirm('¿Está seguro de eliminar este caso?')) {
      deleteCaseMutation.mutate(caseId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Casos Importados</h1>
          <p className="text-gray-600 mt-1">Asigne técnico y monto - los cambios se guardan automáticamente</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/imports"
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <FileSpreadsheet className="w-5 h-5 mr-2" />
            Importar Excel
          </Link>
          <Link
            to="/cases/new"
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nuevo Caso
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Expediente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Técnico</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aseguradora</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servicio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cases && cases.length > 0 ? (
                  cases.map((caseItem: any) => (
                    <tr key={caseItem.id} className="hover:bg-gray-50">
                      {/* Fecha */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(caseItem.openedAt)}
                      </td>

                      {/* N° Expediente */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/cases/${caseItem.id}`}
                          className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          {caseItem.externalId}
                        </Link>
                      </td>

                      {/* Técnico (Editable) */}
                      <td 
                        className="px-6 py-4 whitespace-nowrap text-sm cursor-pointer hover:bg-gray-100 group relative"
                        onClick={() => !isEditing(caseItem.id, 'assignedToUserId') && startEditing(caseItem.id, 'assignedToUserId', caseItem.assignedToUserId || '')}
                      >
                        {isEditing(caseItem.id, 'assignedToUserId') ? (
                          <div className="flex items-center gap-1">
                            <select
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="px-2 py-1 border border-primary-500 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEdit();
                                if (e.key === 'Escape') cancelEditing();
                              }}
                            >
                              <option value="">Seleccionar técnico...</option>
                              {Array.isArray(users) && users.map((user: any) => (
                                <option key={user.id} value={user.id}>
                                  {user.name}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                saveEdit();
                              }}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                cancelEditing();
                              }}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <XIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className={caseItem.assignedToUser ? 'text-gray-900' : 'text-red-500 font-medium'}>
                              {caseItem.assignedToUser?.name || '⚠️ Sin asignar'}
                            </span>
                            <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100" />
                          </div>
                        )}
                      </td>

                      {/* Aseguradora */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {caseItem.insurer?.name || '-'}
                      </td>

                      {/* Servicio */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {caseItem.serviceType || '-'}
                      </td>

                      {/* Monto (Editable) */}
                      <td 
                        className="px-6 py-4 whitespace-nowrap text-sm cursor-pointer hover:bg-gray-100 group relative"
                        onClick={() => !isEditing(caseItem.id, 'priceFinalCents') && startEditing(caseItem.id, 'priceFinalCents', (caseItem.priceFinalCents || 0) / 100)}
                      >
                        {isEditing(caseItem.id, 'priceFinalCents') ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.01"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-24 px-2 py-1 border border-primary-500 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEdit();
                                if (e.key === 'Escape') cancelEditing();
                              }}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                saveEdit();
                              }}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                cancelEditing();
                              }}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <XIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${!caseItem.priceFinalCents || caseItem.priceFinalCents === 0 ? 'text-red-500' : 'text-gray-900'}`}>
                              {caseItem.priceFinalCents ? formatCurrency(caseItem.priceFinalCents / 100) : '⚠️ $0.00'}
                            </span>
                            <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100" />
                          </div>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDelete(caseItem.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar caso"
                          >
                            <XIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-lg font-medium">No hay casos importados pendientes</p>
                      <p className="text-sm mt-1">Importe un archivo Excel o cree un nuevo caso manualmente</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
