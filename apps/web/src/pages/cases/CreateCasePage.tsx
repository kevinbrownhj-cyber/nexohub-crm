import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';
import { ArrowLeft, Save, Plus } from 'lucide-react';
import { AddInsurerModal } from '@/components/forms/AddInsurerModal';
import { AddUserModal } from '@/components/forms/AddUserModal';
import { AddCustomerModal } from '@/components/forms/AddCustomerModal';

export function CreateCasePage() {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [isInsurerModalOpen, setIsInsurerModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    insurerId: '',
    externalId: '',
    serviceType: '',
    customerId: '',
    vehicleId: '',
    providerId: '',
    assignedToUserId: '',
    openedAt: new Date().toISOString().split('T')[0],
  });

  const { data: insurers = [] } = useQuery({
    queryKey: ['insurers'],
    queryFn: async () => {
      const { data } = await api.get('/insurers');
      return data;
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data } = await api.get('/customers');
      return data;
    },
  });

  const customers = customersData?.data || [];

  const createCaseMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/cases', data);
      return response.data;
    },
    onSuccess: () => {
      addNotification('Caso Creado', 'El caso ha sido creado exitosamente', 'success');
      navigate('/cases');
    },
    onError: (error: any) => {
      addNotification('Error', error.response?.data?.message || 'No se pudo crear el caso', 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCaseMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/cases')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Casos
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Caso</h1>
        <p className="text-gray-600 mt-2">Complete el formulario para crear un nuevo caso</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
        <div className="p-6 space-y-6">
          {/* Información Básica */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aseguradora *
                </label>
                <div className="flex gap-2">
                  <select
                    name="insurerId"
                    required
                    value={formData.insurerId}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Seleccione una aseguradora</option>
                    {insurers.map((insurer: any) => (
                      <option key={insurer.id} value={insurer.id}>
                        {insurer.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsInsurerModalOpen(true)}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    title="Agregar nueva aseguradora"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  N° Expediente *
                </label>
                <input
                  type="text"
                  name="externalId"
                  required
                  value={formData.externalId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ej: EXP-2024-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Servicio
                </label>
                <select
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Seleccione un tipo</option>
                  <option value="GRUA">Grúa</option>
                  <option value="MECANICA">Mecánica</option>
                  <option value="CERRAJERIA">Cerrajería</option>
                  <option value="COMBUSTIBLE">Combustible</option>
                  <option value="NEUMATICO">Neumático</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Apertura *
                </label>
                <input
                  type="date"
                  name="openedAt"
                  required
                  value={formData.openedAt}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Cliente */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Cliente</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente
                </label>
                <div className="flex gap-2">
                  <select
                    name="customerId"
                    value={formData.customerId}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Seleccione un cliente</option>
                    {Array.isArray(customers) && customers.map((customer: any) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsCustomerModalOpen(true)}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    title="Agregar nuevo cliente"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Asignación */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Asignación</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Técnico Asignado
                </label>
                <div className="flex gap-2">
                  <select
                    name="assignedToUserId"
                    value={formData.assignedToUserId}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Sin asignar</option>
                    {Array.isArray(users) && users.map((user: any) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsUserModalOpen(true)}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    title="Agregar nuevo técnico"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Información Adicional */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Los campos marcados con * son obligatorios. Puede agregar más información del caso después de crearlo.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/cases')}
            className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
            disabled={createCaseMutation.isPending}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={createCaseMutation.isPending}
            className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {createCaseMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Crear Caso
              </>
            )}
          </button>
        </div>
      </form>

      {/* Modales */}
      <AddInsurerModal
        isOpen={isInsurerModalOpen}
        onClose={() => setIsInsurerModalOpen(false)}
        onSuccess={(insurer) => setFormData({ ...formData, insurerId: insurer.id })}
      />

      <AddUserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSuccess={(user) => setFormData({ ...formData, assignedToUserId: user.id })}
      />

      <AddCustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSuccess={(customer) => setFormData({ ...formData, customerId: customer.id })}
      />
    </div>
  );
}
