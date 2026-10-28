import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { api } from '../../api/client';
import { UserProfile } from '../../api/types';
import { Loader2 } from 'lucide-react';

export const GovernmentGuard: React.FC = () => {
  const [checking, setChecking] = useState<boolean>(true);
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('civichelp_token');
    if (!token) {
      setAuthenticated(false);
      setChecking(false);
      return;
    }

    api.getProfile()
      .then((user) => {
        if (user && ['ADMIN', 'REVIEWER', 'DEPARTMENT_OPERATOR', 'FIELD_OFFICER', 'FINANCE_OFFICER', 'WHISTLEBLOWER_AUDITOR'].includes(user.role)) {
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
        }
      })
      .catch(() => {
        const cached = localStorage.getItem('civichelp_user');
        if (cached) {
          try {
            const user = JSON.parse(cached);
            if (user && ['ADMIN', 'REVIEWER', 'DEPARTMENT_OPERATOR', 'FIELD_OFFICER', 'FINANCE_OFFICER', 'WHISTLEBLOWER_AUDITOR'].includes(user.role)) {
              setAuthenticated(true);
              return;
            }
          } catch {}
        }
        api.logout();
        setAuthenticated(false);
      })
      .finally(() => {
        setChecking(false);
      });
  }, [location.pathname]);

  if (checking) {
    return (
      <div className="min-h-screen bg-night flex items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-civic-blue animate-spin" />
          <span className="text-xs font-mono text-text-muted uppercase tracking-wider">
            Verifying Government Operational Credentials...
          </span>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/government/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
