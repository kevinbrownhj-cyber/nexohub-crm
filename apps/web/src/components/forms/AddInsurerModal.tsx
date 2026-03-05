import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Save } from 'lucide-react';
import api from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';

interface AddInsurerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (insurer: any) => void;
}

export function AddInsurerModal({ isOpen, onClose, onSuccess }: AddInsurerModalProps) {
  const [name, setName] = useState('');
  const { addNotification } = useNotification();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const response = await api.post('/insurers', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['insurers'] });
      addNotification('Aseguradora Creada', 'La aseguradora ha sido agregada exitosamente', 'success');
      if (onSuccess) onSuccess(data);
      setName('');
      onClose();
    },
    onError: () => {
      addNotification('Error', 'No se pudo crear la aseguradora', 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ name });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800">Agregar Aseguradora</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={createMutation.isPending}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la Aseguradora *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Ej: ASSA, Qualitas, GNP"
              autoFocus
              disabled={createMutation.isPending}
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
              disabled={createMutation.isPending}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {createMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Crear Aseguradora
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
