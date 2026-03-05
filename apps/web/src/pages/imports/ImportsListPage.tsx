import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '@/lib/api';
import { FileUploadModal } from '@/components/imports/FileUploadModal';
import { DataPreviewTable } from '@/components/imports/DataPreviewTable';
import { useNotification } from '@/contexts/NotificationContext';
import { formatDate } from '@/lib/utils';

interface Insurer {
  id: string;
  name: string;
}

interface ExtractedCase {
  date: string;
  externalId: string;
  technician: string;
  service: string;
  amount: number;
  valid: boolean;
  errors?: string[];
}

export function ImportsListPage() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedCase[]>([]);
  const [selectedInsurerId, setSelectedInsurerId] = useState('');
  const { addNotification } = useNotification();
  const queryClient = useQueryClient();

  const { data: insurers = [] } = useQuery<Insurer[]>({
    queryKey: ['insurers'],
    queryFn: async () => {
      const { data } = await api.get('/insurers');
      return data;
    },
  });

  const { data: imports = [] } = useQuery({
    queryKey: ['imports'],
    queryFn: async () => {
      const { data } = await api.get('/imports');
      return data;
    },
  });

  const processFileMutation = useMutation({
    mutationFn: async ({ file, insurerId }: { file: File; insurerId: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('insurerId', insurerId);
      
      const { data } = await api.post('/imports/process-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: (data) => {
      setExtractedData(data.cases || []);
      setIsUploadModalOpen(false);
      setIsPreviewOpen(true);
    },
    onError: () => {
      addNotification('Error', 'No se pudo procesar el archivo', 'error');
    },
  });

  const confirmImportMutation = useMutation({
    mutationFn: async () => {
      const validCases = extractedData.filter(c => c.valid);
      const { data } = await api.post('/imports/confirm', {
        insurerId: selectedInsurerId,
        cases: validCases,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imports'] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      setIsPreviewOpen(false);
      setExtractedData([]);
      addNotification(
        'Importación Exitosa',
        `Se importaron ${extractedData.filter(c => c.valid).length} casos`,
        'success'
      );
    },
    onError: () => {
      addNotification('Error', 'No se pudo completar la importación', 'error');
    },
  });

  const handleFileSelect = (file: File, insurerId: string) => {
    setSelectedInsurerId(insurerId);
    processFileMutation.mutate({ file, insurerId });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Importaciones</h1>
          <p className="text-gray-600 mt-1">Importa expedientes desde archivos Excel, PDF o imágenes</p>
        </div>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Upload className="w-5 h-5" />
          Importar Expedientes
        </button>
      </div>

      {/* Historial de Importaciones */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Historial de Importaciones</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Archivo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Casos Importados</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {imports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No hay importaciones registradas</p>
                    <p className="text-sm mt-1">Haz click en "Importar Expedientes" para comenzar</p>
                  </td>
                </tr>
              ) : (
                imports.map((imp: any) => (
                  <tr key={imp.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(imp.status)}
                        <span className="text-sm font-medium text-gray-900">{imp.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(imp.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{imp.fileName || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {imp.importedCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {imp.createdBy?.name || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onFileSelect={handleFileSelect}
        isProcessing={processFileMutation.isPending}
        insurers={insurers}
      />

      {isPreviewOpen && extractedData.length > 0 && (
        <DataPreviewTable
          data={extractedData}
          onConfirm={() => confirmImportMutation.mutate()}
          onCancel={() => {
            setIsPreviewOpen(false);
            setExtractedData([]);
          }}
          isImporting={confirmImportMutation.isPending}
        />
      )}
    </div>
  );
}
