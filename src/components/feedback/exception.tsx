import React from 'react';

import { ProButton } from '@gjxwxt/react-components';

interface TemplateExceptionAction {
  label: string;
  onClick: () => void;
  type?: 'default' | 'primary';
}

interface TemplateExceptionProps {
  description: string;
  imageSrc: string;
  primaryAction?: TemplateExceptionAction;
  secondaryAction?: TemplateExceptionAction;
  subtitle: string;
  title: string;
}

export const TemplateException: React.FC<TemplateExceptionProps> = ({
  description,
  imageSrc,
  primaryAction,
  secondaryAction,
  subtitle,
  title,
}) => {
  return (
    <div className="template-exception">
      <div className="template-exception__inner">
        <img className="template-exception__image" src={imageSrc} alt={title} />
        <div className="template-exception__content">
          <h1 className="template-exception__title">{title}</h1>
          <p className="template-exception__subtitle">{subtitle}</p>
          <p className="template-exception__description">{description}</p>
          <div className="template-exception__actions">
            {secondaryAction ? (
              <ProButton onClick={secondaryAction.onClick}>{secondaryAction.label}</ProButton>
            ) : null}
            {primaryAction ? (
              <ProButton
                type={primaryAction.type === 'default' ? 'default' : 'primary'}
                onClick={primaryAction.onClick}
              >
                {primaryAction.label}
              </ProButton>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
