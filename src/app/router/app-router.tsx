import React from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';

import { subscribeNavigation } from '../navigation';
import { templateAppConfig } from '../config';
import { appRoutes } from './routes';
import { ProtectedRoute } from './protected-route';
import { AppShell } from '../../layouts/app-shell';
import ForbiddenPage from '../../pages/exception/forbidden';
import LoginPage from '../../pages/auth/login';
import NotFoundPage from '../../pages/exception/not-found';
import ServerErrorPage from '../../pages/exception/server-error';

const NavigationWatcher: React.FC = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    return subscribeNavigation(({ path, replace, state }) => {
      navigate(path, {
        replace: replace !== false,
        state,
      });
    });
  }, [navigate]);

  return null;
};

export const AppRouter: React.FC = () => {
  return (
    <>
      <NavigationWatcher />
      <Routes>
        <Route path={templateAppConfig.auth.loginPath} element={<LoginPage />} />
        <Route path={templateAppConfig.auth.forbiddenPath} element={<ForbiddenPage />} />
        <Route path={templateAppConfig.auth.notFoundPath} element={<NotFoundPage />} />
        <Route path={templateAppConfig.auth.serverErrorPath} element={<ServerErrorPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to={templateAppConfig.auth.homePath} replace />} />
          {appRoutes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={
                <ProtectedRoute allowedRoles={route.roles} routeId={route.id}>
                  {route.element}
                </ProtectedRoute>
              }
            />
          ))}
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
};
