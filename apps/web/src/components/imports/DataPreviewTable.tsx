import { Check, AlertCircle } from 'lucide-react';

interface ExtractedCase {
  date: string;
  externalId: string;
  technician: string;
  service: string;
  amount: number;
  valid: boolean;
  errors?: string[];
}

interface DataPreviewTableProps {
  data: ExtractedCase[];
  onConfirm: () => void;
  onCancel: () => void;
  isImporting: boolean;
}

export function DataPreviewTable({ data, onConfirm, onCancel, isImporting }: DataPreviewTableProps) {
  const validCases = data.filter(c => c.valid);
  const invalidCases = data.filter(c => !c.valid);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
          <h3 className="text-xl font-bold text-gray-800">Vista Previa de Datos</h3>
          <p className="text-sm text-gray-600 mt-1">
            Revisa los datos extraídos antes de importar
          </p>
          <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="font-medium text-green-700">{validCases.length} válidos</span>
            </div>
            {invalidCases.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="font-medium text-red-700">{invalidCases.length} con errores</span>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto p-6">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Estado</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Fecha</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Expediente</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Técnico</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Servicio</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((item, index) => (
                <tr 
                  key={index} 
                  className={`${item.valid ? 'bg-white' : 'bg-red-50'} hover:bg-gray-50`}
                >
                  <td className="px-4 py-3">
                    {item.valid ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <Check className="w-4 h-4" />
                        <span className="text-xs font-medium">OK</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-600" title={item.errors?.join(', ')}>
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-xs font-medium">Error</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-900">{item.date}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{item.externalId}</td>
                  <td className="px-4 py-3 text-gray-700">{item.technician}</td>
                  <td className="px-4 py-3 text-gray-700">{item.service}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    ${item.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {invalidCases.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Advertencia:</strong> {invalidCases.length} caso(s) tienen errores y no serán importados.
                Solo se importarán los casos válidos.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Se importarán <strong className="text-gray-900">{validCases.length}</strong> casos
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
              disabled={isImporting}
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={validCases.length === 0 || isImporting}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {isImporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Importando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirmar Importación
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
