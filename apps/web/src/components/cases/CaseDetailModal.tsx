import { X } from 'lucide-react';

interface CaseDetailModalProps {
  caseData: any;
  onClose: () => void;
}

export function CaseDetailModal({ caseData, onClose }: CaseDetailModalProps) {
  if (!caseData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">
            Detalle del Caso #{caseData.externalId}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Información General */}
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">
              Información General
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Fecha de Apertura</label>
                <p className="font-medium">{caseData.openedAt ? new Date(caseData.openedAt).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Estado</label>
                <p className="font-medium">
                  <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                    caseData.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    caseData.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                    caseData.status === 'ASSIGNED' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {caseData.status}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Aseguradora</label>
                <p className="font-medium">{caseData.insurer?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Tipo de Servicio</label>
                <p className="font-medium">{caseData.serviceType || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Cliente */}
          {caseData.customer && (
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                Cliente
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Nombre</label>
                  <p className="font-medium">
                    {caseData.customer.firstName} {caseData.customer.lastName}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Teléfono</label>
                  <p className="font-medium">{caseData.customer.phone || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Vehículo */}
          {caseData.vehicle && (
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                Vehículo
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Marca/Modelo</label>
                  <p className="font-medium">
                    {caseData.vehicle.make} {caseData.vehicle.model}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Placa</label>
                  <p className="font-medium">{caseData.vehicle.plate || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Año</label>
                  <p className="font-medium">{caseData.vehicle.year || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Color</label>
                  <p className="font-medium">{caseData.vehicle.color || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Ubicaciones */}
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">
              Ubicaciones
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Origen</label>
                <p className="font-medium text-sm">
                  {caseData.originAddress || 'N/A'}
                  {caseData.originProvince && ` (${caseData.originProvince})`}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Destino</label>
                <p className="font-medium text-sm">
                  {caseData.destinationAddress || 'N/A'}
                  {caseData.destinationProvince && ` (${caseData.destinationProvince})`}
                </p>
              </div>
            </div>
          </div>

          {/* Precios */}
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">
              Información Financiera
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Precio Inicial</label>
                <p className="font-medium">
                  ${((caseData.priceInitialCents || 0) / 100).toFixed(2)}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Precio Final</label>
                <p className="font-medium">
                  ${((caseData.priceFinalCents || 0) / 100).toFixed(2)}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Monto Aseguradora</label>
                <p className="font-medium">
                  ${((caseData.insurerAmountCents || 0) / 100).toFixed(2)}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Exceso Cliente</label>
                <p className="font-medium">
                  ${((caseData.customerExcessCents || 0) / 100).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Asignación */}
          {caseData.assignedToUser && (
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                Asignación
              </h4>
              <div>
                <label className="text-sm text-gray-600">Asignado a</label>
                <p className="font-medium">{caseData.assignedToUser.name}</p>
              </div>
            </div>
          )}

          {/* Cobertura */}
          {caseData.coverageText && (
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                Cobertura
              </h4>
              <p className="text-sm text-gray-700">{caseData.coverageText}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
