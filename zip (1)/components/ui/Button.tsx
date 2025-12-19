import React from 'react';
import { motion } from 'framer-motion';

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
  const baseStyles = "relative inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cosmos-950 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group";
  
  const variants = {
    // 蓝紫渐变，带内部高光
    primary: "bg-gradient-to-r from-nebula-600 to-aurora-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] border border-white/10 hover:border-white/20",
    // 深色玻璃态
    secondary: "bg-cosmos-800 text-slate-200 border border-glass-border hover:bg-cosmos-700 hover:text-white shadow-lg",
    // 描边
    outline: "border border-glass-border bg-transparent hover:bg-white/5 text-slate-300 hover:text-white",
    ghost: "hover:bg-white/5 text-slate-400 hover:text-white",
    danger: "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
  };

  return (
    <motion.button 
      whileHover={{ scale: props.disabled ? 1 : 1.02 }}
      whileTap={{ scale: props.disabled ? 1 : 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {/* Shimmer Effect for Primary */}
      {variant === 'primary' && !props.disabled && (
        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-10" />
      )}

      <span className="relative z-20 flex items-center gap-2">
        {isLoading ? (
          <>
            <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </>
        ) : children}
      </span>
    </motion.button>
  );
};