import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <Skeleton height={20} width="60%" />
            <Skeleton height={32} width="40%" className="mt-2" />
            <Skeleton height={16} width="50%" className="mt-2" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <Skeleton height={24} width="40%" className="mb-4" />
            <Skeleton height={200} />
          </div>
        ))}
      </div>
    </div>
  );
}
