import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { FolderOpen, DollarSign, FileText, TrendingUp, Users, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface DashboardStats {
  casesByStatus: Record<string, number>;
  pendingSurcharges: number;
  readyToInvoice: number;
  totalRevenue: number;
  totalCases: number;
  activeCases: number;
  completedCases: number;
  monthlyRevenue: number[];
}

export function DashboardPage() {
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/stats');
      return data;
    },
  });

  const COLORS = ['#1a4b91', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'];

  const statusTranslations: Record<string, string> = {
    'IMPORTED': 'Importado',
    'ASSIGNED': 'Asignado',
    'IN_PROGRESS': 'En Progreso',
    'COMPLETED': 'Completado',
    'PENDING_BILLING_REVIEW': 'Pendiente Revisión',
    'READY_TO_INVOICE': 'Listo para Facturar',
    'INVOICED': 'Facturado',
    'CLOSED': 'Cerrado',
  };

  const chartData = stats ? Object.entries(stats.casesByStatus).map(([name, value]) => ({
    name: statusTranslations[name] || name,
    value
  })) : [];

  const totalCases = stats ? Object.values(stats.casesByStatus).reduce((a, b) => a + b, 0) : 0;
  const activeCases = stats ? (stats.casesByStatus.ASSIGNED || 0) + (stats.casesByStatus.IN_PROGRESS || 0) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">
          Error cargando dashboard: {error instanceof Error ? error.message : 'Error desconocido'}
        </div>
      </div>
    );
  }

  const cards = [
    {
      title: 'Total de Casos',
      value: totalCases,
      icon: FolderOpen,
      iconBg: 'bg-navy-100',
      iconColor: 'text-navy-600',
      trend: '+12%',
      trendColor: 'text-green-500',
    },
    {
      title: 'Casos Activos',
      value: activeCases,
      icon: Users,
      iconBg: 'bg-gold-100',
      iconColor: 'text-gold-600',
      trend: 'En progreso',
      trendColor: 'text-slate-400',
    },
    {
      title: 'Listos para Facturar',
      value: stats?.readyToInvoice || 0,
      icon: FileText,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      trend: '+8%',
      trendColor: 'text-green-500',
    },
    {
      title: 'Recargos Pendientes',
      value: stats?.pendingSurcharges || 0,
      icon: AlertCircle,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      trend: 'Requiere atención',
      trendColor: 'text-amber-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panel Principal</h1>
          <p className="text-gray-600 mt-1">Resumen general del sistema</p>
        </div>
        <div className="text-sm text-gray-500">
          Última actualización: Hoy, {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 text-sm font-medium">{card.title}</h3>
                <div className={`${card.iconBg} ${card.iconColor} p-2 rounded-lg`}>
                  <Icon size={20} />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-800">{card.value}</p>
              <span className={`text-xs ${card.trendColor} font-medium mt-1 flex items-center gap-1`}>
                {card.trend.includes('+') && <TrendingUp size={12} />}
                {card.trend}
              </span>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Casos por Estado</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 12}} 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}} 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Distribución de Casos</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Revenue Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white/80 text-sm font-medium mb-2">Ingresos Totales</h3>
            <p className="text-4xl font-bold">${(stats?.totalRevenue || 0).toLocaleString()}</p>
            <span className="text-sm text-white/80 mt-2 inline-flex items-center gap-1">
              <TrendingUp size={14} />
              +15% vs mes anterior
            </span>
          </div>
          <div className="bg-white/20 p-4 rounded-lg">
            <DollarSign size={32} />
          </div>
        </div>
      </div>
    </div>
  );
}
