import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { templateAppConfig } from '../config';
import { useAppContext } from '../providers';
import { appRoutes, isRouteAllowed, type AppRouteId } from './routes';
import type { AppRole } from '../session';

interface ProtectedRouteProps {
  allowedRoles?: AppRole[];
  children: React.ReactElement;
  routeId?: AppRouteId;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  children,
  routeId,
}) => {
  const { session } = useAppContext();
  const location = useLocation();

  if (!session) {
    return (
      <Navigate to={templateAppConfig.auth.loginPath} replace state={{ from: location.pathname }} />
    );
  }

  const matchedRoute = routeId ? appRoutes.find((route) => route.id === routeId) : undefined;

  if (matchedRoute && !isRouteAllowed(matchedRoute, session)) {
    return <Navigate to={templateAppConfig.auth.forbiddenPath} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return <Navigate to={templateAppConfig.auth.forbiddenPath} replace />;
  }

  return children;
};
