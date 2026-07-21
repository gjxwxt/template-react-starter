import React from 'react';

import { ProButton, ProCard } from '@gjxwxt/react-components';

interface TemplateResultAction {
  label: string;
  onClick: () => void;
  type?: 'default' | 'primary';
}

interface TemplateResultProps {
  body: string;
  code: string;
  primaryAction?: TemplateResultAction;
  secondaryAction?: TemplateResultAction;
  subtitle: string;
  title: string;
}

export const TemplateResult: React.FC<TemplateResultProps> = ({
  body,
  code,
  primaryAction,
  secondaryAction,
  subtitle,
  title,
}) => {
  return (
    <ProCard shadow="never">
      <div className="template-result">
        <div className="template-result__code">{code}</div>
        <div className="template-result__content">
          <h2 className="template-result__title">{title}</h2>
          <p className="template-result__subtitle">{subtitle}</p>
          <p className="template-result__body">{body}</p>
          <div className="template-result__actions">
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
    </ProCard>
  );
};
