interface NetworkErrorProps {
  onRetry?: () => void;
}

export function NetworkError({ onRetry }: NetworkErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="text-6xl mb-4">📡</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Sin conexión
      </h2>
      <p className="text-gray-600 text-center mb-6 max-w-md">
        No se pudo conectar al servidor. Por favor, verifica tu conexión a internet.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
