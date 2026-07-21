import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAppContext } from '../../../app/providers';
import { templateAppConfig } from '../../../app/config';
import { TemplateException } from '../../../components/feedback';

interface ServerErrorLocationState {
  fromPath?: string;
}

const ServerErrorPage: React.FC = () => {
  const { t } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const fromPath = (location.state as ServerErrorLocationState | null)?.fromPath;

  return (
    <TemplateException
      imageSrc="/png/500.png"
      title={t.pages.serverError.title}
      subtitle={t.pages.serverError.subTitle}
      description={t.serverError}
      secondaryAction={{
        label: t.goHome,
        onClick: () => navigate(templateAppConfig.auth.homePath),
      }}
      primaryAction={{
        label: t.retry,
        onClick: () => {
          if (fromPath) {
            navigate(fromPath, { replace: true });
            return;
          }

          navigate(templateAppConfig.auth.homePath, { replace: true });
        },
      }}
    />
  );
};

export default ServerErrorPage;
