import { useState } from 'react';
import { X } from 'lucide-react';

interface ObjectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    requestedAmountCents: number;
    requestedSurchargeCents: number;
    reason: string;
  }) => void;
  currentAmount: number;
  currentSurcharge: number;
}

export function ObjectionModal({
  isOpen,
  onClose,
  onSubmit,
  currentAmount,
  currentSurcharge
}: ObjectionModalProps) {
  const [requestedAmount, setRequestedAmount] = useState(currentAmount / 100);
  const [requestedSurcharge, setRequestedSurcharge] = useState(currentSurcharge / 100);
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const newErrors: string[] = [];

    if (!requestedAmount || requestedAmount < 0) {
      newErrors.push('El monto solicitado debe ser mayor a 0');
    }

    if (requestedSurcharge < 0) {
      newErrors.push('El recargo no puede ser negativo');
    }

    if (!reason || reason.trim().length < 10) {
      newErrors.push('El motivo debe tener al menos 10 caracteres');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      requestedAmountCents: Math.round(requestedAmount * 100),
      requestedSurchargeCents: Math.round(requestedSurcharge * 100),
      reason: reason.trim()
    });

    // Reset form
    setRequestedAmount(currentAmount / 100);
    setRequestedSurcharge(currentSurcharge / 100);
    setReason('');
    setErrors([]);
  };

  const handleClose = () => {
    setRequestedAmount(currentAmount / 100);
    setRequestedSurcharge(currentSurcharge / 100);
    setReason('');
    setErrors([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Registrar Objeción</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <ul className="list-disc list-inside text-sm text-red-600">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto Solicitado ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={requestedAmount}
                onChange={(e) => setRequestedAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recargo ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={requestedSurcharge}
                onChange={(e) => setRequestedSurcharge(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo de la Objeción
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="Describa el motivo..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Mínimo 10 caracteres ({reason.length}/10)
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Confirmar Objeción
          </button>
        </div>
      </div>
    </div>
  );
}
