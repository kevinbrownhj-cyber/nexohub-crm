import { useNavigate } from 'react-router-dom';

export function SessionExpired() {
  const navigate = useNavigate();

  const handleLogin = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="text-6xl mb-4">🔒</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Sesión expirada
      </h2>
      <p className="text-gray-600 text-center mb-6 max-w-md">
        Tu sesión ha expirado por seguridad. Por favor, inicia sesión nuevamente.
      </p>
      <button
        onClick={handleLogin}
        className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
      >
        Iniciar sesión
      </button>
    </div>
  );
}
