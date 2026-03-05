import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { Case, PaginatedResponse } from '@/types';
import { Plus, Search, Eye, FileSpreadsheet, Calendar, Check, X as XIcon } from 'lucide-react';
import { CaseDetailModal } from '@/components/cases/CaseDetailModal';
import { ObjectionModal } from '@/components/cases/ObjectionModal';
import { TechnicianRejectionModal } from '@/components/cases/TechnicianRejectionModal';
import { EditableCell } from '@/components/cases/EditableCell';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';

export function CasesListPage() {
  const { user: currentUser } = useAuth();
  
  // Detectar si es técnico (tiene cases.read_assigned pero NO cases.read_all)
  const userPermissions = currentUser?.role?.permissions?.map(p => p.key) || [];
  const isTechnician = userPermissions.includes('cases.read_assigned') && !userPermissions.includes('cases.read_all');
  
  // Inicializar pestaña activa según el rol
  const initialTab = isTechnician ? 'Casos Atendidos' : 'Casos Importados';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isObjectionModalOpen, setIsObjectionModalOpen] = useState(false);
  const [objectionCase, setObjectionCase] = useState<Case | null>(null);
  const [isTechRejectionModalOpen, setIsTechRejectionModalOpen] = useState(false);
  const [techRejectionCase, setTechRejectionCase] = useState<Case | null>(null);
  const { addNotification } = useNotification();
  const queryClient = useQueryClient();

  // Pestañas diferentes según el rol
  const tabs = isTechnician ? [
    { name: 'Casos Atendidos', status: 'ASSIGNED' },
    { name: 'Casos reclamados', status: 'OBJECTED' },
    { name: 'Casos a facturar', status: 'READY_TO_INVOICE' }
  ] : [
    { name: 'Casos Importados', status: 'IMPORTED' },
    { name: 'Casos reclamados', status: 'OBJECTED' },
    { name: 'Casos a facturar', status: 'READY_TO_INVOICE' }
  ];
  
  const currentTab = tabs.find(t => t.name === activeTab);
  const currentStatus = currentTab?.status || '';

  const { data, isLoading } = useQuery<PaginatedResponse<Case>>({
    queryKey: ['cases', currentUser?.id, page, search, currentStatus, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
        ...(search && { search }),
        ...(currentStatus && { status: currentStatus }),
        ...(startDate && { openedFrom: startDate }),
        ...(endDate && { openedTo: endDate }),
      });
      const { data } = await api.get(`/cases?${params}`);
      return data;
    },
  });

  const { data: insurers = [] } = useQuery({
    queryKey: ['insurers', currentUser?.id],
    queryFn: async () => {
      const { data } = await api.get('/insurers');
      return data;
    },
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ['users', currentUser?.id],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
    enabled: !isTechnician, // Solo cargar para admins
  });


  const handleViewDetail = (caseItem: Case) => {
    setSelectedCase(caseItem);
    setIsDetailModalOpen(true);
  };

  const updateCaseField = async (caseId: string, field: string, value: any) => {
    try {
      await api.patch(`/cases/${caseId}`, { [field]: value });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      addNotification('Actualizado', 'Campo actualizado exitosamente', 'success');
    } catch (error) {
      addNotification('Error', 'No se pudo actualizar el campo', 'error');
      throw error;
    }
  };

  const handleSubmitTechnicianObjection = async (data: {
    requestedAmountCents: number;
    requestedSurchargeCents: number;
    reason: string;
  }) => {
    if (!objectionCase) return;
    
    try {
      await api.patch(`/cases/${objectionCase.id}`, {
        status: 'OBJECTED',
        technicianRequestedAmountCents: data.requestedAmountCents,
        technicianRequestedSurchargeCents: data.requestedSurchargeCents,
        technicianRejectionReason: data.reason,
        technicianRejectedBy: currentUser?.id,
        technicianRejectedAt: new Date().toISOString(),
        technicianRejectionStatus: 'PENDING'
      });
      
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      setIsObjectionModalOpen(false);
      setObjectionCase(null);
      addNotification('Objeción Registrada', 'El caso ha sido devuelto al admin', 'success');
    } catch (error) {
      addNotification('Error', 'No se pudo registrar la objeción', 'error');
    }
  };

  const handleApproveObjection = async (caseItem: Case) => {
    const pendingSurcharge = caseItem.surcharges?.find(s => s.status === 'PENDING_APPROVAL');
    
    if (!pendingSurcharge) {
      addNotification('Error', 'No hay recargo solicitado para aprobar', 'error');
      return;
    }

    try {
      const response = await api.post(`/cases/${caseItem.id}/surcharge/approve`);
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      
      const approvedAmount = pendingSurcharge.amountCents / 100;
      addNotification('Recargo Aprobado', `Recargo de $${approvedAmount.toFixed(2)} aprobado. El caso se movió a Casos a facturar`, 'success');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'No se pudo aprobar el recargo';
      addNotification('Error', errorMsg, 'error');
      console.error('Error al aprobar recargo:', error);
    }
  };

  const handleRejectObjection = async (caseItem: Case) => {
    const pendingSurcharge = caseItem.surcharges?.find(s => s.status === 'PENDING_APPROVAL');
    
    if (!pendingSurcharge) {
      addNotification('Error', 'No hay recargo solicitado para rechazar', 'error');
      return;
    }

    const reason = prompt('Ingresa el motivo del rechazo:');
    if (!reason) {
      addNotification('Cancelado', 'Debes ingresar un motivo para rechazar', 'warning');
      return;
    }

    try {
      await api.post(`/cases/${caseItem.id}/surcharge/reject`, { reason });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      addNotification('Recargo Rechazado', 'El caso volvió a Importados', 'success');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'No se pudo rechazar el recargo';
      addNotification('Error', errorMsg, 'error');
      console.error('Error al rechazar recargo:', error);
    }
  };

  const handleApproveCase = async (caseItem: Case) => {
    if (!caseItem || !caseItem.id) {
      addNotification('Error', 'Caso inválido', 'error');
      return;
    }

    if (caseItem.status !== 'IMPORTED') {
      addNotification('Error', 'Solo se pueden aprobar casos importados', 'error');
      return;
    }

    if (!caseItem.assignedToUserId) {
      addNotification('Error', 'Debe asignar un técnico antes de aprobar', 'error');
      return;
    }

    if (!caseItem.priceBaseCents || caseItem.priceBaseCents === 0) {
      addNotification('Error', 'Debe ingresar un monto antes de aprobar', 'error');
      return;
    }

    try {
      await api.patch(`/cases/${caseItem.id}`, { status: 'ASSIGNED' });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      addNotification('Caso Aprobado', 'El caso ha sido asignado al técnico', 'success');
    } catch (error) {
      console.error('Error al aprobar caso:', error);
      addNotification('Error', 'No se pudo aprobar el caso', 'error');
    }
  };

  const handleRejectCase = async (caseItem: Case) => {
    if (!caseItem || !caseItem.id) {
      addNotification('Error', 'Caso inválido', 'error');
      return;
    }

    try {
      await api.patch(`/cases/${caseItem.id}`, { status: 'IMPORTED' });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      addNotification('Caso Rechazado', 'El caso ha sido devuelto a importados', 'success');
    } catch (error) {
      console.error('Error al rechazar caso:', error);
      addNotification('Error', 'No se pudo rechazar el caso', 'error');
    }
  };

  const handleTechnicianApprove = async (caseItem: Case) => {
    if (!caseItem || !caseItem.id) {
      addNotification('Error', 'Caso inválido', 'error');
      return;
    }

    try {
      await api.patch(`/cases/${caseItem.id}`, { status: 'READY_TO_INVOICE' });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      addNotification('Caso Aceptado', 'El caso ha sido enviado a facturación', 'success');
    } catch (error) {
      console.error('Error al aceptar caso:', error);
      addNotification('Error', 'No se pudo aceptar el caso', 'error');
    }
  };

  const handleTechnicianReject = (caseItem: Case) => {
    if (!caseItem || !caseItem.id) {
      addNotification('Error', 'Caso inválido', 'error');
      return;
    }
    setTechRejectionCase(caseItem);
    setIsTechRejectionModalOpen(true);
  };

  const handleTechRejectionSubmit = async (amount: number, reason: string) => {
    if (!techRejectionCase) return;

    try {
      await api.patch(`/cases/${techRejectionCase.id}`, { 
        status: 'OBJECTED',
        technicianRejectionReason: reason,
        technicianRequestedAmountCents: Math.round(amount * 100),
        technicianRequestedSurchargeCents: Math.round(amount * 100)
      });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      setIsTechRejectionModalOpen(false);
      setTechRejectionCase(null);
      addNotification('Caso Rechazado', `El caso ha sido enviado a reclamados con un recargo de $${amount.toFixed(2)}`, 'success');
    } catch (error) {
      console.error('Error al rechazar caso:', error);
      addNotification('Error', 'No se pudo rechazar el caso', 'error');
    }
  };

  const handleExportToExcel = async () => {
    try {
      const params = new URLSearchParams({
        ...(search && { search }),
        ...(status && { status }),
        ...(startDate && { openedFrom: startDate }),
        ...(endDate && { openedTo: endDate }),
      });

      const response = await api.get(`/cases/export/excel?${params}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `casos-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      addNotification('Exportado', 'Casos exportados exitosamente', 'success');
    } catch (error) {
      addNotification('Error', 'No se pudo exportar los casos', 'error');
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Casos</h1>
          <p className="text-gray-600 mt-1">Gestión de casos de servicio</p>
        </div>
        {userPermissions.includes('cases.create') && (
          <Link
            to="/cases/new"
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nuevo Caso
          </Link>
        )}
      </div>

      {/* Pestañas */}
      <div className="bg-white rounded-lg shadow mb-4">
        <div className="flex gap-2 p-2 border-b overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`px-6 py-3 font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab.name
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por expediente, cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            {!isTechnician && (
              <button
                onClick={handleExportToExcel}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <FileSpreadsheet className="w-5 h-5 mr-2" />
                Exportar Excel
              </button>
            )}
          </div>
          
          {/* Filtros de Fecha */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Desde"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">hasta</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Hasta"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Limpiar fechas
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Expediente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Aseguradora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Técnico
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Total Base
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Recargo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Total Final
                    </th>
                    {!(isTechnician && activeTab === 'Casos reclamados') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Acciones
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data?.data.map((caseItem) => (
                    <tr key={caseItem.id} className="hover:bg-gray-50">
                      {/* Expediente */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isTechnician ? (
                          <span className="text-sm text-gray-900">{caseItem.externalId}</span>
                        ) : (
                          <EditableCell
                            type="text"
                            value={caseItem.externalId}
                            onSave={(value) => updateCaseField(caseItem.id, 'externalId', value)}
                          />
                        )}
                      </td>
                      
                      {/* Aseguradora */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isTechnician ? (
                          <span className="text-sm text-gray-900">{caseItem.insurer?.name || '-'}</span>
                        ) : (
                          <EditableCell
                            type="dropdown"
                            value={caseItem.insurerId}
                            options={insurers.map((i: any) => ({ id: i.id, name: i.name }))}
                            onSave={(value) => updateCaseField(caseItem.id, 'insurerId', value)}
                          />
                        )}
                      </td>
                      
                      {/* Técnico */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isTechnician ? (
                          <span className="text-sm text-gray-900">
                            {caseItem.assignedToUser?.name || 'No asignado'}
                          </span>
                        ) : (
                          <EditableCell
                            type="dropdown"
                            value={caseItem.assignedToUserId}
                            options={technicians.map((t: any) => ({ id: t.id, name: t.name }))}
                            onSave={(value) => updateCaseField(caseItem.id, 'assignedToUserId', value)}
                          />
                        )}
                      </td>
                      
                      {/* Estado */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isTechnician ? (
                          <span className="text-sm text-gray-900">
                            {caseItem.status === 'ASSIGNED' ? 'Asignado' :
                             caseItem.status === 'IMPORTED' ? 'Importado' :
                             caseItem.status === 'OBJECTED' ? 'Objetado' :
                             caseItem.status === 'COMPLETED' ? 'Completado' :
                             caseItem.status === 'READY_TO_INVOICE' ? 'Listo para Facturar' : caseItem.status}
                          </span>
                        ) : (
                          <EditableCell
                            type="dropdown"
                            value={caseItem.status}
                            options={[
                              { id: 'IMPORTED', name: 'Importado' },
                              { id: 'ASSIGNED', name: 'Asignado' },
                              { id: 'OBJECTED', name: 'Objetado' },
                              { id: 'COMPLETED', name: 'Completado' },
                              { id: 'READY_TO_INVOICE', name: 'Listo para Facturar' }
                            ]}
                            onSave={(value) => updateCaseField(caseItem.id, 'status', value)}
                          />
                        )}
                      </td>
                      
                      {/* Fecha */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isTechnician ? (
                          <span className="text-sm text-gray-900">
                            {new Date(caseItem.openedAt).toLocaleDateString('es-ES')}
                          </span>
                        ) : (
                          <EditableCell
                            type="date"
                            value={caseItem.openedAt}
                            onSave={(value) => updateCaseField(caseItem.id, 'openedAt', value)}
                          />
                        )}
                      </td>
                      
                      {/* Total Base */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isTechnician ? (
                          <span className="text-sm text-gray-900">${(caseItem.priceBaseCents || 0) / 100}</span>
                        ) : (
                          <EditableCell
                            type="number"
                            value={(caseItem.priceBaseCents || 0) / 100}
                            prefix="$"
                            onSave={(value) => updateCaseField(caseItem.id, 'priceBaseCents', Math.round(value * 100))}
                          />
                        )}
                      </td>
                      
                      {/* Recargo */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {caseItem.status === 'OBJECTED' && caseItem.surcharges?.find(s => s.status === 'PENDING_APPROVAL') ? (
                          <div className="flex flex-col">
                            <span className="text-gray-400 line-through text-xs">${(caseItem.surchargeAmountCents || 0) / 100}</span>
                            <span className="text-orange-600 font-bold text-lg flex items-center gap-1">
                              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                              ${(caseItem.surcharges.find(s => s.status === 'PENDING_APPROVAL')?.amountCents || 0) / 100}
                            </span>
                            <span className="text-xs text-orange-600 font-semibold">SOLICITADO</span>
                          </div>
                        ) : isTechnician ? (
                          <span className="text-sm text-gray-900">${(caseItem.surchargeAmountCents || 0) / 100}</span>
                        ) : (
                          <EditableCell
                            type="number"
                            value={(caseItem.surchargeAmountCents || 0) / 100}
                            prefix="$"
                            onSave={(value) => updateCaseField(caseItem.id, 'surchargeAmountCents', Math.round(value * 100))}
                          />
                        )}
                      </td>
                      
                      {/* Total Final (calculado) */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ${((caseItem.priceBaseCents || 0) + (caseItem.surchargeAmountCents || 0)) / 100}
                      </td>
                      {!(isTechnician && activeTab === 'Casos reclamados') && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {activeTab === 'Casos Importados' && caseItem.status === 'IMPORTED' && !isTechnician ? (
                              <>
                                <button
                                  onClick={() => handleApproveCase(caseItem)}
                                  className="flex items-center px-3 py-1 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
                                  title="Aceptar y asignar"
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Aceptar
                                </button>
                                <button
                                  onClick={() => handleRejectCase(caseItem)}
                                  className="flex items-center px-3 py-1 text-sm bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
                                  title="Rechazar"
                                >
                                  <XIcon className="w-4 h-4 mr-1" />
                                  Rechazar
                                </button>
                              </>
                            ) : !isTechnician && activeTab === 'Casos reclamados' && caseItem.status === 'OBJECTED' ? (
                              <>
                                <button
                                  onClick={() => handleApproveObjection(caseItem)}
                                  className="flex items-center px-3 py-1 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Aprobar Cambios
                                </button>
                                <button
                                  onClick={() => handleRejectObjection(caseItem)}
                                  className="flex items-center px-3 py-1 text-sm bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
                                >
                                  <XIcon className="w-4 h-4 mr-1" />
                                  Rechazar
                                </button>
                                {caseItem.surcharges?.find(s => s.status === 'PENDING_APPROVAL') && (
                                  <button
                                    onClick={() => {
                                      const pendingSurcharge = caseItem.surcharges?.find(s => s.status === 'PENDING_APPROVAL');
                                      if (pendingSurcharge) {
                                        alert(`💰 RECARGO SOLICITADO\n\nMonto: $${pendingSurcharge.amountCents / 100}\n\nMotivo:\n${pendingSurcharge.description}`);
                                      }
                                    }}
                                    className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                                    title="Ver detalles del recargo solicitado"
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    Ver Motivo
                                  </button>
                                )}
                              </>
                            ) : isTechnician && activeTab === 'Casos Atendidos' && caseItem.status === 'ASSIGNED' ? (
                              <>
                                <button
                                  onClick={() => handleTechnicianApprove(caseItem)}
                                  className="flex items-center px-3 py-1 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
                                  title="Aceptar y enviar a facturación"
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Aceptar
                                </button>
                                <button
                                  onClick={() => handleTechnicianReject(caseItem)}
                                  className="flex items-center px-3 py-1 text-sm bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
                                  title="Rechazar y enviar a reclamados"
                                >
                                  <XIcon className="w-4 h-4 mr-1" />
                                  Rechazar
                                </button>
                              </>
                            ) : !isTechnician && (
                              <button
                                onClick={() => handleViewDetail(caseItem)}
                                className="flex items-center px-3 py-1 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Ver Detalle
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data?.meta && data.meta.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando {(page - 1) * 20 + 1} a {Math.min(page * 20, data.meta.total)} de{' '}
                  {data.meta.total} resultados
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === data.meta.totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de Detalle */}
      {isDetailModalOpen && selectedCase && (
        <CaseDetailModal
          caseData={selectedCase}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedCase(null);
          }}
        />
      )}

      {/* Modal de Objeción del Técnico */}
      {isObjectionModalOpen && objectionCase && (
        <ObjectionModal
          isOpen={isObjectionModalOpen}
          onClose={() => {
            setIsObjectionModalOpen(false);
            setObjectionCase(null);
          }}
          onSubmit={handleSubmitTechnicianObjection}
          currentAmount={objectionCase.priceBaseCents || 0}
          currentSurcharge={objectionCase.surchargeAmountCents || 0}
        />
      )}

      {/* Modal de Rechazo del Técnico */}
      <TechnicianRejectionModal
        isOpen={isTechRejectionModalOpen}
        onClose={() => {
          setIsTechRejectionModalOpen(false);
          setTechRejectionCase(null);
        }}
        caseItem={techRejectionCase}
        onSubmit={handleTechRejectionSubmit}
      />
    </div>
  );
}
