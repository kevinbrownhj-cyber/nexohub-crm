import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardLayout } from './components/layouts/DashboardLayout';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { CasesListPage } from './pages/cases/CasesListPage';
import { CaseDetailPage } from './pages/cases/CaseDetailPage';
import { CreateCasePage } from './pages/cases/CreateCasePage';
import { BillingReadyPage } from './pages/billing/BillingReadyPage';
import { InvoicesListPage } from './pages/billing/InvoicesListPage';
import { InvoiceDetailPage } from './pages/billing/InvoiceDetailPage';
import { UsersListPage } from './pages/users/UsersListPage';
import { UsersPage } from './pages/users/UsersPage';
import { CustomersPage } from './pages/customers/CustomersPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { AuditLogPage } from './pages/audit/AuditLogPage';
import { NotificationProvider } from './contexts/NotificationContext';
import { Toaster } from 'react-hot-toast';
import { ConfirmDialog } from './components/ConfirmDialog';

function App() {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <BrowserRouter>
          <AuthProvider>
            <Toaster position="top-right" />
            <ConfirmDialog />
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              
              <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                
                <Route path="/cases" element={<CasesListPage />} />
                <Route path="/cases/new" element={<CreateCasePage />} />
                <Route path="/cases/:id" element={<CaseDetailPage />} />
                
                <Route path="/billing/ready" element={<BillingReadyPage />} />
                <Route path="/billing/invoices" element={<InvoicesListPage />} />
                <Route path="/billing/invoices/:id" element={<InvoiceDetailPage />} />
                
                <Route path="/users" element={<UsersListPage />} />
                <Route path="/team" element={<UsersPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/audit" element={<AuditLogPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;
