import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "relative inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cosmos-950 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden active:scale-95 tracking-wide";
  
  const variants = {
    primary: "bg-gradient-to-r from-nebula-600 to-aurora-500 text-white shadow-lg shadow-nebula-900/20 hover:shadow-nebula-900/40 border border-white/10 hover:brightness-110 hover:-translate-y-0.5",
    secondary: "bg-cosmos-800 text-slate-200 border border-glass-border hover:bg-cosmos-700 hover:text-white shadow-md hover:shadow-lg hover:-translate-y-0.5",
    outline: "border border-glass-border bg-transparent hover:bg-white/5 text-slate-300 hover:text-white hover:border-white/20",
    ghost: "hover:bg-white/5 text-slate-400 hover:text-white",
    danger: "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      <span className="relative z-20 flex items-center gap-2">
        {isLoading ? (
          <>
            <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            处理中...
          </>
        ) : children}
      </span>
    </button>
  );
};