import { useState, useRef } from 'react';
import { Upload, X, FileSpreadsheet, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (file: File, insurerId: string) => void;
  isProcessing: boolean;
  insurers: Array<{ id: string; name: string }>;
}

export function FileUploadModal({ 
  isOpen, 
  onClose, 
  onFileSelect, 
  isProcessing,
  insurers 
}: FileUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedInsurer, setSelectedInsurer] = useState(insurers[0]?.id || '');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (selectedFile && selectedInsurer) {
      onFileSelect(selectedFile, selectedInsurer);
    }
  };

  const getFileIcon = (file: File | null) => {
    if (!file) return <Upload className="w-12 h-12 text-gray-400" />;
    
    const type = file.type;
    if (type.includes('spreadsheet') || type.includes('excel') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      return <FileSpreadsheet className="w-12 h-12 text-green-500" />;
    }
    if (type.includes('pdf')) {
      return <FileText className="w-12 h-12 text-red-500" />;
    }
    if (type.includes('image')) {
      return <ImageIcon className="w-12 h-12 text-blue-500" />;
    }
    return <FileText className="w-12 h-12 text-gray-500" />;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Importar Expedientes</h3>
            <p className="text-sm text-gray-600 mt-1">Sube un archivo Excel, PDF o imagen</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isProcessing}
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Insurer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aseguradora
            </label>
            <select
              value={selectedInsurer}
              onChange={(e) => setSelectedInsurer(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isProcessing}
            >
              {insurers.map((insurer) => (
                <option key={insurer.id} value={insurer.id}>
                  {insurer.name}
                </option>
              ))}
            </select>
          </div>

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              dragActive
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-300 hover:border-indigo-400'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".xlsx,.xls,.csv,.pdf,image/*"
              onChange={handleFileChange}
              disabled={isProcessing}
            />

            <div className="flex flex-col items-center gap-4">
              {getFileIcon(selectedFile)}
              
              {selectedFile ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                    className="text-xs text-red-600 hover:text-red-700 underline"
                    disabled={isProcessing}
                  >
                    Cambiar archivo
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Arrastra un archivo aquí o haz click para seleccionar
                  </p>
                  <p className="text-xs text-gray-500">
                    Formatos soportados: Excel (.xlsx, .xls), PDF, Imágenes
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> El sistema extraerá automáticamente los datos del archivo.
              Podrás revisar y confirmar antes de importar.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
            disabled={isProcessing}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedFile || !selectedInsurer || isProcessing}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Procesar Archivo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
