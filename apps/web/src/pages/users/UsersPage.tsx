import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';
import { Plus, Search, Shield, User as UserIcon, Trash2, X, Mail } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  role: {
    id: string;
    name: string;
    key: string;
  } | null;
}

export function UsersPage() {
  const queryClient = useQueryClient();
  const { addNotification } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', roleId: '' });

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await api.get('/roles');
      return data;
    },
  });

  const { data: deletedUsers = [] } = useQuery({
    queryKey: ['users-deleted'],
    queryFn: async () => {
      const { data } = await api.get('/users/deleted/list');
      return data;
    },
    enabled: showDeleted,
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      // DEBUG: Ver payload exacto
      console.log('🔍 PAYLOAD ENVIADO:', JSON.stringify(userData, null, 2));
      
      // Axios lanza excepciones automáticamente para errores HTTP
      const response = await api.post('/users', userData);
      
      // DEBUG: Ver respuesta
      console.log('✅ RESPONSE:', response.status, JSON.stringify(response.data, null, 2));
      
      return response.data;
    },
    onSuccess: async (data, variables) => {
      // Cerrar modal y limpiar form ANTES de refrescar
      setIsModalOpen(false);
      setNewUser({ name: '', email: '', password: '', roleId: '' });
      
      // Refrescar lista de usuarios
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      
      // Mostrar notificación de éxito
      const message = data?.message || 'Usuario creado exitosamente';
      addNotification('✅ Usuario Creado', message, 'success');
    },
    onError: (error: any) => {
      console.error('❌ ERROR COMPLETO:', error);
      
      // Error de red
      if (!error.response) {
        addNotification('❌ Error de Conexión', 'No se pudo conectar al servidor', 'error');
        return;
      }
      
      // DEBUG: Ver respuesta de error completa
      console.log('🔴 ERROR STATUS:', error.response.status);
      console.log('🔴 ERROR DATA:', JSON.stringify(error.response.data, null, 2));
      
      // Extraer mensaje de error del backend
      const errorData = error.response.data;
      const errorCode = errorData?.error?.code || errorData?.code;
      const errorMessage = errorData?.error?.message || errorData?.message;
      
      // Mensajes específicos según código
      const errorMessages: Record<string, string> = {
        'USER_EMAIL_EXISTS': 'El correo electrónico ya está registrado',
        'PASSWORD_TOO_SHORT': 'La contraseña debe tener al menos 6 caracteres',
        'USER_CREATION_FAILED': 'Error al crear el usuario. Intente nuevamente',
      };
      
      const userMessage = errorMessages[errorCode] || errorMessage || 'Error al crear usuario';
      addNotification('❌ Error', userMessage, 'error');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.post(`/users/${userId}/soft-delete`);
      return response.data;
    },
    onSuccess: async () => {
      // Refrescar ambas listas
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      await queryClient.invalidateQueries({ queryKey: ['users-deleted'] });
      
      addNotification(
        '✅ Usuario Eliminado',
        'El usuario ha sido eliminado. Puede recuperarlo en los próximos 30 días.',
        'success'
      );
    },
    onError: (error: any) => {
      console.error('Error deleting user:', error);
      const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || 'Error al eliminar el usuario';
      addNotification('❌ Error', errorMessage, 'error');
    },
  });

  const restoreUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.post(`/users/${userId}/restore`);
      return response.data;
    },
    onSuccess: async () => {
      // Refrescar ambas listas
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      await queryClient.invalidateQueries({ queryKey: ['users-deleted'] });
      
      addNotification('✅ Usuario Restaurado', 'El usuario ha sido restaurado exitosamente', 'success');
    },
    onError: (error: any) => {
      console.error('Error restoring user:', error);
      const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || 'Error al restaurar el usuario';
      addNotification('❌ Error', errorMessage, 'error');
    },
  });

  const displayUsers = showDeleted ? deletedUsers : users;
  
  const filteredUsers = Array.isArray(displayUsers) 
    ? displayUsers.filter((u: any) =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(newUser);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h2>
          <p className="text-gray-500 text-sm mt-1">Administra los accesos de usuarios del sistema.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm w-full sm:w-auto justify-center"
        >
          <Plus size={18} />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {/* Search Bar and Toggle */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar usuario..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowDeleted(!showDeleted)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            showDeleted
              ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {showDeleted ? 'Ver Activos' : 'Ver Eliminados'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Usuario</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Email</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Rol</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Estado</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        user.role?.key === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-800">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Mail size={14} />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      user.role?.key === 'ADMIN'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {user.role?.key === 'ADMIN' ? <Shield size={12} /> : <UserIcon size={12} />}
                      {user.role?.name || 'Sin rol'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.isActive
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700'
                    }`}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {showDeleted ? (
                      <button
                        onClick={() => restoreUserMutation.mutate(user.id)}
                        className="px-3 py-1.5 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
                        title="Restaurar usuario"
                      >
                        Restaurar
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (confirm('¿Está seguro de eliminar este usuario? Podrá recuperarlo en los próximos 30 días.')) {
                            deleteUserMutation.mutate(user.id);
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar usuario"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No se encontraron usuarios.
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Agregar Usuario</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  value={newUser.name}
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  required
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <input
                  required
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  value={newUser.password}
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  value={newUser.roleId}
                  onChange={e => setNewUser({ ...newUser, roleId: e.target.value })}
                >
                  <option value="">Seleccione un rol</option>
                  {roles.map((role: any) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-sm transition-all disabled:opacity-50"
                >
                  {createUserMutation.isPending ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
