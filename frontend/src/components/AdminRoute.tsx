import { Navigate } from 'react-router-dom';
import { getToken } from '../services/api';

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const token = getToken();
  if (!token) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}
