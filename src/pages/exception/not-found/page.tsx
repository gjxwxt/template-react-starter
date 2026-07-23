import React from 'react';
import { useNavigate } from 'react-router-dom';

import { TemplateException } from '../../../components/feedback';
import { resolveTemplateAssetPath, templateAppConfig } from '../../../app/config';
import { useAppContext } from '../../../app/providers';

const NotFoundPage: React.FC = () => {
  const { t } = useAppContext();
  const navigate = useNavigate();

  return (
    <TemplateException
      imageSrc={resolveTemplateAssetPath('png/404.png')}
      title={t.pages.notFound.title}
      subtitle={t.pages.notFound.subTitle}
      description={t.notFound}
      secondaryAction={{
        label: t.back,
        onClick: () => navigate(-1),
      }}
      primaryAction={{
        label: t.goHome,
        onClick: () => navigate(templateAppConfig.auth.homePath),
      }}
    />
  );
};

export default NotFoundPage;
