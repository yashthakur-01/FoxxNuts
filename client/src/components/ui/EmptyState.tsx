import React from 'react';
import Button from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fn-fade-in">
      {icon && (
        <div className="mb-4 text-[var(--fn-text-tertiary)]">{icon}</div>
      )}
      <h3 className="text-base font-medium text-[var(--fn-text)] mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-[var(--fn-text-secondary)] max-w-sm mb-5">
          {description}
        </p>
      )}
      {action && (
        <Button variant="primary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
