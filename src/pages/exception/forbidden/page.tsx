import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useAppContext } from '../../../app/providers';
import { templateAppConfig } from '../../../app/config';
import { TemplateResult } from '../../../components/feedback';

const ForbiddenPage: React.FC = () => {
  const { t } = useAppContext();
  const navigate = useNavigate();

  return (
    <div className="template-status-page">
      <TemplateResult
        code="403"
        title={t.pages.forbidden.title}
        subtitle={t.pages.forbidden.subTitle}
        body={t.noPermission}
        primaryAction={{
          label: t.goHome,
          onClick: () => navigate(templateAppConfig.auth.homePath),
        }}
      />
    </div>
  );
};

export default ForbiddenPage;
