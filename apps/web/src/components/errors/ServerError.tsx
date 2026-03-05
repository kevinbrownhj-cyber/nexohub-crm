interface ServerErrorProps {
  error?: Error | any;
  onRetry?: () => void;
}

export function ServerError({ error, onRetry }: ServerErrorProps) {
  const errorMessage = error?.response?.data?.message || error?.message || 'Error desconocido';

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="text-6xl mb-4">⚠️</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Error del servidor
      </h2>
      <p className="text-gray-600 text-center mb-2 max-w-md">
        Ocurrió un error al procesar tu solicitud.
      </p>
      <p className="text-sm text-gray-500 text-center mb-6 max-w-md">
        {errorMessage}
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
