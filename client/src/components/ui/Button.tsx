import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--fn-accent)] text-white border border-transparent hover:bg-white hover:text-[#0A0A0A] hover:border-[var(--fn-accent)]',
  secondary:
    'bg-[var(--fn-elevated)] text-[var(--fn-text)] border border-[var(--fn-border)] hover:border-[var(--fn-text-tertiary)] hover:bg-[var(--fn-surface)]',
  ghost:
    'bg-transparent text-[var(--fn-text-secondary)] border border-transparent hover:text-[var(--fn-text)] hover:bg-[var(--fn-elevated)]',
  danger:
    'bg-transparent text-[var(--fn-error)] border border-[var(--fn-error)]/30 hover:bg-[var(--fn-error)] hover:text-white hover:border-[var(--fn-error)]',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-2.5 text-sm gap-2',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-medium rounded-[var(--fn-radius)]
        transition-all duration-200 ease-out cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-fn-spin h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
