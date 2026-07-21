import React from 'react';

import { ProButton, ProEmpty } from '@gjxwxt/react-components';

interface TemplateSectionEmptyProps {
  actionLabel?: string;
  description: string;
  onAction?: () => void;
  title: string;
}

export const TemplateSectionEmpty: React.FC<TemplateSectionEmptyProps> = ({
  actionLabel,
  description,
  onAction,
  title,
}) => {
  return (
    <div className="template-section-empty">
      <ProEmpty description={null} />
      <div className="template-section-empty__content">
        <h3 className="template-section-empty__title">{title}</h3>
        <p className="template-section-empty__description">{description}</p>
        {actionLabel && onAction ? <ProButton onClick={onAction}>{actionLabel}</ProButton> : null}
      </div>
    </div>
  );
};
