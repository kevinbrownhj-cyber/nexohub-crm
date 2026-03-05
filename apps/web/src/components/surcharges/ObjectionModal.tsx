import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface ObjectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { amount: number; surcharge: number; reason: string }) => void;
  caseId: string;
  currentAmount: number;
  isSubmitting: boolean;
}

export function ObjectionModal({
  isOpen,
  onClose,
  onSubmit,
  caseId,
  currentAmount,
  isSubmitting,
}: ObjectionModalProps) {
  const [amount, setAmount] = useState(currentAmount.toString());
  const [surcharge, setSurcharge] = useState('0');
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      amount: parseFloat(amount),
      surcharge: parseFloat(surcharge),
      reason,
    });
  };

  const totalAmount = (parseFloat(amount) || 0) + (parseFloat(surcharge) || 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Crear Objeción</h3>
                <p className="text-sm text-gray-600 mt-1">Caso: {caseId}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isSubmitting}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Monto Objetado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto Objetado *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Monto actual: ${currentAmount.toLocaleString()}</p>
          </div>

          {/* Recargo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recargo Solicitado
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                value={surcharge}
                onChange={(e) => setSurcharge(e.target.value)}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Total */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-900">Total con Recargo:</span>
              <span className="text-lg font-bold text-blue-900">${totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Razón */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Razón de la Objeción *
            </label>
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
              placeholder="Describe el motivo de la objeción..."
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">Mínimo 10 caracteres</p>
          </div>

          {/* Info */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <strong>Nota:</strong> Esta objeción será enviada para revisión. El caso quedará en estado "Reclamado" hasta que sea aprobado o rechazado.
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason || reason.length < 10}
              className="flex items-center gap-2 px-6 py-2 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Enviando...
                </>
              ) : (
                'Crear Objeción'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
