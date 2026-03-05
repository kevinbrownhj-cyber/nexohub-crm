import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Case } from '@/types';

interface TechnicianRejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseItem: Case | null;
  onSubmit: (amount: number, reason: string) => void;
}

export function TechnicianRejectionModal({
  isOpen,
  onClose,
  caseItem,
  onSubmit,
}: TechnicianRejectionModalProps) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<{ amount?: string; reason?: string }>({});

  if (!isOpen || !caseItem) return null;

  const baseAmount = (caseItem.priceBaseCents || 0) / 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: { amount?: string; reason?: string } = {};
    
    // Validar monto
    const amountNum = parseFloat(amount);
    if (!amount || amount.trim() === '') {
      newErrors.amount = 'El monto adicional es obligatorio';
    } else if (isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = 'El monto debe ser un número positivo';
    }
    
    // Validar justificación
    if (!reason || reason.trim() === '') {
      newErrors.reason = 'La justificación es obligatoria';
    } else if (reason.trim().length < 10) {
      newErrors.reason = 'La justificación debe tener al menos 10 caracteres';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Enviar datos
    onSubmit(amountNum, reason.trim());
    
    // Limpiar formulario
    setAmount('');
    setReason('');
    setErrors({});
  };

  const handleClose = () => {
    setAmount('');
    setReason('');
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-red-50">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-bold text-gray-900">
              🔥 OBJETAR TARIFA - CASO: {caseItem.externalId}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-6">
          <div className="mb-6">
            <p className="text-gray-700 mb-2">
              Estás rechazando la tarifa base de: <span className="font-bold text-lg">${baseAmount.toFixed(2)}</span>
            </p>
            <p className="text-gray-600 text-sm">
              Por favor, ingresa los detalles del gasto adicional.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6 space-y-6">
            {/* Monto Adicional */}
            <div>
              <label htmlFor="amount" className="block text-sm font-semibold text-gray-900 mb-2">
                Monto Adicional Solicitado (USD): <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                  $
                </span>
                <input
                  type="number"
                  id="amount"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (errors.amount) setErrors({ ...errors, amount: undefined });
                  }}
                  placeholder="0.00"
                  className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg ${
                    errors.amount ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.amount}
                </p>
              )}
            </div>

            {/* Justificación */}
            <div>
              <label htmlFor="reason" className="block text-sm font-semibold text-gray-900 mb-2">
                Justificación del Recargo: <span className="text-red-600">*</span>
              </label>
              <textarea
                id="reason"
                rows={5}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (errors.reason) setErrors({ ...errors, reason: undefined });
                }}
                placeholder="Ejemplo: Cobro de peaje en autopista Centenario ida y vuelta. Se adjunta recibo."
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none ${
                  errors.reason ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.reason && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.reason}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Mínimo 10 caracteres. Sé específico sobre el motivo del recargo.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 mt-6 pt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
            >
              <AlertCircle className="w-5 h-5" />
              🔥 Enviar Reclamo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
